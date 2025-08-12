export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.playerWon = data.playerWon || false;
        this.gameTime = data.time || 0;
        this.playerScore = data.playerScore || 0;
        this.computerScore = data.computerScore || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // 배경
        this.createBackground();
        
        // 결과 표시
        this.createResults(width, height);
        
        // 통계 표시
        this.createStats(width, height);
        
        // 버튼들
        this.createButtons(width, height);
        
        // 입력 설정
        this.setupInput();
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        
        // 어두운 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        
        // 결과에 따른 배경 효과
        const effectColor = this.playerWon ? 0x4488ff : 0xff4488;
        
        // 미묘한 그라데이션 효과
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(effectColor, effectColor, effectColor, effectColor, 0.1, 0.05, 0.1, 0.05);
        graphics.fillRect(0, 0, width, height);
    }

    createResults(width, height) {
        // 메인 결과 텍스트
        const resultText = this.playerWon ? 'VICTORY!' : 'DEFEAT';
        const resultColor = this.playerWon ? '#4af' : '#f44';
        
        const mainResult = this.add.text(width / 2, height / 2 - 80, resultText, {
            fontSize: '64px',
            fontFamily: 'Orbitron, monospace',
            fontWeight: '900',
            fill: resultColor,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 결과 애니메이션
        this.tweens.add({
            targets: mainResult,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 서브 텍스트
        const subText = this.playerWon ? 'You broke all enemy bricks!' : 'The computer was faster...';
        this.add.text(width / 2, height / 2 - 20, subText, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            fill: '#ccc',
            align: 'center'
        }).setOrigin(0.5);
    }

    createStats(width, height) {
        // 게임 시간
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const timeText = `Game Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.add.text(width / 2, height / 2 + 40, timeText, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // 점수 (추후 구현예정)
        // const scoreText = `Player: ${this.playerScore} | Computer: ${this.computerScore}`;
        // this.add.text(width / 2, height / 2 + 70, scoreText, {
        //     fontSize: '16px',
        //     fontFamily: 'Arial, sans-serif',
        //     fill: '#aaa'
        // }).setOrigin(0.5);
    }

    createButtons(width, height) {
        // 다시 시작 버튼
        const restartBg = this.add.circle(width / 2 - 80, height / 2 + 120, 35, 0x4488ff);
        const restartText = this.add.text(width / 2 - 80, height / 2 + 120, 'AGAIN', {
            fontSize: '14px',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 'bold',
            fill: '#000'
        }).setOrigin(0.5);

        // 메뉴 버튼
        const menuBg = this.add.circle(width / 2 + 80, height / 2 + 120, 35, 0x666666);
        const menuText = this.add.text(width / 2 + 80, height / 2 + 120, 'MENU', {
            fontSize: '14px',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 'bold',
            fill: '#fff'
        }).setOrigin(0.5);

        // 버튼 인터랙션 설정
        this.setupButton(restartBg, () => {
            this.scene.start('GameScene');
        });
        
        this.setupButton(menuBg, () => {
            this.scene.start('MenuScene');
        });
    }

    setupButton(button, callback) {
        button.setInteractive({ useHandCursor: true });
        
        button.on('pointerover', () => {
            this.tweens.add({
                targets: button,
                scale: 1.1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        button.on('pointerout', () => {
            this.tweens.add({
                targets: button,
                scale: 1.0,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        button.on('pointerdown', () => {
            this.tweens.add({
                targets: button,
                scale: 0.95,
                duration: 100,
                ease: 'Power2',
                onComplete: callback
            });
        });
    }

    setupInput() {
        // 키보드 단축키
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
    }
}
