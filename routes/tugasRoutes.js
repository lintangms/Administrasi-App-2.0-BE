const express = require('express');
const router = express.Router();
const tugasController = require('../controllers/tugasController'); // Sesuaikan dengan path controller Anda


router.get('/get', tugasController.getAllTugas);
router.get('/get/:id', tugasController.getTugasById);
router.get('/getnip/:NIP', tugasController.getTugasByNIP);
router.post('/add', tugasController.createTugas);
router.put('/update/:id', tugasController.updateTugas);
router.delete('/tugas/:id', tugasController.deleteTugas);

module.exports = router;
