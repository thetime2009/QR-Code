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
const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd'; //

// 1. สร้าง QR Code
app.post('/generateQR', (req, res) => {
    const amount = parseFloat(req.body.amount);
    const payload = generatePayload(PROMPTPAY_ID, { amount });
    
    qrcode.toDataURL(payload, (err, url) => {
        if (err) return res.status(500).json({ error: 'สร้าง QR ไม่สำเร็จ' });
        res.json({ qrImage: url });
    });
});

// 2. ตรวจสอบสลิป (เชื่อมต่อ API Key)
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพ' });

    try {
        const formData = new FormData();
        formData.append('files', req.file.buffer, { filename: 'slip.jpg' });

        // เรียก API ตรวจสอบ (ตัวอย่างนี้อ้างอิงโครงสร้าง SlipOK/EasySlip)
        const response = await axios.post('https://api.slipok.com/api/line/apikey/21431', formData, {
            headers: {
                ...formData.getHeaders(),
                'x-authorization': API_KEY // ใช้ API KEY ของคุณ
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'การตรวจสอบล้มเหลว' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
