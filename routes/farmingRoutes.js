const express = require('express');
const router = express.Router();
const farmingController = require('../controllers/farmingController');

router.get('/get', farmingController.getAllFarming);
router.get('/get/:id', farmingController.getFarmingById);
router.post('/add', farmingController.createFarming);
router.put('/update/:id', farmingController.updateFarming);
router.delete('/delete/:id', farmingController.deleteFarming);

module.exports = router;
