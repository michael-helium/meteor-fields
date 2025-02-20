const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Astronaut image setup
const astronautImg = new Image();
astronautImg.src = 'astronaut.png'; // Your 32x32 sprite file

// Astronaut (player) properties
const astronaut = {
    x: canvas.width / 2 - 16, // Start in the middle
    y: canvas.height / 2 - 16, // Start in the middle vertically
    width: 32,
    height: 64,
    speedX: 0, // Initial horizontal velocity
    speedY: 0, // Initial vertical velocity
    maxSpeed: 3.5, // Reduced by 50% from 7 (slower maximum speed)
    acceleration: 0.25, // Reduced by 50% from 0.5 (slower jetpack thrust)
    friction: 0.02 // Friction remains the same for consistent deceleration
};

// Meteor properties
const meteors = [];
const meteorSpeed = 5;
const spawnRate = 25; // Keep faster spawn rate for difficulty

// Keyboard controls
const keys = { up: false, down: false, left: false, right: false };
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Game state
let gameState = 'start'; // 'start', 'playing', or 'gameOver'
let gameOver = false;
let frameCount = 0;
let score = 0; // Score based on meteors dodged

// Buttons
const startButton = document.getElementById('startButton');
const startScreen = document.getElementById('startScreen');

// Function to spawn a meteor
function spawnMeteor() {
    const size = 20 + Math.random() * 20; // Random size between 20 and 40
    const x = Math.random() * (canvas.width - size); // Random x position
    meteors.push({
        x: x,
        y: -size, // Start above screen
        width: size,
        height: size,
        speed: meteorSpeed + Math.random() * 2.5 // Slightly variable speed
    });
}

// Function to reset the game (now triggered by refreshing or starting over)
function resetGame() {
    astronaut.x = canvas.width / 2 - 16;
    astronaut.y = canvas.height / 2 - 16;
    astronaut.speedX = 0; // Reset velocities
    astronaut.speedY = 0;
    meteors.length = 0; // Clear all meteors
    gameOver = false;
    score = 0;
    frameCount = 0;
    gameState = 'playing';
    startScreen.style.display = 'none'; // Ensure start screen stays hidden
}

// Update astronaut position with physics
function updateAstronaut() {
    // Apply jetpack thrust (acceleration) when keys are pressed
    if (keys.up && astronaut.speedY > -astronaut.maxSpeed) {
        astronaut.speedY -= astronaut.acceleration; // Thrust upward
    }
    if (keys.down && astronaut.speedY < astronaut.maxSpeed) {
        astronaut.speedY += astronaut.acceleration; // Thrust downward
    }
    if (keys.left && astronaut.speedX > -astronaut.maxSpeed) {
        astronaut.speedX -= astronaut.acceleration; // Thrust left
    }
    if (keys.right && astronaut.speedX < astronaut.maxSpeed) {
        astronaut.speedX += astronaut.acceleration; // Thrust right
    }

    // Apply friction to slow down when no keys are pressed
    if (!keys.up && !keys.down) {
        astronaut.speedY *= (1 - astronaut.friction); // Decelerate vertically
        if (Math.abs(astronaut.speedY) < 0.1) astronaut.speedY = 0; // Stop if very slow
    }
    if (!keys.left && !keys.right) {
        astronaut.speedX *= (1 - astronaut.friction); // Decelerate horizontally
        if (Math.abs(astronaut.speedX) < 0.1) astronaut.speedX = 0; // Stop if very slow
    }

    // Update position based on velocity
    astronaut.x += astronaut.speedX;
    astronaut.y += astronaut.speedY;

    // Boundary checks (prevent leaving canvas)
    if (astronaut.x < 0) {
        astronaut.x = 0;
        astronaut.speedX = 0; // Stop at left edge
    }
    if (astronaut.x > canvas.width - astronaut.width) {
        astronaut.x = canvas.width - astronaut.width;
        astronaut.speedX = 0; // Stop at right edge
    }
    if (astronaut.y < 0) {
        astronaut.y = 0;
        astronaut.speedY = 0; // Stop at top edge
    }
    if (astronaut.y > canvas.height - astronaut.height) {
        astronaut.y = canvas.height - astronaut.height;
        astronaut.speedY = 0; // Stop at bottom edge
    }
}

// Game loop
function update() {
    if (gameState === 'start') {
        // Do nothing; start screen is shown
        return;
    }

    if (gameState === 'gameOver') {
        ctx.fillStyle = 'white'; // White for visibility against dark background
        ctx.font = '30px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 40); // Show final score
        return; // No button, player must refresh or click "Start" again
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update astronaut with physics
    updateAstronaut();

    // Spawn meteors randomly
    frameCount++;
    if (frameCount % spawnRate === 0) {
        spawnMeteor();
    }

    // Update and draw meteors
    ctx.fillStyle = '#808080'; // Gray for meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.y += meteor.speed;

        // Draw meteor
        ctx.fillRect(meteor.x, meteor.y, meteor.width, meteor.height);

        // Check collision with astronaut
        if (
            astronaut.x < meteor.x + meteor.width &&
            astronaut.x + astronaut.width > meteor.x &&
            astronaut.y < meteor.y + meteor.height &&
            astronaut.y + astronaut.height > meteor.y
        ) {
            gameOver = true;
            gameState = 'gameOver';
        }

        // Score points and remove meteor if off-screen
        if (meteor.y > canvas.height) {
            meteors.splice(i, 1);
            score += 10; // 10 points per meteor dodged
        }
    }

    // Draw astronaut
    ctx.drawImage(astronautImg, astronaut.x, astronaut.y, astronaut.width, astronaut.height);

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30); // Top-left corner

    // Request next frame
    requestAnimationFrame(update);
}

// Add start button click handler
startButton.addEventListener('click', () => {
    gameState = 'playing';
    startScreen.style.display = 'none'; // Hide start screen
    resetGame(); // Reset game state and start playing
    update(); // Start the game loop
});

// Start with the start screen visible (no initial update call)
