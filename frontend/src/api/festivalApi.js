import API from "./axios";
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
    if (adminUser?.id) return adminUser.id;
    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (policeOfficer?.id) return policeOfficer.id;
  } catch (e) {
    console.warn("Active user parse notice:", e);
  }
  return null;
};

const sanitizeFestivalPayload = (data) => {
  const payload = { ...data };

  // UUID verification
  if (payload.religious_place_id && !isValidUuid(payload.religious_place_id)) {
    payload.religious_place_id = null;
  }
  if (payload.assigned_officer && !isValidUuid(payload.assigned_officer)) {
    payload.assigned_officer = null;
  }

  // Parse numbers
  payload.expected_crowd = payload.expected_crowd && !isNaN(parseInt(payload.expected_crowd, 10)) ? parseInt(payload.expected_crowd, 10) : 0;
  payload.latitude = payload.latitude && !isNaN(parseFloat(payload.latitude)) ? parseFloat(payload.latitude) : null;
  payload.longitude = payload.longitude && !isNaN(parseFloat(payload.longitude)) ? parseFloat(payload.longitude) : null;

  // Clean empty strings to null for optional columns
  if (!payload.start_date || payload.start_date === "") payload.start_date = null;
  if (!payload.end_date || payload.end_date === "") payload.end_date = null;
  if (!payload.start_time || payload.start_time === "") payload.start_time = null;
  if (!payload.end_time || payload.end_time === "") payload.end_time = null;
  if (!payload.president_name || payload.president_name === "") payload.president_name = null;
  if (!payload.president_mobile || payload.president_mobile === "") payload.president_mobile = null;
  if (!payload.route_details || payload.route_details === "") payload.route_details = null;
  if (!payload.address || payload.address === "") payload.address = null;
  if (!payload.area || payload.area === "") payload.area = null;
  if (!payload.taluka || payload.taluka === "") payload.taluka = null;
  if (!payload.district || payload.district === "") payload.district = null;

  delete payload.image;
  delete payload.photo;

  return payload;
};

// 1. CREATE FESTIVAL PERMISSION
export const createFestivalPermission = async (inputData) => {
  let objectData = inputData;
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeFestivalPayload(objectData);
  const userId = getActiveUserId();
  if (userId) {
    cleanRecord.created_by = userId;
    if (!cleanRecord.assigned_officer) {
      cleanRecord.assigned_officer = userId;
    }
  }

  try {
    const res = await API.post("/festival-permissions", objectData);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function createFestivalPermission notice, falling back to direct DB insert:", err?.message);
  }

  const { data, error } = await supabase
    .from("festival_permissions")
    .insert([cleanRecord])
    .select()
    .single();

  if (error) {
    console.error("Supabase festival_permissions insert error:", error);
    throw { response: { status: 500, data: { message: error.message || "Failed to save festival permission record" } } };
  }

  return { data: { success: true, message: "Festival permission created successfully", data } };
};

// 2. GET ALL FESTIVAL PERMISSIONS
export const getFestivalPermissions = async () => {
  try {
    const res = await API.get("/festival-permissions");
    if (res?.data?.data && Array.isArray(res.data.data)) return res;
  } catch (err) {
    console.warn("Edge function getFestivalPermissions notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("festival_permissions")
    .select("*, religious_places(place_name, place_type)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const formatted = (data || []).map((fp) => ({
    ...fp,
    place_name: fp.religious_places?.place_name || null,
  }));

  return { data: { success: true, data: formatted } };
};

// 3. GET SINGLE FESTIVAL PERMISSION
export const getSingleFestivalPermission = async (id) => {
  try {
    const res = await API.get(`/festival-permissions/${id}`);
    if (res?.data?.data) return res;
  } catch (err) {
    console.warn("Edge function getSingleFestivalPermission notice, falling back to direct DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("festival_permissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return { data: { success: true, data } };
};

// 4. UPDATE FESTIVAL PERMISSION
export const updateFestivalPermission = async (id, inputData) => {
  let objectData = inputData;
  if (inputData instanceof FormData) {
    objectData = {};
    inputData.forEach((val, key) => {
      objectData[key] = val;
    });
  }

  const cleanRecord = sanitizeFestivalPayload(objectData);

  try {
    const res = await API.put(`/festival-permissions/${id}`, objectData);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function updateFestivalPermission notice, falling back to direct DB update:", err?.message);
  }

  const { data, error } = await supabase
    .from("festival_permissions")
    .update(cleanRecord)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Festival permission updated successfully", data } };
};

// 5. DELETE FESTIVAL PERMISSION
export const deleteFestivalPermission = async (id) => {
  try {
    const res = await API.delete(`/festival-permissions/${id}`);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function deleteFestivalPermission notice, falling back to direct DB delete:", err?.message);
  }

  const { data, error } = await supabase
    .from("festival_permissions")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Festival permission deleted successfully", data } };
};