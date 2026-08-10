const express = require("express");
const multer = require("multer");
const path = require("path");

const verifyToken = require("../middleware/authMiddleware");

const {
  createReligiousPlace,
  getReligiousPlaces,
  getSingleReligiousPlace,
  updateReligiousPlace,
  deleteReligiousPlace,
} = require("../controllers/religiousPlaceController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "place-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", verifyToken, upload.single("image"), createReligiousPlace);
router.get("/", verifyToken, getReligiousPlaces);
router.get("/:id", verifyToken, getSingleReligiousPlace);
router.put("/:id", verifyToken, updateReligiousPlace);
router.delete("/:id", verifyToken, deleteReligiousPlace);

module.exports = router;