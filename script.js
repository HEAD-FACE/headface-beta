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
    const upgradeButton = document.getElementById('upgrade-button'); // เพิ่มการอ้างอิงถึงปุ่ม UPGRADE

    const statusRegister = document.getElementById('status-register');
    const statusPending = document.getElementById('status-pending');
    const statusCompleted = document.getElementById('status-completed');
    const statusText = document.getElementById('status-text');

    // Get user data from Local Storage (Note: This is now a more flexible check)
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // The studentId is used for API calls, but the page can still load without it.
    const studentId = userData ? userData.studentId : null;
    console.log('ข้อมูลผู้ใช้จาก Local Storage:', userData);
    console.log('Student ID ที่พบ:', studentId);


    /**
     * Updates the UI based on the user's status and LINE login state.
     * @param {string} status - The user's status from GAS (pending, success, null)
     * @param {boolean} hasLineLogin - True if the user has successfully logged in with LINE on this session.
     */
    function updateUI(status, hasLineLogin) {
        console.log(`เรียกใช้ updateUI() ด้วยสถานะ: ${status} และมี Line Login: ${hasLineLogin}`);

        // Hide all status elements and remove active classes initially
        const elementsToHide = [
            lineLoginButton, lineSuccessStatus, stepRegister,
            stepPayment, stepSubmit, upgradeButton
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
            // Case 1: Status is pending. Show pending status, regardless of LINE login.
            console.log('สถานะเป็น pending. แสดงสถานะอยู่ระหว่างรอการตรวจสอบ');
            if (statusRegister) statusRegister.classList.add('active');
            if (statusPending) statusPending.classList.add('active');
            if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
            if (statusText) statusText.innerText = 'อยู่ระหว่างรอการตรวจสอบ';
        } else if (status === 'success') {
            // Case 2: Status is success. Show success status and the UPGRADE button.
            console.log('สถานะเป็น success. แสดงสถานะลงทะเบียนสำเร็จแล้ว และแสดงปุ่ม UPGRADE');
            if (statusRegister) statusRegister.classList.add('active');
            if (statusCompleted) statusCompleted.classList.add('active');
            if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
            if (statusText) statusText.innerText = 'ลงทะเบียนสำเร็จแล้ว!';
            if (upgradeButton) upgradeButton.style.display = 'block'; // แสดงปุ่ม UPGRADE
        } else {
            // Case 3: Status is not yet pending or success.
            console.log('สถานะยังไม่เป็น pending/success. ตรวจสอบว่าเคยล็อกอิน LINE หรือไม่');
            if (statusRegister) statusRegister.classList.add('active');
            if (hasLineLogin) {
                // Case 3a: User has logged in with LINE before (hasLineLogin is true). Show the registration steps.
                console.log('เคยล็อกอิน LINE. แสดงขั้นตอนการสมัคร');
                if (lineSuccessStatus) lineSuccessStatus.style.display = 'flex';
                if (stepRegister) stepRegister.style.display = 'block';
                if (stepPayment) stepPayment.style.display = 'block';
                if (stepSubmit) stepSubmit.style.display = 'block';
            } else {
                // Case 3b: User has not logged in with LINE before. Show the LINE login button.
                console.log('ยังไม่เคยล็อกอิน LINE. แสดงปุ่ม LINE Login');
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

        // Check if we have a LINE login code from the URL
        if (code) {
            console.log('พบโค้ดใน URL. กำลังดึง Line User ID...');
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
                console.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดึง Line User ID:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            }
        } else {
            // If no code, check session storage for a previously logged-in ID
            lineUserId = sessionStorage.getItem('lineUserId');
            console.log('ไม่พบโค้ดใน URL. ตรวจสอบ Line User ID ใน Session Storage:', lineUserId);
        }
        
        // Check user status from the server only if studentId is available
        if (studentId) {
            console.log('พบ studentId. กำลังตรวจสอบสถานะผู้ใช้จากเซิร์ฟเวอร์...');
            try {
                const statusUrl = `${gasUrl}?action=getUserStatusByStudentId&studentId=${studentId}`;
                const response = await fetch(statusUrl);
                const result = await response.json();
                
                console.log('ผลลัพธ์จากเซิร์ฟเวอร์:', result);
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
            console.log('ไม่พบ studentId. แสดง UI ตามสถานะ LINE Login');
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
            if (!userData || !userData.studentId) {
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

    // New event listener for the UPGRADE button
    if (upgradeButton) {
        upgradeButton.addEventListener('click', async () => {
            if (!studentId) {
                alert('ไม่พบข้อมูลนักศึกษาสำหรับดำเนินการ');
                return;
            }

            if (confirm('ยืนยันการอัปเกรดสถานะ? ข้อมูลสถานะจะถูกรีเซ็ต')) {
                console.log('กำลังส่งคำขออัปเกรดสถานะไปยัง GAS...');
                try {
                    const upgradeUrl = `${gasUrl}?action=upgrade` +
                                     `&studentId=${encodeURIComponent(studentId)}`;
                    
                    const response = await fetch(upgradeUrl);
                    const result = await response.json();

                    if (result.success) {
                        alert('อัปเกรดสำเร็จแล้ว! หน้าเว็บจะรีเซ็ตเพื่อดำเนินการอีกครั้ง');
                        // Reset UI to the initial state
                        updateUI(null, !!lineUserId);
                    } else {
                        console.error('Error upgrading status:', result.error);
                        alert('เกิดข้อผิดพลาดในการอัปเกรดสถานะ');
                    }
                } catch (error) {
                    console.error('Error during upgrade request:', error);
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                }
            }
        });
    }
    
    // Initialize the page on load
    initializePage();
});
