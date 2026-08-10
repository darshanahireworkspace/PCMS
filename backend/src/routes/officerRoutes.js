const express = require("express");
const router = express.Router();
const officerController = require("../controllers/officerController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, officerController.getOfficers);
router.get("/:id", authMiddleware, officerController.getSingleOfficer);
router.post("/", authMiddleware, officerController.createOfficer);
router.put("/:id", authMiddleware, officerController.updateOfficer);
router.delete("/:id", authMiddleware, officerController.deleteOfficer);

module.exports = router;
