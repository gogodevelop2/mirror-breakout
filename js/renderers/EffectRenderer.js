// EffectRenderer.js의 drawMetallicBall 메서드 개선 버전
// 실제 쇠구슬처럼 보이도록 다층 렌더링 적용

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
