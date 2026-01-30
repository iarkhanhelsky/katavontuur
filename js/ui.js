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

// Game over overlay (Phaser objects; set from showGameOver)
let gameOverOverlay = null;
let gameOverText = null;
let restartButtonText = null;

// Show game over screen (call when lives reach 0)
function showGameOver(scene) {
    if (gameOverOverlay) return; // Already showing
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    gameOverOverlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    gameOverOverlay.setScrollFactor(0);
    gameOverOverlay.setDepth(DEPTH_GAME_OVER);
    gameOverOverlay.setInteractive({ useHandCursor: true });

    gameOverText = scene.add.text(w / 2, h / 2 - 50, 'Game Over', {
        fontSize: '64px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 6
    });
    gameOverText.setOrigin(0.5, 0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(DEPTH_GAME_OVER + 1);

    restartButtonText = scene.add.text(w / 2, h / 2 + 30, 'Restart', {
        fontSize: '36px',
        fill: '#ffcc00',
        stroke: '#000',
        strokeThickness: 4
    });
    restartButtonText.setOrigin(0.5, 0.5);
    restartButtonText.setScrollFactor(0);
    restartButtonText.setDepth(DEPTH_GAME_OVER + 1);
    restartButtonText.setInteractive({ useHandCursor: true });
    restartButtonText.on('pointerdown', function () {
        reloadLevel();
    });
    restartButtonText.on('pointerover', function () {
        restartButtonText.setStyle({ fill: '#ffe066' });
    });
    restartButtonText.on('pointerout', function () {
        restartButtonText.setStyle({ fill: '#ffcc00' });
    });
}

// Reload level function
function reloadLevel() {
    // Clear game over state
    if (typeof state !== 'undefined') {
        state.gameOver = false;
    }
    gameOverOverlay = null;
    gameOverText = null;
    restartButtonText = null;

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
