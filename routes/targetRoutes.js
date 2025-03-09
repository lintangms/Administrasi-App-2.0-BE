const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');

// Routes
router.post('/add', targetController.createTarget);
router.get('/get', targetController.getAllTargets);
router.get('/get/:nip', targetController.getTargetByNIP);
router.put('/update/:id', targetController.updateTarget);
router.delete('/delete/:id', targetController.deleteTarget);

module.exports = router;
