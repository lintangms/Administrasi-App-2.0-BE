const express = require('express');
const router = express.Router();
const inventarisController = require('../controllers/inventarisController');

// Routes
router.get('/get', inventarisController.getAllInventaris);
router.get('/:id', inventarisController.getInventarisById);
router.post('/add', inventarisController.createInventaris);
router.put('/update/:id', inventarisController.updateInventaris);
router.delete('/:id', inventarisController.deleteInventaris);

module.exports = router;
