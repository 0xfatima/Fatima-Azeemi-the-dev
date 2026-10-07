export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }
  return body;
}

function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Compress images before upload.
 * Supports legacy compressImage(file, maxDim, quality)
 * or compressImage(file, { maxDim, quality, maxBytes }).
 */
export function compressImage(file, maxDimOrOptions = 800, qualityArg = 0.85) {
  const options =
    typeof maxDimOrOptions === "object" && maxDimOrOptions !== null
      ? maxDimOrOptions
      : { maxDim: maxDimOrOptions, quality: qualityArg };

  const maxDim = options.maxDim ?? 800;
  const startQuality = options.quality ?? 0.85;
  const maxBytes = options.maxBytes ?? null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        let quality = startQuality;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        if (maxBytes) {
          while (dataUrlBytes(dataUrl) > maxBytes && quality > 0.45) {
            quality = Math.max(0.45, quality - 0.08);
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          // If still too large, shrink dimensions once more.
          if (dataUrlBytes(dataUrl) > maxBytes) {
            const scale = Math.sqrt(maxBytes / dataUrlBytes(dataUrl));
            const nextWidth = Math.max(480, Math.round(width * Math.min(scale, 0.85)));
            const nextHeight = Math.max(480, Math.round(height * Math.min(scale, 0.85)));
            canvas.width = nextWidth;
            canvas.height = nextHeight;
            canvas.getContext("2d").drawImage(img, 0, 0, nextWidth, nextHeight);
            quality = Math.min(quality, 0.7);
            dataUrl = canvas.toDataURL("image/jpeg", quality);
            while (dataUrlBytes(dataUrl) > maxBytes && quality > 0.4) {
              quality = Math.max(0.4, quality - 0.06);
              dataUrl = canvas.toDataURL("image/jpeg", quality);
            }
          }
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Could not read that image"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Gallery photos: smaller files for free-tier storage. */
export function compressGalleryImage(file) {
  return compressImage(file, { maxDim: 1280, quality: 0.68, maxBytes: 220_000 });
}

/** Logos / icons: tiny files. */
export function compressLogoImage(file) {
  return compressImage(file, { maxDim: 512, quality: 0.75, maxBytes: 80_000 });
}
