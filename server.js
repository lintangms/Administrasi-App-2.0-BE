const express = require("express");
const path = require('path');
const cors = require('cors');
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/loginRoutes");
const akunRoutes = require("./routes/akunRoutes");
const gameRoutes = require("./routes/gameRoutes");
const inventarisRoutes = require("./routes/inventarisRoutes");
const kasbonRoutes = require("./routes/kasbonRoutes");
const pengeluaranRoutes = require("./routes/pengeluaranRoutes");
const divisiRoutes = require("./routes/divisiRoutes");
const jabatanRoutes = require("./routes/jabatanRoutes");
const KaryawanRoutes = require("./routes/karyawanRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
const boostingRoutes = require("./routes/boostingRoutes");
const farmingRoutes = require("./routes/farmingRoutes");

// Konfigurasi environment variable
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Gunakan port dari .env atau default 5000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'; // Menggunakan nilai dari environment variable, atau '*' untuk menerima semua origin

// Setup static folder untuk file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS Configuration
app.use(cors({
  origin: FRONTEND_ORIGIN, // Menggunakan nilai dari environment variable
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metode yang diizinkan
  credentials: true // Jika menggunakan cookie atau header khusus
}));

// Middleware untuk parsing JSON
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/akun", akunRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/inventaris", inventarisRoutes);
app.use("/api/kasbon", kasbonRoutes);
app.use("/api/pengeluaran", pengeluaranRoutes);
app.use("/api/divisi", divisiRoutes); 
app.use("/api/jabatan", jabatanRoutes);
app.use("/api/karyawan", KaryawanRoutes); // Ini sudah menangani upload file
app.use("/api/shift", shiftRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/boosting", boostingRoutes);
app.use("/api/farming", farmingRoutes);

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});