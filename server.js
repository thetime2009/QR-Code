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

// --- แก้ไขส่วน API สำหรับตรวจสอบสลิปใน server.js ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์สลิป" });
        }

        filePath = req.file.path;
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        // เพิ่มการตั้งค่า timeout เพื่อความเสถียร
        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            },
            timeout: 10000 // รอไม่เกิน 10 วินาที
        });

        // ลบไฟล์ทันทีหลังใช้งาน
        if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับจาก SlipOK
        const apiData = response.data;

        if (apiData.success) {
            // กรณีตรวจสอบสำเร็จ
            res.json({ success: true, data: apiData.data });
        } else {
            // กรณี API ตอบกลับว่าไม่สำเร็จ (เช่น สลิปซ้ำ หรือ รูปภาพไม่ใช่สลิป)
            res.json({ 
                success: false, 
                message: apiData.message || "สลิปไม่ถูกต้อง หรือถูกใช้งานไปแล้ว" 
            });
        }

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

        // ดึงข้อความ Error ที่แท้จริงจาก Axios
        let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || "API ปฏิเสธการเชื่อมต่อ";
            console.error("SlipOK API Detail:", error.response.data);
        } else {
            console.error("Network/Server Error:", error.message);
        }

        res.status(500).json({ success: false, message: errorMessage });
    }
});

// --- 4. การตั้งค่า Port ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
