// 리소스 로딩 씬
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 로딩 화면 UI 생성
        this.createLoadingScreen();
        
        // 프로그레스 바 이벤트 리스너
        this.load.on('progress', this.updateProgress, this);
        this.load.on('complete', this.loadComplete, this);
        
        // 리소스 로딩 (현재는 빈 텍스처들을 런타임에 생성)
        this.loadGameAssets();
    }

    createLoadingScreen() {
        const { width, height } = this.sys.game.config;
        
        // 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        
        // 제목
        const title = this.add.text(width / 2, height / 2 - 100, 'MIRROR BREAKOUT', {
            fontFamily: 'Orbitron',
            fontSize: '48px',
            fontWeight: '900',
            fill: '#4af',
            stroke: '#002244',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 로딩 텍스트
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // 프로그레스 바 배경
        this.progressBg = this.add.rectangle(width / 2, height / 2 + 50, 400, 20, 0x333333);
        this.progressBg.setStrokeStyle(2, 0x4af);
        
        // 프로그레스 바
        this.progressBar = this.add.rectangle(width / 2 - 198, height / 2 + 50, 4, 16, 0x4af);
        this.progressBar.setOrigin(0, 0.5);
        
        // 버전 정보
        this.add.text(width / 2, height - 50, 'Phaser Edition v1.0', {
            fontFamily: 'Orbitron',
            fontSize: '16px',
            fill: '#888'
        }).setOrigin(0.5);
        
        // 로딩 애니메이션 효과
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

    loadGameAssets() {
        // 현재는 런타임 텍스처 생성을 위한 더미 로딩
        // 실제 에셋이 있다면 여기서 로드
        
        // 가짜 로딩 지연 (실제 개발에서는 제거)
        this.time.delayedCall(1000, () => {
            this.load.start();
        });
        
        // 향후 추가될 에셋들:
        // this.load.image('background', 'assets/images/background.png');
        // this.load.audio('bgm', 'assets/audio/background.mp3');
        // this.load.audio('hit', 'assets/audio/hit.wav');
    }

    updateProgress(value) {
        const percentage = Math.round(value * 100);
        this.loadingText.setText(`Loading... ${percentage}%`);
        
        // 프로그레스 바 업데이트
        this.progressBar.width = 396 * value;
        
        // 로딩 단계별 메시지
        if (percentage < 25) {
            this.loadingText.setText('Initializing Physics...');
        } else if (percentage < 50) {
            this.loadingText.setText('Loading Game Assets...');
        } else if (percentage < 75) {
            this.loadingText.setText('Setting up AI...');
        } else {
            this.loadingText.setText('Almost Ready...');
        }
    }

    loadComplete() {
        // 런타임 텍스처 생성
        this.createRuntimeTextures();
        
        // 로딩 완료 효과
        this.loadingText.setText('Complete!');
        this.progressBar.setFillStyle(0x44ff44);
        
        // 메뉴로 전환
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }

    createRuntimeTextures() {
        const graphics = this.add.graphics();
        
        // 공 텍스처 생성
        this.createBallTexture(graphics);
        
        // 패들 텍스처 생성
        this.createPaddleTextures(graphics);
        
        // 벽돌 텍스처 생성
        this.createBrickTextures(graphics);
        
        // 파티클 텍스처 생성
        this.createParticleTextures(graphics);
        
        graphics.destroy();
    }

    createBallTexture(graphics) {
        const radius = GameConfig.gameplay.ball.radius;
        const size = radius * 2 + 4;
        
        // 공 텍스처
        graphics.clear();
        
        // 외부 글로우
        graphics.fillGradientStyle(0xffffff, 0xffffff, 0x4488ff, 0x4488ff, 0.3);
        graphics.fillCircle(size/2, size/2, radius + 2);
        
        // 메인 볼
        graphics.fillGradientStyle(0xffffff, 0xffffff, 0xcccccc, 0xcccccc);
        graphics.fillCircle(size/2, size/2, radius);
        
        // 하이라이트
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(size/2 - 2, size/2 - 2, radius * 0.3);
        
        graphics.generateTexture('ball', size, size);
    }

    createPaddleTextures(graphics) {
        const { width, height } = GameConfig.gameplay.paddle;
        const radius = height / 2;
        
        // 플레이어 패들
        graphics.clear();
        this.drawPaddle(graphics, width, height, radius, 0x4488ff);
        graphics.generateTexture('paddle_player', width + 4, height + 4);
        
        // AI 패들 (기본 색상)
        graphics.clear();
        this.drawPaddle(graphics, width, height, radius, 0xff4488);
        graphics.generateTexture('paddle_ai', width + 4, height + 4);
    }

    drawPaddle(graphics, width, height, radius, color) {
        const x = 2, y = 2;
        
        // 그림자
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRoundedRect(x + 1, y + 1, width, height, radius);
        
        // 메인 패들
        graphics.fillGradientStyle(color, color, 
            Phaser.Display.Color.GetColor32(Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(color), 
                Phaser.Display.Color.ValueToColor(0x000000), 3, 0.3)), 
            color);
        graphics.fillRoundedRect(x, y, width, height, radius);
        
        // 하이라이트
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillRoundedRect(x, y, width, height * 0.4, radius);
    }

    createBrickTextures(graphics) {
        const { width, height } = GameConfig.gameplay.brick;
        
        // 플레이어 영역 벽돌들 (파란색 계열)
        const playerHues = [200, 210, 220, 230, 240, 250];
        playerHues.forEach((hue, index) => {
            graphics.clear();
            this.drawBrick(graphics, width, height, 
                Phaser.Display.Color.HSVToRGB(hue/360, 0.7, 0.8).color);
            graphics.generateTexture(`brick_player_${index}`, width + 2, height + 2);
        });
        
        // AI 영역 벽돌들 (빨간색 계열)
        const aiHues = [340, 350, 0, 10, 20, 30];
        aiHues.forEach((hue, index) => {
            graphics.clear();
            this.drawBrick(graphics, width, height, 
                Phaser.Display.Color.HSVToRGB(hue/360, 0.7, 0.8).color);
            graphics.generateTexture(`brick_ai_${index}`, width + 2, height + 2);
        });
    }

    drawBrick(graphics, width, height, color) {
        const x = 1, y = 1;
        
        // 그림자
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(x + 1, y + 1, width, height);
        
        // 메인 벽돌
        graphics.fillGradientStyle(color, color, 
            Phaser.Display.Color.GetColor32(Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(color), 
                Phaser.Display.Color.ValueToColor(0x000000), 3, 0.4)), 
            color);
        graphics.fillRect(x, y, width, height);
        
        // 하이라이트
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(x, y, width, height * 0.3);
        
        // 테두리
        graphics.lineStyle(1, 0x000000, 0.5);
        graphics.strokeRect(x, y, width, height);
    }

    createParticleTextures(graphics) {
        // 파티클용 작은 원형 텍스처들
        const sizes = [2, 4, 6, 8];
        const colors = [0xffffff, 0x4488ff, 0xff4488, 0xffff44];
        
        sizes.forEach(size => {
            colors.forEach((color, colorIndex) => {
                graphics.clear();
                graphics.fillGradientStyle(color, color, 0x000000, 0x000000, 1, 0);
                graphics.fillCircle(size, size, size);
                graphics.generateTexture(`particle_${size}_${colorIndex}`, size * 2, size * 2);
            });
        });
    }
}
