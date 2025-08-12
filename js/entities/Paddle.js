/**
 * Paddle Entity Class
 * 둥근 모서리를 가진 패들 엔티티 (정밀한 충돌 처리 포함)
 */

class Paddle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, isPlayer = true) {
        super(scene, x, y, null);
        
        // 씬에 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 기본 속성
        this.isPlayer = isPlayer;
        this.paddleWidth = GameConfig.PADDLE.WIDTH;
        this.paddleHeight = GameConfig.PADDLE.HEIGHT;
        this.cornerRadius = GameConfig.CALCULATED.PADDLE_CORNER_RADIUS;
        this.rectWidth = GameConfig.CALCULATED.PADDLE_RECT_WIDTH;
        
        // 속도 관련
        this.maxSpeed = isPlayer ? 
            GameConfig.PADDLE.PLAYER_SPEED : 
            GameConfig.PADDLE.AI_BASE_SPEED;
        this.friction = GameConfig.PADDLE.FRICTION;
        
        // 위치 추적용
        this.previousX = x;
        this.velocityInfluence = 0;
        
        // AI 전용
        this.difficultyMultiplier = 1.0;
        this.targetColor = isPlayer ? GameConfig.COLORS.PLAYER : GameConfig.COLORS.AI_MIN;
        this.currentColor = this.targetColor;
        
        // 물리 설정
        this.setupPhysics();
        
        // 그래픽 생성
        this.setupGraphics();
        
        // 진동 효과용
        this.baseX = x;
        this.baseY = y;
        this.vibrationOffset = { x: 0, y: 0 };
        
