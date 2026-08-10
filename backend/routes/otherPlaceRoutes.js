const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const verifyToken = require("../middleware/authMiddleware");

const {
  createOtherPlace,
  getOtherPlaces,
  getSingleOtherPlace,
  updateOtherPlace,
  deleteOtherPlace,
} = require("../controllers/otherPlaceController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create uploads folder automatically
|--------------------------------------------------------------------------
*/

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| Multer Storage
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      "other-place-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPG, JPEG, PNG and WEBP photos are allowed")
    );
  },
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

router.get("/", verifyToken, getOtherPlaces);

router.get("/:id", verifyToken, getSingleOtherPlace);

router.post(
  "/",
  verifyToken,
  upload.single("photo"),
  createOtherPlace
);

router.put(
  "/:id",
  verifyToken,
  upload.single("photo"),
  updateOtherPlace
);

router.delete(
  "/:id",
  verifyToken,
  deleteOtherPlace
);

/*
|--------------------------------------------------------------------------
| Multer Error Handler
|--------------------------------------------------------------------------
*/

router.use((err, req, res, next) => {
  console.error("Other place upload error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Photo size must be below 5 MB",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Photo upload failed",
    });
  }

  next();
});

module.exports = router;