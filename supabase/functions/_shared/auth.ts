import { sendError } from "./response.ts";

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  access_scope?: string;
  police_station_id?: string;
  team_id?: string;
  full_name?: string;
}

const parseJwtPayload = (token: string): TokenPayload | null => {
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
    return JSON.parse(jsonPayload) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyOfficerToken = async (req: Request): Promise<TokenPayload | null> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = parseJwtPayload(token);
  if (!payload || !payload.id) {
    return null;
  }

  return payload;
};

// Secure password hashing helper using SHA-256 with salt via Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`pcms_salt_v2_${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  if (!storedHash) return false;
  const hashedInput = await hashPassword(password);
  return hashedInput === storedHash;
};
