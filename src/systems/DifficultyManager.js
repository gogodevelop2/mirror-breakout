// 동적 난이도 조정 시스템
class DifficultyManager {
    constructor(scene) {
        this.scene = scene;
        this.config = GameConfig.gameplay.difficulty;
        
        // 난이도 상태
        this.currentMultiplier = 1.0;
        this.targetMultiplier = 1.0;
        this.lastUpdate = 0;
        
        // 게임 상태 추적
        this.gameState = {
            playerBricks: 0,
            aiBricks: 0,
            playerScore: 0,
            aiScore: 0,
            gameTime: 0,
            ballCount: 0
        };
        
        // 성능 히스토리 (최근 10초간)
        this.performanceHistory = [];
        this.maxHistoryLength = 20; // 10초 * 2 업데이트/초
        
        // 적응 설정
        this.adaptationSettings = {
            brickDifferenceWeight: 0.4,    // 벽돌 수 차이 가중치
            scoreRateWeight: 0.3,          // 점수 속도 가중치
            timeFactorWeight: 0.2,         // 시간 요소 가중치
            momentumWeight: 0.1            // 모멘텀 가중치
        };
        
        this.init();
    }

    init() {
        console.log('DifficultyManager initialized');
    }

    update(gameState) {
        const now = Date.now();
        
        // 업데이트 간격 체크
        if (now - this.lastUpdate < this.config.updateInterval) {
            return;
        }
        this.lastUpdate = now;
        
        // 게임 상태 업데이트
        this.updateGameState(gameState);
        
        // 성능 히스토리 기록
        this.recordPerformance();
        
        // 목표 난이도 계산
        this.calculateTargetDifficulty();
        
        // 현재 난이도 조정 (부드러운 전환)
        this.adjustCurrentDifficulty();
        
        // 디버그 로그
        this.logDifficultyChange();
    }

    updateGameState(gameState) {
        this.gameState = { ...gameState };
        
        // 게임 시간 업데이트
        this.gameState.gameTime = this.scene.time.now / 1000;
    }

    recordPerformance() {
        const performance = {
            timestamp: Date.now(),
            playerBricks: this.gameState.playerBricks,
            aiBricks: this.gameState.aiBricks,
            playerScore: this.gameState.playerScore,
            aiScore: this.gameState.aiScore,
            gameTime: this.gameState.gameTime,
            brickDifference: this.gameState.aiBricks - this.gameState.playerBricks,
            scoreDifference: this.gameState.playerScore - this.gameState.aiScore
        };
        
        this.performanceHistory.push(performance);
        
        // 히스토리 길이 제한
        if (this.performanceHistory.length > this.maxHistoryLength) {
            this.performanceHistory.shift();
        }
    }

    calculateTargetDifficulty() {
        if (this.performanceHistory.length < 2) {
            this.targetMultiplier = 1.0;
            return;
        }
        
        // 각 요소별 분석
        const brickAdvantage = this.analyzeBrickAdvantage();
        const scoreAdvantage = this.analyzeScoreAdvantage();
        const timeFactor = this.analyzeTimeFactor();
        const momentum = this.analyzeMomentum();
        
        // 가중 평균으로 최종 난이도 계산
        const difficultyAdjustment = 
            brickAdvantage * this.adaptationSettings.brickDifferenceWeight +
            scoreAdvantage * this.adaptationSettings.scoreRateWeight +
            timeFactor * this.adaptationSettings.timeFactorWeight +
            momentum * this.adaptationSettings.momentumWeight;
        
        // 기본 난이도 1.0에서 조정값 적용
        this.targetMultiplier = 1.0 + difficultyAdjustment;
        
        // 범위 제한
        this.targetMultiplier = Phaser.Math.Clamp(
            this.targetMultiplier,
            this.config.minMultiplier,
            this.config.maxMultiplier
        );
    }

    analyzeBrickAdvantage() {
        const latest = this.performanceHistory[this.performanceHistory.length - 1];
        const brickDiff = latest.brickDifference; // AI벽돌 - 플레이어벽돌
        
        // 벽돌 차이가 클수록 AI가 불리 (음수면 AI가 유리)
        // -10 ~ +10 범위를 -0.5 ~ +0.5로 정규화
        return Phaser.Math.Clamp(brickDiff / 20, -0.5, 0.5);
    }

    analyzeScoreAdvantage() {
        if (this.performanceHistory.length < 3) return 0;
        
        const recent = this.performanceHistory.slice(-3);
        const scoreRates = [];
        
        // 최근 점수 변화율 계산
        for (let i = 1; i < recent.length; i++) {
            const timeDiff = (recent[i].timestamp - recent[i-1].timestamp) / 1000;
            if (timeDiff > 0) {
                const playerRate = (recent[i].playerScore - recent[i-1].playerScore) / timeDiff;
                const aiRate = (recent[i].aiScore - recent[i-1].aiScore) / timeDiff;
                scoreRates.push(playerRate - aiRate);
            }
        }
        
        if (scoreRates.length === 0) return 0;
        
        // 평균 점수율 차이
        const avgScoreRate = scoreRates.reduce((a, b) => a + b, 0) / scoreRates.length;
        
        // 점수율이 높을수록 AI가 불리
        return Phaser.Math.Clamp(avgScoreRate / 2, -0.3, 0.3);
    }

    analyzeTimeFactor() {
        const gameTime = this.gameState.gameTime;
        
        // 게임 초반에는 난이도 조정을 적게, 후반에는 더 많이
        if (gameTime < 30) {
            return 0; // 30초 이전에는 조정 없음
        }
        
        // 시간이 지날수록 약간의 난이도 상승 (최대 0.1)
        const timeFactor = Math.min((gameTime - 30) / 300, 1) * 0.1;
        
        return timeFactor;
    }

