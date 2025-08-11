// AI 시스템
class AISystem {
    constructor(scene, paddle) {
        this.scene = scene;
        this.paddle = paddle;
        
        // AI 설정
        this.reactionTime = GAME_CONFIG.PADDLE.AI.REACTION_TIME;
        this.lastUpdateTime = 0;
        this.difficulty = 1.0; // 난이도 배수
        
        // 예측 관련
        this.predictedX = null;
        this.predictionAccuracy = 0.8; // 80% 정확도
        
        // 상태
        this.state = 'idle'; // idle, tracking, returning
    }
    
    update(time, balls) {
        // 반응 시간 체크
        if (time - this.lastUpdateTime < this.reactionTime / this.difficulty) {
            return;
        }
        
        this.lastUpdateTime = time;
        
        // 가장 가까운 공 찾기
        const targetBall = this.findTargetBall(balls);
        
        if (targetBall) {
            this.state = 'tracking';
            this.trackBall(targetBall);
        } else {
            this.state = 'returning';
            this.returnToCenter();
        }
    }
    
    findTargetBall(balls) {
        // AI 패들 방향으로 오는 공 중 가장 가까운 것 선택
        let closestBall = null;
        let closestDistance = Infinity;
        
        balls.forEach(ball => {
            // 공이 AI 패들 방향으로 이동 중인지 체크
            const isMovingTowardsAI = this.paddle.y > this.scene.cameras.main.height / 2
                ? ball.body.velocity.y > 0  // 하단 패들
                : ball.body.velocity.y < 0; // 상단 패들
            
            if (isMovingTowardsAI) {
                const distance = Math.abs(ball.y - this.paddle.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBall = ball;
                }
            }
        });
        
        return closestBall;
    }
    
    trackBall(ball) {
        // 공의 예상 도착 위치 계산
        const predictedX = this.predictBallPosition(ball);
        
        // 난이도에 따른 오차 추가
        const error = (1 - this.predictionAccuracy) * 100;
        const randomError = Phaser.Math.Between(-error, error);
        const targetX = predictedX + randomError;
        
        // 패들 이동
        this.paddle.setTargetX(targetX);
    }
    
    predictBallPosition(ball) {
        // 공이 패들에 도달할 때의 X 위치 예측
        const ballVx = ball.body.velocity.x;
        const ballVy = ball.body.velocity.y;
        
        if (Math.abs(ballVy) < 0.1) {
            return ball.x; // 수직 속도가 거의 없으면 현재 위치
        }
        
        // 패들까지의 시간 계산
        const distance = Math.abs(this.paddle.y - ball.y);
        const timeToReach = distance / Math.abs(ballVy);
        
        // 예상 X 위치 (벽 반사 고려)
        let predictedX = ball.x + ballVx * timeToReach;
        const width = this.scene.cameras.main.width;
        
        // 벽 반사 시뮬레이션
        while (predictedX < 0 || predictedX > width) {
            if (predictedX < 0) {
                predictedX = -predictedX;
            } else if (predictedX > width) {
                predictedX = 2 * width - predictedX;
            }
        }
        
        return predictedX;
    }
    
    returnToCenter() {
        // 중앙으로 복귀
        const centerX = this.scene.cameras.main.width / 2;
        const currentX = this.paddle.x;
        
        // 부드럽게 중앙으로 이동
        const diff = centerX - currentX;
        if (Math.abs(diff) > 20) {
            const targetX = currentX + diff * 0.1;
            this.paddle.setTargetX(targetX);
        }
    }
    
    setDifficulty(level) {
        // 난이도 조정 (0.5 ~ 2.0)
        this.difficulty = Phaser.Math.Clamp(level, 0.5, 2.0);
        this.predictionAccuracy = 0.6 + (this.difficulty * 0.2);
        this.reactionTime = GAME_CONFIG.PADDLE.AI.REACTION_TIME / this.difficulty;
    }
    
    reset() {
        this.state = 'idle';
        this.predictedX = null;
        this.lastUpdateTime = 0;
    }
}
