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

        // AI Controller
        this.aiController = new AIController(CONFIG);

        // Entity references
        this.paddleIds = {
            player: null,
            ai: null
        };
        
        // Paddle velocity tracking (for acceleration system)
        this.paddleVelocity = {
            player: 0,
            ai: 0
        };
        
        // Effects
        this.effects = {
            splitEffect: null,
            spawnEffects: []
        };

        // Input (managed by GameScene)
        this.keys = {};

        // Timers for cleanup
        this.timers = [];
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
        
        // Reset paddle velocities
        this.paddleVelocity.player = 0;
        this.paddleVelocity.ai = 0;

        // Clear effects
        this.effects.splitEffect = null;
        this.effects.spawnEffects = [];
        
        // Create game entities
        this.createPaddles();
        this.createInitialBalls();
        this.createInitialBricks();

        // Initialize AI Controller
        this.aiController.reset();
    }
    
    // Create paddles
    createPaddles() {
        // Player paddle at top (화면 상단)
        this.paddleIds.player = this.physics.createPaddle(
            CONFIG.PADDLE.START_X,
            CONFIG.PADDLE.PLAYER_Y,
            true
        );
        
        // AI paddle at bottom (화면 하단)
        this.paddleIds.ai = this.physics.createPaddle(
            CONFIG.PADDLE.START_X,
            CONFIG.PADDLE.AI_Y,
            false
        );
    }
    
    // Create initial balls with random launch angles
    createInitialBalls() {
        // Ball 1 - Player 영역에서 시작, 위로(AI를 향해) 발사
        const ball1 = Utils.getRandomLaunchVelocity(2.1, -2.8);
        this.physics.createBall(
            3.0,      // 300px / 100
            2.8,      // 280px / 100 (Player 영역)
            ball1.vx, // Random angle variation
            ball1.vy  // Random angle variation
        );

        // Ball 2 - AI 영역에서 시작, 아래로(Player를 향해) 발사
        const ball2 = Utils.getRandomLaunchVelocity(-2.1, 2.8);
        this.physics.createBall(
            3.0,      // 300px / 100
            4.2,      // 420px / 100 (AI 영역)
            ball2.vx, // Random angle variation
            ball2.vy  // Random angle variation
        );
    }
    
    // Create initial bricks (상하 대칭 구조)
    createInitialBricks() {
        const pattern = this.generateRandomPattern();

        // 벽돌 그룹 전체 너비 계산
        const totalBricksWidth = CONFIG.BRICK.COLS * CONFIG.BRICK.WIDTH +
                                 (CONFIG.BRICK.COLS - 1) * CONFIG.BRICK.GAP_X;
        // 중앙 정렬을 위한 시작 X 위치
        const startX = (CONFIG.WORLD_WIDTH - totalBricksWidth) / 2;

        let playerBrickCount = 0;
        let aiBrickCount = 0;

        for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
                const index = row * CONFIG.BRICK.COLS + col;
                if (!pattern[index]) continue;

                // Calculate x position (centered)
                const x = startX + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X) + CONFIG.BRICK.WIDTH/2;

                // Player가 깨야 할 벽돌 (위쪽) - playerTargetBricks
                const topY = CONFIG.BRICK.PLAYER_BRICKS_Y + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2;
                this.physics.createBrick(x, topY, row, col, true);  // isPlayerTarget = true
                playerBrickCount++;

                // AI가 깨야 할 벽돌 (아래쪽) - aiTargetBricks
                const bottomY = CONFIG.BRICK.AI_BRICKS_Y - row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2;
                this.physics.createBrick(x, bottomY, row, col, false);  // isPlayerTarget = false
                aiBrickCount++;
            }
        }

        console.log(`[Init] Created ${playerBrickCount} player bricks, ${aiBrickCount} AI bricks`);
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
    
    // Update player input (with acceleration system)
    updatePlayerInput() {
        let targetVelocity = 0;
        
        // Get input direction
        if (Input.isKeyDown('ArrowLeft')) {
            targetVelocity = -CONFIG.PADDLE.PLAYER_SPEED;
        } else if (Input.isKeyDown('ArrowRight')) {
            targetVelocity = CONFIG.PADDLE.PLAYER_SPEED;
        }
        
        // Apply acceleration/friction
        if (targetVelocity !== 0) {
            // Accelerate toward target velocity
            const diff = targetVelocity - this.paddleVelocity.player;
            const accelAmount = Math.sign(diff) * CONFIG.PADDLE.ACCELERATION;
            
            // Apply acceleration but don't overshoot
            if (Math.abs(diff) < CONFIG.PADDLE.ACCELERATION) {
                this.paddleVelocity.player = targetVelocity;
            } else {
                this.paddleVelocity.player += accelAmount;
            }
        } else {
            // Apply friction when no input
            this.paddleVelocity.player *= CONFIG.PADDLE.FRICTION;
            
            // Stop completely when very slow
            if (Math.abs(this.paddleVelocity.player) < 0.1) {
                this.paddleVelocity.player = 0;
            }
        }
        
        // Clamp to max speed
        this.paddleVelocity.player = Utils.clampSymmetric(
            this.paddleVelocity.player,
            CONFIG.PADDLE.PLAYER_SPEED
        );
        
        // Apply velocity to paddle
        this.physics.movePaddle(this.paddleIds.player, this.paddleVelocity.player);
    }
    
    // Update AI (AI는 아래쪽에 있으므로 위에서 내려오는 공에 반응)
    updateAI() {
        const velocity = this.aiController.update(this.physics, this.paddleIds.ai);
        this.paddleVelocity.ai = velocity;
        this.physics.movePaddle(this.paddleIds.ai, velocity);
    }
    
    // Process collision events
    processCollisions(collisions) {
        collisions.forEach(collision => {
            if (collision.type === 'brickHit') {
                // 점수 계산 수정:
                // Player가 깨야 할 벽돌(isPlayerTarget=true)을 깨면 Player 점수
                // AI가 깨야 할 벽돌(isPlayerTarget=false)을 깨면 AI 점수
                if (collision.isPlayerTarget) {
                    // Player가 깨야 할 벽돌을 깼음
                    this.score.player++;
                } else {
                    // AI가 깨야 할 벽돌을 깼음
                    this.score.ai++;
                }

                // Mark brick for destruction (iOS-style fade out)
                const brick = this.physics.getEntity(collision.brickId);
                if (brick && !brick.destroying) {
                    brick.destroying = true;
                    brick.destroyAlpha = CONFIG.BRICK.DESTROY_ALPHA;
                    brick.destroyStartTime = Date.now();

                    // Schedule removal after delay
                    const timerId = setTimeout(() => {
                        this.physics.removeEntity(collision.brickId);
                    }, CONFIG.BRICK.DESTROY_DELAY * 1000);
                    this.timers.push(timerId);
                }
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
        
        // Count remaining bricks
        const playerBricks = this.physics.getEntitiesOfType('playerBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiBrick').length;
        const totalBricks = CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS;
        
        // Calculate who is winning (less bricks = winning)
        const playerBroken = totalBricks - playerBricks;
        const aiBroken = totalBricks - aiBricks;
        const isPlayerWinning = playerBroken > aiBroken;
        
        // Find appropriate ball to split (우세한 쪽 영역의 공)
        const targetBall = balls.find(ball => {
            const pos = ball.body.getPosition();
            if (isPlayerWinning) {
                return pos.y < CONFIG.WORLD_HEIGHT / 2;  // Player 영역 (위쪽)
            } else {
                return pos.y > CONFIG.WORLD_HEIGHT / 2;  // AI 영역 (아래쪽)
            }
        }) || balls[0];
        
        const pos = targetBall.body.getPosition();
        const vel = targetBall.body.getLinearVelocity();
        
        // Add split effect
        this.effects.splitEffect = {
            x: pos.x,
            y: pos.y,
            radius: 0,
            opacity: 1,
            color: isPlayerWinning ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.AI_BASE
        };
        
        // Create new ball with modified velocity (slower)
        this.physics.createBall(
            pos.x,
            pos.y,
            -vel.x * 0.8,  // 80% of original velocity
            -vel.y * 0.6   // 60% of original velocity
        );
        
        this.state.ballSplitDone = true;
    }
    
    // Check for brick spawning
    checkBrickSpawn() {
        if (this.state.gameTime < CONFIG.GAME.SPAWN_INTERVAL) return;
        
        const timeSinceLastSpawn = this.state.gameTime - this.state.lastBrickSpawnTime;
        if (timeSinceLastSpawn < CONFIG.GAME.SPAWN_INTERVAL) return;
        
        this.state.lastBrickSpawnTime = this.state.gameTime;
        
        // Try to spawn one brick for each side
        this.trySpawnBrick(true);   // Player side
        this.trySpawnBrick(false);  // AI side
    }
    
    // Try to spawn a single brick
    trySpawnBrick(isPlayerTarget) {
        // Check if we have room (max 60 bricks per side)
        const existingBricks = this.physics.getEntitiesOfType(isPlayerTarget ? 'playerTargetBrick' : 'aiTargetBrick');
        const maxBricks = CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS;
        if (existingBricks.length >= maxBricks) return;
        
        // 벽돌 그룹 전체 너비 계산
        const totalBricksWidth = CONFIG.BRICK.COLS * CONFIG.BRICK.WIDTH +
                                 (CONFIG.BRICK.COLS - 1) * CONFIG.BRICK.GAP_X;
        // 중앙 정렬을 위한 시작 X 위치
        const startX = (CONFIG.WORLD_WIDTH - totalBricksWidth) / 2;
        
        // Find empty position
        const emptyPositions = [];
        
        for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
                const x = startX + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP_X) + CONFIG.BRICK.WIDTH/2;
                const y = isPlayerTarget
                    ? CONFIG.BRICK.PLAYER_BRICKS_Y + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2
                    : CONFIG.BRICK.AI_BRICKS_Y - row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP_Y) + CONFIG.BRICK.HEIGHT/2;
                
                // Check if position is occupied
                let occupied = false;
                existingBricks.forEach(brick => {
                    const brickPos = brick.body.getPosition();
                    if (Math.abs(brickPos.x - x) < CONFIG.BRICK.WIDTH * 0.5 &&
                        Math.abs(brickPos.y - y) < CONFIG.BRICK.HEIGHT * 0.5) {
                        occupied = true;
                    }
                });
                
                if (!occupied) {
                    emptyPositions.push({ x, y, row, col });
                }
            }
        }
        
        if (emptyPositions.length > 0) {
            const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            this.physics.createBrick(pos.x, pos.y, pos.row, pos.col, isPlayerTarget);
            
            // Add spawn effect
            this.effects.spawnEffects.push({
                x: pos.x,
                y: pos.y,
                radius: 0,
                maxRadius: 0.3,  // in meters
                opacity: 1,
                color: isPlayerTarget ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.AI_BASE
            });
        }
    }
    
    // Update difficulty based on brick difference
    updateDifficulty() {
        const playerBricks = this.physics.getEntitiesOfType('playerTargetBrick').length;
        const aiBricks = this.physics.getEntitiesOfType('aiTargetBrick').length;
        this.aiController.updateDifficulty(playerBricks, aiBricks);
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
    
    // Check game over
    checkGameOver() {
        const playerTargetBricks = this.physics.getEntitiesOfType('playerTargetBrick').length;
        const aiTargetBricks = this.physics.getEntitiesOfType('aiTargetBrick').length;

        if (playerTargetBricks === 0 || aiTargetBricks === 0) {
            console.log(`[GameOver] Player bricks: ${playerTargetBricks}, AI bricks: ${aiTargetBricks}`);
            this.state.phase = 'over';
            // Player wins if all player target bricks are destroyed
            this.state.playerWon = (playerTargetBricks === 0);
        }
    }
    
    // Get formatted time string
    getTimeString() {
        const minutes = Math.floor(this.state.gameTime / 60);
        const seconds = Math.floor(this.state.gameTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // AI 색상 접근을 위한 getter
    get aiColor() {
        return this.aiController.color;
    }

    // AI 난이도 접근을 위한 getter
    get aiDifficulty() {
        return this.aiController.difficulty;
    }
}
