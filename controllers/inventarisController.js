const db = require('../config/db');

// Get all records
exports.getAllInventaris = (req, res) => {
    const sql = 'SELECT * FROM inventaris';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data inventaris berhasil diambil', data: results });
    });
};

// Get single record
exports.getInventarisById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM inventaris WHERE id_inventaris = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Inventaris tidak ditemukan' });
        res.status(200).json({ message: 'Data inventaris berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createInventaris = (req, res) => {
    const { nama_barang, tgl_beli, harga, ket } = req.body;
    const sql = 'INSERT INTO inventaris (nama_barang, tgl_beli, harga, ket) VALUES (?, ?, ?, ?)';
    db.query(sql, [nama_barang, tgl_beli, harga, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ message: 'Inventaris berhasil ditambahkan', data: { id: results.insertId, ...req.body } });
    });
};

// Update record
exports.updateInventaris = (req, res) => {
    const { id } = req.params;
    const { nama_barang, tgl_beli, harga, ket } = req.body;
    const sql = 'UPDATE inventaris SET nama_barang = ?, tgl_beli = ?, harga = ?, ket = ? WHERE id_inventaris = ?';
    db.query(sql, [nama_barang, tgl_beli, harga, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Inventaris tidak ditemukan' });
        res.status(200).json({ message: 'Inventaris berhasil diperbarui' });
    });
};

// Delete record
exports.deleteInventaris = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM inventaris WHERE id_inventaris = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Inventaris tidak ditemukan' });
        res.status(200).json({ message: 'Inventaris berhasil dihapus' });
    });
};
