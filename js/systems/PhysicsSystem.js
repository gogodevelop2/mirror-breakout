/**
 * Physics System
 * 게임 물리 처리 및 충돌 감지 시스템
 * 정밀한 둥근 패들 충돌과 진동 효과 포함
 */

class PhysicsSystem {
    constructor(scene) {
        this.scene = scene;
        this.vibrationSystem = new VibrationSystem(scene);
        
        // 성능 최적화용 임시 벡터들
        this.tempVec1 = VectorMath.create();
        this.tempVec2 = VectorMath.create();
        this.tempVec3 = VectorMath.create();
        
        // 충돌 통계 (디버그용)
        this.collisionStats = {
            ballPaddle: 0,
            ballBrick: 0,
            ballWall: 0
        };
        
        console.log('PhysicsSystem initialized');
    }
    
    /**
     * 물리 시스템 설정
     */
    setup(balls, paddles, bricks) {
        this.balls = balls;
        this.paddles = paddles;
        this.bricks = bricks;
        
        this.setupCollisions();
        this.setupWorldBounds();
    }
    
    /**
     * Phaser 충돌 그룹 설정
     */
    setupCollisions() {
        // 공-패들 충돌 (커스텀 처리)
        if (this.balls && this.paddles.player) {
            this.scene.physics.add.overlap(
                this.balls, 
                this.paddles.player, 
                this.handleBallPaddleCollision.bind(this)
            );
        }
        
        if (this.balls && this.paddles.ai) {
            this.scene.physics.add.overlap(
                this.balls, 
                this.paddles.ai, 
                this.handleBallPaddleCollision.bind(this)
            );
        }
        
        // 공-벽돌 충돌
        if (this.balls && this.bricks.player) {
            this.scene.physics.add.overlap(
                this.balls, 
                this.bricks.player, 
                this.handleBallBrickCollision.bind(this)
            );
        }
        
        if (this.balls && this.bricks.ai) {
            this.scene.physics.add.overlap(
                this.balls, 
                this.bricks.ai, 
                this.handleBallBrickCollision.bind(this)
            );
        }
    }
    
    /**
     * 월드 경계 설정
     */
    setupWorldBounds() {
        // 월드 경계 이벤트 리스너
        this.scene.physics.world.on('worldbounds', (event, body) => {
            if (this.balls && this.balls.children) {
                const ball = this.balls.children.entries.find(b => b.body === body);
                if (ball) {
                    this.handleWorldBounce(ball, event);
                }
            }
        });
        
        // 월드 바운드 활성화
        this.scene.physics.world.setBoundsCollision(true, true, false, false);
    }
    
    /**
     * 공-패들 충돌 처리 (정밀한 둥근 패들 시스템)
     */
    handleBallPaddleCollision(ball, paddle) {
        // 중복 충돌 방지
        if (ball.lastPaddleCollision && 
            this.scene.time.now - ball.lastPaddleCollision < 100) {
            return;
        }
        
        // 정밀한 충돌 감지
        const collision = this.detectPrecisePaddleCollision(ball, paddle);
        
        if (!collision.hasCollision) return;
        
        // 충돌 처리
        this.processPaddleCollision(ball, paddle, collision);
        
        // 충돌 타임스탬프 저장
        ball.lastPaddleCollision = this.scene.time.now;
        
        // 통계 업데이트
        this.collisionStats.ballPaddle++;
        
        console.log(`Ball-Paddle collision: ${collision.type} side`);
    }
    
