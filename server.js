const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const axios = require('axios');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd'; //

app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดไฟล์สลิป' });
        }

        // 1. แปลงไฟล์ภาพจาก Buffer เพื่อให้อ่านค่าได้
        const image = await loadImage(req.file.buffer);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 2. ใช้ jsQR สแกนหาค่า Payload จากรูปภาพ
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) {
            return res.status(400).json({ success: false, message: 'ไม่พบ QR Code ในสลิปที่ส่งมา' });
        }

        // 3. ส่ง Payload ไปที่ EasySlip v2 /verify/bank
        const response = await axios.post('https://api.easyslip.com/v2/verify/bank', 
        {
            payload: code.data 
        }, 
        {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 4. ส่งข้อมูลผลการโอนเงินกลับไปแสดงผลที่หน้าบ้าน
        res.json(response.data);

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ API ตรวจสอบสลิป' 
        });
    }
});
