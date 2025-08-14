// js/game.js
// Mirror Breakout - Game Logic

class GameManager {
    constructor(physics) {
        this.physics = physics;
        
        // Game state
        this.state = {
            phase: 'menu',  // menu, countdown, playing, paused, over
            playerWon: false,
            countdown: 0,
            countdownStartTime: 0,
            gameStartTime: 0,
            gameTime: 0,
            lastBrickSpawnTime: 0,
            ballSplitDone: false
        };
        
        // Scores
        this.score = {
            player: 0,
            ai: 0
        };
        
        // AI
        this.ai = {
            difficulty: 1.0,
            color: CONFIG.COLORS.AI_BASE,
            targetBallId: null
        };
        
        // Entity references
        this.paddleIds = {
            player: null,
            ai: null
        };
        
        // Effects
        this.effects = {
            splitEffect: null,
            spawnEffects: []
        };
        
        // Input
        this.keys = {};
        this.setupInput();
    }
    
    // Setup keyboard input
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    // Initialize new game
    init() {
        // Reset physics world
        this.physics.clear();
        this.physics.init();
        
        // Reset state
        this.state.phase = 'menu';
        this.state.playerWon = false;
        this.state.gameTime = 0;
        this.state.lastBrickSpawnTime = 0;
        this.state.ballSplitDone = false;
        
        // Reset scores
        this.score.player = 0;
        this.score.ai = 0;
        
        // Reset AI
        this.ai.difficulty = 1.0;
        this.ai.color = CONFIG.COLORS.AI_BASE;
        this.ai.targetBallId = null;
        
        // Clear effects
        this.effects.splitEffect = null;
        this.effects.spawnEffects = [];
        
        // Create game entities
        this.createPaddles();
        this.createInitialBalls();
        this.createInitialBricks();
    }
    
    // Create paddles
    createPaddles() {
        // Player paddle at bottom
        this.paddleIds.player = this.physics.createPaddle(
            CONFIG.PADDLE.START_X,
            CONFIG.PADDLE.PLAYER_Y,
            true
        );
        
        // AI paddle at top
        this.paddleIds.ai = this.physics.createPaddle(
            CONFIG.PADDLE.START_X,
            CONFIG.PADDLE.AI_Y,
            false
        );
    }
    
    // Create initial balls
    createInitialBalls() {
        // Ball 1 - starts in player area, moves up
        this.physics.createBall(
            CONFIG.WORLD_WIDTH / 2 - 0.5,
            CONFIG.WORLD_HEIGHT / 2 + 1,
            3,   // vx in m/s
            -4   // vy in m/s (upward)
        );
        
        // Ball 2 - starts in AI area, moves down
        this.physics.createBall(
            CONFIG.WORLD_WIDTH / 2 + 0.5,
            CONFIG.WORLD_HEIGHT / 2 - 1,
            -3,  // vx in m/s
            4    // vy in m/s (downward)
        );
    }
    
    // Create initial bricks
    createInitialBricks() {
        const pattern = this.generateRandomPattern();
        
        for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
                const index = row * CONFIG.BRICK.COLS + col;
                if (!pattern[index]) continue;
                
                // Calculate position
                const x = CONFIG.BRICK.OFFSET_X + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X);
                
