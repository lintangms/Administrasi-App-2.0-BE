const express = require('express');
const router = express.Router();
const unsoldController = require('../controllers/unsoldController'); // Sesuaikan dengan path controller Anda


router.post('/add', unsoldController.createUnsold);
router.get('/get', unsoldController.getAllUnsold);
router.get('/get/:NIP', unsoldController.getUnsoldByNIP);
router.post('/sell/:id_unsold', unsoldController.sellUnsold);
router.get('/total', unsoldController.totalUnsold);

module.exports = router;
