import { supabase } from "../lib/supabase";

const ALLOWED_OTHER_PLACE_COLUMNS = new Set([
  "id",
  "place_name",
  "category",
  "owner_name",
  "mobile",
  "address",
  "area",
  "latitude",
  "longitude",
  "google_map_link",
  "photo_url",
  "notes",
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
    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (policeOfficer?.id && isValidUuid(policeOfficer.id)) return policeOfficer.id;
    const adminUser = JSON.parse(localStorage.getItem("pcms_admin_user") || "null");
    if (adminUser?.id && isValidUuid(adminUser.id)) return adminUser.id;
  } catch (e) {
    console.warn("Active user parse notice:", e);
  }
  return null;
};

const getActiveOfficerInfo = () => {
  try {
    // 1. Inspect active normal officer session FIRST
    const policeOfficerStr = localStorage.getItem("policeOfficer");
    if (policeOfficerStr && policeOfficerStr !== "null" && policeOfficerStr !== "undefined") {
      const policeOfficer = JSON.parse(policeOfficerStr);
      if (policeOfficer && typeof policeOfficer === "object") {
        const isSuperAdmin =
          policeOfficer.role === "SuperAdmin" ||
          policeOfficer.role === "super_admin" ||
          policeOfficer.username === "SPMalegaon" ||
          policeOfficer.access_scope === "ALL";

        return {
          id: policeOfficer.id,
          username: policeOfficer.username,
          role: policeOfficer.role || "Officer",
          access_scope: isSuperAdmin ? "ALL" : (policeOfficer.access_scope || "OWN"),
          isSuperAdmin,
        };
      }
    }

    // 2. Fallback to admin user ONLY if no normal officer session is active
    const adminUserStr = localStorage.getItem("pcms_admin_user");
    if (adminUserStr && adminUserStr !== "null" && adminUserStr !== "undefined") {
      const adminUser = JSON.parse(adminUserStr);
      if (adminUser && typeof adminUser === "object") {
        return {
          id: adminUser.id,
          username: adminUser.username || "SPMalegaon",
          role: "SuperAdmin",
          access_scope: "ALL",
          isSuperAdmin: true,
        };
      }
    }
  } catch (e) {
    console.warn("Active officer info parse notice:", e);
  }
  return null;
};

const sanitizeOtherPlacePayload = (data) => {
  const raw = { ...data };

  raw.latitude = raw.latitude && !isNaN(parseFloat(raw.latitude)) ? parseFloat(raw.latitude) : null;
  raw.longitude = raw.longitude && !isNaN(parseFloat(raw.longitude)) ? parseFloat(raw.longitude) : null;

  const cleanPayload = {};
  Object.keys(raw).forEach((key) => {
    if (ALLOWED_OTHER_PLACE_COLUMNS.has(key)) {
      const val = raw[key];
      cleanPayload[key] = val === "" ? null : val;
    }
  });

  return cleanPayload;
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

// 2. GET OTHER PLACES (Respects OWN access_scope for normal officers & GLOBAL for Super Admin)
export const getOtherPlaces = async () => {
  const activeOfficer = getActiveOfficerInfo();
  let query = supabase.from("other_places").select("*");

  if (activeOfficer && !activeOfficer.isSuperAdmin && activeOfficer.access_scope === "OWN" && activeOfficer.id) {
    query = query.eq("created_by", activeOfficer.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

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