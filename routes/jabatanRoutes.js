const express = require('express');
const router = express.Router();
const jabatanController = require('../controllers/jabatanController');

// Routes
router.get('/get', jabatanController.getAllJabatan);
router.get('/:id', jabatanController.getJabatanById);
router.post('/add', jabatanController.createJabatan);
router.put('/update/:id', jabatanController.updateJabatan);
router.delete('/delete/:id', jabatanController.deleteJabatan);

module.exports = router;
