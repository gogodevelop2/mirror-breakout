// ============================================
// Mirror Breakout - 메인 진입점
// ============================================

import { CONFIG, TOTAL_BRICKS } from './config.js';
import { GameState } from './core/game.js';
import { Renderer } from './core/renderer.js';
import { checkPaddleCollision, checkBrickCollision, handleWallCollision } from './core/physics.js';
import { AISystem } from './systems/ai.js';

// ============================================
// 게임 클래스
// ============================================
class MirrorBreakout {
    constructor() {
        // 캔버스 설정
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;
        
        // 시스템 초기화
        this.renderer = new Renderer(this.canvas);
        this.gameState = new GameState();
        
        // 게임 엔티티
        this.balls = [];
        this.bricks = { player1: [], player2: [] };
        this.paddles = this.createPaddles();
        this.aiSystem = new AISystem(this.paddles.ai);
        
        // 효과
        this.splitEffect = null;
        this.brickSpawnEffects = [];
        
        // 그리드 시스템
        this.brickGrid = { player1: null, player2: null };
        
        // 입력 상태
        this.keys = {};
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기화
        this.initGame();
        this.draw();
    }
    
    // ============================================
    // 초기화 메서드들
    // ============================================
    createPaddles() {
        return {
            player: {
                x: 270,
                y: CONFIG.PADDLE.PLAYER.Y,
                width: CONFIG.PADDLE.WIDTH,
                height: CONFIG.PADDLE.HEIGHT,
                speed: 0,
                maxSpeed: CONFIG.PADDLE.PLAYER.MAX_SPEED,
                acceleration: CONFIG.PADDLE.PLAYER.ACCELERATION,
                friction: CONFIG.PADDLE.PLAYER.FRICTION,
                prevX: 270
            },
            ai: {
                x: 270,
                y: CONFIG.CANVAS.HEIGHT - CONFIG.PADDLE.AI.Y_OFFSET,
                width: CONFIG.PADDLE.WIDTH,
                height: CONFIG.PADDLE.HEIGHT,
                speed: 0,
                maxSpeed: CONFIG.PADDLE.AI.BASE_SPEED,
                acceleration: CONFIG.PADDLE.AI.BASE_ACCEL,
                friction: CONFIG.PADDLE.AI.FRICTION,
                prevX: 270,
                baseMaxSpeed: CONFIG.PADDLE.AI.BASE_SPEED,
                baseAcceleration: CONFIG.PADDLE.AI.BASE_ACCEL
            }
        };
    }
    
    initBrickGrid() {
        this.brickGrid.player1 = Array(CONFIG.BRICK.ROWS).fill()
            .map(() => Array(CONFIG.BRICK.COLS).fill(null));
        this.brickGrid.player2 = Array(CONFIG.BRICK.ROWS).fill()
            .map(() => Array(CONFIG.BRICK.COLS).fill(null));
    }
    
    generateRandomBrickPattern() {
        const pattern = [];
        
        for (let i = 0; i < CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS; i++) {
            pattern.push(Math.random() < CONFIG.BRICK.SPAWN_CHANCE);
        }
        
        // 최소 벽돌 수 보장
        const minBricks = Math.floor(TOTAL_BRICKS * CONFIG.BRICK.MIN_BRICKS_RATIO);
        const currentBricks = pattern.filter(Boolean).length;
        
        if (currentBricks < minBricks) {
            const emptyPositions = pattern.map((hasBrick, index) => 
                hasBrick ? -1 : index).filter(index => index !== -1);
            const needToAdd = minBricks - currentBricks;
            
            for (let i = 0; i < needToAdd && emptyPositions.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                const position = emptyPositions.splice(randomIndex, 1)[0];
                pattern[position] = true;
            }
        }
        
        return pattern;
    }
    
