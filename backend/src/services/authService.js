const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

exports.loginOfficer = async (username, password) => {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!cleanUsername || !cleanPassword) {
    throw { statusCode: 400, message: "Username and password are required" };
  }

  // Fetch officer from Supabase database (status must be Active)
  const { data: officers, error } = await supabase
    .from("officers")
    .select("*")
    .eq("username", cleanUsername)
    .eq("status", "Active")
    .limit(1);

  if (error) {
    console.error("Supabase login error:", error);
    throw { statusCode: 500, message: "Database query failed" };
  }

  const officer = officers && officers.length > 0 ? officers[0] : null;

  if (!officer) {
    throw { statusCode: 401, message: "Invalid username or password" };
  }

  // Verify password
  let isMatch = false;
  if (officer.password_hash) {
    isMatch = await bcrypt.compare(cleanPassword, officer.password_hash);
  }

  if (!isMatch) {
    throw { statusCode: 401, message: "Invalid username or password" };
  }

  const jwtSecret = process.env.JWT_SECRET || "pcms_v2_jwt_secret_key_change_in_production";
  const token = jwt.sign(
    {
      id: officer.id,
      username: officer.username,
      role: officer.role,
    },
    jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    token,
    officer: {
      id: officer.id,
      full_name: officer.full_name,
      username: officer.username,
      role: officer.role,
      police_station: officer.police_station_name || officer.police_station,
    },
  };
};
