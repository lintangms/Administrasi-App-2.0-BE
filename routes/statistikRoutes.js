const express = require("express");
const router = express.Router();
const statistikController = require("../controllers/statistikController");

router.get("/total", statistikController.getStatistik);
router.get("/farming", statistikController.getStatistikFarming);
router.get("/boosting", statistikController.getStatistikBoosting);
router.get("/totalfarming", statistikController.getStatistikFarmingPerTahun);
router.get("/totalboosting", statistikController.getStatistikBoostingPerTahun);

module.exports = router;
