export class ParticleEffects {
    constructor(scene) {
        this.scene = scene;
        
        // 활성 효과 관리
        this.activeEffects = [];
        this.maxEffects = 50; // 성능을 위한 제한
        
        // 효과별 설정
        this.effectConfigs = {
            brickBreak: {
                particleCount: 8,
                speed: { min: 50, max: 150 },
                life: { min: 300, max: 800 },
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 }
            },
            paddleHit: {
                particleCount: 5,
                speed: { min: 30, max: 80 },
                life: { min: 200, max: 400 },
                scale: { start: 0.8, end: 0 },
                alpha: { start: 0.8, end: 0 }
            },
            split: {
                particleCount: 12,
                speed: { min: 80, max: 200 },
                life: { min: 500, max: 1000 },
                scale: { start: 1.2, end: 0 },
                alpha: { start: 1, end: 0 }
            },
            spawn: {
                particleCount: 6,
                speed: { min: 20, max: 60 },
                life: { min: 400, max: 600 },
                scale: { start: 0, end: 1.5 },
                alpha: { start: 0, end: 1 }
            }
        };
    }

    update() {
        // 활성 효과들 업데이트
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            
            if (this.updateEffect(effect)) {
                // 효과가 끝나면 제거
                this.removeEffect(i);
            }
        }
    }

    updateEffect(effect) {
        const deltaTime = this.scene.game.loop.delta;
        effect.life -= deltaTime;
        
        if (effect.life <= 0) {
            return true; // 효과 종료
        }
        
        // 생명시간 비율 계산
        const lifeRatio = 1 - (effect.life / effect.maxLife);
        
        // 위치 업데이트
        effect.x += effect.vx * deltaTime / 1000;
        effect.y += effect.vy * deltaTime / 1000;
        
        // 중력 적용 (선택적)
        if (effect.gravity) {
            effect.vy += effect.gravity * deltaTime / 1000;
        }
        
        // 스케일 보간
        effect.currentScale = Phaser.Math.Interpolation.Linear(
            [effect.startScale, effect.endScale], lifeRatio
        );
        
        // 알파 보간
        effect.currentAlpha = Phaser.Math.Interpolation.Linear(
            [effect.startAlpha, effect.endAlpha], lifeRatio
        );
        
        // 그래픽 업데이트
        if (effect.graphics) {
            effect.graphics.setPosition(effect.x, effect.y);
            effect.graphics.setScale(effect.currentScale);
            effect.graphics.setAlpha(effect.currentAlpha);
        }
        
        return false; // 효과 계속
    }

    removeEffect(index) {
        const effect = this.activeEffects[index];
        
        if (effect.graphics) {
            effect.graphics.destroy();
        }
        
        this.activeEffects.splice(index, 1);
    }

    createBrickBreakEffect(x, y, color) {
        const config = this.effectConfigs.brickBreak;
        
        for (let i = 0; i < config.particleCount; i++) {
            this.createParticle({
                x, y,
                color,
                config,
                shape: 'square',
                size: 4,
                gravity: 200
            });
        }
        
        // 중앙 폭발 효과
        this.createExplosionRing(x, y, color, 30);
    }

    createPaddleHitEffect(x, y, color) {
        const config = this.effectConfigs.paddleHit;
        
        for (let i = 0; i < config.particleCount; i++) {
            this.createParticle({
                x, y,
                color,
                config,
                shape: 'circle',
                size: 3,
                gravity: 0
            });
        }
    }

    createSplitEffect(x, y, color) {
        const config = this.effectConfigs.split;
        
        // 방사형 파티클
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (i / config.particleCount) * Math.PI * 2;
            this.createParticle({
                x, y,
                color,
                config,
                shape: 'star',
                size: 5,
                angle,
                gravity: 0
            });
        }
        
        // 확장하는 링 효과
        this.createExpandingRing(x, y, color, 50);
    }

    createSpawnEffect(x, y, color) {
        const config = this.effectConfigs.spawn;
        
        // 안쪽에서 바깥쪽으로 확산
        for (let i = 0; i < config.particleCount; i++) {
            this.createParticle({
                x, y,
                color,
                config,
                shape: 'diamond',
                size: 3,
                gravity: 0,
                expanding: true
            });
        }
    }

    createPowerUpCollectEffect(x, y, color) {
        // 위쪽으로 올라가는 반짝이 효과
        for (let i = 0; i < 10; i++) {
            this.createParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                color,
                config: {
                    speed: { min: 20, max: 80 },
                    life: { min: 800, max: 1200 },
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 }
                },
                shape: 'star',
                size: 4,
                forceDirection: { x: 0, y: -1 }, // 위쪽으로
                gravity: 0
            });
        }
    }

    createParticle(options) {
        // 최대 효과 수 제한
        if (this.activeEffects.length >= this.maxEffects) {
            this.removeEffect(0); // 가장 오래된 효과 제거
        }
        
        const config = options.config;
        const speed = Phaser.Math.Between(config.speed.min, config.speed.max);
        const life = Phaser.Math.Between(config.life.min, config.life.max);
        
        // 방향 계산
        let angle;
        if (options.angle !== undefined) {
            angle = options.angle;
        } else if (options.forceDirection) {
            angle = Math.atan2(options.forceDirection.y, options.forceDirection.x);
            angle += (Math.random() - 0.5) * 0.5; // 약간의 랜덤성
        } else {
            angle = Math.random() * Math.PI * 2;
        }
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // 그래픽 생성
        const graphics = this.createParticleGraphics(options.shape, options.size, options.color);
        graphics.setPosition(options.x, options.y);
        
        // 효과 객체 생성
        const effect = {
            x: options.x,
            y: options.y,
            vx,
            vy,
            life,
            maxLife: life,
            startScale: config.scale.start,
            endScale: config.scale.end,
            startAlpha: config.alpha.start,
            endAlpha: config.alpha.end,
            currentScale: config.scale.start,
            currentAlpha: config.alpha.start,
            gravity: options.gravity || 0,
            graphics,
            color: options.color
        };
        
        this.activeEffects.push(effect);
    }

    createParticleGraphics(shape, size, color) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color);
        
        switch (shape) {
            case 'circle':
                graphics.fillCircle(0, 0, size);
                break;
            case 'square':
                graphics.fillRect(-size/2, -size/2, size, size);
                break;
            case 'diamond':
                graphics.beginPath();
                graphics.moveTo(0, -size);
                graphics.lineTo(size, 0);
                graphics.lineTo(0, size);
                graphics.lineTo(-size, 0);
                graphics.closePath();
                graphics.fillPath();
                break;
            case 'star':
                this.drawStar(graphics, 0, 0, 5, size, size * 0.5);
                break;
            default:
                graphics.fillCircle(0, 0, size);
        }
        
        return graphics;
    }

    drawStar(graphics, x, y, points, outerRadius, innerRadius) {
        graphics.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const pointX = x + Math.cos(angle) * radius;
            const pointY = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                graphics.moveTo(pointX, pointY);
            } else {
                graphics.lineTo(pointX, pointY);
            }
        }
        
        graphics.closePath();
        graphics.fillPath();
    }

    createExplosionRing(x, y, color, maxRadius) {
        const ring = this.scene.add.graphics();
        ring.setPosition(x, y);
        
        this.scene.tweens.add({
            targets: ring,
            radius: maxRadius,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const radius = tween.getValue();
                ring.clear();
                ring.lineStyle(3, color, ring.alpha);
                ring.strokeCircle(0, 0, radius);
            },
            onComplete: () => {
                ring.destroy();
            }
        });
    }

    createExpandingRing(x, y, color, maxRadius) {
        const ring = this.scene.add.graphics();
        ring.setPosition(x, y);
        
        this.scene.tweens.add({
            targets: ring,
            radius: maxRadius,
            alpha: 0,
            duration: 600,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const radius = tween.getValue();
                ring.clear();
                ring.lineStyle(2, color, ring.alpha * 0.7);
                ring.strokeCircle(0, 0, radius);
                
                // 내부 글로우
                ring.fillStyle(color, ring.alpha * 0.2);
                ring.fillCircle(0, 0, radius);
            },
            onComplete: () => {
                ring.destroy();
            }
        });
    }

    // 성능 최적화를 위한 모든 효과 제거
    clearAllEffects() {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            this.removeEffect(i);
        }
    }

    // 특정 타입의 효과만 제거
    clearEffectsByType(type) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            if (effect.type === type) {
                this.removeEffect(i);
            }
        }
    }

    // 효과 품질 설정 (성능 조절용)
    setQuality(quality) {
        // low, medium, high
        switch (quality) {
            case 'low':
                this.maxEffects = 20;
                Object.keys(this.effectConfigs).forEach(key => {
                    this.effectConfigs[key].particleCount = Math.ceil(this.effectConfigs[key].particleCount * 0.5);
                });
                break;
            case 'medium':
                this.maxEffects = 35;
                Object.keys(this.effectConfigs).forEach(key => {
                    this.effectConfigs[key].particleCount = Math.ceil(this.effectConfigs[key].particleCount * 0.75);
                });
                break;
            case 'high':
            default:
                this.maxEffects = 50;
                // 기본값 유지
                break;
        }
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            activeEffects: this.activeEffects.length,
            maxEffects: this.maxEffects,
            effectConfigs: this.effectConfigs
        };
    }
}
