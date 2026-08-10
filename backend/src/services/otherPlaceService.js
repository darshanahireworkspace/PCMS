const supabase = require("../config/supabase");

exports.getAllOtherPlaces = async (filters = {}) => {
  let query = supabase
    .from("other_places")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return { data: data || [], count: data ? data.length : 0 };
};

exports.getOtherPlaceById = async (id) => {
  const { data, error } = await supabase
    .from("other_places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

exports.createOtherPlace = async (payload, officerId) => {
  if (!payload.place_name?.trim() || !payload.category?.trim()) {
    throw { statusCode: 400, message: "Place name and category are required" };
  }

  const record = {
    ...payload,
    place_name: payload.place_name.trim(),
    category: payload.category.trim(),
    created_by: officerId || null,
  };

  const { data, error } = await supabase
    .from("other_places")
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.updateOtherPlace = async (id, payload) => {
  const { data, error } = await supabase
    .from("other_places")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.deleteOtherPlace = async (id) => {
  const { error } = await supabase
    .from("other_places")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};
