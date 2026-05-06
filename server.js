const express = require('express');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

// ข้อมูลจากที่คุณให้มา
const PROMPTPAY_ID = '0846690495'; // เปลี่ยนเป็นเบอร์พร้อมเพย์ของคุณ
const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd'; // API Key ของคุณ

app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปภาพสลิป' });
    }

    try {
        // เตรียมข้อมูลส่งไปยัง EasySlip v2
        const formData = new FormData();
        // ข้อควรระวัง: EasySlip v2 ใช้ Key ชื่อ 'file'
        formData.append('file', req.file.buffer, { 
            filename: 'slip.jpg',
            contentType: req.file.mimetype 
        });

        console.log('กำลังส่งข้อมูลไปที่ EasySlip v2...');

        const response = await axios.post('https://api.easyslip.com/v2/verify', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${API_KEY}` // รูปแบบ Bearer Token สำหรับ v2
            }
        });

        // ส่งผลลัพธ์กลับไปยัง Frontend
        console.log('ผลการตรวจสอบ:', response.data);
        res.json(response.data);

    } catch (error) {
        // กรณี API ตอบกลับมาเป็น Error (เช่น 400, 401, 422)
        if (error.response) {
            console.error('EasySlip Error:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            // กรณี Error จากระบบเครือข่าย
            console.error('System Error:', error.message);
            res.status(500).json({ success: false, message: 'ไม่สามารถติดต่อ API ตรวจสอบสลิปได้' });
        }
    }
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
