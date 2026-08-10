require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const supabase = require("./config/supabase");

const app = express();

const uploadsPath = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// CORS setup
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(uploadsPath));

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Police City Management Backend (Supabase Engine V2) Running",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server healthy",
    engine: "Supabase PostgreSQL",
    time: new Date().toISOString(),
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase.from("police_stations").select("count", { count: "exact", head: true });
    if (error) throw error;
    return res.status(200).json({
      success: true,
      message: "Supabase database connected successfully",
      data: { connected: true },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Supabase database connection failed",
      error: error.message,
    });
  }
});

// Routes
const authRoutes = require("./routes/authRoutes");
const religiousPlaceRoutes = require("./routes/religiousPlaceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const festivalRoutes = require("./routes/festivalRoutes");
const policeStationRoutes = require("./routes/policeStationRoutes");
const otherPlaceRoutes = require("./routes/otherPlaceRoutes");
const officerRoutes = require("./routes/officerRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/religious-places", religiousPlaceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/festival-permissions", festivalRoutes);
app.use("/api/police-stations", policeStationRoutes);
app.use("/api/other-places", otherPlaceRoutes);
app.use("/api/officers", officerRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Supabase-backed Express Server running on port ${PORT}`);
  });
}

module.exports = app;
