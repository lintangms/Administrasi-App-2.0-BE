const db = require('../config/db');

// Get all records
exports.getAllGames = (req, res) => {
    const sql = 'SELECT * FROM game';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data game berhasil diambil', data: results });
    });
};

exports.getAllGamesName = (req, res) => {
    const sql = 'SELECT nama_game FROM game'; // Hanya mengambil nama_game
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });

        // Ambil hanya nama_game dalam array
        const gameNames = results.map(game => game.nama_game);

        res.status(200).json({ message: 'Data nama game berhasil diambil', data: gameNames });
    });
};

// Get single record
exports.getGameById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM game WHERE id_game = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });
        res.status(200).json({ message: 'Data game berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createGame = (req, res) => {
    const { nama_game, ket } = req.body;
    const sql = 'INSERT INTO game (nama_game, ket) VALUES (?, ?)';
    db.query(sql, [nama_game, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ message: 'Game berhasil ditambahkan', data: { id: results.insertId, ...req.body } });
    });
};

// Update record
exports.updateGame = (req, res) => {
    const { id } = req.params;
    const { nama_game, ket } = req.body;
    const sql = 'UPDATE game SET nama_game = ?, ket = ? WHERE id_game = ?';
    db.query(sql, [nama_game, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });
        res.status(200).json({ message: 'Game berhasil diperbarui' });
    });
};

// Delete record
exports.deleteGame = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM game WHERE id_game = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });
        res.status(200).json({ message: 'Game berhasil dihapus' });
    });
};
