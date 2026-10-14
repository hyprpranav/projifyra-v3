// ============================================================
// PROJIFYRA 3.1 — Cloudinary Service
// Handles direct client-side uploads for profile avatars and files
// using an unsigned upload preset.
// ============================================================

import { CLOUDINARY_CONFIG } from "../config/appConfig";

/**
 * Upload an image or file to Cloudinary
 * @param {File} file - The file object from <input type="file" />
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ url: string, publicId: string, format: string }>}
 */
export async function uploadToCloudinary(file, folder = "projifyra/profiles") {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;

  if (!cloudName || cloudName === "YOUR_CLOUD_NAME") {
    throw new Error(
      "Cloudinary Cloud Name is not configured yet. Please update CLOUDINARY_CONFIG in src/config/appConfig.js."
    );
  }

  if (!uploadPreset || uploadPreset === "YOUR_UPLOAD_PRESET") {
    throw new Error(
      "Cloudinary Upload Preset is not configured yet. Please update CLOUDINARY_CONFIG in src/config/appConfig.js."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Cloudinary upload failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    bytes: data.bytes,
  };
}