    createBricks(isPlayer1, pattern) {
        const baseHue = isPlayer1 ? CONFIG.COLORS.PLAYER.HUE_BASE : CONFIG.COLORS.AI.HUE_BASE;
        const newBricks = [];
        
        for (let i = 0; i < TOTAL_BRICKS; i++) {
            if (!pattern[i]) continue;
            
            const row = Math.floor(i / CONFIG.BRICK.COLS);
            const col = i % CONFIG.BRICK.COLS;
            
            const brick = {
                x: col * CONFIG.BRICK.SPACING_X + 15,
                y: isPlayer1
                    ? row * CONFIG.BRICK.SPACING_Y + 40
                    : this.canvas.height - (row * CONFIG.BRICK.SPACING_Y + 58),
                width: CONFIG.BRICK.WIDTH,
                height: CONFIG.BRICK.HEIGHT,
                color: `hsl(${baseHue + row * 10}, 70%, 50%)`
            };
            
            newBricks.push(brick);
            this.addBrickToGrid(brick, isPlayer1);
        }
        
        return newBricks;
    }
    
    initGame() {
        this.initBrickGrid();
        
        const brickPattern = this.generateRandomBrickPattern();
        
        this.bricks.player1 = this.createBricks(true, brickPattern);
        this.bricks.player2 = this.createBricks(false, brickPattern);
        
        this.balls = [
            { x: 300, y: 280, dx: 3, dy: -4, radius: CONFIG.BALL.RADIUS },
            { x: 300, y: 420, dx: -3, dy: 4, radius: CONFIG.BALL.RADIUS }
        ];
        
        this.splitEffect = null;
        this.brickSpawnEffects = [];
        
        this.gameState.reset();
        this.updateAIPaddleColor();
        
        this.paddles.ai.maxSpeed = CONFIG.PADDLE.AI.BASE_SPEED;
        this.paddles.ai.acceleration = CONFIG.PADDLE.AI.BASE_ACCEL;
    }
    
    // ============================================
    // 그리드 시스템
    // ============================================
    getBrickGridPosition(brick, isPlayer1) {
        const col = Math.round((brick.x - 15) / CONFIG.BRICK.SPACING_X);
        let row;
        if (isPlayer1) {
            row = Math.round((brick.y - 40) / CONFIG.BRICK.SPACING_Y);
        } else {
            row = Math.round((this.canvas.height - brick.y - 58) / CONFIG.BRICK.SPACING_Y);
        }
        return { row, col };
    }
    
    addBrickToGrid(brick, isPlayer1) {
        const { row, col } = this.getBrickGridPosition(brick, isPlayer1);
        if (row >= 0 && row < CONFIG.BRICK.ROWS && col >= 0 && col < CONFIG.BRICK.COLS) {
            const grid = isPlayer1 ? this.brickGrid.player1 : this.brickGrid.player2;
            grid[row][col] = brick;
        }
    }
    
    removeBrickFromGrid(brick, isPlayer1) {
        const { row, col } = this.getBrickGridPosition(brick, isPlayer1);
        if (row >= 0 && row < CONFIG.BRICK.ROWS && col >= 0 && col < CONFIG.BRICK.COLS) {
            const grid = isPlayer1 ? this.brickGrid.player1 : this.brickGrid.player2;
            grid[row][col] = null;
        }
    }
    
