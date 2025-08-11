class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        // GameScene에서 전달받은 데이터
        this.playerWon = data.playerWon || false;
        this.finalScore = data.score || 0;
        this.finalTime = data.time || 0;
    }
    
    create() {
        // 배경 (반투명 검은색)
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // 게임 오버 타이틀
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            150,
            'GAME OVER',
            {
                fontSize: '60px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Arial'
            }
        );
        gameOverText.setOrigin(0.5, 0.5);
        
        // 승리/패배 메시지
        const resultText = this.add.text(
            this.cameras.main.width / 2,
            230,
            this.playerWon ? 'YOU WIN!' : 'YOU LOSE',
            {
                fontSize: '40px',
                color: this.playerWon ? '#4488ff' : '#ff4488',
                fontWeight: 'bold',
                fontFamily: 'Arial'
            }
        );
        resultText.setOrigin(0.5, 0.5);
        
        // 애니메이션 효과
        this.tweens.add({
            targets: resultText,
            scale: { from: 0.8, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 통계 표시
        this.createStats();
        
        // 재시작 버튼
        this.createRestartButton();
        
        // 파티클 효과 (승리시)
        if (this.playerWon) {
            this.createVictoryParticles();
        }
    }
    
    createStats() {
        // 통계 컨테이너
        const statsContainer = this.add.container(this.cameras.main.width / 2, 350);
        
        // 배경 패널
        const panel = this.add.graphics();
        panel.fillStyle(0x222222, 0.8);
        panel.fillRoundedRect(-150, -60, 300, 120, 10);
        statsContainer.add(panel);
        
        // 점수
        const scoreText = this.add.text(
            0,
            -30,
            `Final Score: ${this.finalScore}`,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        scoreText.setOrigin(0.5, 0.5);
        statsContainer.add(scoreText);
        
        // 시간
        const minutes = Math.floor(this.finalTime / 60);
        const seconds = this.finalTime % 60;
        const timeText = this.add.text(
            0,
            0,
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        timeText.setOrigin(0.5, 0.5);
        statsContainer.add(timeText);
        
        // 파괴한 벽돌 수 (점수로 계산)
        const bricksDestroyed = Math.floor(this.finalScore / GAME_CONFIG.SCORE.BRICK_DESTROY);
        const bricksText = this.add.text(
            0,
            30,
            `Bricks Destroyed: ${bricksDestroyed}`,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        bricksText.setOrigin(0.5, 0.5);
        statsContainer.add(bricksText);
    }
    
    createRestartButton() {
        // 재시작 버튼 컨테이너
        const buttonContainer = this.add.container(this.cameras.main.width / 2, 500);
        
        // 버튼 배경
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x4488ff, 1);
        buttonBg.fillRoundedRect(-100, -30, 200, 60, 30);
        buttonContainer.add(buttonBg);
        
        // 버튼 텍스트
        const buttonText = this.add.text(
            0,
            0,
            'PLAY AGAIN',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Arial'
            }
        );
        buttonText.setOrigin(0.5, 0.5);
        buttonContainer.add(buttonText);
        
        // 버튼 인터랙션
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-100, -30, 200, 60),
            Phaser.Geom.Rectangle.Contains
        );
        
        buttonContainer.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x66aaff, 1);
            buttonBg.fillRoundedRect(-100, -30, 200, 60, 30);
            this.tweens.add({
                targets: buttonContainer,
                scale: 1.1,
                duration: 200
            });
        });
        
        buttonContainer.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x4488ff, 1);
            buttonBg.fillRoundedRect(-100, -30, 200, 60, 30);
            this.tweens.add({
                targets: buttonContainer,
                scale: 1,
                duration: 200
            });
        });
        
        buttonContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: buttonContainer,
                scale: 0.95,
                duration: 100,
                onComplete: () => {
                    this.restartGame();
                }
            });
        });
        
        // 스페이스바로도 재시작 가능
        this.input.keyboard.on('keydown-SPACE', () => {
            this.restartGame();
        });
        
        // 안내 텍스트
        const instructionText = this.add.text(
            this.cameras.main.width / 2,
            570,
            'Press SPACE or click button to restart',
            {
                fontSize: '16px',
                color: '#888888',
                fontFamily: 'Arial'
            }
        );
        instructionText.setOrigin(0.5, 0.5);
    }
    
    createVictoryParticles() {
        // 승리 시 화려한 파티클 효과
        const colors = [0x4488ff, 0x44ff88, 0xff4488, 0xffff44];
        
        colors.forEach((color, index) => {
            this.time.delayedCall(index * 200, () => {
                const particles = this.add.particles(
                    Phaser.Math.Between(100, this.cameras.main.width - 100),
                    Phaser.Math.Between(100, 200),
                    'ball',
                    {
                        speed: { min: 100, max: 300 },
                        scale: { start: 1, end: 0 },
                        blendMode: 'ADD',
                        lifespan: 2000,
                        gravityY: 200,
                        quantity: 10,
                        tint: color
                    }
                );
                
                this.time.delayedCall(3000, () => {
                    particles.destroy();
                });
            });
        });
    }
    
    restartGame() {
        // 게임 씬 재시작
        this.scene.start('GameScene');
        
        // HTML UI 리셋
        document.getElementById('score').textContent = 'Score: 0';
        document.getElementById('time').textContent = 'Time: 0:00';
    }
}
