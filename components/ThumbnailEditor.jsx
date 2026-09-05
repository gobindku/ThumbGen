// File: components/ThumbnailEditor.jsx
import { useCallback } from 'react';
import { downloadThumbnail } from '@/lib/imageUtils';

export default function ThumbnailEditor({ variation, onUpdate }) {
  const handleTextChange = useCallback(
    (e) => {
      onUpdate({
        ...variation,
        text: e.target.value,
      });
    },
    [variation, onUpdate]
  );

  const handleTextColorChange = useCallback(
    (e) => {
      onUpdate({
        ...variation,
        textColor: e.target.value,
      });
    },
    [variation, onUpdate]
  );

  const handleBgColorChange = useCallback(
    (e) => {
      onUpdate({
        ...variation,
        bgColor: e.target.value,
      });
    },
    [variation, onUpdate]
  );

  const handleFontSizeChange = useCallback(
    (e) => {
      onUpdate({
        ...variation,
        fontSize: parseInt(e.target.value),
      });
    },
    [variation, onUpdate]
  );

  const handleDownload = useCallback(() => {
    // Create canvas and render
    const canvas = document.getElementById('preview-canvas');
    if (canvas) {
      downloadThumbnail(canvas, `thumbnail-${variation.id}.png`);
    }
  }, [variation]);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Edit Thumbnail</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Content
        </label>
        <textarea
          value={variation.text}
          onChange={handleTextChange}
          className="input h-20"
          placeholder="Enter your thumbnail text..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={variation.textColor}
              onChange={handleTextColorChange}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600">{variation.textColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={variation.bgColor}
              onChange={handleBgColorChange}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600">{variation.bgColor}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Size: {variation.fontSize}px
        </label>
        <input
          type="range"
          min="24"
          max="72"
          value={variation.fontSize}
          onChange={handleFontSizeChange}
          className="w-full"
        />
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
        <canvas
          id="preview-canvas"
          width={1280}
          height={720}
          style={{
            maxWidth: '100%',
            border: '1px solid #ddd',
            borderRadius: '8px',
            display: 'block',
            backgroundColor: variation.bgColor,
          }}
        />
      </div>

      <button
        onClick={handleDownload}
        className="btn btn-primary w-full"
      >
        Download PNG
      </button>
    </div>
  );
}
