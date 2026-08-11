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

export const getOfficers = () => API.get("/officers");

export const createOfficer = async (data) => {
  const payload = { ...data };
  if (payload.password) {
    payload.password_hash = await hashPasswordClient(payload.password);
    delete payload.password;
    delete payload.confirmPassword;
  }
  return API.post("/officers", payload);
};

export const updateOfficer = (id, data) => {
  const payload = { ...data };
  delete payload.password;
  delete payload.confirmPassword;
  return API.put(`/officers/${id}`, payload);
};

export const deleteOfficer = async (id) => {
  try {
    return await API.delete(`/officers/${id}`);
  } catch (err) {
    console.warn("Officers Edge function delete notice, trying client fallback:", err?.message);
    const { data, error } = await supabase.from("officers").delete().eq("id", id).select().single();
    if (error) throw error;
    return { data: { success: true, message: "Officer deleted successfully", data } };
  }
};

export const resetOfficerPassword = async (id, new_password) => {
  const passHash = await hashPasswordClient(new_password);
  return API.post(`/officers/${id}/reset-password`, {
    new_password,
    password_hash: passHash,
  });
};