    /**
     * 정밀한 패들 충돌 감지
     */
    detectPrecisePaddleCollision(ball, paddle) {
        const ballPos = VectorMath.set(this.tempVec1, ball.x, ball.y);
        const ballRadius = ball.radius;
        
        // 패들 위치 (진동 효과 제외)
        const paddlePos = VectorMath.set(
            this.tempVec2, 
            paddle.x - (paddle.vibrationOffset?.x || 0),
            paddle.y - (paddle.vibrationOffset?.y || 0)
        );
        
        // 패들 영역 정의
        const leftCircleCenter = VectorMath.set(
            this.tempVec3,
            paddlePos.x + paddle.cornerRadius,
            paddlePos.y + paddle.cornerRadius
        );
        
        const rightCircleCenter = VectorMath.create(
            paddlePos.x + paddle.paddleWidth - paddle.cornerRadius,
            paddlePos.y + paddle.cornerRadius
        );
        
        const rectArea = {
            x: paddlePos.x + paddle.cornerRadius,
            y: paddlePos.y,
            width: paddle.rectWidth,
            height: paddle.paddleHeight
        };
        
        // 왼쪽 원형 영역 체크
        let leftDist = VectorMath.distance(ballPos, leftCircleCenter);
        if (leftDist <= ballRadius + paddle.cornerRadius) {
            const normal = VectorMath.subtract(ballPos, leftCircleCenter, VectorMath.create());
            VectorMath.normalize(normal, normal);
            
            return {
                hasCollision: true,
                type: 'leftCircle',
                center: VectorMath.copy(leftCircleCenter),
                distance: leftDist,
                normal: normal,
                penetration: (ballRadius + paddle.cornerRadius) - leftDist
            };
        }
        
        // 오른쪽 원형 영역 체크
        let rightDist = VectorMath.distance(ballPos, rightCircleCenter);
        if (rightDist <= ballRadius + paddle.cornerRadius) {
            const normal = VectorMath.subtract(ballPos, rightCircleCenter, VectorMath.create());
            VectorMath.normalize(normal, normal);
            
            return {
                hasCollision: true,
                type: 'rightCircle',
                center: VectorMath.copy(rightCircleCenter),
                distance: rightDist,
                normal: normal,
                penetration: (ballRadius + paddle.cornerRadius) - rightDist
            };
        }
        
        // 중앙 직사각형 영역 체크
        if (ballPos.x >= rectArea.x && 
            ballPos.x <= rectArea.x + rectArea.width) {
            
            const rectCenterY = rectArea.y + rectArea.height / 2;
            const distanceY = Math.abs(ballPos.y - rectCenterY);
            
            if (distanceY <= ballRadius + rectArea.height / 2) {
                const normal = VectorMath.create(
                    0, 
                    ballPos.y < rectCenterY ? -1 : 1
                );
                
                return {
                    hasCollision: true,
                    type: 'rectangle',
                    center: VectorMath.create(ballPos.x, rectCenterY),
                    normal: normal,
                    penetration: (ballRadius + rectArea.height / 2) - distanceY
                };
            }
        }
        
        return { hasCollision: false };
    }
    
    /**
     * 패들 충돌 처리 실행
     */
    processPaddleCollision(ball, paddle, collision) {
        // 1. 공 위치 보정 (겹침 방지)
        this.separateBallFromPaddle(ball, paddle, collision);
        
        // 2. 속도 반사 계산
        const newVelocity = this.calculateReflectedVelocity(ball, paddle, collision);
        
        // 3. 패들 모멘텀 전달
        const momentum = paddle.getMomentumTransfer();
        newVelocity.x += momentum;
        
        // 4. 속도 적용
        ball.setVelocity(newVelocity.x, newVelocity.y);
        
        // 5. 최소 각도 보정
        this.correctMinimumAngle(ball);
        
        // 6. 속도 유지
        this.maintainBallSpeed(ball);
        
        // 7. 진동 효과 트리거
        const intensity = Math.min(VectorMath.length(newVelocity) / GameConfig.BALL.SPEED, 2.0);
        this.vibrationSystem.triggerPaddleHit(paddle, intensity);
        
        // 8. 충돌 이펙트
        ball.onCollision(paddle, collision);
    }
    
    /**
     * 공과 패들 분리 (겹침 방지)
     */
    separateBallFromPaddle(ball, paddle, collision) {
        if (!collision.penetration || collision.penetration <= 0) return;
        
        const pushDistance = collision.penetration + 1; // 1픽셀 여유
        
        ball.x += collision.normal.x * pushDistance;
        ball.y += collision.normal.y * pushDistance;
    }
    
    /**
     * 반사 속도 계산
     */
    calculateReflectedVelocity(ball, paddle, collision) {
        const incident = VectorMath.create(ball.body.velocity.x, ball.body.velocity.y);
        const normal = collision.normal;
        
        // 벡터 반사 공식 적용
        const reflected = VectorMath.reflect(incident, normal, VectorMath.create());
        
        // 에너지 손실 적용
        VectorMath.multiply(reflected, GameConfig.BALL.SPEED_RETENTION, reflected);
        
        return reflected;
    }
    
    /**
     * 최소 각도 보정
     */
    correctMinimumAngle(ball) {
        const velocity = ball.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed === 0) return;
        
        const minAngle = GameConfig.BALL.MIN_ANGLE;
        const normalizedY = Math.abs(velocity.y) / speed;
        
