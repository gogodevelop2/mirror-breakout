// ============================================
// 게임 상태 관리
// ============================================

export class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.running = false;
        this.over = false;
        this.playerWon = false;
        this.startTime = 0;
        this.time = 0;
        this.ballSplitDone = false;
        this.playerScore = 0;
        this.computerScore = 0;
        this.lastDifficultyUpdate = 0;
        this.currentDifficultyMultiplier = 1.0;
        this.countdown = 0;
        this.countdownStartTime = 0;
        this.lastBrickSpawn = 0;
        this.cachedAIColor = '#ff4488';
    }
    
    startCountdown() {
        this.countdown = 3;
        this.countdownStartTime = Date.now();
    }
    
    updateTime() {
        if (this.running && this.startTime) {
            this.time = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }
    
    setGameOver(playerWon) {
        this.running = false;
        this.over = true;
        this.playerWon = playerWon;
    }
    
    canSpawnBricks() {
        return this.time >= 10 && 
               Date.now() - this.lastBrickSpawn >= 10000;
    }
    
    updateBrickSpawn() {
        this.lastBrickSpawn = Date.now();
    }
    
    canSplitBall() {
        return !this.ballSplitDone && this.time >= 10;
    }
    
    setSplitDone() {
        this.ballSplitDone = true;
    }
}
