import { ImageConfig } from '../types';

/**
 * Calculates standard CSS positioning and transform styles from an ImageConfig
 */
export function getImagePositionStyles(config?: ImageConfig, defaultHeight = 300) {
  const current = config || { scale: 1, x: 0, y: 0, height: defaultHeight };
  const posX = 50 - (current.x / 2);
  const posY = 50 - (current.y / 2);

  return {
    scale: current.scale,
    height: current.height,
    posX,
    posY,
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${current.scale})`,
  };
}

/**
 * Reads an image file and resolves its base64 data URL
 */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
