const db = require('../config/db');

// Get all records
exports.getAllBoosting = (req, res) => {
    const sql = 'SELECT * FROM perolehan_boosting ORDER BY id_boosting DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data boosting berhasil diambil', data: results });
    });
};

// Get all boosting records by NIP with date filtering
    exports.getBoostingByNip = (req, res) => {
        const { NIP } = req.params;
        const { start_date, end_date } = req.query;

        let sql = 'SELECT * FROM perolehan_boosting WHERE NIP = ?';
        let params = [NIP];

        // Tambahkan filter tanggal jika diberikan
        if (start_date && end_date) {
            sql += ' AND periode BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Data boosting tidak ditemukan' });
            res.status(200).json({ message: 'Data boosting berhasil diambil', data: results });
        });
    };


// Create record
exports.createBoosting = (req, res) => {
    const { NIP, nominal, periode, ket, nama_game } = req.body;

    // Cari id_game berdasarkan nama_game
    const sqlGetGame = 'SELECT id_game FROM game WHERE nama_game = ?';
    db.query(sqlGetGame, [nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });

        const id_game = results[0].id_game;

        // Insert data ke tabel perolehan_boosting
        const sqlInsert = 'INSERT INTO perolehan_boosting (NIP, nominal, periode, ket, id_game) VALUES (?, ?, ?, ?, ?)';
        db.query(sqlInsert, [NIP, nominal, periode, ket, id_game], (err, insertResults) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });

            res.status(201).json({
                message: 'Data boosting berhasil ditambahkan',
                data: { id_boosting: insertResults.insertId, NIP, nominal, periode, ket, id_game, nama_game }
            });
        });
    });
};

// Update record
exports.updateBoosting = (req, res) => {
    const { id } = req.params;
    const { NIP, nominal, periode, ket } = req.body;

    if (!id || !NIP || !nominal || !periode || !ket) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const sql = 'UPDATE perolehan_boosting SET NIP = ?, nominal = ?, periode = ?, ket = ? WHERE id_boosting = ?';
    db.query(sql, [NIP, nominal, periode, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data boosting tidak ditemukan' });
        res.status(200).json({ message: 'Data boosting berhasil diperbarui', data: { id_boosting: id, NIP, nominal, periode, ket } });
    });
};

// Delete record
exports.deleteBoosting = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM perolehan_boosting WHERE id_boosting = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data boosting tidak ditemukan' });
        res.status(200).json({ message: 'Data boosting berhasil dihapus' });
    });
};
