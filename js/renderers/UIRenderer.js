// js/renderers/UIRenderer.js

class UIRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    // 메인 UI 그리기
    drawUI(gameState) {
        this.drawLabels(gameState);
        this.drawTime(gameState);
        
        // 카운트다운
        if (gameState.countdown > 0 ||
            (gameState.countdown === 0 && !gameState.running && !gameState.over && gameState.countdownStartTime > 0)) {
            this.drawCountdown(gameState);
        }
        
        // 게임 오버
        if (gameState.over) {
            this.drawGameOver(gameState);
        }
    }
    
    // 플레이어 라벨
    drawLabels(gameState) {
        const ctx = this.ctx;
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = COLORS.PLAYER1.PADDLE;
        ctx.fillText('PLAYER (You)', 20, 30);
        
        ctx.fillStyle = gameState.cachedAIColor;
        ctx.fillText('COMPUTER', 20, CONFIG.CANVAS_HEIGHT - 10);
    }
    
    // 시간 표시
    drawTime(gameState) {
        const ctx = this.ctx;
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Time: ${gameState.getTimeString()}`, CONFIG.CANVAS_WIDTH - 100, 30);
    }
    
    // 카운트다운 그리기
    drawCountdown(gameState) {
        const ctx = this.ctx;
        
        // 배경 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 텍스트 설정
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const elapsed = Date.now() - gameState.countdownStartTime;
        const scale = Math.sin(elapsed % 1000 / 1000 * Math.PI) * 0.2 + 1;
        
        ctx.save();
        ctx.translate(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        ctx.scale(scale, scale);
        
        if (gameState.countdown > 0) {
            // 숫자 카운트다운
            this.drawCountdownNumber(gameState.countdown);
        } else {
            // START! 텍스트
            this.drawStartText();
        }
        
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
    
    // 카운트다운 숫자
    drawCountdownNumber(number) {
        const ctx = this.ctx;
        
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(number.toString(), 0, 0);
        
        // 숫자 글로우
        ctx.strokeStyle = 'rgba(68, 170, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(number.toString(), 0, 0);
    }
    
    // START 텍스트
    drawStartText() {
        const ctx = this.ctx;
        
        ctx.font = 'bold 80px Arial';
        
        // 글로우 효과
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        glow.addColorStop(0, '#4af');
        glow.addColorStop(1, 'rgba(68, 170, 255, 0.3)');
        ctx.fillStyle = glow;
        ctx.fillText('START!', 0, 0);
        
        // 아웃라인
        ctx.strokeStyle = '#4af';
        ctx.lineWidth = 2;
        ctx.strokeText('START!', 0, 0);
    }
    
    // 게임 오버 화면
    drawGameOver(gameState) {
        const ctx = this.ctx;
        
        // 배경 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // GAME OVER 텍스트
        this.drawGameOverTitle();
        
        // 결과 텍스트
        this.drawGameResult(gameState.playerWon);
        
        // 점수 표시
        this.drawFinalScore(gameState);
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
    
    // 게임 오버 타이틀
    drawGameOverTitle() {
        const ctx = this.ctx;
        
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
        
        // 그림자 효과
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.strokeText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
    }
    
    // 게임 결과 - 단순화된 버전
    drawGameResult(playerWon) {
        const ctx = this.ctx;
        
        ctx.font = 'bold 36px Arial';
        const resultText = playerWon ? 'YOU WIN' : 'YOU LOSE';
        
        // 단순 색상 사용 (그라데이션 제거)
        ctx.fillStyle = playerWon ? '#44aaff' : '#ff4444';
        ctx.fillText(resultText, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        
        // 글로우 효과 (shadowBlur 사용)
        ctx.save();
        ctx.shadowColor = playerWon ? '#44aaff' : '#ff4444';
        ctx.shadowBlur = 20;
        ctx.fillText(resultText, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        ctx.restore();
    }
    
    // 최종 점수
    drawFinalScore(gameState) {
        const ctx = this.ctx;
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        
        const scoreText = `Player: ${gameState.playerScore} | Computer: ${gameState.computerScore}`;
        ctx.fillText(scoreText, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 50);
    }
}
