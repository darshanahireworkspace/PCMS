const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const verifyToken = require("../middleware/authMiddleware");
const {
  createOtherPlace,
  getOtherPlaces,
  getSingleOtherPlace,
  updateOtherPlace,
  deleteOtherPlace,
} = require("../controllers/otherPlaceController");

router.post("/", verifyToken, upload.single("photo"), createOtherPlace);
router.get("/", verifyToken, getOtherPlaces);
router.get("/:id", verifyToken, getSingleOtherPlace);
router.put("/:id", verifyToken, upload.single("photo"), updateOtherPlace);
router.delete("/:id", verifyToken, deleteOtherPlace);

module.exports = router;
