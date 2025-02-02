const db = require('../config/db');

// Get all shifts
exports.getAllShifts = (req, res) => {
    const sql = 'SELECT * FROM shift ORDER BY id_shift DESC'; // Mengurutkan berdasarkan id_shift secara menurun
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data shift berhasil diambil', data: results });
    });
};

// Get single shift
exports.getShiftById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM shift WHERE id_shift = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Shift tidak ditemukan' });
        res.status(200).json({ message: 'Data shift berhasil diambil', data: results[0] });
    });
};

// Create shift
exports.createShift = (req, res) => {
    const { nama_shift } = req.body;
    const sql = 'INSERT INTO shift (nama_shift) VALUES (?)';
    db.query(sql, [nama_shift], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Shift berhasil ditambahkan', 
            data: { id: results.insertId, nama_shift } 
        });
    });
};

// Update shift
exports.updateShift = (req, res) => {
    const { id } = req.params;
    const { nama_shift } = req.body;

    if (!id || !nama_shift) {
        return res.status(400).json({ message: 'ID atau nama_shift tidak boleh kosong' });
    }

    const sql = 'UPDATE shift SET nama_shift = ? WHERE id_shift = ?';
    db.query(sql, [nama_shift, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Shift tidak ditemukan' });
        res.status(200).json({ message: 'Shift berhasil diperbarui', data: { id_shift: id, nama_shift } });
    });
};

// Delete shift
exports.deleteShift = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM shift WHERE id_shift = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Shift tidak ditemukan' });
        res.status(200).json({ message: 'Shift berhasil dihapus' });
    });
};