const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// -------- CONFIG --------
app.use(express.json());
app.use(cors());

const publicPath = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// 🔐 ใส่ API KEY ของคุณ
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// -------- API --------
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบไฟล์"
            });
        }

        filePath = req.file.path;

        const form = new FormData();
        // ✅ ใช้ files (สำคัญมาก)
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post(
            'https://api.slipok.com/api/v1/slip/verify',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'x-authorization': SLIPOK_API_KEY
                },
                timeout: 20000
            }
        );

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json(response.data);

    } catch (error) {
        console.error("ERROR:", error.response?.data || error.message);

        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
});

// -------- STATIC --------
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// -------- START --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
