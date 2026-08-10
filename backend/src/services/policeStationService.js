const supabase = require("../config/supabase");

exports.getAllPoliceStations = async () => {
  const { data, error } = await supabase
    .from("police_stations")
    .select("*")
    .order("station_name", { ascending: true });

  if (error) throw error;
  return { data: data || [], count: data ? data.length : 0 };
};

exports.getPoliceStationById = async (id) => {
  const { data, error } = await supabase
    .from("police_stations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

exports.createPoliceStation = async (payload) => {
  if (!payload.station_name || !payload.station_code) {
    throw { statusCode: 400, message: "Station name and station code are required" };
  }

  const { data, error } = await supabase
    .from("police_stations")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.updatePoliceStation = async (id, payload) => {
  const { data, error } = await supabase
    .from("police_stations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

exports.deletePoliceStation = async (id) => {
  const { error } = await supabase
    .from("police_stations")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};
