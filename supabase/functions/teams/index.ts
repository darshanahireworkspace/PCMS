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
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const id = lastPart !== "teams" && lastPart !== "v1" ? lastPart : null;

  try {
    const authUser = await verifyOfficerToken(req);

    // 1. GET ALL OR SINGLE TEAM
    if (req.method === "GET") {
      if (id) {
        const { data: team, error } = await supabase.from("teams").select("*").eq("id", id).single();
        if (error || !team) return sendError("Team not found", null, 404);

        const { data: members } = await supabase
          .from("team_members")
          .select("officer_id, officers(id, full_name, role, username)")
          .eq("team_id", id);

        return sendSuccess("Team retrieved successfully", { ...team, members: members || [] });
      }

      const { data: teams, error, count } = await supabase
        .from("teams")
        .select("*, team_members(officer_id, officers(id, full_name, role, username))", { count: "exact" })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return sendSuccess("Teams list retrieved successfully", teams || [], { count: count || 0 });
    }

    if (authUser?.role !== "SuperAdmin" && authUser?.role !== "Admin") {
      return sendError("Access denied: Admin privileges required", null, 403);
    }

    // 2. CREATE TEAM (POST)
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.team_name) {
        return sendError("Team name is required", null, 400);
      }

      const { data: team, error } = await supabase
        .from("teams")
        .insert([
          {
            team_name: String(body.team_name).trim(),
            description: body.description || "",
            police_station_id: body.police_station_id || null,
            data_sharing: body.data_sharing ?? true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add initial members if provided
      if (Array.isArray(body.member_ids) && body.member_ids.length > 0) {
        const memberRows = body.member_ids.map((officerId: string) => ({
          team_id: team.id,
          officer_id: officerId,
        }));
        await supabase.from("team_members").insert(memberRows);
      }

      await supabase.from("audit_logs").insert([
        {
          user_id: authUser?.id,
          user_name: authUser?.username,
          action: "CREATE_TEAM",
          entity_type: "teams",
          entity_id: team.id,
          description: `Created team ${team.team_name}`,
        },
      ]);

      return sendSuccess("Team created successfully", team, {}, 201);
    }

    // 3. UPDATE TEAM (PUT/PATCH)
    if ((req.method === "PUT" || req.method === "PATCH") && id) {
      const body = await req.json();
      const updateData: Record<string, unknown> = {};

      if (body.team_name !== undefined) updateData.team_name = String(body.team_name).trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.data_sharing !== undefined) updateData.data_sharing = Boolean(body.data_sharing);

      const { data: team, error } = await supabase.from("teams").update(updateData).eq("id", id).select().single();
      if (error) throw error;

      // Replace members if member_ids is provided
      if (Array.isArray(body.member_ids)) {
        await supabase.from("team_members").delete().eq("team_id", id);
        if (body.member_ids.length > 0) {
          const memberRows = body.member_ids.map((officerId: string) => ({
            team_id: id,
            officer_id: officerId,
          }));
          await supabase.from("team_members").insert(memberRows);
        }
      }

      await supabase.from("audit_logs").insert([
        {
          user_id: authUser?.id,
          user_name: authUser?.username,
          action: "UPDATE_TEAM",
          entity_type: "teams",
          entity_id: id,
          description: `Updated team ${team.team_name} (data_sharing: ${team.data_sharing})`,
        },
      ]);

      return sendSuccess("Team updated successfully", team);
    }

    // 4. DELETE TEAM
    if (req.method === "DELETE" && id) {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("audit_logs").insert([
        {
          user_id: authUser?.id,
          user_name: authUser?.username,
          action: "DELETE_TEAM",
          entity_type: "teams",
          entity_id: id,
          description: `Deleted team ID ${id}`,
        },
      ]);

      return sendSuccess("Team deleted successfully");
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
