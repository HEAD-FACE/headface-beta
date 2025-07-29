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

    // --- Function to update status bar ---
    function updateStatusBar(activeStatusId) {
        [statusRegister, statusPending, statusCompleted].forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(activeStatusId).classList.add('active');
    }

    // --- Initialize LINE SDK ---
    // Replace 'YOUR_CHANNEL_ID' with your actual LINE Login Channel ID
    // You need to create a LINE Login channel on LINE Developers console
    // and add 'http://localhost:5500/upgrade.html' (or your deployed URL) as a callback URL.
    liff.init({
        liffId: '2007333047-XVaQjnmO'
    }).then(() => {
        if (liff.isLoggedIn()) {
            liff.getProfile().then(profile => {
                lineUserId = profile.userId;
                console.log('LINE User ID:', lineUserId);
                // If already logged in, update UI
                lineLoginButton.textContent = 'LINE เชื่อมต่อสำเร็จ!';
                lineLoginButton.classList.add('success');
                lineLoginButton.disabled = true;
                paymentSection.style.display = 'block';
                updateStatusBar('status-register'); // Stay on register until submitted
            }).catch(err => console.error('Error getting LINE profile:', err));
        } else {
            console.log('Not logged in to LINE.');
        }
    }).catch(err => {
        console.error('LIFF initialization failed', err);
        alert('เกิดข้อผิดพลาดในการเริ่มต้น LINE SDK กรุณาลองใหม่ภายหลัง');
    });

    // --- LINE Login Button Click Handler ---
    lineLoginButton.addEventListener('click', () => {
        if (!liff.isLoggedIn()) {
            liff.login(); // This will redirect to LINE Login page
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
    // For demonstration, let's simulate user data
    let userData = null;
    try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            userData = JSON.parse(userJson);
            console.log('User data loaded from local storage:', userData);
        } else {
            console.warn('No user data found in local storage under key "user". Using dummy data.');
            // Fallback dummy data if not found in local storage
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
        // Fallback dummy data in case of parsing error
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

        // Simulate uploading slip (in a real scenario, you'd upload to cloud storage and get a URL)
        // For GAS, you might encode the file as Base64 or upload to Google Drive via GAS.
        // For simplicity here, we'll just send the file name/dummy data.
        const slipFileName = slipUploadInput.files[0].name;

        // Construct data for GAS
        const registrationData = {
            name: userData.firstName,
            lastName: userData.lastName,
            no: userData.no,
            studentId: userData.studentId,
            lineUserId: lineUserId,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            state: 'pending',
            slipFileName: slipFileName // In a real system, this would be a URL to the uploaded slip
        };

        console.log('Sending registration data to GAS:', registrationData);

        // --- Fetch to GAS (This is where your GAS Web App URL will go) ---
        // Replace 'YOUR_GAS_WEB_APP_URL' with the URL you get after deploying your GAS script
        const gasWebAppURL = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';

        try {
            updateStatusBar('status-pending'); // Change status to pending
            submitRegistrationButton.disabled = true;
            submitRegistrationButton.textContent = 'กำลังดำเนินการ...';

            const response = await fetch(gasWebAppURL, {
                method: 'POST',
                mode: 'cors', // Crucial for cross-origin requests
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('ลงทะเบียนสำเร็จ! กรุณารอการตรวจสอบ');
                updateStatusBar('status-completed'); // Change status to completed (or pending, depending on your flow)
                submitRegistrationButton.textContent = 'ลงทะเบียนสำเร็จ';
                submitRegistrationButton.classList.add('success');
                // You might want to disable further actions or redirect here
            } else {
                alert('ลงทะเบียนไม่สำเร็จ: ' + result.message);
                updateStatusBar('status-register'); // Revert status if failed
                submitRegistrationButton.disabled = false;
                submitRegistrationButton.textContent = 'ลงทะเบียน';
            }
        } catch (error) {
            console.error('Error submitting registration:', error);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message);
            updateStatusBar('status-register'); // Revert status if failed
            submitRegistrationButton.disabled = false;
            submitRegistrationButton.textContent = 'ลงทะเบียน';
        }
    });
});
