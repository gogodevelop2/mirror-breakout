// js/renderers/EffectRenderer.js

class EffectRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    // 향상된 금속 공 그리기
    drawMetallicBall(ball) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // 1. 깊은 그림자 (공이 떠있는 느낌)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = ball.radius * 1.5;
        ctx.shadowOffsetX = ball.radius * 0.3;
        ctx.shadowOffsetY = ball.radius * 0.3;
        
        // 2. 베이스 금속 구체 (어두운 크롬)
        const baseGradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3,
            ball.y - ball.radius * 0.3,
            0,
            ball.x,
            ball.y,
            ball.radius * 1.1
        );
        
        // 금속 질감을 위한 더 복잡한 그라데이션
        baseGradient.addColorStop(0, '#ffffff');
        baseGradient.addColorStop(0.1, '#f0f0f0');
        baseGradient.addColorStop(0.2, '#d0d0d0');
        baseGradient.addColorStop(0.3, '#b0b0b0');
        baseGradient.addColorStop(0.4, '#909090');
        baseGradient.addColorStop(0.5, '#707070');
        baseGradient.addColorStop(0.6, '#505050');
        baseGradient.addColorStop(0.7, '#404040');
        baseGradient.addColorStop(0.85, '#303030');
        baseGradient.addColorStop(1, '#202020');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = baseGradient;
        ctx.fill();
        
        // 그림자 끄기
        ctx.shadowColor = 'transparent';
        
        // 3. 주변광 반사 (환경 반사)
        const ambientGradient = ctx.createRadialGradient(
            ball.x + ball.radius * 0.2,
            ball.y + ball.radius * 0.2,
            0,
            ball.x,
            ball.y,
            ball.radius
        );
        ambientGradient.addColorStop(0, 'rgba(100, 150, 200, 0.3)');
        ambientGradient.addColorStop(0.5, 'rgba(100, 150, 200, 0.1)');
        ambientGradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ambientGradient;
        ctx.fill();
        
        // 4. 주 하이라이트 (강한 반사광)
        const primaryHighlight = ctx.createRadialGradient(
            ball.x - ball.radius * 0.4,
            ball.y - ball.radius * 0.4,
            0,
            ball.x - ball.radius * 0.4,
            ball.y - ball.radius * 0.4,
            ball.radius * 0.4
        );
        primaryHighlight.addColorStop(0, 'rgba(255, 255, 255, 1)');
        primaryHighlight.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        primaryHighlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
        primaryHighlight.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
        primaryHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = primaryHighlight;
        ctx.fill();
        
        // 5. 보조 하이라이트 (부드러운 반사)
        const secondaryHighlight = ctx.createRadialGradient(
            ball.x + ball.radius * 0.3,
            ball.y - ball.radius * 0.2,
            0,
            ball.x + ball.radius * 0.3,
            ball.y - ball.radius * 0.2,
            ball.radius * 0.2
        );
        secondaryHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        secondaryHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        secondaryHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = secondaryHighlight;
        ctx.fill();
        
        // 6. 림 라이트 (가장자리 광택)
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // 7. 반사 스펙 (작은 밝은 점들)
        for(let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + Math.PI / 6;
            const specX = ball.x + Math.cos(angle) * ball.radius * 0.5;
            const specY = ball.y + Math.sin(angle) * ball.radius * 0.5;
            
            const specGradient = ctx.createRadialGradient(
                specX, specY, 0,
                specX, specY, ball.radius * 0.1
            );
            specGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            specGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = specGradient;
            ctx.beginPath();
            ctx.arc(specX, specY, ball.radius * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 8. 움직임 기반 블러 (선택적 - 빠른 움직임 시)
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > 7) {
            ctx.globalAlpha = 0.3;
            const blurOffset = 2;
            for(let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(
                    ball.x - ball.dx * i * blurOffset,
                    ball.y - ball.dy * i * blurOffset,
                    ball.radius * (1 - i * 0.1),
                    0, Math.PI * 2
                );
                ctx.fillStyle = '#808080';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
        // 9. 외부 글로우 (부드러운 발광)
        const outerGlow = ctx.createRadialGradient(
            ball.x, ball.y, ball.radius,
            ball.x, ball.y, ball.radius * 2
        );
        outerGlow.addColorStop(0, 'rgba(200, 220, 255, 0.2)');
        outerGlow.addColorStop(0.5, 'rgba(200, 220, 255, 0.05)');
        outerGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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
    
    // 유틸리티: HEX to RGB
    hexToRgb(hex) {
        // rgb() 형식 처리
        if (hex.startsWith('rgb')) {
            const matches = hex.match(/\d+/g);
            if (matches) {
                return {
                    r: parseInt(matches[0]),
                    g: parseInt(matches[1]),
                    b: parseInt(matches[2])
                };
            }
        }
        
        // hex 형식 처리
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
