// 물리 엔진 관리 시스템
class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.config = GameConfig.gameplay;
        this.physicsConfig = GameConfig.physics;
        
        this.init();
    }

    init() {
        // Matter.js 물리 월드 설정
        this.setupPhysicsWorld();
        
        // 충돌 카테고리 정의
        this.setupCollisionCategories();
        
        // 충돌 이벤트 리스너 설정
        this.setupCollisionEvents();
    }

    setupPhysicsWorld() {
        const { width, height } = this.scene.sys.game.config;
        
        // 월드 경계 설정 (벽 생성하지 않음 - 수동으로 처리)
        this.scene.matter.world.setBounds(0, 0, width, height, 32, false);
        
        // 중력 제거 (브레이크아웃은 중력 없는 환경)
        this.scene.matter.world.setGravity(0, 0);
        
        // 물리 월드 업데이트 빈도 설정
        this.scene.matter.world.runner.fps = 60;
        this.scene.matter.world.runner.isFixed = true;
    }

    setupCollisionCategories() {
        // 충돌 카테고리 비트마스크 정의
        this.categories = {
            BALL: 0x0001,
            PADDLE_PLAYER: 0x0002,
            PADDLE_AI: 0x0004,
            BRICK_PLAYER: 0x0008,
            BRICK_AI: 0x0010,
            WALL: 0x0020
        };
    }

    setupCollisionEvents() {
        // 충돌 감지 이벤트
        this.scene.matter.world.on('collisionstart', (event) => {
            this.handleCollisionStart(event);
        });

        this.scene.matter.world.on('collisionend', (event) => {
            this.handleCollisionEnd(event);
        });
    }

    // 공 생성
    createBall(x, y, options = {}) {
        const ballConfig = this.config.ball;
        
        const defaultOptions = {
            restitution: ballConfig.restitution,
            friction: ballConfig.friction,
            frictionAir: ballConfig.frictionAir,
            density: 0.001,
            collisionFilter: {
                category: this.categories.BALL,
                mask: this.categories.PADDLE_PLAYER | 
                      this.categories.PADDLE_AI | 
                      this.categories.BRICK_PLAYER | 
                      this.categories.BRICK_AI | 
                      this.categories.WALL
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        // Matter.js 원형 바디 생성
        const ballBody = this.scene.matter.add.circle(x, y, ballConfig.radius, mergedOptions);
        
        // 초기 속도 설정
        const angle = options.angle || (Math.random() * Math.PI * 2);
        const speed = options.speed || ballConfig.speed;
        
        this.scene.matter.setVelocity(ballBody, 
            Math.cos(angle) * speed, 
            Math.sin(angle) * speed
        );

        return ballBody;
    }

    // 패들 생성 (둥근 모서리 적용)
    createPaddle(x, y, isPlayer = true, options = {}) {
        const paddleConfig = this.config.paddle;
        const category = isPlayer ? this.categories.PADDLE_PLAYER : this.categories.PADDLE_AI;
        
        // 둥근 패들을 위한 복합 바디 생성
        const radius = paddleConfig.height / 2;
        const centerWidth = paddleConfig.width - (radius * 2);
        
        // 중앙 직사각형 + 양쪽 원형 엔드캡
        const parts = [
            // 중앙 직사각형
            this.scene.matter.bodies.rectangle(x, y, centerWidth, paddleConfig.height),
            // 왼쪽 원형
            this.scene.matter.bodies.circle(x - centerWidth/2, y, radius),
            // 오른쪽 원형
            this.scene.matter.bodies.circle(x + centerWidth/2, y, radius)
        ];

        const paddleBody = this.scene.matter.body.create({
            parts: parts,
            isStatic: false,
            frictionAir: 0.01,
            friction: 0.8,
            restitution: 0.8,
            collisionFilter: {
                category: category,
                mask: this.categories.BALL
            },
            ...options
        });

        // 패들을 물리 월드에 추가
        this.scene.matter.world.add(paddleBody);

        return paddleBody;
    }

    // 벽돌 생성
    createBrick(x, y, isPlayerBrick = true, options = {}) {
        const brickConfig = this.config.brick;
        const category = isPlayerBrick ? this.categories.BRICK_PLAYER : this.categories.BRICK_AI;
        
        const brickBody = this.scene.matter.add.rectangle(
            x + brickConfig.width / 2, 
            y + brickConfig.height / 2, 
            brickConfig.width, 
            brickConfig.height, 
            {
                isStatic: true,
                restitution: 1.0,
                friction: 0,
                collisionFilter: {
                    category: category,
                    mask: this.categories.BALL
                },
                ...options
            }
        );

        return brickBody;
    }

    // 벽 생성 (화면 경계)
    createWalls() {
        const { width, height } = this.scene.sys.game.config;
        const wallThickness = 32;
        
        const walls = [
            // 왼쪽 벽
            this.scene.matter.add.rectangle(-wallThickness/2, height/2, wallThickness, height, {
                isStatic: true,
                collisionFilter: { category: this.categories.WALL }
            }),
            // 오른쪽 벽
            this.scene.matter.add.rectangle(width + wallThickness/2, height/2, wallThickness, height, {
                isStatic: true,
                collisionFilter: { category: this.categories.WALL }
            }),
            // 위쪽 벽
            this.scene.matter.add.rectangle(width/2, -wallThickness/2, width, wallThickness, {
                isStatic: true,
                collisionFilter: { category: this.categories.WALL }
            }),
            // 아래쪽 벽
            this.scene.matter.add.rectangle(width/2, height + wallThickness/2, width, wallThickness, {
                isStatic: true,
                collisionFilter: { category: this.categories.WALL }
            })
        ];

        return walls;
    }

    // 패들 움직임 제어
    movePaddle(paddleBody, targetX, maxSpeed = 10) {
        const currentX = paddleBody.position.x;
        const diff = targetX - currentX;
        const force = Math.max(-maxSpeed, Math.min(maxSpeed, diff * 0.1));
        
        this.scene.matter.setVelocityX(paddleBody, force);
    }

    // 공 속도 제한
    limitBallSpeed(ballBody, maxSpeed = null) {
        const max = maxSpeed || this.config.ball.maxSpeed;
        const velocity = ballBody.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed > max) {
            const ratio = max / speed;
            this.scene.matter.setVelocity(ballBody, 
                velocity.x * ratio, 
                velocity.y * ratio
            );
        }
        
        // 최소 속도 보장
        const minSpeed = this.config.ball.speed * 0.5;
        if (speed < minSpeed && speed > 0) {
            const ratio = minSpeed / speed;
            this.scene.matter.setVelocity(ballBody, 
                velocity.x * ratio, 
                velocity.y * ratio
            );
        }
    }

    // 공과 패들 충돌 시 각도 조정
    adjustBallAngleFromPaddle(ballBody, paddleBody, isPlayerPaddle = true) {
        const ballPos = ballBody.position;
        const paddlePos = paddleBody.position;
        const paddleWidth = this.config.paddle.width;
        
        // 패들의 어느 부분에 맞았는지 계산 (-1 to 1)
        const hitPosition = (ballPos.x - paddlePos.x) / (paddleWidth / 2);
        const clampedHit = Math.max(-1, Math.min(1, hitPosition));
        
        // 각도 계산 (패들 중앙: 수직, 양 끝: 45도)
        const maxAngle = Math.PI / 3; // 60도
        const angle = clampedHit * maxAngle;
        
        // 현재 속력 유지
        const currentSpeed = Math.sqrt(ballBody.velocity.x ** 2 + ballBody.velocity.y ** 2);
        const targetSpeed = Math.max(currentSpeed * 1.05, this.config.ball.speed);
        
        // 새 방향 계산
        const newVx = Math.sin(angle) * targetSpeed;
        const newVy = (isPlayerPaddle ? -1 : 1) * Math.cos(angle) * targetSpeed;
        
        this.scene.matter.setVelocity(ballBody, newVx, newVy);
    }

    // 충돌 처리
    handleCollisionStart(event) {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            
            // 공과 패들 충돌
            if (this.isBallPaddleCollision(bodyA, bodyB)) {
                this.handleBallPaddleCollision(bodyA, bodyB);
            }
            
            // 공과 벽돌 충돌
            if (this.isBallBrickCollision(bodyA, bodyB)) {
                this.handleBallBrickCollision(bodyA, bodyB);
            }
        });
    }

    handleCollisionEnd(event) {
        // 충돌 종료 시 처리할 로직
    }

    // 충돌 타입 검사 헬퍼 메서드들
    isBallPaddleCollision(bodyA, bodyB) {
        const ballCategory = this.categories.BALL;
        const paddleCategories = this.categories.PADDLE_PLAYER | this.categories.PADDLE_AI;
        
        return (bodyA.collisionFilter.category === ballCategory && 
                (bodyB.collisionFilter.category & paddleCategories)) ||
               (bodyB.collisionFilter.category === ballCategory && 
                (bodyA.collisionFilter.category & paddleCategories));
    }

    isBallBrickCollision(bodyA, bodyB) {
        const ballCategory = this.categories.BALL;
        const brickCategories = this.categories.BRICK_PLAYER | this.categories.BRICK_AI;
        
        return (bodyA.collisionFilter.category === ballCategory && 
                (bodyB.collisionFilter.category & brickCategories)) ||
               (bodyB.collisionFilter.category === ballCategory && 
                (bodyA.collisionFilter.category & brickCategories));
    }

    handleBallPaddleCollision(bodyA, bodyB) {
        const ballBody = bodyA.collisionFilter.category === this.categories.BALL ? bodyA : bodyB;
        const paddleBody = ballBody === bodyA ? bodyB : bodyA;
        
        const isPlayerPaddle = paddleBody.collisionFilter.category === this.categories.PADDLE_PLAYER;
        
        // 각도 조정
        this.adjustBallAngleFromPaddle(ballBody, paddleBody, isPlayerPaddle);
        
        // 이벤트 발생
        this.scene.events.emit('ballPaddleCollision', { ballBody, paddleBody, isPlayerPaddle });
    }

    handleBallBrickCollision(bodyA, bodyB) {
        const ballBody = bodyA.collisionFilter.category === this.categories.BALL ? bodyA : bodyB;
        const brickBody = ballBody === bodyA ? bodyB : bodyA;
        
        const isPlayerBrick = brickBody.collisionFilter.category === this.categories.BRICK_PLAYER;
        
        // 이벤트 발생 (벽돌 제거는 GameScene에서 처리)
        this.scene.events.emit('ballBrickCollision', { ballBody, brickBody, isPlayerBrick });
    }

    // 정리
    destroy() {
        this.scene.matter.world.off('collisionstart');
        this.scene.matter.world.off('collisionend');
    }
}

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsManager;
} else {
    window.PhysicsManager = PhysicsManager;
}
