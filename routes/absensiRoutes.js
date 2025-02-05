const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiController');

// Endpoint untuk mencatat absensi (Masuk)
router.post('/create', absensiController.absensiMasuk);
router.post('/izin', absensiController.absensiIzin);

// Endpoint untuk update absensi (Pulang) dan data Boosting/Farming
router.post('/update/:id_absensi', absensiController.absensiPulang);
router.post('/check' , absensiController.checkAbsensi);
router.get('/getall', absensiController.getAllAbsensi);
// router.get('/get/:id_absensi', absensiController.getAbsensiById);
router.get('/getkaryawan/:NIP', absensiController.getAbsensiByNIP)
router.get('/status/:NIP', absensiController.getStatusByNIP);
router.get('/absensi/:NIP', absensiController.getAbsensiRekapByNIP);
router.get('/absensiqr/:NIP', absensiController.absensiMasukByQR);
router.get("/generateqr/:NIP", absensiController.generateQRCode);


router.get('/scanqr/:NIP', absensiController.scanAbsensi)

module.exports = router;
