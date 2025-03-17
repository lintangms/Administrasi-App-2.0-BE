const express = require('express');
const router = express.Router();
const kasbonController = require('../controllers/kasbonController');

// Routes
router.get('/get', kasbonController.getAllKasbon); 
router.get('/options', kasbonController.getKasbonOptions);
router.get('/get/:NIP', kasbonController.getKasbonByNip)
router.post('/add', kasbonController.createKasbon); 
router.put('/status/:id', kasbonController.updateKasbonStatus);
router.put('/konfirmasi/:id', kasbonController.updateKasbonKonfirmasi) 
router.delete('/:id', kasbonController.deleteKasbon); 

module.exports = router;
