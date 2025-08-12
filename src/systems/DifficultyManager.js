export class DifficultyManager {
    constructor(scene) {
        this.scene = scene;
        this.config = scene.game.config.game;
        
        // 난이도 상태
        this.currentMultiplier = 1.0;
        this.targetMultiplier = 1.0;
        this.lastUpdate = 0;
        
        // 적응형 난이도 설정
        this.adaptive = {
            enabled: true,
            updateInterval: this.config.DIFFICULTY_UPDATE_INTERVAL,
            smoothingFactor: 0.1, // 변화의 부드러움
            brickDiffWeight: 0.08, // 벽돌 차이에 따른 가중치
            timeWeight: 0.02 // 시간에 따른 가중치
        };
        
        // 색상 캐싱 (성능 최적화)
        this.cachedAIColor = '#ff4488';
        this.lastColorUpdate = 0;
    }

    update() {
        const now = Date.now();
        
        // 업데이트 간격 체크
        if (now - this.lastUpdate < this.adaptive.updateInterval) {
            return;
        }
        
        this.lastUpdate = now;
        
        if (this.adaptive.enabled) {
            this.updateAdaptiveDifficulty();
        }
        
        // 난이도 승수 부드럽게 조정
        this.smoothMultiplier();
        
        // AI 패들 색상 업데이트 (필요시에만)
        this.updateAIColor();
    }

    updateAdaptiveDifficulty() {
        // 게임 상태 분석
        const gameAnalysis = this.analyzeGameState();
        
        // 목표 난이도 계산
        this.targetMultiplier = this.calculateTargetDifficulty(gameAnalysis);
        
        // 범위 제한
        this.targetMultiplier = Math.max(
            this.config.MIN_AI_MULTIPLIER,
            Math.min(this.config.MAX_AI_MULTIPLIER, this.targetMultiplier)
        );
    }

    analyzeGameState() {
        const gameState = this.scene.gameState;
        const bricks = this.scene.bricks;
        
        // 현재 벽돌 상황
        const playerBricks = bricks.player1?.length || 0;
        const computerBricks = bricks.player2?.length || 0;
        const brickDifference = computerBricks - playerBricks;
        
        // 게임 진행 시간
        const gameTime = gameState.time || 0;
        
        // 공 개수 (복잡성 지표)
        const ballCount = this.scene.balls?.length || 2;
        
        // 최근 점수 변화 (추후 구현 가능)
        const scoreRate = 0; // (gameState.playerScore - gameState.computerScore) / Math.max(gameTime, 1);
        
        return {
            brickDifference,
            gameTime,
            ballCount,
            scoreRate,
            playerAdvantage: brickDifference < 0 ? Math.abs(brickDifference) : 0,
            computerAdvantage: brickDifference > 0 ? brickDifference : 0
        };
    }

    calculateTargetDifficulty(analysis) {
        let targetMultiplier = 1.0;
        
        // 벽돌 차이에 따른 조정
        if (analysis.brickDifference > 0) {
            // 컴퓨터가 더 많은 벽돌을 가짐 -> 난이도 증가
            targetMultiplier = Math.min(
                this.config.MAX_AI_MULTIPLIER,
                1.0 + (analysis.brickDifference * this.adaptive.brickDiffWeight)
            );
        } else if (analysis.brickDifference < 0) {
            // 플레이어가 더 많은 벽돌을 가짐 -> 난이도 감소
            targetMultiplier = Math.max(
                this.config.MIN_AI_MULTIPLIER,
                1.0 + (analysis.brickDifference * this.adaptive.brickDiffWeight * 0.75) // 감소는 더 부드럽게
            );
        }
        
        // 시간에 따른 점진적 난이도 증가 (선택사항)
        const timeBonus = Math.min(0.2, analysis.gameTime * this.adaptive.timeWeight);
        targetMultiplier += timeBonus;
        
        // 공 개수에 따른 조정 (더 많은 공 = 더 어려움)
        if (analysis.ballCount > 2) {
            targetMultiplier *= 1.1;
        }
        
        return targetMultiplier;
    }

    smoothMultiplier() {
        // 현재 승수를 목표 승수로 부드럽게 조정
        const difference = this.targetMultiplier - this.currentMultiplier;
        this.currentMultiplier += difference * this.adaptive.smoothingFactor;
        
        // 매우 작은 차이는 무시 (성능 최적화)
        if (Math.abs(difference) < 0.01) {
            this.currentMultiplier = this.targetMultiplier;
        }
    }

    updateAIColor() {
        // 색상 업데이트가 필요한지 확인 (성능 최적화)
        const now = Date.now();
        if (now - this.lastColorUpdate < 500) return; // 0.5초마다만 업데이트
        
        this.lastColorUpdate = now;
        
        const multiplier = this.currentMultiplier;
        let newColor;
        
        if (multiplier <= 0.6) {
            // 매우 쉬움 - 파란색
            newColor = '#4488ff';
        } else if (multiplier <= 1.0) {
            // 쉬움에서 보통으로 - 파란색에서 보라색으로
            const t = (multiplier - 0.6) / 0.4;
            const red = Math.round(68 + (255 - 68) * t);
            const green = Math.round(136 * (1 - t * 0.5));
            const blue = Math.round(255 - (255 - 136) * t);
            newColor = `rgb(${red}, ${green}, ${blue})`;
        } else if (multiplier <= 1.5) {
            // 보통에서 어려움으로 - 보라색에서 빨간색으로
            const t = (multiplier - 1.0) / 0.5;
            const red = 255;
            const green = Math.round(68 * (1 - t));
            const blue = Math.round(136 * (1 - t));
            newColor = `rgb(${red}, ${green}, ${blue})`;
        } else {
            // 매우 어려움 - 진한 빨간색
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            const red = Math.round(255 - 55 * t);
            const green = 0;
            const blue = 0;
            newColor = `rgb(${red}, ${green}, ${blue})`;
        }
        
        // 색상이 실제로 변경된 경우에만 업데이트
        if (newColor !== this.cachedAIColor) {
            this.cachedAIColor = newColor;
        }
    }

    // 공개 메서드들
    getMultiplier() {
        return this.currentMultiplier;
    }

    getAIColor() {
        return this.cachedAIColor;
    }

    setAdaptiveEnabled(enabled) {
        this.adaptive.enabled = enabled;
    }

    setDifficultyMultiplier(multiplier) {
        this.targetMultiplier = Math.max(
            this.config.MIN_AI_MULTIPLIER,
            Math.min(this.config.MAX_AI_MULTIPLIER, multiplier)
        );
    }

    // 수동 난이도 조정 (치트/테스트용)
    increaseDifficulty(amount = 0.1) {
        this.setDifficultyMultiplier(this.targetMultiplier + amount);
    }

    decreaseDifficulty(amount = 0.1) {
        this.setDifficultyMultiplier(this.targetMultiplier - amount);
    }

    reset() {
        this.currentMultiplier = 1.0;
        this.targetMultiplier = 1.0;
        this.lastUpdate = 0;
        this.cachedAIColor = '#ff4488';
        this.lastColorUpdate = 0;
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            currentMultiplier: this.currentMultiplier.toFixed(2),
            targetMultiplier: this.targetMultiplier.toFixed(2),
            aiColor: this.cachedAIColor,
            adaptiveEnabled: this.adaptive.enabled,
            gameAnalysis: this.analyzeGameState()
        };
    }
}
