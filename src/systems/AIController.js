// AI 패들 제어 시스템
class AIController {
    constructor(scene, paddleBody, difficultyManager) {
        this.scene = scene;
        this.paddleBody = paddleBody;
        this.difficultyManager = difficultyManager;
        this.config = GameConfig.gameplay.paddle.ai;
        
        // AI 상태
        this.targetX = paddleBody.position.x;
        this.reactionTime = 0;
        this.strategy = 'balanced'; // 'defensive', 'aggressive', 'balanced'
        this.lastBallPosition = { x: 0, y: 0 };
        this.predictedBallPosition = { x: 0, y: 0 };
        
        // 성능 최적화를 위한 업데이트 간격
        this.updateInterval = 50; // 50ms마다 업데이트
        this.lastUpdate = 0;
        
        // AI 행동 가중치
        this.weights = {
            ballTracking: 0.7,      // 공 추적
            centerTendency: 0.2,    // 중앙으로 복귀 성향
            randomness: 0.1,        // 랜덤 움직임
            prediction: 0.6         // 예측 움직임
        };
        
        this.init();
    }

    init() {
        // 난이도에 따른 초기 설정 조정
        this.adjustSettingsForDifficulty();
        
        // 전략 초기화
        this.setStrategy('balanced');
    }

    update(balls, deltaTime) {
        const now = Date.now();
        
        // 업데이트 간격 제어
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        this.lastUpdate = now;
        
        // 난이도 조정 반영
        this.adjustSettingsForDifficulty();
        
        // 타겟 공 선택
        const targetBall = this.selectTargetBall(balls);
        
        if (targetBall) {
            // 공 위치 예측
            this.predictBallPosition(targetBall, deltaTime);
            
            // 타겟 위치 계산
            this.calculateTargetPosition(targetBall);
            
            // 패들 이동
            this.movePaddle(deltaTime);
        } else {
            // 공이 없을 때는 중앙으로 복귀
            this.returnToCenter();
        }
        
        // 반응 시간 업데이트 (인간적인 지연 시뮬레이션)
        this.updateReactionTime();
    }

    selectTargetBall(balls) {
        if (!balls || balls.length === 0) return null;
        
        const paddleY = this.paddleBody.position.y;
        const gameHeight = this.scene.sys.game.config.height;
        const isAIInUpperHalf = paddleY < gameHeight / 2;
        
        // AI 영역으로 향하는 공들 필터링
        const threateningBalls = balls.filter(ball => {
            const ballBody = ball.body || ball;
            const velocity = ballBody.velocity;
            const position = ballBody.position;
            
            // AI가 위쪽에 있다면 위로 향하는 공, 아래쪽에 있다면 아래로 향하는 공
            if (isAIInUpperHalf) {
                return velocity.y < 0 && position.y > gameHeight / 2;
            } else {
                return velocity.y > 0 && position.y < gameHeight / 2;
            }
        });
        
        if (threateningBalls.length === 0) {
            // 위협적인 공이 없다면 가장 가까운 공 선택
            return this.findClosestBall(balls);
        }
        
        // 전략에 따른 공 선택
        switch (this.strategy) {
            case 'defensive':
                return this.findMostThreateningBall(threateningBalls);
            case 'aggressive':
                return this.findBestOffensiveBall(balls);
            default: // balanced
                return this.findOptimalBall(threateningBalls);
        }
    }

    findClosestBall(balls) {
        const paddlePos = this.paddleBody.position;
        let closestBall = null;
        let minDistance = Infinity;
        
        balls.forEach(ball => {
            const ballBody = ball.body || ball;
            const distance = Phaser.Math.Distance.Between(
                paddlePos.x, paddlePos.y,
                ballBody.position.x, ballBody.position.y
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestBall = ball;
            }
        });
        
        return closestBall;
    }

    findMostThreateningBall(balls) {
        // 가장 빨리 도달할 공 찾기
        const paddleY = this.paddleBody.position.y;
        let mostThreatening = null;
        let shortestTime = Infinity;
        
        balls.forEach(ball => {
            const ballBody = ball.body || ball;
            const timeToReach = Math.abs(paddleY - ballBody.position.y) / Math.abs(ballBody.velocity.y);
            
            if (timeToReach < shortestTime) {
                shortestTime = timeToReach;
                mostThreatening = ball;
            }
        });
        
        return mostThreatening;
    }

