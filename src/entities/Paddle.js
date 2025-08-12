export class Paddle {
    constructor(scene, x, y, isPlayer1) {
        this.scene = scene;
        this.config = scene.game.config.game;
        this.isPlayer1 = isPlayer1;
        
        // 위치와 크기
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 12;
        this.prevX = x; // 이전 위치 (속도 계산용)
        
        // 움직임 속성
        this.speed = 0;
        this.maxSpeed = isPlayer1 ? 10 : this.config.BASE_AI_SPEED;
        this.acceleration = isPlayer1 ? 0.8 : this.config.BASE_AI_ACCEL;
        this.friction = isPlayer1 ? 0.85 : 0.9;
        
        // 기본값 저장 (AI 난이도 조정용)
        this.baseMaxSpeed = this.maxSpeed;
        this.baseAcceleration = this.acceleration;
        
        // 그래픽 객체
        this.graphics = null;
        this.glowGraphics = null;
        this.createGraphics();
        
        // 물리 바디 (추후 확장)
        this.physicsBody = null;
        
        // 상태
        this.active = true;
        
        // 효과
        this.hitEffect = {
            active: false,
            scale: 1.0,
            opacity: 1.0
        };
    }

    createGraphics() {
        // 패들 모양 생성 (둥근 모서리)
        this.graphics = this.scene.add.graphics();
        this.updateGraphics();
        
        // 글로우 효과 (미묘한)
        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);
        this.updateGlowGraphics();
    }

    updateGraphics() {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        // 패들 색상 결정
        const color = this.getPaddleColor();
        
        // 둥근 패들 그리기
        const radius = this.height / 2;
        
        this.graphics.fillStyle(color);
        this.graphics.beginPath();
        
        // 왼쪽 반원
        this.graphics.arc(this.x + radius, this.y + radius, radius, Math.PI * 0.5, Math.PI * 1.5);
        // 직사각형 몸체
        this.graphics.lineTo(this.x + this.width - radius, this.y);
        // 오른쪽 반원
        this.graphics.arc(this.x + this.width - radius, this.y + radius, radius, Math.PI * 1.5, Math.PI * 0.5);
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // 광택 효과
        this.addGlossEffect();
    }

    addGlossEffect() {
        // 상단에 밝은 그라데이션 효과
        const gradient = this.graphics.scene.add.graphics();
        gradient.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.3, 0, 0.3, 0);
        
        const radius = this.height / 2;
        gradient.beginPath();
        gradient.arc(this.x + radius, this.y + radius, radius, Math.PI * 0.5, Math.PI * 1.5);
        gradient.lineTo(this.x + this.width - radius, this.y);
        gradient.arc(this.x + this.width - radius, this.y + radius, radius, Math.PI * 1.5, Math.PI * 0.5);
        gradient.closePath();
        gradient.fillPath();
        
        // 일정 시간 후 제거
        this.scene.time.delayedCall(100, () => {
            if (gradient) gradient.destroy();
        });
    }

    updateGlowGraphics() {
        if (!this.glowGraphics) return;
        
        this.glowGraphics.clear();
        
        // 미묘한 글로우 효과
        const glowColor = this.isPlayer1 ? 0x4488ff : 0xff4488;
        const glowRadius = this.height / 2 + 3;
        
        this.glowGraphics.fillStyle(glowColor, 0.2);
        this.glowGraphics.beginPath();
        this.glowGraphics.arc(this.x + glowRadius, this.y + glowRadius, glowRadius, Math.PI * 0.5, Math.PI * 1.5);
        this.glowGraphics.lineTo(this.x + this.width - glowRadius, this.y);
        this.glowGraphics.arc(this.x + this.width - glowRadius, this.y + glowRadius, glowRadius, Math.PI * 1.5, Math.PI * 0.5);
        this.glowGraphics.closePath();
        this.glowGraphics.fillPath();
    }

    getPaddleColor() {
        if (this.isPlayer1) {
            return 0x4488ff; // 플레이어 - 파란색
        } else {
            // AI 패들 - 난이도에 따른 색상
            if (this.scene.difficultyManager) {
                const colorHex = this.scene.difficultyManager.getAIColor();
                return Phaser.Display.Color.HexStringToColor(colorHex).color;
            }
            return 0xff4488; // 기본 빨간색
        }
    }

    update(keys = {}) {
        if (!this.active) return;
        
        // 이전 위치 저장
        this.prevX = this.x;
        
        if (this.isPlayer1) {
            this.updatePlayerMovement(keys);
        } else {
            this.updateAIMovement();
        }
        
        // 마찰 적용
        this.speed *= this.friction;
        
        // 매우 작은 속도는 0으로 설정
        if (Math.abs(this.speed) < 0.1) {
            this.speed = 0;
        }
        
        // 위치 업데이트
        this.x += this.speed;
        
        // 경계 체크
        this.checkBounds();
        
        // 그래픽 업데이트
        this.updateGraphics();
        this.updateGlowGraphics();
        
        // 히트 이펙트 업데이트
        this.updateHitEffect();
    }

    updatePlayerMovement(keys) {
        // 키보드 입력 처리
        let direction = 0;
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            direction = -1;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            direction = 1;
        }
        
        if (direction !== 0) {
            this.speed += direction * this.acceleration;
            this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed));
        }
    }

    updateAIMovement() {
        // AI 움직임은 AIController에서 관리
        // 여기서는 최대 속도 제한만 적용
        this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed));
    }

    checkBounds() {
        const { width } = this.scene.cameras.main;
        
        // 화면 경계 체크
        if (this.x < 0) {
            this.x = 0;
            this.speed = Math.max(0, this.speed); // 왼쪽 벽에서는 오른쪽으로만
        } else if (this.x + this.width > width) {
            this.x = width - this.width;
            this.speed = Math.min(0, this.speed); // 오른쪽 벽에서는 왼쪽으로만
        }
    }

    updateHitEffect() {
        if (this.hitEffect.active) {
            // 히트 이펙트 감쇠
            this.hitEffect.scale = Phaser.Math.Linear(this.hitEffect.scale, 1.0, 0.1);
            this.hitEffect.opacity = Phaser.Math.Linear(this.hitEffect.opacity, 1.0, 0.1);
            
            // 이펙트 종료 조건
            if (Math.abs(this.hitEffect.scale - 1.0) < 0.01) {
                this.hitEffect.active = false;
            }
        }
    }

    // 공과 충돌했을 때 호출
    onBallHit(ball) {
        // 히트 이펙트 활성화
        this.hitEffect.active = true;
        this.hitEffect.scale = 1.2;
        this.hitEffect.opacity = 0.8;
        
        // 간단한 진동 효과
        this.scene.cameras.main.shake(50, 0.002);
        
        // 파티클 효과 (있다면)
        if (this.scene.particleEffects) {
            this.scene.particleEffects.createPaddleHitEffect(
                ball.x, ball.y, this.getPaddleColor()
            );
        }
    }

    // AI 패들용 설정 업데이트
    updateAISettings(maxSpeed, acceleration) {
        if (!this.isPlayer1) {
            this.maxSpeed = maxSpeed;
            this.acceleration = acceleration;
        }
    }

    // 위치 설정
    setPosition(x, y) {
        this.prevX = this.x;
        this.x = x;
        this.y = y;
        this.updateGraphics();
        this.updateGlowGraphics();
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

    // 둥근 끝부분의 중심점들 반환 (충돌 감지용)
    getCircleCenters() {
        const radius = this.height / 2;
        return {
            left: { x: this.x + radius, y: this.y + radius, radius },
            right: { x: this.x + this.width - radius, y: this.y + radius, radius }
        };
    }

    // 속도 관련 메서드
    getVelocity() {
        return this.x - this.prevX;
    }

    addImpulse(impulse) {
        this.speed += impulse;
        this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed));
    }

    // 패들 리셋
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.speed = 0;
        this.hitEffect.active = false;
        this.updateGraphics();
        this.updateGlowGraphics();
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
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            speed: this.speed.toFixed(2),
            maxSpeed: this.maxSpeed.toFixed(2),
            acceleration: this.acceleration.toFixed(2),
            isPlayer1: this.isPlayer1,
            active: this.active
        };
    }
}