        if (normalizedY < minAngle) {
            const newY = velocity.y > 0 ? minAngle * speed : -minAngle * speed;
            const newX = Math.sqrt(speed * speed - newY * newY) * Math.sign(velocity.x);
            
            ball.setVelocity(newX, newY);
        }
    }
    
    /**
     * 공 속도 유지
     */
    maintainBallSpeed(ball) {
        const velocity = ball.body.velocity;
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const targetSpeed = ball.speed || GameConfig.BALL.SPEED;
        
        if (Math.abs(currentSpeed - targetSpeed) > targetSpeed * 0.1) {
            if (currentSpeed > 0) {
                const scale = targetSpeed / currentSpeed;
                ball.setVelocity(velocity.x * scale, velocity.y * scale);
            }
        }
    }
    
    /**
     * 공-벽돌 충돌 처리
     */
    handleBallBrickCollision(ball, brick) {
        if (brick.isDestroying) return;
        
        // 벽돌 파괴
        const destroyed = brick.takeDamage(1);
        
        if (destroyed) {
            // 진동 효과
            this.vibrationSystem.triggerBrickBreak(brick);
            
            // 점수 이벤트
            this.scene.events.emit('brickDestroyed', {
                brick: brick,
                ball: ball,
                isPlayerSide: brick.isPlayerSide
            });
        }
        
        // 공 반사 (간단한 Y 반전)
        ball.setVelocityY(-ball.body.velocity.y);
        
        // 속도 유지
        this.maintainBallSpeed(ball);
        
        // 충돌 이펙트
        ball.onCollision(brick, { x: brick.x + brick.brickWidth/2, y: brick.y + brick.brickHeight/2 });
        
        // 통계
        this.collisionStats.ballBrick++;
        
        console.log(`Ball-Brick collision: ${brick.isPlayerSide ? 'Player' : 'AI'} side`);
    }
    
    /**
     * 월드 경계 충돌 처리
     */
    handleWorldBounce(ball, event) {
        // 좌우 벽 충돌
        if (event.left || event.right) {
            this.correctMinimumAngle(ball);
            this.maintainBallSpeed(ball);
            this.collisionStats.ballWall++;
        }
        
        // 상하 경계 (게임 오버)
        if (event.up || event.down) {
            this.scene.events.emit('ballOutOfBounds', {
                ball: ball,
                side: event.up ? 'top' : 'bottom'
            });
        }
    }
    
    /**
     * 공 분열 처리
     */
    splitBall(originalBall, angle = Math.PI / 6) {
        if (!originalBall.active) return null;
        
        // 분열 이펙트
        this.createSplitEffect(originalBall);
        
        // 새 공 생성
        const newBall = originalBall.clone(5, -5);
        
        // 새 공 속도 설정 (각도 회전)
        const originalVelocity = VectorMath.create(
            originalBall.body.velocity.x, 
            originalBall.body.velocity.y
        );
        const rotatedVelocity = VectorMath.rotate(originalVelocity, angle);
        VectorMath.multiply(rotatedVelocity, 1.1, rotatedVelocity); // 약간 빠르게
        
        newBall.setVelocity(rotatedVelocity.x, rotatedVelocity.y);
        
        // 원래 공도 반대 방향으로
        const oppositeVelocity = VectorMath.rotate(originalVelocity, -angle);
        VectorMath.multiply(oppositeVelocity, 0.9, oppositeVelocity); // 약간 느리게
        
        originalBall.setVelocity(oppositeVelocity.x, oppositeVelocity.y);
        
        return newBall;
    }
    
    /**
     * 분열 이펙트 생성
     */
    createSplitEffect(ball) {
        const effectColor = 0x00ffff; // 청록색
        
        const effect = this.scene.add.graphics();
        effect.setDepth(15);
        
        this.scene.tweens.add({
            targets: { radius: 0, alpha: 1, rotation: 0 },
            radius: GameConfig.EFFECTS.GLOW.SPLIT_EFFECT_MAX_RADIUS,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 500,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const { radius, alpha, rotation } = tween.targets[0];
                effect.clear();
                
                // 회전하는 스파크 효과
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + rotation;
                    const sparkX = ball.x + Math.cos(angle) * radius * 0.8;
                    const sparkY = ball.y + Math.sin(angle) * radius * 0.8;
                    
                    effect.fillStyle(effectColor, alpha);
                    effect.fillCircle(sparkX, sparkY, 2);
                }
                
                // 중앙 링
                effect.lineStyle(3, effectColor, alpha);
                effect.strokeCircle(ball.x, ball.y, radius);
            },
            onComplete: () => effect.destroy()
        });
    }
    
    /**
     * 물리 시스템 업데이트
     */
    update(deltaTime) {
        // 진동 시스템 업데이트
        this.vibrationSystem.update(deltaTime);
        
        // 공들 개별 업데이트
        if (this.balls && this.balls.children) {
            this.balls.children.entries.forEach(ball => {
                if (ball.active) {
                    ball.update();
                }
            });
        }
        
        // 패들들 업데이트
        if (this.paddles) {
            Object.values(this.paddles).forEach(paddle => {
                if (paddle && paddle.active) {
                    paddle.update();
                }
            });
        }
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            collisionStats: { ...this.collisionStats },
            activeBalls: this.balls ? this.balls.children.entries.length : 0,
            vibrationSystem: this.vibrationSystem.getDebugInfo()
        };
    }
    
    /**
     * 시스템 리셋
     */
    reset() {
        this.collisionStats = {
            ballPaddle: 0,
            ballBrick: 0,
            ballWall: 0
        };
        
        this.vibrationSystem.reset();
    }
    
    /**
     * 정리
     */
    destroy() {
        if (this.vibrationSystem) {
            this.vibrationSystem.destroy();
        }
        
        console.log('PhysicsSystem destroyed');
    }
}

