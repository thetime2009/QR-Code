const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// --- 1. การตั้งค่าที่เก็บไฟล์ชั่วคราว ---
// ตรวจสอบและสร้างโฟลเดอร์ uploads หากไม่มีอยู่จริง (สำคัญสำหรับการ Deploy)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: 'uploads/' });

// API Key สำหรับตรวจสอบสลิป
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

// --- 2. การจัดการไฟล์ Static ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 3. API สำหรับตรวจสอบสลิป ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = ""; // เก็บตำแหน่งไฟล์เพื่อใช้ลบภายหลัง
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์สลิป" });
        }

        filePath = req.file.path;
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        // ส่งข้อมูลไปยัง SlipOK API
        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            }
        });

        // ลบไฟล์ทันทีหลังส่ง API สำเร็จ
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // ส่งผลลัพธ์กลับไป โดยปรับโครงสร้างให้หน้าเว็บอ่านง่าย
        // ตรวจสอบว่า API ตอบกลับสำเร็จหรือไม่ (อ้างอิงตามโครงสร้าง SlipOK)
        if (response.data && response.data.success !== false) {
            res.json({ success: true, data: response.data.data });
        } else {
            res.json({ success: false, message: response.data.message || "สลิปไม่ถูกต้อง" });
        }

    } catch (error) {
        // หากเกิด Error ให้ลบไฟล์ที่ค้างอยู่ออกด้วย
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.error("API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: "เกิดข้อผิดพลาดในการเชื่อมต่อ API หรือสลิปไม่ถูกต้อง" 
        });
    }
});

// --- 4. การตั้งค่า Port ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
