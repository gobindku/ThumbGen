// File: components/VideoShortGenerator.jsx
import { useRef, useState, useCallback } from 'react';

export default function VideoShortGenerator({ onShortsGenerated, isLoading }) {
  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioDestRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generatedShorts, setGeneratedShorts] = useState([]);
  const [videoInfo, setVideoInfo] = useState(null);
  const [previewingShort, setPreviewingShort] = useState(null);
  const [previewMode, setPreviewMode] = useState('original'); // 'original' | 'recorded'

  const [shortDuration, setShortDuration] = useState(30); // Default 30 seconds, user editable
  const NUM_SHORTS = 10;

  const handleDurationChange = (newVal) => {
    setShortDuration(newVal);
    setGeneratedShorts([]);
  };

  const handleVideoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM, etc.).');
      return;
    }

    // Clean up previous URLs
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    audioSourceRef.current = null;
    audioDestRef.current = null;

    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setVideoFile(file);
    setGeneratedShorts([]);

    // Create temporary video element to get metadata
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      setVideoDuration(duration);
      setVideoInfo({
        name: file.name,
        size: file.size,
        duration: duration,
        width: tempVideo.videoWidth,
        height: tempVideo.videoHeight,
      });
    };
  };

  // Initialize Web Audio API to capture voice/audio track silently from the video element
  const setupAudioContext = (videoElement) => {
    if (!videoElement) return null;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      if (ctx && !audioSourceRef.current) {
        const source = ctx.createMediaElementSource(videoElement);
        const dest = ctx.createMediaStreamDestination();
        source.connect(dest);
        audioSourceRef.current = source;
        audioDestRef.current = dest;
      }

      return audioDestRef.current ? audioDestRef.current.stream : null;
    } catch (err) {
      console.warn('AudioContext setup warning:', err);
      return null;
    }
  };

  // Capture a single short segment with voice/audio
  const captureShortSegment = async (video, canvas, startTime, duration, audioStream) => {
    // Select fast hardware-accelerated MIME type (VP8/H264 encode 5x faster than VP9 without lag)
    let mimeType = '';
    const mimeCandidates = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/webm',
      'video/mp4',
    ];

    if (typeof MediaRecorder !== 'undefined') {
      for (const cand of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(cand)) {
          mimeType = cand;
          break;
        }
      }
    }

    // 1. Extract audio track from Web Audio stream or video element
    let audioTrack = null;
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      audioTrack = audioStream.getAudioTracks()[0];
    }

    // 2. Try native video stream directly from video decoder for maximum smoothness
    let videoTrack = null;
    let isNative = false;

    if (typeof video.captureStream === 'function') {
      try {
        const stream = video.captureStream();
        if (stream && stream.getVideoTracks().length > 0) {
          videoTrack = stream.getVideoTracks()[0];
          isNative = true;
        }
        if (!audioTrack && stream && stream.getAudioTracks().length > 0) {
          audioTrack = stream.getAudioTracks()[0];
        }
      } catch (e) {
        console.warn('Native video captureStream failed:', e);
      }
    } else if (typeof video.mozCaptureStream === 'function') {
      try {
        const stream = video.mozCaptureStream();
        if (stream && stream.getVideoTracks().length > 0) {
          videoTrack = stream.getVideoTracks()[0];
          isNative = true;
        }
        if (!audioTrack && stream && stream.getAudioTracks().length > 0) {
          audioTrack = stream.getAudioTracks()[0];
        }
      } catch (e) {
        console.warn('Native video mozCaptureStream failed:', e);
      }
    }

    // Fall back to canvas stream ONLY if native video track is not available
    if (!videoTrack) {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const canvasStream = canvas.captureStream(30);
      if (canvasStream && canvasStream.getVideoTracks().length > 0) {
        videoTrack = canvasStream.getVideoTracks()[0];
      }
    }

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);

    const combinedStream = new MediaStream(tracks);

    // Optimized bitrate (2.5 Mbps) for hardware encoding without dropping frames
    const options = mimeType
      ? { mimeType, videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 }
      : { videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 };

    const recorder = new MediaRecorder(combinedStream, options);
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const endTime = Math.min(startTime + duration, video.duration || startTime + duration);

    return new Promise((resolve, reject) => {
      let animFrameId = null;
      let callbackId = null;

      const cleanup = () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (callbackId && typeof video.cancelVideoFrameCallback === 'function') {
          video.cancelVideoFrameCallback(callbackId);
        }
        video.pause();
      };

      recorder.onstop = () => {
        cleanup();
        const finalMime = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          hasAudio: !!audioTrack,
        });
      };

      recorder.onerror = (e) => {
        cleanup();
        reject(e);
      };

      // Seek to segment start
      const onSeeked = async () => {
        video.removeEventListener('seeked', onSeeked);

        // Ensure video plays at 1.0x speed with unmuted volume
        video.muted = false;
        video.volume = 1.0;
        video.playbackRate = 1.0;

        try {
          await video.play();
        } catch (playErr) {
          console.warn('Playback error during capture:', playErr);
        }

        recorder.start(500); // 500ms cluster slice for proper WebM headers

        const renderLoop = () => {
          if (video.currentTime >= endTime || video.ended || video.paused) {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          // Only draw to canvas if fallback canvas mode is active (avoid double GPU overhead for native capture)
          if (!isNative) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          if (typeof video.requestVideoFrameCallback === 'function') {
            callbackId = video.requestVideoFrameCallback(renderLoop);
          } else {
            animFrameId = requestAnimationFrame(renderLoop);
          }
        };

        renderLoop();
      };

      video.addEventListener('seeked', onSeeked);
      video.currentTime = startTime;
    });
  };

  // Generate a single short clip by index
  const generateSingleShort = async (index) => {
    if (!videoRef.current || !shortDuration) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    setProcessing(true);
    setProcessingIndex(index);

    try {
      const audioStream = setupAudioContext(video);
      const startTime = (index - 1) * shortDuration;
      const result = await captureShortSegment(video, canvas, startTime, shortDuration, audioStream);

      const newShort = {
        id: `short-${index}`,
        index: index,
        startTime: startTime,
        endTime: startTime + shortDuration,
        duration: shortDuration,
        blob: result.blob,
        url: result.url,
        hasAudio: result.hasAudio,
      };

      setGeneratedShorts((prev) => {
        const filtered = prev.filter((s) => s.index !== index);
        return [...filtered, newShort].sort((a, b) => a.index - b.index);
      });
    } catch (err) {
      console.error('Single short generation error:', err);
      alert(`Failed to generate Short #${index}: ` + err.message);
    } finally {
      setProcessing(false);
      setProcessingIndex(null);
    }
  };

  // Generate short videos sequentially with voice
  const generateAllShorts = useCallback(async () => {
    if (!videoRef.current || !shortDuration) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    setProcessing(true);
    setProgress(0);
    setGeneratedShorts([]);

    const shorts = [];
    const maxShorts = Math.min(NUM_SHORTS, Math.floor(videoDuration / shortDuration));

    if (maxShorts < 1) {
      alert(`Video must be at least ${shortDuration} seconds long to generate a short.`);
      setProcessing(false);
      return;
    }

    try {
      const audioStream = setupAudioContext(video);

      for (let i = 0; i < maxShorts; i++) {
        setProcessingIndex(i + 1);
        const startTime = i * shortDuration;

        const result = await captureShortSegment(video, canvas, startTime, shortDuration, audioStream);

        const shortObj = {
          id: `short-${i + 1}`,
          index: i + 1,
          startTime: startTime,
          endTime: startTime + shortDuration,
          duration: shortDuration,
          blob: result.blob,
          url: result.url,
          hasAudio: result.hasAudio,
        };

        shorts.push(shortObj);
        setGeneratedShorts([...shorts]);
        setProgress(((i + 1) / maxShorts) * 100);
      }

      onShortsGenerated?.(shorts);
    } catch (error) {
      console.error('Error generating shorts:', error);
      alert('Error generating short videos: ' + error.message);
    } finally {
      setProcessing(false);
      setProcessingIndex(null);
    }
  }, [videoDuration, shortDuration, onShortsGenerated]);

  const downloadShort = (short) => {
    if (!short.url) return;
    const a = document.createElement('a');
    a.href = short.url;
    a.download = `short-${short.index}_${short.startTime}s-${short.endTime}s.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    generatedShorts.forEach((short) => {
      downloadShort(short);
    });
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">🎬 Create Short Videos with Voice</h2>
      <p className="text-gray-600 mb-4">
        Upload a video to extract custom-duration shorts (with full audio & voice included) formatted for YouTube Shorts, Instagram Reels & TikTok.
      </p>

      {/* Short Duration User Input & Presets */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          ⏱️ Short Clip Duration (Seconds)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={180}
              value={shortDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  handleDurationChange(val);
                } else if (e.target.value === '') {
                  handleDurationChange('');
                }
              }}
              onBlur={() => {
                if (!shortDuration || shortDuration < 5) handleDurationChange(5);
              }}
              disabled={processing || isLoading}
              className="input w-28 text-center font-bold text-lg bg-white border border-gray-300 rounded-md py-1 px-2"
              placeholder="30"
            />
            <span className="text-sm font-medium text-gray-600">seconds per short</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Quick Presets:</span>
            {[15, 30, 45, 60].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleDurationChange(preset)}
                disabled={processing || isLoading}
                className={`px-3 py-1 text-xs rounded-full font-semibold transition-all ${
                  shortDuration === preset
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {preset}s
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Set custom length per clip (e.g., 15s for Shorts/TikTok, 30s for Reels, 60s for full Shorts).
        </p>
      </div>

      {/* Video Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Video File (MP4, WebM)
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoFileChange}
          disabled={processing || isLoading}
          className="w-full"
        />
      </div>

      {/* Video Information */}
      {videoInfo && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📹 Video Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div><span className="font-medium text-gray-600">Name:</span> {videoInfo.name}</div>
            <div><span className="font-medium text-gray-600">Duration:</span> {formatTime(videoInfo.duration)}</div>
            <div><span className="font-medium text-gray-600">Size:</span> {(videoInfo.size / 1024 / 1024).toFixed(1)} MB</div>
            <div><span className="font-medium text-gray-600">Resolution:</span> {videoInfo.width}x{videoInfo.height}</div>
          </div>
          {shortDuration && videoDuration < shortDuration && (
            <p className="text-red-600 text-sm mt-2 font-medium">
              ⚠️ Video ({formatTime(videoDuration)}) is shorter than selected duration ({shortDuration}s). Please upload a longer video or decrease clip duration.
            </p>
          )}
        </div>
      )}

      {/* Active Video element positioned off-screen to keep browser hardware decoding pipeline active at full frame rate */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '640px',
            height: '360px',
            opacity: 0.01,
            pointerEvents: 'none',
          }}
          playsInline
          crossOrigin="anonymous"
        />
      )}

      {/* Main Action Button */}
      {videoInfo && shortDuration && videoDuration >= shortDuration && (
        <div className="mb-6">
          <button
            onClick={generateAllShorts}
            disabled={processing || isLoading}
            className="btn btn-primary w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {processing
              ? `🎙️ Recording Shorts with Voice... ${Math.round(progress)}% (Short #${processingIndex})`
              : `🔊 Generate All Short Videos with Voice (${shortDuration}s each)`}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {processing && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-2 font-medium">
            Capturing audio & video for Short #{processingIndex || 1}...
          </p>
        </div>
      )}

      {/* Individual Short Clips Section */}
      {videoInfo && shortDuration && videoDuration >= shortDuration && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
            <span>Available {shortDuration}s Segments</span>
            {generatedShorts.length > 0 && (
              <span className="text-sm text-green-600 font-normal">
                ✅ {generatedShorts.length} short(s) ready with voice
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {Array.from({ length: Math.min(NUM_SHORTS, Math.floor(videoDuration / shortDuration)) }).map((_, idx) => {
              const shortNum = idx + 1;
              const startTime = idx * shortDuration;
              const endTime = startTime + shortDuration;
              const existing = generatedShorts.find((s) => s.index === shortNum);
              const isCurrentProcessing = processing && processingIndex === shortNum;

              return (
                <div
                  key={shortNum}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    existing
                      ? 'bg-green-50 border-green-300 shadow-sm'
                      : isCurrentProcessing
                      ? 'bg-yellow-50 border-yellow-400 animate-pulse'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">Short #{shortNum}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </p>

                  {existing ? (
                    <div className="space-y-1">
                      <span className="inline-block text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-medium mb-1">
                        🔊 Voice Included
                      </span>
                      <button
                        onClick={() => setPreviewingShort(existing)}
                        className="btn btn-secondary text-xs w-full py-1"
                      >
                        ▶ Play Voice
                      </button>
                      <button
                        onClick={() => downloadShort(existing)}
                        className="btn btn-primary text-xs w-full py-1"
                      >
                        ⬇ Download
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => generateSingleShort(shortNum)}
                      disabled={processing || isLoading}
                      className="btn btn-secondary text-xs w-full py-1.5 disabled:opacity-50"
                    >
                      {isCurrentProcessing ? 'Recording...' : '🎙️ Generate'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {generatedShorts.length > 0 && (
            <button
              onClick={downloadAll}
              className="btn btn-primary w-full py-2.5 font-bold shadow"
            >
              ⬇️ Download All {generatedShorts.length} Short Videos (.webm)
            </button>
          )}
        </div>
      )}

      {/* Modal Preview for Short Video with Voice */}
      {previewingShort && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewingShort(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>

            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Preview Short #{previewingShort.index}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Timestamp: {formatTime(previewingShort.startTime)} - {formatTime(previewingShort.endTime)}
              {previewingShort.hasAudio && (
                <span className="ml-2 text-green-600 font-semibold">🔊 Voice Active</span>
              )}
            </p>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewMode('original')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  previewMode === 'original'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✨ Original HD Video (0 Lag)
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('recorded')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  previewMode === 'recorded'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📹 Recorded File (.webm)
              </button>
            </div>

            <div className="bg-black rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center relative">
              {previewMode === 'original' && videoUrl ? (
                <video
                  src={`${videoUrl}#t=${previewingShort.startTime},${previewingShort.endTime}`}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={previewingShort.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => downloadShort(previewingShort)}
                className="btn btn-primary flex-1 py-2 font-bold"
              >
                ⬇ Download Recorded Short (.webm)
              </button>
              <button
                onClick={() => setPreviewingShort(null)}
                className="btn btn-secondary py-2 px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

