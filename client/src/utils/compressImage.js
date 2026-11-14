/**
 * Compresses an image file to max 1600px (width or height) JPEG at 0.8 quality.
 * Returns a Promise that resolves to a compressed File object.
 *
 * @param {File} file - Original image file
 * @param {number} maxDimension - Maximum width/height in px (default 1600)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default 0.8)
 * @returns {Promise<File>} Compressed File
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.8) {
  // If not an image, return original
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Create a new File object with compressed content
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => {
        console.error('Image load error during compression:', err);
        resolve(file); // Fallback to original
      };
    };

    reader.onerror = (err) => {
      console.error('File read error during compression:', err);
      resolve(file); // Fallback to original
    };
  });
}