    findBestOffensiveBall(balls) {
        // 공격적 전략: 상대방 영역의 공 우선
        const gameHeight = this.scene.sys.game.config.height;
        const paddleY = this.paddleBody.position.y;
        const isAIInUpperHalf = paddleY < gameHeight / 2;
        
        const offensiveBalls = balls.filter(ball => {
            const ballBody = ball.body || ball;
            const position = ballBody.position;
            
            // 상대방 영역의 공들
            if (isAIInUpperHalf) {
                return position.y > gameHeight / 2;
            } else {
                return position.y < gameHeight / 2;
            }
        });
        
        return offensiveBalls.length > 0 ? 
            this.findClosestBall(offensiveBalls) : 
            this.findClosestBall(balls);
    }

    findOptimalBall(balls) {
        // 균형잡힌 전략: 위치와 위험도를 모두 고려
        const paddlePos = this.paddleBody.position;
        let bestBall = null;
        let bestScore = -Infinity;
        
        balls.forEach(ball => {
            const ballBody = ball.body || ball;
            const distance = Phaser.Math.Distance.Between(
                paddlePos.x, paddlePos.y,
                ballBody.position.x, ballBody.position.y
            );
            
            const speed = Math.sqrt(ballBody.velocity.x ** 2 + ballBody.velocity.y ** 2);
            const timeToReach = distance / (speed + 0.1); // 0으로 나누기 방지
            
            // 점수 계산 (거리가 가깝고 빠를수록 높은 점수)
            const score = (1000 / distance) + (speed / timeToReach);
            
            if (score > bestScore) {
                bestScore = score;
                bestBall = ball;
            }
        });
        
        return bestBall;
    }

    predictBallPosition(ball, deltaTime) {
        const ballBody = ball.body || ball;
        const velocity = ballBody.velocity;
        const position = ballBody.position;
        const gameWidth = this.scene.sys.game.config.width;
        
        // 예측 시간 (난이도에 따라 조절)
        const predictionTime = this.difficultyManager.getMultiplier() * 0.5;
        
        // 기본 예측 (벽 반사 고려하지 않음)
        let predictedX = position.x + velocity.x * predictionTime;
        let predictedY = position.y + velocity.y * predictionTime;
        
        // 좌우 벽 반사 고려
        if (predictedX < 0 || predictedX > gameWidth) {
            const wallTime = predictedX < 0 ? 
                -position.x / velocity.x : 
                (gameWidth - position.x) / velocity.x;
            
            if (wallTime > 0 && wallTime < predictionTime) {
                const remainingTime = predictionTime - wallTime;
                const wallX = predictedX < 0 ? 0 : gameWidth;
                const wallY = position.y + velocity.y * wallTime;
                
                // 반사 후 위치
                predictedX = wallX - velocity.x * remainingTime;
                predictedY = wallY + velocity.y * remainingTime;
            }
        }
        
        this.predictedBallPosition = { x: predictedX, y: predictedY };
    }

    calculateTargetPosition(ball) {
        const ballBody = ball.body || ball;
        const currentBallX = ballBody.position.x;
        const paddleWidth = GameConfig.gameplay.paddle.width;
        const gameWidth = this.scene.sys.game.config.width;
        
        // 기본 타겟은 공의 X 위치
        let targetX = currentBallX;
        
        // 예측 위치 사용 (가중치 적용)
        targetX = targetX * (1 - this.weights.prediction) + 
                 this.predictedBallPosition.x * this.weights.prediction;
        
        // 전략별 조정
        switch (this.strategy) {
            case 'defensive':
                // 수비적: 공을 정확히 중앙으로
                break;
            case 'aggressive':
                // 공격적: 각도를 만들기 위해 약간 옆으로
                const angleOffset = (Math.random() - 0.5) * paddleWidth * 0.3;
                targetX += angleOffset;
                break;
            default: // balanced
                // 균형: 약간의 랜덤성 추가
                const randomOffset = (Math.random() - 0.5) * paddleWidth * 0.1;
                targetX += randomOffset;
        }
        
        // 중앙 복귀 성향 적용
        const centerX = gameWidth / 2;
        const centerPull = (centerX - targetX) * this.weights.centerTendency;
        targetX += centerPull;
        
        // 랜덤성 추가 (인간적인 부정확성)
        const randomNoise = (Math.random() - 0.5) * paddleWidth * this.weights.randomness;
        targetX += randomNoise;
        
        // 화면 경계 제한
        this.targetX = Phaser.Math.Clamp(targetX, paddleWidth / 2, gameWidth - paddleWidth / 2);
    }

