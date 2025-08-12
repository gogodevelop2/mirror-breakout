// 메인 메뉴 씬
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.sys.game.config;
        
        // 배경 생성
        this.createBackground();
        
        // 제목 생성
        this.createTitle();
        
        // 메뉴 버튼들 생성
        this.createMenuButtons();
        
        // 게임 정보 생성
        this.createGameInfo();
        
        // 데모 애니메이션 생성
        this.createDemoAnimation();
        
        // 키보드 입력 설정
        this.setupKeyboardInput();
    }

    createBackground() {
        const { width, height } = this.sys.game.config;
        
        // 그라데이션 배경
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x001133, 0x001133, 0x000511, 0x110011);
        graphics.fillRect(0, 0, width, height);
        
        // 중앙 분할선 효과
        const centerY = height / 2;
        graphics.lineStyle(2, 0x4488ff, 0.3);
        graphics.lineBetween(0, centerY, width, centerY);
        
        // 애니메이션 배경 요소들
        this.createBackgroundElements();
    }

    createBackgroundElements() {
        const { width, height } = this.sys.game.config;
        
        // 떠다니는 파티클들
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 3),
                0x4488ff,
                0.3
            );
            
            // 랜덤 움직임 애니메이션
            this.tweens.add({
                targets: particle,
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                duration: Phaser.Math.Between(3000, 8000),
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true,
                delay: Phaser.Math.Between(0, 2000)
            });
            
            // 페이드 효과
            this.tweens.add({
                targets: particle,
                alpha: { from: 0.1, to: 0.6 },
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true
            });
        }
    }

    createTitle() {
        const { width, height } = this.sys.game.config;
        
        // 메인 타이틀
        const title = this.add.text(width / 2, height / 2 - 150, 'MIRROR\nBREAKOUT', {
            fontFamily: 'Orbitron',
            fontSize: '64px',
            fontWeight: '900',
            fill: '#4af',
            stroke: '#002244',
            strokeThickness: 3,
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        // 타이틀 애니메이션
        this.tweens.add({
            targets: title,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 3000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
        
        // 서브타이틀
        this.add.text(width / 2, height / 2 - 80, 'Symmetric Brick Breaking Battle', {
            fontFamily: 'Orbitron',
            fontSize: '18px',
            fill: '#888',
            stroke: '#000',
            strokeThickness: 1
        }).setOrigin(0.5);
    }

    createMenuButtons() {
        const { width, height } = this.sys.game.config;
        const centerX = width / 2;
        const startY = height / 2 - 20;
        const buttonSpacing = 80;
        
        // 버튼 데이터
        const buttons = [
            { text: 'START GAME', key: 'start', action: () => this.startGame() },
            { text: 'HOW TO PLAY', key: 'help', action: () => this.showHelp() },
            { text: 'SETTINGS', key: 'settings', action: () => this.showSettings() }
        ];
        
        this.menuButtons = [];
        
        buttons.forEach((buttonData, index) => {
            const y = startY + (index * buttonSpacing);
            
            // 버튼 배경
            const bg = this.add.rectangle(centerX, y, 300, 60, 0x002244, 0.8)
                .setStrokeStyle(2, 0x4488ff, 0.8);
            
            // 버튼 텍스트
            const text = this.add.text(centerX, y, buttonData.text, {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fontWeight: '700',
                fill: '#4af'
            }).setOrigin(0.5);
            
            // 버튼 그룹
            const button = this.add.group([bg, text]);
            
            // 인터랙션 설정
            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => this.onButtonHover(bg, text))
                .on('pointerout', () => this.onButtonOut(bg, text))
                .on('pointerdown', () => this.onButtonClick(bg, text, buttonData.action));
            
            this.menuButtons.push({ bg, text, action: buttonData.action, key: buttonData.key });
        });
        
        // 선택된 버튼 인덱스
        this.selectedButtonIndex = 0;
        this.updateButtonSelection();
    }

    createGameInfo() {
        const { width, height } = this.sys.game.config;
        
        // 게임 특징 설명
        const features = [
            '• Symmetric dual-field gameplay',
            '• Dynamic ball splitting mechanics',
            '• Adaptive AI difficulty',
            '• Procedural brick patterns'
        ];
        
        features.forEach((feature, index) => {
            this.add.text(50, height - 150 + (index * 25), feature, {
                fontFamily: 'Orbitron',
                fontSize: '14px',
                fill: '#888'
            });
        });
        
        // 최고 기록 표시
        const bestTime = window.mirrorBreakout?.getGameState()?.bestTime;
        if (bestTime) {
            const minutes = Math.floor(bestTime / 60);
            const seconds = bestTime % 60;
            this.add.text(width - 50, height - 50, 
                `Best Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                fill: '#4af'
            }).setOrigin(1);
        }
        
        // 조작법 힌트
        this.add.text(width / 2, height - 30, 
            'Use Arrow Keys or WASD to move • Press SPACE or ENTER to start', {
            fontFamily: 'Orbitron',
            fontSize: '12px',
            fill: '#666',
            align: 'center'
        }).setOrigin(0.5);
    }

    createDemoAnimation() {
        const { width, height } = this.sys.game.config;
        
        // 미니 게임 프리뷰 (우측 상단)
        const previewX = width - 120;
        const previewY = 100;
        const scale = 0.3;
        
        // 미니 필드
        const previewBg = this.add.rectangle(previewX, previewY, 200 * scale, 280 * scale, 0x000000, 0.5)
            .setStrokeStyle(1, 0x4488ff, 0.5);
        
        // 미니 패들들
        const miniPaddle1 = this.add.rectangle(previewX, previewY - 40 * scale, 30 * scale, 6 * scale, 0x4488ff);
        const miniPaddle2 = this.add.rectangle(previewX, previewY + 40 * scale, 30 * scale, 6 * scale, 0xff4488);
        
        // 미니 공
        const miniBall = this.add.circle(previewX, previewY, 3 * scale, 0xffffff);
        
        // 미니 벽돌들
        const miniBricks = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                if (Math.random() > 0.3) {
                    const brickX = previewX - 45 * scale + col * 25 * scale;
                    const brickY = previewY - 60 * scale + row * 12 * scale;
                    const brick = this.add.rectangle(brickX, brickY, 20 * scale, 8 * scale, 0x4488ff, 0.8);
                    miniBricks.push(brick);
                    
                    // 미러 벽돌
                    const mirrorBrick = this.add.rectangle(brickX, previewY + 60 * scale - row * 12 * scale, 
                        20 * scale, 8 * scale, 0xff4488, 0.8);
                    miniBricks.push(mirrorBrick);
                }
            }
        }
        
        // 공 애니메이션
        this.tweens.add({
            targets: miniBall,
            x: previewX + 30 * scale,
            y: previewY - 20 * scale,
            duration: 1000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
        
        // 패들 애니메이션
        this.tweens.add({
            targets: miniPaddle1,
            x: previewX + 20 * scale,
            duration: 1500,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
        
        this.tweens.add({
            targets: miniPaddle2,
            x: previewX - 15 * scale,
            duration: 1200,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
    }

    setupKeyboardInput() {
        // 키보드 입력
        this.input.keyboard.on('keydown', (event) => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.navigateMenu(-1);
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.navigateMenu(1);
                    break;
                case 'Enter':
                case 'Space':
                    this.activateSelectedButton();
                    break;
                case 'Escape':
                    // 설정이나 도움말이 열려있다면 닫기
                    break;
            }
        });
    }

    // 버튼 인터랙션 메서드들
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

    navigateMenu(direction) {
        this.selectedButtonIndex += direction;
        this.selectedButtonIndex = Phaser.Math.Clamp(this.selectedButtonIndex, 0, this.menuButtons.length - 1);
        this.updateButtonSelection();
    }

    updateButtonSelection() {
        this.menuButtons.forEach((button, index) => {
            if (index === this.selectedButtonIndex) {
                button.bg.setStrokeStyle(3, 0x44ffff, 1);
                button.text.setColor('#44ffff');
            } else {
                button.bg.setStrokeStyle(2, 0x4488ff, 0.8);
                button.text.setColor('#4af');
            }
        });
    }

    activateSelectedButton() {
        const selectedButton = this.menuButtons[this.selectedButtonIndex];
        if (selectedButton) {
            this.onButtonClick(selectedButton.bg, selectedButton.text, selectedButton.action);
        }
    }

    // 메뉴 액션들
    startGame() {
        // 화면 전환 효과
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }

    showHelp() {
        // 도움말 오버레이 표시
        this.createHelpOverlay();
    }

    showSettings() {
        // 설정 오버레이 표시
        this.createSettingsOverlay();
    }

    createHelpOverlay() {
        const { width, height } = this.sys.game.config;
        
        // 반투명 배경
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setInteractive();
        
        // 도움말 패널
        const panel = this.add.rectangle(width / 2, height / 2, 500, 400, 0x002244, 0.9)
            .setStrokeStyle(2, 0x4488ff);
        
        // 제목
        this.add.text(width / 2, height / 2 - 160, 'HOW TO PLAY', {
            fontFamily: 'Orbitron',
            fontSize: '32px',
            fontWeight: '700',
            fill: '#4af'
        }).setOrigin(0.5);
        
        // 설명 텍스트
        const helpText = [
            'Goal: Destroy all opponent bricks while protecting yours',
            '',
            'Controls:',
            '← → Arrow Keys: Move paddle',
            'P: Pause game',
            'R: Restart game',
            'ESC: Return to menu',
            '',
            'Game Features:',
            '• Ball splits after 10 seconds for winning player',
            '• New bricks spawn every 10 seconds',
            '• AI difficulty adapts to your performance'
        ];
        
        helpText.forEach((line, index) => {
            this.add.text(width / 2, height / 2 - 120 + index * 20, line, {
                fontFamily: 'Orbitron',
                fontSize: '14px',
                fill: line.includes(':') ? '#4af' : '#fff',
                fontWeight: line.includes(':') ? '700' : '400'
            }).setOrigin(0.5);
        });
        
        // 닫기 버튼
        const closeButton = this.add.text(width / 2, height / 2 + 140, 'CLOSE', {
            fontFamily: 'Orbitron',
            fontSize: '20px',
            fontWeight: '700',
            fill: '#4af',
            backgroundColor: '#002244',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            closeButton.destroy();
            helpText.forEach((_, index) => {
                // 텍스트 객체들도 정리 (실제로는 그룹으로 관리하는 것이 좋음)
            });
        });
    }

    createSettingsOverlay() {
        // 설정 패널 (향후 구현)
        console.log('Settings panel - Coming soon!');
    }
}
