const express = require('express');
const router = express.Router();
const absenController = require('../controllers/absenController');

router.post('/absen', absenController.absen);
router.post('/izin', absenController.absenIzin);
router.post('/alpha', absenController.absenTidakMasuk);
router.get('/status/:NIP', absenController.getStatusByNIP);
router.get('/rekap/:NIP', absenController.getAbsenRekapByNIP);
router.get('/absensiqr/:NIP', absenController.scanQR);
router.get('/get', absenController.getAllAbsensi);
router.get('/get/:NIP' , absenController.getAbsenByNIP);
router.put('/update/:id_absen', absenController.updateKeteranganAbsen);
router.get('/rekapabsen', absenController.getRekapAbsensi);
router.get('/absensi/:nip', absenController.getByNIP);

module.exports = router;