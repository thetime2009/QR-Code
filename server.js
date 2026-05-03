const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. Middleware & Settings ---
app.use(express.json()); // รองรับการรับข้อมูลแบบ JSON
app.use(express.urlencoded({ extended: true }));

// สร้างโฟลเดอร์ uploads อัตโนมัติ
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: 'uploads/' });
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// --- 2. Static Files (ตรวจสอบว่าไฟล์ index.html อยู่ในโฟลเดอร์ public) ---
app.use(express.static(path.join(__dirname, 'public')));

// Route หลักสำหรับแสดงหน้าเว็บ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 3. API Endpoint (ต้องมั่นใจว่าชื่อ /verify-slip ตรงกับใน HTML) ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "ไม่พบไฟล์สลิป" });
        }

        filePath = req.file.path;
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            },
            timeout: 10000
        });

        if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
        res.json(response.data);

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
        
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data.message : error.message;
        
        console.error(`❌ Error ${status}: ${message}`);
        res.status(status).json({ success: false, message: message });
    }
});

// --- 4. Catch-all Route สำหรับเช็ก 404 ---
app.use((req, res) => {
    res.status(404).send("ขออภัย ไม่พบหน้าที่คุณต้องการ (404 Not Found)");
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}`);
});
