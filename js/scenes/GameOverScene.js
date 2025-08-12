/**
 * Game Over Scene
 * 게임 종료 후 결과 표시 및 재시작 옵션 제공
 */

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
        
        // 게임 결과 데이터
        this.gameResult = {
            playerWon: false,
            playerScore: 0,
            computerScore: 0,
            duration: 0
        };
        
        // 애니메이션 상태
        this.animationState = {
            titleComplete: false,
            statsComplete: false,
            buttonsComplete: false
        };
        
        // UI 요소들
        this.uiElements = {
            background: null,
            title: null,
            subtitle: null,
            statsContainer: null,
            buttons: null,
            particles: null
        };
    }
    
    /**
     * 씬 초기화 (GameScene에서 데이터 전달받음)
     */
    init(data) {
        this.gameResult = {
            playerWon: data.playerWon || false,
            playerScore: data.playerScore || 0,
            computerScore: data.computerScore || 0,
            duration: data.duration || 0
        };
        
        console.log('GameOverScene initialized with result:', this.gameResult);
    }
    
    /**
     * 씬 생성
     */
    create() {
        // 페이드 인 효과
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        
        this.createBackground();
        this.createParticleEffects();
        this.startIntroAnimation();
        this.setupInput();
        
        // 사운드 재생 (나중에 추가)
        // this.playResultSound();
        
        console.log('GameOverScene created');
    }
    
    /**
     * 배경 생성
     */
    createBackground() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 배경 그라데이션
        this.uiElements.background = this.add.graphics();
        
        if (this.gameResult.playerWon) {
            // 승리 시: 파란색 계열
            this.uiElements.background.fillGradientStyle(
                0x001155, 0x001155,
                0x000033, 0x110033
            );
        } else {
            // 패배 시: 빨간색 계열
            this.uiElements.background.fillGradientStyle(
                0x330011, 0x330011,
                0x110000, 0x220011
            );
        }
        
        this.uiElements.background.fillRect(0, 0, width, height);
        this.uiElements.background.setDepth(-10);
        
        // 동적 배경 효과
        this.createDynamicBackground();
    }
    
    /**
     * 동적 배경 효과
     */
    createDynamicBackground() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 배경 원형 효과들
        for (let i = 0; i < 5; i++) {
            const circle = this.add.graphics();
            const radius = 50 + Math.random() * 100;
            const alpha = 0.1 + Math.random() * 0.1;
            
            const color = this.gameResult.playerWon ? 0x4488ff : 0xff4488;
            circle.fillStyle(color, alpha);
            circle.fillCircle(0, 0, radius);
            
            circle.setPosition(
                Math.random() * width,
                Math.random() * height
            );
            circle.setDepth(-5);
            
            // 부드러운 움직임
            this.tweens.add({
                targets: circle,
                x: Math.random() * width,
                y: Math.random() * height,
                scaleX: { from: 1, to: 1.5 },
                scaleY: { from: 1, to: 1.5 },
                alpha: { from: alpha, to: 0 },
                duration: 15000 + Math.random() * 10000,
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true
            });
        }
    }
    
    /**
     * 파티클 효과
     */
    createParticleEffects() {
        if (!this.gameResult.playerWon) return; // 승리 시에만
        
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 승리 축하 파티클
        for (let i = 0; i < 20; i++) {
            const particle = this.add.graphics();
            const size = 2 + Math.random() * 4;
            
            particle.fillStyle(0xffdd00); // 금색
            particle.fillCircle(0, 0, size);
            particle.setPosition(width / 2, height / 4);
            particle.setDepth(50);
            
            // 폭죽 효과
            this.tweens.add({
                targets: particle,
                x: width / 2 + (Math.random() - 0.5) * 400,
                y: height / 4 + (Math.random() - 0.5) * 300,
                scaleX: { from: 1, to: 0 },
                scaleY: { from: 1, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: 1000 + Math.random() * 1000,
                delay: Math.random() * 2000,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * 인트로 애니메이션 시작
     */
    startIntroAnimation() {
        // 순차적 애니메이션
        this.time.delayedCall(500, () => this.animateTitle());
        this.time.delayedCall(1500, () => this.animateStats());
        this.time.delayedCall(3000, () => this.animateButtons());
    }
    
    /**
     * 타이틀 애니메이션
     */
    animateTitle() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 메인 타이틀
        const titleText = this.gameResult.playerWon ? 'VICTORY!' : 'GAME OVER';
        const titleColor = this.gameResult.playerWon ? '#4af' : '#f44';
        
        this.uiElements.title = this.add.text(width / 2, height * 0.2, titleText, {
            fontFamily: 'Orbitron, Arial',
            fontSize: '72px',
            fontWeight: 'bold',
            fill: titleColor,
            align: 'center',
            stroke: titleColor,
            strokeThickness: 2
        });
        this.uiElements.title.setOrigin(0.5, 0.5);
        this.uiElements.title.setAlpha(0);
        this.uiElements.title.setScale(0.5);
        
        // 타이틀 등장 애니메이션
        this.tweens.add({
            targets: this.uiElements.title,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.animationState.titleComplete = true;
                this.addTitleGlow();
            }
        });
        
        // 서브타이틀
        const subtitleText = this.gameResult.playerWon ? 
            'You defeated the AI!' : 
            'The AI proved superior...';
        
        this.uiElements.subtitle = this.add.text(width / 2, height * 0.3, subtitleText, {
            fontFamily: 'Arial',
            fontSize: '24px',
            fill: '#cccccc',
            align: 'center'
        });
        this.uiElements.subtitle.setOrigin(0.5, 0.5);
        this.uiElements.subtitle.setAlpha(0);
        
        this.tweens.add({
            targets: this.uiElements.subtitle,
            alpha: 1,
            duration: 600,
            delay: 400,
            ease: 'Power2.easeOut'
        });
    }
    
    /**
     * 타이틀 글로우 효과 추가
     */
    addTitleGlow() {
        if (this.gameResult.playerWon) {
            this.tweens.add({
                targets: this.uiElements.title,
                scaleX: { from: 1, to: 1.05 },
                scaleY: { from: 1, to: 1.05 },
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    /**
     * 통계 애니메이션
     */
    animateStats() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 통계 컨테이너
        this.uiElements.statsContainer = this.add.container(width / 2, height * 0.55);
        
        const stats = [
            { label: 'Your Score', value: this.gameResult.playerScore, color: '#4488ff' },
            { label: 'AI Score', value: this.gameResult.computerScore, color: '#ff4488' },
            { label: 'Game Duration', value: this.formatDuration(this.gameResult.duration), color: '#ffffff' }
        ];
        
        stats.forEach((stat, index) => {
            const yPos = index * 60 - 60; // 중앙 정렬을 위해 조정
            
            // 라벨
            const label = this.add.text(-150, yPos, stat.label, {
                fontFamily: 'Arial',
                fontSize: '20px',
                fill: '#cccccc'
            });
            label.setOrigin(0, 0.5);
            label.setAlpha(0);
            
            // 값
            const value = this.add.text(150, yPos, stat.value.toString(), {
                fontFamily: 'Arial',
                fontSize: '24px',
                fontWeight: 'bold',
                fill: stat.color,
                align: 'right'
            });
            value.setOrigin(1, 0.5);
            value.setAlpha(0);
            
            // 구분선
            const line = this.add.graphics();
            line.lineStyle(1, 0x444444);
            line.lineBetween(-200, yPos + 20, 200, yPos + 20);
            line.setAlpha(0);
            
            this.uiElements.statsContainer.add([label, value, line]);
            
            // 순차 등장 애니메이션
            this.tweens.add({
                targets: [label, value, line],
                alpha: 1,
                duration: 500,
                delay: index * 200,
                ease: 'Power2.easeOut'
            });
            
            // 숫자 카운트업 애니메이션 (점수만)
            if (typeof stat.value === 'number') {
                this.animateNumberCount(value, 0, stat.value, 800, index * 200);
            }
        });
        
        this.animationState.statsComplete = true;
    }
    
    /**
     * 숫자 카운트업 애니메이션
     */
    animateNumberCount(textObject, startValue, endValue, duration, delay) {
        this.tweens.add({
            targets: { value: startValue },
            value: endValue,
            duration: duration,
            delay: delay,
            ease: 'Power2.easeOut',
            onUpdate: (tween) => {
                const currentValue = Math.floor(tween.targets[0].value);
                textObject.setText(currentValue.toString());
            }
        });
    }
    
    /**
     * 버튼 애니메이션
     */
    animateButtons() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 버튼 컨테이너
        this.uiElements.buttons = this.add.container(width / 2, height * 0.8);
        
        // Play Again 버튼
        const playAgainButton = this.createButton('PLAY AGAIN', -100, 0, () => {
            this.restartGame();
        });
        
        // Main Menu 버튼 (나중에 메뉴 씬 추가 시)
        const mainMenuButton = this.createButton('MAIN MENU', 100, 0, () => {
            this.goToMainMenu();
        });
        
        this.uiElements.buttons.add([playAgainButton, mainMenuButton]);
        
        // 버튼 등장 애니메이션
        [playAgainButton, mainMenuButton].forEach((button, index) => {
            button.setAlpha(0);
            button.setScale(0.8);
            
            this.tweens.add({
                targets: button,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 600,
                delay: index * 200,
                ease: 'Back.easeOut'
            });
        });
        
        this.animationState.buttonsComplete = true;
        
        // 입력 안내
        this.createInputInstructions();
    }
    
    /**
     * 버튼 생성
     */
    createButton(text, x, y, callback) {
        const container = this.add.container(x, y);
        
        // 버튼 배경
        const background = this.add.graphics();
        background.fillStyle(0x333333);
        background.fillRoundedRect(-80, -20, 160, 40, 20);
        background.lineStyle(2, 0x4488ff);
        background.strokeRoundedRect(-80, -20, 160, 40, 20);
        
        // 버튼 텍스트
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        });
        buttonText.setOrigin(0.5, 0.5);
        
        container.add([background, buttonText]);
        container.setSize(160, 40);
        container.setInteractive();
        
        // 호버 효과
        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Power2.easeOut'
            });
            
            background.clear();
            background.fillStyle(0x444444);
            background.fillRoundedRect(-80, -20, 160, 40, 20);
            background.lineStyle(2, 0x66aaff);
            background.strokeRoundedRect(-80, -20, 160, 40, 20);
        });
        
        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Power2.easeOut'
            });
            
            background.clear();
            background.fillStyle(0x333333);
            background.fillRoundedRect(-80, -20, 160, 40, 20);
            background.lineStyle(2, 0x4488ff);
            background.strokeRoundedRect(-80, -20, 160, 40, 20);
        });
        
        // 클릭 효과
        container.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Power2.easeOut',
                yoyo: true,
                onComplete: callback
            });
        });
        
        return container;
    }
    
    /**
     * 입력 안내 생성
     */
    createInputInstructions() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        const instructions = this.add.text(width / 2, height * 0.95, 
            'Press SPACE to play again • ESC for main menu', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#888888',
            align: 'center'
        });
        instructions.setOrigin(0.5, 0.5);
        instructions.setAlpha(0);
        
        this.tweens.add({
            targets: instructions,
            alpha: 1,
            duration: 1000,
            delay: 500
        });
    }
    
    /**
     * 입력 설정
     */
    setupInput() {
        // 키보드 입력
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        
        spaceKey.on('down', () => this.restartGame());
        enterKey.on('down', () => this.restartGame());
        escKey.on('down', () => this.goToMainMenu());
        
        // 전체 화면 클릭으로도 재시작 (3초 후)
        this.time.delayedCall(3000, () => {
            this.input.once('pointerdown', () => {
                this.restartGame();
            });
        });
    }
    
    /**
     * 시간 포맷팅
     */
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        console.log('Restarting game from GameOverScene');
        
        // 페이드 아웃 효과
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // GameScene으로 돌아가기
            this.scene.start('GameScene');
        });
    }
    
    /**
     * 메인 메뉴로 이동 (현재는 게임 재시작과 동일)
     */
    goToMainMenu() {
        console.log('Going to main menu (currently restarts game)');
        
        // 나중에 MainMenuScene 추가 시 변경
        this.restartGame();
    }
    
    /**
     * 결과 사운드 재생 (나중에 구현)
     */
    playResultSound() {
        // if (this.gameResult.playerWon) {
        //     this.sound.play('victory');
        // } else {
        //     this.sound.play('defeat');
        // }
    }
    
    /**
     * 씬 업데이트
     */
    update() {
        // GameOverScene에서는 특별한 업데이트 로직 없음
    }
    
    /**
     * 씬 종료
     */
    shutdown() {
        // 이벤트 리스너 정리
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
        
        console.log('GameOverScene shutdown');
    }
}
