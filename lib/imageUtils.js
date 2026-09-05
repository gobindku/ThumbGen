// File: lib/imageUtils.js
// Utility functions for image generation and processing

export const generateThumbnailVariations = async (imageData) => {
  // Mock thumbnail variations - in production, this would use Canvas API or server-side image processing
  const variations = [];
  
  const templates = [
    {
      name: 'Bold Red',
      bgColor: '#FF0000',
      textColor: '#FFFF00',
      fontSize: 48,
    },
    {
      name: 'Dark Blue',
      bgColor: '#1a1a2e',
      textColor: '#FFFFFF',
      fontSize: 48,
    },
    {
      name: 'Neon Green',
      bgColor: '#00FF00',
      textColor: '#000000',
      fontSize: 48,
    },
    {
      name: 'Purple Vibes',
      bgColor: '#9D00FF',
      textColor: '#FFFFFF',
      fontSize: 48,
    },
    {
      name: 'Orange Pop',
      bgColor: '#FF6B00',
      textColor: '#FFFFFF',
      fontSize: 48,
    },
  ];

  for (let i = 0; i < templates.length; i++) {
    variations.push({
      id: `variation-${i + 1}`,
      template: templates[i],
      imageData: imageData, // Original image
      text: 'Your Title Here',
      textColor: templates[i].textColor,
      bgColor: templates[i].bgColor,
      fontSize: templates[i].fontSize,
      textPosition: { x: 100, y: 150 },
    });
  }

  return variations;
};

export const renderThumbnailToCanvas = (canvas, variation) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    // Clear canvas
    ctx.fillStyle = variation.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Draw text
    ctx.font = `bold ${variation.fontSize}px Arial`;
    ctx.fillStyle = variation.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Wrap text if needed
    const maxWidth = canvas.width - 40;
    wrapText(ctx, variation.text, variation.textPosition.x + maxWidth / 2, variation.textPosition.y, maxWidth, variation.fontSize * 1.2);
  };

  img.src = variation.imageData;
};

const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ');
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      context.fillText(line, x, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  context.fillText(line, x, y);
};

export const downloadThumbnail = (canvas, filename = 'thumbnail.png') => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
};

export const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};
