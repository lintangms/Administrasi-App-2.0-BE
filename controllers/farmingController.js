const db = require('../config/db');

// Get latest records per NIP with optional date filtering
exports.getAllFarming = (req, res) => {
    const { periode } = req.query; // Periode dalam format YYYY-MM-DD

    let sql = `
        SELECT pf.* 
        FROM perolehan_farming pf
        INNER JOIN (
            SELECT NIP, MAX(periode) AS max_periode
            FROM perolehan_farming
            GROUP BY NIP
        ) latest ON pf.NIP = latest.NIP AND pf.periode = latest.max_periode
    `;

    let params = [];

    if (periode) {
        sql += ' WHERE DATE(pf.periode) = ?'; // Ambil hanya bagian tanggal dari TIMESTAMP
        params.push(periode);
    }

    sql += ' ORDER BY pf.id_farming DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Data farming terakhir per NIP berhasil diambil', data: results });
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
    const { NIP, koin, ket, nama_game } = req.body;
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

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

            // Hitung total koin yang pernah diperoleh berdasarkan NIP dan id_game
            const sqlSumKoin = 'SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE NIP = ? AND id_game = ?';
            db.query(sqlSumKoin, [NIP, id_game], (err, sumResults) => {
                if (err) return res.status(500).json({ message: 'Gagal menghitung total koin', error: err });

                const totalKoin = sumResults[0].total_koin || 0;

                // Hitung total koin yang telah dijual berdasarkan NIP dan id_game
                const sqlSumDijual = 'SELECT SUM(dijual) AS total_dijual FROM koin WHERE NIP = ? AND id_game = ?';
                db.query(sqlSumDijual, [NIP, id_game], (err, dijualResults) => {
                    if (err) return res.status(500).json({ message: 'Gagal mengambil data total dijual', error: err });

                    const totalDijual = dijualResults[0].total_dijual || 0;
                    const saldoKoinBaru = totalKoin - totalDijual;

                    // Update saldo_koin di tabel koin
                    const sqlUpdateSaldoKoin = `
                        INSERT INTO koin (NIP, id_game, jumlah, saldo_koin, tanggal)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE jumlah = VALUES(jumlah), saldo_koin = VALUES(saldo_koin), tanggal = VALUES(tanggal);
                    `;

                    db.query(sqlUpdateSaldoKoin, [NIP, id_game, totalKoin, saldoKoinBaru, currentDate], (err, updateResults) => {
                        if (err) return res.status(500).json({ message: 'Gagal update saldo koin', error: err });

                        // Ambil id_koin terbaru setelah update
                        const sqlGetIdKoin = 'SELECT id_koin FROM koin WHERE NIP = ? AND id_game = ? ORDER BY tanggal DESC LIMIT 1';
                        db.query(sqlGetIdKoin, [NIP, id_game], (err, koinResults) => {
                            if (err) return res.status(500).json({ message: 'Gagal mengambil id_koin', error: err });

                            if (koinResults.length === 0) return res.status(500).json({ message: 'id_koin tidak ditemukan' });

                            const id_koin = koinResults[0].id_koin;

                            console.log(`ID KOIN TERBARU: ${id_koin} untuk NIP: ${NIP}`);

                            // Update id_koin di tabel target
                            const sqlUpdateTarget = `
                                UPDATE target 
                                SET id_koin = ? 
                                WHERE NIP = ? 
                                AND id_target = (SELECT id_target FROM (SELECT id_target FROM target WHERE NIP = ? ORDER BY tanggal DESC LIMIT 1) AS subquery)
                                LIMIT 1;
                            `;

                            db.query(sqlUpdateTarget, [id_koin, NIP, NIP], (err, updateTargetResults) => {
                                if (err) {
                                    console.error('Gagal update id_koin di tabel target:', err);
                                    return res.status(500).json({ message: 'Gagal mengupdate data di tabel target', error: err });
                                }

                                console.log(`UPDATE TARGET: ${updateTargetResults.affectedRows} baris diubah untuk NIP: ${NIP}`);

                                // Ambil target terbaru untuk menghitung persentase
                                const sqlGetTarget = 'SELECT target FROM target WHERE NIP = ? ORDER BY tanggal DESC LIMIT 1';
                                db.query(sqlGetTarget, [NIP], (err, targetResults) => {
                                    if (err) return res.status(500).json({ message: 'Gagal mengambil target', error: err });

                                    if (targetResults.length === 0) return res.status(500).json({ message: 'Target tidak ditemukan' });

                                    const target = targetResults[0].target;
                                    const persentase = target > 0 ? (saldoKoinBaru / target) * 100 : 0;

                                    // Update persentase di tabel target
                                    const sqlUpdatePersentase = `
                                        UPDATE target 
                                        SET persentase = ? 
                                        WHERE NIP = ? 
                                        AND id_target = (SELECT id_target FROM (SELECT id_target FROM target WHERE NIP = ? ORDER BY tanggal DESC LIMIT 1) AS subquery)
                                        LIMIT 1;
                                    `;

                                    db.query(sqlUpdatePersentase, [persentase, NIP, NIP], (err, updatePersentaseResults) => {
                                        if (err) {
                                            console.error('Gagal update persentase di tabel target:', err);
                                            return res.status(500).json({ message: 'Gagal mengupdate persentase di tabel target', error: err });
                                        }

                                        console.log(`UPDATE PERSENTASE: ${updatePersentaseResults.affectedRows} baris diubah untuk NIP: ${NIP}`);

                                        res.status(201).json({
                                            message: 'Data farming berhasil ditambahkan, saldo koin diperbarui, koin dan persentase diperbarui di target',
                                            data: { 
                                                id_farming: insertResults.insertId, 
                                                NIP, 
                                                totalKoin, 
                                                saldo_koin: saldoKoinBaru, 
                                                ket, 
                                                id_game, 
                                                nama_game, 
                                                tanggal: currentDate,
                                                id_koin,
                                                target,
                                                persentase
                                            }
                                        });
                                    });
                                });
                            });
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


exports.getAllTotalKoin = (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const bulan = req.query.bulan ? parseInt(req.query.bulan) : currentMonth;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : currentYear;
    const nama_game = req.query.nama_game ? req.query.nama_game : null;

    // Query untuk mendapatkan id_game berdasarkan nama_game
    const sqlGetIdGame = `SELECT id_game FROM game WHERE nama_game = ?`;

    if (nama_game) {
        db.query(sqlGetIdGame, [nama_game], (err, gameResults) => {
            if (err) return res.status(500).json({ message: 'Error fetching game ID', error: err });

            if (gameResults.length === 0) {
                return res.status(404).json({ message: `Game dengan nama "${nama_game}" tidak ditemukan` });
            }

            const id_game = gameResults[0].id_game;
            fetchTotalKoin(res, bulan, tahun, id_game);
        });
    } else {
        fetchTotalKoin(res, bulan, tahun, null);
    }
};

function fetchTotalKoin(res, bulan, tahun, id_game) {
    const sql = `
        SELECT k.id_koin, k.NIP, ky.nama, k.saldo_koin, k.jumlah AS total_koin, 
               IFNULL(k.dijual, "Tidak ada data dijual") AS total_dijual,
               g.nama_game
        FROM koin k
        INNER JOIN karyawan ky ON k.NIP = ky.NIP
        INNER JOIN (
            SELECT NIP, MAX(id_koin) AS max_id
            FROM koin
            GROUP BY NIP
        ) latest ON k.NIP = latest.NIP AND k.id_koin = latest.max_id
        INNER JOIN perolehan_farming pf ON pf.NIP = k.NIP
        INNER JOIN game g ON pf.id_game = g.id_game
        WHERE MONTH(pf.periode) = ? 
        AND YEAR(pf.periode) = ?
        ${id_game ? "AND g.id_game = ?" : ""}
        GROUP BY k.NIP, g.nama_game
        ORDER BY k.NIP ASC
    `;

    const params = id_game ? [bulan, tahun, id_game] : [bulan, tahun];

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching total koin', error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: `Tidak ada data koin untuk periode ${bulan}-${tahun}` });
        }

        res.status(200).json({
            message: `Data total koin terakhir per NIP untuk periode ${bulan}-${tahun} berhasil diambil`,
            data: results
        });
    });
}



exports.getTotalKoinByNIP = (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const bulan = req.query.bulan ? parseInt(req.query.bulan) : currentMonth;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : currentYear;
    const { NIP } = req.params; // Ambil NIP dari parameter URL

    const sql = `
        SELECT k.NIP, ky.nama, 
               (SELECT saldo_koin FROM koin WHERE NIP = k.NIP ORDER BY tanggal DESC LIMIT 1) AS total_saldo_koin,
               (SELECT dijual FROM koin WHERE NIP = k.NIP ORDER BY tanggal DESC LIMIT 1) AS total_dijual,
               SUM(k.jumlah) AS total_koin
        FROM koin k
        INNER JOIN karyawan ky ON k.NIP = ky.NIP
        WHERE k.NIP = ? 
        AND EXISTS (
            SELECT 1 FROM perolehan_farming pf
            WHERE pf.NIP = k.NIP 
            AND MONTH(pf.periode) = ? 
            AND YEAR(pf.periode) = ?
        )
        GROUP BY k.NIP, ky.nama
    `;

    db.query(sql, [NIP, bulan, tahun], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching total koin for NIP', error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: `Tidak ada data koin untuk NIP ${NIP} pada periode ${bulan}-${tahun}` });
        }

        res.status(200).json({
            message: `Data total koin untuk NIP ${NIP} pada periode ${bulan}-${tahun} berhasil diambil`,
            data: {
                NIP: results[0].NIP,
                nama: results[0].nama,
                total_saldo_koin: results[0].total_saldo_koin || 0,
                total_dijual: results[0].total_dijual || 0,
                total_koin: results[0].total_koin || 0
            }
        });
    });
};
