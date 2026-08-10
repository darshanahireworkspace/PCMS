const express = require("express");
const multer = require("multer");
const path = require("path");

const verifyToken = require("../middleware/authMiddleware");

const {
  createFestivalPermission,
  getFestivalPermissions,
  getSingleFestivalPermission,
  updateFestivalPermission,
  deleteFestivalPermission,
} = require("../controllers/festivalController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, "festival-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create Festival Permission
router.post(
  "/",
  verifyToken,
  upload.single("photo"),
  createFestivalPermission
);

// Get All Festival Permissions
router.get("/", verifyToken, getFestivalPermissions);

// Get Single Festival Permission
router.get("/:id", verifyToken, getSingleFestivalPermission);

// Update Festival Permission
router.put(
  "/:id",
  verifyToken,
  upload.single("photo"),
  updateFestivalPermission
);

// Delete Festival Permission
router.delete("/:id", verifyToken, deleteFestivalPermission);

module.exports = router;