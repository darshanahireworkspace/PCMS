const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
  createPoliceStation,
  getPoliceStations,
  deletePoliceStation,
} = require("../controllers/policeStationController");

router.post("/", verifyToken, createPoliceStation);
router.get("/", verifyToken, getPoliceStations);
router.delete("/:id", verifyToken, deletePoliceStation);

module.exports = router;