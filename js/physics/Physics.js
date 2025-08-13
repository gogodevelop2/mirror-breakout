// js/physics/Physics.js

class PhysicsSystem {
    constructor() {
        // 공 속도 추적 (가속 후 복구용)
        this.ballBaseSpeed = new Map();
    }
    
    // 메인 물리 업데이트
    update() {
        // 공 이동
        gameState.balls.forEach(ball => {
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // 속도 정규화 (가속 후 점진적 복구)
            this.normalizeBallSpeed(ball);
        });
        
        // 충돌 검사
        this.checkAllCollisions();
    }
    
    // 모든 충돌 검사
    checkAllCollisions() {
        gameState.balls.forEach(ball => {
            // 벽 충돌
            this.checkWallCollision(ball);
            
            // 패들 충돌
            this.checkPaddleCollision(ball, gameState.paddles.player1, true);
            this.checkPaddleCollision(ball, gameState.paddles.player2, false);
            
            // 벽돌 충돌
            this.checkBrickCollisions(ball);
        });
    }
    
    // 벽 충돌
    checkWallCollision(ball) {
        // 좌우 벽
        if (ball.x < CONFIG.BALL_RADIUS) {
            ball.x = CONFIG.BALL_RADIUS;
            ball.dx = Math.abs(ball.dx);
        } else if (ball.x > CONFIG.CANVAS_WIDTH - CONFIG.BALL_RADIUS) {
            ball.x = CONFIG.CANVAS_WIDTH - CONFIG.BALL_RADIUS;
            ball.dx = -Math.abs(ball.dx);
        }
        
        // 상하 벽
        if (ball.y < CONFIG.BALL_RADIUS) {
            ball.y = CONFIG.BALL_RADIUS;
            ball.dy = Math.abs(ball.dy);
        } else if (ball.y > CONFIG.CANVAS_HEIGHT - CONFIG.BALL_RADIUS) {
            ball.y = CONFIG.CANVAS_HEIGHT - CONFIG.BALL_RADIUS;
            ball.dy = -Math.abs(ball.dy);
        }
    }
    
    // 개선된 패들 충돌 (정확한 원-원 및 원-사각형 충돌)
    checkPaddleCollision(ball, paddle, isPlayer1) {
        // 공이 패들 방향으로 움직이지 않으면 무시
        if ((isPlayer1 && ball.dy <= 0) || (!isPlayer1 && ball.dy >= 0)) return false;
        
        const paddleRadius = paddle.height / 2;
        let collided = false;
        
        // 1. 왼쪽 반원 충돌
        const leftCircleX = paddle.x + paddleRadius;
        const leftCircleY = paddle.y + paddleRadius;
        if (this.checkCircleCircleCollision(ball, leftCircleX, leftCircleY, paddleRadius, paddle)) {
            collided = true;
        }
        
        // 2. 오른쪽 반원 충돌
        if (!collided) {
            const rightCircleX = paddle.x + paddle.width - paddleRadius;
            const rightCircleY = paddle.y + paddleRadius;
            if (this.checkCircleCircleCollision(ball, rightCircleX, rightCircleY, paddleRadius, paddle)) {
                collided = true;
            }
        }
        
        // 3. 중앙 사각형 영역 충돌
        if (!collided) {
            const rectLeft = paddle.x + paddleRadius;
            const rectRight = paddle.x + paddle.width - paddleRadius;
            const rectTop = paddle.y;
            const rectBottom = paddle.y + paddle.height;
            
            if (ball.x >= rectLeft && ball.x <= rectRight) {
                const ballEdge = ball.y + (isPlayer1 ? 1 : -1) * ball.radius;
                const paddleEdge = isPlayer1 ? paddle.y : paddle.y + paddle.height;
                
                if (Math.abs(ballEdge - paddleEdge) <= 8) {
                    // 위치 보정
                    ball.y = isPlayer1
                        ? paddle.y - ball.radius - 1
                        : paddle.y + paddle.height + ball.radius + 1;
                    
                    // 반사
                    ball.dy = -ball.dy;
                    
                    // 패들 모멘텀 전달
                    this.applyPaddleMomentum(ball, paddle);
                    
                    // 충돌 진동 효과
                    paddle.shakeAmount = 3;
                    
                    collided = true;
                }
            }
        }
        
        // 충돌 발생 시 진동 효과 추가
        if (collided) {
            paddle.shakeAmount = 3;
        }
        
        return collided;
    }
    
    // 정확한 원-원 충돌 (패들 둥근 부분)
    checkCircleCircleCollision(ball, circleX, circleY, circleRadius, paddle) {
        const dx = ball.x - circleX;
        const dy = ball.y - circleY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ball.radius + circleRadius) {
            // 충돌 발생!
            
            // 1. 정확한 법선 벡터 계산
            const normal = {
                x: dx / distance,
                y: dy / distance
            };
            
            // 2. 침투 깊이 계산
            const penetration = (ball.radius + circleRadius) - distance;
            
            // 3. 위치 보정 (볼을 밖으로 밀어냄)
            ball.x += normal.x * penetration;
            ball.y += normal.y * penetration;
            
            // 4. 속도 벡터 반사
            const dotProduct = ball.dx * normal.x + ball.dy * normal.y;
            
            // 반사 벡터 = 입사 벡터 - 2 * (입사·법선) * 법선
            ball.dx = ball.dx - 2 * dotProduct * normal.x;
            ball.dy = ball.dy - 2 * dotProduct * normal.y;
            
            // 5. 패들 모멘텀 전달
            this.applyPaddleMomentum(ball, paddle);
            
            // 6. 최소 반사각 보장
            this.ensureMinimumAngle(ball);
            
            // 7. 충돌 진동 효과
            paddle.shakeAmount = 3;
            
            return true;
        }
        
