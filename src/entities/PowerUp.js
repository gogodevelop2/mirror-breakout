export class PowerUp {
    constructor(scene, x, y, type = 'speed') {
        this.scene = scene;
        this.config = scene.game.config.game;
        
        // 위치와 크기
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        
        // 타입과 속성
        this.type = type;
        this.fallSpeed = 2;
        this.rotationSpeed = 0.05;
        
        // 그래픽 객체
        this.graphics = null;
        this.glowGraphics = null;
        this.createGraphics();
        
        // 상태
        this.active = true;
        this.collected = false;
        
        // 효과
        this.pulseEffect = 0;
        this.lifeTime = 0;
        this.maxLifeTime = 10000; // 10초 후 소멸
        
        // 파워업 속성 정의
        this.defineProperties();
    }

    defineProperties() {
        // 파워업 타입별 속성 정의
        const powerUpTypes = {
            speed: {
                color: 0x00ff00,
                icon: 'S',
                duration: 5000,
                description: 'Speed Boost'
            },
            multiball: {
                color: 0xff0000,
                icon: 'M',
                duration: 0, // 즉시 효과
                description: 'Multi Ball'
            },
            paddle_size: {
                color: 0x0000ff,
                icon: 'P',
                duration: 8000,
                description: 'Bigger Paddle'
            },
            slow_motion: {
                color: 0xffff00,
                icon: 'T',
                duration: 6000,
                description: 'Slow Motion'
            },
            penetrate: {
                color: 0xff00ff,
                icon: 'X',
                duration: 7000,
                description: 'Penetrating Ball'
            },
            life: {
                color: 0x00ffff,
                icon: '+',
                duration: 0,
                description: 'Extra Life'
            }
        };
        
        this.properties = powerUpTypes[this.type] || powerUpTypes.speed;
    }

    createGraphics() {
        // 메인 파워업 그래픽 (육각형)
        this.graphics = this.scene.add.graphics();
        
        // 글로우 효과
        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);
        
        this.updateGraphics();
    }

    updateGraphics() {
        if (!this.graphics || !this.active) return;
        
        this.graphics.clear();
        this.glowGraphics.clear();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 2;
        
        // 회전 적용
        const rotation = this.lifeTime * this.rotationSpeed;
        
        // 펄스 효과
        const pulseScale = 1 + Math.sin(this.pulseEffect) * 0.1;
        const currentRadius = radius * pulseScale;
        
        // 메인 육각형
        this.graphics.fillStyle(this.properties.color);
        this.graphics.beginPath();
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2 / 6) + rotation;
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                this.graphics.moveTo(x, y);
            } else {
                this.graphics.lineTo(x, y);
            }
        }
        this.graphics.closePath();
        this.graphics.fillPath();
        
        // 테두리
        this.graphics.lineStyle(2, 0xffffff, 0.8);
        this.graphics.strokePath();
        
        // 아이콘 텍스트
        if (this.iconText) {
            this.iconText.setPosition(centerX, centerY);
            this.iconText.setRotation(rotation * 0.5);
        } else {
            this.iconText = this.scene.add.text(centerX, centerY, this.properties.icon, {
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }
        
        // 글로우 효과
        this.glowGraphics.fillStyle(this.properties.color, 0.3);
        this.glowGraphics.beginPath();
        this.glowGraphics.arc(centerX, centerY, currentRadius * 1.5, 0, Math.PI * 2);
        this.glowGraphics.fillPath();
    }

    update(deltaTime = 16) {
        if (!this.active) return;
        
        // 생명시간 업데이트
        this.lifeTime += deltaTime;
        
        // 수직 낙하
        this.y += this.fallSpeed;
        
        // 펄스 효과 업데이트
        this.pulseEffect += 0.1;
        
        // 그래픽 업데이트
        this.updateGraphics();
        
        // 화면 밖으로 나갔는지 확인
        this.checkBounds();
        
        // 생명시간 만료 확인
        this.checkLifeTime();
        
        // 투명도 효과 (생명시간이 다 될 때)
        this.updateLifeTimeEffect();
    }

    checkBounds() {
        const { height } = this.scene.cameras.main;
        
        // 화면 아래로 떨어지면 제거
        if (this.y > height + 50) {
            this.destroy();
        }
    }

    checkLifeTime() {
        // 생명시간이 다 되면 제거
        if (this.lifeTime >= this.maxLifeTime) {
            this.destroy();
        }
    }

    updateLifeTimeEffect() {
        // 생명시간의 80%가 지나면 깜빡거리기 시작
        const timeRatio = this.lifeTime / this.maxLifeTime;
        
        if (timeRatio > 0.8) {
            const blinkSpeed = (timeRatio - 0.8) * 10; // 점점 빨라짐
            const alpha = Math.sin(this.lifeTime * blinkSpeed) * 0.5 + 0.5;
            
            if (this.graphics) {
                this.graphics.setAlpha(alpha);
            }
            if (this.iconText) {
                this.iconText.setAlpha(alpha);
            }
            if (this.glowGraphics) {
                this.glowGraphics.setAlpha(alpha * 0.3);
            }
        }
    }

    // 패들과의 충돌 체크
    checkPaddleCollision(paddle) {
        if (!this.active || this.collected) return false;
        
        const paddleBounds = paddle.getBounds();
        const powerUpBounds = this.getBounds();
        
        // AABB 충돌 감지
        return powerUpBounds.left < paddleBounds.right &&
               powerUpBounds.right > paddleBounds.left &&
               powerUpBounds.top < paddleBounds.bottom &&
               powerUpBounds.bottom > paddleBounds.top;
    }

    // 파워업 수집
    collect(paddle) {
        if (this.collected) return;
        
        this.collected = true;
        this.active = false;
        
        // 수집 효과
        this.createCollectEffect();
        
        // 파워업 효과 적용
        this.applyEffect(paddle);
        
        // 객체 제거
        this.scene.time.delayedCall(200, () => {
            this.destroy();
        });
    }

    createCollectEffect() {
        // 수집 시 파티클 효과
        if (this.scene.particleEffects) {
            this.scene.particleEffects.createPowerUpCollectEffect(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.properties.color
            );
        }
        
        // 스케일 애니메이션
        this.scene.tweens.add({
            targets: [this.graphics, this.iconText],
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut'
        });
        
        // 화면 진동
        this.scene.cameras.main.shake(100, 0.003);
    }

    applyEffect(paddle) {
        // 파워업 타입별 효과 적용
        switch (this.type) {
            case 'speed':
                this.applySpeedBoost(paddle);
                break;
            case 'multiball':
                this.applyMultiBall();
                break;
            case 'paddle_size':
                this.applyPaddleSize(paddle);
                break;
            case 'slow_motion':
                this.applySlowMotion();
                break;
            case 'penetrate':
                this.applyPenetrate();
                break;
            case 'life':
                this.applyExtraLife();
                break;
        }
        
        // UI에 효과 표시 (추후 구현)
        this.showEffectNotification();
    }

    applySpeedBoost(paddle) {
        // 패들 속도 증가
        const originalMaxSpeed = paddle.maxSpeed;
        paddle.maxSpeed *= 1.5;
        
        // 일정 시간 후 원래대로
        this.scene.time.delayedCall(this.properties.duration, () => {
            paddle.maxSpeed = originalMaxSpeed;
        });
    }

    applyMultiBall() {
        // 현재 공들 복제
        const currentBalls = [...this.scene.balls];
        
        currentBalls.forEach(ball => {
            if (ball.active) {
                // 새로운 각도로 공 추가
                const angle = Math.random() * Math.PI * 2;
                const speed = ball.getSpeed();
                const newDx = Math.cos(angle) * speed;
                const newDy = Math.sin(angle) * speed;
                
                const newBall = new (ball.constructor)(this.scene, ball.x, ball.y, newDx, newDy);
                this.scene.balls.push(newBall);
            }
        });
    }

    applyPaddleSize(paddle) {
        // 패들 크기 증가
        const originalWidth = paddle.width;
        paddle.width *= 1.5;
        
        // 그래픽 업데이트
        paddle.updateGraphics();
        
        // 일정 시간 후 원래대로
        this.scene.time.delayedCall(this.properties.duration, () => {
            paddle.width = originalWidth;
            paddle.updateGraphics();
        });
    }

    applySlowMotion() {
        // 게임 속도 감소 (공 속도 조절)
        this.scene.balls.forEach(ball => {
            ball.dx *= 0.5;
            ball.dy *= 0.5;
        });
        
        // 일정 시간 후 원래대로
        this.scene.time.delayedCall(this.properties.duration, () => {
            this.scene.balls.forEach(ball => {
                ball.dx *= 2;
                ball.dy *= 2;
            });
        });
    }

    applyPenetrate() {
        // 공이 벽돌을 관통하도록 설정
        this.scene.balls.forEach(ball => {
            ball.penetrating = true;
            
            // 시각적 효과
            ball.setGlowIntensity(2.0);
        });
        
        // 일정 시간 후 원래대로
        this.scene.time.delayedCall(this.properties.duration, () => {
            this.scene.balls.forEach(ball => {
                ball.penetrating = false;
                ball.setGlowIntensity(1.0);
            });
        });
    }

    applyExtraLife() {
        // 추가 생명 (추후 구현)
        console.log('Extra life collected!');
    }

    showEffectNotification() {
        // 효과 알림 텍스트 표시
        const { width, height } = this.scene.cameras.main;
        
        const notification = this.scene.add.text(
            width / 2, height / 2 - 50,
            this.properties.description,
            {
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: `#${this.properties.color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        // 애니메이션
        this.scene.tweens.add({
            targets: notification,
            y: height / 2 - 100,
            alpha: 0,
            duration: 2000,
            ease: 'Power2.easeOut',
            onComplete: () => {
                notification.destroy();
            }
        });
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

    // 위치 설정
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateGraphics();
    }

    // 낙하 속도 설정
    setFallSpeed(speed) {
        this.fallSpeed = speed;
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
        
        if (this.iconText) {
            this.iconText.destroy();
            this.iconText = null;
        }
    }

    // 정적 메서드: 랜덤 파워업 생성
    static createRandom(scene, x, y) {
        const types = ['speed', 'multiball', 'paddle_size', 'slow_motion', 'penetrate', 'life'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new PowerUp(scene, x, y, randomType);
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            type: this.type,
            lifeTime: this.lifeTime,
            maxLifeTime: this.maxLifeTime,
            fallSpeed: this.fallSpeed,
            active: this.active,
            collected: this.collected
        };
    }
}
