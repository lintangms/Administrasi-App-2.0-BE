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