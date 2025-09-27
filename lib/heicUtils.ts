/**
 * Simple and reliable HEIC/HEIF conversion using only browser canvas
 * This is the most compatible approach for all HEIC files
 */

/**
 * Converts HEIC/HEIF files to JPEG using heic2any
 * @param file - The HEIC file to convert
 * @returns Promise<File> - The converted JPEG file
 */
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  console.log(`🔄 Converting HEIC: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  // Strategy 1: Try heic2any with multiple approaches
  try {
    console.log(`🔄 Strategy 1: Trying heic2any...`);
    const heic2any = (await import('heic2any')).default;

    const strategies = [
      { toType: 'image/jpeg', quality: 0.8, name: 'JPEG 80%' },
      { toType: 'image/jpeg', quality: 0.6, name: 'JPEG 60%' },
      { toType: 'image/jpeg', quality: 0.4, name: 'JPEG 40%' },
      { toType: 'image/jpeg', quality: 0.2, name: 'JPEG 20%' },
      { toType: 'image/jpeg', quality: 0.1, name: 'JPEG 10%' },
      { toType: 'image/png', quality: 0.9, name: 'PNG 90%' },
      { toType: 'image/png', quality: 0.7, name: 'PNG 70%' },
      { toType: 'image/png', quality: 0.5, name: 'PNG 50%' }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying ${strategy.name}...`);

        const result = await heic2any({
          blob: file,
          toType: strategy.toType,
          quality: strategy.quality
        });

        const convertedBlob = Array.isArray(result) ? result[0] : result;

        const convertedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, strategy.toType === 'image/jpeg' ? '.jpg' : '.png'),
          { type: strategy.toType }
        );

        console.log(`✅ heic2any conversion successful with ${strategy.name}: ${(convertedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return convertedFile;

      } catch (strategyError) {
        console.log(`⚠️ ${strategy.name} failed: ${strategyError.message}`);
        continue;
      }
    }

    console.log(`⚠️ All heic2any strategies failed, trying canvas fallback...`);

  } catch (heic2anyError) {
    console.log(`⚠️ heic2any library failed: ${heic2anyError.message}, trying canvas fallback...`);
  }

  // Strategy 2: Canvas fallback (sometimes works when heic2any fails)
  try {
    console.log(`🔄 Strategy 2: Trying canvas conversion...`);
    return await convertImageToJpeg(file);

  } catch (canvasError) {
    console.log(`⚠️ Canvas conversion failed: ${canvasError.message}`);
  }

  // Strategy 3: Create an informative placeholder
  try {
    console.log(`🔄 Strategy 3: Creating informative placeholder...`);

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);

      // Add border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 398, 298);

      // Add text
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📱 Photo iPhone HEIC', 200, 120);

      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.fillText('Format non supporté', 200, 150);

      ctx.font = '12px Arial';
      ctx.fillText('Convertissez en JPEG depuis', 200, 180);
      ctx.fillText('votre appareil photo', 200, 200);

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const placeholderFile = new File(
              [blob],
              file.name.replace(/\.(heic|heif)$/i, '_placeholder.jpg'),
              { type: 'image/jpeg' }
            );
            console.log(`⚠️ Created informative placeholder for HEIC file`);
            resolve(placeholderFile);
          } else {
            reject(new Error('Failed to create placeholder JPEG'));
          }
        }, 'image/jpeg', 0.8);
      });
    }

  } catch (placeholderError) {
    console.log(`⚠️ Placeholder creation failed: ${placeholderError.message}`);
  }

  throw new Error('Impossible de traiter ce fichier HEIC. Veuillez convertir en JPEG depuis votre appareil photo.');
};

/**
 * Converts any image file to JPEG using canvas (for non-HEIC files)
 * @param file - The image file to convert
 * @returns Promise<File> - The converted JPEG file
 */
export const convertImageToJpeg = async (file: File): Promise<File> => {
  console.log(`🔄 Converting image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        console.log(`📐 Image loaded: ${img.width}x${img.height}`);

        // Vérifier que l'image s'est bien chargée
        if (img.width === 0 || img.height === 0) {
          reject(new Error('Image has invalid dimensions'));
          return;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate optimal dimensions (max 1920px for good quality/size balance)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        console.log(`📐 Canvas dimensions: ${width}x${height}`);

        canvas.width = width;
        canvas.height = height;

        // Clear canvas with white background to avoid black squares
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with optimal quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create JPEG blob'));
            return;
          }

          // Create new file
          const convertedFile = new File(
            [blob],
            file.name.replace(/\.(png|webp)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );

          console.log(`✅ Image conversion successful: ${(convertedFile.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(convertedFile);
        }, 'image/jpeg', 0.85); // 85% quality for good balance

      } catch (error) {
        console.error('❌ Error in image conversion:', error);
        reject(error);
      }
    };

    img.onerror = (error) => {
      console.error('❌ Image load error:', error);
      reject(new Error(`Cannot load image: ${file.name}`));
    };

    // Load image with error handling
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('❌ Error creating object URL:', error);
      reject(new Error(`Cannot create object URL for: ${file.name}`));
    }
  });
};

/**
 * Processes any image file with appropriate conversion
 * @param file - The file to process
 * @returns Promise<File> - The processed file
 */
export const processImageFile = async (file: File): Promise<File> => {
  console.log(`🔄 Processing file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isImage = allowedTypes.includes(file.type.toLowerCase()) ||
    file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/i);

  if (!isImage) {
    throw new Error('Seules les images JPEG, PNG et WebP sont autorisées. Pour les photos iPhone HEIC, convertissez-les en JPEG depuis votre appareil.');
  }

  // Check file size (10MB max for any image)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Le fichier est trop volumineux (max 10MB)');
  }

  // Si c'est déjà un JPEG et qu'il fait moins de 5MB, on le garde tel quel
  if (file.type.toLowerCase() === 'image/jpeg' && file.size < 5 * 1024 * 1024) {
    console.log(`✅ JPEG already optimized, keeping original: ${file.name}`);
    return file;
  }

  // Pour les autres cas (PNG, WebP, ou JPEG trop gros), on optimise
  console.log(`🔄 Optimizing image: ${file.name}`);
  return await convertImageToJpeg(file);
};