/**
 * 진동 효과 시스템
 */
class VibrationSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeVibrations = [];
        this.gameContainer = document.getElementById('game-container');
    }
    
    /**
     * 패들 충돌 진동
     */
    triggerPaddleHit(paddle, intensity = 1.0) {
        // 패들 자체 진동
        if (paddle.triggerVibration) {
            paddle.triggerVibration(intensity, GameConfig.TIMING.VIBRATION_PADDLE_HIT);
        }
        
        // 카메라 셰이크
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(
                GameConfig.EFFECTS.VIBRATION.CAMERA_SHAKE_DURATION,
                GameConfig.EFFECTS.VIBRATION.CAMERA_SHAKE_INTENSITY * intensity
            );
        }
        
        // 화면 진동
        this.addScreenVibration({
            type: 'paddle',
            intensity: intensity,
            duration: GameConfig.TIMING.VIBRATION_PADDLE_HIT
        });
    }
    
    /**
     * 벽돌 파괴 진동
     */
    triggerBrickBreak(brick, intensity = 0.8) {
        // 더 부드러운 카메라 셰이크
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(
                GameConfig.TIMING.VIBRATION_BRICK_BREAK,
                GameConfig.EFFECTS.VIBRATION.CAMERA_SHAKE_INTENSITY * intensity * 0.8
            );
        }
        
        // 화면 진동
        this.addScreenVibration({
            type: 'brick',
            intensity: intensity,
            duration: GameConfig.TIMING.VIBRATION_BRICK_BREAK
        });
    }
    
    /**
     * 화면 진동 추가
     */
    addScreenVibration(vibration) {
        this.activeVibrations.push({
            ...vibration,
            startTime: Date.now(),
            currentOffset: { x: 0, y: 0 }
        });
    }
    
    /**
     * 진동 시스템 업데이트
     */
    update(deltaTime) {
        if (this.activeVibrations.length === 0) return;
        
        const now = Date.now();
        let totalOffsetX = 0;
        let totalOffsetY = 0;
        
        // 활성 진동들 처리
        this.activeVibrations = this.activeVibrations.filter(vib => {
            const elapsed = now - vib.startTime;
            
            if (elapsed >= vib.duration) {
                return false; // 제거
            }
            
            const progress = elapsed / vib.duration;
            const fadeOut = 1 - progress;
            
            // 진동 패턴
            let offsetX = 0, offsetY = 0;
            
            if (vib.type === 'paddle') {
                offsetX = Math.sin(elapsed * 0.02) * vib.intensity * 2 * fadeOut;
                offsetY = Math.cos(elapsed * 0.025) * vib.intensity * 1 * fadeOut;
            } else if (vib.type === 'brick') {
                const pulse = Math.sin(elapsed * 0.015);
                offsetX = pulse * vib.intensity * 1 * fadeOut;
                offsetY = pulse * vib.intensity * 0.5 * fadeOut;
            }
            
            totalOffsetX += offsetX;
            totalOffsetY += offsetY;
            
            return true; // 유지
        });
        
        // 화면 변형 적용
        if (this.gameContainer) {
            this.gameContainer.style.transform = 
                `translate(${totalOffsetX}px, ${totalOffsetY}px)`;
        }
    }
    
    /**
     * 진동 시스템 리셋
     */
    reset() {
        this.activeVibrations = [];
        if (this.gameContainer) {
            this.gameContainer.style.transform = 'translate(0px, 0px)';
        }
    }
    
    /**
     * 디버그 정보
     */
    getDebugInfo() {
        return {
            activeVibrations: this.activeVibrations.length,
            types: this.activeVibrations.map(v => v.type)
        };
    }
    
    /**
     * 정리
     */
    destroy() {
        this.reset();
    }
}
