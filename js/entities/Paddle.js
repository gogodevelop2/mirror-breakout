// 패들 엔티티 클래스
class Paddle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'player') {
        const textureKey = type === 'player' ? 'paddlePlayer' : 'paddleAI';
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 물리 설정
        this.setImmovable(true);
        this.body.allowGravity = false;
        this.setCollideWorldBounds(true);
        
        // 타입별 설정
        this.type = type;
        this.speed = type === 'player' 
            ? GAME_CONFIG.PADDLE.PLAYER.SPEED 
            : GAME_CONFIG.PADDLE.AI.BASE_SPEED;
        
        // 부드러운 움직임을 위한 속성
        this.targetX = x;
        this.velocity = 0;
        this.acceleration = type === 'player' ? 15 : 10;
        this.friction = 0.85;
        
        // 히트 효과를 위한 속성
        this.isHit = false;
        this.hitTimer = 0;
    }
    
    moveLeft() {
        if (this.type === 'player') {
            this.velocity -= this.acceleration;
            this.velocity = Math.max(-this.speed, this.velocity);
        }
    }
    
    moveRight() {
        if (this.type === 'player') {
            this.velocity += this.acceleration;
            this.velocity = Math.min(this.speed, this.velocity);
        }
    }
    
    stop() {
        this.velocity *= this.friction;
        if (Math.abs(this.velocity) < 0.1) {
            this.velocity = 0;
        }
    }
    
    setTargetX(x) {
        // AI 패들용 목표 위치 설정
        this.targetX = x;
    }
    
    update(delta) {
        if (this.type === 'player') {
            // 플레이어 패들 업데이트
            this.x += this.velocity * (delta / 1000) * 60;
            
            // 경계 체크
            const halfWidth = this.displayWidth / 2;
            this.x = Phaser.Math.Clamp(
                this.x, 
                halfWidth, 
                this.scene.cameras.main.width - halfWidth
            );
            
            // 물리 바디 위치 동기화
            this.body.position.x = this.x - this.body.halfWidth;
        } else {
            // AI 패들 업데이트 (부드러운 추적)
            const diff = this.targetX - this.x;
            const distance = Math.abs(diff);
            
            if (distance > 2) {
                const moveSpeed = Math.min(distance * 0.1, this.speed);
                this.velocity = diff > 0 ? moveSpeed : -moveSpeed;
                
                this.x += this.velocity * (delta / 1000) * 60;
                
                // 경계 체크
                const halfWidth = this.displayWidth / 2;
                this.x = Phaser.Math.Clamp(
                    this.x, 
                    halfWidth, 
                    this.scene.cameras.main.width - halfWidth
                );
                
                // 물리 바디 위치 동기화
                this.body.position.x = this.x - this.body.halfWidth;
            }
        }
        
        // 히트 효과 타이머 업데이트
        if (this.hitTimer > 0) {
            this.hitTimer -= delta;
            if (this.hitTimer <= 0) {
                this.clearTint();
                this.setScale(1, 1);
            }
        }
    }
    
    onHit() {
        // 공과 충돌했을 때 효과
        this.isHit = true;
        this.hitTimer = 100;
        
        // 색상 변화
        this.setTint(0xffffff);
        
        // 스케일 애니메이션
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        // 파티클 효과
        const color = this.type === 'player' ? 0x4488ff : 0xff4488;
        this.createHitParticles(color);
    }
    
    createHitParticles(color) {
        // 충돌 지점에 파티클 생성
        const emitter = this.scene.add.particles(this.x, this.y, 'ball', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            quantity: 3,
            tint: color
        });
        
        this.scene.time.delayedCall(500, () => {
            emitter.destroy();
        });
    }
    
    reset() {
        this.x = this.scene.cameras.main.width / 2;
        this.velocity = 0;
        this.targetX = this.x;
        this.clearTint();
        this.setScale(1, 1);
        this.hitTimer = 0;
    }
}
