export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoUrl, validateOnly, download } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL required' });
    }

    // Validate URL
    let url;
    try {
      url = new URL(videoUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Common video extensions
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.flv', '.wmv'];
    const isVideoExtension = videoExtensions.some(ext => 
      videoUrl.toLowerCase().includes(ext)
    );

    // Set up headers for request
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'video/*,*/*',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    // Handle Google Drive URLs
    if (videoUrl.includes('drive.google.com') || videoUrl.includes('dropbox.com') || videoUrl.includes('onedrive.live.com')) {
      const result = await handleThirdPartyDownload(videoUrl, url, validateOnly);
      if (result.error) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    }

    // For validation only - just check if URL is accessible
    if (validateOnly) {
      try {
        const headResponse = await fetch(videoUrl, {
          method: 'HEAD',
          headers: requestHeaders,
        });

        if (!headResponse.ok && headResponse.status !== 206) {
          return res.status(400).json({ 
            error: 'Video URL is not accessible',
            details: headResponse.statusText,
          });
        }

        const contentType = headResponse.headers.get('content-type') || 'video/mp4';
        const contentLength = headResponse.headers.get('content-length');
        
        // Try to extract filename from URL
        const urlPathname = url.pathname;
        const fileName = urlPathname.substring(urlPathname.lastIndexOf('/') + 1) || 'video.mp4';

        return res.status(200).json({
          success: true,
          videoUrl: videoUrl,
          fileName: fileName,
          fileSize: contentLength ? parseInt(contentLength) : null,
          contentType: contentType,
          message: 'Video URL is valid',
        });
      } catch (fetchError) {
        return res.status(400).json({ 
          error: 'Failed to access video URL',
          details: fetchError.message,
        });
      }
    }

    // For actual download - stream the video (proxy) to the client
    if (download) {
      try {
        // Use native http/https to pipe the remote response directly to the client.
        const lib = url.protocol === 'https:' ? (await import('https')) : (await import('http'));
        const clientRequest = lib.get(videoUrl, { headers: requestHeaders }, (remoteRes) => {
          const statusCode = remoteRes.statusCode || 0;
          if (statusCode >= 400) {
            res.status(400).json({ error: 'Failed to download video', details: `Remote server returned ${statusCode}` });
            remoteRes.resume();
            return;
          }

          // Forward important headers
          const contentType = remoteRes.headers['content-type'] || 'video/mp4';
          const contentLength = remoteRes.headers['content-length'];
          const disposition = remoteRes.headers['content-disposition'];

          let fileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1) || 'video.mp4';
          if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^;"']+)/);
            if (match) {
              try { fileName = decodeURIComponent(match[1]); } catch (e) { fileName = match[1]; }
            }
          }

          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          if (contentLength) res.setHeader('Content-Length', contentLength);

          // Pipe remote response to client response (efficient, avoids buffering)
          remoteRes.pipe(res);
          remoteRes.on('end', () => res.end());
        });

        clientRequest.on('error', (err) => {
          console.error('Proxy request error:', err);
          if (!res.headersSent) {
            res.status(502).json({ error: 'Failed to fetch remote video', details: err.message });
          } else {
            try { res.end(); } catch (e) {}
          }
        });

        // Let the route remain open while piping happens
        return;
      } catch (err) {
        return res.status(400).json({ error: 'Failed to download video', details: err.message });
      }
    }

    return res.status(400).json({ error: 'Invalid request parameters' });

  } catch (error) {
    console.error('Video download error:', error);
    return res.status(500).json({
      error: 'Failed to process video URL',
      details: error.message,
    });
  }
}

// Handle third-party downloads (Google Drive, Dropbox, etc.)
async function handleThirdPartyDownload(videoUrl, url, validateOnly) {
  try {
    let downloadUrl = videoUrl;
    let fileName = 'video.mp4';

    // Google Drive
    if (videoUrl.includes('drive.google.com')) {
      const match = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const fileId = match[1];
        // Use export URL for Google Drive
        downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
      }
      fileName = 'google-drive-video.mp4';
    }
    // Dropbox
    else if (videoUrl.includes('dropbox.com')) {
      // Convert to direct download link
      downloadUrl = videoUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      downloadUrl = downloadUrl.replace('?dl=0', '');
      fileName = 'dropbox-video.mp4';
    }
    // OneDrive
    else if (videoUrl.includes('onedrive.live.com')) {
      // OneDrive requires authentication usually, but try direct link
      fileName = 'onedrive-video.mp4';
    }

    if (validateOnly) {
      return {
        success: true,
        videoUrl: downloadUrl,
        fileName: fileName,
        message: 'Third-party URL detected',
      };
    }

    return {
      success: true,
      videoUrl: downloadUrl,
      fileName: fileName,
      message: 'Use direct URL for third-party videos',
    };
  } catch (error) {
    return {
      error: 'Failed to process third-party URL',
      details: error.message,
    };
  }
}
