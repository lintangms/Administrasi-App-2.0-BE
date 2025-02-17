const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/penjualanController');

router.post('/jual', penjualanController.createPenjualan);
router.get('/get', penjualanController.getAllPenjualan);
router.get('/rate', penjualanController.getAverageRate);

module.exports = router;