const db = require('../config/db');

// Get all records with filtering by month, year, and search
exports.getAllPengeluaran = (req, res) => {
    const { bulan, tahun, search } = req.query;

    let sql = 'SELECT * FROM pengeluaran';
    let params = [];

    let conditions = [];

    if (bulan) {
        conditions.push('MONTH(tgl_transaksi) = ?');
        params.push(bulan);
    }

    if (tahun) {
        conditions.push('YEAR(tgl_transaksi) = ?');
        params.push(tahun);
    }

    if (search) {
        conditions.push('(uraian LIKE ? OR ket LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data pengeluaran berhasil diambil', data: results });
    });
};


// Get total nominal with filtering by month and year
exports.getTotalPengeluaran = (req, res) => {
    const { bulan, tahun } = req.query;

    let sql = 'SELECT SUM(nominal) AS total_nominal FROM pengeluaran';
    let params = [];

    if (bulan && tahun) {
        sql += ' WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?';
        params.push(bulan, tahun);
    } else if (tahun) {
        sql += ' WHERE YEAR(tgl_transaksi) = ?';
        params.push(tahun);
    } else if (bulan) {
        sql += ' WHERE MONTH(tgl_transaksi) = ?';
        params.push(bulan);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Total pengeluaran berhasil dihitung', data: results[0].total_nominal || 0 });
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
