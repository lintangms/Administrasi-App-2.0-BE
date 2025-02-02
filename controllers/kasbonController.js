const db = require('../config/db');

// Get all records
exports.getAllKasbon = (req, res) => {
    const sql = 'SELECT * FROM kasbon';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data kasbon berhasil diambil', data: results });
    });
};

// Get single record
exports.getKasbonById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM kasbon WHERE id_kasbon = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Kasbon tidak ditemukan' });
        res.status(200).json({ message: 'Data kasbon berhasil diambil', data: results[0] });
    });
};

// Create record
exports.createKasbon = (req, res) => {
    const { NIP, nominal, keperluan, status, dari, ket } = req.body;
    const sql = 'INSERT INTO kasbon (NIP, nominal, keperluan, status, dari, ket) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [NIP, nominal, keperluan, status, dari, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Kasbon berhasil ditambahkan', 
            data: { id: results.insertId, ...req.body } 
        });
    });
};

// Update record
exports.updateKasbon = (req, res) => {
    const { id } = req.params;
    const { NIP, nominal, keperluan, status, dari, ket } = req.body;
    const sql = 'UPDATE kasbon SET NIP = ?, nominal = ?, keperluan = ?, status = ?, dari = ?, ket = ? WHERE id_kasbon = ?';
    db.query(sql, [NIP, nominal, keperluan, status, dari, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Kasbon tidak ditemukan' });
        res.status(200).json({ message: 'Kasbon berhasil diperbarui' });
    });
};

// Delete record
exports.deleteKasbon = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM kasbon WHERE id_kasbon = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Kasbon tidak ditemukan' });
        res.status(200).json({ message: 'Kasbon berhasil dihapus' });
    });
};
