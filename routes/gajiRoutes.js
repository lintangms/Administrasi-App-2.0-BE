const express = require('express');
const router = express.Router();
const gajiController = require('../controllers/gajiController');

router.post('/gajian', gajiController.updateGaji);
router.post('/gajibaru', gajiController.updateGajiBaru)
router.post('/rate', gajiController.inputRate);
router.get('/getlama', gajiController.getGajiLama);
router.get('/getbaru', gajiController.getGajiBaru);
router.get('/total', gajiController.getTotalGaji);
router.post('/add', gajiController.addGaji);
router.post('/gajiunsold', gajiController.updateUnsoldGaji);

module.exports = router;