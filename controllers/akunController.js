const db = require('../config/db');

// Get all records
exports.getAllAkun = (req, res) => {
    const sql = 'SELECT * FROM akun';
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
    const { username, jenis, no_pemulihan, email_pemulihan, ket } = req.body;
    const sql = 'INSERT INTO akun (username, jenis, no_pemulihan, email_pemulihan, ket) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [username, jenis, no_pemulihan, email_pemulihan, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ message: 'Akun berhasil ditambahkan', data: { id: results.insertId, ...req.body } });
    });
};

// Update record
exports.updateAkun = (req, res) => {
    const { id } = req.params;
    const { username, jenis, no_pemulihan, email_pemulihan, ket } = req.body;
    const sql = 'UPDATE akun SET username = ?, jenis = ?, no_pemulihan = ?, email_pemulihan = ?, ket = ? WHERE id_akun = ?';
    db.query(sql, [username, jenis, no_pemulihan, email_pemulihan, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
        res.status(200).json({ message: 'Akun berhasil diperbarui' });
    });
};

// Delete record
exports.deleteAkun = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM akun WHERE id_akun = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
        res.status(200).json({ message: 'Akun berhasil dihapus' });
    });
};
