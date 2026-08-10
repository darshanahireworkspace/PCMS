const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const verifyToken = require("../middleware/authMiddleware");
const {
  createFestivalPermission,
  getFestivalPermissions,
  getSingleFestivalPermission,
  updateFestivalPermission,
  deleteFestivalPermission,
} = require("../controllers/festivalController");

router.post("/", verifyToken, upload.single("photo"), createFestivalPermission);
router.get("/", verifyToken, getFestivalPermissions);
router.get("/:id", verifyToken, getSingleFestivalPermission);
router.put("/:id", verifyToken, upload.single("photo"), updateFestivalPermission);
router.delete("/:id", verifyToken, deleteFestivalPermission);

module.exports = router;
