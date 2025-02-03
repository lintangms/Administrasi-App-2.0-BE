const express = require('express');
const router = express.Router();
const akunController = require('../controllers/akunController');

// Route CRUD
router.get('/get', akunController.getAllAkun);
router.get('/:id', akunController.getAkunById);
router.post('/add', akunController.createAkun);
router.put('/update/:id', akunController.updateAkun);
router.delete('/:id', akunController.deleteAkun);

module.exports = router;