        console.log(`${isPlayer ? 'Player' : 'AI'} paddle created at:`, { x, y });
    }
    
    /**
     * 물리 속성 설정
     */
    setupPhysics() {
        // 충돌체 설정 (사각형 기반)
        this.setSize(this.paddleWidth, this.paddleHeight);
        this.setDisplaySize(this.paddleWidth, this.paddleHeight);
        
        // 물리 속성
        this.setImmovable(true);
        this.setCollideWorldBounds(true);
        this.setDrag(this.isPlayer ? 800 : 0); // 플레이어만 드래그 적용
        this.setMaxVelocity(this.maxSpeed);
        
        // 회전 방지
        this.setAngularDrag(1000);
    }
    
    /**
     * 그래픽 설정
     */
    setupGraphics() {
        this.updatePaddleTexture();
    }
    
    /**
     * 패들 텍스처 업데이트 (색상 변경 시 호출)
     */
    updatePaddleTexture() {
        const textureName = this.isPlayer ? 'playerPaddle' : 'aiPaddle';
        
        // 기존 텍스처가 있으면 제거
        if (this.scene.textures.exists(textureName)) {
            this.scene.textures.remove(textureName);
        }
        
        const graphics = this.scene.add.graphics();
        
        // 둥근 패들 그리기
        this.drawRoundedPaddle(graphics, this.currentColor);
        
        // 텍스처로 변환
        graphics.generateTexture(textureName, this.paddleWidth, this.paddleHeight);
        this.setTexture(textureName);
        graphics.destroy();
    }
    
    /**
     * 둥근 패들 그리기
     */
    drawRoundedPaddle(graphics, color) {
        const width = this.paddleWidth;
        const height = this.paddleHeight;
        const radius = this.cornerRadius;
        
        // 메인 패들 색상
        graphics.fillStyle(color);
        graphics.beginPath();
        
        // 둥근 모서리 사각형 그리기
        graphics.arc(radius, radius, radius, Math.PI, Math.PI * 1.5); // 왼쪽 위
        graphics.lineTo(width - radius, 0);
        graphics.arc(width - radius, radius, radius, Math.PI * 1.5, 0); // 오른쪽 위
        graphics.lineTo(width, height - radius);
        graphics.arc(width - radius, height - radius, radius, 0, Math.PI * 0.5); // 오른쪽 아래
        graphics.lineTo(radius, height);
        graphics.arc(radius, height - radius, radius, Math.PI * 0.5, Math.PI); // 왼쪽 아래
        graphics.closePath();
        graphics.fillPath();
        
        // 하이라이트 효과 (상단)
        const highlightGradient = graphics.createLinearGradient(0, 0, 0, height * 0.4);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        
        graphics.fillStyle(highlightGradient);
        graphics.fillRoundedRect(0, 0, width, height * 0.4, radius);
        
        // 그림자 효과 (하단)
        const shadowGradient = graphics.createLinearGradient(0, height * 0.6, 0, height);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        graphics.fillStyle(shadowGradient);
        graphics.fillRoundedRect(0, height * 0.6, width, height * 0.4, radius);
        
        // 테두리
        graphics.lineStyle(1, Phaser.Display.Color.GetColor32(
            Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(color),
                Phaser.Display.Color.IntegerToColor(0x000000),
                100, 30
            )
        ));
        graphics.strokeRoundedRect(0, 0, width, height, radius);
    }
    
    /**
     * 업데이트 루프
     */
    update() {
        if (!this.active) return;
        
        // 속도 영향 계산
        this.calculateVelocityInfluence();
        
        // AI 색상 업데이트
        if (!this.isPlayer) {
            this.updateAIColor();
        }
        
        // 진동 효과 적용
        this.applyVibration();
        
        // 위치 추적
        this.previousX = this.x - this.vibrationOffset.x; // 진동 제외한 실제 위치
    }
    
    /**
     * 속도 영향 계산 (공에 전달할 모멘텀)
     */
    calculateVelocityInfluence() {
        const realX = this.x - this.vibrationOffset.x;
        this.velocityInfluence = realX - this.previousX;
        
        // 급격한 변화 제한
        this.velocityInfluence = Phaser.Math.Clamp(
            this.velocityInfluence, 
            -this.maxSpeed * 0.5, 
            this.maxSpeed * 0.5
        );
    }
    
    /**
     * AI 패들 난이도에 따른 색상 업데이트
     */
    updateAIColor() {
        const multiplier = this.difficultyMultiplier;
        let newTargetColor;
        
        if (multiplier <= 0.8) {
            // 쉬운 난이도 - 파란색
            newTargetColor = GameConfig.COLORS.AI_MIN;
        } else if (multiplier <= 1.2) {
            // 중간 난이도 - 파란색에서 주황색으로
            const t = (multiplier - 0.8) / 0.4;
            newTargetColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(GameConfig.COLORS.AI_MIN),
                Phaser.Display.Color.IntegerToColor(GameConfig.COLORS.AI_MID),
                100, t * 100
            );
            newTargetColor = Phaser.Display.Color.GetColor32(newTargetColor);
        } else if (multiplier <= 1.8) {
            // 어려운 난이도 - 주황색에서 빨간색으로
            const t = (multiplier - 1.2) / 0.6;
            newTargetColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(GameConfig.COLORS.AI_MID),
                Phaser.Display.Color.IntegerToColor(GameConfig.COLORS.AI_MAX),
                100, t * 100
            );
            newTargetColor = Phaser.Display.Color.GetColor32(newTargetColor);
        } else {
            // 매우 어려운 난이도 - 빨간색
            newTargetColor = GameConfig.COLORS.AI_MAX;
        }
        
        // 색상이 변경되었으면 텍스처 업데이트
        if (newTargetColor !== this.targetColor) {
            this.targetColor = newTargetColor;
            this.currentColor = newTargetColor;
            this.updatePaddleTexture();
        }
    }
    
    /**
     * 난이도 배율 설정 (AI 전용)
     */
    setDifficultyMultiplier(multiplier) {
        if (!this.isPlayer) {
            this.difficultyMultiplier = multiplier;
            this.maxSpeed = GameConfig.PADDLE.AI_BASE_SPEED * multiplier;
            this.setMaxVelocity(this.maxSpeed);
        }
    }
    
    /**
     * 진동 효과 트리거
     */
    triggerVibration(intensity = 1.0, duration = 200) {
        // 기존 진동 중지
        if (this.vibrationTween) {
            this.vibrationTween.stop();
        }
        
        // 진동 패턴 (감쇠 진동)
        this.vibrationTween = this.scene.tweens.add({
            targets: this.vibrationOffset,
            x: { from: 0, to: 2 * intensity },
            y: { from: 0, to: 1 * intensity },
            duration: 50,
            ease: 'Power2.easeOut',
            yoyo: true,
            repeat: Math.floor(duration / 100),
            onUpdate: () => {
                // 진동 강도를 점진적으로 감소
                const progress = this.vibrationTween.progress;
                const dampening = 1 - progress;
                this.vibrationOffset.x *= dampening;
                this.vibrationOffset.y *= dampening;
            },
            onComplete: () => {
                this.vibrationOffset.x = 0;
                this.vibrationOffset.y = 0;
                this.vibrationTween = null;
            }
        });
    }
    
    /**
     * 진동 효과 적용
     */
    applyVibration() {
        this.x = this.baseX + this.vibrationOffset.x;
        this.y = this.baseY + this.vibrationOffset.y;
    }
    
    /**
     * 패들 이동 (플레이어용)
     */
    moveLeft(acceleration = null) {
        if (!this.isPlayer) return;
        
        const accel = acceleration || GameConfig.PADDLE.PLAYER_SPEED * 0.1;
        this.setAccelerationX(-accel);
    }
    
    moveRight(acceleration = null) {
        if (!this.isPlayer) return;
        
        const accel = acceleration || GameConfig.PADDLE.PLAYER_SPEED * 0.1;
        this.setAccelerationX(accel);
    }
    
    stopMovement() {
        if (!this.isPlayer) return;
        
        this.setAccelerationX(0);
        this.setDrag(800); // 빠른 정지를 위한 드래그
    }
    
    /**
     * AI 이동 (AI용)
     */
    moveTowards(targetX, speed = null) {
        if (this.isPlayer) return;
        
        const moveSpeed = speed || this.maxSpeed;
        const diff = targetX - (this.x - this.vibrationOffset.x);
        
        if (Math.abs(diff) > 2) { // 데드존
            const direction = Math.sign(diff);
            this.setVelocityX(direction * moveSpeed);
        } else {
            this.setVelocityX(0);
        }
    }
    
    /**
     * 정밀한 충돌 감지 (정적 메서드)
     */
    static checkPreciseCollision(ball, paddle) {
        const ballPos = { x: ball.x, y: ball.y };
        const ballRadius = ball.radius;
        const paddlePos = { x: paddle.x - paddle.vibrationOffset.x, y: paddle.y - paddle.vibrationOffset.y };
        
        // 패들 영역 분할
        const leftCircleCenter = {
            x: paddlePos.x + paddle.cornerRadius,
            y: paddlePos.y + paddle.cornerRadius
        };
        
        const rightCircleCenter = {
            x: paddlePos.x + paddle.paddleWidth - paddle.cornerRadius,
            y: paddlePos.y + paddle.cornerRadius
        };
        
        const rectArea = {
            x: paddlePos.x + paddle.cornerRadius,
            y: paddlePos.y,
            width: paddle.rectWidth,
            height: paddle.paddleHeight
        };
        
        // 충돌 감지
        return PreciseCollision.detectCollisionRegion(
            ballPos, ballRadius, leftCircleCenter, rightCircleCenter, rectArea, paddle.cornerRadius
        );
    }
    
    /**
     * 모멘텀 전달량 반환
     */
    getMomentumTransfer() {
        return this.velocityInfluence * GameConfig.PADDLE.MOMENTUM_TRANSFER;
    }
    
    /**
     * 패들 위치 리셋
     */
    resetPosition() {
        this.baseX = this.isPlayer ? 
            GameConfig.CALCULATED.GAME_CENTER_X : 
            GameConfig.CALCULATED.GAME_CENTER_X;
        this.baseY = this.isPlayer ? 
            GameConfig.POSITIONS.PLAYER_PADDLE_Y : 
            GameConfig.POSITIONS.AI_PADDLE_Y;
            
        this.x = this.baseX;
        this.y = this.baseY;
        this.setVelocity(0, 0);
        this.setAcceleration(0, 0);
        
        this.vibrationOffset.x = 0;
        this.vibrationOffset.y = 0;
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            type: this.isPlayer ? 'Player' : 'AI',
            position: { 
                x: this.x - this.vibrationOffset.x, 
                y: this.y - this.vibrationOffset.y 
            },
            realPosition: { x: this.x, y: this.y },
            velocity: { x: this.body.velocity.x, y: this.body.velocity.y },
            velocityInfluence: this.velocityInfluence,
            difficultyMultiplier: this.difficultyMultiplier,
            maxSpeed: this.maxSpeed,
            vibration: this.vibrationOffset,
            color: this.currentColor
        };
    }
    
    /**
     * 정리
     */
    destroy() {
        if (this.vibrationTween) {
            this.vibrationTween.stop();
        }
        
        console.log(`${this.isPlayer ? 'Player' : 'AI'} paddle destroyed`);
        super.destroy();
    }
}

