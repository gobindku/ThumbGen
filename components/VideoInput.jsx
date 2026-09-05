// File: components/VideoInput.jsx
import { useRef, useState } from 'react';

export default function VideoInput({ onFramesExtracted, isLoading }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [showSamples, setShowSamples] = useState(false);

  const sampleVideos = [
    {
      name: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
      description: 'Free sample video (9 MB)',
    },
    {
      name: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
      description: 'Free sample video (54 MB)',
    },
    {
      name: 'Sintel',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/Sintel.mp4',
      description: 'Free sample video (130 MB)',
    },
  ];

  const handleValidateUrl = async (e) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }

    setExtracting(true);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/extract-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      });

      const data = await response.json();

      if (data.type === 'youtube') {
        setVideoInfo({
          type: 'youtube',
          videoId: data.videoId,
          title: data.title,
          thumbnail: data.thumbnail,
        });
        setExtracting(false);
        alert('YouTube videos have CORS restrictions.\n\nInstead, try:\n1. Download the video and upload it\n2. Use one of the sample videos below\n3. Upload a local video file');
        return;
      }

      if (data.success) {
        // Proceed with frame extraction
        await extractFramesFromSource(videoUrl.trim(), false);
      } else {
        alert(data.error || 'Invalid video URL');
        setExtracting(false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Error validating video URL');
      setExtracting(false);
    }
  };

  const extractFramesFromSource = async (src, isObjectUrl = false) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      alert('Video player not initialized. Please refresh and try again.');
      setExtracting(false);
      return;
    }

    const frames = [];
    const frameCount = 10;
    let currentFrame = 0;

    // Set up the cleanup function
    const cleanup = () => {
      setExtracting(false);
      setVideoUrl('');
      setVideoFile(null);
      setVideoInfo(null);
      if (isObjectUrl) {
        URL.revokeObjectURL(src);
      }
    };

    // Set up error handler
    video.onerror = (err) => {
      console.error('Video load error:', err);
      alert('Failed to load video. The file format may not be supported by your browser.');
      cleanup();
    };

    // Set up metadata handler
    video.onloadedmetadata = () => {
      const duration = video.duration;
      
      // Validate duration
      if (!duration || duration === Infinity || isNaN(duration) || duration <= 0) {
        alert('Could not read video duration. The video file may be corrupted or unsupported.');
        cleanup();
        return;
      }

      const frameInterval = duration / frameCount;

      // Function to extract a single frame
      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          // Done! Return frames
          if (frames.length > 0) {
            onFramesExtracted(frames);
          } else {
            alert('No frames could be extracted from the video.');
          }
          cleanup();
          return;
        }

        // Seek to the next frame position
        video.currentTime = currentFrame * frameInterval;
      };

      // Handle seek completion
      video.onseeked = () => {
        // Draw the current frame to canvas
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Make sure video is ready
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.85);
          
          frames.push({
            id: `frame-${currentFrame + 1}`,
            imageData: imageData,
            timestamp: currentFrame * frameInterval,
          });
        }
        
        currentFrame++;
        
        // Continue to next frame
        if (currentFrame < frameCount) {
          extractFrame();
        } else {
          // Done! Return frames
          if (frames.length > 0) {
            onFramesExtracted(frames);
          } else {
            alert('No frames could be extracted from the video.');
          }
          cleanup();
        }
      };

      // Start extracting the first frame
      extractFrame();
    };

    // Load the video
    try {
      video.src = src;
      video.load();
    } catch (error) {
      console.error('Error loading video:', error);
      alert('Error loading video: ' + error.message);
      cleanup();
    }
  };

  const handleVideoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM, etc.).');
      return;
    }

    setVideoFile(file);
    setExtracting(true);
    setVideoInfo(null);

    const objectUrl = URL.createObjectURL(file);
    await extractFramesFromSource(objectUrl, true);
  };

  const useSampleVideo = async (url) => {
    setVideoUrl(url);
    setExtracting(true);
    setVideoInfo(null);
    await extractFramesFromSource(url, false);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Or Extract Frames from Video</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Video File (MP4, WebM, etc.)
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoFileChange}
          disabled={extracting || isLoading}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 Direct upload is the most reliable method for extracting frames from a video.
        </p>
      </div>

      <form onSubmit={handleValidateUrl} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL (MP4, WebM, etc.)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="input flex-1"
            disabled={extracting || isLoading}
          />
          <button
            type="submit"
            disabled={extracting || isLoading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {extracting ? 'Extracting...' : 'Extract 10 Frames'}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          💡 Use a URL only if the video is directly accessible. YouTube links often fail due to browser CORS restrictions.
        </p>
      </form>

      {/* YouTube Info */}
      {videoInfo?.type === 'youtube' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">YouTube Video Detected ⚠️</h3>
          <p className="text-sm text-yellow-800 mb-3">{videoInfo.title}</p>
          <p className="text-xs text-yellow-700 mb-3">
            YouTube blocks direct video access from browsers (CORS restrictions). Try these alternatives:
          </p>
          <ul className="text-xs text-yellow-700 space-y-1 mb-3">
            <li>✓ Use the sample videos below</li>
            <li>✓ Record your screen and upload the video file</li>
            <li>✓ Download the YouTube video and upload it</li>
            <li>✓ Use a direct MP4/WebM link instead</li>
          </ul>
        </div>
      )}

      {/* Sample Videos */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowSamples(!showSamples)}
          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
        >
          {showSamples ? '▼' : '▶'} Try Sample Videos (No YouTube CORS issues)
        </button>

        {showSamples && (
          <div className="mt-3 space-y-2">
            {sampleVideos.map((video, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm text-gray-800">{video.name}</p>
                  <p className="text-xs text-gray-500">{video.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => useSampleVideo(video.url)}
                  className="btn btn-secondary text-xs"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden video and canvas elements for frame extraction */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {extracting && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Extracting frames from video...</p>
        </div>
      )}
    </div>
  );
}
