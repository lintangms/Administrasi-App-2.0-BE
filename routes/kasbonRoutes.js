const express = require('express');
const router = express.Router();
const kasbonController = require('../controllers/kasbonController');

// Routes
router.get('/get', kasbonController.getAllKasbon); // Menampilkan semua kasbon
// router.get('/:id', kasbonController.getKasbonById); // Menampilkan kasbon berdasarkan ID
router.get('/options', kasbonController.getKasbonOptions); // Menampilkan opsi kasbon
router.get('/get/:NIP', kasbonController.getKasbonByNip)

router.post('/add', kasbonController.createKasbon); // Menambah kasbon
router.put('/:id', kasbonController.updateKasbon); // Update kasbon
router.delete('/:id', kasbonController.deleteKasbon); // Hapus kasbon

module.exports = router;
