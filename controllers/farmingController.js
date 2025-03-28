const db = require('../config/db');

exports.getAllFarming = (req, res) => {
    const { tanggal, bulan, tahun, minggu_bulan, nama_shift, nama_game, nama, order = 'DESC' } = req.query;

    let sql = `
        SELECT k.nip, k.nama, 
               COALESCE(s.nama_shift, '') as nama_shift, 
               COALESCE(g.nama_game, '') as nama_game, 
               COALESCE(a.username_steam, '') as username_steam, 
               COALESCE(koin.id_koin, '') as id_koin, 
               COALESCE(koin.tanggal, '') as tanggal, 
               COALESCE(koin.saldo_koin, 0) as saldo,
               COALESCE(koin.total_saldo, 0) AS total_saldo
        FROM karyawan k
        LEFT JOIN (
            SELECT k1.nip, 
                   MAX(k1.id_koin) AS id_koin, 
                   MAX(k1.tanggal) AS tanggal,
                   (SELECT saldo_koin FROM koin k2 WHERE k2.nip = k1.nip ORDER BY k2.id_koin ${order} LIMIT 1) AS saldo_koin,
                   (SELECT jumlah FROM koin k2 WHERE k2.nip = k1.nip ORDER BY k2.id_koin ${order} LIMIT 1) AS total_saldo
            FROM koin k1
            GROUP BY k1.nip
        ) koin ON k.nip = koin.nip
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        LEFT JOIN game g ON k.id_game = g.id_game
        LEFT JOIN akun a ON k.id_akun = a.id_akun
    `;

    let params = [];
    let conditions = [];
    let filterConditions = [];

    // Bulan, Tahun, dan Tanggal: tetap menampilkan semua karyawan
    if (bulan) {
        conditions.push('(koin.tanggal IS NULL OR MONTH(koin.tanggal) = ?)');
        params.push(bulan);
    }

    if (tahun) {
        conditions.push('(koin.tanggal IS NULL OR YEAR(koin.tanggal) = ?)');
        params.push(tahun);
    }

    if (tanggal) {
        conditions.push('(koin.tanggal IS NULL OR DATE(koin.tanggal) = ?)');
        params.push(tanggal);
    }

    // Filtering lainnya (benar-benar menyaring data)
    if (minggu_bulan) {
        filterConditions.push('CEIL(DAY(koin.tanggal) / 7) = ?');
        params.push(minggu_bulan);
    }

    if (nama_shift) {
        filterConditions.push('s.nama_shift = ?');
        params.push(nama_shift);
    }

    if (nama_game) {
        filterConditions.push('g.nama_game = ?');
        params.push(nama_game);
    }

    if (nama) {
        filterConditions.push('k.nama LIKE ?');
        params.push(`%${nama}%`);
    }

    // Gabungkan kondisi WHERE
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (filterConditions.length > 0) {
        sql += conditions.length > 0 ? ' AND ' : ' WHERE ';
        sql += filterConditions.join(' AND ');
    }

    sql += ` ORDER BY k.nip, koin.id_koin ${order}`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json({ message: 'Semua data saldo koin berhasil diambil', data: results });
    });
};


// Get all farming records by NIP with date filtering and additional info
exports.getFarmingByNip = (req, res) => {
    const { NIP } = req.params;
    const { start_date, end_date } = req.query;

    let sql = `
        SELECT pf.*, k.nama, s.nama_shift, g.nama_game, a.username_steam
        FROM perolehan_farming pf
        LEFT JOIN karyawan k ON pf.nip = k.nip
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        LEFT JOIN game g ON k.id_game = g.id_game
        LEFT JOIN akun a ON k.id_akun = a.id_akun
        WHERE pf.nip = ?
    `;

    let params = [NIP];

    if (start_date && end_date) {
        sql += ' AND pf.periode BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    sql += ' ORDER BY pf.periode DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data farming tidak ditemukan' });
        res.status(200).json({ message: 'Data farming berhasil diambil', data: results });
    });
};
// exports.createFarming = (req, res) => {
//     const { NIP, koin, ket, nama_game } = req.body;
//     const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

//     // Cari id_game berdasarkan nama_game
//     const sqlGetGame = 'SELECT id_game FROM game WHERE nama_game = ?';
//     db.query(sqlGetGame, [nama_game], (err, results) => {
//         if (err) return res.status(500).json({ message: 'Error pada server', error: err });
//         if (results.length === 0) return res.status(404).json({ message: 'Game tidak ditemukan' });

