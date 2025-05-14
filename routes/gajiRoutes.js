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
router.post('/addgaji', gajiController.addGajiLama);
router.get('/getrate', gajiController.getAllRates);
router.get('/koindetail', gajiController.getKoinDetails);
router.get('/estimasi/:nip', gajiController.getEstimasiGajiByNIP);

module.exports = router;