    // ============================================
    // 난이도 시스템
    // ============================================
    updateDynamicDifficulty() {
        const now = Date.now();
        if (now - this.gameState.lastDifficultyUpdate < CONFIG.DIFFICULTY.UPDATE_INTERVAL) return;
        
        this.gameState.lastDifficultyUpdate = now;
        
        const playerRemainingBricks = this.bricks.player1.length;
        const computerRemainingBricks = this.bricks.player2.length;
        const brickDiff = computerRemainingBricks - playerRemainingBricks;
        
        let targetMultiplier = 1.0;
        
        if (brickDiff > 0) {
            targetMultiplier = Math.min(
                CONFIG.DIFFICULTY.MAX_MULTIPLIER, 
                1.0 + (brickDiff * CONFIG.DIFFICULTY.BRICK_DIFF_FACTOR)
            );
        } else if (brickDiff < 0) {
            targetMultiplier = Math.max(
                CONFIG.DIFFICULTY.MIN_MULTIPLIER, 
                1.0 + (brickDiff * CONFIG.DIFFICULTY.BRICK_DIFF_FACTOR_NEGATIVE)
            );
        }
        
        const oldMultiplier = this.gameState.currentDifficultyMultiplier;
        this.gameState.currentDifficultyMultiplier = this.lerp(
            this.gameState.currentDifficultyMultiplier, 
            targetMultiplier, 
            CONFIG.DIFFICULTY.LERP_FACTOR
        );
        
        if (Math.abs(oldMultiplier - this.gameState.currentDifficultyMultiplier) > 0.01) {
            this.updateAIPaddleColor();
        }
        
        this.paddles.ai.maxSpeed = CONFIG.PADDLE.AI.BASE_SPEED * this.gameState.currentDifficultyMultiplier;
        this.paddles.ai.acceleration = CONFIG.PADDLE.AI.BASE_ACCEL * this.gameState.currentDifficultyMultiplier;
    }
    
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    updateAIPaddleColor() {
        const multiplier = this.gameState.currentDifficultyMultiplier;
        
        if (multiplier <= 0.6) {
            this.gameState.cachedAIColor = CONFIG.COLORS.AI.EASY;
        } else if (multiplier <= 1.0) {
            const t = (multiplier - 0.6) / 0.4;
            const red = Math.round(68 + (255 - 68) * t);
            const green = Math.round(136 * (1 - t * 0.5));
            const blue = Math.round(255 - (255 - 136) * t);
            this.gameState.cachedAIColor = `rgb(${red}, ${green}, ${blue})`;
        } else if (multiplier <= 1.5) {
            const t = (multiplier - 1.0) / 0.5;
            const red = 255;
            const green = Math.round(68 * (1 - t));
            const blue = Math.round(136 * (1 - t));
            this.gameState.cachedAIColor = `rgb(${red}, ${green}, ${blue})`;
        } else {
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            const red = Math.round(255 - 55 * t);
            this.gameState.cachedAIColor = `rgb(${red}, 0, 0)`;
        }
    }
    
    // ============================================
    // 게임 메카닉스
    // ============================================
    splitBall() {
        if(!this.gameState.canSplitBall() || this.balls.length === 0) return;

        const p1Broken = TOTAL_BRICKS - this.bricks.player1.length;
        const p2Broken = TOTAL_BRICKS - this.bricks.player2.length;
        const winningPlayer = p1Broken > p2Broken ? 'player1' : 'player2';
        
        const targetBall = this.balls.find(ball =>
            winningPlayer === 'player1' ? ball.y < this.canvas.height / 2 : ball.y > this.canvas.height / 2
        ) || this.balls[0];
        
        if(targetBall) {
            this.splitEffect = {
                x: targetBall.x,
                y: targetBall.y,
                radius: 0,
                opacity: 1,
                color: winningPlayer === 'player1' ? CONFIG.COLORS.PLAYER.PRIMARY : CONFIG.COLORS.AI.PRIMARY
            };
            
            this.balls.push({
                x: targetBall.x,
                y: targetBall.y,
                dx: -targetBall.dx * 1.2,
                dy: -targetBall.dy * 0.8,
                radius: CONFIG.BALL.RADIUS
            });
            
            this.gameState.setSplitDone();
        }
    }
    
    spawnNewBricks() {
        if (!this.gameState.canSpawnBricks()) return;
        
        this.gameState.updateBrickSpawn();
        
        // 빈 자리 찾기
        const emptyPositionsP1 = this.findEmptyPositions(true);
        const emptyPositionsP2 = this.findEmptyPositions(false);
        
        // 플레이어1 벽돌 생성
        if (emptyPositionsP1.length > 0) {
            const randomPos = emptyPositionsP1[Math.floor(Math.random() * emptyPositionsP1.length)];
            const newBrick = this.createSingleBrick(randomPos.row, randomPos.col, true);
            this.bricks.player1.push(newBrick);
            this.addBrickToGrid(newBrick, true);
            
            this.brickSpawnEffects.push({
                x: newBrick.x + newBrick.width / 2,
                y: newBrick.y + newBrick.height / 2,
                radius: 0,
                maxRadius: 30,
                opacity: 1,
                color: CONFIG.COLORS.PLAYER.PRIMARY
            });
        }
        
        // 플레이어2 벽돌 생성
        if (emptyPositionsP2.length > 0) {
            const randomPos = emptyPositionsP2[Math.floor(Math.random() * emptyPositionsP2.length)];
            const newBrick = this.createSingleBrick(randomPos.row, randomPos.col, false);
            this.bricks.player2.push(newBrick);
            this.addBrickToGrid(newBrick, false);
            
            this.brickSpawnEffects.push({
                x: newBrick.x + newBrick.width / 2,
                y: newBrick.y + newBrick.height / 2,
                radius: 0,
                maxRadius: 30,
                opacity: 1,
                color: CONFIG.COLORS.AI.PRIMARY
            });
        }
    }
    