//         const id_game = results[0].id_game;

//         // Insert ke perolehan_farming
//         const sqlInsert = 'INSERT INTO perolehan_farming (NIP, koin, ket, id_game) VALUES (?, ?, ?, ?)';
//         db.query(sqlInsert, [NIP, koin, ket, id_game], (err, insertResults) => {
//             if (err) return res.status(500).json({ message: 'Error pada server', error: err });

//             // Hitung total koin yang pernah diperoleh berdasarkan NIP dan id_game
//             const sqlSumKoin = 'SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE id_game = ? AND NIP = ?';
//             db.query(sqlSumKoin, [id_game, NIP], (err, sumResults) => {
//                 if (err) return res.status(500).json({ message: 'Gagal menghitung total koin', error: err });

//                 const totalKoin = sumResults[0].total_koin || 0;

//                 // Hitung total koin yang telah dijual berdasarkan NIP dan id_game
//                 const sqlSumDijual = 'SELECT SUM(dijual) AS total_dijual FROM koin WHERE id_game = ? AND NIP = ?';
//                 db.query(sqlSumDijual, [id_game, NIP], (err, dijualResults) => {
//                     if (err) return res.status(500).json({ message: 'Gagal mengambil data total dijual', error: err });

//                     const totalDijual = dijualResults[0].total_dijual || 0;
//                     const saldoKoinBaru = totalKoin - totalDijual;

//                     // Insert ke koin (mempertimbangkan NIP)
//                     const sqlInsertKoin = `INSERT INTO koin (id_game, NIP, jumlah, saldo_koin, tanggal) VALUES (?, ?, ?, ?, ?)`;
//                     db.query(sqlInsertKoin, [id_game, NIP, totalKoin, saldoKoinBaru, currentDate], (err, insertKoinResults) => {
//                         if (err) return res.status(500).json({ message: 'Gagal menambahkan record koin', error: err });
//                         const id_koin = insertKoinResults.insertId;

//                         // Jika game adalah WOW, insert ke koin_wow tanpa memandang NIP
//                         if (nama_game === "WOW") {
//                             const sqlSumKoinWow = 'SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE id_game = ?';
//                             db.query(sqlSumKoinWow, [id_game], (err, sumWowResults) => {
//                                 if (err) return res.status(500).json({ message: 'Gagal menghitung total koin WOW', error: err });

//                                 const totalKoinWow = sumWowResults[0].total_koin || 0;

//                                 const sqlInsertKoinWow = `INSERT INTO koin_wow (id_game, jumlah, saldo_koin, tanggal) VALUES (?, ?, ?, ?)`;
//                                 db.query(sqlInsertKoinWow, [id_game, totalKoinWow, totalKoinWow, currentDate], (err, insertKoinWowResults) => {
//                                     if (err) return res.status(500).json({ message: 'Gagal menambahkan record koin WOW', error: err });
//                                 });
//                             });
//                         }

//                         res.status(201).json({
//                             message: 'Data farming berhasil ditambahkan dan koin diperbarui',
//                             data: { NIP, totalKoin, saldo_koin: saldoKoinBaru, ket, id_game, nama_game, tanggal: currentDate, id_koin }
//                         });
//                     });
//                 });
//             });
//         });
//     });
// };

