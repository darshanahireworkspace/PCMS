const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createPoliceStation,
  getPoliceStations,
  getSinglePoliceStation,
  updatePoliceStation,
  deletePoliceStation,
} = require("../controllers/policeStationController");

router.post("/", verifyToken, createPoliceStation);
router.get("/", verifyToken, getPoliceStations);
router.get("/:id", verifyToken, getSinglePoliceStation);
router.put("/:id", verifyToken, updatePoliceStation);
router.delete("/:id", verifyToken, deletePoliceStation);

module.exports = router;
