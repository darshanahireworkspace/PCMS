import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

const BUCKET_NAME = "city-management-photos";

const uploadPhotoIfPresent = async (body: Record<string, unknown>, folder = "other-places"): Promise<string | null> => {
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
  const id = lastPart !== "other-places" && lastPart !== "v1" ? lastPart : null;

  try {
    const authUser = await verifyOfficerToken(req);

    // 1. GET ALL OR SINGLE
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("other_places").select("*").eq("id", id).single();
        if (error || !data) return sendError("Record not found", null, 404);
        return sendSuccess("Other place retrieved successfully", data);
      }

      let query = supabase.from("other_places").select("*", { count: "exact" }).order("created_at", { ascending: false });
      const category = url.searchParams.get("category");
      if (category) query = query.eq("category", category);

      // Access Scope Filtering
      if (authUser && authUser.role !== "SuperAdmin" && authUser.role !== "HeadOfficer" && authUser.access_scope !== "ALL") {
        if (authUser.access_scope === "TEAM" && authUser.team_id) {
          query = query.or(`created_by.eq.${authUser.id},team_id.eq.${authUser.team_id}`);
        } else {
          query = query.eq("created_by", authUser.id);
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return sendSuccess("Other places retrieved successfully", data || [], { count: count || 0 });
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

      const photoUrl = await uploadPhotoIfPresent(body, "other-places");
      const record = {
        ...body,
        photo_url: photoUrl,
        created_by: authUser?.id || null,
        team_id: authUser?.team_id || null,
      };
      delete record.photo;

      const { data, error } = await supabase.from("other_places").insert([record]).select().single();
      if (error) throw error;

      if (authUser?.id && data?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "CREATE_OTHER_PLACE",
            entity_type: "other_places",
            entity_id: data.id,
            description: `Created other place record ${data.place_name}`,
          },
        ]);
      }

      return sendSuccess("Other place created successfully", data, {}, 201);
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

      const photoUrl = await uploadPhotoIfPresent(body, "other-places");
      const record = { ...body };
      if (photoUrl !== undefined && photoUrl !== null) {
        record.photo_url = photoUrl;
      }
      delete record.photo;

      const { data, error } = await supabase.from("other_places").update(record).eq("id", id).select().single();
      if (error) throw error;

      if (authUser?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "UPDATE_OTHER_PLACE",
            entity_type: "other_places",
            entity_id: id,
            description: `Updated other place record ${data.place_name}`,
          },
        ]);
      }

      return sendSuccess("Other place updated successfully", data);
    }

    // 4. DELETE
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("other_places").delete().eq("id", id);
      if (error) throw error;

      if (authUser?.id) {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser.id,
            user_name: authUser.username,
            action: "DELETE_OTHER_PLACE",
            entity_type: "other_places",
            entity_id: id,
            description: `Deleted other place ID ${id}`,
          },
        ]);
      }

      return sendSuccess("Other place deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
