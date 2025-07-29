// script.js
document.addEventListener('DOMContentLoaded', () => {
    const lineLoginButton = document.getElementById('line-login-button');
    const paymentSection = document.getElementById('payment-section');
    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');
    const statusCompleted = document.getElementById('status-completed');
    const slipUploadInput = document.getElementById('slip-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
    const submitRegistrationButton = document.getElementById('submit-registration-button');

    let lineUserId = null; // To store LINE User ID
    let lineDisplayName = null; // To store LINE Display Name (optional)

    // --- LINE Login Configuration ---
    // <<< สำคัญ: แทนที่ด้วย Channel ID และ Callback URL ของคุณ >>>
    const LINE_CHANNEL_ID = '2007333047'; // Channel ID ของ LINE Login Channel
    const LINE_REDIRECT_URI = window.location.origin + window.location.pathname; // URL ของหน้า upgrade.html ที่ LINE จะ redirect กลับมา
    // Example: ถ้าเว็บของคุณคือ https://yourusername.github.io/your-repo/upgrade.html
    // LINE_REDIRECT_URI จะเป็น 'https://yourusername.github.io/your-repo/upgrade.html'

    // <<< สำคัญ: แทนที่ด้วย GAS Web App URL ของคุณ >>>
    // นี่คือ URL ของ GAS Web App ที่จะทำหน้าที่แลก Code เป็น Access Token
    const GAS_TOKEN_EXCHANGE_URL = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec'; 
    // ตัวอย่าง: 'https://script.google.com/macros/s/AKfycbx.../exec'


    // --- Function to update status bar ---
    function updateStatusBar(activeStatusId) {
        [statusRegister, statusPending, statusCompleted].forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(activeStatusId).classList.add('active');
    }

    // --- Helper function to generate random string for state ---
    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // --- LINE Login Handler ---
    function handleLineLogin() {
        const state = generateRandomString(16); // สร้างค่า State เพื่อป้องกัน CSRF
        localStorage.setItem('line_login_state', state); // บันทึกค่า State ใน localStorage

        // สร้าง URL สำหรับ LINE Authorization
        const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(LINE_REDIRECT_URI)}&state=${state}&scope=profile%20openid`;
        
        // พาผู้ใช้ไปยังหน้า LINE Login
        window.location.href = lineAuthUrl;
    }

    // --- Handle Callback from LINE after login ---
    function handleLineCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('line_login_state');

        // ตรวจสอบ state เพื่อความปลอดภัย
        if (state && storedState && state === storedState) {
            localStorage.removeItem('line_login_state'); // ลบ state ที่ใช้แล้ว
            history.replaceState({}, document.title, window.location.pathname); // ลบ URL params ออกจาก Address bar

            if (code) {
                console.log('Received LINE authorization code:', code);
                // ส่ง code ไปให้ GAS เพื่อแลก Access Token และดึงโปรไฟล์
                fetch(GAS_TOKEN_EXCHANGE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code, redirect_uri: LINE_REDIRECT_URI })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success' && data.userId) {
                        lineUserId = data.userId;
                        lineDisplayName = data.displayName || 'LINE User';
                        console.log('LINE Login successful! User ID:', lineUserId, 'Display Name:', lineDisplayName);
                        
                        lineLoginButton.textContent = `LINE เชื่อมต่อสำเร็จ! (${lineDisplayName})`;
                        lineLoginButton.classList.add('success');
                        lineLoginButton.disabled = true;
                        paymentSection.style.display = 'block';
                        updateStatusBar('status-register');
                    } else {
                        console.error('Failed to get LINE user data:', data.message || data.error);
                        alert('ล็อกอิน LINE ไม่สำเร็จ: ' + (data.message || data.error));
                    }
                })
                .catch(error => {
                    console.error('Error during LINE token exchange:', error);
                    alert('เกิดข้อผิดพลาดในการแลก Token: ' + error.message);
                });
            } else {
                console.warn('LINE callback: No authorization code received.');
                // ผู้ใช้อาจจะยกเลิกการล็อกอิน
            }
        } else if (state || storedState) {
            console.error('LINE callback: Invalid state parameter. Possible CSRF attack or invalid redirect.');
            alert('State ไม่ถูกต้อง กรุณาลองล็อกอิน LINE ใหม่.');
            history.replaceState({}, document.title, window.location.pathname); // ลบ URL params ออก
        } else {
            console.log('No LINE login callback in progress.');
        }
    }

    // --- Check for LINE Login callback on page load ---
    handleLineCallback();


    // --- LINE Login Button Click Handler ---
    lineLoginButton.addEventListener('click', () => {
        // ตรวจสอบว่ามี lineUserId อยู่แล้วหรือไม่ ก่อนจะเริ่มกระบวนการล็อกอิน
        if (!lineUserId) {
            handleLineLogin();
        } else {
            alert('คุณได้เชื่อมต่อ LINE สำเร็จแล้ว!');
        }
    });

    // --- Handle file upload display ---
    slipUploadInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            fileNameDisplay.textContent = event.target.files[0].name;
        } else {
            fileNameDisplay.textContent = 'ยังไม่มีไฟล์ที่เลือก';
        }
    });

    // --- Dummy user data from local storage (replace with your actual data retrieval) ---
    // สำหรับการสาธิต, เราจะจำลองข้อมูลผู้ใช้
    let userData = null;
    try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            userData = JSON.parse(userJson);
            console.log('User data loaded from local storage:', userData);
        } else {
            console.warn('No user data found in local storage under key "user". Using dummy data.');
            userData = {
                studentId: 56006,
                no: 1,
                firstName: "ณัฐธีร์",
                lastName: "ชาติชีวินทร์",
                points: ""
            };
        }
    } catch (e) {
        console.error('Error parsing user data from local storage:', e);
        userData = {
            studentId: 56006,
            no: 1,
            firstName: "ณัฐธีร์",
            lastName: "ชาติชีวินทร์",
            points: ""
        };
    }

    // --- Submit Registration Button Handler (Placeholder for GAS fetch) ---
    submitRegistrationButton.addEventListener('click', async () => {
        if (!lineUserId) {
            alert('กรุณาเชื่อมต่อ LINE ก่อนดำเนินการลงทะเบียน');
            return;
        }

        if (!slipUploadInput.files.length) {
            alert('กรุณาอัปโหลดสลิปการชำระเงิน');
            return;
        }

        const slipFileName = slipUploadInput.files[0].name;

        // Construct data for GAS
        const registrationData = {
            name: userData.firstName,
            lastName: userData.lastName,
            no: userData.no,
            studentId: userData.studentId,
            lineUserId: lineUserId,
            lineDisplayName: lineDisplayName, // เพิ่ม display name เข้าไป
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            state: 'pending',
            slipFileName: slipFileName
        };

        console.log('Sending registration data to GAS:', registrationData);

        // --- Fetch to GAS (นี่คือ GAS Web App URL ที่คุณใช้ส่งข้อมูลการลงทะเบียน) ---
        // ใช้ URL เดิมที่คุณใช้ส่งข้อมูลการลงทะเบียน
        const gasWebAppURL = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec'; 

        try {
            updateStatusBar('status-pending');
            submitRegistrationButton.disabled = true;
            submitRegistrationButton.textContent = 'กำลังดำเนินการ...';

            const response = await fetch(gasWebAppURL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('ลงทะเบียนสำเร็จ! กรุณารอการตรวจสอบ');
                updateStatusBar('status-completed');
                submitRegistrationButton.textContent = 'ลงทะเบียนสำเร็จ';
                submitRegistrationButton.classList.add('success');
            } else {
                alert('ลงทะเบียนไม่สำเร็จ: ' + result.message);
                updateStatusBar('status-register');
                submitRegistrationButton.disabled = false;
                submitRegistrationButton.textContent = 'ลงทะเบียน';
            }
        } catch (error) {
            console.error('Error submitting registration:', error);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message);
            updateStatusBar('status-register');
            submitRegistrationButton.disabled = false;
            submitRegistrationButton.textContent = 'ลงทะเบียน';
        }
    });
});
