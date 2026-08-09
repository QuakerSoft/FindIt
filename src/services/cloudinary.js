const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function validateItemImage(file) {
  if (!file) {
    throw new Error("Please select an image.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Please select a JPG, PNG, or WebP image."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "The selected image must be 5 MB or smaller."
    );
  }
}

export async function uploadItemImage(
  file,
  userId
) {
  if (!userId) {
    throw new Error(
      "You must be logged in to upload an image."
    );
  }

  validateItemImage(file);

  const cloudName =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    import.meta.env
      .VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Image uploading has not been configured."
    );
  }

  const uploadData = new FormData();

  uploadData.append("file", file);
  uploadData.append(
    "upload_preset",
    uploadPreset
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: uploadData,
    }
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.error?.message ||
        "Unable to upload this image."
    );
  }

  return {
    imageUrl: responseData.secure_url,
    imagePath: responseData.public_id,
  };
}