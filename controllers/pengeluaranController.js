const db = require('../config/db');

// Get all records
exports.getAllPengeluaran = (req, res) => {
    const sql = 'SELECT * FROM pengeluaran';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data pengeluaran berhasil diambil', data: results });
    });
};

// Get single record
exports.getPengeluaranById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM pengeluaran WHERE id_pengeluaran = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
        res.status(200).json({ message: 'Data pengeluaran berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createPengeluaran = (req, res) => {
    const { tgl_transaksi, uraian, nominal, ket } = req.body;
    const sql = 'INSERT INTO pengeluaran (tgl_transaksi, uraian, nominal, ket) VALUES (?, ?, ?, ?)';
    db.query(sql, [tgl_transaksi, uraian, nominal, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Pengeluaran berhasil ditambahkan', 
            data: { id: results.insertId, ...req.body } 
        });
    });
};

// Update record
exports.updatePengeluaran = (req, res) => {
    const { id } = req.params;
    const { tgl_transaksi, uraian, nominal, ket } = req.body;
    const sql = 'UPDATE pengeluaran SET tgl_transaksi = ?, uraian = ?, nominal = ?, ket = ? WHERE id_pengeluaran = ?';
    db.query(sql, [tgl_transaksi, uraian, nominal, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
        res.status(200).json({ message: 'Pengeluaran berhasil diperbarui' });
    });
};

// Delete record
exports.deletePengeluaran = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM pengeluaran WHERE id_pengeluaran = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
        res.status(200).json({ message: 'Pengeluaran berhasil dihapus' });
    });
};
