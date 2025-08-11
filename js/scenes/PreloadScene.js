class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }
    
    preload() {
        // 로딩 텍스트 표시
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.add.text(
            width / 2,
            height / 2 - 50,
            'Loading...',
            {
                fontSize: '32px',
                color: '#4488ff',
                fontFamily: 'Arial'
            }
        );
        loadingText.setOrigin(0.5, 0.5);
        
        // 로딩 바 생성
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);
        
        // 로딩 퍼센트 텍스트
        const percentText = this.add.text(
            width / 2,
            height / 2 + 25,
            '0%',
            {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        percentText.setOrigin(0.5, 0.5);
        
        // 로딩 이벤트 리스너
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x4488ff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // Phase 1에서는 코드로 모든 것을 그리므로 별도 이미지 로드 불필요
        // 나중에 추가될 리소스를 위한 플레이스홀더
        this.createAssets();
    }
    
    createAssets() {
        // 동적으로 기본 텍스처 생성 (코드로 그리기)
        // 공 텍스처
        const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(8, 8, 8);
        ballGraphics.generateTexture('ball', 16, 16);
        
        // 패들 텍스처 (플레이어)
        const paddlePlayerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        paddlePlayerGraphics.fillStyle(0x4488ff, 1);
        paddlePlayerGraphics.fillRoundedRect(0, 0, 60, 12, 6);
        paddlePlayerGraphics.generateTexture('paddlePlayer', 60, 12);
        
        // 패들 텍스처 (AI)
        const paddleAIGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        paddleAIGraphics.fillStyle(0xff4488, 1);
        paddleAIGraphics.fillRoundedRect(0, 0, 60, 12, 6);
        paddleAIGraphics.generateTexture('paddleAI', 60, 12);
        
        // 벽돌 텍스처들 생성
        this.createBrickTextures();
    }
    
    createBrickTextures() {
        // 플레이어 벽돌 텍스처 (파란색 계열)
        for (let i = 0; i < 6; i++) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            const hue = 200 + i * 10;
            const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.5).color;
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 55, 18);
            graphics.lineStyle(1, 0x000000, 0.3);
            graphics.strokeRect(0, 0, 55, 18);
            graphics.generateTexture(`brickPlayer${i}`, 55, 18);
        }
        
        // AI 벽돌 텍스처 (빨간색 계열)
        for (let i = 0; i < 6; i++) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            const hue = 340 + i * 10;
            const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.5).color;
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 55, 18);
            graphics.lineStyle(1, 0x000000, 0.3);
            graphics.strokeRect(0, 0, 55, 18);
            graphics.generateTexture(`brickAI${i}`, 55, 18);
        }
    }
    
    create() {
        // 동적으로 기본 텍스처 생성
        this.createGameTextures();
        
        // 잠시 대기 후 메인 게임 씬으로 전환
        this.time.delayedCall(100, () => {
            this.scene.start('GameScene');
        });
    }
    
    createGameTextures() {
        // 공 텍스처
        const ballGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(8, 8, 8);
        ballGraphics.generateTexture('ball', 16, 16);
        ballGraphics.destroy();
        
        // 패들 텍스처 (플레이어)
        const paddlePlayerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        paddlePlayerGraphics.fillStyle(0x4488ff, 1);
        paddlePlayerGraphics.fillRoundedRect(0, 0, 60, 12, 6);
        paddlePlayerGraphics.generateTexture('paddlePlayer', 60, 12);
        paddlePlayerGraphics.destroy();
        
        // 패들 텍스처 (AI)
        const paddleAIGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        paddleAIGraphics.fillStyle(0xff4488, 1);
        paddleAIGraphics.fillRoundedRect(0, 0, 60, 12, 6);
        paddleAIGraphics.generateTexture('paddleAI', 60, 12);
        paddleAIGraphics.destroy();
        
        // 벽돌 텍스처들 생성
        this.createBrickTextures();
    }
}
