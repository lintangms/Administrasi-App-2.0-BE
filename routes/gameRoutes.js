const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Routes
router.get('/get', gameController.getAllGames);
router.get('/getname', gameController.getAllGamesName)
router.get('/:id', gameController.getGameById);
router.post('/add', gameController.createGame);
router.put('/update/:id', gameController.updateGame);
router.delete('/delete/:id', gameController.deleteGame);

module.exports = router;
