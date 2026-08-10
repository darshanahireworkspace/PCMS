const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const verifyToken = require("../middleware/authMiddleware");
const {
  createReligiousPlace,
  getReligiousPlaces,
  getSingleReligiousPlace,
  updateReligiousPlace,
  deleteReligiousPlace,
} = require("../controllers/religiousPlaceController");

router.post("/", verifyToken, upload.single("image"), createReligiousPlace);
router.get("/", verifyToken, getReligiousPlaces);
router.get("/:id", verifyToken, getSingleReligiousPlace);
router.put("/:id", verifyToken, upload.single("image"), updateReligiousPlace);
router.delete("/:id", verifyToken, deleteReligiousPlace);

module.exports = router;
