const db = require('../config/db');

// Create unsold record
exports.createUnsold = (req, res) => {
    const { NIP, koin, nama_game, username_steam } = req.body;

    if (!NIP || !koin || !nama_game || !username_steam) {
        return res.status(400).json({ message: 'Mohon lengkapi semua input yang diperlukan' });
    }

    // Ambil id_game berdasarkan nama_game
    const sqlGetGame = 'SELECT id_game FROM game WHERE nama_game = ?';
    db.query(sqlGetGame, [nama_game], (err, gameResults) => {
        if (err) return res.status(500).json({ message: 'Error pada server saat mengambil data game', error: err });
        if (gameResults.length === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });

        const id_game = gameResults[0].id_game;

        // Ambil id_akun berdasarkan username_steam
        const sqlGetAkun = 'SELECT id_akun FROM akun WHERE username_steam = ?';
        db.query(sqlGetAkun, [username_steam], (err, akunResults) => {
            if (err) return res.status(500).json({ message: 'Error pada server saat mengambil data akun', error: err });
            if (akunResults.length === 0) return res.status(404).json({ message: 'Akun tidak ditemukan' });

            const id_akun = akunResults[0].id_akun;

            // Insert data ke tabel unsold (tanggal otomatis saat insert)
            const sqlInsert = 'INSERT INTO unsold (NIP, koin, id_game, id_akun, tanggal) VALUES (?, ?, ?, ?, NOW())';
            db.query(sqlInsert, [NIP, koin, id_game, id_akun], (err, insertResults) => {
                if (err) return res.status(500).json({ message: 'Error pada server saat menyimpan data', error: err });

                res.status(201).json({
                    message: 'Data unsold berhasil ditambahkan',
                    data: {
                        id_unsold: insertResults.insertId,
                        NIP,
                        koin,
                        id_game,
                        nama_game,
                        id_akun,
                        username_steam,
                        tanggal: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
                    }
                });
            });
        });
    });
};

// GET ALL: Ambil semua data unsold (dengan filter bulan dan tahun opsional)
exports.getAllUnsold = (req, res) => {
    const { bulan, tahun, nama, nama_game } = req.query; // Ambil parameter filter dari query

    let sql = `
        SELECT u.id_unsold, u.NIP, k.nama, u.koin, u.tanggal, u.harga_beli, u.total_harga, 
               g.id_game, g.nama_game, 
               a.id_akun, a.username_steam
        FROM unsold u
        JOIN game g ON u.id_game = g.id_game
        JOIN akun a ON u.id_akun = a.id_akun
        JOIN karyawan k ON u.NIP = k.NIP
    `;

    let filterValues = [];
    let conditions = [];

    // Filter berdasarkan bulan
    if (bulan) {
        conditions.push('MONTH(u.tanggal) = ?');
        filterValues.push(parseInt(bulan));
    }

    // Filter berdasarkan tahun
    if (tahun) {
        conditions.push('YEAR(u.tanggal) = ?');
        filterValues.push(parseInt(tahun));
    }

    // Filter berdasarkan nama karyawan (menggunakan LIKE untuk pencarian fleksibel)
    if (nama) {
        conditions.push('k.nama LIKE ?');
        filterValues.push(`%${nama}%`);
    }

    // Filter berdasarkan nama game (menggunakan LIKE untuk pencarian fleksibel)
    if (nama_game) {
        filterConditions.push('g.nama_game = ?');
        params.push(nama_game);
    }

    // Tambahkan kondisi WHERE jika ada filter
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    db.query(sql, filterValues, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error saat mengambil data unsold', error: err });

        res.status(200).json({
            message: 'Data unsold berhasil diambil',
            data: results
        });
    });
};


// GET BY NIP: Ambil data unsold berdasarkan NIP (dengan filter bulan dan tahun opsional)
exports.getUnsoldByNIP = (req, res) => {
    const { NIP } = req.params;
    const { bulan, tahun } = req.query; // Ambil parameter bulan dan tahun dari query

    let sql = `
        SELECT u.id_unsold, u.NIP, u.koin, u.tanggal, 
               g.id_game, g.nama_game, 
               a.id_akun, a.username_steam
        FROM unsold u
        JOIN game g ON u.id_game = g.id_game
        JOIN akun a ON u.id_akun = a.id_akun
        WHERE u.NIP = ?
    `;

    let filterValues = [NIP];
    let conditions = [];

    if (bulan) {
        conditions.push('MONTH(u.tanggal) = ?');
        filterValues.push(parseInt(bulan));
    }
    if (tahun) {
        conditions.push('YEAR(u.tanggal) = ?');
        filterValues.push(parseInt(tahun));
    }

    if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }

    db.query(sql, filterValues, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error saat mengambil data unsold', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data unsold tidak ditemukan untuk NIP ini' });

        res.status(200).json({
            message: 'Data unsold berhasil diambil',
            data: results
        });
    });
};




// SELL UNSOLD: Mengupdate harga_beli dan total_harga berdasarkan id_unsold dari request parameter
exports.sellUnsold = (req, res) => {
    const { id_unsold } = req.params; // Ambil id_unsold dari URL parameter
    const { harga_beli } = req.body; // harga_beli tetap di body

    if (!id_unsold || !harga_beli) {
        return res.status(400).json({ message: 'Mohon lengkapi semua input yang diperlukan' });
    }

    // Ambil jumlah koin berdasarkan id_unsold
    const sqlGetKoin = 'SELECT koin FROM unsold WHERE id_unsold = ?';
    db.query(sqlGetKoin, [id_unsold], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server saat mengambil data unsold', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data unsold tidak ditemukan' });

        const koin = results[0].koin;
        const total_harga = koin * harga_beli;

        // Update harga_beli dan total_harga di tabel unsold
        const sqlUpdate = 'UPDATE unsold SET harga_beli = ?, total_harga = ? WHERE id_unsold = ?';
        db.query(sqlUpdate, [harga_beli, total_harga, id_unsold], (err, updateResults) => {
            if (err) return res.status(500).json({ message: 'Error pada server saat memperbarui data', error: err });

            res.status(200).json({
                message: 'Data unsold berhasil dijual',
                data: {
                    id_unsold,
                    koin,
                    harga_beli,
                    total_harga
                }
            });
        });
    });
};


// TOTAL UNSOLD: Hitung total koin dan total harga berdasarkan bulan dan tahun
exports.totalUnsold = (req, res) => {
    const { bulan, tahun } = req.query; // Ambil parameter bulan dan tahun dari query

    let sql = `
        SELECT 
            COALESCE(SUM(u.koin), 0) AS total_koin, 
            COALESCE(SUM(u.total_harga), 0) AS total_harga
        FROM unsold u
    `;

    let filterValues = [];
    let conditions = [];

    if (bulan) {
        conditions.push('MONTH(u.tanggal) = ?');
        filterValues.push(parseInt(bulan));
    }
    if (tahun) {
        conditions.push('YEAR(u.tanggal) = ?');
        filterValues.push(parseInt(tahun));
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    db.query(sql, filterValues, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error saat menghitung total unsold', error: err });

        res.status(200).json({
            message: 'Total unsold berhasil dihitung',
            data: results[0]
        });
    });
};
