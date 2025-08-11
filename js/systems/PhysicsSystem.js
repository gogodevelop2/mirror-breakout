// 물리 시스템 - 게임의 물리 연산 관리
class PhysicsSystem {
    constructor(scene) {
        this.scene = scene;
        
        // 물리 상수
        this.gravity = 0;
        this.friction = 0.99;
        this.restitution = 1.0; // 완전 탄성 충돌
        
        // 충돌 그룹 설정
        this.setupCollisionGroups();
    }
    
    setupCollisionGroups() {
        // Phaser 물리 월드 설정
        this.scene.physics.world.setBounds(0, 0, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height
        );
        
        // 충돌 경계에서 이벤트 발생
        this.scene.physics.world.on('worldbounds', this.onWorldBounds, this);
    }
    
    // 공과 패들 충돌 물리 계산
    calculateBallPaddleCollision(ball, paddle) {
        const ballX = ball.x;
        const ballY = ball.y;
        const paddleX = paddle.x;
        const paddleY = paddle.y;
        const paddleWidth = paddle.displayWidth;
        const paddleHeight = paddle.displayHeight;
        
        // 패들 중심으로부터의 상대 위치 계산
        const relativeX = (ballX - paddleX) / (paddleWidth / 2);
        const clampedX = Phaser.Math.Clamp(relativeX, -1, 1);
        
        // 반사 각도 계산 (최대 60도)
        const maxBounceAngle = Math.PI / 3;
        const bounceAngle = clampedX * maxBounceAngle;
        
        // 패들의 속도 가져오기
        const paddleVelocity = paddle.body ? paddle.body.velocity.x : 0;
        
        // 현재 공 속도
        const currentSpeed = Math.sqrt(
            ball.body.velocity.x * ball.body.velocity.x + 
            ball.body.velocity.y * ball.body.velocity.y
        );
        
        // 새로운 속도 계산
        const speedMultiplier = 1.02; // 약간의 가속
        const newSpeed = Math.min(currentSpeed * speedMultiplier, GAME_CONFIG.BALL.MAX_SPEED);
        
        // 모멘텀 전달
        const momentumTransfer = paddleVelocity * 0.2;
        
        // 새로운 속도 벡터
        let newVelocityX = Math.sin(bounceAngle) * newSpeed + momentumTransfer;
        let newVelocityY;
        
        // Y 방향 결정 (패들 위치에 따라)
        if (paddleY < this.scene.cameras.main.height / 2) {
            // 상단 패들 - 아래로
            newVelocityY = Math.abs(Math.cos(bounceAngle) * newSpeed);
        } else {
            // 하단 패들 - 위로
            newVelocityY = -Math.abs(Math.cos(bounceAngle) * newSpeed);
        }
        
        return { x: newVelocityX, y: newVelocityY };
    }
    
    // 공과 벽돌 충돌 물리 계산
    calculateBallBrickCollision(ball, brick) {
        const ballX = ball.x;
        const ballY = ball.y;
        const ballRadius = ball.displayWidth / 2;
        
        const brickX = brick.x;
        const brickY = brick.y;
        const brickWidth = brick.displayWidth;
        const brickHeight = brick.displayHeight;
        
        // 충돌 면 판정
        const brickLeft = brickX - brickWidth / 2;
        const brickRight = brickX + brickWidth / 2;
        const brickTop = brickY - brickHeight / 2;
        const brickBottom = brickY + brickHeight / 2;
        
        // 공의 이전 위치 (프레임 기준)
        const prevX = ballX - ball.body.velocity.x * 0.016; // 60fps 기준
        const prevY = ballY - ball.body.velocity.y * 0.016;
        
        let normal = { x: 0, y: 0 };
        
        // 어느 면에서 충돌했는지 판정
        if (prevY < brickTop && ball.body.velocity.y > 0) {
            // 위쪽 면
            normal = { x: 0, y: -1 };
        } else if (prevY > brickBottom && ball.body.velocity.y < 0) {
            // 아래쪽 면
            normal = { x: 0, y: 1 };
        } else if (prevX < brickLeft && ball.body.velocity.x > 0) {
            // 왼쪽 면
            normal = { x: -1, y: 0 };
        } else if (prevX > brickRight && ball.body.velocity.x < 0) {
            // 오른쪽 면
            normal = { x: 1, y: 0 };
        } else {
            // 모서리 충돌 - 가장 가까운 면으로 반사
            const dx = ballX - brickX;
            const dy = ballY - brickY;
            if (Math.abs(dx) > Math.abs(dy)) {
                normal = { x: Math.sign(dx), y: 0 };
            } else {
                normal = { x: 0, y: Math.sign(dy) };
            }
        }
        
        // 반사 벡터 계산
        const velocity = { x: ball.body.velocity.x, y: ball.body.velocity.y };
        const reflected = VectorMath.reflect(velocity, normal);
        
        // 약간의 가속
        const speedMultiplier = 1.01;
        
        return {
            x: reflected.x * speedMultiplier,
            y: reflected.y * speedMultiplier
        };
    }
    
    // 벽 충돌 처리
    onWorldBounds(body, up, down, left, right) {
        const gameObject = body.gameObject;
        
        if (gameObject && gameObject instanceof Ball) {
            // 벽 충돌 시 각도 보정
            const velocity = { x: body.velocity.x, y: body.velocity.y };
            
            // 너무 평평한 각도 방지
            const corrected = VectorMath.ensureMinimumAngle(velocity, 0.3);
            
            gameObject.setVelocity(corrected.x, corrected.y);
            gameObject.hitWall();
        }
    }
    
    // 충돌 응답 적용
    applyCollisionResponse(ball, velocity) {
        // 속도 제한
        const limited = VectorMath.limitSpeed(velocity, GAME_CONFIG.BALL.MAX_SPEED);
        
        // 최소 속도 보장
        const speed = Math.sqrt(limited.x * limited.x + limited.y * limited.y);
        const minSpeed = 300;
        
        if (speed < minSpeed) {
            const scale = minSpeed / speed;
            ball.setVelocity(limited.x * scale, limited.y * scale);
        } else {
            ball.setVelocity(limited.x, limited.y);
        }
    }
    
    // 예측 시뮬레이션 (AI용)
    predictBallPath(ball, timeSteps = 100) {
        const path = [];
        let x = ball.x;
        let y = ball.y;
        let vx = ball.body.velocity.x;
        let vy = ball.body.velocity.y;
        
        const dt = 0.016; // 60fps
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        for (let i = 0; i < timeSteps; i++) {
            // 위치 업데이트
            x += vx * dt;
            y += vy * dt;
            
            // 벽 반사 체크
            if (x <= 0 || x >= width) {
                vx = -vx;
                x = Phaser.Math.Clamp(x, 0, width);
            }
            if (y <= 0 || y >= height) {
                vy = -vy;
                y = Phaser.Math.Clamp(y, 0, height);
            }
            
            path.push({ x, y, vx, vy });
        }
        
        return path;
    }
    
    // 디버그 정보 표시
    showDebugInfo() {
        if (!this.debugGraphics) {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(1000);
        }
        
        this.debugGraphics.clear();
        
        // 충돌 박스 표시
        this.scene.physics.world.bodies.entries.forEach(body => {
            this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
            
            if (body.isCircle) {
                this.debugGraphics.strokeCircle(
                    body.position.x + body.halfWidth,
                    body.position.y + body.halfHeight,
                    body.halfWidth
                );
            } else {
                this.debugGraphics.strokeRect(
                    body.position.x,
                    body.position.y,
                    body.width,
                    body.height
                );
            }
        });
    }
    
    // 시스템 리셋
    reset() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }
}
