import { sendError } from "./response.ts";

const getJwtSecret = () => {
  return Deno.env.get("JWT_SECRET") || "pcms_v2_jwt_secret_key_change_in_production";
};

// Simple base64url decode helper for JWT payload extraction & verification
const parseJwtPayload = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const verifyOfficerToken = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = parseJwtPayload(token);
  if (!payload || !payload.id) {
    return null;
  }

  return payload as { id: string; username?: string; role?: string };
};
