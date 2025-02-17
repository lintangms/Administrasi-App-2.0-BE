const db = require('../config/db');

// Get all records
exports.getAllFarming = (req, res) => {
    const sql = 'SELECT * FROM perolehan_farming ORDER BY id_farming DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data farming berhasil diambil', data: results });
    });
};

// Get all farming records by NIP with date filtering
exports.getFarmingByNip = (req, res) => {
    const { NIP } = req.params;
    const { start_date, end_date } = req.query;

    let sql = 'SELECT * FROM perolehan_farming WHERE NIP = ?';
    let params = [NIP];

    // Tambahkan filter tanggal jika diberikan
    if (start_date && end_date) {
        sql += ' AND periode BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil diambil', data: results });
    });
};

// Create record
exports.createFarming = (req, res) => {
    const { NIP, koin, periode, ket, nama_game } = req.body;

    // Cari id_game berdasarkan nama_game
    const sqlGetGame = 'SELECT id_game FROM game WHERE nama_game = ?';
    db.query(sqlGetGame, [nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });

        const id_game = results[0].id_game;

        // Insert data ke tabel perolehan_farming
        const sqlInsert = 'INSERT INTO perolehan_farming (NIP, koin, ket, id_game) VALUES (?, ?, ?, ?)';
        db.query(sqlInsert, [NIP, koin, ket, id_game], (err, insertResults) => {
            if (err) return res.status(500).json({ message: 'Error pada server', error: err });

            // Hitung total jumlah koin yang pernah diperoleh berdasarkan NIP
            const sqlSumKoin = 'SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE NIP = ?';
            db.query(sqlSumKoin, [NIP], (err, sumResults) => {
                if (err) return res.status(500).json({ message: 'Gagal menghitung total koin', error: err });

                const totalKoin = sumResults[0].total_koin || 0;

                // Hitung total koin yang telah dijual berdasarkan NIP
                const sqlSumDijual = 'SELECT SUM(dijual) AS total_dijual FROM koin WHERE NIP = ?';
                db.query(sqlSumDijual, [NIP], (err, dijualResults) => {
                    if (err) return res.status(500).json({ message: 'Gagal mengambil data total dijual', error: err });

                    const totalDijual = dijualResults[0].total_dijual || 0;
                    const saldoKoinBaru = totalKoin - totalDijual;

                    // Update saldo_koin di tabel koin
                    const sqlUpdateSaldoKoin = `
                        INSERT INTO koin (NIP, jumlah, saldo_koin)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE jumlah = VALUES(jumlah), saldo_koin = VALUES(saldo_koin);
                    `;

                    db.query(sqlUpdateSaldoKoin, [NIP, totalKoin, saldoKoinBaru], (err) => {
                        if (err) return res.status(500).json({ message: 'Gagal update saldo koin', error: err });

                        res.status(201).json({
                            message: 'Data farming berhasil ditambahkan dan saldo koin diperbarui',
                            data: { 
                                id_farming: insertResults.insertId, 
                                NIP, 
                                totalKoin, 
                                saldo_koin: saldoKoinBaru, 
                                periode, 
                                ket, 
                                id_game, 
                                nama_game 
                            }
                        });
                    });
                });
            });
        });
    });
};




// Update record
exports.updateFarming = (req, res) => {
    const { id } = req.params;
    const { NIP, koin, periode, ket } = req.body;

    if (!id || !NIP || !koin || !periode || !ket) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const sql = 'UPDATE perolehan_farming SET NIP = ?, koin = ?, periode = ?, ket = ? WHERE id_farming = ?';
    db.query(sql, [NIP, koin, periode, ket, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil diperbarui', data: { id_farming: id, NIP, koin, periode, ket } });
    });
};

// Delete record
exports.deleteFarming = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM perolehan_farming WHERE id_farming = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil dihapus' });
    });
};


exports.getTotalKoin = (req, res) => {
    const { NIP } = req.params;

    // Query untuk mendapatkan jumlah & saldo_koin dari record terbaru di database
    const sqlJumlahSaldo = `
        SELECT jumlah AS total_koin, saldo_koin
        FROM koin
        WHERE NIP = ?
        ORDER BY id_koin DESC
        LIMIT 1
    `;

    // Query untuk mendapatkan total dijual dari record terbaru yang tidak NULL
    const sqlDijual = `
        SELECT dijual AS total_dijual
        FROM koin
        WHERE NIP = ? AND dijual IS NOT NULL
        ORDER BY id_koin DESC
        LIMIT 1
    `;

    db.query(sqlJumlahSaldo, [NIP], (err, resultJumlahSaldo) => {
        if (err) return res.status(500).json({ message: 'Error fetching jumlah & saldo_koin', error: err });

        // Jika tidak ada data sama sekali untuk jumlah & saldo_koin
        if (resultJumlahSaldo.length === 0) {
            return res.status(404).json({ message: 'Tidak ada data jumlah & saldo_koin' });
        }

        const total_koin = resultJumlahSaldo[0].total_koin;
        const saldo_koin = resultJumlahSaldo[0].saldo_koin;

        db.query(sqlDijual, [NIP], (err, resultDijual) => {
            if (err) return res.status(500).json({ message: 'Error fetching dijual', error: err });

            // Jika tidak ada data untuk dijual
            const total_dijual = resultDijual.length > 0 ? resultDijual[0].total_dijual : "Tidak ada data dijual";

            res.status(200).json({
                NIP,
                total_koin,
                total_dijual,
                saldo_koin
            });
        });
    });
};
