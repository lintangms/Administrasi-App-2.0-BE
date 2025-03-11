const db = require('../config/db');

// Get all records

exports.getAllAkun = (req, res) => {
    const sql = `SELECT a.*, g.nama_game 
                 FROM akun a
                 LEFT JOIN game g ON a.id_game = g.id_game`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data akun berhasil diambil', data: results });
    });
};


// Get single record
exports.getAkunById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM akun WHERE id_akun = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
        res.status(200).json({ message: 'Data akun berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createAkun = (req, res) => {
    const { username_steam, password_steam, gmail, ket, nama_game } = req.body;

    // Cari ID_GAME berdasarkan NAMA_GAME
    const gameQuery = 'SELECT id_game FROM game WHERE nama_game = ?';
    db.query(gameQuery, [nama_game], (err, gameResult) => {
        if (err) return res.status(500).json({ message: 'Error saat mencari game', error: err });

        if (gameResult.length === 0) {
            return res.status(404).json({ message: 'Game tidak ditemukan' });
        }

        const id_game = gameResult[0].id_game;

        // Insert ke tabel akun dengan ID_GAME yang ditemukan
        const sql = 'INSERT INTO akun (username_steam, password_steam, gmail, ket, id_game) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [username_steam, password_steam, gmail, ket, id_game], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });
            res.status(201).json({ message: 'Akun berhasil ditambahkan', data: { id: results.insertId, ...req.body } });
        });
    });
};

// Update record
exports.updateAkun = (req, res) => {
    const { id } = req.params;
    const { username_steam, password_steam, gmail, ket, nama_game } = req.body;

    // Cari ID_GAME berdasarkan NAMA_GAME
    const gameQuery = 'SELECT id_game FROM game WHERE nama_game = ?';
    db.query(gameQuery, [nama_game], (err, gameResult) => {
        if (err) return res.status(500).json({ message: 'Error saat mencari game', error: err });

        if (gameResult.length === 0) {
            return res.status(404).json({ message: 'Game tidak ditemukan' });
        }

        const id_game = gameResult[0].id_game;

        // Update data akun dengan ID_GAME yang ditemukan
        const sql = 'UPDATE akun SET username_steam = ?, password_steam = ?, gmail = ?, ket = ?, id_game = ? WHERE id_akun = ?';
        db.query(sql, [username_steam, password_steam, gmail, ket, id_game, id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
            res.status(200).json({ message: 'Akun berhasil diperbarui' });
        });
    });
};


// Delete `id_akun` dari `karyawan` sebelum hapus akun
exports.deleteAkun = (req, res) => {
    const { id } = req.params;

    // Ubah `id_akun` di `karyawan` jadi NULL biar gak ada foreign key error
    const sqlUpdateKaryawan = 'UPDATE karyawan SET id_akun = NULL WHERE id_akun = ?';
    db.query(sqlUpdateKaryawan, [id], (err) => {
        if (err) return res.status(500).json({ message: 'Gagal menghapus relasi akun di karyawan', error: err });

        // Setelah `id_akun` dihapus dari `karyawan`, baru hapus akun
        const sqlDeleteAkun = 'DELETE FROM akun WHERE id_akun = ?';
        db.query(sqlDeleteAkun, [id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Gagal menghapus akun', error: err });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
            res.status(200).json({ message: 'Akun berhasil dihapus tanpa menghapus data lain' });
        });
    });
};

