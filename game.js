// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const astronautOnImg = new Image();
astronautOnImg.src = 'astronaut-on.png';
const astronautOffImg = new Image();
astronautOffImg.src = 'astronaut-off.png';
const meteorGreenImg = new Image();
meteorGreenImg.src = 'meteor-green.png';
const meteorRedImg = new Image();
meteorRedImg.src = 'meteor-red.png';

// Astronaut properties
const astronaut = {
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 43.5,
    width: 50,
    height: 87,
    speedX: 0,
    speedY: 0,
    maxSpeed: 10,
    acceleration: 0.25,
    friction: 0.02,
    collisionWidth: 30,
    collisionHeight: 60,
    collisionOffsetX: 12,
    collisionOffsetY: 6
};

// Meteor properties
const meteors = [];
const meteorSpeed = 3;
const baseSpawnRate = 50;
let spawnRate = baseSpawnRate;

// Star properties
const stars = [];
const numStars = 100;
function createStar() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#FFFFFF' : '#CCCCCC'
    };
}

// Game state
let gameState = 'start';
let frameCount = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let animationFrameId = null;

// UI elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const replayButton = document.getElementById('replayButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScore = document.getElementById('finalScore');
const finalHighScore = document.getElementById('finalHighScore');

// Debug flag
const SHOW_HITBOXES = false; // Set to true to show hitboxes, false to hide

// Input handling
const keys = { up: false, down: false, left: false, right: false };
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') keys.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// Spawn meteor
function spawnMeteor() {
    const size = 20 + Math.random() * 100;
    const x = Math.random() * (canvas.width - size);
    meteors.push({
        x,
        y: -size,
        width: size,
        height: size,
        speed: meteorSpeed + Math.random() * 2,
        isRed: size >= 100,
        collisionWidth: size * 0.75,
        collisionHeight: size * 0.75,
        collisionOffsetX: size * 0.1,
        collisionOffsetY: size * 0.1
    });
}

// Reset game
function resetGame() {
    astronaut.x = canvas.width / 2 - 25;
    astronaut.y = canvas.height / 2 - 43.5;
    astronaut.speedX = 0;
    astronaut.speedY = 0;
    meteors.length = 0;
    stars.length = 0;
    for (let i = 0; i < numStars; i++) {
        stars.push(createStar());
    }
    score = 0;
    frameCount = 0;
    spawnRate = baseSpawnRate;
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    updateScoreDisplay();
}

// Update astronaut
function updateAstronaut(deltaTime) {
    const accel = astronaut.acceleration * deltaTime;
    if (keys.up && astronaut.speedY > -astronaut.maxSpeed) astronaut.speedY -= accel;
    if (keys.down && astronaut.speedY < astronaut.maxSpeed) astronaut.speedY += accel;
    if (keys.left && astronaut.speedX > -astronaut.maxSpeed) astronaut.speedX -= accel;
    if (keys.right && astronaut.speedX < astronaut.maxSpeed) astronaut.speedX += accel;

    const friction = 1 - (astronaut.friction * deltaTime);
    astronaut.speedX *= friction;
    astronaut.speedY *= friction;
    if (Math.abs(astronaut.speedX) < 0.1) astronaut.speedX = 0;
    if (Math.abs(astronaut.speedY) < 0.1) astronaut.speedY = 0;

    astronaut.x += astronaut.speedX * deltaTime;
    astronaut.y += astronaut.speedY * deltaTime;

    astronaut.x = Math.max(0, Math.min(canvas.width - astronaut.width, astronaut.x));
    astronaut.y = Math.max(0, Math.min(canvas.height - astronaut.height, astronaut.y));

    if (astronaut.x === 0 || astronaut.x === canvas.width - astronaut.width) astronaut.speedX = 0;
    if (astronaut.y === 0 || astronaut.y === canvas.height - astronaut.height) astronaut.speedY = 0;
}

