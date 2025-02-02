const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// Routes
router.post('/add', shiftController.createShift);
router.get('/get', shiftController.getAllShifts);
router.get('/:id', shiftController.getShiftById);
router.put('/update/:id', shiftController.updateShift);
router.delete('/delete/:id', shiftController.deleteShift);

module.exports = router;
