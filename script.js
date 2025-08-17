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

    // Get user data from Local Storage
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.studentId) {
        console.error('ไม่พบข้อมูลผู้ใช้ใน Local Storage');
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาลองล็อกอินใหม่อีกครั้ง');
        // Redirect the user back to the main page
        window.location.href = 'index.html';
        return;
    }
    const studentId = userData.studentId;

    /**
     * Updates the UI based on the user's status.
     * @param {string} status - The user's status (pending, success, null)
     */
    function updateUI(status) {
        // Hide all status elements initially
        const elementsToHide = [
            lineLoginButton, lineSuccessStatus, stepRegister,
            stepPayment, stepSubmit, statusRegister,
            statusPending, statusCompleted
        ];
        elementsToHide.forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Remove active classes
        const classesToRemove = [statusRegister, statusPending, statusCompleted];
        classesToRemove.forEach(el => {
            if (el) el.classList.remove('active');
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
            if (lineLoginButton) lineLoginButton.style.display = 'block';
            if (stepRegister) stepRegister.style.display = 'block';
            if (stepPayment) stepPayment.style.display = 'block';
            if (stepSubmit) stepSubmit.style.display = 'block';
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
            // Use a stable placeholder image URL
            qrCodeImage.src = 'https://placehold.co/200x200/cccccc/000000?text=QR+Code';
        }

        // Fetch LINE User ID using the authorization code
        if (code) {
            console.log('พบ LINE code:', code);
            const fetchUrl = `${gasUrl}?action=getUserId&code=${code}`;
            
            try {
                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
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
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
            }
        } else {
            // If there's no code in the URL, try to get lineUserId from sessionStorage
            lineUserId = sessionStorage.getItem('lineUserId');
        }
        
        // Check user status from the server using studentId
        try {
            const statusUrl = `${gasUrl}?action=getUserStatusByStudentId&studentId=${studentId}`;
            const response = await fetch(statusUrl);
            const result = await response.json();
            
            if (result.success) {
                updateUI(result.status);
            } else {
                console.error('ไม่สามารถตรวจสอบสถานะผู้ใช้ได้:', result.error);
                updateUI(null);
            }
        } catch (error) {
            console.error('Error fetching user status:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
            updateUI(null);
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
                    updateUI('pending');
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
