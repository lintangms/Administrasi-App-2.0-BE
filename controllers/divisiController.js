const db = require('../config/db');

// Get all records
exports.getAllDivisi = (req, res) => {
    const sql = 'SELECT * FROM divisi ORDER BY id_divisi DESC'; // Mengurutkan berdasarkan id_divisi secara menurun
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data divisi berhasil diambil', data: results });
    });
};

// Get single record
exports.getDivisiById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM divisi WHERE id_divisi = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Divisi tidak ditemukan' });
        res.status(200).json({ message: 'Data divisi berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createDivisi = (req, res) => {
    const { nama_divisi } = req.body;
    const sql = 'INSERT INTO divisi (nama_divisi) VALUES (?)';
    db.query(sql, [nama_divisi], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Divisi berhasil ditambahkan', 
            data: { id: results.insertId, nama_divisi } 
        });
    });
};

// Update record
exports.updateDivisi = (req, res) => {
    const { id } = req.params;
    const { nama_divisi } = req.body;
  
    if (!id || !nama_divisi) {
      return res.status(400).json({ message: 'ID atau nama_divisi tidak boleh kosong' });
    }
  
    const sql = 'UPDATE divisi SET nama_divisi = ? WHERE id_divisi = ?';
    db.query(sql, [nama_divisi, id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Error pada server', error: err });
      if (results.affectedRows === 0) return res.status(404).json({ message: 'Divisi tidak ditemukan' });
      res.status(200).json({ message: 'Divisi berhasil diperbarui', data: { id_divisi: id, nama_divisi } });
    });
};

// Delete record
exports.deleteDivisi = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM divisi WHERE id_divisi = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Divisi tidak ditemukan' });
        res.status(200).json({ message: 'Divisi berhasil dihapus' });
    });
};