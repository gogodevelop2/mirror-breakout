// js/game/GameLogic.js

class GameLogic {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);
    }
    
    // 게임 초기화
    initGame() {
        // 벽돌 초기화 (BrickManager에 위임)
        brickManager.initializeBricks(gameState);
        
        // 공 초기화
        gameState.initBalls();
        
        // 효과 초기화
        gameState.splitEffect = null;
        gameState.brickSpawnEffects = [];
        
        // 점수 초기화
        gameState.playerScore = 0;
        gameState.computerScore = 0;
        
        // AI 초기화
        aiSystem.init();
    }
    
    // 게임 업데이트
    update() {
        if (!gameState.running) return;
        
        // 시간 업데이트
        gameState.updateTime();
        
        // 동적 난이도 조정
        aiSystem.updateDifficulty();
        
        // 새 벽돌 생성 체크 (BrickManager에 위임)
        brickManager.checkBrickSpawn(gameState);
        
        // 플레이어 입력 처리
        this.updatePlayerPaddle();
        
        // AI 업데이트
        aiSystem.update(gameState.paddles.player2, gameState.balls);
        
        // 물리 업데이트
        physicsSystem.update();
        
        // 공 분열 체크
        this.checkBallSplit();
        
        // 효과 업데이트
        this.updateEffects();
        
        // 게임 종료 체크
        gameState.checkGameEnd();
    }
    
    // 플레이어 패들 업데이트
    updatePlayerPaddle() {
        const paddle = gameState.paddles.player1;
        
        // 이전 위치 저장 (물리 계산용)
        physicsSystem.updatePaddleHistory(paddle);
        
        // 입력 처리
        const direction = this.keys['ArrowLeft'] ? -1 : this.keys['ArrowRight'] ? 1 : 0;
        
        if (direction) {
            paddle.speed = Math.max(-paddle.maxSpeed, 
                Math.min(paddle.maxSpeed, paddle.speed + direction * paddle.acceleration));
        } else {
            paddle.speed *= paddle.friction;
            if (Math.abs(paddle.speed) < 0.1) paddle.speed = 0;
        }
        
        // 위치 업데이트
        paddle.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH - paddle.width, paddle.x + paddle.speed));
    }
    
    // 공 분열 체크
    checkBallSplit() {
        if (gameState.ballSplitDone || gameState.time < CONFIG.SPLIT_TIME || gameState.balls.length === 0) {
            return;
        }
        
        const totalBricks = CONFIG.BRICK_ROWS * CONFIG.BRICK_COLS;
        const p1Broken = totalBricks - gameState.bricks.player1.length;
        const p2Broken = totalBricks - gameState.bricks.player2.length;
        const winningPlayer = p1Broken > p2Broken ? 'player1' : 'player2';
        
        const targetBall = gameState.balls.find(ball => 
            winningPlayer === 'player1' ? ball.y < CONFIG.CANVAS_HEIGHT / 2 : ball.y > CONFIG.CANVAS_HEIGHT / 2
        ) || gameState.balls[0];
        
        if (targetBall) {
            // 분열 효과 생성
            gameState.splitEffect = {
                x: targetBall.x,
                y: targetBall.y,
                radius: 0,
                opacity: 1,
                color: winningPlayer === 'player1' ? COLORS.PLAYER1.EFFECT : COLORS.PLAYER2.EFFECT
            };
            
            // 새 공 추가
            gameState.balls.push({
                x: targetBall.x,
                y: targetBall.y,
                dx: -targetBall.dx * 1.2,
                dy: -targetBall.dy * 0.8,
                radius: CONFIG.BALL_RADIUS
            });
            
            gameState.ballSplitDone = true;
        }
    }
    
    // 효과 업데이트
    updateEffects() {
        // 분열 효과 업데이트
        if (gameState.splitEffect) {
            gameState.splitEffect.radius += 5;
            gameState.splitEffect.opacity -= 0.02;
            if (gameState.splitEffect.opacity <= 0) {
                gameState.splitEffect = null;
            }
        }
        
        // 벽돌 스폰 효과 업데이트
        gameState.brickSpawnEffects = gameState.brickSpawnEffects.filter(effect => {
            effect.radius += 2;
            effect.opacity -= 0.05;
            return effect.opacity > 0;
        });
    }
    
    // 카운트다운 업데이트
    updateCountdown() {
        const elapsed = Date.now() - gameState.countdownStartTime;
        const secondsElapsed = Math.floor(elapsed / 1000);
        
        if (secondsElapsed < CONFIG.COUNTDOWN_DURATION) {
            gameState.countdown = CONFIG.COUNTDOWN_DURATION - secondsElapsed;
            return false; // 아직 카운트다운 중
        } else if (secondsElapsed === CONFIG.COUNTDOWN_DURATION) {
            gameState.countdown = 0;
            return false; // START! 표시 중
        } else {
            return true; // 카운트다운 완료
        }
    }
}

// 전역 게임 로직 인스턴스
const gameLogic = new GameLogic();
