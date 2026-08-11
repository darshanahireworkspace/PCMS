import { supabase } from "../lib/supabase";
import API from "./axios";

// 1. GET ALL TEAMS WITH MEMBERS
export const getTeams = async () => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*, team_members(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return { data: { success: true, data } };
    }

    // Edge Function fallback if needed
    const res = await API.get("/teams");
    return res;
  } catch (err) {
    console.warn("Teams GET notice:", err?.message);
    return { data: { success: true, data: [] } };
  }
};

// 2. GET SINGLE TEAM BY ID
export const getTeamById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*, team_members(*)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return { data: { success: true, data } };
    }

    return await API.get(`/teams/${id}`);
  } catch (err) {
    console.warn("Team detail notice:", err?.message);
    return { data: { success: false, data: null } };
  }
};

// 3. CREATE TEAM
export const createTeam = async (data) => {
  try {
    const teamRecord = {
      team_name: String(data.team_name || "").trim(),
      description: data.description || "",
      data_sharing: data.data_sharing ?? true,
    };

    // Use direct Supabase client (cleanest REST payload)
    const { data: newTeam, error: teamErr } = await supabase
      .from("teams")
      .insert([teamRecord])
      .select()
      .single();

    if (teamErr) {
      console.error("Team creation RLS/DB notice:", teamErr);
      throw new Error(teamErr.message || "Failed to create team record");
    }

    // Insert member associations if provided
    if (Array.isArray(data.member_ids) && data.member_ids.length > 0 && newTeam) {
      const memberRows = data.member_ids.map((offId) => ({
        team_id: newTeam.id,
        officer_id: offId,
      }));
      await supabase.from("team_members").insert(memberRows);
    }

    // Record audit log entry safely
    try {
      await supabase.from("audit_logs").insert([
        {
          action: "CREATE_TEAM",
          entity_type: "teams",
          entity_id: newTeam.id,
          description: `Created squad team ${newTeam.team_name}`,
        },
      ]);
    } catch (e) {
      console.warn("Audit log notice:", e);
    }

    return { data: { success: true, message: "Team created successfully", data: newTeam } };
  } catch (err) {
    console.warn("Direct team insert notice, attempting Edge Function fallback:", err?.message);
    try {
      return await API.post("/teams", data);
    } catch (edgeErr) {
      throw new Error(err.message || edgeErr.message || "Unable to save team");
    }
  }
};

// 4. UPDATE TEAM
export const updateTeam = async (id, data) => {
  try {
    const updateRecord = { ...data };
    delete updateRecord.member_ids;

    const { data: updatedTeam, error: updateErr } = await supabase
      .from("teams")
      .update(updateRecord)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (Array.isArray(data.member_ids)) {
      await supabase.from("team_members").delete().eq("team_id", id);
      if (data.member_ids.length > 0) {
        const memberRows = data.member_ids.map((offId) => ({
          team_id: id,
          officer_id: offId,
        }));
        await supabase.from("team_members").insert(memberRows);
      }
    }

    return { data: { success: true, message: "Team updated successfully", data: updatedTeam } };
  } catch (err) {
    console.warn("Direct team update notice, attempting Edge Function fallback:", err?.message);
    return await API.put(`/teams/${id}`, data);
  }
};

// 5. DELETE TEAM
export const deleteTeam = async (id) => {
  try {
    await supabase.from("team_members").delete().eq("team_id", id);
    const { data, error } = await supabase.from("teams").delete().eq("id", id).select().single();
    if (error) throw error;
    return { data: { success: true, message: "Team deleted successfully", data } };
  } catch (err) {
    console.warn("Direct team delete notice, attempting Edge Function fallback:", err?.message);
    return await API.delete(`/teams/${id}`);
  }
};
