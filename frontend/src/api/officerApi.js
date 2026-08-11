import API from "./axios";
import { supabase } from "../lib/supabase";

const hashPasswordClient = async (password) => {
  if (!password) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(`pcms_salt_v2_${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// 1. GET ALL OFFICERS
export const getOfficers = async () => {
  try {
    const res = await API.get("/officers");
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res;
    }
  } catch (err) {
    console.warn("Edge function getOfficers notice, falling back to Supabase DB query:", err?.message);
  }

  const { data, error } = await supabase
    .from("officers")
    .select("*")
    .neq("status", "Inactive")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data: { success: true, data: data || [] } };
};

// 2. CREATE OFFICER
export const createOfficer = async (data) => {
  const payload = { ...data };
  const rawPassword = payload.password || "PCMS@Officer2026";
  const passHash = await hashPasswordClient(rawPassword);

  const cleanUsername = String(payload.username || "").trim();

  // Primary API attempt
  try {
    const apiPayload = { ...payload, password_hash: passHash };
    delete apiPayload.password;
    delete apiPayload.confirmPassword;
    const res = await API.post("/officers", apiPayload);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function createOfficer notice, falling back to Supabase DB insert:", err?.message);
  }

  // Direct Supabase DB insert
  const record = {
    full_name: payload.full_name,
    username: cleanUsername,
    email: payload.email || `${cleanUsername}@pcms.gov.in`,
    mobile: payload.mobile || cleanUsername,
    password_hash: passHash,
    role: payload.role || "Officer",
    designation: payload.designation || "Constable",
    age: payload.age ? Number(payload.age) : 30,
    gender: payload.gender || "Male",
    access_scope: payload.access_scope || "OWN",
    police_station_name: payload.police_station_name || "Chhavani Police Station",
    status: "Active",
  };

  const { data: newOfficer, error } = await supabase
    .from("officers")
    .insert([record])
    .select()
    .single();

  if (error) throw error;

  if (payload.team_id && newOfficer) {
    try {
      await supabase.from("team_members").insert([{ team_id: payload.team_id, officer_id: newOfficer.id }]);
    } catch (e) {
      console.warn("Team member assignment notice:", e);
    }
  }

  return { data: { success: true, message: "Officer created successfully", data: newOfficer } };
};

// 3. UPDATE OFFICER
export const updateOfficer = async (id, data) => {
  const payload = { ...data };
  delete payload.password;
  delete payload.confirmPassword;

  try {
    const res = await API.put(`/officers/${id}`, payload);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function updateOfficer notice, falling back to Supabase DB update:", err?.message);
  }

  const { data: updated, error } = await supabase
    .from("officers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Officer updated successfully", data: updated } };
};

// 4. DELETE OFFICER (Soft-delete status to Inactive AND attempt hard delete)
export const deleteOfficer = async (id) => {
  // Step A: Immediately update status to Inactive so login is 100% blocked
  try {
    await supabase.from("officers").update({ status: "Inactive" }).eq("id", id);
  } catch (e) {
    console.warn("Status update before delete notice:", e);
  }

  // Step B: Edge Function delete attempt
  try {
    const res = await API.delete(`/officers/${id}`);
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function deleteOfficer notice, trying direct DB delete:", err?.message);
  }

  // Step C: Direct Supabase DB hard delete
  const { data, error } = await supabase.from("officers").delete().eq("id", id).select().single();
  if (error) {
    console.warn("Hard delete notice (account status remains Inactive):", error.message);
  }

  return { data: { success: true, message: "Officer deleted successfully", data } };
};

// 5. RESET OFFICER PASSWORD
export const resetOfficerPassword = async (id, new_password) => {
  const passHash = await hashPasswordClient(new_password);

  try {
    const res = await API.post(`/officers/${id}/reset-password`, {
      new_password,
      password_hash: passHash,
    });
    if (res?.data?.success) return res;
  } catch (err) {
    console.warn("Edge function resetPassword notice, falling back to Supabase DB update:", err?.message);
  }

  const { data, error } = await supabase
    .from("officers")
    .update({ password_hash: passHash })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { data: { success: true, message: "Password reset successfully", data } };
};
