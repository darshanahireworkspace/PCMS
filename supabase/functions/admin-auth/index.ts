import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { sendSuccess, sendError } from "../_shared/response.ts";
import { verifyOfficerToken, hashPassword, verifyPassword } from "../_shared/auth.ts";

const generateJwt = async (payload: Record<string, unknown>, secret: string): Promise<string> => {
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const encodedHeader = encode(header);
  const encodedPayload = encode({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 });
  const data = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${encodedSignature}`;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // 1. ADMIN LOGIN ROUTE (POST /admin-auth/login or POST /admin-auth)
    if (req.method === "POST" && (path.endsWith("/login") || path.endsWith("/admin-auth") || path.includes("/login"))) {
      const body = await req.json();
      const cleanUsername = String(body.username || "").trim();
      const cleanPassword = String(body.password || "").trim();

      if (!cleanUsername || !cleanPassword) {
        return sendError("Username and password are required", null, 400);
      }

      // Check SuperAdmin special credentials: pcmsadmin / PCMS@Admin2026
      if (cleanUsername.toLowerCase() === "pcmsadmin" && cleanPassword === "PCMS@Admin2026") {
        let adminOfficer = null;
        try {
          const { data: adminList } = await supabase
            .from("officers")
            .select("*")
            .eq("username", "pcmsadmin")
            .limit(1);

          adminOfficer = adminList && adminList.length > 0 ? adminList[0] : null;

          if (!adminOfficer) {
            const passHash = await hashPassword("PCMS@Admin2026");
            const { data: newAdmin } = await supabase
              .from("officers")
              .insert([
                {
                  full_name: "Super Admin Authority",
                  username: "pcmsadmin",
                  email: "pcmsadmin@pcms.gov.in",
                  password_hash: passHash,
                  role: "SuperAdmin",
                  access_scope: "ALL",
                  status: "Active",
                  designation: "Superintendent of Police",
                },
              ])
              .select()
              .single();

            adminOfficer = newAdmin;
          }
        } catch (dbErr) {
          console.warn("DB notice during pcmsadmin query:", dbErr);
        }

        const adminId = adminOfficer?.id || "00000000-0000-0000-0000-000000000001";
        const jwtSecret = Deno.env.get("JWT_SECRET") || "pcms_v2_jwt_secret_key_change_in_production";
        const token = await generateJwt(
          {
            id: adminId,
            username: "pcmsadmin",
            full_name: adminOfficer?.full_name || "Super Admin Authority",
            role: "SuperAdmin",
            access_scope: "ALL",
            police_station_id: adminOfficer?.police_station_id || null,
          },
          jwtSecret
        );

        try {
          await supabase.from("audit_logs").insert([
            {
              user_id: adminId,
              user_name: adminOfficer?.full_name || "Super Admin Authority",
              action: "ADMIN_LOGIN",
              entity_type: "officers",
              entity_id: adminId,
              description: "Super Admin authenticated into PCMS Authority Console",
            },
          ]);
        } catch (auditErr) {
          console.warn("Audit log notice:", auditErr);
        }

        return sendSuccess("Super Admin authentication successful", {
          token,
          officer: {
            id: adminId,
            full_name: adminOfficer?.full_name || "Super Admin Authority",
            username: "pcmsadmin",
            role: "SuperAdmin",
            access_scope: "ALL",
            police_station: adminOfficer?.police_station_name || "Chhavani Headquarters",
          },
        });
      }

      // Check DB for any other Admin / SuperAdmin
      const { data: officers, error } = await supabase
        .from("officers")
        .select("*")
        .eq("username", cleanUsername)
        .eq("status", "Active")
        .limit(1);

      if (error || !officers || officers.length === 0) {
        return sendError("Invalid administrator credentials", null, 401);
      }

      const officer = officers[0];
      if (officer.role !== "SuperAdmin" && officer.role !== "Admin") {
        return sendError("Access denied: Not an administrator account", null, 403);
      }

      const isValid = await verifyPassword(cleanPassword, officer.password_hash);
      if (!isValid) {
        return sendError("Invalid administrator credentials", null, 401);
      }

      const jwtSecret = Deno.env.get("JWT_SECRET") || "pcms_v2_jwt_secret_key_change_in_production";
      const token = await generateJwt(
        {
          id: officer.id,
          username: officer.username,
          full_name: officer.full_name,
          role: officer.role,
          access_scope: officer.access_scope || "ALL",
          police_station_id: officer.police_station_id,
        },
        jwtSecret
      );

      return sendSuccess("Admin authentication successful", {
        token,
        officer: {
          id: officer.id,
          full_name: officer.full_name,
          username: officer.username,
          role: officer.role,
          access_scope: officer.access_scope || "ALL",
          police_station: officer.police_station_name || "Chhavani Headquarters",
        },
      });
    }

    // 2. ME ROUTE (GET /admin-auth/me)
    if (req.method === "GET" && path.endsWith("/me")) {
      const authUser = await verifyOfficerToken(req);
      if (!authUser) {
        return sendError("Unauthorized access", null, 401);
      }

      return sendSuccess("Admin profile retrieved", {
        id: authUser.id,
        full_name: authUser.full_name || "Super Admin Authority",
        username: authUser.username,
        role: authUser.role || "SuperAdmin",
        access_scope: authUser.access_scope || "ALL",
      });
    }

    return sendError("Route not found", null, 404);
  } catch (err) {
    return sendError("Server error", (err as Error).message, 500);
  }
});
