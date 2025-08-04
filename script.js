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

    let lineUserId = null;
    let lineDisplayName = null;

    // --- LINE Login Configuration ---
    const LINE_CHANNEL_ID = '2007333047';
    
    // <<< สำคัญ: แก้ไข URL ของ Netlify ของคุณที่นี่ >>>
    const NETLIFY_DOMAIN = 'https://melodic-sorbet-d3aa19.netlify.app';
    const LINE_REDIRECT_URI = `${NETLIFY_DOMAIN}/upgrade.html`;

    // <<< สำคัญ: URL สำหรับ Google Apps Script (GAS) Web App ของคุณจริงๆ >>>
    // URL นี้จะถูกใช้โดย Proxy Server เท่านั้น
    const GAS_TOKEN_EXCHANGE_URL = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';
    
    // <<< สำคัญ: URL สำหรับเรียก Proxy Server ที่ Netlify Functions >>>
    // นี่คือ URL ที่หน้าเว็บของคุณจะคุยด้วยจริงๆ
    const PROXY_URL = `${NETLIFY_DOMAIN}/api/proxy`;

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
        const state = generateRandomString(16);
        localStorage.setItem('line_login_state', state);

        const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(LINE_REDIRECT_URI)}&state=${state}&scope=profile%20openid`;
        
        window.location.href = lineAuthUrl;
    }

    // --- Handle Callback from LINE after login ---
    function handleLineCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('line_login_state');

        if (state && storedState && state === storedState) {
            localStorage.removeItem('line_login_state');
            history.replaceState({}, document.title, window.location.pathname);

            if (code) {
                console.log('Received LINE authorization code:', code);
                // เปลี่ยนการ fetch() ให้เรียก Proxy แทน GAS โดยตรง
                fetch(`${PROXY_URL}?url=${encodeURIComponent(GAS_TOKEN_EXCHANGE_URL)}`, {
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
            }
        } else if (state || storedState) {
            console.error('LINE callback: Invalid state parameter. Possible CSRF attack or invalid redirect.');
            alert('State ไม่ถูกต้อง กรุณาลองล็อกอิน LINE ใหม่.');
            history.replaceState({}, document.title, window.location.pathname);
        } else {
            console.log('No LINE login callback in progress.');
        }
    }

    handleLineCallback();

    lineLoginButton.addEventListener('click', () => {
        if (!lineUserId) {
            handleLineLogin();
        } else {
            alert('คุณได้เชื่อมต่อ LINE สำเร็จแล้ว!');
        }
    });

    slipUploadInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            fileNameDisplay.textContent = event.target.files[0].name;
        } else {
            fileNameDisplay.textContent = 'ยังไม่มีไฟล์ที่เลือก';
        }
    });

    let userData = null;
    try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            userData = JSON.parse(userJson);
        } else {
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
        
        const registrationData = {
            name: userData.firstName,
            lastName: userData.lastName,
            no: userData.no,
            studentId: userData.studentId,
            lineUserId: lineUserId,
            lineDisplayName: lineDisplayName,
            date: new Date().toISOString().split('T')[0],
            state: 'pending',
            slipFileName: slipFileName
        };

        const gasWebAppURL = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';
        
        try {
            updateStatusBar('status-pending');
            submitRegistrationButton.disabled = true;
            submitRegistrationButton.textContent = 'กำลังดำเนินการ...';

            // เปลี่ยนการ fetch() ให้เรียก Proxy แทน GAS โดยตรง
            const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(gasWebAppURL)}`, {
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
