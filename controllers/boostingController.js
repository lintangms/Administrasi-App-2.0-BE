const db = require('../config/db');

// Get all records
exports.getAllBoosting = (req, res) => {
    const sql = 'SELECT * FROM perolehan_boosting ORDER BY id_boosting DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data boosting berhasil diambil', data: results });
    });
};

// Get single record
exports.getBoostingByNip = (req, res) => {
    const { NIP } = req.params;
    const sql = 'SELECT * FROM perolehan_boosting WHERE NIP = ?';
    db.query(sql, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data boosting tidak ditemukan' });
        res.status(200).json({ message: 'Data boosting berhasil diambil', data: results[0] });
    });
};


// Create record
exports.createBoosting = (req, res) => {
    const { NIP, nominal, periode, ket } = req.body;
    const sql = 'INSERT INTO perolehan_boosting (NIP, nominal, periode, ket) VALUES (?, ?, ?, ?)';
    db.query(sql, [NIP, nominal, periode, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Data boosting berhasil ditambahkan', 
            data: { id_boosting: results.insertId, NIP, nominal, periode, ket } 
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
