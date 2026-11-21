export interface CompressedImageResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  originalKb: number;
  compressedKb: number;
  width: number;
  height: number;
}

function dataUrlByteSize(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return dataUrl.length;
  const base64 = dataUrl.slice(base64Index + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Automatically resizes and compresses any uploaded image in the browser
 * to target roughly 10KB-30KB (strictly <= 30KB whenever achievable).
 */
export async function compressImageToTarget(
  file: File,
  minBytes = 10 * 1024,
  maxBytes = 29.5 * 1024
): Promise<CompressedImageResult> {
  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas unavailable for image compression.');
  }

  const dimensionSteps = [760, 620, 500, 400, 320, 260];
  let bestDataUrl = '';
  let bestBytes = Number.MAX_SAFE_INTEGER;
  let bestWidth = img.naturalWidth;
  let bestHeight = img.naturalHeight;

  for (const maxDim of dimensionSteps) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let lowQ = 0.24;
    let highQ = 0.86;
    let chosenForDim = '';
    let chosenBytesForDim = Number.MAX_SAFE_INTEGER;

    for (let step = 0; step < 7; step++) {
      const midQ = (lowQ + highQ) / 2;
      const candidate = canvas.toDataURL('image/jpeg', midQ);
      const bytes = dataUrlByteSize(candidate);

      if (bytes <= maxBytes) {
        chosenForDim = candidate;
        chosenBytesForDim = bytes;
        lowQ = midQ;
        if (bytes >= minBytes) {
          // Inside ideal 10KB-30KB window
          return {
            dataUrl: candidate,
            originalBytes: file.size,
            compressedBytes: bytes,
            originalKb: Math.round((file.size / 1024) * 10) / 10,
            compressedKb: Math.round((bytes / 1024) * 10) / 10,
            width: targetWidth,
            height: targetHeight,
          };
        }
      } else {
        highQ = midQ;
      }
    }

    if (chosenForDim && chosenBytesForDim <= maxBytes) {
      return {
        dataUrl: chosenForDim,
        originalBytes: file.size,
        compressedBytes: chosenBytesForDim,
        originalKb: Math.round((file.size / 1024) * 10) / 10,
        compressedKb: Math.round((chosenBytesForDim / 1024) * 10) / 10,
        width: targetWidth,
        height: targetHeight,
      };
    }

    const fallbackCandidate = canvas.toDataURL('image/jpeg', 0.24);
    const fallbackBytes = dataUrlByteSize(fallbackCandidate);
    if (fallbackBytes < bestBytes) {
      bestDataUrl = fallbackCandidate;
      bestBytes = fallbackBytes;
      bestWidth = targetWidth;
      bestHeight = targetHeight;
    }
  }

  return {
    dataUrl: bestDataUrl,
    originalBytes: file.size,
    compressedBytes: bestBytes,
    originalKb: Math.round((file.size / 1024) * 10) / 10,
    compressedKb: Math.round((bestBytes / 1024) * 10) / 10,
    width: bestWidth,
    height: bestHeight,
  };
}
