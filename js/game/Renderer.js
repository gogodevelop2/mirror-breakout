// Renderer.js의 setupHighResolution 메서드 개선 버전
// 실제로 작동하는 고해상도 렌더링 설정

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
    
    // 메인 렌더링 (개선된 안티앨리어싱)
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
}
