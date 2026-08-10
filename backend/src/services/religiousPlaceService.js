const supabase = require("../config/supabase");

exports.getAllReligiousPlaces = async (filters = {}) => {
  let query = supabase
    .from("religious_places")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.police_station) {
    query = query.eq("police_station", filters.police_station);
  }
  if (filters.place_type) {
    query = query.eq("place_type", filters.place_type);
  }
  if (filters.risk_level) {
    query = query.eq("risk_level", filters.risk_level);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || (data ? data.length : 0) };
};

exports.getReligiousPlaceById = async (id) => {
  const { data, error } = await supabase
    .from("religious_places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

exports.createReligiousPlace = async (payload, officerId) => {
  if (!payload.place_name || !payload.place_type) {
    throw { statusCode: 400, message: "Place name and place type are required" };
  }

  // Duplicate check
  const { data: existing } = await supabase
    .from("religious_places")
    .select("id, place_name")
    .or(`place_name.eq.${payload.place_name}`)
    .limit(1);

  if (existing && existing.length > 0) {
    throw { statusCode: 409, message: "Religious place already exists", existing: existing[0] };
  }

  const record = {
    ...payload,
    created_by: officerId || null,
  };

  const { data, error } = await supabase
    .from("religious_places")
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.updateReligiousPlace = async (id, payload) => {
  const { data, error } = await supabase
    .from("religious_places")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.deleteReligiousPlace = async (id) => {
  const { error } = await supabase
    .from("religious_places")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};
