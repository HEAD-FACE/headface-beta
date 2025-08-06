document.addEventListener('DOMContentLoaded', async () => {
    const gasUrl = 'https://script.google.com/macros/s/AKfycbxQyMf_zMNuZoa_JLqa2S5LJYgxd1HwDfnMw-3_FtMH-mN2Db72O4xfqpU17zg2mebPkw/exec';
    const userListElement = document.getElementById('user-list');

    /**
     * ดึงรายการผู้สมัครที่อยู่ในสถานะ "pending"
     */
    async function fetchPendingRequests() {
        try {
            const response = await fetch(`${gasUrl}?action=getPendingRequests`);
            const requests = await response.json();
            
            userListElement.innerHTML = ''; // ล้างรายการเดิม
            
            if (requests.length === 0) {
                userListElement.innerHTML = '<p>ไม่มีรายการที่ต้องตรวจสอบ</p>';
                return;
            }

            requests.forEach(request => {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.innerHTML = `
                    <div class="user-info">
                        <h3>${request.firstName} ${request.lastName}</h3>
                        <p>รหัสนักศึกษา: ${request.studentId}</p>
                        <p>Line ID: ${request.lineUserId}</p>
                    </div>
                    <button class="confirm-button" data-row-index="${request.rowIndex}" data-line-id="${request.lineUserId}" data-student-id="${request.studentId}">ยืนยัน</button>
                `;
                userListElement.appendChild(userCard);
            });

            // เพิ่ม Event Listener ให้กับปุ่มยืนยัน
            userListElement.querySelectorAll('.confirm-button').forEach(button => {
                button.addEventListener('click', handleConfirm);
            });

        } catch (error) {
            console.error('Error fetching pending requests:', error);
            userListElement.innerHTML = '<p>เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
        }
    }

    /**
     * จัดการเมื่อกดปุ่มยืนยัน
     */
    async function handleConfirm(event) {
        const button = event.target;
        const rowIndex = button.getAttribute('data-row-index');
        const lineUserId = button.getAttribute('data-line-id');
        const studentId = button.getAttribute('data-student-id');
        
        if (!confirm(`คุณต้องการยืนยันการสมัครของนักศึกษา ${studentId} ใช่หรือไม่?`)) {
            return;
        }

        try {
            // ส่งคำขอไปที่ GAS เพื่อยืนยันการสมัคร
            const confirmUrl = `${gasUrl}?action=confirmRequest` +
                               `&rowIndex=${rowIndex}` +
                               `&lineUserId=${encodeURIComponent(lineUserId)}` +
                               `&studentId=${encodeURIComponent(studentId)}`;

            const response = await fetch(confirmUrl);
            const result = await response.json();
            
            if (result.success) {
                alert('ยืนยันการสมัครเรียบร้อยแล้ว');
                // อัปเดต UI หลังจากยืนยันสำเร็จ
                button.parentElement.remove();
                if (userListElement.children.length === 0) {
                    userListElement.innerHTML = '<p>ไม่มีรายการที่ต้องตรวจสอบ</p>';
                }
            } else {
                alert(`เกิดข้อผิดพลาดในการยืนยัน: ${result.error}`);
            }

        } catch (error) {
            console.error('Error confirming request:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    }

    // เรียกฟังก์ชันเมื่อโหลดหน้าเว็บ
    fetchPendingRequests();
});