                // Player bricks (bottom area)
                const playerY = CONFIG.BRICK.PLAYER_OFFSET_Y + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y);
                this.physics.createBrick(x, playerY, row, col, true);
                
                // AI bricks (top area - mirrored)
                const aiY = CONFIG.BRICK.AI_OFFSET_Y - row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y);
                this.physics.createBrick(x, aiY, row, col, false);
            }
        }
    }
    
    // Generate random brick pattern
    generateRandomPattern() {
        const totalSlots = CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS;
        const pattern = new Array(totalSlots);
        
        // Fill randomly
        for (let i = 0; i < totalSlots; i++) {
            pattern[i] = Math.random() < CONFIG.GAME.INITIAL_COVERAGE;
        }
        
        // Ensure minimum coverage
        const minBricks = Math.floor(totalSlots * CONFIG.GAME.MIN_COVERAGE);
        const currentBricks = pattern.filter(b => b).length;
        
        if (currentBricks < minBricks) {
            const emptySlots = [];
            pattern.forEach((filled, i) => {
                if (!filled) emptySlots.push(i);
            });
            
            // Randomly fill empty slots until minimum is met
            const toAdd = minBricks - currentBricks;
            for (let i = 0; i < toAdd && emptySlots.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptySlots.length);
                const slotIndex = emptySlots.splice(randomIndex, 1)[0];
                pattern[slotIndex] = true;
            }
        }
        
        return pattern;
    }
    
    // Start countdown
    startCountdown() {
        this.state.phase = 'countdown';
        this.state.countdown = CONFIG.GAME.COUNTDOWN;
        this.state.countdownStartTime = Date.now();
    }
    
    // Update countdown
    updateCountdown() {
        if (this.state.phase !== 'countdown') return false;
        
        const elapsed = (Date.now() - this.state.countdownStartTime) / 1000;
        this.state.countdown = Math.max(0, CONFIG.GAME.COUNTDOWN - Math.floor(elapsed));
        
        // Start game when countdown ends
        if (elapsed >= CONFIG.GAME.COUNTDOWN + 0.5) {
            this.startGame();
            return true;
        }
        
        return false;
    }
    
    // Start game
    startGame() {
        this.state.phase = 'playing';
        this.state.gameStartTime = Date.now();
        this.state.gameTime = 0;
    }
    
    // Main update
    update(deltaTime) {
        if (this.state.phase !== 'playing') return;
        
        // Update game time
        this.state.gameTime = (Date.now() - this.state.gameStartTime) / 1000;
        
        // Update player input
        this.updatePlayerInput();
        
        // Update AI
        this.updateAI();
        
        // Physics step
        const collisions = this.physics.step();
        
        // Process collisions
        this.processCollisions(collisions);
        
        // Game events
        this.checkBallSplit();
        this.checkBrickSpawn();
        
        // Update difficulty
        this.updateDifficulty();
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Check game over
        this.checkGameOver();
    }
    
    // Update player input
    updatePlayerInput() {
        let velocity = 0;
        
        if (this.keys['ArrowLeft']) {
            velocity = -CONFIG.PADDLE.PLAYER_SPEED;
        } else if (this.keys['ArrowRight']) {
            velocity = CONFIG.PADDLE.PLAYER_SPEED;
        }
        
        this.physics.movePaddle(this.paddleIds.player, velocity);
    }
    
    // Update AI
    updateAI() {
        const balls = this.physics.getEntitiesOfType('ball');
        if (balls.length === 0) {
            this.physics.movePaddle(this.paddleIds.ai, 0);
            return;
        }
        
        // Find closest ball moving upward (toward AI)
        let targetBall = null;
        let minDistance = Infinity;
        
        const aiPaddle = this.physics.getEntity(this.paddleIds.ai);
        const aiPos = aiPaddle.body.getPosition();
        
        balls.forEach(ball => {
            const ballVel = ball.body.getLinearVelocity();
            if (ballVel.y < 0) {  // Moving upward
                const ballPos = ball.body.getPosition();
                const distance = Math.abs(ballPos.y - aiPos.y);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    targetBall = ball;
                }
            }
        });
        
        if (targetBall) {
            const ballX = targetBall.body.getPosition().x;
            const paddleX = aiPos.x;
            const diff = ballX - paddleX;
            
            // Apply difficulty multiplier
            const maxSpeed = CONFIG.PADDLE.AI_BASE_SPEED * this.ai.difficulty;
            const velocity = Math.sign(diff) * Math.min(Math.abs(diff) * 8, maxSpeed);
            
            this.physics.movePaddle(this.paddleIds.ai, velocity);
        } else {
            // No threatening ball, stay in center
            const centerX = CONFIG.WORLD_WIDTH / 2;
            const paddleX = aiPos.x;
            const diff = centerX - paddleX;
            const velocity = Math.sign(diff) * Math.min(Math.abs(diff) * 4, CONFIG.PADDLE.AI_BASE_SPEED);
            
            this.physics.movePaddle(this.paddleIds.ai, velocity);
        }
    }
    
    // Process collision events
    processCollisions(collisions) {
        collisions.forEach(collision => {
            if (collision.type === 'brickHit') {
                // Update score first (before removing)
                if (collision.isPlayerBrick) {
                    this.score.ai++;
                } else {
                    this.score.player++;
                }
                
                // Remove brick (after score update)
                this.physics.removeEntity(collision.brickId);
            }
        });
    }
    
    // Check for ball split at 10 seconds
    checkBallSplit() {
        if (this.state.ballSplitDone || this.state.gameTime < CONFIG.GAME.SPLIT_TIME) {
            return;
        }
        
        const balls = this.physics.getEntitiesOfType('ball');
        if (balls.length === 0) return;
        
        // Choose ball to split (first one)
        const ball = balls[0];
        const pos = ball.body.getPosition();
        const vel = ball.body.getLinearVelocity();
        
        // Determine which side is winning
        const playerBricks = this.physics.getEntitiesOfType('playerBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiBrick').length;
        const isPlayerWinning = playerBricks < aiBricks;
        
        // Add split effect
        this.effects.splitEffect = {
            x: pos.x,
            y: pos.y,
            radius: 0,
            opacity: 1,
            color: isPlayerWinning ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.AI_BASE
        };
        
        // Create new ball with opposite velocity
        this.physics.createBall(
            pos.x,
            pos.y,
            -vel.x * 1.2,
            -vel.y * 0.8
        );
        
        this.state.ballSplitDone = true;
    }
    
    // Check for brick spawning
    checkBrickSpawn() {
        if (this.state.gameTime < CONFIG.GAME.SPAWN_INTERVAL) return;
        
        const timeSinceLastSpawn = this.state.gameTime - this.state.lastBrickSpawnTime;
        if (timeSinceLastSpawn < CONFIG.GAME.SPAWN_INTERVAL) return;
        
        this.state.lastBrickSpawnTime = this.state.gameTime;
        
        // Try to spawn a few bricks
        for (let i = 0; i < 2; i++) {
            this.trySpawnBrick(true);   // Player side
            this.trySpawnBrick(false);  // AI side
        }
    }
    
    // Try to spawn a single brick
    trySpawnBrick(isPlayerSide) {
        // Check if we have room
        const existingBricks = this.physics.getEntitiesOfType(isPlayerSide ? 'playerBrick' : 'aiBrick');
        if (existingBricks.length >= 30) return;
        
        // Find empty position
        const row = Math.floor(Math.random() * CONFIG.BRICK.ROWS);
        const col = Math.floor(Math.random() * CONFIG.BRICK.COLS);
        
        const x = CONFIG.BRICK.OFFSET_X + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X);
        const y = isPlayerSide
            ? CONFIG.BRICK.PLAYER_OFFSET_Y + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y)
            : CONFIG.BRICK.AI_OFFSET_Y - row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y);
        
        // Check if position is occupied
        let occupied = false;
        existingBricks.forEach(brick => {
            const brickPos = brick.body.getPosition();
            if (Math.abs(brickPos.x - x) < CONFIG.BRICK.WIDTH * 0.9 &&
                Math.abs(brickPos.y - y) < CONFIG.BRICK.HEIGHT * 0.9) {
                occupied = true;
            }
        });
        
        if (!occupied) {
            this.physics.createBrick(x, y, row, col, isPlayerSide);
            
            // Add spawn effect
            this.effects.spawnEffects.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 0.3,  // in meters
                opacity: 1,
                color: isPlayerSide ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.AI_BASE
            });
        }
    }
    
    // Update difficulty based on brick difference
    updateDifficulty() {
        const playerBricks = this.physics.getEntitiesOfType('playerBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiBrick').length;
        const diff = aiBricks - playerBricks;
        
        if (diff > 0) {
            // AI is losing, increase difficulty
            this.ai.difficulty = Math.min(
                CONFIG.DIFFICULTY.MAX,
                1.0 + diff * CONFIG.DIFFICULTY.INCREASE_RATE
            );
        } else if (diff < 0) {
            // AI is winning, decrease difficulty
            this.ai.difficulty = Math.max(
                CONFIG.DIFFICULTY.MIN,
                1.0 + diff * CONFIG.DIFFICULTY.DECREASE_RATE
            );
        } else {
            this.ai.difficulty = 1.0;
        }
        
        // Update AI paddle color
        this.ai.color = Utils.getAIDifficultyColor(this.ai.difficulty);
    }
    
    // Update visual effects
    updateEffects(deltaTime) {
        // Split effect
        if (this.effects.splitEffect) {
            this.effects.splitEffect.radius += 0.05;
            this.effects.splitEffect.opacity -= 0.02;
            
            if (this.effects.splitEffect.opacity <= 0) {
                this.effects.splitEffect = null;
            }
        }
        
        // Spawn effects
        this.effects.spawnEffects = this.effects.spawnEffects.filter(effect => {
            effect.radius += 0.02;
            effect.opacity -= 0.05;
            return effect.opacity > 0;
        });
    }
    
    // Add brick destroy effect
    addBrickDestroyEffect(x, y, isPlayerBrick) {
        // Optional: Add particle effects here
    }
    
    // Check game over
    checkGameOver() {
        const playerBricks = this.physics.getEntitiesOfType('playerBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiBrick').length;
        
        if (playerBricks === 0 || aiBricks === 0) {
            this.state.phase = 'over';
            this.state.playerWon = (playerBricks === 0);
        }
    }
    
    // Get formatted time string
    getTimeString() {
        const minutes = Math.floor(this.state.gameTime / 60);
        const seconds = Math.floor(this.state.gameTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
