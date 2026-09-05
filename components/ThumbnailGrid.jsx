// File: components/ThumbnailGrid.jsx
export default function ThumbnailGrid({ variations, onSelectVariation, selectedVariationId }) {
  if (!variations || variations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No thumbnails generated yet. Upload an image to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Generated Thumbnails</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {variations.map((variation) => (
          <div
            key={variation.id}
            onClick={() => onSelectVariation(variation)}
            className={`card cursor-pointer transform transition-all hover:shadow-lg ${
              selectedVariationId === variation.id ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
              <ThumbnailPreview variation={variation} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">
              {variation.template?.name || 'Variation'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{variation.text}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectVariation(variation);
              }}
              className="btn btn-primary w-full text-sm"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThumbnailPreview({ variation }) {
  return (
    <div
      style={{
        backgroundColor: variation.bgColor,
        backgroundImage: variation.imageData ? `url(${variation.imageData})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: variation.textColor,
        fontSize: `${Math.min(variation.fontSize / 2, 24)}px`,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          wordBreak: 'break-word',
        }}
      >
        {variation.text}
      </div>
    </div>
  );
}
