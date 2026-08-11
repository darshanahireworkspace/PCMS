import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

const BUCKET_NAME = "city-management-photos";

// Haversine GPS Distance helper (in meters)
const getGpsDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Photo Upload Helper
const uploadPhotoIfPresent = async (body: Record<string, unknown>, folder = "religious-places"): Promise<string | null> => {
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
        const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

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
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const id = lastPart !== "religious-places" && lastPart !== "v1" && lastPart !== "check-duplicate" ? lastPart : null;

  try {
    const authUser = await verifyOfficerToken(req);

    // DUPLICATE LOCATION CHECK ENDPOINT (POST /religious-places/check-duplicate)
    if (req.method === "POST" && pathParts.includes("check-duplicate")) {
      const body = await req.json();
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      const name = String(body.place_name || "").trim().toLowerCase();

      const { data: allPlaces } = await supabase
        .from("religious_places")
        .select("id, place_name, place_type, address, area, latitude, longitude, image_url, photo_url, created_by, created_at");

      if (allPlaces && allPlaces.length > 0) {
        for (const place of allPlaces) {
          let isDuplicate = false;
          let distanceMeters = 99999;

          if (place.latitude && place.longitude && !isNaN(lat) && !isNaN(lng)) {
            distanceMeters = getGpsDistanceMeters(lat, lng, Number(place.latitude), Number(place.longitude));
            if (distanceMeters <= 100) {
              isDuplicate = true;
            }
          }

          if (!isDuplicate && name && place.place_name?.toLowerCase().includes(name)) {
            isDuplicate = true;
          }

          if (isDuplicate) {
            // Fetch creator officer info
            let creatorName = "Registered Officer";
            if (place.created_by) {
              const { data: creator } = await supabase.from("officers").select("full_name").eq("id", place.created_by).single();
              if (creator) creatorName = creator.full_name;
            }

            // Fetch visit history count
            const { count: visitCount } = await supabase
              .from("place_visits")
              .select("id", { count: "exact", head: true })
              .eq("place_id", place.id);

            return sendSuccess("Potential duplicate location detected", {
              isDuplicate: true,
              distanceMeters,
              existingPlace: {
                ...place,
                creator_name: creatorName,
                visit_count: (visitCount || 0) + 1,
              },
            });
          }
        }
      }

      return sendSuccess("No duplicate location detected", { isDuplicate: false });
    }

    // 1. GET ALL OR SINGLE
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("religious_places").select("*").eq("id", id).single();
        if (error || !data) return sendError("Religious place not found", null, 404);
        return sendSuccess("Religious place retrieved successfully", data);
      }

      let query = supabase.from("religious_places").select("*", { count: "exact" }).order("created_at", { ascending: false });

      const station = url.searchParams.get("police_station");
      const placeType = url.searchParams.get("place_type");
      const riskLevel = url.searchParams.get("risk_level");

      if (station) query = query.eq("police_station", station);
      if (placeType) query = query.eq("place_type", placeType);
      if (riskLevel) query = query.eq("risk_level", riskLevel);

      // Data Access Scope Filtering
      if (authUser && authUser.role !== "SuperAdmin" && authUser.role !== "HeadOfficer" && authUser.access_scope !== "ALL") {
        if (authUser.access_scope === "TEAM" && authUser.team_id) {
          query = query.or(`created_by.eq.${authUser.id},team_id.eq.${authUser.team_id}`);
        } else {
          // Default OWN scope
          query = query.eq("created_by", authUser.id);
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return sendSuccess("Religious places retrieved successfully", data || [], { count: count || 0 });
    }

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

      if (!body.place_name || !body.place_type) {
        return sendError("Place name and place type are required", null, 400);
      }

      const photoUrl = await uploadPhotoIfPresent(body, "religious-places");
      const record = {
        ...body,
        photo_url: photoUrl,
        image_url: photoUrl || body.image_url,
        created_by: authUser?.id || null,
        team_id: authUser?.team_id || null,
      };
      delete record.photo;

      const { data, error } = await supabase.from("religious_places").insert([record]).select().single();
      if (error) throw error;

      // Log initial visit
      if (authUser?.id && data?.id) {
        await supabase.from("place_visits").insert([
          {
            place_id: data.id,
            entity_type: "religious_place",
            officer_id: authUser.id,
            officer_name: authUser.full_name || authUser.username,
            notes: "Initial registration visit",
            photo_url: photoUrl,
          },
        ]);

        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "CREATE_RELIGIOUS_PLACE",
            entity_type: "religious_places",
            entity_id: data.id,
            description: `Registered religious place ${data.place_name}`,
          },
        ]);
      }

      return sendSuccess("Religious place created successfully", data, {}, 201);
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

      const photoUrl = await uploadPhotoIfPresent(body, "religious-places");
      const record = { ...body };
      if (photoUrl !== undefined && photoUrl !== null) {
        record.photo_url = photoUrl;
        record.image_url = photoUrl;
      }
      delete record.photo;

      const { data, error } = await supabase.from("religious_places").update(record).eq("id", id).select().single();
      if (error) throw error;

      if (authUser?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "UPDATE_RELIGIOUS_PLACE",
            entity_type: "religious_places",
            entity_id: id,
            description: `Updated religious place ${data.place_name}`,
          },
        ]);
      }

      return sendSuccess("Religious place updated successfully", data);
    }

    // 4. DELETE
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("religious_places").delete().eq("id", id);
      if (error) throw error;

      if (authUser?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "DELETE_RELIGIOUS_PLACE",
            entity_type: "religious_places",
            entity_id: id,
            description: `Deleted religious place ID ${id}`,
          },
        ]);
      }

      return sendSuccess("Religious place deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
