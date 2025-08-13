// js/game/Renderer.js

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 실제 디바이스 픽셀 비율 감지
        this.dpr = window.devicePixelRatio || 1;
        
        // 고성능 모드에서는 2배까지만 제한 (성능 고려)
        this.dpr = Math.min(this.dpr, 2);
        
        this.setupHighResolution();
        
        // 서브 렌더러들
        this.effectRenderer = new EffectRenderer(ctx);
        this.uiRenderer = new UIRenderer(ctx);
    }
    
    // 고해상도 캔버스 설정
    setupHighResolution() {
        // CSS 크기 저장
        const cssWidth = CONFIG.CANVAS_WIDTH;
        const cssHeight = CONFIG.CANVAS_HEIGHT;
        
        // 실제 캔버스 크기를 DPR에 맞게 설정
        this.canvas.width = cssWidth * this.dpr;
        this.canvas.height = cssHeight * this.dpr;
        
        // CSS 크기는 원래대로 유지 (화면에 표시되는 크기)
        this.canvas.style.width = cssWidth + 'px';
        this.canvas.style.height = cssHeight + 'px';
        
        // 컨텍스트 스케일 조정 (고해상도 렌더링)
        this.ctx.scale(this.dpr, this.dpr);
        
        // 렌더링 품질 설정
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // 선명한 렌더링을 위한 추가 설정
        if (this.ctx.filter !== undefined) {
            // 약간의 샤프닝 필터 (지원하는 브라우저에서만)
            this.ctx.filter = 'contrast(1.05) brightness(1.02)';
        }
        
        // 렌더링 힌트 설정
        this.canvas.style.imageRendering = 'high-quality';
        this.canvas.style.imageRendering = 'crisp-edges';
        this.canvas.style.imageRendering = '-webkit-optimize-contrast';
    }
    
    // 메인 렌더링
    render() {
        // 이전 프레임 완전히 지우기
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.setupRoundedClip();
        this.drawBackground();
        
        // 서브픽셀 렌더링을 위한 변환 매트릭스 조정
        this.ctx.save();
        this.ctx.translate(0.5, 0.5); // 서브픽셀 정렬
        
        this.drawGameElements();
        this.drawEffects();
        
        this.ctx.restore();
        
        this.uiRenderer.drawUI(gameState);
        this.ctx.restore();
    }
    
    // 둥근 모서리 클리핑
    setupRoundedClip() {
        this.ctx.save();
        this.ctx.beginPath();
        const r = CONFIG.CORNER_RADIUS;
        this.ctx.moveTo(r, 0);
        this.ctx.arcTo(CONFIG.CANVAS_WIDTH, 0, CONFIG.CANVAS_WIDTH, r, r);
        this.ctx.arcTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH - r, CONFIG.CANVAS_HEIGHT, r);
        this.ctx.arcTo(0, CONFIG.CANVAS_HEIGHT, 0, CONFIG.CANVAS_HEIGHT - r, r);
        this.ctx.arcTo(0, 0, r, 0, r);
        this.ctx.closePath();
        this.ctx.clip();
    }
    
    // 배경 그리기
    drawBackground() {
        // 깊이감 있는 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, COLORS.BACKGROUND.TOP);
        gradient.addColorStop(0.5, COLORS.BACKGROUND.MIDDLE);
        gradient.addColorStop(1, COLORS.BACKGROUND.BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 중앙 웨이브 효과
        const waveGradient = this.ctx.createLinearGradient(
            0, CONFIG.CANVAS_HEIGHT/2 - 30,
            0, CONFIG.CANVAS_HEIGHT/2 + 30
        );
        waveGradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
        waveGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
        waveGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        this.ctx.fillStyle = waveGradient;
        this.ctx.fillRect(0, CONFIG.CANVAS_HEIGHT/2 - 30, CONFIG.CANVAS_WIDTH, 60);
    }
    
    // 게임 요소들 그리기
    drawGameElements() {
        // 벽돌
        [gameState.bricks.player1, gameState.bricks.player2].forEach(brickSet => {
            brickSet.forEach(brick => {
                this.effectRenderer.drawStoneBrick(brick);
            });
        });
        
        // 패들
        this.effectRenderer.drawMetallicPaddle(
            gameState.paddles.player1,
            COLORS.PLAYER1.PADDLE
        );
        this.effectRenderer.drawMetallicPaddle(
            gameState.paddles.player2,
            gameState.cachedAIColor
        );
        
        // 공
        gameState.balls.forEach(ball => {
            this.effectRenderer.drawMetallicBall(ball);
        });
    }
    
    // 이펙트 그리기
    drawEffects() {
        // 분열 효과
        if (gameState.splitEffect) {
            this.drawSplitEffect(gameState.splitEffect);
        }
        
        // 벽돌 스폰 효과
        gameState.brickSpawnEffects.forEach(effect => {
            this.drawSpawnEffect(effect);
        });
    }
    
    // 분열 효과
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
    
    // 스폰 효과
    drawSpawnEffect(effect) {
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = effect.opacity;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
}

// 전역 렌더러는 main.js에서 생성
