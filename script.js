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
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาลองล็อกอินอีกครั้ง');
        // คุณสามารถเพิ่มโค้ดเพื่อ Redirect ผู้ใช้ไปยังหน้าล็อกอินหลักได้ที่นี่
        return; 
    }

    // อ้างอิง Element ต่างๆ ในหน้าเว็บ
    const lineLoginButton = document.getElementById('line-login-button');
    const lineSuccessStatus = document.getElementById('line-success-status');
    const stepRegister = document.getElementById('step-register');
    const stepPayment = document.getElementById('step-payment');
    const stepSubmit = document.getElementById('step-submit');
    const submitButton = document.getElementById('submit-button');

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');
    const statusCompleted = document.getElementById('status-completed');

    /**
     * ฟังก์ชันสำหรับจัดการการ Redirect จาก LINE Login
     * จะตรวจสอบ URL เพื่อดึง 'code' และนำไปแลกเป็น 'lineUserId' ผ่าน GAS
     */
    async function handleLineRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        // ตรวจสอบว่ามี lineUserId เก็บไว้ใน session storage หรือไม่
        const storedLineUserId = sessionStorage.getItem('lineUserId');
        if (storedLineUserId) {
            lineUserId = storedLineUserId;
            // อัปเดต UI เหมือนกับว่าเพิ่งล็อกอินสำเร็จ
            updateUIForSuccessfulLogin();
            return;
        }

        if (code) {
            console.log('พบ LINE code:', code);
            
            try {
                // ส่ง 'code' ไปยัง GAS Web App เพื่อแลกเป็น UserId
                const fetchUrl = `${gasUrl}?action=getUserId&code=${code}`;
                const response = await fetch(fetchUrl);
                const result = await response.json();

                if (result.success) {
                    lineUserId = result.lineUserId;
                    sessionStorage.setItem('lineUserId', lineUserId); // เก็บ userId ไว้ใน session storage
                    console.log('ดึง Line User ID สำเร็จ:', lineUserId);
                    updateUIForSuccessfulLogin();
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

    /**
     * ฟังก์ชันสำหรับอัปเดต UI เมื่อล็อกอินด้วย LINE สำเร็จ
     */
    function updateUIForSuccessfulLogin() {
        lineLoginButton.style.display = 'none';
        lineSuccessStatus.style.display = 'flex';
        stepPayment.style.display = 'block';
        stepSubmit.style.display = 'block';
        
        statusRegister.classList.add('active');
        statusPending.classList.add('active');
    }

    // --- Event Listeners ---

    // 1. เมื่อหน้าเว็บโหลดเสร็จ ให้เรียกฟังก์ชันจัดการ Redirect
    handleLineRedirect();

    // 2. เมื่อกดปุ่ม 'ลงทะเบียนด้วย LINE'
    lineLoginButton.addEventListener('click', () => {
        window.location.href = lineLoginUrl;
    });

    // 3. เมื่อกดปุ่ม 'ยืนยันการสมัคร'
    submitButton.addEventListener('click', async () => {
        if (!lineUserId) {
            alert('กรุณาลงทะเบียนด้วย LINE ก่อน');
            return;
        }

        try {
            // เตรียม URL สำหรับส่งข้อมูลด้วย GET
            const saveUrl = `${gasUrl}?action=saveRequest` +
                            `&name=${encodeURIComponent(userData.firstName)}` +
                            `&lastName=${encodeURIComponent(userData.lastName)}` +
                            `&no=${encodeURIComponent(userData.no)}` +
                            `&studentId=${encodeURIComponent(userData.studentId)}` +
                            `&lineUserId=${encodeURIComponent(lineUserId)}`;

            // ใช้ fetch ด้วย GET method เพื่อหลีกเลี่ยงปัญหา CORS
            const response = await fetch(saveUrl);
            const result = await response.json();

            if (result.success) {
                alert('ลงทะเบียนสำเร็จแล้ว! โปรดรอการตรวจสอบ');
                
                // อัปเดต UI และสถานะทันที เพื่อให้ผู้ใช้ได้รับ Feedback
                statusPending.classList.remove('active');
                statusCompleted.classList.add('active');
                stepRegister.style.display = 'none';
                stepPayment.style.display = 'none';
                stepSubmit.style.display = 'none';
                
                // ล้าง lineUserId ออกจาก session storage
                sessionStorage.removeItem('lineUserId');
            } else {
                console.error('Error submitting data:', result.error);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            }

        } catch (error) {
            console.error('Error submitting data:', error);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
        }
    });

    // 4. จัดการการอัปโหลดไฟล์สลิป (เฉพาะการแสดงผล)
    document.getElementById('slip-upload').addEventListener('change', (e) => {
        const fileName = e.target.files[0].name;
        alert(`ไฟล์ "${fileName}" ถูกเลือกแล้ว`);
        // ในระบบจริง จะต้องส่งไฟล์นี้ไปยัง Google Drive หรือที่อื่น
    });
});
