import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const authUser = await verifyOfficerToken(req);
    if (authUser?.role !== "SuperAdmin" && authUser?.role !== "Admin") {
      return sendError("Access denied: Admin privileges required", null, 403);
    }

    if (req.method === "GET") {
      let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });

      const action = url.searchParams.get("action");
      const user = url.searchParams.get("user");
      const limit = parseInt(url.searchParams.get("limit") || "100", 10);

      if (action) query = query.eq("action", action);
      if (user) query = query.ilike("user_name", `%${user}%`);

      query = query.limit(limit);

      const { data, error, count } = await query;
      if (error) throw error;

      return sendSuccess("Audit logs retrieved successfully", data || [], { count: count || 0 });
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
