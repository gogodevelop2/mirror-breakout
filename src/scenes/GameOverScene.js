// 게임 오버 씬
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        // 게임 결과 데이터
        this.gameData = {
            playerWon: data.playerWon || false,
            gameTime: data.gameTime || 0,
            playerScore: data.playerScore || 0,
            aiScore: data.aiScore || 0,
            newRecord: data.newRecord || false
        };
    }

    create() {
        const { width, height } = this.sys.game.config;
        
        // 배경 생성
        this.createBackground();
        
        // 게임 결과 표시
        this.createGameResult();
        
        // 통계 표시
        this.createStatistics();
        
        // 액션 버튼들
        this.createActionButtons();
        
        // 입력 설정
        this.setupInput();
        
        // 애니메이션 효과
        this.createAnimations();
    }

    createBackground() {
        const { width, height } = this.sys.game.config;
        
        // 반투명 오버레이
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        
        // 결과에 따른 배경 효과
        const resultColor = this.gameData.playerWon ? 0x004488 : 0x440022;
        
        // 그라데이션 효과
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(resultColor, resultColor, 0x000000, 0x000000, 0.3);
        graphics.fillRect(0, 0, width, height);
        
        // 파티클 효과
        this.createBackgroundParticles();
    }

    createBackgroundParticles() {
        const { width, height } = this.sys.game.config;
        const particleColor = this.gameData.playerWon ? 0x4488ff : 0xff4488;
        
        // 승리 시 더 많은 파티클
        const particleCount = this.gameData.playerWon ? 30 : 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 4),
                particleColor,
                0.3
            );
            
            // 떠다니는 애니메이션
            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(50, 200),
                alpha: { from: 0.3, to: 0 },
                duration: Phaser.Math.Between(3000, 6000),
                ease: 'Sine.easeOut',
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000)
            });
            
            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-30, 30),
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    createGameResult() {
        const { width, height } = this.sys.game.config;
        
        // 메인 결과 텍스트
        const resultText = this.gameData.playerWon ? 'VICTORY!' : 'DEFEAT';
        const resultColor = this.gameData.playerWon ? '#44ff44' : '#ff4444';
        
        this.resultTitle = this.add.text(width / 2, height / 2 - 150, resultText, {
            fontFamily: 'Orbitron',
            fontSize: '72px',
            fontWeight: '900',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);
        
        // 서브 텍스트
        const subText = this.gameData.playerWon ? 'You destroyed all AI bricks!' : 'AI destroyed all your bricks!';
        
        this.resultSubtitle = this.add.text(width / 2, height / 2 - 100, subText, {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            fill: '#cccccc'
        }).setOrigin(0.5).setAlpha(0);
        
        // 새 기록 표시
        if (this.gameData.newRecord) {
            this.newRecordText = this.add.text(width / 2, height / 2 - 70, '🏆 NEW RECORD! 🏆', {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fontWeight: '700',
                fill: '#ffdd44',
                stroke: '#aa6600',
                strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);
        }
    }

    createStatistics() {
        const { width, height } = this.sys.game.config;
        
        // 통계 패널 배경
        const statsPanel = this.add.rectangle(width / 2, height / 2 + 50, 400, 200, 0x001122, 0.8)
            .setStrokeStyle(2, 0x4488ff, 0.6);
        
        // 게임 시간
        const minutes = Math.floor(this.gameData.gameTime / 60);
        const seconds = Math.floor(this.gameData.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 통계 데이터
        const stats = [
            { label: 'Game Time', value: timeString },
            { label: 'Your Score', value: this.gameData.playerScore.toString() },
            { label: 'AI Score', value: this.gameData.aiScore.toString() },
            { label: 'Total Destroyed', value: (this.gameData.playerScore + this.gameData.aiScore).toString() }
        ];
        
        // 통계 텍스트들
        this.statsTexts = [];
        stats.forEach((stat, index) => {
            const y = height / 2 - 20 + (index * 25);
            
            // 라벨
            const label = this.add.text(width / 2 - 150, y, stat.label + ':', {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                fill: '#888888'
            }).setAlpha(0);
            
            // 값
            const value = this.add.text(width / 2 + 150, y, stat.value, {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                fontWeight: '700',
                fill: '#ffffff'
            }).setOrigin(1, 0).setAlpha(0);
            
            this.statsTexts.push(label, value);
        });
        
        // 최고 기록 표시
        const bestTime = window.mirrorBreakout?.getGameState()?.bestTime;
        if (bestTime && bestTime !== this.gameData.gameTime) {
            const bestMinutes = Math.floor(bestTime / 60);
            const bestSeconds = Math.floor(bestTime % 60);
            const bestTimeString = `${bestMinutes}:${bestSeconds.toString().padStart(2, '0')}`;
            
            this.bestTimeText = this.add.text(width / 2, height / 2 + 120, `Best Time: ${bestTimeString}`, {
                fontFamily: 'Orbitron',
                fontSize: '14px',
                fill: '#ffdd44'
            }).setOrigin(0.5).setAlpha(0);
            
            this.statsTexts.push(this.bestTimeText);
        }
    }

    createActionButtons() {
        const { width, height } = this.sys.game.config;
        const buttonY = height / 2 + 180;
        
        // 버튼 데이터
        const buttons = [
            { text: 'PLAY AGAIN', x: width / 2 - 120, action: () => this.playAgain() },
            { text: 'MAIN MENU', x: width / 2 + 120, action: () => this.returnToMenu() }
        ];
        
        this.actionButtons = [];
        
        buttons.forEach(buttonData => {
            // 버튼 배경
            const bg = this.add.rectangle(buttonData.x, buttonY, 200, 50, 0x002244, 0.8)
                .setStrokeStyle(2, 0x4488ff, 0.8)
                .setAlpha(0);
            
            // 버튼 텍스트
            const text = this.add.text(buttonData.x, buttonY, buttonData.text, {
                fontFamily: 'Orbitron',
                fontSize: '18px',
                fontWeight: '700',
                fill: '#4af'
            }).setOrigin(0.5).setAlpha(0);
            
            // 인터랙션 설정
            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => this.onButtonHover(bg, text))
                .on('pointerout', () => this.onButtonOut(bg, text))
                .on('pointerdown', () => this.onButtonClick(bg, text, buttonData.action));
            
            this.actionButtons.push({ bg, text, action: buttonData.action });
        });
        
        // 키보드 선택 인덱스
        this.selectedButtonIndex = 0;
    }

    setupInput() {
        // 키보드 입력
        this.input.keyboard.on('keydown', (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.navigateButtons(-1);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.navigateButtons(1);
                    break;
                case 'Enter':
                case 'Space':
                    this.activateSelectedButton();
                    break;
                case 'KeyR':
                    this.playAgain();
                    break;
                case 'Escape':
                    this.returnToMenu();
                    break;
            }
        });
    }

    createAnimations() {
        // 결과 텍스트 애니메이션
        this.tweens.add({
            targets: this.resultTitle,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 800,
            ease: 'Back.easeOut',
            delay: 200
        });
        
        this.tweens.add({
            targets: this.resultSubtitle,
            alpha: 1,
            y: this.resultSubtitle.y + 10,
            duration: 600,
            ease: 'Quad.easeOut',
            delay: 600
        });
        
        // 새 기록 애니메이션
        if (this.newRecordText) {
            this.tweens.add({
                targets: this.newRecordText,
                alpha: 1,
                scaleX: { from: 0.8, to: 1.1 },
                scaleY: { from: 0.8, to: 1.1 },
                duration: 600,
                ease: 'Back.easeOut',
                delay: 1000,
                yoyo: true,
                repeat: 2
            });
        }
        
        // 통계 텍스트 순차 애니메이션
        this.statsTexts.forEach((text, index) => {
            this.tweens.add({
                targets: text,
                alpha: 1,
                x: text.x + 20,
                duration: 400,
                ease: 'Quad.easeOut',
                delay: 1200 + (index * 100)
            });
        });
        
        // 버튼 애니메이션
        this.actionButtons.forEach((button, index) => {
            this.tweens.add({
                targets: [button.bg, button.text],
                alpha: 1,
                y: button.bg.y + 20,
                duration: 500,
                ease: 'Back.easeOut',
                delay: 2000 + (index * 200)
            });
        });
        
        // 선택된 버튼 하이라이트
        this.time.delayedCall(2500, () => {
            this.updateButtonSelection();
        });
    }

    // 버튼 인터랙션
    onButtonHover(bg, text) {
        this.tweens.add({
            targets: [bg, text],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200,
            ease: 'Back.easeOut'
        });
        
        bg.setStrokeStyle(2, 0x44ffff, 1);
        text.setColor('#44ffff');
    }

    onButtonOut(bg, text) {
        this.tweens.add({
            targets: [bg, text],
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
        
        bg.setStrokeStyle(2, 0x4488ff, 0.8);
        text.setColor('#4af');
    }

    onButtonClick(bg, text, action) {
        this.tweens.add({
            targets: [bg, text],
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 100,
            ease: 'Back.easeOut',
            yoyo: true,
            onComplete: () => {
                action();
            }
        });
    }

    navigateButtons(direction) {
        this.selectedButtonIndex += direction;
        this.selectedButtonIndex = Phaser.Math.Clamp(this.selectedButtonIndex, 0, this.actionButtons.length - 1);
        this.updateButtonSelection();
    }

    updateButtonSelection() {
        this.actionButtons.forEach((button, index) => {
            if (index === this.selectedButtonIndex) {
                button.bg.setStrokeStyle(3, 0x44ffff, 1);
                button.text.setColor('#44ffff');
                
                // 선택된 버튼 펄스 효과
                this.tweens.add({
                    targets: [button.bg, button.text],
                    scaleX: { from: 1, to: 1.02 },
                    scaleY: { from: 1, to: 1.02 },
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            } else {
                button.bg.setStrokeStyle(2, 0x4488ff, 0.8);
                button.text.setColor('#4af');
                
                // 다른 버튼들의 애니메이션 정지
                this.tweens.killTweensOf([button.bg, button.text]);
                button.bg.setScale(1);
                button.text.setScale(1);
            }
        });
    }

    activateSelectedButton() {
        const selectedButton = this.actionButtons[this.selectedButtonIndex];
        if (selectedButton) {
            this.onButtonClick(selectedButton.bg, selectedButton.text, selectedButton.action);
        }
    }

    // 액션 메서드들
    playAgain() {
        // 페이드 아웃 효과와 함께 게임 재시작
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }

    returnToMenu() {
        // 페이드 아웃 효과와 함께 메뉴로 돌아가기
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    // 통계 계산 헬퍼 메서드들
    calculateAccuracy() {
        // 향후 구현: 적중률 계산
        const totalShots = this.gameData.playerScore + this.gameData.aiScore;
        return totalShots > 0 ? ((this.gameData.playerScore / totalShots) * 100).toFixed(1) : '0.0';
    }

    getPerformanceRating() {
        // 향후 구현: 성능 등급 계산
        if (this.gameData.playerWon) {
            if (this.gameData.gameTime < 60) return 'S';
            if (this.gameData.gameTime < 120) return 'A';
            if (this.gameData.gameTime < 180) return 'B';
            return 'C';
        } else {
            return 'F';
        }
    }

    // 로컬 저장소 업데이트
    updatePlayerStats() {
        // 향후 구현: 플레이어 통계 업데이트
        const stats = this.loadPlayerStats();
        
        stats.gamesPlayed++;
        if (this.gameData.playerWon) {
            stats.gamesWon++;
        }
        stats.totalScore += this.gameData.playerScore;
        stats.totalTime += this.gameData.gameTime;
        
        if (!stats.bestTime || this.gameData.gameTime < stats.bestTime) {
            stats.bestTime = this.gameData.gameTime;
        }
        
        this.savePlayerStats(stats);
    }

    loadPlayerStats() {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            totalTime: 0,
            bestTime: null
        };
        
        const saved = localStorage.getItem('mirrorBreakout_playerStats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }

    savePlayerStats(stats) {
        localStorage.setItem('mirrorBreakout_playerStats', JSON.stringify(stats));
    }
}

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameOverScene;
} else {
    window.GameOverScene = GameOverScene;
}
