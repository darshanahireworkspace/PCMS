import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const id = lastPart !== "officers" && lastPart !== "v1" ? lastPart : null;

  try {
    // 1. GET ALL OR SINGLE
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("officers").select("*").eq("id", id).single();
        if (error || !data) return sendError("Officer profile not found", null, 404);
        return sendSuccess("Officer profile retrieved successfully", data);
      }

      let query = supabase.from("officers").select("*", { count: "exact" }).order("created_at", { ascending: false });
      const station = url.searchParams.get("police_station");
      if (station) query = query.eq("police_station", station);

      const { data, error, count } = await query;
      if (error) throw error;
      return sendSuccess("Officers list retrieved successfully", data || [], { count: count || 0 });
    }

    // 2. CREATE (POST)
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.full_name || !body.username) {
        return sendError("Full name and username are required", null, 400);
      }

      const record = {
        ...body,
        status: body.status || "Active",
        role: body.role || "Officer",
      };

      const { data, error } = await supabase.from("officers").insert([record]).select().single();
      if (error) throw error;
      return sendSuccess("Officer created successfully", data, {}, 201);
    }

    // 3. UPDATE (PUT / PATCH)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();
      const { data, error } = await supabase.from("officers").update(body).eq("id", id).select().single();
      if (error) throw error;
      return sendSuccess("Officer profile updated successfully", data);
    }

    // 4. DELETE
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("officers").delete().eq("id", id);
      if (error) throw error;
      return sendSuccess("Officer deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
