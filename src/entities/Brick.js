export class Brick {
    constructor(scene, x, y, isPlayer1, row = 0) {
        this.scene = scene;
        this.config = scene.game.config.game;
        
        // 위치와 크기
        this.x = x;
        this.y = y;
        this.width = this.config.BRICK_WIDTH;
        this.height = this.config.BRICK_HEIGHT;
        
        // 소속과 색상
        this.isPlayer1 = isPlayer1;
        this.row = row;
        this.color = this.calculateColor();
        
        // 그래픽 객체
        this.graphics = null;
        this.borderGraphics = null;
        this.createGraphics();
        
        // 물리 바디 (추후 확장)
        this.physicsBody = null;
        
        // 상태
        this.active = true;
        this.health = 1; // 추후 다중 히트 벽돌용
        
        // 효과
        this.spawnEffect = {
            active: true,
            scale: 0,
            opacity: 0,
            targetScale: 1,
            targetOpacity: 1
        };
        
        this.hitEffect = {
            active: false,
            flash: 0,
            shake: { x: 0, y: 0 }
        };
        
        // 스폰 애니메이션 시작
        this.startSpawnAnimation();
    }

    calculateColor() {
        // 플레이어에 따른 기본 색조
        const baseHue = this.isPlayer1 ? 200 : 340; // 파란색 vs 빨간색
        
        // 행에 따른 색상 변화
        const hue = baseHue + (this.row * 10);
        
        // HSL 색상을 16진수로 변환
        return Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.5).color;
    }

    createGraphics() {
        // 메인 벽돌 그래픽
        this.graphics = this.scene.add.rectangle(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width,
            this.height,
            this.color
        );
        
        // 테두리 그래픽
        this.borderGraphics = this.scene.add.graphics();
        this.updateBorderGraphics();
        
        // 초기에는 스폰 이펙트로 인해 보이지 않음
        this.graphics.setScale(0);
        this.graphics.setAlpha(0);
    }

    updateBorderGraphics() {
        if (!this.borderGraphics) return;
        
        this.borderGraphics.clear();
        this.borderGraphics.lineStyle(1, 0x000000, 0.3);
        this.borderGraphics.strokeRect(this.x, this.y, this.width, this.height);
        
        // 미묘한 내부 하이라이트
        this.borderGraphics.lineStyle(1, 0xffffff, 0.2);
        this.borderGraphics.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
    }

    startSpawnAnimation() {
        // 스폰 애니메이션
        this.scene.tweens.add({
            targets: this.spawnEffect,
            scale: 1,
            opacity: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onUpdate: () => {
                if (this.graphics) {
                    this.graphics.setScale(this.spawnEffect.scale);
                    this.graphics.setAlpha(this.spawnEffect.opacity);
                }
            },
            onComplete: () => {
                this.spawnEffect.active = false;
            }
        });
    }

    update() {
        if (!this.active) return;
        
        // 히트 이펙트 업데이트
        this.updateHitEffect();
        
        // 스폰 이펙트가 활성화된 경우 처리
        if (this.spawnEffect.active) {
            // 스폰 애니메이션은 tween에서 처리
        }
    }

    updateHitEffect() {
        if (this.hitEffect.active) {
            // 플래시 효과 감쇠
            this.hitEffect.flash = Phaser.Math.Linear(this.hitEffect.flash, 0, 0.2);
            
            // 흔들림 효과 감쇠
            this.hitEffect.shake.x = Phaser.Math.Linear(this.hitEffect.shake.x, 0, 0.3);
            this.hitEffect.shake.y = Phaser.Math.Linear(this.hitEffect.shake.y, 0, 0.3);
            
            // 그래픽에 효과 적용
            if (this.graphics) {
                const flashIntensity = this.hitEffect.flash;
                const brightColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(this.color),
                    Phaser.Display.Color.ValueToColor(0xffffff),
                    1,
                    flashIntensity
                );
                
                this.graphics.setFillStyle(Phaser.Display.Color.GetColor(brightColor.r, brightColor.g, brightColor.b));
                this.graphics.setPosition(
                    this.x + this.width / 2 + this.hitEffect.shake.x,
                    this.y + this.height / 2 + this.hitEffect.shake.y
                );
            }
            
            // 이펙트 종료 조건
            if (this.hitEffect.flash < 0.01 && Math.abs(this.hitEffect.shake.x) < 0.1) {
                this.hitEffect.active = false;
                this.resetGraphicsPosition();
            }
        }
    }

    resetGraphicsPosition() {
        if (this.graphics) {
            this.graphics.setFillStyle(this.color);
            this.graphics.setPosition(this.x + this.width / 2, this.y + this.height / 2);
        }
    }

    // 공과 충돌했을 때 호출
    onHit(ball) {
        this.health--;
        
        // 히트 이펙트 활성화
        this.hitEffect.active = true;
        this.hitEffect.flash = 1.0;
        this.hitEffect.shake.x = (Math.random() - 0.5) * 4;
        this.hitEffect.shake.y = (Math.random() - 0.5) * 4;
        
        // 파티클 효과
        if (this.scene.particleEffects) {
            this.scene.particleEffects.createBrickHitEffect(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color
            );
        }
        
        // 벽돌이 파괴되는 경우
        if (this.health <= 0) {
            this.destroyBrick();
            return true; // 파괴됨
        }
        
        return false; // 아직 살아있음
    }

    destroyBrick() {
        // 파괴 애니메이션
        this.scene.tweens.add({
            targets: this.graphics,
            scale: 0,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // 파괴 파티클 효과
        if (this.scene.particleEffects) {
            this.scene.particleEffects.createBrickBreakEffect(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color
            );
        }
        
        this.active = false;
    }

    // 경계 상자 반환
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height,
            centerX: this.x + this.width / 2,
            centerY: this.y + this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // 색상 변경 (파워업 등에서 사용)
    setColor(color) {
        this.color = color;
        if (this.graphics) {
            this.graphics.setFillStyle(color);
        }
    }

    // 강도 설정 (다중 히트 벽돌용)
    setHealth(health) {
        this.health = health;
        
        // 체력에 따른 시각적 변화
        if (this.graphics) {
            const alpha = Math.max(0.3, this.health / 3); // 최소 30% 투명도
            this.graphics.setAlpha(alpha);
        }
    }

    // 특수 벽돌 타입 설정 (추후 확장용)
    setSpecialType(type) {
        this.specialType = type;
        
        switch (type) {
            case 'strong':
                this.setHealth(3);
                this.setColor(0x888888); // 회색
                break;
            case 'explosive':
                this.setColor(0xff8800); // 주황색
                break;
            case 'bonus':
                this.setColor(0xffff00); // 노란색
                break;
        }
    }

    // 위치 재설정
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        if (this.graphics) {
            this.graphics.setPosition(x + this.width / 2, y + this.height / 2);
        }
        
        this.updateBorderGraphics();
    }

    // 벽돌 깜빡임 효과 (경고용)
    blink(duration = 1000) {
        this.scene.tweens.add({
            targets: this.graphics,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: duration / 200,
            ease: 'Power2'
        });
    }

    destroy() {
        this.active = false;
        
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        
        if (this.borderGraphics) {
            this.borderGraphics.destroy();
            this.borderGraphics = null;
        }
        
        // 물리 바디 제거 (있다면)
        if (this.physicsBody && this.scene.matter) {
            this.scene.matter.world.remove(this.physicsBody);
            this.physicsBody = null;
        }
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            size: { width: this.width, height: this.height },
            color: this.color.toString(16),
            health: this.health,
            isPlayer1: this.isPlayer1,
            row: this.row,
            active: this.active
        };
    }
}
