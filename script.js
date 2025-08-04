document.addEventListener('DOMContentLoaded', () => {
    // กำหนดค่า LINE Login
    const lineLoginUrl = "https://access.line.me/oauth2/v2.1/authorize?" +
    "response_type=code" +
    "&client_id=2007333047" +
    "&redirect_uri=https://head-face.github.io/headface-beta/upgrade.html" +
    "&state=abcdefghijklmnopqrstuvwxyz" +
    "&scope=profile%20openid";
    let lineUserId = null;

    // ดึงข้อมูลจาก Local Storage
    const userData = JSON.parse(localStorage.getItem('user'));

    // อัปเดต UI ตามข้อมูลใน Local Storage
    if (userData) {
        console.log('User data found:', userData);
        // แสดงชื่อผู้ใช้ในหน้าเว็บ
    }

    // --- การจัดการ UI และสถานะ ---
    const lineLoginButton = document.getElementById('line-login-button');
    const lineSuccessStatus = document.getElementById('line-success-status');
    const stepRegister = document.getElementById('step-register');
    const stepPayment = document.getElementById('step-payment');
    const stepSubmit = document.getElementById('step-submit');
    const submitButton = document.getElementById('submit-button');

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');

    // ตรวจสอบว่ามี Line User ID อยู่ใน URL หรือไม่
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('lineUserId');
    if (userIdFromUrl) {
        lineUserId = userIdFromUrl;
        console.log('Line User ID from URL:', lineUserId);

        // เปลี่ยนปุ่มลงทะเบียน LINE เป็นสีน้ำเงินและแสดงข้อความสำเร็จ
        lineLoginButton.style.display = 'none';
        lineSuccessStatus.style.display = 'flex';

        // แสดงส่วนการชำระเงินและปุ่มยืนยัน
        stepPayment.style.display = 'block';
        stepSubmit.style.display = 'block';

        // อัปเดตแถบสถานะ
        statusRegister.classList.add('active');
        statusPending.classList.add('active');
    }

    // --- Event Listeners ---

    // 1. กดปุ่ม 'ลงทะเบียนด้วย LINE'
    lineLoginButton.addEventListener('click', () => {
        // Redirection ไปยังหน้า LINE Login
        window.location.href = lineLoginUrl;
    });

    // 2. กดปุ่ม 'ยืนยันการสมัคร'
    submitButton.addEventListener('click', async () => {
        if (!lineUserId) {
            alert('กรุณาลงทะเบียนด้วย LINE ก่อน');
            return;
        }

        if (!userData) {
            alert('ไม่พบข้อมูลผู้ใช้งาน กรุณาลองใหม่');
            return;
        }

        // เตรียมข้อมูลที่จะส่งไป Google Apps Script
        const data = {
            name: userData.firstName,
            lastName: userData.lastName,
            no: userData.no,
            studentId: userData.studentId,
            lineUserId: lineUserId
        };

        // ส่งข้อมูลไปยัง Google Apps Script
        try {
            const gasUrl = 'https://script.google.com/macros/s/AKfycbxq66DgAYE-sEiTGYCdBuMcX6Pa9RCIwUPEvmadhGFImrsoYmKplV4E7goUz8zrpsPuvQ/exec'; // ใส่ URL ของ GAS Web App ที่เผยแพร่แล้ว
            const response = await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors', // เนื่องจากเป็น Cross-Origin Request
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            // GAS ไม่ได้คืนค่าอะไรกลับมาในโหมด 'no-cors' แต่เราสามารถถือว่าสำเร็จได้ถ้าไม่มี error
            alert('ลงทะเบียนสำเร็จแล้ว! โปรดรอการตรวจสอบ');

            // อัปเดตแถบสถานะเป็นเสร็จสิ้น
            statusPending.classList.remove('active');
            document.getElementById('status-completed').classList.add('active');

            // ซ่อนปุ่มต่างๆ และแสดงข้อความเสร็จสิ้น
            stepRegister.style.display = 'none';
            stepPayment.style.display = 'none';
            stepSubmit.style.display = 'none';

        } catch (error) {
            console.error('Error submitting data:', error);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
        }
    });

    // 3. จัดการการอัปโหลดไฟล์สลิป (ส่วนนี้ยังไม่ได้ส่งข้อมูลจริง)
    document.getElementById('slip-upload').addEventListener('change', (e) => {
        const fileName = e.target.files[0].name;
        alert(`ไฟล์ "${fileName}" ถูกเลือกแล้ว`);
        // ในระบบจริง จะต้องมีการจัดการและส่งไฟล์นี้ไปยัง Google Drive หรือที่อื่น
    });
});
