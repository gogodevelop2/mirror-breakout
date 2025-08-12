/**
 * Collision System
 * 충돌 그룹 관리 및 이벤트 중계 (실제 물리 처리는 PhysicsSystem에 위임)
 */

class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.physicsSystem = null; // PhysicsSystem 참조
        
        // 충돌 그룹들
        this.collisionGroups = {
            balls: null,
            playerPaddle: null,
            aiPaddle: null,
            playerBricks: null,
            aiBricks: null
        };
        
        // 충돌 통계
        this.stats = {
            totalCollisions: 0,
            ballPaddleCollisions: 0,
            ballBrickCollisions: 0,
            ballWallCollisions: 0,
            recentCollisions: []
        };
        
        console.log('CollisionSystem initialized');
    }
    
    /**
     * PhysicsSystem 연결
     */
    setPhysicsSystem(physicsSystem) {
        this.physicsSystem = physicsSystem;
    }
    
    /**
     * 충돌 시스템 설정
     */
    setup(entities) {
        this.collisionGroups.balls = entities.balls;
        this.collisionGroups.playerPaddle = entities.playerPaddle;
        this.collisionGroups.aiPaddle = entities.aiPaddle;
        this.collisionGroups.playerBricks = entities.playerBricks;
        this.collisionGroups.aiBricks = entities.aiBricks;
        
        this.setupPhaserCollisions();
        
        console.log('Collision groups configured');
    }
    
    /**
     * Phaser 충돌 그룹만 설정 (처리는 PhysicsSystem에 위임)
     */
    setupPhaserCollisions() {
        const physics = this.scene.physics;
        
        // 공-플레이어 패들 충돌
        if (this.collisionGroups.balls && this.collisionGroups.playerPaddle) {
            physics.add.overlap(
                this.collisionGroups.balls,
                this.collisionGroups.playerPaddle,
                (ball, paddle) => this.onCollision('ballPaddle', ball, paddle, 'player'),
                null,
                this.scene
            );
        }
        
        // 공-AI 패들 충돌
        if (this.collisionGroups.balls && this.collisionGroups.aiPaddle) {
            physics.add.overlap(
                this.collisionGroups.balls,
                this.collisionGroups.aiPaddle,
                (ball, paddle) => this.onCollision('ballPaddle', ball, paddle, 'ai'),
                null,
                this.scene
            );
        }
        
        // 공-플레이어 벽돌 충돌
        if (this.collisionGroups.balls && this.collisionGroups.playerBricks) {
            physics.add.overlap(
                this.collisionGroups.balls,
                this.collisionGroups.playerBricks,
                (ball, brick) => this.onCollision('ballBrick', ball, brick, 'player'),
                null,
                this.scene
            );
        }
        
        // 공-AI 벽돌 충돌
        if (this.collisionGroups.balls && this.collisionGroups.aiBricks) {
            physics.add.overlap(
                this.collisionGroups.balls,
                this.collisionGroups.aiBricks,
                (ball, brick) => this.onCollision('ballBrick', ball, brick, 'ai'),
                null,
                this.scene
            );
        }
        
        // 월드 경계 충돌
        this.scene.physics.world.setBoundsCollision(true, true, false, false);
        this.scene.physics.world.on('worldbounds', (event, body) => {
            this.onCollision('ballWorld', null, null, event);
        });
    }
    
    /**
     * 충돌 이벤트 중계 (PhysicsSystem으로 위임)
     */
    onCollision(type, objA, objB, extra) {
        // 통계 업데이트
        this.updateStats(type);
        
        // PhysicsSystem으로 위임
        if (this.physicsSystem) {
            switch (type) {
                case 'ballPaddle':
                    // PhysicsSystem의 실제 메서드명 사용
                    this.physicsSystem.onBallPaddleCollision(extra, objA, objB);
                    break;
                case 'ballBrick':
                    // PhysicsSystem의 실제 메서드명 사용
                    this.physicsSystem.onBallBrickCollision(extra, objA, objB);
                    break;
                case 'ballWorld':
                    // 월드 바운더리는 다르게 처리
                    this.physicsSystem.onWorldBoundsCollision(extra, objA);
                    break;
            }
        }
        
        // 게임 이벤트 발생
        this.emitGameEvent(type, objA, objB, extra);
        
        console.log(`Collision: ${type}`);
    }
    
    /**
     * 게임 이벤트 발생
     */
    emitGameEvent(type, objA, objB, extra) {
        switch (type) {
            case 'ballPaddle':
                this.scene.events.emit('ballPaddleHit', {
                    ball: objA,
                    paddle: objB,
                    paddleType: extra
                });
                break;
                
            case 'ballBrick':
                this.scene.events.emit('brickHit', {
                    ball: objA,
                    brick: objB,
                    brickSide: extra
                });
                break;
                
            case 'ballWorld':
                const ball = this.findBallByBody(extra.body);
                if (ball && (extra.up || extra.down)) {
                    this.scene.events.emit('ballOutOfBounds', {
                        ball: ball,
                        side: extra.up ? 'top' : 'bottom'
                    });
                }
                break;
        }
    }
    
    /**
     * 충돌 통계 업데이트
     */
    updateStats(type) {
        this.stats.totalCollisions++;
        
        switch (type) {
            case 'ballPaddle':
                this.stats.ballPaddleCollisions++;
                break;
            case 'ballBrick':
                this.stats.ballBrickCollisions++;
                break;
            case 'ballWorld':
                this.stats.ballWallCollisions++;
                break;
        }
        
        // 최근 충돌 기록 (최대 50개)
        this.stats.recentCollisions.unshift({
            type: type,
            timestamp: this.scene.time.now
        });
        
        if (this.stats.recentCollisions.length > 50) {
            this.stats.recentCollisions.pop();
        }
    }
    
    /**
     * Body로 공 찾기
     */
    findBallByBody(body) {
        if (!body || !this.collisionGroups.balls || !this.collisionGroups.balls.children) {
            return null;
        }
        
        return this.collisionGroups.balls.children.entries.find(ball => ball.body === body);
    }
    
    /**
     * 디버그용 충돌 영역 표시
     */
    debugDrawCollisionZones(graphics) {
        if (!GameConfig.DEBUG.COLLISION_ZONES) return;
        
        graphics.clear();
        graphics.lineStyle(1, 0x00ff00, 0.3);
        
        // 패들 충돌 영역만 간단히 표시
        [this.collisionGroups.playerPaddle, this.collisionGroups.aiPaddle].forEach(paddle => {
            if (paddle && paddle.active) {
                graphics.strokeRect(
                    paddle.x,
                    paddle.y,
                    paddle.paddleWidth,
                    paddle.paddleHeight
                );
            }
        });
    }
    
    /**
     * 시스템 리셋
     */
    reset() {
        this.stats = {
            totalCollisions: 0,
            ballPaddleCollisions: 0,
            ballBrickCollisions: 0,
            ballWallCollisions: 0,
            recentCollisions: []
        };
        
        console.log('CollisionSystem reset');
    }
    
    /**
     * 디버그 정보
     */
    getDebugInfo() {
        return {
            stats: { ...this.stats },
            activeGroups: {
                balls: this.collisionGroups.balls ?
                    this.collisionGroups.balls.children.entries.length : 0,
                playerBricks: this.collisionGroups.playerBricks ?
                    this.collisionGroups.playerBricks.children.entries.length : 0,
                aiBricks: this.collisionGroups.aiBricks ?
                    this.collisionGroups.aiBricks.children.entries.length : 0
            }
        };
    }
    
    /**
     * 정리
     */
    destroy() {
        this.physicsSystem = null;
        this.collisionGroups = {};
        
        console.log('CollisionSystem destroyed');
    }
}
