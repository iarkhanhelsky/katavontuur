// Input handling - keyboard and mobile joystick

// Initialize mobile joystick
function initializeMobileJoystick(scene) {
    // Get joystick elements
    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');
    const jumpButton = document.getElementById('jump-button');
    
    if (!joystickContainer || !joystickStick) {
        return;
    }
    
    // Calculate joystick base position and radius
    // We'll recalculate on each touch to handle window resizing
    const getJoystickBounds = () => {
        const rect = joystickContainer.getBoundingClientRect();
        return {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            radius: rect.width / 2 - 30 // Leave some margin for stick movement
        };
    };
    
    // Initialize joystick bounds
    const initialBounds = getJoystickBounds();
    joystickBaseX = initialBounds.centerX;
    joystickBaseY = initialBounds.centerY;
    joystickRadius = initialBounds.radius;
    
    // Joystick touch handlers
    const handleJoystickStart = (e) => {
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        activeTouchId = touch.identifier !== undefined ? touch.identifier : 0;
        joystickActive = true;
        updateJoystickPosition(touch);
    };
    
    const handleJoystickMove = (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        const touch = e.touches ? Array.from(e.touches).find(t => t.identifier === activeTouchId) : e;
        if (touch) {
            updateJoystickPosition(touch);
        }
    };
    
    const handleJoystickEnd = (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        joystickActive = false;
        joystickX = 0;
        joystickY = 0;
        resetJoystickPosition();
    };
    
    const updateJoystickPosition = (touch) => {
        const bounds = getJoystickBounds();
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        
        // Calculate distance from center
        const deltaX = clientX - bounds.centerX;
        const deltaY = clientY - bounds.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Clamp to joystick radius
        if (distance > bounds.radius) {
            const angle = Math.atan2(deltaY, deltaX);
            joystickX = Math.cos(angle) * bounds.radius;
            joystickY = Math.sin(angle) * bounds.radius;
        } else {
            joystickX = deltaX;
            joystickY = deltaY;
        }
        
        // Store radius for normalization in update loop
        joystickRadius = bounds.radius;
        
        // Update stick visual position
        joystickStick.style.transform = `translate(calc(-50% + ${joystickX}px), calc(-50% + ${joystickY}px))`;
    };
    
    const resetJoystickPosition = () => {
        joystickStick.style.transform = 'translate(-50%, -50%)';
    };
    
    // Add event listeners
    joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickContainer.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickContainer.addEventListener('touchend', handleJoystickEnd, { passive: false });
    joystickContainer.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    
    // Mouse support for testing on desktop (when simulating mobile)
    joystickContainer.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', (e) => {
        if (joystickActive) {
            handleJoystickMove(e);
        }
    });
    document.addEventListener('mouseup', handleJoystickEnd);
    
    // Jump button handlers
    if (jumpButton) {
        const handleJumpStart = (e) => {
            e.preventDefault();
            jumpButtonPressed = true;
        };
        
        const handleJumpEnd = (e) => {
            e.preventDefault();
            jumpButtonPressed = false;
        };
        
        jumpButton.addEventListener('touchstart', handleJumpStart, { passive: false });
        jumpButton.addEventListener('touchend', handleJumpEnd, { passive: false });
        jumpButton.addEventListener('touchcancel', handleJumpEnd, { passive: false });
        jumpButton.addEventListener('mousedown', handleJumpStart);
        jumpButton.addEventListener('mouseup', handleJumpEnd);
        jumpButton.addEventListener('mouseleave', handleJumpEnd);
    }
    
    // Prevent default touch behaviors that might interfere
    document.addEventListener('touchmove', (e) => {
        // Only prevent if touching joystick area
        if (joystickActive || jumpButtonPressed) {
            e.preventDefault();
        }
    }, { passive: false });
}