// Create record
exports.createFarming = (req, res) => {
    const { NIP, koin, ket, nama_game } = req.body;
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const currentMonth = new Date().getMonth() + 1; // Current month (1-12)
    const currentYear = new Date().getFullYear(); // Current year

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

            // Hitung total koin berdasarkan id_game dan NIP
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

                    // Insert record baru di tabel koin
                    const sqlInsertKoin = `
                        INSERT INTO koin (NIP, id_game, jumlah, saldo_koin, tanggal)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    db.query(sqlInsertKoin, [NIP, id_game, totalKoin, saldoKoinBaru, currentDate], (err, insertKoinResults) => {
                        if (err) return res.status(500).json({ message: 'Gagal menambahkan record koin baru', error: err });

                        const id_koin = insertKoinResults.insertId;

                        // Jika game adalah "WOW", buat logika yang sama untuk koin_wow berdasarkan id_game
                        if (nama_game === "WOW") {
                            // Hitung total koin WOW dari semua NIP untuk game WOW
                            const sqlSumAllKoinWow = 'SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE id_game = ?';
                            db.query(sqlSumAllKoinWow, [id_game], (err, sumWowResults) => {
                                if (err) return res.status(500).json({ message: 'Gagal menghitung total koin untuk koin_wow', error: err });

                                const totalKoinWow = sumWowResults[0].total_koin || 0;

                                // Hitung total koin WOW yang telah dijual
                                const sqlSumDijualWow = 'SELECT SUM(dijual) AS total_dijual FROM koin_wow WHERE id_game = ?';
                                db.query(sqlSumDijualWow, [id_game], (err, dijualWowResults) => {
                                    if (err) return res.status(500).json({ message: 'Gagal mengambil data total dijual WOW', error: err });

                                    const totalDijualWow = dijualWowResults[0].total_dijual || 0;
                                    const saldoKoinWow = totalKoinWow - totalDijualWow;

                                    // Cek apakah sudah ada record koin_wow untuk game WOW
                                    const sqlCheckKoinWow = 'SELECT id_wow FROM koin_wow WHERE id_game = ? LIMIT 1';
                                    db.query(sqlCheckKoinWow, [id_game], (err, checkResults) => {
                                        if (err) return res.status(500).json({ message: 'Gagal memeriksa data koin_wow', error: err });

                                        if (checkResults.length > 0) {
                                            // Update existing koin_wow record
                                            const sqlUpdateKoinWow = `
                                                UPDATE koin_wow 
                                                SET jumlah = ?, saldo_koin = ?, tanggal = ?
                                                WHERE id_game = ?
                                            `;
                                            db.query(sqlUpdateKoinWow, [totalKoinWow, saldoKoinWow, currentDate, id_game], (err) => {
                                                if (err) return res.status(500).json({ message: 'Gagal mengupdate record koin_wow', error: err });
                                            });
                                        } else {
                                            // Insert new koin_wow record
                                            const sqlInsertKoinWow = `
                                                INSERT INTO koin_wow (NIP, id_game, jumlah, saldo_koin, tanggal)
                                                VALUES (?, ?, ?, ?, ?)
                                            `;
                                            db.query(sqlInsertKoinWow, [NIP, id_game, totalKoinWow, saldoKoinWow, currentDate], (err) => {
                                                if (err) return res.status(500).json({ message: 'Gagal menambahkan record ke koin_wow', error: err });
                                            });
                                        }
                                    });
                                });
                            });
                        }

                        // Ambil target di bulan dan tahun yang sama
                        const sqlGetTargetByMonth = `
                            SELECT id_target, target 
                            FROM target 
                            WHERE NIP = ? 
                            AND MONTH(tanggal) = ? 
                            AND YEAR(tanggal) = ?
                            ORDER BY tanggal DESC 
                            LIMIT 1
                        `;
                        db.query(sqlGetTargetByMonth, [NIP, currentMonth, currentYear], (err, targetMonthResults) => {
                            if (err) {
                                return res.status(500).json({ message: 'Gagal mengambil target bulan ini', error: err });
                            }

                            if (targetMonthResults.length > 0) {
                                const id_target = targetMonthResults[0].id_target;
                                const target = targetMonthResults[0].target;
                                const persentase = target > 0 ? (saldoKoinBaru / target) * 100 : 0;

                                // Update id_koin dan persentase di tabel target untuk bulan dan tahun yang sama
                                const sqlUpdateTargetMonth = `
                                    UPDATE target 
                                    SET id_koin = ?, persentase = ? 
                                    WHERE id_target = ?
                                `;
                                db.query(sqlUpdateTargetMonth, [id_koin, persentase, id_target], (err, updateTargetResults) => {
                                    if (err) {
                                        return res.status(500).json({ message: 'Gagal mengupdate data di tabel target', error: err });
                                    }

                                    res.status(201).json({
                                        message: 'Data farming berhasil ditambahkan, record koin baru dibuat, dan target bulan ini diperbarui',
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
                                            persentase,
                                            bulan: currentMonth,
                                            tahun: currentYear
                                        }
                                    });
                                });
                            } else {
                                res.status(201).json({
                                    message: 'Data farming berhasil ditambahkan dan record koin baru dibuat. Tidak ada target untuk bulan ini.',
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
                                        bulan: currentMonth,
                                        tahun: currentYear
                                    }
                                });
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

exports.getAllTotalKoin = (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const bulan = req.query.bulan ? parseInt(req.query.bulan) : currentMonth;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : currentYear;
    const namaGame = req.query.nama_game || null;

    fetchTotalKoin(res, bulan, tahun, namaGame);
};

function fetchTotalKoin(res, bulan, tahun, namaGame) {
    let sql = `
        SELECT k.id_koin, k.NIP, ky.nama, 
               COALESCE(k.saldo_koin, 0) AS saldo_koin, 
               COALESCE(k.jumlah, 0) AS total_koin, 
               COALESCE((
                    SELECT k2.dijual 
                    FROM koin k2 
                    WHERE k2.NIP = k.NIP 
                    AND k2.dijual IS NOT NULL 
                    ORDER BY k2.id_koin DESC 
                    LIMIT 1
               ), '') AS total_dijual, 
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
    `;

    const queryParams = [bulan, tahun];

    if (namaGame) {
        sql += " AND g.nama_game = ?";
        queryParams.push(namaGame);
    }

    sql += " GROUP BY k.NIP, g.nama_game ORDER BY k.NIP ASC";

    db.query(sql, queryParams, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching total koin', error: err });

        if (namaGame && namaGame.toUpperCase() !== "WOW") {
            return res.status(200).json({
                message: `Data total koin untuk ${namaGame} pada periode ${bulan}-${tahun} berhasil diambil`,
                data: results
            });
        }

        fetchTotalKoinWOW((wowData) => {
            const filteredResults = results.filter(item => item.nama_game !== "WOW");

            res.status(200).json({
                message: `Data total koin terakhir per NIP untuk periode ${bulan}-${tahun} berhasil diambil`,
                data: [...filteredResults, wowData]
            });
        });
    });
}

function fetchTotalKoinWOW(callback) {
    const sqlGetTotalKoinWOW = `
        SELECT id_wow, 
               COALESCE(jumlah, 0) AS total_koin,  
               COALESCE(saldo_koin, 0) AS saldo_koin, 
               COALESCE((
                    SELECT kw2.dijual 
                    FROM koin_wow kw2 
                    WHERE kw2.dijual IS NOT NULL 
                    ORDER BY kw2.id_wow DESC 
                    LIMIT 1
               ), '') AS total_dijual
        FROM koin_wow 
        ORDER BY id_wow DESC 
        LIMIT 1
    `;

    db.query(sqlGetTotalKoinWOW, (err, wowResults) => {
        if (err) {
            console.error("Error fetching koin WOW:", err);
            return callback({
                nama_game: "WOW",
                nama: "AKUN UTAMA WOW",
                id_wow: null,
                total_koin: 0,
                saldo_koin: 0,
                total_dijual: ''
            });
        }

        const totalKoinWOW = wowResults.length > 0 ? wowResults[0] : { id_wow: null, total_koin: 0, saldo_koin: 0, total_dijual: '' };

        callback({
            nama_game: "WOW",
            nama: "AKUN UTAMA WOW",
            id_wow: totalKoinWOW.id_wow,
            total_koin: totalKoinWOW.total_koin, 
            saldo_koin: totalKoinWOW.saldo_koin,
            total_dijual: totalKoinWOW.total_dijual
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

exports.getKoinTerakhirWOW = (req, res) => {
    const sqlGetTotalKoinWOW = `
        SELECT jumlah, saldo_koin, dijual AS total_dijual
        FROM koin_wow 
        ORDER BY id_wow DESC 
        LIMIT 1
    `;

    db.query(sqlGetTotalKoinWOW, (err, wowResults) => {
        if (err) return res.status(500).json({ message: 'Gagal mengambil data dari koin_wow', error: err });

        const totalKoinWOW = wowResults.length > 0 
            ? wowResults[0] 
            : { jumlah: 0, saldo_koin: 0, total_dijual: 0 };

        const sqlGetSaldoPerNIP = `
            SELECT k.NIP, u.nama, k.saldo_koin, k.jumlah
            FROM koin k
            JOIN karyawan u ON k.NIP = u.NIP
            JOIN game g ON k.id_game = g.id_game
            WHERE g.nama_game = 'WOW' 
            AND k.id_koin = (
                SELECT MAX(id_koin) 
                FROM koin 
                WHERE NIP = k.NIP AND id_game = k.id_game
            )
            ORDER BY k.NIP DESC
        `;

        db.query(sqlGetSaldoPerNIP, (err, nipResults) => {
            if (err) return res.status(500).json({ message: 'Gagal mengambil saldo per NIP', error: err });

            res.status(200).json({
                nama_game: "WOW",
                nama: "AKUN UTAMA WOW",
                totalKoinWOW,
                saldoPerNIP: nipResults
            });
        });
    });
};

