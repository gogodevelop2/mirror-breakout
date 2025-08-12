export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // 배경 그라데이션
        this.createBackground();
        
        // 타이틀
        this.createTitle(width, height);
        
        // 시작 버튼
        this.createStartButton(width, height);
        
        // 게임 설명
        this.createDescription(width, height);
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        
        // 그라데이션 배경을 위한 그래픽스 객체
        const graphics = this.add.graphics();
        
        // 배경 색상들
        const colors = [0x001133, 0x000511, 0x110011];
        
        for (let i = 0; i < height; i++) {
            const progress = i / height;
            let color;
            
            if (progress < 0.5) {
                const t = progress * 2;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(colors[0]),
                    Phaser.Display.Color.ValueToColor(colors[1]),
                    1,
                    t
                );
            } else {
                const t = (progress - 0.5) * 2;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(colors[1]),
                    Phaser.Display.Color.ValueToColor(colors[2]),
                    1,
                    t
                );
            }
            
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, i, width, 1);
        }
    }

    createTitle(width, height) {
        // 메인 타이틀
        const title = this.add.text(width / 2, height / 2 - 100, 'MIRROR BREAKOUT', {
            fontSize: '42px',
            fontFamily: 'Orbitron, monospace',
            fontWeight: '900',
            fill: '#4af',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 타이틀 애니메이션
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createStartButton(width, height) {
        // 시작 버튼 배경
        const buttonBg = this.add.circle(width / 2, height / 2 + 50, 40, 0x4488ff);
        
        // 시작 버튼 텍스트
        const buttonText = this.add.text(width / 2, height / 2 + 50, 'START', {
            fontSize: '16px',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 'bold',
            fill: '#000'
        }).setOrigin(0.5);

        // 버튼 그룹
        const button = this.add.container(0, 0, [buttonBg, buttonText]);
        
        // 버튼 인터랙션
        buttonBg.setInteractive({ useHandCursor: true });
        
        buttonBg.on('pointerover', () => {
            this.tweens.add({
                targets: button,
                scale: 1.1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        buttonBg.on('pointerout', () => {
            this.tweens.add({
                targets: button,
                scale: 1.0,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        buttonBg.on('pointerdown', () => {
            this.tweens.add({
                targets: button,
                scale: 0.95,
                duration: 100,
                ease: 'Power2',
                onComplete: () => {
                    this.scene.start('GameScene');
                }
            });
        });

        // 키보드 입력
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }

    createDescription(width, height) {
        const description = this.add.text(width / 2, height - 80,
            'Use ← → arrows to move paddle\nPress SPACE to start', {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            fill: '#888',
            align: 'center'
        }).setOrigin(0.5);
    }
}
