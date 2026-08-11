import API from "./axios";
import { supabase } from "../lib/supabase";

const getActiveUserId = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem("pcms_admin_user") || "null");
    if (adminUser?.id) return adminUser.id;
    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (policeOfficer?.id) return policeOfficer.id;
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

  try {
    const res = await API.post("/other-places", objectData);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function createOtherPlace notice, falling back to direct DB insert:", err?.message);
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
  try {
    const res = await API.get("/other-places");
    if (res?.data?.data && Array.isArray(res.data.data)) return res;
  } catch (err) {
    console.warn("Edge function getOtherPlaces notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("other_places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};

// 3. GET SINGLE OTHER PLACE
export const getSingleOtherPlace = async (id) => {
  try {
    const res = await API.get(`/other-places/${id}`);
    if (res?.data?.data) return res;
  } catch (err) {
    console.warn("Edge function getSingleOtherPlace notice, falling back to direct DB query:", err?.message);
  }

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

  try {
    const res = await API.put(`/other-places/${id}`, objectData);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function updateOtherPlace notice, falling back to direct DB update:", err?.message);
  }

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
  try {
    const res = await API.delete(`/other-places/${id}`);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function deleteOtherPlace notice, falling back to direct DB delete:", err?.message);
  }

  const { data, error } = await supabase
    .from("other_places")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Other place deleted successfully", data } };
};