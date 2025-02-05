const express = require('express');
const router = express.Router();
const boostingController = require('../controllers/boostingController');

router.get('/get', boostingController.getAllBoosting);
router.get('/get/:NIP', boostingController.getBoostingByNip);
router.post('/add', boostingController.createBoosting);
router.put('/update/:id', boostingController.updateBoosting);
router.delete('/delete/:id', boostingController.deleteBoosting);

module.exports = router;
