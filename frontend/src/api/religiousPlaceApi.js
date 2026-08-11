import { supabase } from "../lib/supabase";

const ALLOWED_RELIGIOUS_PLACE_COLUMNS = new Set([
  "id",
  "place_name",
  "religion",
  "place_type",
  "address",
  "area",
  "ward",
  "taluka",
  "district",
  "state",
  "pincode",
  "latitude",
  "longitude",
  "google_map_link",
  "police_station",
  "regular_crowd",
  "special_day_crowd",
  "risk_level",
  "contact_person",
  "contact_mobile",
  "president_name",
  "secretary_name",
  "committee_details",
  "sensitive_notes",
  "cctv_available",
  "cctv_count",
  "image_url",
  "photo_url",
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

const sanitizeReligiousPlacePayload = (data) => {
  const raw = { ...data };

  // Parse numbers
  raw.latitude = raw.latitude && !isNaN(parseFloat(raw.latitude)) ? parseFloat(raw.latitude) : null;
  raw.longitude = raw.longitude && !isNaN(parseFloat(raw.longitude)) ? parseFloat(raw.longitude) : null;
  raw.cctv_count = raw.cctv_count && !isNaN(parseInt(raw.cctv_count, 10)) ? parseInt(raw.cctv_count, 10) : 0;

  // Map crowd estimation to integer if string provided
  if (typeof raw.regular_crowd === "string") {
    if (raw.regular_crowd === "Low") raw.regular_crowd = 100;
    else if (raw.regular_crowd === "Medium") raw.regular_crowd = 500;
    else if (raw.regular_crowd === "High") raw.regular_crowd = 1000;
    else if (raw.regular_crowd === "Critical") raw.regular_crowd = 5000;
    else raw.regular_crowd = parseInt(raw.regular_crowd, 10) || 0;
  }

  // Parse booleans
  if (raw.cctv_available !== undefined) {
    raw.cctv_available = raw.cctv_available === true || raw.cctv_available === "true" || raw.cctv_available === "Yes";
  }

  // Handle sensitive notes / notes field mapping
  if (raw.sensitive_notes || raw.notes) {
    raw.sensitive_notes = raw.sensitive_notes || raw.notes;
  }

  // Filter ONLY valid DB columns
  const cleanPayload = {};
  Object.keys(raw).forEach((key) => {
    if (ALLOWED_RELIGIOUS_PLACE_COLUMNS.has(key)) {
      const val = raw[key];
      cleanPayload[key] = val === "" ? null : val;
    }
  });

  return cleanPayload;
};

// 1. CREATE RELIGIOUS PLACE
export const createReligiousPlace = async (inputData) => {
  let objectData = inputData;

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

  const { data, error } = await supabase
    .from("religious_places")
    .insert([cleanRecord])
    .select()
    .single();

  if (error) {
    console.error("Supabase religious_places insert error:", error);
    throw { response: { status: 500, data: { message: error.message || "Failed to save religious place record" } } };
  }

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

// 2. GET RELIGIOUS PLACES (Respects OWN access_scope for normal officers & GLOBAL for Super Admin)
export const getReligiousPlaces = async () => {
  const activeOfficer = getActiveOfficerInfo();
  let query = supabase.from("religious_places").select("*");

  if (activeOfficer && !activeOfficer.isSuperAdmin && activeOfficer.access_scope === "OWN" && activeOfficer.id) {
    query = query.eq("created_by", activeOfficer.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};

// 3. GET SINGLE RELIGIOUS PLACE
export const getSingleReligiousPlace = async (id) => {
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
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    const name = String(data.place_name || "").trim().toLowerCase();

    const { data: allPlaces } = await supabase
      .from("religious_places")
      .select("id, place_name, place_type, address, area, latitude, longitude, image_url, photo_url, created_by, created_at");

    if (allPlaces && allPlaces.length > 0) {
      for (const place of allPlaces) {
        let isDuplicate = false;
        let distanceMeters = 99999;

        if (place.latitude && place.longitude && !isNaN(lat) && !isNaN(lng)) {
          const lat1 = (lat * Math.PI) / 180;
          const lat2 = (Number(place.latitude) * Math.PI) / 180;
          const dLat = ((Number(place.latitude) - lat) * Math.PI) / 180;
          const dLon = ((Number(place.longitude) - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          distanceMeters = Math.round(6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          if (distanceMeters <= 100) isDuplicate = true;
        }

        if (!isDuplicate && name && place.place_name?.toLowerCase().includes(name)) {
          isDuplicate = true;
        }

        if (isDuplicate) {
          return {
            data: {
              success: true,
              data: {
                isDuplicate: true,
                distanceMeters,
                existingPlace: place,
              },
            },
          };
        }
      }
    }
  } catch (err) {
    console.warn("Check duplicate notice:", err);
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
  const { data, error } = await supabase
    .from("place_visits")
    .select("*")
    .eq("place_id", placeId)
    .order("visited_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};