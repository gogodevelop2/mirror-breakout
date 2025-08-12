/**
 * AI System
 * 동적 난이도 조절과 지능형 AI 패들 제어 시스템
 */

class AISystem {
    constructor(scene) {
        this.scene = scene;
        
        // AI 상태
        this.difficultyMultiplier = 1.0;
        this.lastDifficultyUpdate = 0;
        this.currentTarget = null;
        
        // AI 성능 통계
        this.aiStats = {
            totalHits: 0,
            missedBalls: 0,
            accuracy: 100,
            averageReactionTime: 0,
            reactionTimes: []
        };
        
        // 예측 시스템
        this.ballPrediction = {
            enabled: true,
            lookaheadTime: 1000, // 1초 미리 예측
            predictionAccuracy: 0.8 // 80% 정확도
        };
        
        // AI 개성 설정 (확장 가능)
        this.aiPersonality = {
            aggressiveness: 1.0,    // 공격성 (빠른 반응)
            defensiveness: 0.8,     // 수비력 (정확한 위치선정)
            adaptability: 1.0,      // 적응력 (난이도 변화 속도)
            consistency: 0.9        // 일관성 (실수 빈도)
        };
        
        console.log('AISystem initialized');
    }
    
    /**
     * AI 시스템 설정
     */
    setup(aiPaddle, playerPaddle, balls, bricks) {
        this.aiPaddle = aiPaddle;
        this.playerPaddle = playerPaddle;
        this.balls = balls;
        this.bricks = bricks;
        
        this.resetAI();
    }
    
    /**
     * AI 시스템 업데이트 (메인 루프)
     */
    update(deltaTime) {
        if (!this.aiPaddle || !this.aiPaddle.active) return;
        
        // 1. 난이도 업데이트
        this.updateDynamicDifficulty();
        
        // 2. 타겟 볼 선택
        this.selectTargetBall();
        
        // 3. AI 이동 결정
        this.updateAIMovement(deltaTime);
        
        // 4. 성능 통계 업데이트
        this.updateAIStats();
        
        // 5. AI 개성 적용
        this.applyPersonalityTraits();
    }
    
    /**
     * 동적 난이도 조절 시스템
     */
    updateDynamicDifficulty() {
        const now = Date.now();
        if (now - this.lastDifficultyUpdate < GameConfig.AI.DIFFICULTY_UPDATE_INTERVAL) {
            return;
        }
        
        this.lastDifficultyUpdate = now;
        
        // 현재 게임 상황 분석
        const gameState = this.analyzeGameState();
        
        // 목표 난이도 계산
        const targetMultiplier = this.calculateTargetDifficulty(gameState);
        
        // 부드러운 난이도 전환
        const oldMultiplier = this.difficultyMultiplier;
        this.difficultyMultiplier = this.lerp(
            this.difficultyMultiplier,
            targetMultiplier,
            GameConfig.AI.LERP_FACTOR * this.aiPersonality.adaptability
        );
        
        // 난이도가 변경되었으면 AI 패들에 적용
        if (Math.abs(oldMultiplier - this.difficultyMultiplier) > 0.01) {
            this.applyDifficultyToAI();
            
            console.log(`AI Difficulty updated: ${this.difficultyMultiplier.toFixed(2)}x`);
        }
    }
    
    /**
     * 게임 상태 분석
     */
    analyzeGameState() {
        const playerBricks = this.bricks.player ? this.bricks.player.children.entries.length : 0;
        const aiBricks = this.bricks.ai ? this.bricks.ai.children.entries.length : 0;
        
        const totalPlayerBricks = GameConfig.CALCULATED.TOTAL_BRICKS;
        const totalAIBricks = GameConfig.CALCULATED.TOTAL_BRICKS;
        
        const playerProgress = (totalPlayerBricks - playerBricks) / totalPlayerBricks;
        const aiProgress = (totalAIBricks - aiBricks) / totalAIBricks;
        
        return {
            playerBricks,
            aiBricks,
            playerProgress,
            aiProgress,
            brickDifference: aiBricks - playerBricks,
            progressDifference: aiProgress - playerProgress,
            activeBalls: this.balls ? this.balls.children.entries.length : 0
        };
    }
    
