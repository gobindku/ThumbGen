import { useState, useRef } from 'react';

export default function VideoDownloader({ onVideoDownloaded, isLoading }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const supportedSites = [
    { name: 'Direct Links', examples: ['.mp4', '.webm', '.mov'], description: 'Any direct video URL' },
    { name: 'Google Drive', description: 'Share links (need to be public)' },
    { name: 'Dropbox', description: 'Direct download links' },
    { name: 'OneDrive', description: 'Direct download links' },
    { name: 'Other Hosting', description: 'Any accessible video URL' },
  ];

  const handleDownload = async (e) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }

    setError(null);
    setDownloading(true);
    setProgress(0);
    setVideoInfo(null);

    try {
      // First, validate the URL and get video info
      const validateResponse = await fetch('/api/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: videoUrl.trim(),
          validateOnly: true 
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validateData.error || 'Failed to validate video URL');
        setDownloading(false);
        return;
      }

      setVideoInfo({
        url: validateData.videoUrl,
        name: validateData.fileName || 'downloaded-video',
        size: validateData.fileSize,
        type: validateData.contentType,
      });
      setProgress(20);

      // Now download the video through our proxy (streaming)
      const downloadResponse = await fetch('/api/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: videoUrl.trim(),
          download: true 
        }),
      });

      if (!downloadResponse.ok) {
        let errorText = 'Failed to download video';
        try {
          const errorData = await downloadResponse.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          // ignore
        }
        setError(errorText);
        setDownloading(false);
        return;
      }

      // Stream the response body to build a blob while tracking progress
      const contentLength = downloadResponse.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = downloadResponse.body?.getReader();
      const chunks = [];
      let received = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length || value.byteLength || 0;
          if (total) {
            // Map progress from 20 -> 90 during download
            const pct = Math.round((received / total) * 70);
            setProgress(Math.min(90, 20 + pct));
          } else {
            setProgress(prev => Math.min(90, prev + 3));
          }
        }
      } else {
        // Fallback for environments without readable stream support
        const blobFallback = await downloadResponse.blob();
        chunks.push(await blobFallback.arrayBuffer());
      }

      const mime = downloadResponse.headers.get('content-type') || 'video/mp4';
      const blob = new Blob(chunks, { type: mime });
      setProgress(95);

      // Create object URL
      const objectUrl = URL.createObjectURL(blob);
      
      // Get video duration
      const video = document.createElement('video');
      video.src = objectUrl;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          setVideoInfo(prev => ({
            ...prev,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            blob: blob,
            url: objectUrl,
          }));
          resolve();
        };
      });

      setProgress(100);

      // Notify parent component
      onVideoDownloaded?.({
        name: validateData.fileName || 'downloaded-video.mp4',
        blob: blob,
        url: objectUrl,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: blob.size,
      });

      // Clear input after successful download
      setVideoUrl('');

    } catch (error) {
      console.error('Download error:', error);
      setError('Error downloading video: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleClear = () => {
    if (videoInfo?.url && videoInfo.url.startsWith('blob:')) {
      URL.revokeObjectURL(videoInfo.url);
    }
    setVideoInfo(null);
    setVideoUrl('');
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return (mb / 1024).toFixed(1) + ' GB';
    }
    return mb.toFixed(1) + ' MB';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">⬇️ Download Video from URL</h2>
      <p className="text-gray-600 mb-4">
        Enter a video URL to download it directly. The downloaded video can be used for frame extraction or short video generation.
      </p>

      {/* Download Form */}
      <form onSubmit={handleDownload} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://example.com/video.mp4"
          className="input w-full mb-2"
          disabled={downloading || isLoading}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={downloading || isLoading || !videoUrl.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1"
          >
            {downloading ? 'Downloading...' : 'Download Video'}
          </button>
          
          {videoInfo && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Progress */}
      {downloading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-1">
            {progress < 50 ? 'Validating URL...' : 
             progress < 80 ? 'Downloading video...' : 
             'Processing video...'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Video Info */}
      {videoInfo && !downloading && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-900">✅ Video Downloaded Successfully!</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Name:</span> {videoInfo.name}</div>
            <div><span className="text-gray-500">Size:</span> {formatSize(videoInfo.size)}</div>
            <div><span className="text-gray-500">Duration:</span> {formatDuration(videoInfo.duration)}</div>
            <div><span className="text-gray-500">Resolution:</span> {videoInfo.width}x{videoInfo.height}</div>
          </div>
        </div>
      )}

      {/* Help / Supported Sites */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
        >
          {showHelp ? '▼' : '▶'} Supported Video Sources
        </button>

        {showHelp && (
          <div className="mt-3 space-y-2">
            {supportedSites.map((site, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="font-medium text-sm text-gray-800">{site.name}</p>
                <p className="text-xs text-gray-500">{site.description}</p>
                {site.examples && (
                  <p className="text-xs text-gray-400 mt-1">Example: {site.examples.join(', ')}</p>
                )}
              </div>
            ))}
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-medium text-sm text-yellow-800">💡 Tips</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• Make sure the video URL is publicly accessible</li>
                <li>• For Google Drive, use a "Anyone with link" share</li>
                <li>• Direct download links work best</li>
                <li>• Large videos may take time to download</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {downloading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Downloading video from URL...</p>
        </div>
      )}
    </div>
  );
}
