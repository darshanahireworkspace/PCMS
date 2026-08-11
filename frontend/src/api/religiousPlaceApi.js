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

const sanitizeReligiousPlacePayload = (data) => {
  const payload = { ...data };

  // Parse numbers
  payload.latitude = payload.latitude && !isNaN(parseFloat(payload.latitude)) ? parseFloat(payload.latitude) : null;
  payload.longitude = payload.longitude && !isNaN(parseFloat(payload.longitude)) ? parseFloat(payload.longitude) : null;
  payload.cctv_count = payload.cctv_count && !isNaN(parseInt(payload.cctv_count, 10)) ? parseInt(payload.cctv_count, 10) : 0;

  // Map crowd estimation to integer if string provided
  if (typeof payload.regular_crowd === "string") {
    if (payload.regular_crowd === "Low") payload.regular_crowd = 100;
    else if (payload.regular_crowd === "Medium") payload.regular_crowd = 500;
    else if (payload.regular_crowd === "High") payload.regular_crowd = 1000;
    else if (payload.regular_crowd === "Critical") payload.regular_crowd = 5000;
    else payload.regular_crowd = parseInt(payload.regular_crowd, 10) || 0;
  }

  // Parse booleans
  if (payload.cctv_available !== undefined) {
    payload.cctv_available = payload.cctv_available === true || payload.cctv_available === "true" || payload.cctv_available === "Yes";
  }

  // Clean empty strings to null for optional columns
  if (!payload.address || payload.address === "") payload.address = null;
  if (!payload.area || payload.area === "") payload.area = null;
  if (!payload.ward || payload.ward === "") payload.ward = null;
  if (!payload.taluka || payload.taluka === "") payload.taluka = null;
  if (!payload.district || payload.district === "") payload.district = null;
  if (!payload.state || payload.state === "") payload.state = null;
  if (!payload.pincode || payload.pincode === "") payload.pincode = null;
  if (!payload.contact_person || payload.contact_person === "") payload.contact_person = null;
  if (!payload.contact_mobile || payload.contact_mobile === "") payload.contact_mobile = null;

  delete payload.image;
  delete payload.photo;

  return payload;
};

// 1. CREATE RELIGIOUS PLACE
export const createReligiousPlace = async (inputData) => {
  let objectData = inputData;

  // Convert FormData to plain object if passed as FormData
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeReligiousPlacePayload(objectData);
  const userId = getActiveUserId();
  if (userId) {
    cleanRecord.created_by = userId;
  }

  // First try Edge Function endpoint
  try {
    const res = await API.post("/religious-places", objectData);
    if (res?.data?.success) return res;
  } catch (edgeErr) {
    console.warn("Edge function createReligiousPlace notice, falling back to direct DB insert:", edgeErr?.message);
  }

  // Resilient direct Supabase database insert
  const { data, error } = await supabase
    .from("religious_places")
    .insert([cleanRecord])
    .select()
    .single();

  if (error) {
    console.error("Supabase religious_places insert error:", error);
    throw { response: { status: 500, data: { message: error.message || "Failed to save religious place record" } } };
  }

  // Create initial visit entry
  if (data?.id && userId) {
    try {
      await supabase.from("place_visits").insert([
        {
          place_id: data.id,
          entity_type: "religious_place",
          officer_id: userId,
          notes: "Initial registration visit",
          photo_url: cleanRecord.image_url || cleanRecord.photo_url || null,
        },
      ]);
    } catch (visitErr) {
      console.warn("Initial visit notice:", visitErr);
    }
  }

  return { data: { success: true, message: "Religious place created successfully", data } };
};

// 2. GET ALL RELIGIOUS PLACES
export const getReligiousPlaces = async () => {
  try {
    const res = await API.get("/religious-places");
    if (res?.data?.data && Array.isArray(res.data.data)) return res;
  } catch (err) {
    console.warn("Edge function getReligiousPlaces notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("religious_places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};

// 3. GET SINGLE RELIGIOUS PLACE
export const getSingleReligiousPlace = async (id) => {
  try {
    const res = await API.get(`/religious-places/${id}`);
    if (res?.data?.data) return res;
  } catch (err) {
    console.warn("Edge function getSingleReligiousPlace notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("religious_places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return { data: { success: true, data } };
};

// 4. UPDATE RELIGIOUS PLACE
export const updateReligiousPlace = async (id, inputData) => {
  let objectData = inputData;
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeReligiousPlacePayload(objectData);

  try {
    const res = await API.put(`/religious-places/${id}`, objectData);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function updateReligiousPlace notice, falling back to direct DB update:", err?.message);
  }

  const { data, error } = await supabase
    .from("religious_places")
    .update(cleanRecord)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Religious place updated successfully", data } };
};

// 5. DELETE RELIGIOUS PLACE
export const deleteReligiousPlace = async (id) => {
  try {
    const res = await API.delete(`/religious-places/${id}`);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function deleteReligiousPlace notice, falling back to direct DB delete:", err?.message);
  }

  const { data, error } = await supabase
    .from("religious_places")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Religious place deleted successfully", data } };
};

// 6. CHECK DUPLICATE PLACE
export const checkDuplicatePlace = async (data) => {
  try {
    const res = await API.post("/religious-places/check-duplicate", data);
    if (res?.data?.data) return res;
  } catch (err) {
    console.warn("Edge function checkDuplicatePlace notice:", err?.message);
  }
  return { data: { success: true, data: { isDuplicate: false } } };
};

// 7. RECORD PLACE VISIT
export const recordPlaceVisit = async (data) => {
  const userId = getActiveUserId();
  const payload = {
    ...data,
    officer_id: userId || data.officer_id,
  };

  try {
    const res = await API.post("/visits", payload);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function recordPlaceVisit notice, falling back to direct DB insert:", err?.message);
  }

  const { data: visit, error } = await supabase
    .from("place_visits")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Visit recorded successfully", data: visit } };
};

// 8. GET PLACE VISITS
export const getPlaceVisits = async (placeId) => {
  try {
    const res = await API.get(`/visits?place_id=${placeId}`);
    if (res?.data?.data) return res;
  } catch (err) {
    console.warn("Edge function getPlaceVisits notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("place_visits")
    .select("*")
    .eq("place_id", placeId)
    .order("visited_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};