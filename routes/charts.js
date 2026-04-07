const express = require("express");
const router = express.Router();
const chartsController = require("../controllers/chartsController");

router.get("/", chartsController.chartsPage);

module.exports = router;