    /**
     * 목표 난이도 계산
     */
    calculateTargetDifficulty(gameState) {
        let targetMultiplier = 1.0;
        
        // 벽돌 수 차이에 따른 조정
        const brickDiff = gameState.brickDifference;
        
        if (brickDiff > 0) {
            // AI가 뒤처지고 있음 → 난이도 증가
            targetMultiplier = Math.min(
                GameConfig.AI.MAX_MULTIPLIER,
                1.0 + (brickDiff * GameConfig.AI.SPEED_ADJUSTMENT_FACTOR)
            );
        } else if (brickDiff < 0) {
            // AI가 앞서고 있음 → 난이도 감소  
            targetMultiplier = Math.max(
                GameConfig.AI.MIN_MULTIPLIER,
                1.0 + (brickDiff * GameConfig.AI.SPEED_ADJUSTMENT_FACTOR * 0.75)
            );
        }
        
        // 진행도 차이에 따른 미세 조정
        const progressDiff = gameState.progressDifference;
        if (Math.abs(progressDiff) > 0.2) {
            const progressAdjustment = progressDiff * 0.3;
            targetMultiplier *= (1 + progressAdjustment);
        }
        
        // 공 개수에 따른 조정
        if (gameState.activeBalls > 2) {
            targetMultiplier *= 1.1; // 공이 많으면 조금 더 어렵게
        }
        
        // AI 성능에 따른 조정
        if (this.aiStats.accuracy < 70) {
            targetMultiplier *= 0.9; // 정확도가 낮으면 조금 쉽게
        } else if (this.aiStats.accuracy > 90) {
            targetMultiplier *= 1.1; // 정확도가 높으면 조금 어렵게
        }
        
        return Phaser.Math.Clamp(
            targetMultiplier,
            GameConfig.AI.MIN_MULTIPLIER,
            GameConfig.AI.MAX_MULTIPLIER
        );
    }
    
    /**
     * AI 패들에 난이도 적용
     */
    applyDifficultyToAI() {
        if (this.aiPaddle && this.aiPaddle.setDifficultyMultiplier) {
            this.aiPaddle.setDifficultyMultiplier(this.difficultyMultiplier);
        }
        
        // 반응 시간도 조정
        this.ballPrediction.predictionAccuracy = Math.min(
            0.95,
            0.6 + (this.difficultyMultiplier - 0.6) * 0.5
        );
    }
    
    /**
     * 타겟 볼 선택
     */
    selectTargetBall() {
        if (!this.balls || !this.balls.children) {
            this.currentTarget = null;
            return;
        }
        
        const activeBalls = this.balls.children.entries.filter(ball => ball.active);
        
        if (activeBalls.length === 0) {
            this.currentTarget = null;
            return;
        }
        
        // AI 방향으로 오는 공들 필터링
        const approachingBalls = activeBalls.filter(ball => {
            const velocity = ball.body.velocity;
            const isComingTowardsAI = velocity.y < 0; // AI는 상단에 있음
            
            // AI 패들 근처로 오는 공인지 확인
            const predictedX = this.predictBallPosition(ball, 1.0).x;
            const paddleX = this.aiPaddle.x;
            const distance = Math.abs(predictedX - paddleX);
            
            return isComingTowardsAI && distance < GameConfig.CANVAS.WIDTH * 0.7;
        });
        
        if (approachingBalls.length === 0) {
            // 오는 공이 없으면 가장 가까운 공을 타겟
            this.currentTarget = this.findClosestBall(activeBalls);
        } else {
            // 가장 위험한 공을 선택 (가장 빨리 도착하는 공)
            this.currentTarget = this.findMostUrgentBall(approachingBalls);
        }
    }
    
    /**
     * 가장 가까운 공 찾기
     */
    findClosestBall(balls) {
        let closest = null;
        let minDistance = Infinity;
        
        balls.forEach(ball => {
            const distance = Math.abs(ball.y - this.aiPaddle.y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = ball;
            }
        });
        
        return closest;
    }
    
    /**
     * 가장 위험한 공 찾기
     */
    findMostUrgentBall(balls) {
        let mostUrgent = null;
        let minTimeToReach = Infinity;
        
        balls.forEach(ball => {
            const timeToReach = this.calculateTimeToReachPaddle(ball);
            if (timeToReach < minTimeToReach && timeToReach > 0) {
                minTimeToReach = timeToReach;
                mostUrgent = ball;
            }
        });
        
        return mostUrgent || balls[0];
    }
    
    /**
     * 공이 패들에 도달하는 시간 계산
     */
    calculateTimeToReachPaddle(ball) {
        const distanceY = Math.abs(ball.y - this.aiPaddle.y);
        const velocityY = Math.abs(ball.body.velocity.y);
        
        return velocityY > 0 ? distanceY / velocityY : Infinity;
    }
    
