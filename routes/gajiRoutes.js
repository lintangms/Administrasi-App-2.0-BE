const express = require('express');
const router = express.Router();
const gajiController = require('../controllers/gajiController');

router.post('/gajian', gajiController.updateGaji);
router.post('/rate', gajiController.inputRate);

module.exports = router;