const express = require('express');
const router = express.Router();
const karyawanController = require('../controllers/karyawanController');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join (__dirname, '../uploads')); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Maksimal ukuran file 5MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/; 
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true); 
        } else {
            cb(new Error('Only images (jpeg, jpg, png) are allowed!')); 
        }
    },
});

// Routes
router.post('/add', upload.single('gambar'), karyawanController.createKaryawan);
router.get('/get', karyawanController.getAllKaryawan);
router.get('/NIP/:nip', karyawanController.getKaryawanByNIP);
router.get('/karyawan/:id', karyawanController.getKaryawanById)
router.put('/update/:id', upload.single('gambar'), karyawanController.updateKaryawan);
router.delete('/delete/:id', karyawanController.deleteKaryawan);
router.put('/password/:nip', karyawanController.updatePassword);

module.exports = router;