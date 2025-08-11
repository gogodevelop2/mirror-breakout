// ============================================
// 렌더링 엔진
// ============================================

import { CONFIG } from '../config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    // 둥근 모서리 클리핑 설정
    setupRoundedClip() {
        this.ctx.save();
        this.ctx.beginPath();
        const r = CONFIG.CANVAS.CORNER_RADIUS;
        this.ctx.moveTo(r, 0);
        this.ctx.arcTo(this.canvas.width, 0, this.canvas.width, r, r);
        this.ctx.arcTo(this.canvas.width, this.canvas.height, this.canvas.width - r, this.canvas.height, r);
        this.ctx.arcTo(0, this.canvas.height, 0, this.canvas.height - r, r);
        this.ctx.arcTo(0, 0, r, 0, r);
        this.ctx.closePath();
        this.ctx.clip();
    }
    
    // 배경 그리기
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, CONFIG.COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, CONFIG.COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 중앙 효과
        const waveGradient = this.ctx.createLinearGradient(
            0, this.canvas.height/2 - 30, 
            0, this.canvas.height/2 + 30
        );
        waveGradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
        waveGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
        waveGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        this.ctx.fillStyle = waveGradient;
        this.ctx.fillRect(0, this.canvas.height/2 - 30, this.canvas.width, 60);
    }
    
    // 벽돌 그리기
    drawBrick(brick) {
        this.ctx.fillStyle = brick.color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    }
    
    // 둥근 패들 그리기
    drawRoundedPaddle(paddle, color) {
        const radius = paddle.height / 2;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(paddle.x + radius, paddle.y + radius, radius, Math.PI * 0.5, Math.PI * 1.5);
        this.ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
        this.ctx.arc(paddle.x + paddle.width - radius, paddle.y + radius, radius, Math.PI * 1.5, Math.PI * 0.5);
        this.ctx.fill();
        
        // 그라데이션 효과
        const gradient = this.ctx.createLinearGradient(
            paddle.x, paddle.y, 
            paddle.x, paddle.y + paddle.height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    // 공 그리기
    drawBall(ball) {
        // 공 본체
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        
        // 글로우 효과
        const glow = this.ctx.createRadialGradient(
            ball.x, ball.y, 0, 
            ball.x, ball.y, 20
        );
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 분열 효과 그리기
    drawSplitEffect(effect) {
        [1, 0.7, 1.3].forEach((scale, i) => {
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = 3 - i;
            this.ctx.globalAlpha = effect.opacity * (1 - i * 0.3);
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius * scale, 0, Math.PI * 2);
            this.ctx.stroke();
        });
        this.ctx.globalAlpha = 1;
    }
    
    // 스폰 효과 그리기
    drawSpawnEffect(effect) {
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = effect.opacity;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    // UI 텍스트 그리기
    drawUI(game, aiColor) {
        // 플레이어 라벨
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = CONFIG.COLORS.PLAYER.PRIMARY;
        this.ctx.fillText('PLAYER (You)', 20, 30);
        
        // AI 라벨
        this.ctx.fillStyle = aiColor;
        this.ctx.fillText('COMPUTER', 20, this.canvas.height - 10);
        
        // 시간 표시
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#fff';
        const minutes = Math.floor(game.time / 60);
        const seconds = game.time % 60;
        this.ctx.fillText(
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 
            this.canvas.width - 100, 30
        );
    }
    
    // 카운트다운 그리기
    drawCountdown(countdown, countdownStartTime) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = 'bold 120px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const scale = Math.sin((Date.now() - countdownStartTime) % 1000 / 1000 * Math.PI) * 0.2 + 1;
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale, scale);
        this.ctx.fillText(countdown.toString(), 0, 0);
        this.ctx.restore();
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    // START 메시지 그리기
    drawStartMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = 'bold 80px Arial';
        this.ctx.fillStyle = '#4af';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const glow = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 100
        );
        glow.addColorStop(0, '#4af');
        glow.addColorStop(1, 'rgba(68, 170, 255, 0.3)');
        this.ctx.fillStyle = glow;
        this.ctx.fillText('START!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    // 게임 오버 그리기
    drawGameOver(playerWon) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = 'bold 60px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        this.ctx.font = 'bold 36px Arial';
        this.ctx.fillStyle = playerWon ? '#4af' : '#f44';
        this.ctx.fillText(
            playerWon ? 'YOU WIN' : 'YOU LOSE', 
            this.canvas.width / 2, this.canvas.height / 2 + 20
        );
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    // 복원
    restore() {
        this.ctx.restore();
    }
}
