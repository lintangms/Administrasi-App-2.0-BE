const db = require('../config/db');

exports.updateGaji = (req, res) => {
    const { id_gaji, potongan } = req.body;
    const kasbon = req.body.kasbon || 0;
    const tunjangan_jabatan = req.body.tunjangan_jabatan || 0;

    if (![40, 50, 60].includes(potongan)) {
        return res.status(400).json({ message: 'Potongan hanya bisa 40%, 50%, atau 60%' });
    }

    // Ambil gaji_kotor berdasarkan id_gaji
    const sqlGetGaji = 'SELECT gaji_kotor FROM gaji WHERE id_gaji = ?';
    db.query(sqlGetGaji, [id_gaji], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching gaji', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data gaji tidak ditemukan' });

        const gaji_kotor = results[0].gaji_kotor;

        // Hitung THP berdasarkan potongan yang benar
        const THP = gaji_kotor * (potongan / 100);

        // Hitung THP setelah kasbon dan tunjangan
        const THP_final = THP - kasbon + tunjangan_jabatan;

        // Update tabel gaji berdasarkan id_gaji
        const sqlUpdateGaji = 'UPDATE gaji SET potongan = ?, kasbon = ?, tunjangan_jabatan = ?, THP = ? WHERE id_gaji = ?';
        db.query(sqlUpdateGaji, [potongan, kasbon, tunjangan_jabatan, THP_final, id_gaji], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating gaji', error: err });

            res.status(200).json({
                message: 'Gaji berhasil diperbarui',
                data: {
                    id_gaji,
                    gaji_kotor,
                    potongan,
                    THP,
                    kasbon,
                    tunjangan_jabatan,
                    THP_final
                }
            });
        });
    });
};

exports.updateGajiBaru = (req, res) => {
    const { id_gaji, kasbon } = req.body;

    if (kasbon < 0) {
        return res.status(400).json({ message: 'Kasbon tidak boleh negatif' });
    }

    // Ambil gaji_kotor berdasarkan id_gaji
    const sqlGetGaji = 'SELECT gaji_kotor FROM gaji WHERE id_gaji = ?';
    db.query(sqlGetGaji, [id_gaji], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching gaji', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data gaji tidak ditemukan' });

        const gaji_kotor = results[0].gaji_kotor;

        // Hitung THP baru berdasarkan gaji_kotor dikurangi kasbon
        const THP_final = gaji_kotor - kasbon;

        // Update hanya kasbon dan THP
        const sqlUpdateKasbon = 'UPDATE gaji SET kasbon = ?, THP = ? WHERE id_gaji = ?';
        db.query(sqlUpdateKasbon, [kasbon, THP_final, id_gaji], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating kasbon', error: err });

            res.status(200).json({
                message: 'Kasbon berhasil diperbarui',
                data: {
                    id_gaji,
                    gaji_kotor,
                    kasbon,
                    THP_final
                }
            });
        });
    });
};
exports.inputRate = (req, res) => {
    const { bulan, tahun } = req.body;

    // Query untuk menghitung rata-rata rate dari penjualan pada bulan dan tahun tertentu (dibulatkan ke bilangan bulat)
    const sqlGetAvgRate = `
        SELECT ROUND(AVG(rate)) as avg_rate 
        FROM penjualan 
        WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?`;
    
    db.query(sqlGetAvgRate, [bulan, tahun], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error calculating average rate', error: err });

        const avgRate = results[0].avg_rate;

        if (!avgRate) {
            return res.status(400).json({ message: 'Tidak ada transaksi penjualan pada periode ini' });
        }

        // Query untuk mendapatkan jumlah koin yang dijual per karyawan
        const sqlGetKoinDijual = `
            SELECT NIP, SUM(dijual) as total_koin_dijual 
            FROM koin 
            GROUP BY NIP`;
        
        db.query(sqlGetKoinDijual, (err, koinResults) => {
            if (err) return res.status(500).json({ message: 'Error fetching sold koin data', error: err });

            // Mulai transaksi untuk update gaji
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ message: 'Error initiating transaction', error: err });

                // Proses setiap karyawan untuk update gaji mereka
                const updatePromises = koinResults.map(karyawan => {
                    return new Promise((resolve, reject) => {
                        const { NIP, total_koin_dijual } = karyawan;
                        const gaji_kotor = total_koin_dijual * avgRate;

                        const sqlUpdateGaji = `
                            UPDATE gaji 
                            SET gaji_kotor = ? 
                            WHERE NIP = ? AND MONTH(periode) = ? AND YEAR(periode) = ?`;

                        db.query(sqlUpdateGaji, [gaji_kotor, NIP, bulan, tahun], (err, updateResults) => {
                            if (err) return reject(err);
                            resolve(updateResults.affectedRows);
                        });
                    });
                });

                // Jalankan semua update gaji untuk setiap karyawan
                Promise.all(updatePromises)
                    .then(affectedRowsArray => {
                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ message: 'Error committing transaction', error: err }));

                            res.status(200).json({
                                message: 'Gaji kotor berhasil diupdate berdasarkan rata-rata rate dan jumlah koin yang dijual',
                                data: {
                                    bulan,
                                    tahun,
                                    avgRate,
                                    total_karyawan_diperbarui: affectedRowsArray.length
                                }
                            });
                        });
                    })
                    .catch(error => {
                        db.rollback(() => res.status(500).json({ message: 'Error updating gaji_kotor', error }));
                    });
            });
        });
    });
};

