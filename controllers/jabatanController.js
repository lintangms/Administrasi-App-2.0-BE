const db = require('../config/db');

// Get all records
exports.getAllJabatan = (req, res) => {
    const sql = 'SELECT * FROM jabatan ORDER BY id_jabatan DESC'; // Mengurutkan berdasarkan id_jabatan secara menurun
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error saat mengambil data jabatan:', err);
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        res.status(200).json({ message: 'Data jabatan berhasil diambil', data: results });
    });
};

// Get single record
exports.getJabatanById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM jabatan WHERE id_jabatan = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error saat mengambil data jabatan:', err);
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Jabatan tidak ditemukan' });
        }
        res.status(200).json({ message: 'Data jabatan berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createJabatan = (req, res) => {
    const { nama_jabatan } = req.body;

    // Validasi input
    if (!nama_jabatan || typeof nama_jabatan !== 'string') {
        return res.status(400).json({ message: 'Nama jabatan harus diisi dan berupa string' });
    }

    const sql = 'INSERT INTO jabatan (nama_jabatan) VALUES (?)';
    db.query(sql, [nama_jabatan], (err, results) => {
        if (err) {
            console.error('Error saat menambahkan jabatan:', err);
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        res.status(201).json({ 
            message: 'Jabatan berhasil ditambahkan', 
            data: { id: results.insertId, nama_jabatan } 
        });
    });
};

// Update record
exports.updateJabatan = (req, res) => {
    const { id } = req.params;
    const { nama_jabatan } = req.body;

    // Validasi input
    if (!nama_jabatan || typeof nama_jabatan !== 'string') {
        return res.status(400).json({ message: 'Nama jabatan harus diisi dan berupa string' });
    }

    const sql = 'UPDATE jabatan SET nama_jabatan = ? WHERE id_jabatan = ?';
    db.query(sql, [nama_jabatan, id], (err, results) => {
        if (err) {
            console.error('Error saat memperbarui jabatan:', err);
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Jabatan tidak ditemukan' });
        }
        res.status(200).json({ message: 'Jabatan berhasil diperbarui' });
    });
};

// Delete record
exports.deleteJabatan = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM jabatan WHERE id_jabatan = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error saat menghapus jabatan:', err);
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Jabatan tidak ditemukan' });
        }
        res.status(200).json({ message: 'Jabatan berhasil dihapus' });
    });
};