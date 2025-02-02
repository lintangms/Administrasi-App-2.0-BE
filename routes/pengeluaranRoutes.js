const express = require('express');
const router = express.Router();
const pengeluaranController = require('../controllers/pengeluaranController');

// Routes
router.get('/', pengeluaranController.getAllPengeluaran);
router.get('/:id', pengeluaranController.getPengeluaranById);
router.post('/', pengeluaranController.createPengeluaran);
router.put('/:id', pengeluaranController.updatePengeluaran);
router.delete('/:id', pengeluaranController.deletePengeluaran);

module.exports = router;
