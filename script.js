// This script handles the LINE login and user upgrade request logic.
document.addEventListener('DOMContentLoaded', () => {
    // Define the URL for the Google Apps Script Web App and LINE Login
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?
response_type=code
&client_id=2007333047
&redirect_uri=https://head-face.github.io/headface-beta/upgrade.html
&state=abcdefghijklmnopqrstuvwxyz
&scope=profile%20openid`;

    let lineUserId = null;

    // Get a reference to all UI elements
    const lineLoginButton = document.getElementById('line-login-button');
    const lineSuccessStatus = document.getElementById('line-success-status');
    const stepRegister = document.getElementById('step-register');
    const stepPayment = document.getElementById('step-payment');
    const stepSubmit = document.getElementById('step-submit');
    const submitButton = document.getElementById('submit-button');
    const qrCodeImage = document.getElementById('qr-code-img');

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');
    const statusCompleted = document.getElementById('status-completed');
    const statusText = document.getElementById('status-text');

    // Get user data from Local Storage (Note: This is now a more flexible check)
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // The studentId is used for API calls, but the page can still load without it.
    const studentId = userData ? userData.studentId : null;

    /**
     * Updates the UI based on the user's status and LINE login state.
     * @param {string} status - The user's status from GAS (pending, success, null)
     * @param {boolean} hasLineLogin - True if the user has successfully logged in with LINE on this session.
     */
    function updateUI(status, hasLineLogin) {
        // Hide all status elements and remove active classes initially
        const elementsToHide = [
            lineLoginButton, lineSuccessStatus, stepRegister,
            stepPayment, stepSubmit
        ];
        elementsToHide.forEach(el => {
            if (el) {
                el.style.display = 'none';
            }
        });
        
        const classesToRemove = [statusRegister, statusPending, statusCompleted];
        classesToRemove.forEach(el => {
            if (el) {
                el.classList.remove('active');
            }
        });

        // Apply new styles and classes based on status
        if (status === 'pending') {
            if (statusRegister) statusRegister.classList.add('active');
            if (statusPending) statusPending.classList.add('active');
            if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
            if (statusText) statusText.innerText = 'อยู่ระหว่างรอการตรวจสอบ';
        } else if (status === 'success') {
            if (statusRegister) statusRegister.classList.add('active');
            if (statusCompleted) statusCompleted.classList.add('active');
            if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
            if (statusText) statusText.innerText = 'ลงทะเบียนสำเร็จแล้ว!';
        } else {
            // Default status: Not registered or status unknown
            if (statusRegister) statusRegister.classList.add('active');
            if (hasLineLogin) {
                if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
                if (stepRegister) stepRegister.style.display = 'block';
                if (stepPayment) stepPayment.style.display = 'block';
                if (stepSubmit) stepSubmit.style.display = 'block';
            } else {
                if (lineLoginButton) lineLoginButton.style.display = 'block';
            }
        }
    }

    /**
     * Main function to initialize the page and fetch user data.
     */
    async function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        // Handle the QR code image 404 error
        if (qrCodeImage) {
            qrCodeImage.src = 'https://placehold.co/200x200/cccccc/000000?text=QR+Code';
        }

        // Check if we have a LINE login code
        if (code) {
            try {
                const fetchUrl = `${gasUrl}?action=getUserId&code=${code}`;
                const response = await fetch(fetchUrl);
                const result = await response.json();
                
                if (result.success) {
                    lineUserId = result.lineUserId;
                    sessionStorage.setItem('lineUserId', lineUserId);
                    console.log('ดึง Line User ID สำเร็จ:', lineUserId);
                } else {
                    console.error('ไม่สามารถดึง Line User ID ได้:', result.error);
                    alert('เกิดข้อผิดพลาดในการยืนยันตัวตนด้วย LINE');
                }
                
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            }
        } else {
            // If no code, check session storage for a previously logged-in ID
            lineUserId = sessionStorage.getItem('lineUserId');
        }
        
        // Check user status from the server only if studentId is available
        if (studentId) {
            try {
                const statusUrl = `${gasUrl}?action=getUserStatusByStudentId&studentId=${studentId}`;
                const response = await fetch(statusUrl);
                const result = await response.json();
                
                if (result.success) {
                    // Update UI based on server status and current LINE login state
                    updateUI(result.status, !!lineUserId);
                } else {
                    console.error('ไม่สามารถตรวจสอบสถานะผู้ใช้ได้:', result.error);
                    updateUI(null, !!lineUserId);
                }
            } catch (error) {
                console.error('Error fetching user status:', error);
                updateUI(null, !!lineUserId);
            }
        } else {
            // If no studentId, just update the UI based on LINE login state
            updateUI(null, !!lineUserId);
        }
    }

    // --- Event Listeners ---
    if (lineLoginButton) {
        lineLoginButton.addEventListener('click', () => {
            window.location.href = lineLoginUrl;
        });
    }

    if (submitButton) {
        submitButton.addEventListener('click', async () => {
            if (!userData) {
                alert('ไม่พบข้อมูลนักศึกษา');
                return;
            }

            if (!lineUserId) {
                alert('กรุณาลงทะเบียนด้วย LINE ก่อน');
                return;
            }

            try {
                const saveUrl = `${gasUrl}?action=saveRequest` +
                                `&name=${encodeURIComponent(userData.firstName)}` +
                                `&lastName=${encodeURIComponent(userData.lastName)}` +
                                `&no=${encodeURIComponent(userData.no)}` +
                                `&studentId=${encodeURIComponent(userData.studentId)}` +
                                `&lineUserId=${encodeURIComponent(lineUserId)}`;
                                
                const response = await fetch(saveUrl);
                const result = await response.json();

                if (result.success) {
                    alert('ลงทะเบียนสำเร็จแล้ว! โปรดรอการตรวจสอบ');
                    updateUI('pending', !!lineUserId);
                } else {
                    console.error('Error submitting data:', result.error);
                    alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
                }
            } catch (error) {
                console.error('Error submitting data:', error);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            }
        });
    }
    
    // Initialize the page on load
    initializePage();
});
