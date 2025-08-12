export class AIController {
    constructor(scene, paddle, difficultyManager) {
        this.scene = scene;
        this.paddle = paddle;
        this.difficultyManager = difficultyManager;
        this.config = scene.game.config.game;
        
        // AI 전략 설정
        this.strategy = 'balanced'; // 'defensive', 'aggressive', 'balanced'
        this.reactionTime = 0;
        this.lastUpdate = 0;
        
        // 예측 시스템
        this.prediction = {
            enabled: true,
            lookaheadTime: 1.0, // 초
            accuracy: 0.8 // 예측 정확도
        };
        
        // 행동 패턴
        this.behavior = {
            aggressiveness: 0.5,
            defensiveness: 0.5,
            adaptability: 0.3
        };
    }

    update(balls) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // 난이도 승수 적용
        const difficultyMultiplier = this.difficultyManager.getMultiplier();
        this.updateDifficultyBasedBehavior(difficultyMultiplier);
        
        // 타겟 공 선택
        const targetBall = this.selectTargetBall(balls);
        
        if (targetBall) {
            // AI 움직임 결정
            this.makeMovementDecision(targetBall, deltaTime);
        } else {
            // 공이 없으면 중앙으로 이동
            this.moveToCenter(deltaTime);
        }
        
        // 패들 업데이트
        this.paddle.update();
    }

    selectTargetBall(balls) {
        // AI 패들에게 위협적인 공들 필터링
        const threateningBalls = balls.filter(ball => {
            // 하향 움직임이고 AI 영역에 접근하는 공들
            return ball.dy < 0 && ball.y > this.scene.cameras.main.height / 2;
        });
        
        if (threateningBalls.length === 0) {
            // 위협적인 공이 없으면 가장 가까운 공 선택
            return this.findClosestBall(balls);
        }
        
        // 가장 위험한 공 선택 (패들에 가장 빨리 도달할 공)
        return threateningBalls.reduce((closest, ball) => {
            const timeToReach = this.calculateTimeToReachPaddle(ball);
            const closestTimeToReach = this.calculateTimeToReachPaddle(closest);
            return timeToReach < closestTimeToReach ? ball : closest;
        });
    }

    findClosestBall(balls) {
        if (balls.length === 0) return null;
        
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        
        return balls.reduce((closest, ball) => {
            const distanceToBall = Math.abs(ball.x - paddleCenter);
            const distanceToClosest = Math.abs(closest.x - paddleCenter);
            return distanceToBall < distanceToClosest ? ball : closest;
        });
    }

    calculateTimeToReachPaddle(ball) {
        if (ball.dy >= 0) return Infinity; // 공이 위로 움직이면 무한대
        
        const distanceY = Math.abs(ball.y - this.paddle.y);
        return distanceY / Math.abs(ball.dy);
    }

    makeMovementDecision(targetBall, deltaTime) {
        // 공의 예상 위치 계산
        const predictedPosition = this.predictBallPosition(targetBall);
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        
        // 목표 위치까지의 거리
        const distance = predictedPosition.x - paddleCenter;
        const direction = Math.sign(distance);
        
        // 난이도에 따른 반응 임계값 조정
        const difficultyMultiplier = this.difficultyManager.getMultiplier();
        const reactionThreshold = 5 / difficultyMultiplier;
        
        // 움직임 결정
        if (Math.abs(distance) > reactionThreshold) {
            this.movePaddle(direction, difficultyMultiplier);
        } else {
            // 목표에 가까우면 속도 감소
            this.paddle.speed *= this.paddle.friction;
        }
    }

    predictBallPosition(ball) {
        // 공이 패들 높이에 도달할 때의 X 위치 예측
        const timeToReach = this.calculateTimeToReachPaddle(ball);
        
        if (timeToReach === Infinity) {
            return { x: ball.x, y: ball.y };
        }
        
        // 예측 정확도에 따른 오차 추가
        const accuracy = this.prediction.accuracy * this.difficultyManager.getMultiplier();
        const error = (1 - accuracy) * (Math.random() - 0.5) * 100;
        
        const predictedX = ball.x + ball.dx * timeToReach + error;
        
        return {
            x: Math.max(0, Math.min(this.scene.cameras.main.width, predictedX)),
            y: this.paddle.y
        };
    }

    movePaddle(direction, difficultyMultiplier) {
        // 난이도에 따른 가속도 적용
        const acceleration = this.paddle.baseAcceleration * difficultyMultiplier;
        
        // 전략에 따른 움직임 조정
        let strategyMultiplier = 1.0;
        switch (this.strategy) {
            case 'aggressive':
                strategyMultiplier = 1.2;
                break;
            case 'defensive':
                strategyMultiplier = 0.8;
                break;
            case 'balanced':
            default:
                strategyMultiplier = 1.0;
                break;
        }
        
        // 가속도 적용
        this.paddle.speed += direction * acceleration * strategyMultiplier;
        
        // 최대 속도 제한
        const maxSpeed = this.paddle.baseMaxSpeed * difficultyMultiplier;
        this.paddle.speed = Math.max(-maxSpeed, Math.min(maxSpeed, this.paddle.speed));
    }

    moveToCenter(deltaTime) {
        const screenCenter = this.scene.cameras.main.width / 2;
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        const distance = screenCenter - paddleCenter;
        
        if (Math.abs(distance) > 5) {
            const direction = Math.sign(distance);
            this.movePaddle(direction, 0.5); // 느린 속도로 중앙 이동
        } else {
            this.paddle.speed *= this.paddle.friction;
        }
    }

    updateDifficultyBasedBehavior(difficultyMultiplier) {
        // 난이도에 따른 AI 행동 패턴 조정
        if (difficultyMultiplier < 0.8) {
            // 쉬운 난이도 - 더 방어적
            this.strategy = 'defensive';
            this.prediction.accuracy = 0.6;
            this.behavior.aggressiveness = 0.3;
            this.behavior.defensiveness = 0.8;
        } else if (difficultyMultiplier > 1.5) {
            // 어려운 난이도 - 더 공격적
            this.strategy = 'aggressive';
            this.prediction.accuracy = 0.9;
            this.behavior.aggressiveness = 0.8;
            this.behavior.defensiveness = 0.4;
        } else {
            // 균형 잡힌 난이도
            this.strategy = 'balanced';
            this.prediction.accuracy = 0.8;
            this.behavior.aggressiveness = 0.5;
            this.behavior.defensiveness = 0.5;
        }
    }

    // AI 전략 변경 (게임 상황에 따라)
    adaptStrategy(gameState) {
        const playerBricks = gameState.bricks?.player1?.length || 0;
        const computerBricks = gameState.bricks?.player2?.length || 0;
        
        if (computerBricks > playerBricks * 1.5) {
            // 컴퓨터가 많이 뒤처짐 - 공격적 전략
            this.strategy = 'aggressive';
        } else if (playerBricks > computerBricks * 1.5) {
            // 컴퓨터가 많이 앞섬 - 방어적 전략
            this.strategy = 'defensive';
        } else {
            // 균형 상태 - 균형 전략
            this.strategy = 'balanced';
        }
    }

    // 디버그 정보 (개발 중에만 사용)
    getDebugInfo() {
        return {
            strategy: this.strategy,
            difficultyMultiplier: this.difficultyManager.getMultiplier(),
            paddleSpeed: this.paddle.speed,
            predictionAccuracy: this.prediction.accuracy,
            behavior: this.behavior
        };
    }
}
