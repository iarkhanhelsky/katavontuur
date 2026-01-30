// UI elements - score display and reload button

// Create score display
function createScoreDisplay(scene) {
    score = 0;
    scoreText = scene.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    scoreText.setScrollFactor(0); // Fixed to camera
    // Ensure UI renders above all world elements and debug overlays
    scoreText.setDepth(DEPTH_UI);
}

// Create lives display (top right)
function createLivesDisplay(scene) {
    const lives = typeof state !== 'undefined' && state.lives != null ? state.lives : 9;
    livesText = scene.add.text(scene.cameras.main.width - 16, 16, 'Lives: ' + lives, {
        fontSize: '32px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    livesText.setOrigin(1, 0); // Right-align
    livesText.setScrollFactor(0);
    livesText.setDepth(DEPTH_UI);
}

// Reload level function
function reloadLevel() {
    // Reset joystick visual position
    const joystickStick = document.getElementById('joystick-stick');
    if (joystickStick) {
        joystickStick.style.transform = 'translate(-50%, -50%)';
    }
    
    // Reset joystick state
    joystickActive = false;
    joystickX = 0;
    joystickY = 0;
    jumpButtonPressed = false;
    
    // Reset score and lives
    score = 0;
    if (typeof state !== 'undefined') {
        state.lives = 9;
    }
    if (scoreText) {
        scoreText.setText('Score: 0');
    }
    if (livesText) {
        livesText.setText('Lives: 9');
    }
    
    // Restart the scene
    if (gameScene) {
        gameScene.scene.restart();
    }
}

// Initialize reload button
function initializeReloadButton() {
    // Connect reload button
    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
        reloadButton.addEventListener('click', reloadLevel);
        // Also support touch events for mobile
        reloadButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            reloadLevel();
        });
    }
}
