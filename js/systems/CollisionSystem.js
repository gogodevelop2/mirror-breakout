// 충돌 시스템 - 충돌 감지 및 처리 관리
class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.physicsSystem = null;
        
        // 충돌 콜백 저장
        this.collisionCallbacks = new Map();
        
        // 충돌 통계
        this.stats = {
            paddleHits: 0,
            brickHits: 0,
            wallHits: 0
        };
    }
    
    init(physicsSystem) {
        this.physicsSystem = physicsSystem;
    }
    
    // 충돌 설정
    setupCollisions(balls, paddlePlayer, paddleAI, bricksPlayer, bricksAI) {
        // 각 공에 대해 충돌 설정
        balls.forEach(ball => {
            this.setupBallCollisions(ball, paddlePlayer, paddleAI, bricksPlayer, bricksAI);
        });
        
        // 월드 경계 충돌 이벤트
        this.scene.physics.world.on('worldbounds', this.onWorldBounds, this);
    }
    
    // 개별 공 충돌 설정
    setupBallCollisions(ball, paddlePlayer, paddleAI, bricksPlayer, bricksAI) {
        // 패들과의 충돌
        this.scene.physics.add.collider(
            ball,
            paddlePlayer,
            (ballObj, paddleObj) => this.handlePaddleCollision(ballObj, paddleObj, 'player'),
            null,
            this
        );
        
        this.scene.physics.add.collider(
            ball,
            paddleAI,
            (ballObj, paddleObj) => this.handlePaddleCollision(ballObj, paddleObj, 'ai'),
            null,
            this
        );
        
        // 벽돌과의 충돌
        this.scene.physics.add.collider(
            ball,
            bricksPlayer,
            (ballObj, brickObj) => this.handleBrickCollision(ballObj, brickObj, 'player'),
            null,
            this
        );
        
        this.scene.physics.add.collider(
            ball,
            bricksAI,
            (ballObj, brickObj) => this.handleBrickCollision(ballObj, brickObj, 'ai'),
            null,
            this
        );
    }
    
    // 패들 충돌 처리
    handlePaddleCollision(ball, paddle, paddleType) {
        this.stats.paddleHits++;
        
        // 물리 계산
        if (this.physicsSystem) {
            const newVelocity = this.physicsSystem.calculateBallPaddleCollision(ball, paddle);
            this.physicsSystem.applyCollisionResponse(ball, newVelocity);
        }
        
        // 엔티티 메서드 호출
        if (ball.hitPaddle) {
            ball.hitPaddle(paddle);
        }
        if (paddle.onHit) {
            paddle.onHit();
        }
        
        // 사운드 효과 (나중에 추가)
        this.playPaddleHitSound(paddleType);
        
        // 이벤트 발생
        this.scene.events.emit('paddleHit', {
            ball: ball,
            paddle: paddle,
            type: paddleType
        });
    }
    
    // 벽돌 충돌 처리
    handleBrickCollision(ball, brick, brickOwner) {
        this.stats.brickHits++;
        
        // 충돌 위치 저장
        const brickX = brick.x;
        const brickY = brick.y;
        
        // 물리 계산
        if (this.physicsSystem) {
            const newVelocity = this.physicsSystem.calculateBallBrickCollision(ball, brick);
            this.physicsSystem.applyCollisionResponse(ball, newVelocity);
        }
        
        // 벽돌 파괴
        brick.destroy();
        
        // 공 효과
        if (ball.hitBrick) {
            ball.hitBrick();
        }
        
        // 점수 계산
        const points = this.calculatePoints(brick, brickOwner);
        
        // 이벤트 발생
        this.scene.events.emit('brickDestroyed', {
            x: brickX,
            y: brickY,
            owner: brickOwner,
            points: points,
            ball: ball
        });
        
        // 콤보 체크
        this.checkCombo(brickOwner);
    }
    
    // 벽 충돌 처리
    onWorldBounds(body, up, down, left, right) {
        const gameObject = body.gameObject;
        
        if (gameObject && typeof gameObject.hitWall === 'function') {
            this.stats.wallHits++;
            gameObject.hitWall();
            
            // 이벤트 발생
            this.scene.events.emit('wallHit', {
                object: gameObject,
                sides: { up, down, left, right }
            });
        }
    }
    
    // 점수 계산
    calculatePoints(brick, owner) {
        let basePoints = GAME_CONFIG.SCORE.BRICK_DESTROY;
        
        // 콤보 보너스
        const combo = this.getCombo(owner);
        if (combo > 1) {
            basePoints *= (1 + combo * 0.1);
        }
        
        // 시간 보너스
        const gameTime = this.scene.gameTime || 0;
        if (gameTime < 30) {
            basePoints *= 1.5; // 30초 이내 보너스
        }
        
        return Math.floor(basePoints);
    }
    
    // 콤보 시스템
    comboTimers = { player: 0, ai: 0 };
    comboCounts = { player: 0, ai: 0 };
    
    checkCombo(owner) {
        const now = Date.now();
        const lastHit = this.comboTimers[owner];
        
        if (now - lastHit < 1000) { // 1초 이내 연속 타격
            this.comboCounts[owner]++;
        } else {
            this.comboCounts[owner] = 1;
        }
        
        this.comboTimers[owner] = now;
        
        // 콤보 이벤트
        if (this.comboCounts[owner] > 2) {
            this.scene.events.emit('combo', {
                owner: owner,
                count: this.comboCounts[owner]
            });
        }
    }
    
    getCombo(owner) {
        return this.comboCounts[owner] || 0;
    }
    
    // 사운드 효과 (플레이스홀더)
    playPaddleHitSound(type) {
        // Phase 2에서 구현
        // console.log('Paddle hit sound:', type);
    }
    
    // 충돌 예측 (AI용)
    predictCollision(ball, target, maxTime = 2) {
        if (!this.physicsSystem) return null;
        
        const path = this.physicsSystem.predictBallPath(ball, maxTime * 60);
        
        // 타겟과의 충돌 지점 찾기
        for (let point of path) {
            if (this.checkCollisionPoint(point, target)) {
                return point;
            }
        }
        
        return null;
    }
    
    checkCollisionPoint(point, target) {
        const targetBounds = target.getBounds();
        return point.x >= targetBounds.left && 
               point.x <= targetBounds.right &&
               point.y >= targetBounds.top && 
               point.y <= targetBounds.bottom;
    }
    
    // 충돌 그룹 관리
    addToCollisionGroup(object, groupName) {
        if (!this.collisionGroups) {
            this.collisionGroups = new Map();
        }
        
        if (!this.collisionGroups.has(groupName)) {
            this.collisionGroups.set(groupName, []);
        }
        
        this.collisionGroups.get(groupName).push(object);
    }
    
    removeFromCollisionGroup(object, groupName) {
        if (!this.collisionGroups || !this.collisionGroups.has(groupName)) {
            return;
        }
        
        const group = this.collisionGroups.get(groupName);
        const index = group.indexOf(object);
        if (index > -1) {
            group.splice(index, 1);
        }
    }
    
    // 디버그 정보
    getStats() {
        return {
            ...this.stats,
            playerCombo: this.comboCounts.player,
            aiCombo: this.comboCounts.ai
        };
    }
    
    // 시스템 리셋
    reset() {
        this.stats = {
            paddleHits: 0,
            brickHits: 0,
            wallHits: 0
        };
        
        this.comboTimers = { player: 0, ai: 0 };
        this.comboCounts = { player: 0, ai: 0 };
        
        if (this.collisionGroups) {
            this.collisionGroups.clear();
        }
    }
}
