const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. การตั้งค่าโครงสร้างพื้นฐาน ---
const publicPath = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');

// สร้างโฟลเดอร์ uploads อัตโนมัติถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ตั้งค่าให้เข้าถึงไฟล์ใน public ได้โดยตรง
app.use(express.static(publicPath));
const upload = multer({ dest: 'uploads/' });

const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// --- 2. การจัดการ Route หลัก ---
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error("❌ Critical: index.html not found at", indexPath);
        res.status(404).send("ไม่พบไฟล์หน้าเว็บ กรุณาตรวจสอบโฟลเดอร์ public");
    }
});

// --- 3. API ตรวจสอบสลิป ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์" });

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
        const message = error.response ? error.response.data.message : error.message;
        res.status(status).json({ success: false, message: message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
