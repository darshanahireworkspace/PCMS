import API from "./axios";
import { supabase } from "../lib/supabase";

export const getAuditLogs = async (params = {}) => {
  try {
    const limit = params.limit || 150;
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return { data: { data } };
    }
    return await API.get("/audit-logs", { params });
  } catch (err) {
    console.warn("Audit logs warning:", err?.message);
    return { data: { data: [] } };
  }
};
