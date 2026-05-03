const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// API Key ของคุณ
const SLIPOK_API_KEY = 'f49d3255-e467-4fb9-8997-85fd436e78fd';

app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        const filePath = req.file.path;
        
        // เตรียมข้อมูลส่งไปยัง API ภายนอก (ตัวอย่างสำหรับ SlipOK)
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));

        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-authorization': SLIPOK_API_KEY
            }
        });

        // ลบไฟล์ชั่วคราวทิ้งหลังใช้งานเสร็จ
        fs.unlinkSync(filePath);

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, message: "API Error" });
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));
