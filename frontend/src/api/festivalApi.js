import { supabase } from "../lib/supabase";

const ALLOWED_FESTIVAL_COLUMNS = new Set([
  "id",
  "religious_place_id",
  "festival_name",
  "festival_year",
  "organizer_name",
  "president_name",
  "president_mobile",
  "secretary_name",
  "secretary_mobile",
  "permission_number",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "expected_crowd",
  "sound_permission",
  "procession",
  "route_details",
  "address",
  "area",
  "taluka",
  "district",
  "state",
  "pincode",
  "latitude",
  "longitude",
  "google_map_link",
  "photo_url",
  "verification_status",
  "permission_status",
  "assigned_officer",
  "police_notes",
  "risk_level",
  "created_by",
  "updated_by",
  "team_id",
  "created_at",
  "updated_at",
]);

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

const getActiveOfficerInfo = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem("pcms_admin_user") || "null");
    if (adminUser) {
      return {
        id: adminUser.id,
        isSuperAdmin: true,
        access_scope: "ALL",
      };
    }
    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (policeOfficer) {
      const isSuperAdmin =
        policeOfficer.role === "SuperAdmin" ||
        policeOfficer.role === "super_admin" ||
        policeOfficer.username === "SPMalegaon" ||
        policeOfficer.access_scope === "ALL";
      return {
        id: policeOfficer.id,
        isSuperAdmin,
        access_scope: isSuperAdmin ? "ALL" : (policeOfficer.access_scope || "OWN"),
      };
    }
  } catch (e) {
    console.warn("Active officer info parse notice:", e);
  }
  return null;
};

const sanitizeFestivalPayload = (data) => {
  const raw = { ...data };

  // UUID verification
  if (raw.religious_place_id && !isValidUuid(raw.religious_place_id)) {
    raw.religious_place_id = null;
  }
  if (raw.assigned_officer && !isValidUuid(raw.assigned_officer)) {
    raw.assigned_officer = null;
  }

  // Parse numbers
  raw.expected_crowd = raw.expected_crowd && !isNaN(parseInt(raw.expected_crowd, 10)) ? parseInt(raw.expected_crowd, 10) : 0;
  raw.latitude = raw.latitude && !isNaN(parseFloat(raw.latitude)) ? parseFloat(raw.latitude) : null;
  raw.longitude = raw.longitude && !isNaN(parseFloat(raw.longitude)) ? parseFloat(raw.longitude) : null;

  // Clean empty strings to null for optional columns
  if (!raw.start_date || raw.start_date === "") raw.start_date = null;
  if (!raw.end_date || raw.end_date === "") raw.end_date = null;
  if (!raw.start_time || raw.start_time === "") raw.start_time = null;
  if (!raw.end_time || raw.end_time === "") raw.end_time = null;

  const cleanPayload = {};
  Object.keys(raw).forEach((key) => {
    if (ALLOWED_FESTIVAL_COLUMNS.has(key)) {
      const val = raw[key];
      cleanPayload[key] = val === "" ? null : val;
    }
  });

  return cleanPayload;
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

// 2. GET FESTIVAL PERMISSIONS (Respects OWN access_scope for normal officers & GLOBAL for Super Admin)
export const getFestivalPermissions = async () => {
  const activeOfficer = getActiveOfficerInfo();
  let query = supabase.from("festival_permissions").select("*, religious_places(place_name, place_type)");

  if (activeOfficer && !activeOfficer.isSuperAdmin && activeOfficer.access_scope === "OWN" && activeOfficer.id) {
    query = query.or(`created_by.eq.${activeOfficer.id},assigned_officer.eq.${activeOfficer.id}`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  const formatted = (data || []).map((fp) => ({
    ...fp,
    place_name: fp.religious_places?.place_name || null,
  }));

  return { data: { success: true, data: formatted } };
};

// 3. GET SINGLE FESTIVAL PERMISSION
export const getSingleFestivalPermission = async (id) => {
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
  const { data, error } = await supabase
    .from("festival_permissions")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Festival permission deleted successfully", data } };
};