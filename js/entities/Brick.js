/**
 * Brick Entity Class
 * 개선된 시각 효과와 파괴 애니메이션을 가진 벽돌 엔티티
 */

class Brick extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, row, col, isPlayerSide) {
        super(scene, x, y, null);
        
        // 씬에 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 기본 속성
        this.row = row;
        this.col = col;
        this.isPlayerSide = isPlayerSide;
        this.brickWidth = GameConfig.BRICK.WIDTH;
        this.brickHeight = GameConfig.BRICK.HEIGHT;
        
        // 색상 계산
        this.brickColor = this.calculateBrickColor();
        
        // 물리 설정
        this.setupPhysics();
        
        // 그래픽 생성
        this.setupGraphics();
        
        // 스폰 효과
        this.playSpawnAnimation();
        
        // 상태
        this.isDestroying = false;
        this.health = 1; // 나중에 다중 히트 벽돌 확장 가능
        
        console.log(`Brick created at [${row}, ${col}] - ${isPlayerSide ? 'Player' : 'AI'} side`);
    }
    
    /**
     * 물리 속성 설정
     */
    setupPhysics() {
        // 충돌체 설정
        this.setSize(this.brickWidth, this.brickHeight);
        this.setDisplaySize(this.brickWidth, this.brickHeight);
        
        // 물리 속성
        this.setImmovable(true);
        this.body.setCollideWorldBounds(false);
        
        // 벽돌은 움직이지 않음
        this.setVelocity(0, 0);
        this.setAcceleration(0, 0);
    }
    
    /**
     * 벽돌 색상 계산 (기존 HSL 시스템 유지)
     */
    calculateBrickColor() {
        const baseHue = this.isPlayerSide ? 
            GameConfig.COLORS.BRICK_HUE_PLAYER : 
            GameConfig.COLORS.BRICK_HUE_AI;
        
        const hue = baseHue + this.row * 10; // 행별로 색조 변화
        const saturation = GameConfig.COLORS.BRICK_SATURATION;
        const lightness = GameConfig.COLORS.BRICK_LIGHTNESS;
        
        // HSL을 RGB로 변환
        const color = Phaser.Display.Color.HSLToColor(hue / 360, saturation / 100, lightness / 100);
        return color.color;
    }
    
    /**
     * 그래픽 설정
     */
    setupGraphics() {
        const textureName = `brick_${this.isPlayerSide ? 'player' : 'ai'}_${this.row}`;
        
        // 해당 행의 텍스처가 없으면 생성
        if (!this.scene.textures.exists(textureName)) {
            this.createBrickTexture(textureName);
        }
        
        this.setTexture(textureName);
    }
    
    /**
     * 벽돌 텍스처 생성
     */
    createBrickTexture(textureName) {
        const graphics = this.scene.add.graphics();
        const width = this.brickWidth;
        const height = this.brickHeight;
        
        // 메인 벽돌 색상
        graphics.fillStyle(this.brickColor);
        graphics.fillRect(0, 0, width, height);
        
        // 상단 하이라이트 (입체감)
        const highlightColor = Phaser.Display.Color.Lighten(
            Phaser.Display.Color.IntegerToColor(this.brickColor), 30
        );
        graphics.fillStyle(Phaser.Display.Color.GetColor32(highlightColor));
        graphics.fillRect(0, 0, width, height * 0.3);
        
        // 좌측 하이라이트
        graphics.fillRect(0, 0, width * 0.15, height);
        
        // 하단 그림자
        const shadowColor = Phaser.Display.Color.Darken(
            Phaser.Display.Color.IntegerToColor(this.brickColor), 30
        );
        graphics.fillStyle(Phaser.Display.Color.GetColor32(shadowColor));
        graphics.fillRect(0, height * 0.7, width, height * 0.3);
        
        // 우측 그림자
        graphics.fillRect(width * 0.85, 0, width * 0.15, height);
        
        // 테두리
        graphics.lineStyle(1, 0x000000, 0.2);
        graphics.strokeRect(0, 0, width, height);
        
        // 내부 테두리 (베벨 효과)
        graphics.lineStyle(1, 0xffffff, 0.3);
        graphics.strokeRect(1, 1, width - 2, height - 2);
        
        // 텍스처로 변환
        graphics.generateTexture(textureName, width, height);
        graphics.destroy();
    }
    
    /**
     * 스폰 애니메이션
     */
    playSpawnAnimation() {
        // 초기 상태 설정
        this.setScale(0);
        this.setAlpha(0.5);
        
        // 스케일 애니메이션
        this.scene.tweens.add({
            targets: this,
            scaleX: { from: 0, to: 1 },
            scaleY: { from: 0, to: 1 },
            alpha: { from: 0.5, to: 1 },
            duration: GameConfig.TIMING.BRICK_SPAWN_EFFECT_DURATION,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.setScale(1);
                this.setAlpha(1);
            }
        });
        
        // 스폰 이펙트 (원형 확산)
        this.createSpawnEffect();
    }
    
    /**
     * 스폰 이펙트 생성
     */
    createSpawnEffect() {
        const effectColor = this.isPlayerSide ? 
            GameConfig.COLORS.PLAYER : 
            GameConfig.COLORS.AI_MIN;
        
        const centerX = this.x + this.brickWidth / 2;
        const centerY = this.y + this.brickHeight / 2;
        
        const effect = this.scene.add.graphics();
        effect.setDepth(10);
        
        // 확산 애니메이션
        this.scene.tweens.add({
            targets: { radius: 0, alpha: 1 },
            radius: GameConfig.EFFECTS.GLOW.BRICK_SPAWN_MAX_RADIUS,
            alpha: 0,
            duration: GameConfig.TIMING.BRICK_SPAWN_EFFECT_DURATION,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const { radius, alpha } = tween.targets[0];
                effect.clear();
                effect.lineStyle(3, effectColor, alpha);
                effect.strokeCircle(centerX, centerY, radius);
                
                // 내부 펄스 효과
                if (radius < 15) {
                    effect.fillStyle(effectColor, alpha * 0.3);
                    effect.fillCircle(centerX, centerY, radius * 0.5);
                }
            },
            onComplete: () => effect.destroy()
        });
    }
    
    /**
     * 벽돌 파괴 (공이나 특수 효과에 의해)
     */
    destroy(showEffect = true) {
        if (this.isDestroying) return;
        
        this.isDestroying = true;
        
        if (showEffect) {
            this.playDestroyAnimation(() => {
                this.finalDestroy();
            });
        } else {
            this.finalDestroy();
        }
        
        // 파괴 이벤트 발생
        this.scene.events.emit('brickDestroyed', {
            brick: this,
            row: this.row,
            col: this.col,
            isPlayerSide: this.isPlayerSide,
            color: this.brickColor
        });
    }
    
    /**
     * 파괴 애니메이션
     */
    playDestroyAnimation(onComplete) {
        // 파티클 효과
        this.createDestroyParticles();
        
        // 벽돌 사라지는 애니메이션
        this.scene.tweens.add({
            targets: this,
            scaleX: { from: 1, to: 0 },
            scaleY: { from: 1, to: 0 },
            alpha: { from: 1, to: 0 },
            angle: { from: 0, to: 180 },
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: onComplete
        });
        
        // 충격파 효과
        this.createShockwave();
    }
    
    /**
     * 파괴 파티클 생성
     */
    createDestroyParticles() {
        const centerX = this.x + this.brickWidth / 2;
        const centerY = this.y + this.brickHeight / 2;
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            const size = 2 + Math.random() * 3;
            
            const particle = this.scene.add.graphics();
            particle.fillStyle(this.brickColor);
            particle.fillRect(-size/2, -size/2, size, size);
            particle.setPosition(centerX, centerY);
            particle.setDepth(5);
            
            // 파티클 날아가는 애니메이션
            this.scene.tweens.add({
                targets: particle,
                x: centerX + Math.cos(angle) * speed,
                y: centerY + Math.sin(angle) * speed,
                scaleX: { from: 1, to: 0 },
                scaleY: { from: 1, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: 400 + Math.random() * 200,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * 충격파 효과
     */
    createShockwave() {
        const centerX = this.x + this.brickWidth / 2;
        const centerY = this.y + this.brickHeight / 2;
        
        const shockwave = this.scene.add.graphics();
        shockwave.setDepth(8);
        
        this.scene.tweens.add({
            targets: { radius: 0, alpha: 0.8 },
            radius: 40,
            alpha: 0,
            duration: 250,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const { radius, alpha } = tween.targets[0];
                shockwave.clear();
                shockwave.lineStyle(2, this.brickColor, alpha);
                shockwave.strokeCircle(centerX, centerY, radius);
            },
            onComplete: () => shockwave.destroy()
        });
    }
    
    /**
     * 최종 파괴 처리
     */
    finalDestroy() {
        console.log(`Brick destroyed at [${this.row}, ${this.col}]`);
        super.destroy();
    }
    
    /**
     * 벽돌 데미지 처리 (확장 가능)
     */
    takeDamage(damage = 1) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.destroy(true);
            return true; // 파괴됨
        } else {
            // 데미지 효과 (깜빡임)
            this.playDamageEffect();
            return false; // 아직 살아있음
        }
    }
    
    /**
     * 데미지 효과 (깜빡임)
     */
    playDamageEffect() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 100,
            ease: 'Power2.easeOut',
            yoyo: true,
            repeat: 2
        });
        
        // 색상 플래시
        this.setTint(0xffffff);
        this.scene.time.delayedCall(150, () => {
            this.clearTint();
        });
    }
    
    /**
     * 벽돌 펄스 효과 (특수 벽돌용)
     */
    playPulseEffect() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1 // 무한 반복
        });
    }
    
    /**
     * 그리드 위치 정보 반환
     */
    getGridPosition() {
        return {
            row: this.row,
            col: this.col,
            isPlayerSide: this.isPlayerSide
        };
    }
    
    /**
     * 벽돌 타입 확인
     */
    getBrickType() {
        // 나중에 다양한 벽돌 타입 확장 가능
        return {
            type: 'normal',
            health: this.health,
            maxHealth: 1,
            color: this.brickColor,
            row: this.row
        };
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            gridPos: { row: this.row, col: this.col },
            side: this.isPlayerSide ? 'Player' : 'AI',
            color: this.brickColor,
            health: this.health,
            isDestroying: this.isDestroying,
            size: { width: this.brickWidth, height: this.brickHeight }
        };
    }
}

