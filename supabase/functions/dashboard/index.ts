import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authUser = await verifyOfficerToken(req);
    const url = new URL(req.url);
    const station = url.searchParams.get("police_station");

    // 1. Religious Places query with scope filtering
    let rpQuery = supabase.from("religious_places").select("*", { count: "exact" });
    if (station) {
      rpQuery = rpQuery.eq("police_station", station);
    }

    if (authUser && authUser.role !== "SuperAdmin" && authUser.role !== "HeadOfficer" && authUser.access_scope !== "ALL") {
      if (authUser.access_scope === "TEAM" && authUser.team_id) {
        rpQuery = rpQuery.or(`created_by.eq.${authUser.id},team_id.eq.${authUser.team_id}`);
      } else {
        rpQuery = rpQuery.eq("created_by", authUser.id);
      }
    }

    const { data: religiousPlaces, count: totalPlaces, error: rpErr } = await rpQuery.order("created_at", {
      ascending: false,
    });
    if (rpErr) throw rpErr;

    let temples = 0;
    let masjids = 0;
    let dargahs = 0;
    let highRisk = 0;

    (religiousPlaces || []).forEach((item) => {
      if (item.place_type === "Temple") temples++;
      if (item.place_type === "Masjid") masjids++;
      if (item.place_type === "Dargah") dargahs++;
      if (item.risk_level === "High" || item.risk_level === "Critical") highRisk++;
    });

    // 2. Festival Permissions query with scope filtering
    let fpQuery = supabase
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

    if (authUser && authUser.role !== "SuperAdmin" && authUser.role !== "HeadOfficer" && authUser.access_scope !== "ALL") {
      if (authUser.access_scope === "TEAM" && authUser.team_id) {
        fpQuery = fpQuery.or(`created_by.eq.${authUser.id},assigned_officer.eq.${authUser.id},team_id.eq.${authUser.team_id}`);
      } else {
        fpQuery = fpQuery.or(`created_by.eq.${authUser.id},assigned_officer.eq.${authUser.id}`);
      }
    }

    const { data: festivalPermissions, count: festivalTotal, error: fpErr } = await fpQuery;
    if (fpErr) throw fpErr;

    const formattedFestivals = (festivalPermissions || []).map((fp: Record<string, unknown>) => ({
      ...fp,
      place_name: (fp.religious_places as { place_name?: string })?.place_name || null,
    }));

    // 3. Other Places query with scope filtering
    let opQuery = supabase.from("other_places").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (authUser && authUser.role !== "SuperAdmin" && authUser.role !== "HeadOfficer" && authUser.access_scope !== "ALL") {
      if (authUser.access_scope === "TEAM" && authUser.team_id) {
        opQuery = opQuery.or(`created_by.eq.${authUser.id},team_id.eq.${authUser.team_id}`);
      } else {
        opQuery = opQuery.eq("created_by", authUser.id);
      }
    }

    const { data: otherPlaces, count: otherTotal, error: opErr } = await opQuery;
    if (opErr) throw opErr;

    // 4. Police stations & Officers count
    const { count: totalStations } = await supabase.from("police_stations").select("*", { count: "exact", head: true });
    const { count: totalOfficers } = await supabase.from("officers").select("*", { count: "exact", head: true });

    return sendSuccess("Dashboard statistics retrieved successfully", {
      stats: {
        totalPlaces: totalPlaces || 0,
        temples,
        masjids,
        dargahs,
        highRisk,
        festivalPermissions: festivalTotal || 0,
        otherPlaces: otherTotal || 0,
        policeStations: totalStations || 0,
        officers: totalOfficers || 0,
      },
      religiousPlaces: religiousPlaces || [],
      festivalPermissions: formattedFestivals,
      otherPlaces: otherPlaces || [],
    });
  } catch (err) {
    return sendError("Failed to fetch dashboard stats", (err as Error).message, 500);
  }
});
