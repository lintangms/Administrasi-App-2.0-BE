const db = require('../config/db');

// Get all records
exports.getAllKasbon = (req, res) => {
    const sql = 'SELECT * FROM kasbon';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data kasbon berhasil diambil', data: results });
    });
};

// Get single record by NIP with optional date range filter
exports.getKasbonByNip = (req, res) => {
    const { NIP } = req.params;
    const { start_date, end_date } = req.query;

    let sql = 'SELECT * FROM kasbon WHERE NIP = ?';
    let params = [NIP];

    // Tambahkan filter berdasarkan rentang tanggal jika diberikan
    if (start_date && end_date) {
        sql += ' AND tanggal BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Kasbon tidak ditemukan' });
        res.status(200).json({ message: 'Data kasbon berhasil diambil', data: results });
    });
};

// Create record
exports.createKasbon = (req, res) => {
    const { NIP, nominal, keperluan, status = 'belum_lunas', dari, ket, tanggal } = req.body;
    
    // Memastikan tanggal diisi
    if (!tanggal) {
        return res.status(400).json({ message: 'Tanggal wajib diisi' });
    }

    // Query untuk menambahkan kasbon ke database
    const sql = 'INSERT INTO kasbon (NIP, nominal, keperluan, tanggal, status, dari, ket) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [NIP, nominal, keperluan, tanggal, status, dari, ket], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(201).json({ 
            message: 'Kasbon berhasil ditambahkan', 
            data: { 
                id_kasbon: results.insertId, 
                NIP, 
                nominal, 
                keperluan, 
                tanggal, 
                status, 
                dari, 
                ket 
            } 
        });
    });
};


// Update status kasbon
exports.updateKasbon = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // Memastikan status ada dan valid
    if (!status || !['belum_lunas', 'lunas'].includes(status)) {
        return res.status(400).json({ message: 'Status harus diisi dengan "belum_lunas" atau "lunas"' });
    }

    const sql = 'UPDATE kasbon SET status = ? WHERE id_kasbon = ?';
    db.query(sql, [status, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Kasbon tidak ditemukan' });
        res.status(200).json({ message: 'Status kasbon berhasil diperbarui' });
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

// Get ENUM options for "dari" column
exports.getKasbonOptions = (req, res) => {
    const sql = "SHOW COLUMNS FROM kasbon LIKE 'dari'"; // Mengambil informasi tentang kolom 'dari'
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: 'Kolom dari tidak ditemukan di tabel kasbon' });
        }

        // Ambil tipe data ENUM dari hasil query
        const enumValues = results[0].Type;

        // Periksa apakah nilai enum benar-benar ada
        if (!enumValues) {
            return res.status(500).json({ message: 'Tipe data enum untuk kolom dari tidak ditemukan' });
        }

        // Ekstrak nilai-nilai enum menggunakan regex yang lebih fleksibel
        const match = enumValues.match(/\((.*)\)/);
        if (!match || !match[1]) {
            return res.status(500).json({ message: 'Format enum tidak valid atau tidak ditemukan' });
        }

        // Pisahkan nilai-nilai enum dan hapus tanda kutip
        const options = match[1].split(',').map(value => value.trim().replace(/'/g, ''));

        res.status(200).json(options);
    });
};