// Check collision
function checkCollision(astronaut, meteor) {
    const astroLeft = astronaut.x + astronaut.collisionOffsetX;
    const astroRight = astroLeft + astronaut.collisionWidth;
    const astroTop = astronaut.y + astronaut.collisionOffsetY;
    const astroBottom = astroTop + astronaut.collisionHeight;

    const meteorLeft = meteor.x + meteor.collisionOffsetX;
    const meteorRight = meteorLeft + meteor.collisionWidth;
    const meteorTop = meteor.y + meteor.collisionOffsetY;
    const meteorBottom = meteorTop + meteor.collisionHeight;

    return (
        astroLeft < meteorRight &&
        astroRight > meteorLeft &&
        astroTop < meteorBottom &&
        astroBottom > meteorTop
    );
}

// Update and draw stars
function updateStars(deltaTime) {
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.y += star.speed * deltaTime;

        if (star.y > canvas.height) {
            star.y = -star.height;
            star.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.width, star.height);
    }
}

// Debug: Draw hitbox
function drawHitbox(obj, color = 'red') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
        obj.x + obj.collisionOffsetX,
        obj.y + obj.collisionOffsetY,
        obj.collisionWidth,
        obj.collisionHeight
    );
}

// Update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore}`;
}

// Game loop
let lastTime = 0;
function gameLogic(deltaTime) {
    if (gameState !== 'playing') return;

    updateAstronaut(deltaTime);
    frameCount++;
    if (frameCount % Math.floor(spawnRate) === 0) spawnMeteor();

    spawnRate = Math.max(10, baseSpawnRate - Math.floor(score / 200));

    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.y += meteor.speed * deltaTime;

        if (checkCollision(astronaut, meteor)) {
            gameState = 'gameOver';
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
            updateScoreDisplay();
            finalScore.textContent = score;
            finalHighScore.textContent = highScore;
            gameOverScreen.classList.remove('hidden');
        }

        if (meteor.y > canvas.height) {
            meteors.splice(i, 1);
            score += 10;
            updateScoreDisplay();
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStars(1);

    for (const meteor of meteors) {
        const img = meteor.isRed ? meteorRedImg : meteorGreenImg;
        ctx.drawImage(img, meteor.x, meteor.y, meteor.width, meteor.height);
        if (SHOW_HITBOXES) drawHitbox(meteor, 'red');
    }

    ctx.save();
    ctx.translate(astronaut.x + astronaut.width / 2, astronaut.y + astronaut.height / 2);
    ctx.rotate((astronaut.speedX * Math.PI) / 180);
    const currentAstronautImg = (keys.up || keys.down || keys.left || keys.right) ? astronautOnImg : astronautOffImg;
    ctx.drawImage(currentAstronautImg, -astronaut.width / 2, -astronaut.height / 2, astronaut.width, astronaut.height);
    ctx.restore();
    if (SHOW_HITBOXES) drawHitbox(astronaut, 'blue');
}

function update(timestamp) {
    const deltaTime = (timestamp - lastTime) / 16.67;
    lastTime = timestamp;

    if (gameState === 'playing') {
        gameLogic(deltaTime);
    }
    render();

    animationFrameId = requestAnimationFrame(update);
}

// Start and replay handlers
startButton.addEventListener('click', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    resetGame();
    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        update(timestamp);
    });
});

replayButton.addEventListener('click', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    resetGame();
    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        update(timestamp);
    });
});

// Image loading
let imagesLoaded = 0;
const totalImages = 4;
function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        startButton.disabled = false;
        for (let i = 0; i < numStars; i++) {
            stars.push(createStar());
        }
    }
}

astronautOnImg.onload = () => { imagesLoaded++; checkImagesLoaded(); };
astronautOffImg.onload = () => { imagesLoaded++; checkImagesLoaded(); };
meteorGreenImg.onload = () => { imagesLoaded++; checkImagesLoaded(); };
meteorRedImg.onload = () => { imagesLoaded++; checkImagesLoaded(); };
