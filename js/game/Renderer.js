// js/game/Renderer.js

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = window.devicePixelRatio || 2;
        this.setupHighResolution();
        
        // 서브 렌더러들
        this.effectRenderer = new EffectRenderer(ctx);
        this.uiRenderer = new UIRenderer(ctx);
    }
    
    // 고해상도 캔버스 설정
    setupHighResolution() {
        this.canvas.width = CONFIG.CANVAS_WIDTH * this.dpr;
        this.canvas.height = CONFIG.CANVAS_HEIGHT * this.dpr;
        this.canvas.style.width = CONFIG.CANVAS_WIDTH + 'px';
        this.canvas.style.height = CONFIG.CANVAS_HEIGHT + 'px';
        this.ctx.scale(this.dpr, this.dpr);
        
        // 안티앨리어싱
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    // 메인 렌더링
    render() {
        this.setupRoundedClip();
        this.drawBackground();
        this.drawGameElements();
        this.drawEffects();
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
