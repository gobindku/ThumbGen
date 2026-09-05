// File: pages/api/extract-video.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL required' });
    }

    // Handle YouTube URLs
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractYouTubeId(videoUrl);
      
      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      // Use YouTube proxy to get video info
      const proxyUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        // Return YouTube info with proxy thumbnail URL
        return res.status(200).json({
          success: true,
          type: 'youtube',
          videoId: videoId,
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          proxyUrl: `https://www.youtube.com/embed/${videoId}`,
          message: 'YouTube videos can be extracted using the embedded player. For best results, use direct video file links (MP4, WebM).',
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          type: 'youtube',
          error: 'Could not retrieve YouTube video info',
          message: 'Try using a direct video file URL instead (MP4 or WebM format)',
        });
      }
    }

    // For other URLs, validate format and check if accessible
    try {
      new URL(videoUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const response = await fetch(videoUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      return res.status(200).json({
        success: true,
        type: 'direct',
        videoUrl: videoUrl,
        message: 'Video URL is valid',
      });
    } else {
      return res.status(400).json({
        error: 'Video URL is not accessible',
        details: response.statusText,
      });
    }
  } catch (error) {
    console.error('Video extraction error:', error);
    return res.status(500).json({
      error: 'Failed to process video URL',
      details: error.message,
    });
  }
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
