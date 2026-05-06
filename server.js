const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

// --- ตั้งค่าข้อมูลของคุณ ---
const PROMPTPAY_ID = '0846690495'; // ใส่เบอร์พร้อมเพย์ที่นี่
const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd'; 

/**
 * 1. Route สำหรับสร้าง QR Code
 */
app.post('/generateQR', (req, res) => {
    const { amount } = req.body;
    const payload = generatePayload(PROMPTPAY_ID, { amount: parseFloat(amount) });
    
    qrcode.toDataURL(payload, (err, url) => {
        if (err) return res.status(500).json({ error: 'สร้าง QR ไม่สำเร็จ' });
        res.json({ qrImage: url });
    });
});

/**
 * 2. Route สำหรับตรวจสอบสลิป (EasySlip v2)
 * แก้ปัญหา 404 โดยตรวจสอบชื่อ Route ให้ตรงกับหน้าบ้าน
 */
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพ' });

        // ขั้นตอนอ่าน QR จากสลิป
        const image = await loadImage(req.file.buffer);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) {
            return res.status(400).json({ success: false, message: 'สแกน QR ในสลิปไม่พบ' });
        }

        // ส่ง Payload ไป EasySlip
        const response = await axios.post('https://api.easyslip.com/v2/verify/bank', 
        { payload: code.data }, 
        {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'ระบบขัดข้อง' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