        return false;
    }
    
    // 패들 모멘텀 전달 (가속도 기반)
    applyPaddleMomentum(ball, paddle) {
        const paddleVelocity = paddle.x - paddle.prevX;
        const paddleAccel = paddleVelocity - (paddle.prevX - (paddle.prevPrevX || paddle.prevX));
        
        // 속도와 가속도 모두 고려
        const momentumTransfer = paddleVelocity * CONFIG.PADDLE_MOMENTUM_TRANSFER +
                                paddleAccel * 0.1;
        
        ball.dx += momentumTransfer;
        
        // 현재 속도 저장 (나중에 정규화용)
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (!this.ballBaseSpeed.has(ball)) {
            this.ballBaseSpeed.set(ball, CONFIG.BALL_INITIAL_SPEED);
        }
        
        // 가속된 경우 기록
        if (currentSpeed > this.ballBaseSpeed.get(ball) * 1.2) {
            ball.boosted = true;
            ball.boostTime = Date.now();
        }
    }
    
    // 개선된 벽돌 충돌 (모서리 포함)
    checkBrickCollisions(ball) {
        [gameState.bricks.player1, gameState.bricks.player2].forEach((brickSet, setIndex) => {
            for (let i = brickSet.length - 1; i >= 0; i--) {
                const brick = brickSet[i];
                
                if (this.checkBrickCollision(ball, brick)) {
                    // 벽돌 제거
                    brickGrid.removeBrick(brick, setIndex === 0);
                    brickSet.splice(i, 1);
                    
                    // 점수 업데이트
                    if (setIndex === 0) {
                        gameState.computerScore++;
                    } else {
                        gameState.playerScore++;
                    }
                    
                    break; // 한 프레임에 하나의 벽돌만
                }
            }
        });
    }
    
    // 개선된 벽돌 충돌 감지
    checkBrickCollision(ball, brick) {
        // 벽돌에서 공까지의 가장 가까운 점 찾기
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distanceSq = dx * dx + dy * dy;
        
        if (distanceSq < ball.radius * ball.radius) {
            // 충돌 발생!
            const distance = Math.sqrt(distanceSq);
            
            if (distance > 0) {
                // 모서리 충돌 - 정확한 반사
                const normal = { x: dx / distance, y: dy / distance };
                
                // 침투 깊이
                const penetration = ball.radius - distance;
                
                // 위치 보정
                ball.x += normal.x * penetration;
                ball.y += normal.y * penetration;
                
                // 속도 반사
                const dotProduct = ball.dx * normal.x + ball.dy * normal.y;
                ball.dx -= 2 * dotProduct * normal.x;
                ball.dy -= 2 * dotProduct * normal.y;
            } else {
                // 중심이 벽돌 내부 - 면 충돌로 처리
                const fromLeft = Math.abs(ball.x - brick.x);
                const fromRight = Math.abs(ball.x - (brick.x + brick.width));
                const fromTop = Math.abs(ball.y - brick.y);
                const fromBottom = Math.abs(ball.y - (brick.y + brick.height));
                
                const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);
                
                if (min === fromLeft || min === fromRight) {
                    ball.dx = -ball.dx;
                    ball.x = min === fromLeft
                        ? brick.x - ball.radius
                        : brick.x + brick.width + ball.radius;
                } else {
                    ball.dy = -ball.dy;
                    ball.y = min === fromTop
                        ? brick.y - ball.radius
                        : brick.y + brick.height + ball.radius;
                }
            }
            
            return true;
        }
        
        return false;
    }
    
    // 최소 반사각 보장
    ensureMinimumAngle(ball) {
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const normalizedY = ball.dy / speed;
        
        if (Math.abs(normalizedY) < CONFIG.MIN_ANGLE) {
            ball.dy = Math.sign(ball.dy) * CONFIG.MIN_ANGLE * speed;
            ball.dx = Math.sign(ball.dx) * Math.sqrt(speed * speed - ball.dy * ball.dy);
        }
    }
    
    // 공 속도 정규화 (가속 후 점진적 복구)
    normalizeBallSpeed(ball) {
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const baseSpeed = this.ballBaseSpeed.get(ball) || CONFIG.BALL_INITIAL_SPEED;
        
        // 부스트 상태면 점진적으로 원래 속도로 복구
        if (ball.boosted && Date.now() - ball.boostTime > 500) {
            const targetSpeed = Math.max(baseSpeed, currentSpeed * 0.98);
            
            if (targetSpeed <= baseSpeed * 1.1) {
                ball.boosted = false;
            }
            
            // 속도 조정
            const scale = targetSpeed / currentSpeed;
            ball.dx *= scale;
            ball.dy *= scale;
        }
        
        // 최소 속도 보장
        if (currentSpeed < CONFIG.BALL_MIN_SPEED) {
            const scale = CONFIG.BALL_MIN_SPEED / currentSpeed;
            ball.dx *= scale;
            ball.dy *= scale;
        }
    }
    
    // 패들 이전 위치 업데이트 (가속도 계산용)
    updatePaddleHistory(paddle) {
        paddle.prevPrevX = paddle.prevX || paddle.x;
        paddle.prevX = paddle.x;
    }
}

// 전역 물리 시스템 인스턴스
const physicsSystem = new PhysicsSystem();
