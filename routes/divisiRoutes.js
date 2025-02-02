const express = require('express');
const router = express.Router();
const divisiController = require('../controllers/divisiController');

// Routes
router.get('/get', divisiController.getAllDivisi);
router.get('/:id', divisiController.getDivisiById);
router.post('/add', divisiController.createDivisi);
router.put('/update/:id', divisiController.updateDivisi);
router.delete('/delete/:id', divisiController.deleteDivisi);

module.exports = router;
