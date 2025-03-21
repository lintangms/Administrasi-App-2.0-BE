const db = require('../config/db');

exports.createPenjualan = (req, res) => {
    const { NIP, id_koin, server, demand, rate, ket, koin_dijual } = req.body;
    const tgl_transaksi = new Date().toISOString().split('T')[0];
    const jumlah_uang = rate * koin_dijual;

    // Cek status karyawan
    const sqlGetStatus = 'SELECT status FROM karyawan WHERE NIP = ?';
    db.query(sqlGetStatus, [NIP], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error fetching karyawan status', error: err });
        if (result.length === 0) return res.status(404).json({ message: 'Karyawan tidak ditemukan' });

        const statusKaryawan = result[0].status;

        // Ambil jumlah koin, saldo koin, dan id_game dari tabel koin
        const sqlGetKoin = 'SELECT jumlah, dijual, saldo_koin, id_game FROM koin WHERE id_koin = ? AND NIP = ?';
        db.query(sqlGetKoin, [id_koin, NIP], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error fetching koin data', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Koin tidak ditemukan' });

            const { jumlah, dijual, saldo_koin, id_game } = results[0];
            const newDijual = (dijual || 0) + koin_dijual;
            const newSisa = jumlah - newDijual;
            const newSaldoKoin = saldo_koin - koin_dijual;

            if (newSisa < 0) return res.status(400).json({ message: 'Jumlah koin tidak mencukupi untuk dijual' });
            if (newSaldoKoin < 0) return res.status(400).json({ message: 'Saldo koin tidak mencukupi' });

            // Mulai transaksi
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ message: 'Error initiating transaction', error: err });

                // Insert data ke tabel penjualan
                const sqlInsertPenjualan = 'INSERT INTO penjualan (tgl_transaksi, NIP, server, demand, id_koin, rate, ket, jumlah_uang, koin_dijual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                db.query(sqlInsertPenjualan, [tgl_transaksi, NIP, server, demand, id_koin, rate, ket, jumlah_uang, koin_dijual], (err, insertResults) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Error inserting into penjualan', error: err }));

                    const id_penjualan = insertResults.insertId;

                    // Update saldo_koin, dijual, dan sisa di tabel koin
                    const sqlUpdateKoin = 'UPDATE koin SET dijual = ?, sisa = ?, saldo_koin = ? WHERE id_koin = ? AND NIP = ?';
                    db.query(sqlUpdateKoin, [newDijual, newSisa, newSaldoKoin, id_koin, NIP], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Error updating koin', error: err }));

                        const currentMonth = new Date(tgl_transaksi).getMonth() + 1;
                        const currentYear = new Date(tgl_transaksi).getFullYear();

                        // Hitung rata-rata rate dari tabel penjualan untuk bulan dan tahun yang sama
                        const sqlGetAvgRate = `
                            SELECT ROUND(AVG(rate)) as avg_rate 
                            FROM penjualan 
                            WHERE MONTH(tgl_transaksi) = ? 
                            AND YEAR(tgl_transaksi) = ?`;
                        
                        db.query(sqlGetAvgRate, [currentMonth, currentYear], (err, avgResult) => {
                            if (err) return db.rollback(() => res.status(500).json({ message: 'Error calculating average rate', error: err }));

                            const avgRate = avgResult[0].avg_rate || 0;

                            // Insert ke tabel rate
                            const sqlInsertRate = "INSERT INTO rate (rata_rata_rate, tanggal, id_penjualan) VALUES (?, ?, ?)";
                            db.query(sqlInsertRate, [avgRate, tgl_transaksi, id_penjualan], (err, rateInsertResults) => {
                                if (err) return db.rollback(() => res.status(500).json({ message: 'Error inserting into rate', error: err }));

                                const id_rate = rateInsertResults.insertId;

                                // Update semua id_rate di tabel penjualan untuk bulan dan tahun yang sama
                                const sqlUpdatePenjualan = `
                                    UPDATE penjualan 
                                    SET id_rate = ? 
                                    WHERE MONTH(tgl_transaksi) = ? 
                                    AND YEAR(tgl_transaksi) = ?`;
                                
                                db.query(sqlUpdatePenjualan, [id_rate, currentMonth, currentYear], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ message: 'Error updating penjualan with id_rate', error: err }));

                                    if (statusKaryawan === 'lama') {
                                        // Update semua gaji_kotor berdasarkan rata-rata rate terbaru
                                        const sqlUpdateAllGaji = `
                                            UPDATE gaji g
                                            JOIN penjualan p ON g.NIP = p.NIP 
                                                AND MONTH(g.tgl_transaksi) = MONTH(p.tgl_transaksi)
                                                AND YEAR(g.tgl_transaksi) = YEAR(p.tgl_transaksi)
                                            SET g.gaji_kotor = ? * p.koin_dijual
                                            WHERE MONTH(g.tgl_transaksi) = ? 
                                            AND YEAR(g.tgl_transaksi) = ?`;

                                        db.query(sqlUpdateAllGaji, [avgRate, currentMonth, currentYear], (err) => {
                                            if (err) return db.rollback(() => res.status(500).json({ message: 'Error updating gaji records', error: err }));

                                            // Insert data baru ke tabel gaji dengan id_game
                                            const gaji_kotor = avgRate * koin_dijual;
                                            const sqlInsertGaji = 'INSERT INTO gaji (periode, tgl_transaksi, NIP, id_game, gaji_kotor) VALUES (?, ?, ?, ?, ?)';
                                            
                                            db.query(sqlInsertGaji, [tgl_transaksi, tgl_transaksi, NIP, id_game, gaji_kotor], (err) => {
                                                if (err) return db.rollback(() => res.status(500).json({ message: 'Error inserting into gaji', error: err }));

                                                // Commit transaksi jika semua query berhasil
                                                db.commit(err => {
                                                    if (err) return db.rollback(() => res.status(500).json({ message: 'Error committing transaction', error: err }));

                                                    res.status(201).json({
                                                        message: 'Penjualan berhasil, koin diperbarui, gaji tercatat dan diupdate dengan rata-rata rate terbaru',
                                                        data: {
                                                            id_penjualan,
                                                            NIP,
                                                            id_koin,
                                                            id_game,
                                                            server,
                                                            demand,
                                                            rate,
                                                            ket,
                                                            koin_dijual,
                                                            gaji_kotor,
                                                            saldo_koin: newSaldoKoin,
                                                            jumlah_uang,
                                                            avgRate,
                                                            id_rate
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    } else {
                                        // Jika status karyawan "BARU", commit transaksi tanpa memasukkan ke tabel gaji
                                        db.commit(err => {
                                            if (err) return db.rollback(() => res.status(500).json({ message: 'Error committing transaction', error: err }));

                                            res.status(201).json({
                                                message: 'Penjualan berhasil, koin diperbarui, tetapi tidak masuk ke tabel gaji karena status karyawan BARU',
                                                data: {
                                                    id_penjualan,
                                                    NIP,
                                                    id_koin,
                                                    id_game,
                                                    server,
                                                    demand,
                                                    rate,
                                                    ket,
                                                    koin_dijual,
                                                    saldo_koin: newSaldoKoin,
                                                    jumlah_uang,
                                                    avgRate,
                                                    id_rate
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.getAllPenjualan = (req, res) => {
    let sql = `
        SELECT 
            p.id_penjualan, 
            p.tgl_transaksi, 
            p.NIP, 
            k.nama AS nama_karyawan, 
            p.server, 
            p.demand, 
            p.id_koin, 
            p.rate, 
            p.koin_dijual, 
            p.id_rate, 
            p.jumlah_uang, 
            p.ket
        FROM penjualan p
        JOIN karyawan k ON p.NIP = k.NIP
        ORDER BY p.tgl_transaksi DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching data', error: err });

        return res.json({ message: "Data penjualan berhasil diambil", data: results });
    });
};


exports.getAverageRate = (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).json({ message: 'Bulan dan tahun harus diberikan' });
    }

    const sqlGetAverageRate = `
        SELECT COALESCE(ROUND(AVG(rate)), 0) AS rata_rata_rate
        FROM penjualan
        WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
    `;

    db.query(sqlGetAverageRate, [bulan, tahun], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching average rate', error: err });
        }

        res.status(200).json({
            message: 'Rata-rata rate berhasil diambil',
            rata_rata_rate: results[0].rata_rata_rate
        });
    });
};

exports.getTotalUang = (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).json({ message: 'Bulan dan tahun harus diberikan' });
    }

    const sqlGetTotal = `
        SELECT 
            COALESCE(SUM(koin_dijual), 0) AS total_koin_dijual,
            COALESCE(SUM(jumlah_uang), 0) AS total_jumlah_uang
        FROM penjualan
        WHERE MONTH(tgl_transaksi) = ? AND YEAR(tgl_transaksi) = ?
    `;

    db.query(sqlGetTotal, [bulan, tahun], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching total koin dan uang', error: err });
        }

        res.status(200).json({
            message: 'Total koin dijual dan jumlah uang berhasil diambil',
            total_koin_dijual: results[0].total_koin_dijual,
            total_jumlah_uang: results[0].total_jumlah_uang
        });
    });
};