exports.getGajiBaru = (req, res) => {
    const { nama, bulan, tahun } = req.query;

    const now = new Date();
    const filterBulan = bulan ? parseInt(bulan) : now.getMonth() + 1;
    const filterTahun = tahun ? parseInt(tahun) : now.getFullYear();

    let sql = `
        SELECT 
            g.id_gaji, 
            g.NIP, 
            k.nama, 
            gm.nama_game,
            g.gaji_kotor, 
            g.potongan, 
            g.kasbon, 
            g.tunjangan_jabatan, 
            g.THP, 
            g.tgl_transaksi,
            COALESCE(SUM(u.koin), 0) AS total_unsold_koin,
            COALESCE(SUM(koin.dijual), 0) AS total_dijual
        FROM gaji g
        INNER JOIN karyawan k ON g.NIP = k.NIP
        INNER JOIN game gm ON k.id_game = gm.id_game
        INNER JOIN (
            SELECT NIP, MAX(id_gaji) AS max_id
            FROM gaji
            WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
            GROUP BY NIP
        ) latest ON g.NIP = latest.NIP AND g.id_gaji = latest.max_id
        LEFT JOIN unsold u ON g.NIP = u.NIP AND MONTH(u.tanggal) = ? AND YEAR(u.tanggal) = ?
        LEFT JOIN (
            SELECT NIP, SUM(dijual) AS dijual
            FROM koin
            WHERE dijual IS NOT NULL
            GROUP BY NIP
        ) koin ON g.NIP = koin.NIP
        WHERE k.status = 'BARU'
    `;

    let params = [filterBulan, filterTahun, filterBulan, filterTahun];

    if (nama) {
        sql += " AND k.nama LIKE ?";
        params.push(`%${nama}%`);
    }

    sql += " GROUP BY g.id_gaji, g.NIP, k.nama, gm.nama_game, g.gaji_kotor, g.potongan, g.kasbon, g.tunjangan_jabatan, g.THP, g.tgl_transaksi";
    sql += " ORDER BY g.tgl_transaksi DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching gaji baru', error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: `Tidak ada data gaji untuk karyawan BARU pada periode ${filterBulan}-${filterTahun}` });
        }

        res.status(200).json({
            message: `Data gaji karyawan BARU untuk periode ${filterBulan}-${filterTahun} berhasil diambil`,
            data: results
        });
    });
};

