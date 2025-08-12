export class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.config = scene.game.config.game;
        this.physicsManager = scene.physicsManager;
    }

    checkAllCollisions(balls, paddles, bricks) {
        balls.forEach(ball => {
            // 벽 충돌 체크
            this.checkWallCollisions(ball);
            
            // 패들 충돌 체크
            paddles.forEach(paddle => {
                this.checkPaddleCollision(ball, paddle);
            });
            
            // 벽돌 충돌 체크
            this.checkBrickCollisions(ball, bricks.player1, true);
            this.checkBrickCollisions(ball, bricks.player2, false);
        });
    }

    checkWallCollisions(ball) {
        const { width, height } = this.scene.cameras.main;
        const radius = ball.radius;
        let velocityChanged = false;
        
        // 좌우 벽 충돌
        if (ball.x - radius <= 0) {
            ball.x = radius;
            ball.dx = Math.abs(ball.dx);
            velocityChanged = true;
        } else if (ball.x + radius >= width) {
            ball.x = width - radius;
            ball.dx = -Math.abs(ball.dx);
            velocityChanged = true;
        }
        
        // 상하 벽 충돌
        if (ball.y - radius <= 0) {
            ball.y = radius;
            ball.dy = Math.abs(ball.dy);
            velocityChanged = true;
        } else if (ball.y + radius >= height) {
            ball.y = height - radius;
            ball.dy = -Math.abs(ball.dy);
            velocityChanged = true;
        }
        
        // 속도가 변경되었으면 최소 각도 보장
        if (velocityChanged) {
            const velocity = this.physicsManager.ensureMinimumAngle(
                { x: ball.dx, y: ball.dy }, 
                this.config.MIN_ANGLE
            );
            ball.dx = velocity.x;
            ball.dy = velocity.y;
        }
    }

    checkPaddleCollision(ball, paddle) {
        // 공이 패들 방향으로 움직이는지 확인
        const isPlayer1 = paddle.isPlayer1;
        if ((isPlayer1 && ball.dy <= 0) || (!isPlayer1 && ball.dy >= 0)) {
            return false;
        }
        
        const paddleVelocity = paddle.x - paddle.prevX;
        let collisionDetected = false;
        let collisionNormal = { x: 0, y: 0 };
        
        // 패들의 둥근 끝부분과의 충돌 체크
        const leftCenter = { x: paddle.x + paddle.height / 2, y: paddle.y + paddle.height / 2 };
        const rightCenter = { x: paddle.x + paddle.width - paddle.height / 2, y: paddle.y + paddle.height / 2 };
        const paddleRadius = paddle.height / 2;
        
        // 왼쪽 둥근 부분 충돌
        const leftDist = Math.sqrt((ball.x - leftCenter.x) ** 2 + (ball.y - leftCenter.y) ** 2);
        if (leftDist <= ball.radius + paddleRadius) {
            collisionNormal = this.physicsManager.normalizeVector({
                x: ball.x - leftCenter.x,
                y: ball.y - leftCenter.y
            });
            collisionDetected = true;
        }
        
        // 오른쪽 둥근 부분 충돌
        if (!collisionDetected) {
            const rightDist = Math.sqrt((ball.x - rightCenter.x) ** 2 + (ball.y - rightCenter.y) ** 2);
            if (rightDist <= ball.radius + paddleRadius) {
                collisionNormal = this.physicsManager.normalizeVector({
                    x: ball.x - rightCenter.x,
                    y: ball.y - rightCenter.y
                });
                collisionDetected = true;
            }
        }
        
        // 직선 부분 충돌
        if (!collisionDetected) {
            const ballEdge = ball.y + (isPlayer1 ? 1 : -1) * ball.radius;
            const paddleEdge = isPlayer1 ? paddle.y : paddle.y + paddle.height;
            
            if (Math.abs(ballEdge - paddleEdge) <= 8 &&
                ball.x >= paddle.x + paddleRadius && 
                ball.x <= paddle.x + paddle.width - paddleRadius) {
                
                collisionNormal = { x: 0, y: isPlayer1 ? -1 : 1 };
                collisionDetected = true;
                
                // 공 위치 보정
                ball.y = isPlayer1 ? paddle.y - ball.radius : paddle.y + paddle.height + ball.radius;
            }
        }
        
        if (collisionDetected) {
            this.handlePaddleCollision(ball, paddle, collisionNormal, paddleVelocity);
            return true;
        }
        
        return false;
    }

    handlePaddleCollision(ball, paddle, normal, paddleVelocity) {
        // 현재 속도
        const currentVelocity = { x: ball.dx, y: ball.dy };
        const currentSpeed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);
        
        // 반사 계산
        const reflectedVelocity = this.physicsManager.reflectVector(currentVelocity, normal);
        
        // 패들 움직임의 영향 추가
        reflectedVelocity.x += paddleVelocity * this.config.PADDLE_MOMENTUM_TRANSFER;
        
        // 속도 크기 유지 (약간의 감쇠)
        const newSpeed = Math.max(currentSpeed * 0.95, 5);
        const normalizedVelocity = this.physicsManager.normalizeVector(reflectedVelocity);
        
        // 최소 각도 보장
        const finalVelocity = this.physicsManager.ensureMinimumAngle(
            {
                x: normalizedVelocity.x * newSpeed,
                y: normalizedVelocity.y * newSpeed
            },
            this.config.MIN_ANGLE
        );
        
        ball.dx = finalVelocity.x;
        ball.dy = finalVelocity.y;
        
        // 패들 히트 효과 (추후 파티클 시스템에서 처리)
        // this.scene.particleEffects?.createPaddleHitEffect(ball.x, ball.y);
    }

    checkBrickCollisions(ball, bricks, isPlayer1) {
        for (let i = bricks.length - 1; i >= 0; i--) {
            const brick = bricks[i];
            
            if (this.ballBrickCollision(ball, brick)) {
                // 벽돌 제거
                brick.destroy();
                bricks.splice(i, 1);
                
                // 공 반사
                ball.dy = -ball.dy;
                
                // 점수 업데이트
                if (isPlayer1) {
                    this.scene.gameState.computerScore++;
                } else {
                    this.scene.gameState.playerScore++;
                }
                
                // 벽돌 파괴 효과
                this.scene.particleEffects?.createBrickBreakEffect(
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2,
                    brick.color
                );
                
                break; // 한 번에 하나의 벽돌만 처리
            }
        }
    }

    ballBrickCollision(ball, brick) {
        // AABB 충돌 감지
        return ball.x > brick.x && 
               ball.x < brick.x + brick.width &&
               ball.y - ball.radius < brick.y + brick.height &&
               ball.y + ball.radius > brick.y;
    }

    // 더 정확한 원-사각형 충돌 감지 (필요시 사용)
    circleRectCollision(circleX, circleY, radius, rectX, rectY, rectWidth, rectHeight) {
        const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
        const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
        
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        return distanceSquared < (radius * radius);
    }
}
