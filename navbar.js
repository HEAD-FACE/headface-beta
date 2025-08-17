document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar & Mobile Menu Toggle Logic ---
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    let isAnimating = false;
    // Set a safe animation duration based on CSS transitions.
    const animationDuration = 400; 
    const closingTimeout = 1700; 

    /**
     * Toggles the mobile menu's active state.
     */
    const toggleMenu = () => {
        if (isAnimating) {
            return; // Prevent new actions during animation
        }

        if (mobileMenu.classList.contains('active')) {
            // Menu is open, start closing animation
            isAnimating = true;
            mobileMenu.classList.add('closing');
            
            setTimeout(() => {
                mobileMenu.classList.remove('active', 'closing');
                isAnimating = false;
            }, closingTimeout);
        } else {
            // Menu is closed, open it instantly
            mobileMenu.classList.remove('closing');
            mobileMenu.classList.add('active');
        }
    };

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click from bubbling up
            toggleMenu();
        });

        document.addEventListener('click', (e) => {
            // Close the menu if the user clicks outside of the hamburger or the menu itself.
            if (mobileMenu.classList.contains('active') && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                toggleMenu();
            }
        });
    }
