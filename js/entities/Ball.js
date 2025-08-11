// 공 엔티티 클래스
class Ball extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ball');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 물리 설정
        this.setCircle(8, 8, 8); // 원형 충돌 박스 설정 (중요!)
        this.setCollideWorldBounds(true);
        this.setBounce(1, 1); // 완전 탄성 충돌
        this.setDamping(false); // 감속 없음
        this.body.allowGravity = false;
        
        // 크기 조정 (텍스처가 32x32이므로 원하는 크기로 스케일)
        this.setScale(0.5); // 16x16 크기로 조정
        
        // 커스텀 속성
        this.minSpeed = 300;
        this.maxSpeed = 600;
        this.currentSpeed = 400;
        
        // 시각 효과
        this.createEffects();
        
        // 트레일 효과를 위한 이전 위치 저장
        this.previousPositions = [];
        this.maxTrailLength = 5;
    }
    
    createEffects() {
        // 글로우 효과
        this.preFX.addGlow(0xffffff, 2, 0, false, 0.1, 10);
        
        // 트레일 효과를 위한 그래픽 객체
        this.trailGraphics = this.scene.add.graphics();
        this.trailGraphics.setDepth(this.depth - 1);
    }
    
    launch(angle = null) {
        // 랜덤 또는 지정된 각도로 발사
        if (angle === null) {
            // -60도에서 60도 사이의 랜덤 각도 (위쪽)
            angle = Phaser.Math.FloatBetween(-Math.PI/3, Math.PI/3) - Math.PI/2;
        }
        
        const velocity = VectorMath.angleToVector(angle, this.currentSpeed);
        this.setVelocity(velocity.x, velocity.y);
    }
    
    hitPaddle(paddle) {
        // 패들과의 충돌 처리 (더 정확한 물리)
        const ballX = this.x;
        const paddleX = paddle.x;
        const paddleWidth = paddle.displayWidth;
        
        // 패들 중심으로부터의 상대 위치 (-1 ~ 1)
        const relativePosition = (ballX - paddleX) / (paddleWidth / 2);
        const clampedPosition = Phaser.Math.Clamp(relativePosition, -1, 1);
        
        // 반사 각도 계산 (최대 60도)
        const maxBounceAngle = Math.PI / 3; // 60도
        const bounceAngle = clampedPosition * maxBounceAngle;
        
        // 패들의 움직임 고려
        const paddleVelocity = paddle.body.velocity.x;
        const momentumTransfer = paddleVelocity * 0.2;
        
        // 새로운 속도 계산
        const speed = this.currentSpeed * 1.02; // 약간의 가속
        const newVelocityX = Math.sin(bounceAngle) * speed + momentumTransfer;
        const newVelocityY = -Math.abs(Math.cos(bounceAngle) * speed);
        
        // Y 방향 조정 (패들 위치에 따라)
        if (paddle.y < this.scene.cameras.main.height / 2) {
            // 상단 패들 - 아래로
            this.setVelocity(newVelocityX, Math.abs(newVelocityY));
        } else {
            // 하단 패들 - 위로
            this.setVelocity(newVelocityX, -Math.abs(newVelocityY));
        }
        
        // 속도 제한
        this.limitSpeed();
        
        // 최소 각도 보정
        const velocity = { x: this.body.velocity.x, y: this.body.velocity.y };
        const correctedVelocity = VectorMath.ensureMinimumAngle(velocity);
        this.setVelocity(correctedVelocity.x, correctedVelocity.y);
        
        // 히트 효과
        this.createHitEffect();
    }
    
    hitBrick() {
        // 벽돌과의 충돌 처리
        // 단순 반사 (Phaser가 자동 처리하지만 효과 추가)
        this.currentSpeed = Math.min(this.currentSpeed * 1.01, this.maxSpeed);
        
        // 히트 효과
        this.createHitEffect();
    }
    
    hitWall() {
        // 벽과의 충돌 처리
        // 속도 유지하면서 반사
        const velocity = { x: this.body.velocity.x, y: this.body.velocity.y };
        const correctedVelocity = VectorMath.ensureMinimumAngle(velocity);
        this.setVelocity(correctedVelocity.x, correctedVelocity.y);
    }
    
    limitSpeed() {
        const velocity = { x: this.body.velocity.x, y: this.body.velocity.y };
        const limited = VectorMath.limitSpeed(velocity, this.maxSpeed);
        
        // 최소 속도 보장
        const speed = Math.sqrt(limited.x * limited.x + limited.y * limited.y);
        if (speed < this.minSpeed) {
            const scale = this.minSpeed / speed;
            this.setVelocity(limited.x * scale, limited.y * scale);
        } else {
            this.setVelocity(limited.x, limited.y);
        }
    }
    
    createHitEffect() {
        // 충돌 시 시각 효과
        this.scene.tweens.add({
            targets: this,
            scale: { from: 0.5, to: 0.6 },
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    }
    
    updateTrail() {
        // 트레일 효과 업데이트
        this.previousPositions.push({ x: this.x, y: this.y });
        if (this.previousPositions.length > this.maxTrailLength) {
            this.previousPositions.shift();
        }
        
        // 트레일 그리기
        this.trailGraphics.clear();
        this.previousPositions.forEach((pos, index) => {
            const alpha = (index / this.maxTrailLength) * 0.3;
            const size = (index / this.maxTrailLength) * 6 + 2;
            this.trailGraphics.fillStyle(0xffffff, alpha);
            this.trailGraphics.fillCircle(pos.x, pos.y, size);
        });
    }
    
    update() {
        // 매 프레임 업데이트
        this.updateTrail();
        this.limitSpeed();
        
        // 버그 방지: 너무 느려지면 재발사
        const speed = Math.sqrt(
            this.body.velocity.x * this.body.velocity.x + 
            this.body.velocity.y * this.body.velocity.y
        );
        if (speed < this.minSpeed * 0.5) {
            this.launch();
        }
    }
    
    reset(x, y) {
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.previousPositions = [];
        this.trailGraphics.clear();
        this.currentSpeed = 400;
    }
}
