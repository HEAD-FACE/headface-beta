document.addEventListener('DOMContentLoaded', () => {
    // กำหนด URL ของ GAS Web App และ LINE Login
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?
response_type=code
&client_id=2007333047
&redirect_uri=https://head-face.github.io/headface-beta/upgrade.html
&state=abcdefghijklmnopqrstuvwxyz
&scope=profile%20openid`;

    let lineUserId = null;

    // ดึงข้อมูลผู้ใช้จาก Local Storage
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        console.error('ไม่พบข้อมูลผู้ใช้ใน Local Storage');
        // อาจจะ Redirect ผู้ใช้ไปหน้าล็อกอินหลัก
    }

    // อ้างอิง Element ต่างๆ ในหน้าเว็บ
    const lineLoginButton = document.getElementById('line-login-button');
    const lineSuccessStatus = document.getElementById('line-success-status');
    const stepRegister = document.getElementById('step-register');
    const stepPayment = document.getElementById('step-payment');
    const stepSubmit = document.getElementById('step-submit');
    const submitButton = document.getElementById('submit-button');
    const submitForm = document.getElementById('submit-form');

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');
    const statusCompleted = document.getElementById('status-completed');

    /**
     * ฟังก์ชันสำหรับจัดการการ Redirect จาก LINE Login
     * จะตรวจสอบ URL เพื่อดึง 'code' และนำไปแลกเป็น 'lineUserId'
     */
    async function handleLineRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            console.log('พบ LINE code:', code);
            
            try {
                // ส่ง 'code' ไปยัง GAS Web App เพื่อแลกเป็น UserId (ใช้ GET เพื่อเลี่ยง CORS)
                const fetchUrl = `${gasUrl}?action=getUserId&code=${code}`;
                const response = await fetch(fetchUrl);
                const result = await response.json();

                if (result.success) {
                    lineUserId = result.lineUserId;
                    console.log('ดึง Line User ID สำเร็จ:', lineUserId);

                    // อัปเดต UI ให้เข้าสู่สถานะ 'รอการตรวจสอบ'
                    lineLoginButton.style.display = 'none';
                    lineSuccessStatus.style.display = 'flex';
                    stepPayment.style.display = 'block';
                    stepSubmit.style.display = 'block';
                    
                    statusRegister.classList.add('active');
                    statusPending.classList.add('active');
                } else {
                    console.error('ไม่สามารถดึง Line User ID ได้:', result.error);
                    alert('เกิดข้อผิดพลาดในการยืนยันตัวตนด้วย LINE');
                }

                // ล้าง code ออกจาก URL เพื่อให้หน้านี้สามารถโหลดซ้ำได้โดยไม่ติดปัญหา
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            }
        }
    }

    // --- Event Listeners ---

    // 1. เมื่อหน้าเว็บโหลดเสร็จ ให้เรียกฟังก์ชันจัดการ Redirect
    handleLineRedirect();

    // 2. เมื่อกดปุ่ม 'ลงทะเบียนด้วย LINE'
    lineLoginButton.addEventListener('click', () => {
        window.location.href = lineLoginUrl;
    });

    // 3. เมื่อกดปุ่ม 'ยืนยันการสมัคร'
    submitButton.addEventListener('click', () => {
        if (!lineUserId) {
            alert('กรุณาลงทะเบียนด้วย LINE ก่อน');
            return;
        }

        if (!userData) {
            alert('ไม่พบข้อมูลผู้ใช้งาน กรุณาลองใหม่');
            return;
        }

        // นำข้อมูลไปใส่ใน Form ที่ซ่อนไว้
        document.getElementById('form-name').value = userData.firstName;
        document.getElementById('form-lastName').value = userData.lastName;
        document.getElementById('form-no').value = userData.no;
        document.getElementById('form-studentId').value = userData.studentId;
        document.getElementById('form-lineUserId').value = lineUserId;

        // ตั้งค่า action ของ Form ไปยัง GAS URL ที่ถูกต้อง
        submitForm.action = gasUrl;

        // สั่งให้ Form ส่งข้อมูล (Submit)
        // การใช้วิธีนี้จะหลีกเลี่ยงปัญหา CORS
        submitForm.submit();

        // อัปเดต UI และสถานะทันที เพื่อให้ผู้ใช้ได้รับ Feedback
        alert('ลงทะเบียนสำเร็จแล้ว! โปรดรอการตรวจสอบ');
        statusPending.classList.remove('active');
        statusCompleted.classList.add('active');
        stepRegister.style.display = 'none';
        stepPayment.style.display = 'none';
        stepSubmit.style.display = 'none';
    });

    // 4. จัดการการอัปโหลดไฟล์สลิป (เฉพาะการแสดงผล)
    document.getElementById('slip-upload').addEventListener('change', (e) => {
        const fileName = e.target.files[0].name;
        alert(`ไฟล์ "${fileName}" ถูกเลือกแล้ว`);
        // ในระบบจริง จะต้องส่งไฟล์นี้ไปยัง Google Drive หรือที่อื่น
    });
});
