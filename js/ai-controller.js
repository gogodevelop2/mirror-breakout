// js/ai-controller.js
// Mirror Breakout - AI Controller

/**
 * AI 패들 컨트롤러
 * 공 추적, 난이도 조절, 움직임 계산을 담당
 */
class AIController {
    constructor(config) {
        this.config = config;

        // AI 상태
        this.difficulty = 1.0;
        this.color = config.COLORS.AI_BASE;
        this.targetBallId = null;
        this.lastDifficultyUpdate = 0;

        // 현재 속도 (가속도 시스템용)
        this.velocity = 0;
    }

    /**
     * AI 상태 초기화
     */
    reset() {
        this.difficulty = 1.0;
        this.color = this.config.COLORS.AI_BASE;
        this.targetBallId = null;
        this.lastDifficultyUpdate = 0;
        this.velocity = 0;
    }

    /**
     * 추적할 공 선택
     * @param {Array} balls - 모든 공 엔티티
     * @param {Object} paddlePos - AI 패들 위치 {x, y}
     * @returns {Object|null} 선택된 공 또는 null
     */
    selectTargetBall(balls, paddlePos) {
        if (balls.length === 0) return null;

        let targetBall = null;
        let minDistance = Infinity;

        balls.forEach(ball => {
            const ballPos = ball.body.getPosition();
            const ballVel = ball.body.getLinearVelocity();

            // AI가 관심을 가져야 하는 공인지 판단
            if (Utils.shouldAITrackBall(ballPos, ballVel)) {
                const distance = Math.abs(ballPos.y - paddlePos.y);

                if (distance < minDistance) {
                    minDistance = distance;
                    targetBall = ball;
                }
            }
        });

        return targetBall;
    }

    /**
     * 목표 속도 계산
     * @param {Object|null} targetBall - 추적 대상 공
     * @param {Object} paddlePos - 패들 위치
     * @returns {number} 목표 속도
     */
    calculateTargetVelocity(targetBall, paddlePos) {
        if (targetBall) {
            const ballX = targetBall.body.getPosition().x;
            const diff = ballX - paddlePos.x;

            // 난이도에 따른 최대 속도 및 반응 임계값
            const maxSpeed = this.config.PADDLE.AI_BASE_SPEED * this.difficulty;
            const reactionThreshold = 0.05 / this.difficulty;

            if (Math.abs(diff) > reactionThreshold) {
                return Math.sign(diff) * Math.min(Math.abs(diff) * 6, maxSpeed);
            }
        } else {
            // 위협적인 공이 없으면 중앙으로 이동
            const centerX = this.config.WORLD_WIDTH / 2;
            const diff = centerX - paddlePos.x;

            if (Math.abs(diff) > 0.1) {
                return Math.sign(diff) * Math.min(
                    Math.abs(diff) * 3,
                    this.config.PADDLE.AI_BASE_SPEED * 0.5
                );
            }
        }

        return 0;
    }

    /**
     * 가속도 적용 및 속도 업데이트
     * @param {number} targetVelocity - 목표 속도
     * @returns {number} 최종 속도
     */
    updateVelocity(targetVelocity) {
        if (targetVelocity !== 0) {
            const diff = targetVelocity - this.velocity;
            const accelAmount = Math.sign(diff) * this.config.PADDLE.ACCELERATION * 1.2;

            if (Math.abs(diff) < this.config.PADDLE.ACCELERATION) {
                this.velocity = targetVelocity;
            } else {
                this.velocity += accelAmount;
            }
        } else {
            // 마찰 적용
            this.velocity *= this.config.PADDLE.AI_FRICTION;

            if (Math.abs(this.velocity) < 0.1) {
                this.velocity = 0;
            }
        }

        // 최대 속도 제한
        const maxSpeed = this.config.PADDLE.AI_BASE_SPEED * this.difficulty;
        this.velocity = Utils.clampSymmetric(this.velocity, maxSpeed);

        return this.velocity;
    }

    /**
     * 난이도 업데이트
     * @param {number} playerBricks - 플레이어 타겟 브릭 수
     * @param {number} aiBricks - AI 타겟 브릭 수
     */
    updateDifficulty(playerBricks, aiBricks) {
        const now = Date.now();
        if (now - this.lastDifficultyUpdate < this.config.DIFFICULTY.UPDATE_INTERVAL) {
            return;
        }

        this.lastDifficultyUpdate = now;

        // 남은 타겟 브릭 차이 계산
        const diff = aiBricks - playerBricks;

        let targetDifficulty = 1.0;

        if (diff > 0) {
            // AI가 지고 있음 - 난이도 증가
            targetDifficulty = Math.min(
                this.config.DIFFICULTY.MAX,
                1.0 + diff * this.config.DIFFICULTY.INCREASE_RATE
            );
        } else if (diff < 0) {
            // AI가 이기고 있음 - 난이도 감소
            targetDifficulty = Math.max(
                this.config.DIFFICULTY.MIN,
                1.0 + diff * this.config.DIFFICULTY.DECREASE_RATE
            );
        }

        // 부드러운 전환 (lerp)
        this.difficulty += (targetDifficulty - this.difficulty) * this.config.DIFFICULTY.LERP_FACTOR;

        // 패들 색상 업데이트
        this.color = Utils.getAIDifficultyColor(this.difficulty);
    }

    /**
     * AI 전체 업데이트 (편의 메서드)
     * @param {Object} physics - PhysicsEngine 인스턴스
     * @param {string} paddleId - AI 패들 ID
     * @returns {number} 최종 속도
     */
    update(physics, paddleId) {
        const balls = physics.getEntitiesOfType('ball');
        const aiPaddle = physics.getEntity(paddleId);

        if (!aiPaddle) return 0;

        const paddlePos = aiPaddle.body.getPosition();

        // 1. 타겟 공 선택
        const targetBall = this.selectTargetBall(balls, paddlePos);

        // 2. 목표 속도 계산
        const targetVelocity = this.calculateTargetVelocity(targetBall, paddlePos);

        // 3. 가속도 적용
        return this.updateVelocity(targetVelocity);
    }
}