    analyzeMomentum() {
        if (this.performanceHistory.length < 5) return 0;
        
        const recent = this.performanceHistory.slice(-5);
        let playerMomentum = 0;
        let aiMomentum = 0;
        
        // 최근 5개 기록에서 트렌드 분석
        for (let i = 1; i < recent.length; i++) {
            const playerProgress = recent[i].playerScore - recent[i-1].playerScore;
            const aiProgress = recent[i].aiScore - recent[i-1].aiScore;
            
            playerMomentum += playerProgress;
            aiMomentum += aiProgress;
        }
        
        const momentumDiff = playerMomentum - aiMomentum;
        
        // 모멘텀 차이를 -0.2 ~ +0.2 범위로 정규화
        return Phaser.Math.Clamp(momentumDiff / 10, -0.2, 0.2);
    }

    adjustCurrentDifficulty() {
        // 부드러운 전환을 위한 lerp
        const diff = this.targetMultiplier - this.currentMultiplier;
        const adjustment = diff * this.config.adaptationRate;
        
        this.currentMultiplier += adjustment;
        
        // 범위 재확인
        this.currentMultiplier = Phaser.Math.Clamp(
            this.currentMultiplier,
            this.config.minMultiplier,
            this.config.maxMultiplier
        );
    }

    logDifficultyChange() {
        // 개발 모드에서만 로그 출력
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (Math.abs(this.currentMultiplier - 1.0) > 0.05) {
                console.log(`Difficulty adjusted: ${this.currentMultiplier.toFixed(2)}x`, {
                    bricks: `P:${this.gameState.playerBricks} AI:${this.gameState.aiBricks}`,
                    scores: `P:${this.gameState.playerScore} AI:${this.gameState.aiScore}`,
                    target: this.targetMultiplier.toFixed(2)
                });
            }
        }
    }

    // 외부 인터페이스 메서드들
    getMultiplier() {
        return this.currentMultiplier;
    }

    getDifficultyLevel() {
        if (this.currentMultiplier < 0.8) {
            return 'Easy';
        } else if (this.currentMultiplier < 1.2) {
            return 'Normal';
        } else if (this.currentMultiplier < 1.6) {
            return 'Hard';
        } else {
            return 'Extreme';
        }
    }

    getDifficultyColor() {
        const multiplier = this.currentMultiplier;
        
        if (multiplier <= 0.6) {
            return '#4488ff'; // 파란색 (쉬움)
        } else if (multiplier <= 1.0) {
            // 파란색에서 흰색으로 그라데이션
            const t = (multiplier - 0.6) / 0.4;
            return Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0x4488ff),
                Phaser.Display.Color.ValueToColor(0xffffff),
                100, t * 100
            );
        } else if (multiplier <= 1.5) {
            // 흰색에서 빨간색으로 그라데이션
            const t = (multiplier - 1.0) / 0.5;
            return Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xffffff),
                Phaser.Display.Color.ValueToColor(0xff4488),
                100, t * 100
            );
        } else {
            // 빨간색에서 어두운 빨간색으로
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            return Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xff4488),
                Phaser.Display.Color.ValueToColor(0xcc0000),
                100, t * 100
            );
        }
    }

    // 특별 상황 처리
    handleSpecialEvents(eventType, data) {
        switch (eventType) {
            case 'ballSplit':
                // 공 분열 시 잠시 난이도 조정 중단
                this.pauseAdjustment(2000); // 2초간 중단
                break;
                
            case 'brickSpawn':
                // 새 벽돌 생성 시 약간의 난이도 리셋
                this.targetMultiplier = Math.max(0.9, this.targetMultiplier - 0.1);
                break;
                
            case 'playerStuck':
                // 플레이어가 막혔을 때 (점수가 오랫동안 변화 없음)
                this.targetMultiplier = Math.max(0.7, this.targetMultiplier - 0.2);
                break;
        }
    }

    pauseAdjustment(duration) {
        this.lastUpdate = Date.now() + duration;
    }

    // 수동 난이도 설정 (테스트용)
    setDifficulty(multiplier, temporary = false) {
        this.currentMultiplier = Phaser.Math.Clamp(
            multiplier, 
            this.config.minMultiplier, 
            this.config.maxMultiplier
        );
        
        if (!temporary) {
            this.targetMultiplier = this.currentMultiplier;
        }
    }

    // 통계 및 디버그 정보
    getStatistics() {
        return {
            currentMultiplier: this.currentMultiplier,
            targetMultiplier: this.targetMultiplier,
            difficultyLevel: this.getDifficultyLevel(),
            gameState: this.gameState,
            historyLength: this.performanceHistory.length,
            lastUpdate: this.lastUpdate
        };
    }

    getPerformanceGraph() {
        // 성능 히스토리를 그래프 데이터로 변환 (디버그용)
        return this.performanceHistory.map(record => ({
            time: record.gameTime,
            brickDiff: record.brickDifference,
            scoreDiff: record.scoreDifference,
            difficulty: this.currentMultiplier
        }));
    }

    // 리셋
    reset() {
        this.currentMultiplier = 1.0;
        this.targetMultiplier = 1.0;
        this.lastUpdate = 0;
        this.performanceHistory = [];
        this.gameState = {
            playerBricks: 0,
            aiBricks: 0,
            playerScore: 0,
            aiScore: 0,
            gameTime: 0,
            ballCount: 0
        };
    }

    // 정리
    destroy() {
        this.scene = null;
        this.performanceHistory = [];
    }
}

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DifficultyManager;
} else {
    window.DifficultyManager = DifficultyManager;
}
