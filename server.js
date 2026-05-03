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

app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    let filePath = "";
    
    try {
        // 1. ตรวจสอบว่ามีไฟล์ส่งมาจริงไหม
        if (!req.file) {
            console.error("❌ No file uploaded in request.");
            return res.status(400).json({ success: false, message: "ไม่พบไฟล์สลิป" });
        }

        filePath = req.file.path;
        console.log(`📁 File received: ${req.file.filename}`);

        // 2. เตรียมข้อมูลส่งให้ SlipOK
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        console.log("🚀 Sending request to SlipOK API...");
        
        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            },
            timeout: 10000 // กำหนดเวลาเผื่อ API ตอบช้า
        });

        // 3. จัดการไฟล์เมื่อ API ตอบกลับมา (ไม่ว่าจะสำเร็จหรือล้มเหลว)
        if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

        console.log("✅ API Response received:", response.data);
        res.json(response.data);

    } catch (error) {
        // ลบไฟล์ทิ้งหากเกิด Error เพื่อไม่ให้ไฟล์ค้างใน Server
        if (filePath && fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

        // 4. วิเคราะห์สาเหตุ Error (หัวใจสำคัญของการแก้ Status 500)
        let status = 500;
        let errorMessage = "Internal Server Error";

        if (error.response) {
            // Error ที่มาจาก SlipOK (เช่น 401 Unauthorized, 400 Bad Request)
            status = error.response.status;
            errorMessage = error.response.data.message || "API Error";
            console.error(`❌ SlipOK API Error (${status}):`, error.response.data);
        } else if (error.request) {
            // ส่งไปแล้วแต่ไม่มีการตอบกลับ (Network issue)
            errorMessage = "No response from API server";
            console.error("❌ Network Error: No response received.");
        } else {
            // Error อื่นๆ เช่น โค้ดเขียนผิด
            errorMessage = error.message;
            console.error("❌ Server Script Error:", error.message);
        }

        // ส่ง Error กลับไปที่ Frontend แบบสวยๆ ไม่ให้เป็น Status 500 เปล่าๆ
        res.status(status).json({ success: false, message: errorMessage });
    }
});

// --- 4. การตั้งค่า Port ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
