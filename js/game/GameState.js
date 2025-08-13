// js/game/GameState.js

class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        // 게임 상태
        this.running = false;
        this.over = false;
        this.playerWon = false;
        
        // 시간 관련
        this.startTime = 0;
        this.time = 0;
        this.countdown = 0;
        this.countdownStartTime = 0;
        
        // 점수
        this.playerScore = 0;
        this.computerScore = 0;
        
        // 게임 이벤트 플래그
        this.ballSplitDone = false;
        this.lastBrickSpawn = 0;
        
        // 난이도 관련
        this.lastDifficultyUpdate = 0;
        this.currentDifficultyMultiplier = 1.0;
        this.cachedAIColor = COLORS.PLAYER2.PADDLE_BASE;
        
        // 게임 엔티티
        this.balls = [];
        this.bricks = { player1: [], player2: [] };
        this.paddles = this.createPaddles();
        
        // 시각 효과
        this.splitEffect = null;
        this.brickSpawnEffects = [];
    }
    
    createPaddles() {
        return {
            player1: this.createPaddle(
                CONFIG.PLAYER1_PADDLE_Y, 
                CONFIG.PADDLE_MAX_SPEED, 
                CONFIG.PADDLE_ACCELERATION, 
                CONFIG.PADDLE_FRICTION
            ),
            player2: this.createPaddle(
                CONFIG.PLAYER2_PADDLE_Y, 
                CONFIG.BASE_AI_SPEED, 
                CONFIG.BASE_AI_ACCEL, 
                CONFIG.AI_FRICTION
            )
        };
    }
    
    createPaddle(y, maxSpeed, accel, friction) {
        return {
            x: 270,
            y: y,
            width: CONFIG.PADDLE_WIDTH,
            height: CONFIG.PADDLE_HEIGHT,
            speed: 0,
            maxSpeed: maxSpeed,
            acceleration: accel,
            friction: friction,
            prevX: 270,
            baseMaxSpeed: maxSpeed,
            baseAcceleration: accel
        };
    }
    
    initBalls() {
        this.balls = [
            { 
                x: 300, 
                y: 280, 
                dx: 3, 
                dy: -4, 
                radius: CONFIG.BALL_RADIUS 
            },
            { 
                x: 300, 
                y: 420, 
                dx: -3, 
                dy: 4, 
                radius: CONFIG.BALL_RADIUS 
            }
        ];
    }
    
    startCountdown() {
        this.countdown = CONFIG.COUNTDOWN_DURATION;
        this.countdownStartTime = Date.now();
    }
    
    updateTime() {
        if (this.running) {
            this.time = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }
    
    getTimeString() {
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    checkGameEnd() {
        if (!this.running) return;
        
        const p1Count = this.bricks.player1.length;
        const p2Count = this.bricks.player2.length;
        
        if (p1Count === 0 || p2Count === 0) {
            this.running = false;
            this.over = true;
            this.playerWon = p1Count === 0;
        }
    }
}

// 전역 게임 상태 인스턴스
const gameState = new GameState();
