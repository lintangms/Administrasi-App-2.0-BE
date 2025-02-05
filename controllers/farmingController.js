const db = require('../config/db');

// Get all records
exports.getAllFarming = (req, res) => {
    const sql = 'SELECT * FROM perolehan_farming ORDER BY id_farming DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data farming berhasil diambil', data: results });
    });
};

// Get single record
exports.getFarmingByNip = (req, res) => {
    const { NIP } = req.params;
    const sql = 'SELECT * FROM perolehan_farming WHERE NIP = ?';
    db.query(sql, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createFarming = (req, res) => {
    const { NIP, koin, periode, ket } = req.body;
    const sql = 'INSERT INTO perolehan_farming (NIP, koin, periode, ket) VALUES (?, ?, ?, ?)';
    db.query(sql, [NIP, koin, periode, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({
            message: 'Data farming berhasil ditambahkan',
            data: { id_farming: results.insertId, NIP, koin, periode, ket }
        });
    });
};

// Update record
exports.updateFarming = (req, res) => {
    const { id } = req.params;
    const { NIP, koin, periode, ket } = req.body;

    if (!id || !NIP || !koin || !periode || !ket) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const sql = 'UPDATE perolehan_farming SET NIP = ?, koin = ?, periode = ?, ket = ? WHERE id_farming = ?';
    db.query(sql, [NIP, koin, periode, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil diperbarui', data: { id_farming: id, NIP, koin, periode, ket } });
    });
};

// Delete record
exports.deleteFarming = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM perolehan_farming WHERE id_farming = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil dihapus' });
    });
};
