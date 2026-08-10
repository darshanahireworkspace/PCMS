const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");

exports.getAllOfficers = async () => {
  const { data, error } = await supabase
    .from("officers")
    .select("id, full_name, username, email, role, police_station_id, police_station_name, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: data || [], count: data ? data.length : 0 };
};

exports.getOfficerById = async (id) => {
  const { data, error } = await supabase
    .from("officers")
    .select("id, full_name, username, email, role, police_station_id, police_station_name, status, created_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

exports.createOfficer = async (payload) => {
  if (!payload.full_name || !payload.username || !payload.password) {
    throw { statusCode: 400, message: "Full name, username, and password are required" };
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const record = {
    full_name: payload.full_name,
    username: payload.username,
    email: payload.email || `${payload.username}@pcms.gov.in`,
    password_hash: passwordHash,
    role: payload.role || "Officer",
    police_station_id: payload.police_station_id || null,
    police_station_name: payload.police_station_name || null,
    status: payload.status || "Active",
  };

  const { data, error } = await supabase
    .from("officers")
    .insert([record])
    .select("id, full_name, username, email, role, police_station_name, status, created_at")
    .single();

  if (error) throw error;
  return data;
};

exports.updateOfficer = async (id, payload) => {
  const updateData = { ...payload };
  if (updateData.password) {
    updateData.password_hash = await bcrypt.hash(updateData.password, 10);
    delete updateData.password;
  }

  const { data, error } = await supabase
    .from("officers")
    .update(updateData)
    .eq("id", id)
    .select("id, full_name, username, email, role, police_station_name, status")
    .single();

  if (error) throw error;
  return data;
};

exports.deleteOfficer = async (id) => {
  const { error } = await supabase
    .from("officers")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
};
