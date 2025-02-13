const db = require('../config/db');

// Get all records
exports.getAllTugas = (req, res) => {
    const sql = 'SELECT * FROM tugas';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data tugas berhasil diambil', data: results });
    });
};

// Get single record by id_tugas
exports.getTugasById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM tugas WHERE id_tugas = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
        res.status(200).json({ message: 'Data tugas berhasil diambil', data: results[0] });
    });
};

// Get records by NIP
exports.getTugasByNIP = (req, res) => {
    const { NIP } = req.params;
    const sql = 'SELECT * FROM tugas WHERE NIP = ?';
    
    db.query(sql, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Tidak ada tugas untuk NIP ini' });
        
        res.status(200).json({ message: 'Data tugas berhasil diambil', data: results });
    });
};


// Create record
exports.createTugas = (req, res) => {
    const { NIP, deskripsi, tanggal_mulai, tanggal_tenggat, ket } = req.body;

    // Validasi apakah NIP ada di tabel karyawan
    const checkNIP = 'SELECT * FROM karyawan WHERE NIP = ?';
    db.query(checkNIP, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(400).json({ message: 'NIP tidak ditemukan di tabel karyawan' });

        // Jika NIP valid, lanjutkan untuk menambahkan tugas
        const sql = 'INSERT INTO tugas (NIP, deskripsi, tanggal_mulai, tanggal_tenggat, ket) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [NIP, deskripsi, tanggal_mulai, tanggal_tenggat, ket], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });
            res.status(201).json({ message: 'Tugas berhasil ditambahkan', data: { id_tugas: results.insertId, ...req.body } });
        });
    });
};

// Update record
exports.updateTugas = (req, res) => {
    const { id } = req.params;
    const { NIP, deskripsi, tanggal_mulai, tanggal_tenggat, ket } = req.body;

    // Validasi apakah NIP ada di tabel karyawan
    const checkNIP = 'SELECT * FROM karyawan WHERE NIP = ?';
    db.query(checkNIP, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(400).json({ message: 'NIP tidak ditemukan di tabel karyawan' });

        // Jika NIP valid, lanjutkan untuk memperbarui tugas
        const sql = 'UPDATE tugas SET NIP = ?, deskripsi = ?, tanggal_mulai = ?, tanggal_tenggat = ?, ket = ? WHERE id_tugas = ?';
        db.query(sql, [NIP, deskripsi, tanggal_mulai, tanggal_tenggat, ket, id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
            res.status(200).json({ message: 'Tugas berhasil diperbarui' });
        });
    });
};

// Delete record
exports.deleteTugas = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tugas WHERE id_tugas = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
        res.status(200).json({ message: 'Tugas berhasil dihapus' });
    });
};
