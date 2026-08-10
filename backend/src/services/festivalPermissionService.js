const supabase = require("../config/supabase");

exports.getAllFestivalPermissions = async (filters = {}) => {
  let query = supabase
    .from("festival_permissions")
    .select(`
      *,
      religious_places (
        place_name,
        place_type,
        area,
        latitude,
        longitude
      )
    `)
    .order("created_at", { ascending: false });

  if (filters.permission_status) {
    query = query.eq("permission_status", filters.permission_status);
  }
  if (filters.verification_status) {
    query = query.eq("verification_status", filters.verification_status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Format response for backwards compatibility
  const formatted = (data || []).map((fp) => ({
    ...fp,
    place_name: fp.religious_places?.place_name || null,
    place_type: fp.religious_places?.place_type || null,
    permanent_area: fp.religious_places?.area || null,
    permanent_latitude: fp.religious_places?.latitude || null,
    permanent_longitude: fp.religious_places?.longitude || null,
  }));

  return { data: formatted, count: formatted.length };
};

exports.getFestivalPermissionById = async (id) => {
  const { data, error } = await supabase
    .from("festival_permissions")
    .select(`
      *,
      religious_places (
        place_name,
        place_type,
        area
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    place_name: data?.religious_places?.place_name || null,
    place_type: data?.religious_places?.place_type || null,
  };
};

exports.createFestivalPermission = async (payload, officerId) => {
  if (!payload.festival_name || !payload.organizer_name) {
    throw { statusCode: 400, message: "Festival name and mandal name are required" };
  }

  let record = {
    ...payload,
    assigned_officer: officerId || null,
    verification_status: payload.verification_status || "Pending",
    permission_status: payload.permission_status || "Pending",
    risk_level: payload.risk_level || "Low",
  };

  let attempts = 0;
  while (attempts < 5) {
    const { data, error } = await supabase
      .from("festival_permissions")
      .insert([record])
      .select()
      .single();

    if (!error) return data;

    const match = error.message && error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] && record[match[1]] !== undefined) {
      delete record[match[1]];
      attempts++;
    } else {
      throw error;
    }
  }

  throw { statusCode: 500, message: "Failed to create festival permission due to schema mismatch" };
};

exports.updateFestivalPermission = async (id, payload) => {
  let record = { ...payload };

  let attempts = 0;
  while (attempts < 5) {
    const { data, error } = await supabase
      .from("festival_permissions")
      .update(record)
      .eq("id", id)
      .select()
      .single();

    if (!error) return data;

    const match = error.message && error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] && record[match[1]] !== undefined) {
      delete record[match[1]];
      attempts++;
    } else {
      throw error;
    }
  }

  throw { statusCode: 500, message: "Failed to update festival permission due to schema mismatch" };
};

exports.deleteFestivalPermission = async (id) => {
  const { error } = await supabase
    .from("festival_permissions")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};
