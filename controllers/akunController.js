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
    const { username_steam, password_steam, gmail, password_gmail, no_pemulihan, email_pemulihan, ket } = req.body;
    const sql = 'INSERT INTO akun (username_steam, password_steam, gmail, password_gmail, no_pemulihan, email_pemulihan, ket) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [username_steam, password_steam, gmail, password_gmail, no_pemulihan, email_pemulihan, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ message: 'Akun berhasil ditambahkan', data: { id: results.insertId, ...req.body } });
    });
};


// Update record
exports.updateAkun = (req, res) => {
    const { id } = req.params;
    const { username_steam, password_steam, gmail, password_gmail, no_pemulihan, email_pemulihan, ket } = req.body;
    const sql = 'UPDATE akun SET username_steam = ?, password_steam = ?, gmail = ?, password_gmail = ?, no_pemulihan = ?, email_pemulihan = ?, ket = ? WHERE id_akun = ?';
    db.query(sql, [username_steam, password_steam, gmail, password_gmail, no_pemulihan, email_pemulihan, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
        res.status(200).json({ message: 'Akun berhasil diperbarui' });
    });
};


// Delete `id_akun` dari `karyawan` sebelum hapus akun
exports.deleteAkun = (req, res) => {
    const { id } = req.params;

    // Ubah `id_akun` di `karyawan` jadi NULL biar gak ada foreign key error
    const sqlUpdateKaryawan = 'UPDATE karyawan SET id_akun = NULL WHERE id_akun = ?';
    db.query(sqlUpdateKaryawan, [id], (err) => {
        if (err) return res.status(500).json({ message: 'Gagal menghapus relasi akun di karyawan', error: err });

        // Setelah `id_akun` dihapus dari `karyawan`, baru hapus akun
        const sqlDeleteAkun = 'DELETE FROM akun WHERE id_akun = ?';
        db.query(sqlDeleteAkun, [id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Gagal menghapus akun', error: err });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });
            res.status(200).json({ message: 'Akun berhasil dihapus tanpa menghapus data lain' });
        });
    });
};