exports.getGajiLama = (req, res) => {
    const { nama, bulan, tahun } = req.query;

    const now = new Date();
    const filterBulan = bulan ? parseInt(bulan) : now.getMonth() + 1;
    const filterTahun = tahun ? parseInt(tahun) : now.getFullYear();

    let sql = `
        SELECT 
            g.id_gaji, 
            g.NIP, 
            k.nama, 
            gm.nama_game,
            g.gaji_kotor, 
            g.potongan, 
            g.kasbon, 
            g.tunjangan_jabatan, 
            g.THP, 
            g.tgl_transaksi,
            COALESCE(SUM(u.koin), 0) AS total_unsold_koin,
            COALESCE(SUM(koin.dijual), 0) AS total_dijual
        FROM gaji g
        INNER JOIN karyawan k ON g.NIP = k.NIP
        INNER JOIN game gm ON k.id_game = gm.id_game
        INNER JOIN (
            SELECT NIP, MAX(id_gaji) AS max_id
            FROM gaji
            WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
            GROUP BY NIP
        ) latest ON g.NIP = latest.NIP AND g.id_gaji = latest.max_id
        LEFT JOIN unsold u ON g.NIP = u.NIP AND MONTH(u.tanggal) = ? AND YEAR(u.tanggal) = ?
        LEFT JOIN (
            SELECT NIP, SUM(dijual) AS dijual
            FROM koin
            WHERE dijual IS NOT NULL
            GROUP BY NIP
        ) koin ON g.NIP = koin.NIP
        WHERE k.status = 'LAMA'
    `;

    let params = [filterBulan, filterTahun, filterBulan, filterTahun];

    if (nama) {
        sql += " AND k.nama LIKE ?";
        params.push(`%${nama}%`);
    }

    sql += " GROUP BY g.id_gaji, g.NIP, k.nama, gm.nama_game, g.gaji_kotor, g.potongan, g.kasbon, g.tunjangan_jabatan, g.THP, g.tgl_transaksi";
    sql += " ORDER BY g.tgl_transaksi DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching gaji lama', error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: `Tidak ada data gaji untuk karyawan LAMA pada periode ${filterBulan}-${filterTahun}` });
        }

        res.status(200).json({
            message: `Data gaji karyawan LAMA untuk periode ${filterBulan}-${filterTahun} berhasil diambil`,
            data: results
        });
    });
};

exports.getTotalGaji = (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).json({ message: 'Bulan dan tahun harus diberikan' });
    }

    const sqlGetTotal = `
        SELECT 
            COALESCE(SUM(gaji_kotor), 0) AS total_gaji_kotor,
            COALESCE(SUM(kasbon), 0) AS total_kasbon,
            COALESCE(SUM(tunjangan_jabatan), 0) AS total_tunjangan_jabatan,
            COALESCE(SUM(THP), 0) AS total_THP
        FROM gaji
        WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
    `;

    db.query(sqlGetTotal, [bulan, tahun], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching total gaji', error: err });
        }

        res.status(200).json({
            message: 'Total gaji berhasil diambil',
            total_gaji_kotor: results[0].total_gaji_kotor,
            total_kasbon: results[0].total_kasbon,
            total_tunjangan_jabatan: results[0].total_tunjangan_jabatan,
            total_THP: results[0].total_THP
        });
    });
};

