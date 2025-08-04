document.addEventListener('DOMContentLoaded', () => {
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxq66DgAYE-sEiTGYCdBuMcX6Pa9RCIwUPEvmadhGFImrsoYmKplV4E7goUz8zrpsPuvQ/exec'; // URL ของ GAS Web App ที่เผยแพร่แล้ว
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?
response_type=code
&client_id=2007333047
&redirect_uri=https://head-face.github.io/headface-beta/upgrade.html
&state=abcdefghijklmnopqrstuvwxyz
&scope=profile%20openid`;

    let lineUserId = null;
    const userData = JSON.parse(localStorage.getItem('user'));

    const lineLoginButton = document.getElementById('line-login-button');
    const lineSuccessStatus = document.getElementById('line-success-status');
    const stepRegister = document.getElementById('step-register');
    const stepPayment = document.getElementById('step-payment');
    const stepSubmit = document.getElementById('step-submit');
    const submitButton = document.getElementById('submit-button');

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');

    // --- ฟังก์ชันหลักในการจัดการสถานะ ---
    async function handleLineRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            console.log('Found LINE code:', code);
            
            try {
                // ส่ง code ไปยัง GAS เพื่อแลกเป็น UserId
                const response = await fetch(gasUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: "getUserId", code: code }),
                });

                const result = await response.json();

                if (result.success) {
                    lineUserId = result.lineUserId;
                    console.log('Successfully retrieved Line User ID:', lineUserId);

                    // อัปเดต UI
                    lineLoginButton.style.display = 'none';
                    lineSuccessStatus.style.display = 'flex';
                    stepPayment.style.display = 'block';
                    stepSubmit.style.display = 'block';
                    statusRegister.classList.add('active');
                    statusPending.classList.add('active');
                } else {
                    console.error('Failed to get Line User ID:', result.error);
                    alert('เกิดข้อผิดพลาดในการยืนยันตัวตนด้วย LINE');
                }

            } catch (error) {
                console.error('Error fetching Line User ID:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        }
    }

    // เรียกใช้ฟังก์ชันเมื่อโหลดหน้าเว็บ
    handleLineRedirect();

    // --- Event Listeners ---
    lineLoginButton.addEventListener('click', () => {
        window.location.href = lineLoginUrl;
    });

    submitButton.addEventListener('click', async () => {
        if (!lineUserId) {
            alert('กรุณาลงทะเบียนด้วย LINE ก่อน');
            return;
        }

        if (!userData) {
            alert('ไม่พบข้อมูลผู้ใช้งาน กรุณาลองใหม่');
            return;
        }

        const data = {
            action: "saveRequest",
            name: userData.firstName,
            lastName: userData.lastName,
            no: userData.no,
            studentId: userData.studentId,
            lineUserId: lineUserId
        };

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            const result = await response.json();

            if (result.success) {
                alert('ลงทะเบียนสำเร็จแล้ว! โปรดรอการตรวจสอบ');
                statusPending.classList.remove('active');
                document.getElementById('status-completed').classList.add('active');
                stepRegister.style.display = 'none';
                stepPayment.style.display = 'none';
                stepSubmit.style.display = 'none';
            } else {
                 console.error('Error submitting data:', result.error);
                 alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            }

        } catch (error) {
            console.error('Error submitting data:', error);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
        }
    });

    document.getElementById('slip-upload').addEventListener('change', (e) => {
        const fileName = e.target.files[0].name;
        alert(`ไฟล์ "${fileName}" ถูกเลือกแล้ว`);
    });
});
