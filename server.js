const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

// --- ตั้งค่าข้อมูลของคุณ ---
const PROMPTPAY_ID = '0846690495'; 
const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';
const BLYNK_AUTH_TOKEN = 'ใส่_AUTH_TOKEN_ของคุณตรงนี้'; // สำหรับส่งค่าไป ESP8266
const DB_FILE = path.join(__dirname, 'used_slips.json');

/**
 * ฟังก์ชันจัดการฐานข้อมูลสลิปแบบง่าย
 */
const getUsedSlips = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
};

const saveUsedSlip = (transRef) => {
    const slips = getUsedSlips();
    slips.push(transRef);
    fs.writeFileSync(DB_FILE, JSON.stringify(slips, null, 2));
};

/**
 * 1. Route สำหรับสร้าง QR Code (คงเดิม)
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
 * 2. Route สำหรับตรวจสอบสลิป + ป้องกันการส่งซ้ำ
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

        // ส่ง Payload ไป EasySlip v2
        const response = await axios.post('https://api.easyslip.com/v2/verify/bank', 
        { payload: code.data }, 
        {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            const transRef = response.data.data.transRef;
            const amount = response.data.data.amount.amount;
            const usedSlips = getUsedSlips();

            // --- ตรวจสอบการส่งซ้ำ ---
            if (usedSlips.includes(transRef)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'สลิปนี้ถูกใช้งานไปแล้ว' 
                });
            }

            // บันทึกรหัสสลิปเพื่อป้องกันการใช้ซ้ำ
            saveUsedSlip(transRef);

            // --- ส่งคำสั่งไปยัง Blynk สำหรับ ESP8266 ---
            // ส่งยอดเงินจริงไปที่ Virtual Pin V10 เพื่อให้ ESP ตัดสินใจจ่ายน้ำ
            axios.get(`https://blynk.cloud/external/api/update?token=${BLYNK_AUTH_TOKEN}&v10=${amount}`)
                .then(() => console.log(`ยอดเงิน ${amount} ส่งไปที่ ESP แล้ว`))
                .catch(err => console.error('Blynk Error:', err.message));

            res.json(response.data);
        } else {
            res.status(400).json(response.data);
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'ระบบขัดข้อง' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
