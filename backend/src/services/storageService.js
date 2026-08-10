const supabase = require("../config/supabase");
const path = require("path");

const BUCKET_NAME = "city-management-photos";

exports.uploadPhoto = async (file, folder = "religious-places") => {
  if (!file) return null;

  const fileExt = path.extname(file.originalname || file.filename || ".jpg");
  const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file.buffer || file.path, {
      contentType: file.mimetype || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    // Return relative filename as fallback reference
    return file.filename || fileName;
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return urlData?.publicUrl || fileName;
};

exports.deletePhoto = async (photoUrl) => {
  if (!photoUrl) return;

  try {
    const urlParts = photoUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }
  } catch (err) {
    console.error("Storage delete error:", err);
  }
};
