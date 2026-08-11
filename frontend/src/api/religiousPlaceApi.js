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

  // Direct database insert
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
  const { data, error } = await supabase
    .from("religious_places")
    .select("*")
    .order("created_at", { ascending: false });

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