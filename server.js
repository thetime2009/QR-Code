const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. การจัดการ Path และ Middleware ---
app.use(express.json());
// ใช้ path.resolve เพื่อความแม่นยำสูงสุดบนระบบ Linux ของ Render
const publicPath = path.resolve(__dirname, 'public');
const uploadDir = path.resolve(__dirname, 'uploads');

// สร้างโฟลเดอร์พักไฟล์ชั่วคราว
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// --- 2. API Route (POST) ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "ไม่พบไฟล์สลิป" });

        filePath = req.file.path;
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: { ...form.getHeaders(), 'x-authorization': SLIPOK_API_KEY },
            timeout: 10000
        });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json(response.data);
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ success: false, message: error.message });
    }
});

// --- 3. การจัดการ Static Files ---
app.use(express.static(publicPath));

// ส่ง index.html สำหรับ Route หลัก
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// --- 4. การตั้งค่า Port ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
