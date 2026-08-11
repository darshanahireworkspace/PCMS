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
  const id = lastPart !== "police-stations" && lastPart !== "v1" ? lastPart : null;

  try {
    // 1. GET ALL OR SINGLE
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("police_stations").select("*").eq("id", id).single();
        if (error || !data) return sendError("Police station not found", null, 404);
        return sendSuccess("Police station retrieved successfully", data);
      }

      const { data, error, count } = await supabase
        .from("police_stations")
        .select("*", { count: "exact" })
        .order("station_name", { ascending: true });
      if (error) throw error;
      return sendSuccess("Police stations retrieved successfully", data || [], { count: count || 0 });
    }

    // 2. CREATE (POST)
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.station_name) {
        return sendError("Police station name is required", null, 400);
      }

      const { data, error } = await supabase.from("police_stations").insert([body]).select().single();
      if (error) throw error;
      return sendSuccess("Police station created successfully", data, {}, 201);
    }

    // 3. UPDATE (PUT / PATCH)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();
      const { data, error } = await supabase.from("police_stations").update(body).eq("id", id).select().single();
      if (error) throw error;
      return sendSuccess("Police station updated successfully", data);
    }

    // 4. DELETE
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("police_stations").delete().eq("id", id);
      if (error) throw error;
      return sendSuccess("Police station deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
