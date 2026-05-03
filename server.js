const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); //

const app = express();
const upload = multer({ dest: 'uploads/' }); // สร้างโฟลเดอร์พักไฟล์

// --- 1. การตั้งค่าพื้นฐาน ---
app.use(express.json()); 
const publicPath = path.join(__dirname, 'public'); //

// --- 2. API สำหรับรับการอัปโหลดสลิป (ส่วนที่ทำให้ปุ่มทำงานได้) ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => { //
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "ไม่พบไฟล์ที่อัปโหลด" });
        }

        // ตรงนี้คือส่วนที่คุณจะนำข้อมูลไปเชื่อมต่อกับ SlipOK API ในอนาคต
        console.log("ได้รับไฟล์แล้ว:", req.file.filename);

        // ตอบกลับเพื่อให้หน้าบ้านรู้ว่าส่งสำเร็จ
        res.json({ 
            success: true, 
            message: "เซิร์ฟเวอร์ได้รับไฟล์เรียบร้อยแล้ว",
            data: { amount: 0 } // ค่าสมมติ
        });

    } catch (error) {
        // หากเกิด Error จะส่ง JSON กลับไป ไม่ใช่หน้าเว็บ HTML
        res.status(500).json({ success: false, message: error.message });
    } finally {
        // ลบไฟล์ชั่วคราวออกจากเซิร์ฟเวอร์เพื่อประหยัดพื้นที่
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// --- 3. การจัดการไฟล์ Static ---
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("ไม่พบไฟล์ index.html");
    }
});

// --- 4. การตั้งค่าพอร์ต ---
const PORT = process.env.PORT || 3000; //
app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต: ${PORT}`);
});