exports.addGaji = (req, res) => {
    const { NIP, gaji_kotor, tgl_transaksi } = req.body;

    if (!NIP || !gaji_kotor || !tgl_transaksi) {
        return res.status(400).json({ message: 'NIP, gaji_kotor, dan tgl_transaksi wajib diisi' });
    }

    // Cek apakah karyawan berstatus "BARU"
    const checkKaryawanSql = `SELECT * FROM karyawan WHERE NIP = ? AND status = 'baru'`;

    db.query(checkKaryawanSql, [NIP], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error checking karyawan', error: err });

        if (result.length === 0) {
            return res.status(400).json({ message: 'Gaji hanya dapat ditambahkan untuk karyawan dengan status "BARU"' });
        }

        // Insert data gaji ke database (hanya NIP, gaji_kotor, dan tgl_transaksi)
        const insertGajiSql = `
            INSERT INTO gaji (NIP, gaji_kotor, tgl_transaksi)
            VALUES (?, ?, ?)
        `;

        db.query(insertGajiSql, [NIP, gaji_kotor, tgl_transaksi], (err, result) => {
            if (err) return res.status(500).json({ message: 'Error inserting gaji', error: err });

            res.status(201).json({
                message: 'Gaji berhasil ditambahkan',
                data: {
                    id_gaji: result.insertId,
                    NIP,
                    gaji_kotor,
                    tgl_transaksi
                }
            });
        });
    });
};

exports.updateUnsoldGaji = (req, res) => {
    const { NIP } = req.body; // Ambil NIP dari request body

    if (!NIP) {
        return res.status(400).json({ message: "NIP harus disertakan dalam request." });
    }

    // Ambil total unsold koin dan rata-rata rate terbaru
    let getUnsoldAndRateSql = `
        SELECT 
            COALESCE(SUM(u.koin), 0) AS total_unsold_koin,
            (SELECT r.rata_rata_rate FROM rate r ORDER BY r.id_rate DESC LIMIT 1) AS rata_rata_rate
        FROM unsold u
        WHERE u.NIP = ?
    `;

    db.query(getUnsoldAndRateSql, [NIP], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error mengambil data koin dan rate', error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: `Data unsold atau rate tidak ditemukan untuk NIP ${NIP}` });
        }

        const totalUnsoldKoin = result[0].total_unsold_koin || 0;
        const rataRataRate = result[0].rata_rata_rate || 0;
        const tambahanGajiKotor = totalUnsoldKoin * rataRataRate;

        if (tambahanGajiKotor === 0) {
            return res.status(400).json({ 
                message: `Tidak ada perubahan gaji_kotor untuk NIP ${NIP}`,
                total_unsold_koin: totalUnsoldKoin,
                rata_rata_rate: rataRataRate,
                hasil_perhitungan: tambahanGajiKotor
            });
        }

        // Cari ID GAJI terbaru untuk NIP ini
        let getLastGajiSql = `
            SELECT id_gaji FROM gaji 
            WHERE NIP = ? 
            ORDER BY tgl_transaksi DESC 
            LIMIT 1
        `;

        db.query(getLastGajiSql, [NIP], (err, gajiResult) => {
            if (err) {
                return res.status(500).json({ message: 'Error mengambil data gaji terbaru', error: err });
            }

            if (gajiResult.length === 0) {
                return res.status(404).json({ message: `Data gaji tidak ditemukan untuk NIP ${NIP}` });
            }

            const lastGajiId = gajiResult[0].id_gaji;

            // Update gaji_kotor pada ID GAJI terbaru yang ditemukan
            let updateGajiSql = `
                UPDATE gaji 
                SET gaji_kotor = gaji_kotor + ?
                WHERE id_gaji = ?
            `;

            db.query(updateGajiSql, [tambahanGajiKotor, lastGajiId], (err, updateResult) => {
                if (err) {
                    return res.status(500).json({ message: 'Error updating gaji_kotor', error: err });
                }

                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ message: `Gaji tidak berhasil diperbarui untuk NIP ${NIP}` });
                }

                res.status(200).json({
                    message: `Gaji kotor untuk NIP ${NIP} berhasil diperbarui`,
                    id_gaji_terbaru: lastGajiId,
                    total_unsold_koin: totalUnsoldKoin,
                    rata_rata_rate: rataRataRate,
                    hasil_perhitungan: tambahanGajiKotor,
                    affectedRows: updateResult.affectedRows
                });
            });
        });
    });
};


