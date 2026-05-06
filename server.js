const express = require('express');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

const PROMPTPAY_ID = '0846690495'; // ใส่เบอร์พร้อมเพย์ของคุณที่นี่
const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd'; // API Key จากรูปของคุณ

// 1. Endpoint สำหรับสร้าง QR Code
app.post('/generateQR', (req, res) => {
    const amount = parseFloat(req.body.amount);
    const payload = generatePayload(PROMPTPAY_ID, { amount });
    
    qrcode.toDataURL(payload, (err, url) => {
        if (err) return res.status(500).json({ error: 'QR Generation failed' });
        res.json({ qrImage: url });
    });
});

// 2. Endpoint สำหรับตรวจสอบสลิป
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'slip.jpg' });

        // ตัวอย่างการเรียกใช้ API (ในที่นี้อ้างอิงโครงสร้าง EasySlip)
        const response = await axios.post('https://developer.easyslip.com/api/v1/verify', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
