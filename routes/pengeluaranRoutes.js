const express = require('express');
const router = express.Router();
const pengeluaranController = require('../controllers/pengeluaranController');

// Routes
router.get('/get', pengeluaranController.getAllPengeluaran);
router.get('/get/:id', pengeluaranController.getPengeluaranById);
router.post('/add', pengeluaranController.createPengeluaran);
router.put('/update/:id', pengeluaranController.updatePengeluaran);
router.delete('/delete/:id', pengeluaranController.deletePengeluaran);

module.exports = router;