    findEmptyPositions(isPlayer1) {
        const emptyPositions = [];
        const grid = isPlayer1 ? this.brickGrid.player1 : this.brickGrid.player2;
        
        for (let row = 0; row < CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK.COLS; col++) {
                if (grid[row][col] === null) {
                    emptyPositions.push({ row, col });
                }
            }
        }
        
        return emptyPositions;
    }
    
    createSingleBrick(row, col, isPlayer1) {
        const baseHue = isPlayer1 ? CONFIG.COLORS.PLAYER.HUE_BASE : CONFIG.COLORS.AI.HUE_BASE;
        const x = col * CONFIG.BRICK.SPACING_X + 15;
        const y = isPlayer1
            ? row * CONFIG.BRICK.SPACING_Y + 40
            : this.canvas.height - (row * CONFIG.BRICK.SPACING_Y + 58);
        
        return {
            x: x,
            y: y,
            width: CONFIG.BRICK.WIDTH,
            height: CONFIG.BRICK.HEIGHT,
            color: `hsl(${baseHue + row * 10}, 70%, 50%)`
        };
    }
    
    // ============================================
    // 충돌 처리
    // ============================================
    checkCollisions() {
        this.balls.forEach(ball => {
            // 벽 충돌
            handleWallCollision(ball, this.canvas.width, this.canvas.height);
            
            // 패들 충돌
            checkPaddleCollision(ball, this.paddles.player, true);
            checkPaddleCollision(ball, this.paddles.ai, false);
            
            // 벽돌 충돌
            [this.bricks.player1, this.bricks.player2].forEach((brickSet, index) => {
                for (let i = brickSet.length - 1; i >= 0; i--) {
                    const brick = brickSet[i];
                    if(checkBrickCollision(ball, brick)) {
                        this.removeBrickFromGrid(brick, index === 0);
                        brickSet.splice(i, 1);
                        ball.dy = -ball.dy;
                        
                        if (index === 0) {
                            this.gameState.computerScore++;
                        } else {
                            this.gameState.playerScore++;
                        }
                        break;
                    }
                }
            });
        });
    }
    
    // ============================================
    // 게임 제어
    // ============================================
    toggleGame() {
        if(this.gameState.running || this.gameState.over) {
            this.resetGame();
        } else {
            this.startGame();
        }
    }
    
    startGame() {
        this.initGame();
        this.gameState.startCountdown();
        this.countdownLoop();
    }
    
    resetGame() {
        this.initGame();
        this.draw();
    }
    
    countdownLoop() {
        const elapsed = Date.now() - this.gameState.countdownStartTime;
        const secondsElapsed = Math.floor(elapsed / 1000);
        
        if (secondsElapsed < 3) {
            this.gameState.countdown = 3 - secondsElapsed;
            this.draw();
            requestAnimationFrame(() => this.countdownLoop());
        } else if (secondsElapsed === 3) {
            this.gameState.countdown = 0;
            this.draw();
            setTimeout(() => {
                this.gameState.running = true;
                this.gameState.startTime = Date.now();
                this.gameLoop();
            }, CONFIG.GAMEPLAY.START_DELAY);
        }
    }
    
    checkGameEnd() {
        if(!this.gameState.running) return;

        const p1Count = this.bricks.player1.length;
        const p2Count = this.bricks.player2.length;

        if(p1Count === 0 || p2Count === 0) {
            this.gameState.setGameOver(p1Count === 0);
        }
    }
    
    // ============================================
    // 업데이트
    // ============================================
    update() {
        this.gameState.updateTime();
        this.updateDynamicDifficulty();
        this.spawnNewBricks();
        
        // 플레이어 입력 처리
        this.paddles.player.prevX = this.paddles.player.x;
        const direction = this.keys['ArrowLeft'] ? -1 : this.keys['ArrowRight'] ? 1 : 0;
        
        if(direction) {
            this.paddles.player.speed += direction * this.paddles.player.acceleration;
            this.paddles.player.speed = Math.max(
                -this.paddles.player.maxSpeed,
                Math.min(this.paddles.player.maxSpeed, this.paddles.player.speed)
            );
        } else {
            this.paddles.player.speed *= this.paddles.player.friction;
            if(Math.abs(this.paddles.player.speed) < 0.1) this.paddles.player.speed = 0;
        }
        
        this.paddles.player.x = Math.max(
            0, 
            Math.min(this.canvas.width - this.paddles.player.width, 
                     this.paddles.player.x + this.paddles.player.speed)
        );
        
        // AI 업데이트
        this.aiSystem.update(this.balls, this.gameState.currentDifficultyMultiplier);
        
        // 공 이동
        this.balls.forEach(ball => {
            ball.x += ball.dx;
            ball.y += ball.dy;
        });
        
        // 충돌 처리
        this.checkCollisions();
        
        // 공 분열
        this.splitBall();
        
        // 효과 업데이트
        if(this.splitEffect) {
            this.splitEffect.radius += 5;
            this.splitEffect.opacity -= 0.02;
            if(this.splitEffect.opacity <= 0) this.splitEffect = null;
        }
        
        this.brickSpawnEffects = this.brickSpawnEffects.filter(effect => {
            effect.radius += 2;
            effect.opacity -= 0.05;
            return effect.opacity > 0;
        });
        
        this.checkGameEnd();
    }
    
    // ============================================
    // 렌더링
    // ============================================
    draw() {
        this.renderer.setupRoundedClip();
        this.renderer.drawBackground();
        
        // 벽돌 그리기
        this.bricks.player1.forEach(brick => this.renderer.drawBrick(brick));
        this.bricks.player2.forEach(brick => this.renderer.drawBrick(brick));
        
        // 패들 그리기
        this.renderer.drawRoundedPaddle(this.paddles.player, CONFIG.COLORS.PLAYER.PRIMARY);
        this.renderer.drawRoundedPaddle(this.paddles.ai, this.gameState.cachedAIColor);
        
        // 공 그리기
        this.balls.forEach(ball => this.renderer.drawBall(ball));
        
        // 효과 그리기
        if(this.splitEffect) {
            this.renderer.drawSplitEffect(this.splitEffect);
        }
        
        this.brickSpawnEffects.forEach(effect => this.renderer.drawSpawnEffect(effect));
        
        // UI 그리기
        this.renderer.drawUI(this.gameState, this.gameState.cachedAIColor);
        
        // 특수 화면 그리기
        if(this.gameState.countdown > 0) {
            this.renderer.drawCountdown(this.gameState.countdown, this.gameState.countdownStartTime);
        } else if(this.gameState.countdown === 0 && !this.gameState.running && 
                  !this.gameState.over && this.gameState.countdownStartTime > 0) {
            this.renderer.drawStartMessage();
        }
        
        if(this.gameState.over) {
            this.renderer.drawGameOver(this.gameState.playerWon);
        }
        
        this.renderer.restore();
    }
    
    // ============================================
    // 게임 루프
    // ============================================
    gameLoop() {
        if(this.gameState.running) {
            this.update();
        }
        
        this.draw();
        
        if(this.gameState.running) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    // ============================================
    // 이벤트 리스너
    // ============================================
    setupEventListeners() {
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        document.getElementById('toggleBtn').addEventListener('click', () => this.toggleGame());
    }
}

// ============================================
// 게임 시작
// ============================================
const game = new MirrorBreakout();
