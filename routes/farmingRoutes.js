const express = require('express');
const router = express.Router();
const farmingController = require('../controllers/farmingController');

router.get('/get', farmingController.getAllFarming);
router.get('/get/:NIP', farmingController.getFarmingByNip);
router.post('/add', farmingController.createFarming);
router.put('/update/:id', farmingController.updateFarming);
router.delete('/delete/:id', farmingController.deleteFarming);
router.get('/totalkoin/:NIP', farmingController.getTotalKoin);
router.get('/getall', farmingController.getAllTotalKoin);
router.get('/getall/:NIP', farmingController.getTotalKoinByNIP);
router.get('/koinwow', farmingController.getKoinTerakhirWOW);

module.exports = router;
