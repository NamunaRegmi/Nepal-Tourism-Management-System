const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function ensureCloudinaryConfig() {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
}

export function getCloudinaryUploadEnabled() {
  return Boolean(cloudName && uploadPreset);
}

export function createObjectPreview(file) {
  if (!(file instanceof File)) return '';
  return URL.createObjectURL(file);
}

export async function uploadImageToCloudinary(file, folder = 'nepal-tourism-management-system') {
  if (!(file instanceof File)) {
    throw new Error('A valid image file is required for upload.');
  }

  ensureCloudinaryConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Cloudinary upload failed.';
    try {
      const data = await response.json();
      message = data?.error?.message || message;
    } catch {
      /* ignore non-JSON error body */
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.secure_url;
}
