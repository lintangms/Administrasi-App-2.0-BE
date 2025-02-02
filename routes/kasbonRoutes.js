const express = require('express');
const router = express.Router();
const kasbonController = require('../controllers/kasbonController');

// Routes
router.get('/get', kasbonController.getAllKasbon);
router.get('/:id', kasbonController.getKasbonById);
router.post('/add', kasbonController.createKasbon);
router.put('/:id', kasbonController.updateKasbon);
router.delete('/:id', kasbonController.deleteKasbon);

module.exports = router;
