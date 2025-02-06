const express = require('express');
const router = express.Router();
const absenController = require('../controllers/absenController');

router.post('/absen', absenController.absen);
router.get('/status/:NIP', absenController.getStatusByNIP);
router.get('/rekap/:NIP', absenController.getAbsenRekapByNIP);
router.get('/absensiqr/:NIP', absenController.scanQR);

module.exports = router;