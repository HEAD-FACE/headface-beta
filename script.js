// JavaScript code for the Navbar with a fixed closing animation
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    let isAnimating = false;
    const totalItems = mobileMenu.querySelectorAll('li').length;
    const animationDuration = 400; // 0.4s
    const animationDelay = 100; // 0.1s
    const totalAnimationTime = (totalItems * animationDelay) + animationDuration;

    // Check if the elements exist before adding event listeners
    if (hamburger && mobileMenu) {
        // Function to open the menu
        const openMenu = () => {
            mobileMenu.classList.add('active');
            mobileMenu.classList.remove('closing'); // Remove closing class just in case
        };

        // Function to close the menu
        const closeMenu = () => {
            if (isAnimating) return;
            isAnimating = true;

            // Add the 'closing' class to trigger the reverse animation
            mobileMenu.classList.add('closing');

            // Wait for the animation to finish before removing the 'active' and 'closing' classes
            setTimeout(() => {
                mobileMenu.classList.remove('active', 'closing');
                isAnimating = false;
            }, totalAnimationTime);
        };

        // Event listener for the hamburger icon
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the click from bubbling up
            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Event listener to close the menu when clicking outside of it
        document.addEventListener('click', (e) => {
            // Check if the click target is outside the hamburger and menu, and the menu is active
            if (mobileMenu.classList.contains('active') && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                closeMenu();
            }
        });
    }
});



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
    const statusText = document.getElementById('status-text');
 
    
    // ดึงข้อมูลผู้ใช้จาก Local Storage
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.studentId) {
        console.error('ไม่พบข้อมูลผู้ใช้ใน Local Storage');
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาลองล็อกอินใหม่อีกครั้ง');
        // Redirect ผู้ใช้กลับไปหน้าหลัก
        window.location.href = 'index.html'; 
        return; 
    }
    const studentId = userData.studentId;

    /**
     * อัปเดต UI ตามสถานะการสมัคร
     * @param {string} status - สถานะของผู้ใช้ (pending, success, null)
     */
    function updateUI(status) {
        lineLoginButton.style.display = 'block';
        lineSuccessStatus.style.display = 'none';
        stepRegister.style.display = 'block';
        stepPayment.style.display = 'block';
        stepSubmit.style.display = 'block';
        statusRegister.classList.remove('active');
        statusPending.classList.remove('active');
        statusCompleted.classList.remove('active');

        if (status === 'pending') {
            statusRegister.classList.add('active');
            statusPending.classList.add('active');
            lineLoginButton.style.display = 'none';
            lineSuccessStatus.style.display = 'flex';
            stepRegister.style.display = 'none';
            stepPayment.style.display = 'none';
            stepSubmit.style.display = 'none';
            statusText.innerText = 'อยู่ระหว่างรอการตรวจสอบ';

        } else if (status === 'success') {
            statusRegister.classList.add('active');
            statusPending.classList.remove('active');
            statusCompleted.classList.add('active');
            lineLoginButton.style.display = 'none';
            lineSuccessStatus.style.display = 'flex';
            stepRegister.style.display = 'none';
            stepPayment.style.display = 'none';
            stepSubmit.style.display = 'none';
            statusText.innerText = 'ลงทะเบียนสำเร็จแล้ว!';
            // เพิ่มปุ่มกลับหน้าหลัก

        } else {
            statusRegister.classList.add('active');

        }
    }

    /**
     * ฟังก์ชันหลักในการตรวจสอบสถานะผู้ใช้และอัปเดต UI
     */
    async function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        // ส่วนนี้จะยังคงดึง lineUserId เพื่อนำไปใช้กับปุ่ม submit
        if (code) {
            console.log('พบ LINE code:', code);
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
        }
        
        // ตรวจสอบสถานะจาก studentId แทน
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
            updateUI(null);
        }
    }

    // --- Event Listeners ---
    lineLoginButton.addEventListener('click', () => {
        window.location.href = lineLoginUrl;
    });

    submitButton.addEventListener('click', async () => {
        // ใช้ studentId จาก localStorage แทน
        if (!userData) {
            alert('ไม่พบข้อมูลนักศึกษา');
            return;
        }

        // แต่ยังต้องใช้ lineUserId ที่ได้จากการล็อกอินเพื่อบันทึก
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

    
    
    initializePage();
});
