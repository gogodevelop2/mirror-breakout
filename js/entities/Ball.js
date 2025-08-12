/**
 * Ball Entity Class
 * Phaser를 기반으로 한 공 엔티티
 */

class Ball extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, velocityX = 0, velocityY = 0) {
        super(scene, x, y, null);
        
        // 씬에 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 기본 속성 설정
        this.radius = GameConfig.BALL.RADIUS;
        this.speed = GameConfig.BALL.SPEED;
        this.glowRadius = GameConfig.BALL.GLOW_RADIUS;
        
        // 물리 속성 설정
        this.setupPhysics();
        
        // 그래픽 생성
        this.setupGraphics();
        
        // 글로우 이펙트 생성
        this.setupGlowEffect();
        
        // 초기 속도 설정
        if (velocityX !== 0 || velocityY !== 0) {
            this.launch({ x: velocityX, y: velocityY });
        }
        
        // 트레일 이펙트용 이전 위치들
        this.trailPositions = [];
        this.maxTrailLength = 8;
        
        console.log('Ball created at:', { x, y });
    }
    
    /**
     * 물리 속성 설정
     */
    setupPhysics() {
        // 충돌체 설정 (원형)
        this.setCircle(this.radius);
        this.setDisplaySize(this.radius * 2, this.radius * 2);
        
        // 물리 속성
        this.setBounce(GameConfig.PHYSICS.BALL_BOUNCE);
        this.setCollideWorldBounds(true);
        this.setDrag(0); // 저항 없음
        this.setMaxVelocity(GameConfig.BALL.SPEED * 2); // 최대 속도 제한
        
        // 회전 방지 (벽돌깨기에서는 불필요)
        this.setAngularDrag(1000);
        this.setAngularAcceleration(0);
    }
    
    /**
     * 그래픽 설정
     */
    setupGraphics() {
        // 공 텍스처 생성 (한 번만)
        if (!this.scene.textures.exists('ball')) {
            const graphics = this.scene.add.graphics();
            
            // 그라데이션 효과를 위한 다중 원
            const colors = [
                { color: 0xffffff, alpha: 1.0, radius: 0.6 },
                { color: 0xf0f0f0, alpha: 0.9, radius: 0.8 },
                { color: 0xe0e0e0, alpha: 0.8, radius: 1.0 }
            ];
            
            colors.forEach(({ color, alpha, radius }) => {
                graphics.fillStyle(color, alpha);
                graphics.fillCircle(this.radius, this.radius, this.radius * radius);
            });
            
            // 하이라이트 효과
            graphics.fillStyle(0xffffff, 0.6);
            graphics.fillCircle(
                this.radius * 0.7, 
                this.radius * 0.7, 
                this.radius * 0.3
            );
            
            // 텍스처로 변환
            graphics.generateTexture('ball', this.radius * 2, this.radius * 2);
            graphics.destroy();
        }
        
        this.setTexture('ball');
    }
    
    /**
     * 글로우 이펙트 설정
     */
    setupGlowEffect() {
        // 글로우 이펙트 그래픽 객체
        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setDepth(-1);
        this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD);
        
        // 부모-자식 관계 설정은 하지 않음 (수동으로 위치 동기화)
    }
    
    /**
     * 공 발사
     */
    launch(direction, useSpeed = true) {
        let velocity;
        
        if (useSpeed) {
            // 방향 벡터를 정규화하고 속도 적용
            const normalized = VectorMath.normalize(direction);
            velocity = VectorMath.multiply(normalized, this.speed);
        } else {
            // 방향을 그대로 속도로 사용
            velocity = VectorMath.copy(direction);
        }
        
        this.setVelocity(velocity.x, velocity.y);
        
        console.log('Ball launched with velocity:', velocity);
    }
    
    /**
     * 업데이트 루프
     */
    update() {
        if (!this.active) return;
        
        // 최소 각도 보정
        this.correctMinimumAngle();
        
        // 속도 유지
        this.maintainSpeed();
        
        // 글로우 이펙트 업데이트
        this.updateGlowEffect();
        
        // 트레일 업데이트
        this.updateTrail();
        
        // 월드 경계 체크
        this.checkWorldBounds();
    }
    
    /**
     * 최소 각도 보정
     */
    correctMinimumAngle() {
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed === 0) return;
        
        const minAngle = GameConfig.BALL.MIN_ANGLE;
        const normalizedY = Math.abs(velocity.y) / speed;
        
        if (normalizedY < minAngle) {
            // Y 성분이 너무 작으면 보정
            const newY = velocity.y > 0 ? minAngle * speed : -minAngle * speed;
            const newX = Math.sqrt(speed * speed - newY * newY) * Math.sign(velocity.x);
            
            this.setVelocity(newX, newY);
        }
    }
    
    /**
     * 속도 유지 (에너지 보존)
     */
    maintainSpeed() {
        const velocity = this.body.velocity;
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // 목표 속도와 차이가 크면 보정
        const speedDiff = Math.abs(currentSpeed - this.speed);
        if (speedDiff > this.speed * 0.1) {
            if (currentSpeed > 0) {
                const normalized = VectorMath.normalize(velocity);
                const correctedVelocity = VectorMath.multiply(normalized, this.speed);
                this.setVelocity(correctedVelocity.x, correctedVelocity.y);
            }
        }
    }
    
    /**
     * 글로우 이펙트 업데이트
     */
    updateGlowEffect() {
        if (!this.glowGraphics || !this.glowGraphics.scene) return;
        
        this.glowGraphics.clear();
        
        // 방사형 그라데이션 효과 시뮬레이션
        const glowLayers = [
            { radius: this.glowRadius * 0.3, alpha: 0.4 },
            { radius: this.glowRadius * 0.6, alpha: 0.2 },
            { radius: this.glowRadius * 1.0, alpha: 0.1 }
        ];
        
        glowLayers.forEach(({ radius, alpha }) => {
            this.glowGraphics.fillStyle(GameConfig.COLORS.BALL, alpha);
            this.glowGraphics.fillCircle(this.x, this.y, radius);
        });
    }
    
    /**
     * 트레일 이펙트 업데이트
     */
    updateTrail() {
        // 현재 위치를 트레일에 추가
        this.trailPositions.unshift({ x: this.x, y: this.y });
        
        // 최대 길이 초과 시 제거
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.pop();
        }
    }
    
    /**
     * 트레일 그리기
     */
    drawTrail(graphics) {
        if (this.trailPositions.length < 2) return;
        
        graphics.lineStyle(2, GameConfig.COLORS.BALL, 0.3);
        
        for (let i = 1; i < this.trailPositions.length; i++) {
            const alpha = 1 - (i / this.trailPositions.length);
            const pos = this.trailPositions[i];
            const prevPos = this.trailPositions[i - 1];
            
            graphics.lineStyle(Math.max(1, 3 - i * 0.3), GameConfig.COLORS.BALL, alpha * 0.3);
            graphics.lineBetween(prevPos.x, prevPos.y, pos.x, pos.y);
        }
    }
    
    /**
     * 월드 경계 체크
     */
    checkWorldBounds() {
        // 상하 경계를 벗어나면 이벤트 발생
        if (this.y - this.radius < 0) {
            this.scene.events.emit('ballOutOfBounds', this, 'top');
        } else if (this.y + this.radius > GameConfig.CANVAS.HEIGHT) {
            this.scene.events.emit('ballOutOfBounds', this, 'bottom');
        }
    }
    
    /**
     * 충돌 시 호출되는 메서드
     */
    onCollision(other, collisionData) {
        // 충돌 이펙트 생성
        this.createCollisionEffect(collisionData);
        
        // 충돌음 재생 (나중에 구현)
        // this.scene.sound.play('ballHit', { volume: 0.3 });
    }
    
    /**
     * 충돌 이펙트 생성
     */
    createCollisionEffect(collisionData) {
        const effectX = collisionData ? collisionData.x : this.x;
        const effectY = collisionData ? collisionData.y : this.y;
        
        // 간단한 원형 확산 이펙트
        const effect = this.scene.add.graphics();
        effect.setDepth(100);
        
        this.scene.tweens.add({
            targets: { radius: 0, alpha: 1 },
            radius: this.radius * 3,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const { radius, alpha } = tween.targets[0];
                effect.clear();
                effect.lineStyle(2, GameConfig.COLORS.BALL, alpha);
                effect.strokeCircle(effectX, effectY, radius);
            },
            onComplete: () => effect.destroy()
        });
    }
    
    /**
     * 공 제거
     */
    destroy() {
        // 글로우 이펙트 정리
        if (this.glowGraphics) {
            this.glowGraphics.destroy();
            this.glowGraphics = null;
        }
        
        console.log('Ball destroyed');
        super.destroy();
    }
    
    /**
     * 공 복제 (분열용)
     */
    clone(offsetX = 0, offsetY = 0) {
        const newBall = new Ball(
            this.scene,
            this.x + offsetX,
            this.y + offsetY,
            this.body.velocity.x,
            this.body.velocity.y
        );
        
        return newBall;
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            velocity: { x: this.body.velocity.x, y: this.body.velocity.y },
            speed: Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2),
            radius: this.radius,
            active: this.active,
            visible: this.visible
        };
    }
}

/**
 * Ball Factory - 공 생성 헬퍼 클래스
 */
class BallFactory {
    static createPlayerBall(scene, paddleX, paddleY) {
        return new Ball(
            scene,
            paddleX,
            paddleY - GameConfig.BALL.RADIUS - 5,
            3, -4  // 기존과 동일한 초기 속도
        );
    }
    
    static createAIBall(scene, paddleX, paddleY) {
        return new Ball(
            scene,
            paddleX,
            paddleY + GameConfig.BALL.RADIUS + 5,
            -3, 4  // 기존과 동일한 초기 속도 (반대 방향)
        );
    }
    
    static createSplitBall(originalBall, angle = Math.PI / 4) {
        const velocity = originalBall.body.velocity;
        const rotatedVelocity = VectorMath.rotate(velocity, angle);
        const scaledVelocity = VectorMath.multiply(rotatedVelocity, 1.2);
        
        return new Ball(
            originalBall.scene,
            originalBall.x,
            originalBall.y,
            scaledVelocity.x,
            scaledVelocity.y
        );
    }
}
