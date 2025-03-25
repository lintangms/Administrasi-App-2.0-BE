const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/penjualanController');

router.post('/jual', penjualanController.createPenjualan);
router.get('/get', penjualanController.getAllPenjualan);
router.get('/rate', penjualanController.getAverageRate);
router.get('/total', penjualanController.getTotalUang);
router.post('/addrate', penjualanController.insertAverageRate);

module.exports = router;