/**
 * ระบบตรวจสอบสลิปโอนเงิน (Backend)
 * ใช้ Express และ Axios สำหรับการส่ง Request ไปยัง API
 */
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // เก็บไฟล์สลิปชั่วคราวที่นี่

const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';
const API_URL = 'https://api.slipok.com/api/v1/main/log/upload'; // ตัวอย่าง URL ของ SlipOK

app.use(express.static('public')); // ให้เรียกใช้ไฟล์หน้าเว็บจากโฟลเดอร์ public

// API Endpoint สำหรับรับสลิปจากหน้าเว็บ
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปสลิป' });
        }

        // ส่งข้อมูลไปยัง API ภายนอก (ตัวอย่างการส่งแบบ Buffer)
        // หมายเหตุ: รูปแบบ Parameter ขึ้นอยู่กับ API Provider แต่ละเจ้า
        const response = await axios.post(API_URL, {
            // ส่งข้อมูลตามที่ API กำหนด เช่น รูปภาพในรูปแบบ Base64 หรือ Multipart
            // ในที่นี้เป็นการจำลองการส่งข้อมูล
        }, {
            headers: { 'x-authorization': API_KEY }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ' });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
