const db = require('../config/db');

exports.getStatistik = (req, res) => {
    const sqlKaryawan = "SELECT COUNT(id_karyawan) AS jumlah_karyawan FROM karyawan";
    const sqlFarming = "SELECT SUM(koin) AS total_farming FROM perolehan_farming";
    const sqlBoosting = "SELECT SUM(nominal) AS total_boosting FROM perolehan_boosting";
    const sqlInventaris = "SELECT COUNT(id_inventaris) AS jumlah_inventaris FROM inventaris";

    db.query(sqlKaryawan, (err, resultKaryawan) => {
        if (err) return res.status(500).json({ message: "Error fetching karyawan data", error: err });

        db.query(sqlFarming, (err, resultFarming) => {
            if (err) return res.status(500).json({ message: "Error fetching farming data", error: err });

            db.query(sqlBoosting, (err, resultBoosting) => {
                if (err) return res.status(500).json({ message: "Error fetching boosting data", error: err });

                db.query(sqlInventaris, (err, resultInventaris) => {
                    if (err) return res.status(500).json({ message: "Error fetching inventaris data", error: err });

                    res.status(200).json({
                        jumlah_karyawan: resultKaryawan[0].jumlah_karyawan || 0,
                        total_farming: resultFarming[0].total_farming || 0,
                        total_boosting: resultBoosting[0].total_boosting || 0,
                        jumlah_inventaris: resultInventaris[0].jumlah_inventaris || 0,
                    });
                });
            });
        });
    });
};


// Statistik Perolehan Farming per NIP dengan filter bulan dan tahun
exports.getStatistikFarming = (req, res) => {
    const { bulan, tahun } = req.query;

    // Jika bulan & tahun tidak diisi, pakai bulan & tahun sekarang
    const bulanFilter = bulan || new Date().getMonth() + 1; // Bulan sekarang (1-12)
    const tahunFilter = tahun || new Date().getFullYear(); // Tahun sekarang (YYYY)

    const sql = `
        SELECT k.nip, k.nama,
               COALESCE(SUM(pf.koin), 0) AS total_farming
        FROM karyawan k
        LEFT JOIN perolehan_farming pf 
            ON k.nip = pf.nip 
            AND MONTH(pf.periode) = ? 
            AND YEAR(pf.periode) = ?
        GROUP BY k.nip, k.nama
        ORDER BY k.nip;
    `;

    db.query(sql, [bulanFilter, tahunFilter], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching farming statistics", error: err });

        res.status(200).json(results);
    });
};


exports.getStatistikBoosting = (req, res) => {
    const { bulan, tahun } = req.query;

    // Jika bulan & tahun tidak diisi, pakai bulan & tahun sekarang
    const bulanFilter = bulan || new Date().getMonth() + 1; // Bulan sekarang (1-12)
    const tahunFilter = tahun || new Date().getFullYear(); // Tahun sekarang (YYYY)

    const sql = `
        SELECT k.nip, k.nama,
               COALESCE(SUM(pb.nominal), 0) AS total_boosting
        FROM karyawan k
        LEFT JOIN perolehan_boosting pb 
            ON k.nip = pb.nip 
            AND MONTH(pb.periode) = ? 
            AND YEAR(pb.periode) = ?
        GROUP BY k.nip, k.nama
        ORDER BY k.nip;
    `;

    db.query(sql, [bulanFilter, tahunFilter], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching boosting statistics", error: err });

        res.status(200).json(results);
    });
};
