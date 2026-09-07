// File: pages/index.jsx
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import UploadArea from '@/components/UploadArea';
import VideoInput from '@/components/VideoInput';
import VideoDownloader from '@/components/VideoDownloader';
import VideoShortGenerator from '@/components/VideoShortGenerator';
import FrameSelector from '@/components/FrameSelector';
import ThumbnailGrid from '@/components/ThumbnailGrid';
import ThumbnailEditor from '@/components/ThumbnailEditor';
import { renderThumbnailToCanvas } from '@/lib/imageUtils';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, signOut } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const canvasRef = useRef(null);

  // Render canvas when variation changes
  useEffect(() => {
    if (selectedVariation) {
      const canvas = document.getElementById('preview-canvas');
      if (canvas) {
        renderThumbnailToCanvas(canvas, selectedVariation);
      }
    }
  }, [selectedVariation]);

  const handleImageUpload = async (imageData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setVariations([]);
        setSelectedVariation(null);

        // Auto-generate variations
        await generateVariations(data.sessionId);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVariations = async (id) => {
    setGeneratingVariations(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setVariations(data.variations);
        if (data.variations.length > 0) {
          setSelectedVariation(data.variations[0]);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error generating variations');
    } finally {
      setGeneratingVariations(false);
    }
  };

  const handleVariationSelect = (variation) => {
    setSelectedVariation(variation);
  };

  const handleVariationUpdate = (updatedVariation) => {
    setSelectedVariation(updatedVariation);
    setVariations(
      variations.map((v) =>
        v.id === updatedVariation.id ? updatedVariation : v
      )
    );

    // Render updated canvas
    const canvas = document.getElementById('preview-canvas');
    if (canvas) {
      renderThumbnailToCanvas(canvas, updatedVariation);
    }
  };

  const handleNewSession = () => {
    setSessionId(null);
    setVariations([]);
    setSelectedVariation(null);
    setExtractedFrames(null);
  };

  const handleFramesExtracted = (frames) => {
    setExtractedFrames(frames);
  };

  const handleSelectFrame = async (frame) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: frame.imageData }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setVariations([]);
        setSelectedVariation(null);
        setExtractedFrames(null);

        // Auto-generate variations
        await generateVariations(data.sessionId);
      } else {
        alert('Failed to upload frame');
      }
    } catch (error) {
      console.error('Frame upload error:', error);
      alert('Error uploading frame');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" suppressHydrationWarning>
      <Head>
        <title>ThumbGen - Make YouTube Easy with ThumbGen</title>
        <meta
          name="description"
          content="ThumbGen - Create stunning YouTube Thumbnails, extract frames from videos, download video files, and generate custom short videos for Reels & TikTok."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="ThumbGen - YouTube Creatives & Short Generator" />
        <meta
          property="og:description"
          content="Generate high-converting thumbnails and short clips with voice in minutes."
        />
        <meta property="og:image" content="/app-icon.png" />
        <meta property="og:type" content="website" />
      </Head>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/app-icon.png"
              alt="ThumbGen Icon"
              className="w-10 h-10 rounded-xl shadow-md object-cover border border-gray-100"
            />
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Make youtube easy with thumbgen
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {sessionId && (
              <button
                onClick={handleNewSession}
                className="btn btn-secondary"
              >
                New Session
              </button>
            )}
            {user ? (
              <button onClick={signOut} className="btn btn-secondary">
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn btn-primary"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!sessionId ? (
          // Upload Section
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Create Stunning YouTube Creatives
              </h2>
              <p className="text-xl text-gray-600">
                Upload an image, extract frames from video, and generate 5 AI-powered variations
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 1: Image Upload</h3>
                <UploadArea onImageUpload={handleImageUpload} isLoading={isLoading} />
              </div>

              {/* Video Input */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 2: Video Link</h3>
                <VideoInput onFramesExtracted={handleFramesExtracted} isLoading={isLoading} />
              </div>
            </div>

            {/* Video Downloader - Full Width */}
            <div className="max-w-4xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 3: Download Video from URL</h3>
              <VideoDownloader isLoading={isLoading} />
            </div>

            {/* Video Short Generator - Full Width */}
            <div className="max-w-4xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Option 4: Create Short Videos (Reels/TikTok)</h3>
              <VideoShortGenerator onShortsGenerated={(shorts) => console.log('Shorts generated:', shorts.length)} isLoading={isLoading} />
            </div>

            {/* Extracted Frames */}
            {extractedFrames && (
              <div className="max-w-4xl mx-auto mb-12">
                <FrameSelector
                  frames={extractedFrames}
                  onSelectFrame={handleSelectFrame}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Video Info Box */}
            <div className="max-w-4xl mx-auto mb-12 p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📹 About Video Support</h3>
              <p className="text-sm text-blue-800 mb-3">
                ThumbGen can extract 10 frames from videos automatically. Here are the best options:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-medium text-sm text-blue-900 mb-1">✅ Works Great</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Direct MP4/WebM links</li>
                    <li>• Sample videos (included)</li>
                    <li>• Self-hosted videos</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-medium text-sm text-blue-900 mb-1">⚠️ Workarounds Needed</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• YouTube (CORS blocked)</li>
                    <li>• Download video first</li>
                    <li>• Screen record & upload</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '📹',
                  title: 'Extract from Video',
                  description: 'Automatically extract 10 frames from any video link',
                },
                {
                  icon: '🎨',
                  title: 'AI Variations',
                  description: 'Generate 5 unique thumbnail designs with different color schemes',
                },
                {
                  icon: '⬇️',
                  title: 'Download',
                  description: 'Export high-quality PNG thumbnails ready for YouTube',
                },
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Editor Section
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Thumbnails */}
            <div className="lg:col-span-2">
              {generatingVariations ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  </div>
                  <p className="mt-4 text-gray-600">Generating thumbnails...</p>
                </div>
              ) : (
                <ThumbnailGrid
                  variations={variations}
                  onSelectVariation={handleVariationSelect}
                  selectedVariationId={selectedVariation?.id}
                />
              )}
            </div>

            {/* Right Column - Editor */}
            <div className="lg:col-span-1">
              {selectedVariation ? (
                <ThumbnailEditor
                  variation={selectedVariation}
                  onUpdate={handleVariationUpdate}
                />
              ) : (
                <div className="card text-center py-12">
                  <p className="text-gray-500">
                    {variations.length === 0
                      ? 'Generating thumbnails...'
                      : 'Select a thumbnail to edit'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>
            ThumbGen © 2024 - Generate high-converting YouTube Creatives in minutes
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
