const express = require("express");
const router = express.Router();

const { loginOfficer } = require("../controllers/authController");

router.post("/login", loginOfficer);

module.exports = router;