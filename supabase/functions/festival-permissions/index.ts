import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

const BUCKET_NAME = "city-management-photos";

const isValidUuid = (val: unknown): boolean => {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
};

const sanitizeFestivalPayload = (body: Record<string, unknown>): Record<string, unknown> => {
  const payload = { ...body };

  if (payload.religious_place_id !== undefined && payload.religious_place_id !== null) {
    const rawVal = String(payload.religious_place_id).trim();
    if (rawVal === "" || rawVal === "null" || rawVal === "undefined") {
      payload.religious_place_id = null;
    } else if (isValidUuid(rawVal)) {
      payload.religious_place_id = rawVal;
    } else {
      payload.religious_place_id = null;
    }
  } else {
    payload.religious_place_id = null;
  }

  if (payload.assigned_officer !== undefined && payload.assigned_officer !== null) {
    const rawOfficer = String(payload.assigned_officer).trim();
    if (rawOfficer === "" || rawOfficer === "null" || rawOfficer === "undefined") {
      payload.assigned_officer = null;
    } else if (isValidUuid(rawOfficer)) {
      payload.assigned_officer = rawOfficer;
    } else {
      payload.assigned_officer = null;
    }
  } else {
    payload.assigned_officer = null;
  }

  if (payload.start_date === "" || payload.start_date === "null") payload.start_date = null;
  if (payload.end_date === "" || payload.end_date === "null") payload.end_date = null;
  if (payload.festival_start_date === "" || payload.festival_start_date === "null") payload.festival_start_date = null;
  if (payload.festival_end_date === "" || payload.festival_end_date === "null") payload.festival_end_date = null;
  if (payload.procession_date === "" || payload.procession_date === "null") payload.procession_date = null;

  if (payload.start_time === "" || payload.start_time === "null") payload.start_time = null;
  if (payload.end_time === "" || payload.end_time === "null") payload.end_time = null;
  if (payload.procession_start_time === "" || payload.procession_start_time === "null") payload.procession_start_time = null;
  if (payload.procession_end_time === "" || payload.procession_end_time === "null") payload.procession_end_time = null;

  if (payload.expected_crowd !== undefined && payload.expected_crowd !== null && payload.expected_crowd !== "") {
    const crowdNum = parseInt(String(payload.expected_crowd), 10);
    payload.expected_crowd = isNaN(crowdNum) ? 0 : crowdNum;
  } else if (payload.expected_crowd === "") {
    payload.expected_crowd = 0;
  }

  if (payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== "") {
    const latNum = parseFloat(String(payload.latitude));
    payload.latitude = isNaN(latNum) ? null : latNum;
  } else if (payload.latitude === "") {
    payload.latitude = null;
  }

  if (payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== "") {
    const lngNum = parseFloat(String(payload.longitude));
    payload.longitude = isNaN(lngNum) ? null : lngNum;
  } else if (payload.longitude === "") {
    payload.longitude = null;
  }

  if (payload.organizer_name && !payload.mandal_name) {
    payload.mandal_name = payload.organizer_name;
  }
  if (payload.mandal_name && !payload.organizer_name) {
    payload.organizer_name = payload.mandal_name;
  }
  if (payload.president_mobile && !payload.contact_number) {
    payload.contact_number = payload.president_mobile;
  }
  if (payload.secretary_mobile && !payload.alternate_contact_number) {
    payload.alternate_contact_number = payload.secretary_mobile;
  }
  if (payload.route_details && !payload.procession_route) {
    payload.procession_route = payload.route_details;
  }

  delete payload.photo;
  delete payload.image;

  return payload;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const id = lastPart !== "festival-permissions" && lastPart !== "v1" ? lastPart : null;

  try {
    // 1. GET ALL OR SINGLE
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("festival_permissions").select("*").eq("id", id).single();
        if (error || !data) return sendError("Festival permission not found", null, 404);
        return sendSuccess("Festival permission retrieved successfully", data);
      }

      let query = supabase
        .from("festival_permissions")
        .select(
          `
          *,
          religious_places (
            place_name,
            place_type
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      const status = url.searchParams.get("permission_status");
      const riskLevel = url.searchParams.get("risk_level");
      if (status) query = query.eq("permission_status", status);
      if (riskLevel) query = query.eq("risk_level", riskLevel);

      const { data, error, count } = await query;
      if (error) throw error;

      const formatted = (data || []).map((fp: Record<string, unknown>) => ({
        ...fp,
        place_name: (fp.religious_places as { place_name?: string })?.place_name || null,
      }));

      return sendSuccess("Festival permissions retrieved successfully", formatted, { count: count || 0 });
    }

    // AUTH CHECK FOR WRITE OPERATIONS
    const authUser = await verifyOfficerToken(req);

    // 2. CREATE (POST)
    if (req.method === "POST") {
      let body: Record<string, unknown> = {};
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        formData.forEach((val, key) => {
          body[key] = val;
        });
      } else {
        body = await req.json();
      }

      const rawPayload = sanitizeFestivalPayload(body);
      const record = {
        ...rawPayload,
        assigned_officer: authUser?.id || rawPayload.assigned_officer || null,
        verification_status: rawPayload.verification_status || "Pending",
        permission_status: rawPayload.permission_status || "Pending",
        risk_level: rawPayload.risk_level || "Low",
      };

      if (!record.festival_name || !record.organizer_name) {
        return sendError("Festival name and mandal name are required", null, 400);
      }

      const { data, error } = await supabase.from("festival_permissions").insert([record]).select().single();
      if (error) throw error;
      return sendSuccess("Festival permission created successfully", data, {}, 201);
    }

    // 3. UPDATE (PUT / PATCH)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      let body: Record<string, unknown> = {};
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        formData.forEach((val, key) => {
          body[key] = val;
        });
      } else {
        body = await req.json();
      }

      const rawPayload = sanitizeFestivalPayload(body);

      const { data, error } = await supabase.from("festival_permissions").update(rawPayload).eq("id", id).select().single();
      if (error) throw error;
      return sendSuccess("Festival permission updated successfully", data);
    }

    // 4. DELETE
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("festival_permissions").delete().eq("id", id);
      if (error) throw error;
      return sendSuccess("Festival permission deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
