export class Ball {
    constructor(scene, x, y, dx, dy) {
        this.scene = scene;
        this.config = scene.game.config.game;
        
        // 위치와 속도
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = this.config.BALL_RADIUS;
        
        // 그래픽 객체 생성
        this.graphics = null;
        this.glowGraphics = null;
        this.createGraphics();
        
        // 물리 바디 (추후 Phaser Matter.js 사용시)
        this.physicsBody = null;
        
        // 상태
        this.active = true;
        this.trailPositions = []; // 궤적 효과용
        this.maxTrailLength = 10;
        
        // 효과
        this.glowIntensity = 1.0;
        this.glowPulse = 0;
    }

    createGraphics() {
        // 메인 공 그래픽
        this.graphics = this.scene.add.circle(this.x, this.y, this.radius, 0xffffff);
        
        // 글로우 효과
        this.glowGraphics = this.scene.add.circle(this.x, this.y, this.radius * 2.5, 0xffffff, 0.3);
        this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);
        
        // 렌더 순서 설정
        this.scene.children.bringToTop(this.graphics);
    }

    update() {
        if (!this.active) return;
        
        // 위치 업데이트
        this.x += this.dx;
        this.y += this.dy;
        
        // 그래픽 위치 동기화
        this.updateGraphics();
        
        // 궤적 업데이트
        this.updateTrail();
        
        // 글로우 효과 업데이트
        this.updateGlowEffect();
        
        // 경계 체크 (벽 충돌은 CollisionSystem에서 처리)
        this.checkBounds();
    }

    updateGraphics() {
        if (this.graphics) {
            this.graphics.setPosition(this.x, this.y);
        }
        
        if (this.glowGraphics) {
            this.glowGraphics.setPosition(this.x, this.y);
        }
    }

    updateTrail() {
        // 현재 위치를 궤적에 추가
        this.trailPositions.push({ x: this.x, y: this.y, timestamp: Date.now() });
        
        // 오래된 궤적 제거
        const currentTime = Date.now();
        this.trailPositions = this.trailPositions.filter(pos => 
            currentTime - pos.timestamp < 200 && this.trailPositions.length <= this.maxTrailLength
        );
    }

    updateGlowEffect() {
        // 글로우 펄스 효과
        this.glowPulse += 0.1;
        const pulseValue = Math.sin(this.glowPulse) * 0.1 + 0.9;
        
        if (this.glowGraphics) {
            this.glowGraphics.setAlpha(0.3 * pulseValue * this.glowIntensity);
            
            // 속도에 따른 글로우 크기 조정
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            const glowScale = Math.min(2.5, 1.5 + speed * 0.1);
            this.glowGraphics.setScale(glowScale);
        }
    }

    checkBounds() {
        const { width, height } = this.scene.cameras.main;
        
        // 화면 밖으로 나갔는지 확인 (디버깅용)
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            console.warn('Ball went out of bounds:', { x: this.x, y: this.y });
        }
    }

    setVelocity(dx, dy) {
        this.dx = dx;
        this.dy = dy;
    }

    getVelocity() {
        return { x: this.dx, y: this.dy };
    }

    getSpeed() {
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateGraphics();
    }

    // 충돌 감지용 경계 상자
    getBounds() {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius,
            centerX: this.x,
            centerY: this.y,
            radius: this.radius
        };
    }

    // 효과 메서드들
    setGlowIntensity(intensity) {
        this.glowIntensity = Math.max(0, Math.min(1, intensity));
    }

    flash(duration = 200) {
        // 플래시 효과
        if (this.graphics) {
            this.scene.tweens.add({
                targets: this.graphics,
                alpha: 0.3,
                duration: duration / 2,
                yoyo: true,
                ease: 'Power2'
            });
        }
    }

    // 공 분열 효과
    split(newDx, newDy) {
        // 새로운 공 생성 (씬에서 처리)
        const newBall = new Ball(this.scene, this.x, this.y, newDx, newDy);
        
        // 분열 이펙트
        this.createSplitEffect();
        
        return newBall;
    }

    createSplitEffect() {
        // 간단한 분열 효과 (ParticleEffects에서 더 정교하게 처리)
        if (this.scene.particleEffects) {
            this.scene.particleEffects.createSplitEffect(this.x, this.y, '#ffffff');
        }
    }

    // 궤적 렌더링 (디버그/효과용)
    renderTrail(graphics) {
        if (this.trailPositions.length < 2) return;
        
        graphics.clear();
        graphics.lineStyle(2, 0xffffff, 0.5);
        
        graphics.beginPath();
        graphics.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const alpha = i / this.trailPositions.length; // 점점 희미해짐
            graphics.lineStyle(2 * alpha, 0xffffff, 0.5 * alpha);
            graphics.lineTo(pos.x, pos.y);
        }
        
        graphics.strokePath();
    }

    destroy() {
        this.active = false;
        
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        
        if (this.glowGraphics) {
            this.glowGraphics.destroy();
            this.glowGraphics = null;
        }
        
        // 물리 바디 제거 (있다면)
        if (this.physicsBody && this.scene.matter) {
            this.scene.matter.world.remove(this.physicsBody);
            this.physicsBody = null;
        }
        
        this.trailPositions = [];
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            velocity: { x: this.dx, y: this.dy },
            speed: this.getSpeed().toFixed(2),
            active: this.active,
            trailLength: this.trailPositions.length
        };
    }
}