/**
 * 정밀 충돌 감지 헬퍼 클래스
 */
class PreciseCollision {
    /**
     * 충돌 영역 감지
     */
    static detectCollisionRegion(ballPos, ballRadius, leftCenter, rightCenter, rectArea, paddleRadius) {
        // 왼쪽 원형 영역 충돌
        const leftDist = this.distance(ballPos, leftCenter);
        if (leftDist <= ballRadius + paddleRadius) {
            return {
                hasCollision: true,
                type: 'leftCircle',
                center: leftCenter,
                distance: leftDist,
                normal: this.normalize({
                    x: ballPos.x - leftCenter.x,
                    y: ballPos.y - leftCenter.y
                })
            };
        }
        
        // 오른쪽 원형 영역 충돌
        const rightDist = this.distance(ballPos, rightCenter);
        if (rightDist <= ballRadius + paddleRadius) {
            return {
                hasCollision: true,
                type: 'rightCircle',
                center: rightCenter,
                distance: rightDist,
                normal: this.normalize({
                    x: ballPos.x - rightCenter.x,
                    y: ballPos.y - rightCenter.y
                })
            };
        }
        
        // 중앙 직사각형 영역 충돌
        if (ballPos.x >= rectArea.x && 
            ballPos.x <= rectArea.x + rectArea.width &&
            Math.abs(ballPos.y - (rectArea.y + rectArea.height/2)) <= ballRadius + rectArea.height/2) {
            
            return {
                hasCollision: true,
                type: 'rectangle',
                normal: { 
                    x: 0, 
                    y: ballPos.y < rectArea.y + rectArea.height/2 ? -1 : 1 
                }
            };
        }
        
        return { hasCollision: false };
    }
    
    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y);
        return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
    }
}
