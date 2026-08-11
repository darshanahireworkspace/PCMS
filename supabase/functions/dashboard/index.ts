import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const station = url.searchParams.get("police_station");

    // 1. Religious Places query
    let rpQuery = supabase.from("religious_places").select("*", { count: "exact" });
    if (station) {
      rpQuery = rpQuery.eq("police_station", station);
    }
    const { data: religiousPlaces, count: totalPlaces, error: rpErr } = await rpQuery.order("created_at", {
      ascending: false,
    });
    if (rpErr) throw rpErr;

    // Count place types & risks
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

    // 2. Festival Permissions query
    const { data: festivalPermissions, count: festivalTotal, error: fpErr } = await supabase
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
    if (fpErr) throw fpErr;

    const formattedFestivals = (festivalPermissions || []).map((fp: Record<string, unknown>) => ({
      ...fp,
      place_name: (fp.religious_places as { place_name?: string })?.place_name || null,
    }));

    // 3. Other Places query
    const { data: otherPlaces, count: otherTotal, error: opErr } = await supabase
      .from("other_places")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (opErr) throw opErr;

    // 4. Police stations count
    const { count: totalStations } = await supabase.from("police_stations").select("*", { count: "exact", head: true });

    // 5. Officers count
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