exports.addGajiLama = (req, res) => {
    const { NIP, bulan, tahun, game, ket } = req.body;

    if (!NIP || !bulan || !tahun || !game) {
        return res.status(400).json({ message: 'NIP, bulan, tahun, dan game harus diisi' });
    }

    const periode = `${tahun}-${String(bulan).padStart(2, '0')}-01`;

    if (game === "WOW") {
        let getLatestKoinQuery = `
            SELECT jumlah 
            FROM koin 
            WHERE NIP = ? 
            ORDER BY id_koin DESC 
            LIMIT 1
        `;

        db.query(getLatestKoinQuery, [NIP], (err, koinResults) => {
            if (err) {
                return res.status(500).json({ message: 'Error mengambil data koin', error: err });
            }

            if (koinResults.length === 0) {
                return res.status(404).json({ message: 'Tidak ada data koin untuk NIP ini' });
            }

            const total_koin = koinResults[0].jumlah;

            let getRateQuery = `
                SELECT rata_rata_rate 
                FROM rate 
                WHERE tanggal = ? 
                AND id_game = (SELECT id_game FROM game WHERE nama_game = 'WOW' LIMIT 1)
            `;

            db.query(getRateQuery, [periode], (err, rateResults) => {
                if (err) {
                    return res.status(500).json({ message: 'Error mengambil rata-rata rate', error: err });
                }

                if (rateResults.length === 0) {
                    return res.status(404).json({ message: 'Rata-rata rate tidak ditemukan untuk game WOW pada periode ini' });
                }

                const rata_rata_rate = rateResults[0].rata_rata_rate;
                const gaji_kotor = total_koin * rata_rata_rate;

                let insertGajiQuery = `
                    INSERT INTO gaji (periode, tgl_transaksi, NIP, gaji_kotor, id_game, ket)
                    VALUES (?, NOW(), ?, ?, (SELECT id_game FROM game WHERE nama_game = 'WOW' LIMIT 1), ?)
                `;

                db.query(insertGajiQuery, [periode, NIP, gaji_kotor, ket], (err, insertResults) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error menyimpan data gaji', error: err });
                    }
                    res.status(201).json({
                        message: 'Gaji berhasil ditambahkan',
                        data: {
                            NIP,
                            periode,
                            total_koin,
                            rata_rata_rate,
                            gaji_kotor,
                            ket
                        }
                    });
                });
            });
        });
    } else {
        let getDetailKoinQuery = `
            SELECT tgl_transaksi, koin_dijual 
            FROM penjualan
            WHERE NIP = ? AND MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
            ORDER BY tgl_transaksi ASC
        `;

        db.query(getDetailKoinQuery, [NIP, bulan, tahun], (err, koinResults) => {
            if (err) {
                return res.status(500).json({ message: 'Error mengambil data koin', error: err });
            }

            if (koinResults.length === 0) {
                return res.status(404).json({ message: 'Tidak ada data penjualan untuk NIP ini pada periode yang dipilih' });
            }

            const total_koin = koinResults.reduce((sum, item) => sum + item.koin_dijual, 0);

            let getRateQuery = `
                SELECT rata_rata_rate
                FROM rate
                WHERE tanggal = ?
            `;

            db.query(getRateQuery, [periode], (err, rateResults) => {
                if (err) {
                    return res.status(500).json({ message: 'Error mengambil rata-rata rate', error: err });
                }

                if (rateResults.length === 0) {
                    return res.status(404).json({ message: 'Rata-rata rate tidak ditemukan untuk periode ini' });
                }

                const rata_rata_rate = rateResults[0].rata_rata_rate;
                const gaji_kotor = total_koin * rata_rata_rate;

                let insertGajiQuery = `
                    INSERT INTO gaji (periode, tgl_transaksi, NIP, gaji_kotor, id_game, ket)
                    VALUES (?, NOW(), ?, ?, (SELECT id_game FROM penjualan WHERE NIP = ? LIMIT 1), ?)
                `;

                db.query(insertGajiQuery, [periode, NIP, gaji_kotor, NIP, ket], (err, insertResults) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error menyimpan data gaji', error: err });
                    }
                    res.status(201).json({
                        message: 'Gaji berhasil ditambahkan',
                        data: {
                            NIP,
                            periode,
                            transaksi: koinResults,
                            total_koin,
                            rata_rata_rate,
                            gaji_kotor,
                            ket
                        }
                    });
                });
            });
        });
    }
};

