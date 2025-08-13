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
    
    // 하이브리드 패들 충돌 (물리적 반사 + 게임플레이 보정)
    checkPaddleCollision(ball, paddle, isPlayer1) {
        // AABB 충돌 감지
        if (ball.x + ball.radius > paddle.x &&
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height) {
            
            // 공이 패들에서 멀어지고 있으면 무시 (중복 충돌 방지)
            if ((isPlayer1 && ball.dy < 0) || (!isPlayer1 && ball.dy > 0)) {
                return false;
            }
            
            // 충돌 면 판단
            const ballBottom = ball.y + ball.radius;
            const ballTop = ball.y - ball.radius;
            const ballLeft = ball.x - ball.radius;
            const ballRight = ball.x + ball.radius;
            
            // 패들 상단/하단 면 충돌 (주요 충돌)
            const hitTop = isPlayer1 && Math.abs(ballBottom - paddle.y) < 10;
            const hitBottom = !isPlayer1 && Math.abs(ballTop - (paddle.y + paddle.height)) < 10;
            
            if (hitTop || hitBottom) {
                // 현재 입사각 계산
                const currentAngle = Math.atan2(ball.dx, Math.abs(ball.dy));
                
                // 충돌 위치 (0~1)
                let hitPos = (ball.x - paddle.x) / paddle.width;
                hitPos = Math.max(0, Math.min(1, hitPos));
                
                // 위치 기반 영향력 (중앙에서 약하게, 가장자리에서 강하게)
                const positionInfluence = Math.abs(hitPos - 0.5) * 2; // 0(중앙) ~ 1(가장자리)
                
                // 물리적 반사와 위치 기반 반사를 혼합
                const physicalBounce = -currentAngle; // 입사각 = 반사각
                const positionBounce = (hitPos - 0.5) * Math.PI * 0.5; // 위치 기반 각도
                
                // 혼합 비율: 중앙에서는 위치 기반, 가장자리에서는 물리 기반
                const finalAngle = physicalBounce * positionInfluence +
                                  positionBounce * (1 - positionInfluence * 0.5);
                
                // 속도 계산
                const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                const targetSpeed = Math.min(currentSpeed, CONFIG.BALL_INITIAL_SPEED * 1.2);
                const baseSpeed = Math.max(targetSpeed, CONFIG.BALL_MIN_SPEED);
                
                // 새로운 속도 적용
                ball.dx = Math.sin(finalAngle) * baseSpeed;
                ball.dy = Math.cos(finalAngle) * baseSpeed * (isPlayer1 ? -1 : 1);
                
                // 위치 보정
                if (isPlayer1) {
                    ball.y = paddle.y - ball.radius - 1;
                } else {
                    ball.y = paddle.y + paddle.height + ball.radius + 1;
                }
            }
            // 측면 충돌 (드물지만 처리 필요)
            else {
                // 좌우 측면 충돌은 단순 반사
                ball.dx = -ball.dx;
                
                // 위치 보정
                if (ball.x < paddle.x + paddle.width / 2) {
                    ball.x = paddle.x - ball.radius - 1;
                } else {
                    ball.x = paddle.x + paddle.width + ball.radius + 1;
                }
                
                // 약간의 수직 속도 추가 (무한 루프 방지)
                if (Math.abs(ball.dy) < 2) {
                    ball.dy = (isPlayer1 ? -2 : 2);
                }
            }
            
            // 패들 모멘텀 전달 (제한적으로)
            const paddleVelocity = paddle.x - paddle.prevX;
            if (Math.abs(paddleVelocity) > 0.5) {
                ball.dx += paddleVelocity * CONFIG.PADDLE_MOMENTUM_TRANSFER * 0.5;
            }
            
            // 최대 속도 제한
            this.limitBallSpeed(ball);
            
            // 충돌 효과
            paddle.shakeAmount = 3;
            
            return true;
        }
        
        return false;
    }
    
    // 벽돌 충돌 감지
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
    
    // 벽돌 충돌 감지 (단순화)
    checkBrickCollision(ball, brick) {
        // AABB 충돌 체크
        if (ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height) {
            
            // 충돌 방향 결정 (가장 가까운 면)
            const ballCenterX = ball.x;
            const ballCenterY = ball.y;
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            
            // 상대 위치 계산
            const dx = ballCenterX - brickCenterX;
            const dy = ballCenterY - brickCenterY;
            
            // 충돌면 결정
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const halfWidth = brick.width / 2;
            const halfHeight = brick.height / 2;
            
            if (absDx / halfWidth > absDy / halfHeight) {
                // 좌우 충돌
                ball.dx = -ball.dx;
                // 위치 보정
                if (dx > 0) {
                    ball.x = brick.x + brick.width + ball.radius;
                } else {
                    ball.x = brick.x - ball.radius;
                }
            } else {
                // 상하 충돌
                ball.dy = -ball.dy;
                // 위치 보정
                if (dy > 0) {
                    ball.y = brick.y + brick.height + ball.radius;
                } else {
                    ball.y = brick.y - ball.radius;
                }
            }
            
            return true;
        }
        
        return false;
    }
    
    // 공 속도 제한
    limitBallSpeed(ball) {
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const maxSpeed = 12;  // 15에서 12로 감소
        const minSpeed = CONFIG.BALL_MIN_SPEED;
        
        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            ball.dx *= scale;
            ball.dy *= scale;
        } else if (currentSpeed < minSpeed) {
            const scale = minSpeed / currentSpeed;
            ball.dx *= scale;
            ball.dy *= scale;
        }
    }
    
    // 공 속도 정규화 (속도 폭주 방지)
    normalizeBallSpeed(ball) {
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        
        // 초기 속도가 없으면 설정
        if (!this.ballBaseSpeed.has(ball)) {
            this.ballBaseSpeed.set(ball, CONFIG.BALL_INITIAL_SPEED);
        }
        
        const baseSpeed = this.ballBaseSpeed.get(ball);
        
        // 속도가 기준값보다 20% 이상 빠르면 점진적으로 감소
        if (currentSpeed > baseSpeed * 1.2) {
            const targetSpeed = currentSpeed * 0.98;  // 2% 감속
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
    
    // 패들 이전 위치 업데이트
    updatePaddleHistory(paddle) {
        paddle.prevX = paddle.x;
    }
}

// 전역 물리 시스템 인스턴스
const physicsSystem = new PhysicsSystem();