    /**
     * 공 위치 예측
     */
    predictBallPosition(ball, timeAhead) {
        const velocity = ball.body.velocity;
        const currentPos = { x: ball.x, y: ball.y };
        
        // 직선 예측 (기본)
        let predictedX = currentPos.x + velocity.x * timeAhead;
        let predictedY = currentPos.y + velocity.y * timeAhead;
        
        // 벽 반사 고려
        if (predictedX < 0 || predictedX > GameConfig.CANVAS.WIDTH) {
            const wallTime = (predictedX < 0 ? -currentPos.x : GameConfig.CANVAS.WIDTH - currentPos.x) / velocity.x;
            if (wallTime > 0 && wallTime < timeAhead) {
                // 벽에서 반사됨
                const remainingTime = timeAhead - wallTime;
                const reflectionX = predictedX < 0 ? 0 : GameConfig.CANVAS.WIDTH;
                predictedX = reflectionX - velocity.x * remainingTime;
            }
        }
        
        // 예측 정확도 적용 (실수 시뮬레이션)
        const accuracy = this.ballPrediction.predictionAccuracy * this.aiPersonality.consistency;
        const errorRange = (1 - accuracy) * 50; // 최대 50픽셀 오차
        
        predictedX += (Math.random() - 0.5) * errorRange;
        
        return { x: predictedX, y: predictedY };
    }
    
    /**
     * AI 움직임 업데이트
     */
    updateAIMovement(deltaTime) {
        if (!this.currentTarget || !this.aiPaddle) return;
        
        // 반응 시간 시뮬레이션
        const reactionDelay = this.calculateReactionDelay();
        
        // 목표 위치 계산 (예측 위치)
        const lookaheadTime = this.ballPrediction.lookaheadTime / 1000; // 초 단위
        const targetPosition = this.predictBallPosition(this.currentTarget, lookaheadTime);
        
        // 패들 중앙을 기준으로 한 목표 X 좌표
        const targetX = targetPosition.x - this.aiPaddle.paddleWidth / 2;
        const currentX = this.aiPaddle.x;
        const diff = targetX - currentX;
        
        // 데드존 (너무 미세한 움직임 방지)
        const deadzone = GameConfig.AI.REACTION_THRESHOLD_BASE / this.difficultyMultiplier;
        
        if (Math.abs(diff) > deadzone) {
            // 이동 속도 계산
            const moveSpeed = this.aiPaddle.maxSpeed * this.aiPersonality.aggressiveness;
            const direction = Math.sign(diff);
            
            // 반응 지연 적용
            if (Date.now() - (this.lastTargetChange || 0) > reactionDelay) {
                this.aiPaddle.moveTowards(targetX, moveSpeed);
            }
        } else {
            // 목표 위치에 거의 도착했으면 정지
            this.aiPaddle.moveTowards(currentX, 0);
        }
    }
    
    /**
     * 반응 지연 계산
     */
    calculateReactionDelay() {
        const baseDelay = 100; // 100ms 기본 반응 시간
        const difficultyFactor = 2.0 - this.difficultyMultiplier; // 어려울수록 반응 빨라짐
        const personalityFactor = this.aiPersonality.aggressiveness;
        
        return Math.max(50, baseDelay * difficultyFactor / personalityFactor);
    }
    
    /**
     * AI 성능 통계 업데이트
     */
    updateAIStats() {
        // 정확도 계산
        if (this.aiStats.totalHits + this.aiStats.missedBalls > 0) {
            this.aiStats.accuracy = (this.aiStats.totalHits / 
                (this.aiStats.totalHits + this.aiStats.missedBalls)) * 100;
        }
        
        // 평균 반응 시간
        if (this.aiStats.reactionTimes.length > 0) {
            const sum = this.aiStats.reactionTimes.reduce((a, b) => a + b, 0);
            this.aiStats.averageReactionTime = sum / this.aiStats.reactionTimes.length;
            
            // 최근 10개만 유지
            if (this.aiStats.reactionTimes.length > 10) {
                this.aiStats.reactionTimes.shift();
            }
        }
    }
    
