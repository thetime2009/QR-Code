const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path'); // เพิ่มโมดูล path เพื่อจัดการเส้นทางไฟล์

const app = express();
const upload = multer({ dest: 'uploads/' });

// API Key สำหรับตรวจสอบสลิป
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// --- ส่วนที่แก้ไขเพิ่มเติมเพื่อให้รันหน้าเว็บได้ ---

// 1. ตั้งค่าให้ Express ส่งไฟล์ Static (HTML, CSS, JS) จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// 2. กำหนด Route หน้าแรกให้ส่งไฟล์ index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ส่วนของ API สำหรับตรวจสอบสลิป ---

app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์สลิป" });
        }

        const filePath = req.file.path;
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            }
        });

        // ลบไฟล์ชั่วคราวในโฟลเดอร์ uploads ทิ้งทันทีเพื่อประหยัดพื้นที่
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json(response.data);
    } catch (error) {
        console.error("API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ API" });
    }
});

// --- ส่วนการตั้งค่า Port เพื่อรองรับ Render ---

const PORT = process.env.PORT || 3000; // ใช้ค่าจาก Cloud หรือ 3000 สำหรับรันในเครื่อง
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
