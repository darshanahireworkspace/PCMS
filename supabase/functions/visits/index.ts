import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

const BUCKET_NAME = "city-management-photos";

const uploadPhotoIfPresent = async (body: Record<string, unknown>): Promise<string | null> => {
  if (typeof body.photo_url === "string" && body.photo_url.startsWith("http")) {
    return body.photo_url;
  }

  if (typeof body.photo === "string" && body.photo.startsWith("data:image")) {
    try {
      const match = body.photo.match(/^data:(image\/\w+);base64,(.*)$/);
      if (match) {
        const mimeType = match[1];
        const ext = mimeType.split("/")[1] || "jpeg";
        const base64Data = match[2];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const fileName = `visits/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

        const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, binaryData, {
          contentType: mimeType,
          upsert: true,
        });

        if (!error) {
          const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          return urlData?.publicUrl || fileName;
        }
      }
    } catch (err) {
      console.error("Storage upload error:", err);
    }
  }

  return (body.photo_url as string) || null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const authUser = await verifyOfficerToken(req);

    // 1. GET VISITS FOR A PLACE (GET /visits?place_id=xxx)
    if (req.method === "GET") {
      const placeId = url.searchParams.get("place_id");
      let query = supabase.from("place_visits").select("*").order("visit_date", { ascending: false });

      if (placeId) {
        query = query.eq("place_id", placeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return sendSuccess("Place visits retrieved successfully", data || []);
    }

    // 2. CREATE VISIT (POST /visits)
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.place_id) {
        return sendError("Place ID is required", null, 400);
      }

      const photoUrl = await uploadPhotoIfPresent(body);
      const record = {
        place_id: body.place_id,
        entity_type: body.entity_type || "religious_place",
        officer_id: authUser?.id || null,
        officer_name: authUser?.full_name || authUser?.username || "Officer",
        visit_date: new Date().toISOString(),
        notes: body.notes || "Verification visit",
        photo_url: photoUrl,
      };

      const { data, error } = await supabase.from("place_visits").insert([record]).select().single();
      if (error) throw error;

      if (authUser?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "VERIFY_VISIT",
            entity_type: body.entity_type || "religious_places",
            entity_id: body.place_id,
            description: `Officer ${authUser.full_name || authUser.username} recorded verification visit`,
          },
        ]);
      }

      return sendSuccess("Verification visit recorded successfully", data, {}, 201);
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
