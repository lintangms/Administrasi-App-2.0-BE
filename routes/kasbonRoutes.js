const express = require('express');
const router = express.Router();
const kasbonController = require('../controllers/kasbonController');

// Routes
router.get('/get', kasbonController.getAllKasbon); 
router.get('/options', kasbonController.getKasbonOptions);
router.get('/get/:NIP', kasbonController.getKasbonByNip)
router.post('/add', kasbonController.createKasbon); 
router.put('/update/:id', kasbonController.updateKasbon); 
router.delete('/:id', kasbonController.deleteKasbon); 

module.exports = router;
