// js/systems/AISystem.js

class AISystem {
    constructor() {
        this.lastDifficultyUpdate = 0;
    }
    
    // AI 패들 업데이트
    update(paddle, balls) {
        // AI는 위로 올라오는 공(dy < 0)에만 반응
        // player2는 화면 상단에 있으므로 아래에서 올라오는 공만 신경씀
        const targetBall = balls
            .filter(ball => ball.dy < 0)  // 위쪽으로 움직이는 공만
            .sort((a, b) => Math.abs(a.y - paddle.y) - Math.abs(b.y - paddle.y))[0];
        
        if (targetBall) {
            const diff = targetBall.x - (paddle.x + paddle.width / 2);
            const direction = Math.sign(diff);
            
            // 난이도에 따라 반응 속도 조절
            const reactionThreshold = 5 / gameState.currentDifficultyMultiplier;
            
            if (Math.abs(diff) > reactionThreshold) {
                paddle.speed += direction * paddle.acceleration;
                paddle.speed = Math.max(-paddle.maxSpeed, Math.min(paddle.maxSpeed, paddle.speed));
            }
        }
        
        // 마찰 적용
        paddle.speed *= paddle.friction;
        paddle.prevX = paddle.x;
        paddle.x = Math.max(0, Math.min(CONFIG.CANVAS_WIDTH - paddle.width, paddle.x + paddle.speed));
    }
    
    // 동적 난이도 조절
    updateDifficulty() {
        const now = Date.now();
        if (now - gameState.lastDifficultyUpdate < CONFIG.DIFFICULTY_UPDATE_INTERVAL) return;
        
        gameState.lastDifficultyUpdate = now;
        
        // 남은 벽돌 개수로 승부 상황 판단
        const playerRemainingBricks = gameState.bricks.player1.length;
        const computerRemainingBricks = gameState.bricks.player2.length;
        
        const brickDiff = computerRemainingBricks - playerRemainingBricks;
        
        let targetMultiplier = 1.0;
        
        // 컴퓨터가 지고 있으면 난이도 상승
        if (brickDiff > 0) {
            targetMultiplier = Math.min(CONFIG.MAX_AI_MULTIPLIER, 1.0 + (brickDiff * 0.08));
        }
        // 컴퓨터가 이기고 있으면 난이도 하락
        else if (brickDiff < 0) {
            targetMultiplier = Math.max(CONFIG.MIN_AI_MULTIPLIER, 1.0 + (brickDiff * 0.06));
        }
        
        // 부드러운 전환을 위한 lerp
        const oldMultiplier = gameState.currentDifficultyMultiplier;
        gameState.currentDifficultyMultiplier = this.lerp(
            gameState.currentDifficultyMultiplier,
            targetMultiplier,
            CONFIG.DIFFICULTY_LERP_FACTOR
        );
        
        // 난이도가 변경된 경우에만 AI 설정 업데이트
        if (Math.abs(oldMultiplier - gameState.currentDifficultyMultiplier) > 0.01) {
            this.updateAIPaddleSettings();
            this.updateAIPaddleColor();
        }
    }
    
    // AI 패들 설정 업데이트
    updateAIPaddleSettings() {
        const paddle = gameState.paddles.player2;
        paddle.maxSpeed = CONFIG.BASE_AI_SPEED * gameState.currentDifficultyMultiplier;
        paddle.acceleration = CONFIG.BASE_AI_ACCEL * gameState.currentDifficultyMultiplier;
    }
    
    // AI 패들 색상 업데이트 (난이도 시각화)
    updateAIPaddleColor() {
        const multiplier = gameState.currentDifficultyMultiplier;
        
        if (multiplier <= 0.6) {
            // 매우 쉬움 - 파란색
            gameState.cachedAIColor = '#4488ff';
        } else if (multiplier <= 1.0) {
            // 쉬움에서 보통 - 파란색에서 분홍색으로 전환
            const t = (multiplier - 0.6) / 0.4;
            const red = Math.round(68 + (255 - 68) * t);
            const green = Math.round(136 * (1 - t * 0.5));
            const blue = Math.round(255 - (255 - 136) * t);
            gameState.cachedAIColor = `rgb(${red}, ${green}, ${blue})`;
        } else if (multiplier <= 1.5) {
            // 보통에서 어려움 - 분홍색에서 빨간색으로 전환
            const t = (multiplier - 1.0) / 0.5;
            const red = 255;
            const green = Math.round(68 * (1 - t));
            const blue = Math.round(136 * (1 - t));
            gameState.cachedAIColor = `rgb(${red}, ${green}, ${blue})`;
        } else {
            // 매우 어려움 - 진한 빨간색
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            const red = Math.round(255 - 55 * t);
            const green = 0;
            const blue = 0;
            gameState.cachedAIColor = `rgb(${red}, ${green}, ${blue})`;
        }
    }
    
    // 선형 보간
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // 초기화
    init() {
        gameState.currentDifficultyMultiplier = 1.0;
        gameState.lastDifficultyUpdate = 0;
        this.updateAIPaddleSettings();
        this.updateAIPaddleColor();
    }
}

// 전역 AI 시스템 인스턴스
const aiSystem = new AISystem();