    /**
     * AI 개성 특성 적용
     */
    applyPersonalityTraits() {
        // 일관성에 따른 랜덤 실수
        if (Math.random() > this.aiPersonality.consistency) {
            // 가끔씩 의도적으로 실수
            const errorOffset = (Math.random() - 0.5) * 30;
            if (this.aiPaddle && this.currentTarget) {
                this.aiPaddle.moveTowards(this.aiPaddle.x + errorOffset, this.aiPaddle.maxSpeed * 0.5);
            }
        }
    }
    
    /**
     * AI 이벤트 처리
     */
    onBallHit(ball, paddle) {
        if (paddle === this.aiPaddle) {
            this.aiStats.totalHits++;
            
            // 반응 시간 기록
            if (this.ballDetectionTime) {
                const reactionTime = Date.now() - this.ballDetectionTime;
                this.aiStats.reactionTimes.push(reactionTime);
            }
            
            console.log('AI hit ball - Accuracy:', this.aiStats.accuracy.toFixed(1) + '%');
        }
    }
    
    onBallMissed(ball) {
        // AI가 놓친 공인지 확인
        if (ball.y < GameConfig.CANVAS.HEIGHT / 2) {
            this.aiStats.missedBalls++;
            console.log('AI missed ball - Accuracy:', this.aiStats.accuracy.toFixed(1) + '%');
        }
    }
    
    /**
     * 새로운 타겟 감지 시
     */
    onNewTarget(ball) {
        this.ballDetectionTime = Date.now();
        this.lastTargetChange = Date.now();
    }
    
    /**
     * 보간 함수
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    /**
     * AI 리셋
     */
    resetAI() {
        this.difficultyMultiplier = 1.0;
        this.lastDifficultyUpdate = 0;
        this.currentTarget = null;
        this.ballDetectionTime = null;
        this.lastTargetChange = null;
        
        this.aiStats = {
            totalHits: 0,
            missedBalls: 0,
            accuracy: 100,
            averageReactionTime: 0,
            reactionTimes: []
        };
        
        console.log('AI system reset');
    }
    
    /**
     * AI 개성 설정
     */
    setPersonality(traits) {
        this.aiPersonality = { ...this.aiPersonality, ...traits };
        console.log('AI personality updated:', this.aiPersonality);
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            difficulty: this.difficultyMultiplier,
            target: this.currentTarget ? {
                x: this.currentTarget.x,
                y: this.currentTarget.y,
                id: this.currentTarget.name
            } : null,
            stats: { ...this.aiStats },
            personality: { ...this.aiPersonality },
            prediction: {
                enabled: this.ballPrediction.enabled,
                accuracy: this.ballPrediction.predictionAccuracy
            }
        };
    }
    
    /**
     * AI 설정 변경 (개발/테스트용)
     */
    setDifficulty(multiplier) {
        this.difficultyMultiplier = Phaser.Math.Clamp(
            multiplier,
            GameConfig.AI.MIN_MULTIPLIER,
            GameConfig.AI.MAX_MULTIPLIER
        );
        this.applyDifficultyToAI();
    }
    
    setPredictionAccuracy(accuracy) {
        this.ballPrediction.predictionAccuracy = Phaser.Math.Clamp(accuracy, 0.1, 0.95);
    }
    
    /**
     * 정리
     */
    destroy() {
        this.currentTarget = null;
        this.aiPaddle = null;
        this.balls = null;
        this.bricks = null;
        
        console.log('AISystem destroyed');
    }
}

/**
 * AI 개성 프리셋들
 */
AISystem.PERSONALITY_PRESETS = {
    // 균형 잡힌 AI (기본)
    BALANCED: {
        aggressiveness: 1.0,
        defensiveness: 1.0,
        adaptability: 1.0,
        consistency: 0.9
    },
    
    // 공격적인 AI
    AGGRESSIVE: {
        aggressiveness: 1.3,
        defensiveness: 0.8,
        adaptability: 1.2,
        consistency: 0.85
    },
    
    // 수비적인 AI
    DEFENSIVE: {
        aggressiveness: 0.8,
        defensiveness: 1.3,
        adaptability: 0.9,
        consistency: 0.95
    },
    
    // 불안정한 AI (실수가 많음)
    ERRATIC: {
        aggressiveness: 1.1,
        defensiveness: 1.1,
        adaptability: 1.4,
        consistency: 0.7
    },
    
    // 완벽주의 AI (실수가 적음)
    PERFECTIONIST: {
        aggressiveness: 0.9,
        defensiveness: 1.1,
        adaptability: 0.8,
        consistency: 0.98
    }
};