/**
 * Brick Factory - 벽돌 생성 헬퍼 클래스
 */
class BrickFactory {
    /**
     * 랜덤 벽돌 패턴 생성 (기존 로직 유지)
     */
    static generateRandomPattern() {
        const pattern = [];
        const totalBricks = GameConfig.BRICK.ROWS * GameConfig.BRICK.COLS;
        
        // 기본 확률로 벽돌 생성
        for (let i = 0; i < totalBricks; i++) {
            const hasBrick = Math.random() < GameConfig.BRICK.SPAWN_PROBABILITY;
            pattern.push(hasBrick);
        }
        
        // 최소 벽돌 수 보장
        const currentBricks = pattern.filter(Boolean).length;
        const minBricks = GameConfig.CALCULATED.MIN_BRICKS;
        
        if (currentBricks < minBricks) {
            const emptyPositions = pattern
                .map((hasBrick, index) => hasBrick ? -1 : index)
                .filter(index => index !== -1);
                
            const needToAdd = minBricks - currentBricks;
            
            for (let i = 0; i < needToAdd && emptyPositions.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                const position = emptyPositions.splice(randomIndex, 1)[0];
                pattern[position] = true;
            }
        }
        
        return pattern;
    }
    
    /**
     * 단일 벽돌 생성
     */
    static createBrick(scene, row, col, isPlayerSide) {
        const x = col * GameConfig.BRICK.SPACING_X + GameConfig.BRICK.START_OFFSET_X;
        const y = isPlayerSide ? 
            row * GameConfig.BRICK.SPACING_Y + GameConfig.BRICK.START_OFFSET_Y_PLAYER :
            GameConfig.CANVAS.HEIGHT - (row * GameConfig.BRICK.SPACING_Y + GameConfig.BRICK.START_OFFSET_Y_AI);
        
        return new Brick(scene, x, y, row, col, isPlayerSide);
    }
    
    /**
     * 벽돌 그룹 생성
     */
    static createBrickGroup(scene, pattern, isPlayerSide) {
        const bricks = [];
        
        for (let i = 0; i < pattern.length; i++) {
            if (!pattern[i]) continue;
            
            const row = Math.floor(i / GameConfig.BRICK.COLS);
            const col = i % GameConfig.BRICK.COLS;
            
            const brick = this.createBrick(scene, row, col, isPlayerSide);
            bricks.push(brick);
        }
        
        return bricks;
    }
    
    /**
     * 특수 벽돌 생성 (확장용)
     */
    static createSpecialBrick(scene, row, col, isPlayerSide, specialType = 'strong') {
        const brick = this.createBrick(scene, row, col, isPlayerSide);
        
        switch (specialType) {
            case 'strong':
                brick.health = 2;
                brick.setTint(0xffff99); // 노란색 틴트
                break;
            case 'explosive':
                brick.explosiveRadius = 2;
                brick.setTint(0xff9999); // 빨간색 틴트
                brick.playPulseEffect();
                break;
            case 'regenerating':
                brick.canRegenerate = true;
                brick.setTint(0x99ff99); // 녹색 틴트
                break;
        }
        
        return brick;
    }
}
