// js/renderers/EffectRenderer.js

class EffectRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    // 석재 질감 벽돌 그리기
    drawStoneBrick(brick) {
        const ctx = this.ctx;
        
        // 그림자
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 베이스 색상
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // 그림자 끄기 (텍스처에는 불필요)
        ctx.shadowColor = 'transparent';
        
        // 석재 텍스처 효과 (거친 표면)
        this.addStoneTexture(brick);
        
        // 가장자리 음영 (입체감)
        this.addBrickShading(brick);
        
        // 테두리
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        ctx.restore();
    }
    
    // 석재 텍스처 추가
    addStoneTexture(brick) {
        const ctx = this.ctx;
        
        // 노이즈 패턴 (어두운 점)
        for(let i = 0; i < 15; i++) {
            const x = brick.x + Math.random() * brick.width;
            const y = brick.y + Math.random() * brick.height;
            const size = Math.random() * 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`;
            ctx.fillRect(x, y, size, size);
        }
        
        // 밝은 입자 (석재 반짝임)
        for(let i = 0; i < 5; i++) {
            const x = brick.x + Math.random() * brick.width;
            const y = brick.y + Math.random() * brick.height;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    // 벽돌 음영 추가
    addBrickShading(brick) {
        const ctx = this.ctx;
        const edgeGradient = ctx.createLinearGradient(
            brick.x, brick.y,
            brick.x, brick.y + brick.height
        );
        edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        edgeGradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.1)');
        edgeGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.1)');
        edgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = edgeGradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }
    
    // 금속 패들 그리기
    drawMetallicPaddle(paddle, baseColor) {
        const ctx = this.ctx;
        const radius = paddle.height / 2;
        
        ctx.save();
        
        // 충돌 진동 효과
        this.applyShakeEffect(paddle);
        
        // 그림자
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // 패들 경로 생성
        this.createPaddlePath(paddle, radius);
        
        // 금속 베이스 레이어
        this.fillMetallicBase(paddle, baseColor);
        
        // 그림자 끄기
        ctx.shadowColor = 'transparent';
        
        // 광택 레이어들
        this.addPaddleShine(paddle, radius);
        
        ctx.restore();
    }
    
    // 패들 진동 효과
    applyShakeEffect(paddle) {
        if (paddle.shakeAmount && paddle.shakeAmount > 0.1) {
            const shakeX = (Math.random() - 0.5) * paddle.shakeAmount;
            const shakeY = (Math.random() - 0.5) * paddle.shakeAmount * 0.5;
            this.ctx.translate(shakeX, shakeY);
            paddle.shakeAmount *= 0.85;
        }
    }
    
    // 패들 경로 생성
    createPaddlePath(paddle, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(paddle.x + radius, paddle.y + radius, radius, Math.PI * 0.5, Math.PI * 1.5);
        ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
        ctx.arc(paddle.x + paddle.width - radius, paddle.y + radius, radius, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath();
    }
    
    // 금속 베이스 채우기
    fillMetallicBase(paddle, baseColor) {
        const ctx = this.ctx;
        const baseGradient = ctx.createLinearGradient(
            paddle.x, paddle.y,
            paddle.x, paddle.y + paddle.height
        );
        const rgb = this.hexToRgb(baseColor);
        baseGradient.addColorStop(0, `rgb(${rgb.r * 0.8}, ${rgb.g * 0.8}, ${rgb.b * 0.8})`);
        baseGradient.addColorStop(0.5, baseColor);
        baseGradient.addColorStop(1, `rgb(${rgb.r * 0.6}, ${rgb.g * 0.6}, ${rgb.b * 0.6})`);
        ctx.fillStyle = baseGradient;
        ctx.fill();
    }
    
    // 패들 광택 추가
    addPaddleShine(paddle, radius) {
        const ctx = this.ctx;
        
        // 상단 하이라이트
        const shineGradient = ctx.createLinearGradient(
            paddle.x, paddle.y,
            paddle.x, paddle.y + paddle.height * 0.4
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGradient;
        ctx.fill();
        
        // 중앙 반사광
        const centerShine = ctx.createRadialGradient(
            paddle.x + paddle.width/2, paddle.y + radius * 0.3,
            0,
            paddle.x + paddle.width/2, paddle.y + radius * 0.3,
            paddle.width * 0.3
        );
        centerShine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        centerShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        centerShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = centerShine;
        ctx.fill();
        
        // 엣지 하이라이트
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
    
    // 금속 공 그리기
    drawMetallicBall(ball) {
        const ctx = this.ctx;
        
        // 그림자
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // 금속 구체 그라데이션
        this.fillMetallicSphere(ball);
        
        // 그림자 끄기
        ctx.shadowColor = 'transparent';
        
        // 반사광 하이라이트
        this.addBallHighlight(ball);
        
        // 글로우 효과
        this.addBallGlow(ball);
        
        ctx.restore();
    }
    
    // 금속 구체 채우기
    fillMetallicSphere(ball) {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#e0e0e0');
        gradient.addColorStop(0.6, '#a0a0a0');
        gradient.addColorStop(1, '#606060');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    // 공 하이라이트
    addBallHighlight(ball) {
        const ctx = this.ctx;
        const highlight = ctx.createRadialGradient(
            ball.x - ball.radius * 0.4, ball.y - ball.radius * 0.4,
            0,
            ball.x - ball.radius * 0.4, ball.y - ball.radius * 0.4,
            ball.radius * 0.5
        );
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = highlight;
        ctx.fill();
    }
    
    // 공 글로우
    addBallGlow(ball) {
        const ctx = this.ctx;
        const glow = ctx.createRadialGradient(
            ball.x, ball.y, ball.radius,
            ball.x, ball.y, ball.radius * 2.5
        );
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 유틸리티: HEX to RGB
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}
