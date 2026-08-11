import { supabase } from "../lib/supabase";

const isValidUuid = (val) => {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
};

const getActiveUserId = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem("pcms_admin_user") || "null");
    if (adminUser?.id && isValidUuid(adminUser.id)) return adminUser.id;
    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (policeOfficer?.id && isValidUuid(policeOfficer.id)) return policeOfficer.id;
  } catch (e) {
    console.warn("Active user parse notice:", e);
  }
  return null;
};

const sanitizeOtherPlacePayload = (data) => {
  const payload = { ...data };

  payload.latitude = payload.latitude && !isNaN(parseFloat(payload.latitude)) ? parseFloat(payload.latitude) : null;
  payload.longitude = payload.longitude && !isNaN(parseFloat(payload.longitude)) ? parseFloat(payload.longitude) : null;

  if (!payload.owner_name || payload.owner_name === "") payload.owner_name = null;
  if (!payload.mobile || payload.mobile === "") payload.mobile = null;
  if (!payload.address || payload.address === "") payload.address = null;
  if (!payload.area || payload.area === "") payload.area = null;
  if (!payload.google_map_link || payload.google_map_link === "") payload.google_map_link = null;
  if (!payload.notes || payload.notes === "") payload.notes = null;

  delete payload.image;
  delete payload.photo;

  return payload;
};

// 1. CREATE OTHER PLACE
export const createOtherPlace = async (inputData) => {
  let objectData = inputData;
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeOtherPlacePayload(objectData);
  const userId = getActiveUserId();
  if (userId) {
    cleanRecord.created_by = userId;
  }

  const { data, error } = await supabase
    .from("other_places")
    .insert([cleanRecord])
    .select()
    .single();

  if (error) {
    console.error("Supabase other_places insert error:", error);
    throw { response: { status: 500, data: { message: error.message || "Failed to save other place record" } } };
  }

  return { data: { success: true, message: "Other place created successfully", data } };
};

// 2. GET ALL OTHER PLACES
export const getOtherPlaces = async () => {
  const { data, error } = await supabase
    .from("other_places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};

// 3. GET SINGLE OTHER PLACE
export const getSingleOtherPlace = async (id) => {
  const { data, error } = await supabase
    .from("other_places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return { data: { success: true, data } };
};

// 4. UPDATE OTHER PLACE
export const updateOtherPlace = async (id, inputData) => {
  let objectData = inputData;
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeOtherPlacePayload(objectData);

  const { data, error } = await supabase
    .from("other_places")
    .update(cleanRecord)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Other place updated successfully", data } };
};

// 5. DELETE OTHER PLACE
export const deleteOtherPlace = async (id) => {
  const { data, error } = await supabase
    .from("other_places")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Other place deleted successfully", data } };
};