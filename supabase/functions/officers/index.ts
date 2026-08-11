import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken, hashPassword } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const id = lastPart !== "officers" && lastPart !== "v1" && lastPart !== "reset-password" ? lastPart : null;

  try {
    const authUser = await verifyOfficerToken(req);

    // 1. GET ALL OR SINGLE OFFICER
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("officers").select("*").eq("id", id).single();
        if (error || !data) return sendError("Officer profile not found", null, 404);
        return sendSuccess("Officer profile retrieved successfully", data);
      }

      let query = supabase.from("officers").select("*", { count: "exact" }).order("created_at", { ascending: false });
      const station = url.searchParams.get("police_station");
      if (station) query = query.eq("police_station_name", station);

      const { data, error, count } = await query;
      if (error) throw error;
      return sendSuccess("Officers list retrieved successfully", data || [], { count: count || 0 });
    }

    // Authorization check for modifying operations (SuperAdmin or Admin required)
    if (authUser?.role !== "SuperAdmin" && authUser?.role !== "Admin") {
      return sendError("Access denied: Super Admin privileges required", null, 403);
    }

    // 4. RESET PASSWORD ENDPOINT (POST /officers/:id/reset-password)
    if (req.method === "POST" && pathParts.includes("reset-password")) {
      const targetId = pathParts[pathParts.indexOf("reset-password") - 1] || id;
      const body = await req.json();
      if (!body.new_password && !body.password_hash) {
        return sendError("New password is required", null, 400);
      }

      const passHash = body.password_hash || (await hashPassword(body.new_password));
      const { data, error } = await supabase
        .from("officers")
        .update({ password_hash: passHash })
        .eq("id", targetId)
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser?.id,
            user_name: authUser?.username,
            action: "RESET_PASSWORD",
            entity_type: "officers",
            entity_id: targetId,
            description: `Reset password for officer ${data.full_name}`,
          },
        ]);
      } catch (e) {
        console.warn("Audit log notice:", e);
      }

      return sendSuccess("Password reset successfully", { id: data.id });
    }

    // 2. CREATE OFFICER (POST /officers)
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.full_name || !body.username) {
        return sendError("Full name and username are required", null, 400);
      }

      const cleanUsername = String(body.username).trim();

      // Check if username already exists
      const { data: existing } = await supabase
        .from("officers")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existing) {
        return sendError("Username already exists", null, 400);
      }

      const rawPass = body.password || "PCMS@Officer2026";
      const passHash = body.password_hash || (await hashPassword(rawPass));

      const record = {
        full_name: body.full_name,
        username: cleanUsername,
        email: body.email || `${cleanUsername}@pcms.gov.in`,
        mobile: body.mobile || cleanUsername,
        password_hash: passHash,
        role: body.role || "Officer",
        designation: body.designation || "Constable",
        age: body.age ? Number(body.age) : 30,
        gender: body.gender || "Male",
        access_scope: body.access_scope || "OWN",
        police_station_id: body.police_station_id || null,
        police_station_name: body.police_station_name || "Chhavani Police Station",
        status: body.status || "Active",
      };

      const { data, error } = await supabase.from("officers").insert([record]).select().single();
      if (error) {
        console.error("Error inserting officer:", error);
        return sendError("Failed to create officer record", error.message, 500);
      }

      if (body.team_id && data) {
        try {
          await supabase.from("team_members").insert([{ team_id: body.team_id, officer_id: data.id }]);
        } catch (e) {
          console.warn("Team assignment notice:", e);
        }
      }

      try {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser?.id,
            user_name: authUser?.username,
            action: "CREATE_OFFICER",
            entity_type: "officers",
            entity_id: data.id,
            description: `Created officer ${data.full_name} (${data.role}, scope: ${data.access_scope})`,
          },
        ]);
      } catch (e) {
        console.warn("Audit log notice:", e);
      }

      return sendSuccess("Officer created successfully", data, {}, 201);
    }

    // 3. UPDATE OFFICER (PUT / PATCH)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();

      const allowedKeys = [
        "full_name",
        "mobile",
        "age",
        "gender",
        "email",
        "police_station_name",
        "police_station_id",
        "designation",
        "role",
        "access_scope",
        "status",
      ];

      const updateData: Record<string, unknown> = {};
      for (const key of allowedKeys) {
        if (body[key] !== undefined) {
          updateData[key] = body[key];
        }
      }

      const { data, error } = await supabase.from("officers").update(updateData).eq("id", id).select().single();
      if (error) {
        console.error("Error updating officer:", error);
        return sendError("Failed to update officer profile", error.message, 500);
      }

      try {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser?.id,
            user_name: authUser?.username,
            action: "UPDATE_OFFICER",
            entity_type: "officers",
            entity_id: id,
            description: `Updated officer ${data.full_name}`,
          },
        ]);
      } catch (e) {
        console.warn("Audit log notice:", e);
      }

      return sendSuccess("Officer profile updated successfully", data);
    }

    // 5. DELETE / DEACTIVATE OFFICER
    if (req.method === "DELETE" && id) {
      const { data: targetOfficer } = await supabase.from("officers").select("username, role").eq("id", id).single();
      if (targetOfficer?.username === "SPMalegaon" || targetOfficer?.role === "SuperAdmin") {
        return sendError("Access denied: SPMalegaon Super Admin account cannot be deleted or deactivated", null, 403);
      }

      const { data, error } = await supabase
        .from("officers")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.from("audit_logs").insert([
          {
            user_id: authUser?.id,
            user_name: authUser?.username,
            action: "DELETE_OFFICER",
            entity_type: "officers",
            entity_id: id,
            description: `Deleted officer ${data?.full_name || id}`,
          },
        ]);
      } catch (e) {
        console.warn("Audit log notice:", e);
      }

      return sendSuccess("Officer deleted successfully", data);
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