    movePaddle(deltaTime) {
        const currentX = this.paddleBody.position.x;
        const diff = this.targetX - currentX;
        const difficultyMultiplier = this.difficultyManager.getMultiplier();
        
        // 반응 임계값 (난이도에 따라 조절)
        const threshold = this.config.reactionThreshold / difficultyMultiplier;
        
        if (Math.abs(diff) > threshold) {
            // 이동 속도 계산
            const maxSpeed = this.config.baseSpeed * difficultyMultiplier;
            const acceleration = this.config.baseAcceleration * difficultyMultiplier;
            
            // 거리에 비례한 속도 (가까우면 천천히, 멀면 빠르게)
            const speedRatio = Math.min(Math.abs(diff) / 100, 1);
            const targetSpeed = maxSpeed * speedRatio;
            
            // 방향 결정
            const direction = Math.sign(diff);
            const force = direction * targetSpeed * acceleration;
            
            // 반응 시간 지연 적용
            if (this.reactionTime <= 0) {
                this.scene.matter.setVelocityX(this.paddleBody, force);
            }
        } else {
            // 목표에 도달했으면 정지
            this.scene.matter.setVelocityX(this.paddleBody, 0);
        }
        
        // 위치 제한
        const gameWidth = this.scene.sys.game.config.width;
        const paddleWidth = GameConfig.gameplay.paddle.width;
        const clampedX = Phaser.Math.Clamp(
            this.paddleBody.position.x, 
            paddleWidth / 2, 
            gameWidth - paddleWidth / 2
        );
        
        if (clampedX !== this.paddleBody.position.x) {
            this.scene.matter.body.setPosition(this.paddleBody, { 
                x: clampedX, 
                y: this.paddleBody.position.y 
            });
        }
    }

    returnToCenter() {
        const gameWidth = this.scene.sys.game.config.width;
        this.targetX = gameWidth / 2;
        this.movePaddle();
    }

    updateReactionTime() {
        if (this.reactionTime > 0) {
            this.reactionTime -= this.updateInterval;
        }
        
        // 가끔 새로운 반응 지연 추가 (인간적인 특성)
        if (Math.random() < 0.02) { // 2% 확률
            const difficultyMultiplier = this.difficultyManager.getMultiplier();
            this.reactionTime = (100 + Math.random() * 200) / difficultyMultiplier;
        }
    }

    adjustSettingsForDifficulty() {
        const multiplier = this.difficultyManager.getMultiplier();
        
        // 업데이트 간격 조정
        this.updateInterval = Math.max(30, 100 / multiplier);
        
        // 가중치 조정
        this.weights.prediction = Math.min(0.9, 0.3 + multiplier * 0.3);
        this.weights.randomness = Math.max(0.05, 0.15 - multiplier * 0.05);
        
        // 전략 변경
        if (multiplier > 1.5) {
            this.setStrategy('aggressive');
        } else if (multiplier < 0.8) {
            this.setStrategy('defensive');
        } else {
            this.setStrategy('balanced');
        }
    }

    setStrategy(strategy) {
        this.strategy = strategy;
        
        switch (strategy) {
            case 'defensive':
                this.weights.ballTracking = 0.8;
                this.weights.centerTendency = 0.15;
                this.weights.randomness = 0.05;
                break;
            case 'aggressive':
                this.weights.ballTracking = 0.6;
                this.weights.centerTendency = 0.1;
                this.weights.randomness = 0.3;
                break;
            default: // balanced
                this.weights.ballTracking = 0.7;
                this.weights.centerTendency = 0.2;
                this.weights.randomness = 0.1;
        }
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            strategy: this.strategy,
            targetX: this.targetX,
            currentX: this.paddleBody.position.x,
            reactionTime: this.reactionTime,
            weights: this.weights,
            difficulty: this.difficultyManager.getMultiplier()
        };
    }

    // 정리
    destroy() {
        this.scene = null;
        this.paddleBody = null;
        this.difficultyManager = null;
    }
}

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIController;
} else {
    window.AIController = AIController;
}
