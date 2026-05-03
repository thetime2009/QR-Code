const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// ------------------ CONFIG ------------------
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');

// สร้างโฟลเดอร์ uploads
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// multer ใช้ path เดียวกัน
const upload = multer({ dest: uploadDir });

// ❗ ใช้ env จะปลอดภัยกว่า
const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY || 'PUT_YOUR_KEY_HERE';

// ------------------ API ------------------
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบไฟล์สลิป"
            });
        }

        filePath = req.file.path;

        const form = new FormData();
        // ❗ สำคัญ: ใช้ file ไม่ใช่ files
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.post(
            'https://api.slipok.com/api/v1/main/log/upload',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'x-authorization': SLIPOK_API_KEY
                },
                timeout: 20000
            }
        );

        // ลบไฟล์
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return res.json(response.data);

    } catch (error) {
        console.error("ERROR:", error.response?.data || error.message);

        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
});

// ------------------ STATIC ------------------
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
});
