// File: components/FrameSelector.jsx
export default function FrameSelector({ frames, onSelectFrame, isLoading }) {
  if (!frames || frames.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Select a Frame for Thumbnails</h2>
      <p className="text-gray-600 mb-4">Choose one of the {frames.length} extracted frames:</p>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => onSelectFrame(frame)}
            className="cursor-pointer group"
          >
            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 hover:border-red-500 transition-all">
              <img
                src={frame.imageData}
                alt={`Frame ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100">
                  {Math.floor(frame.timestamp)}s
                </span>
              </div>
            </div>
            <p className="text-xs text-center text-gray-600 mt-2">
              Frame {index + 1} • {frame.timestamp.toFixed(1)}s
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelectFrame(frames[0])}
        className="btn btn-primary w-full mt-6"
      >
        Use First Frame
      </button>
    </div>
  );
}