exports.getKoinDetails = (req, res) => {
    const { NIP, bulan, tahun } = req.query;

    if (!NIP) {
        return res.status(400).json({ message: 'NIP harus diisi' });
    }

    // Cek apakah ID_GAME untuk NIP ini adalah WOW
    let checkGameQuery = `
        SELECT g.nama_game 
        FROM koin k
        JOIN game g ON k.id_game = g.id_game
        WHERE k.NIP = ?
        ORDER BY k.id_koin DESC 
        LIMIT 1
    `;

    db.query(checkGameQuery, [NIP], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error memeriksa game', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Data game tidak ditemukan untuk NIP ini' });
        }

        const namaGame = results[0].nama_game;

        if (namaGame === "WOW") {
            // Ambil saldo koin jika game adalah WOW
            let getSaldoKoinQuery = `
                SELECT jumlah AS saldo_koin
                FROM koin
                WHERE NIP = ?
                ORDER BY id_koin DESC
                LIMIT 1
            `;

            db.query(getSaldoKoinQuery, [NIP], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Error mengambil saldo koin', error: err });
                }

                if (results.length === 0) {
                    return res.status(404).json({ message: 'Saldo koin tidak ditemukan untuk NIP ini' });
                }

                res.status(200).json({
                    message: 'Data saldo koin berhasil diambil',
                    saldo_koin: results[0].saldo_koin
                });
            });
        } else {
            // Ambil koin dijual jika bukan WOW
            let getRincianKoinQuery = `
                SELECT 
                    CONVERT_TZ(tgl_transaksi, '+00:00', '+07:00') AS tgl_transaksi, 
                    koin_dijual
                FROM penjualan
                WHERE NIP = ? AND MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
                ORDER BY tgl_transaksi ASC
            `;

            db.query(getRincianKoinQuery, [NIP, bulan, tahun], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Error mengambil data rincian koin', error: err });
                }

                if (results.length === 0) {
                    return res.status(404).json({ message: 'Tidak ada data penjualan koin untuk NIP ini pada periode yang dipilih' });
                }

                res.status(200).json({
                    message: 'Data rincian koin berhasil diambil',
                    rincian_koin: results
                });
            });
        }
    });
};

exports.getAllRates = (req, res) => {
    const { bulan, tahun, nama_game } = req.query;

    let sqlGetAll = `
        SELECT 
            r.id_rate,
            g.id_game,
            g.nama_game,
            r.rata_rata_rate,
            DATE_FORMAT(r.tanggal, '%Y-%m') AS bulan_tahun
        FROM rate r
        JOIN game g ON r.id_game = g.id_game
        WHERE 1=1
    `;

    let params = [];

    // Filter berdasarkan bulan dan tahun jika ada
    if (bulan && tahun) {
        sqlGetAll += ` AND MONTH(r.tanggal) = ? AND YEAR(r.tanggal) = ?`;
        params.push(bulan, tahun);
    }

    // Filter berdasarkan nama_game jika ada
    if (nama_game) {
        sqlGetAll += ` AND g.nama_game LIKE ?`;
        params.push(`%${nama_game}%`);
    }

    // Urutkan berdasarkan tanggal terbaru
    sqlGetAll += ` ORDER BY r.tanggal DESC`;

    db.query(sqlGetAll, params, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching rate data', error: err });
        }

        res.status(200).json({
            message: 'Data rata-rata rate berhasil diambil',
            data: results
        });
    });
};
