/**
 * Preload Scene
 * 게임 시작 전 리소스 로딩 및 초기화 씬
 */

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
        
        this.loadingProgress = 0;
        this.loadingText = null;
        this.progressBar = null;
        this.progressBox = null;
    }
    
    /**
     * 씬 초기화
     */
    init() {
        console.log('PreloadScene initialized');
    }
    
    /**
     * 리소스 로딩
     */
    preload() {
        this.createLoadingScreen();
        this.setupLoadingEvents();
        this.loadGameAssets();
    }
    
    /**
     * 로딩 화면 생성
     */
    createLoadingScreen() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 배경 그라데이션
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(
            GameConfig.COLORS.BACKGROUND.TOP,
            GameConfig.COLORS.BACKGROUND.TOP,
            GameConfig.COLORS.BACKGROUND.MID,
            GameConfig.COLORS.BACKGROUND.BOTTOM
        );
        gradient.fillRect(0, 0, width, height);
        
        // 게임 제목
        const titleStyle = {
            fontFamily: 'Orbitron, Arial',
            fontSize: '48px',
            fontWeight: 'bold',
            fill: '#4af',
            align: 'center'
        };
        
        const title = this.add.text(width / 2, height * 0.3, 'MIRROR BREAKOUT', titleStyle);
        title.setOrigin(0.5, 0.5);
        
        // 제목 글로우 효과
        const titleGlow = this.add.text(width / 2, height * 0.3, 'MIRROR BREAKOUT', {
            ...titleStyle,
            fill: '#4af',
            stroke: '#4af',
            strokeThickness: 2
        });
        titleGlow.setOrigin(0.5, 0.5);
        titleGlow.setAlpha(0.3);
        titleGlow.setScale(1.02);
        
        // 제목 애니메이션
        this.tweens.add({
            targets: [title, titleGlow],
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // 프로그레스 바 배경
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222);
        this.progressBox.fillRoundedRect(width * 0.25, height * 0.7, width * 0.5, 20, 10);
        this.progressBox.lineStyle(2, 0x4af);
        this.progressBox.strokeRoundedRect(width * 0.25, height * 0.7, width * 0.5, 20, 10);
        
        // 프로그레스 바
        this.progressBar = this.add.graphics();
        
        // 로딩 텍스트
        this.loadingText = this.add.text(width / 2, height * 0.8, 'Loading... 0%', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center'
        });
        this.loadingText.setOrigin(0.5, 0.5);
        
        // 버전 정보
        const versionText = this.add.text(width - 10, height - 10, 'v1.0.0', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#666666'
        });
        versionText.setOrigin(1, 1);
        
        // 컨트롤 안내
        const controlsText = this.add.text(width / 2, height * 0.9, 'Arrow Keys to Move • Space to Start/Stop', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#888888',
            align: 'center'
        });
        controlsText.setOrigin(0.5, 0.5);
    }
    
    /**
     * 로딩 이벤트 설정
     */
    setupLoadingEvents() {
        // 로딩 진행 이벤트
        this.load.on('progress', (progress) => {
            this.updateLoadingProgress(progress);
        });
        
        // 파일 로딩 이벤트
        this.load.on('fileprogress', (file, progress) => {
            console.log(`Loading: ${file.key} - ${Math.round(progress * 100)}%`);
        });
        
        // 로딩 완료 이벤트
        this.load.on('complete', () => {
            this.onLoadingComplete();
        });
    }
    
    /**
     * 게임 에셋 로딩 (실제로는 텍스처를 동적 생성)
     */
    loadGameAssets() {
        // 실제 파일 로딩 대신 가짜 로딩으로 시뮬레이션
        this.simulateLoading();
        
        // 오디오 로딩 (나중에 추가 시)
        // this.load.audio('paddleHit', ['sounds/paddle-hit.mp3', 'sounds/paddle-hit.wav']);
        // this.load.audio('brickBreak', ['sounds/brick-break.mp3', 'sounds/brick-break.wav']);
        // this.load.audio('ballLost', ['sounds/ball-lost.mp3', 'sounds/ball-lost.wav']);
    }
    
    /**
     * 로딩 시뮬레이션 (텍스처는 런타임에 생성되므로)
     */
    simulateLoading() {
        // 가짜 로딩 단계들
        const loadingSteps = [
            { name: 'Game Config', duration: 200 },
            { name: 'Physics System', duration: 300 },
            { name: 'Vector Math', duration: 150 },
            { name: 'Ball Textures', duration: 400 },
            { name: 'Paddle Textures', duration: 350 },
            { name: 'Brick Textures', duration: 500 },
            { name: 'Effects', duration: 250 },
            { name: 'AI System', duration: 300 },
            { name: 'Final Setup', duration: 200 }
        ];
        
        let totalDuration = 0;
        let currentProgress = 0;
        
        loadingSteps.forEach((step, index) => {
            totalDuration += step.duration;
            
            this.time.delayedCall(totalDuration, () => {
                currentProgress = (index + 1) / loadingSteps.length;
                this.updateLoadingProgress(currentProgress);
                this.loadingText.setText(`Loading ${step.name}... ${Math.round(currentProgress * 100)}%`);
                
                if (index === loadingSteps.length - 1) {
                    // 로딩 완료
                    this.time.delayedCall(300, () => {
                        this.onLoadingComplete();
                    });
                }
            });
        });
    }
    
    /**
     * 로딩 진행률 업데이트
     */
    updateLoadingProgress(progress) {
        this.loadingProgress = progress;
        
        // 프로그레스 바 업데이트
        this.progressBar.clear();
        this.progressBar.fillStyle(0x4af);
        
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        const barWidth = width * 0.5 * progress;
        
        if (barWidth > 0) {
            this.progressBar.fillRoundedRect(width * 0.25, height * 0.7, barWidth, 20, 10);
        }
        
        // 프로그레스 글로우 효과
        if (progress > 0) {
            this.progressBar.fillStyle(0x4af, 0.3);
            this.progressBar.fillRoundedRect(
                width * 0.25 - 2, 
                height * 0.7 - 2, 
                barWidth + 4, 
                24, 
                12
            );
        }
    }
    
    /**
     * 로딩 완료 처리
     */
    onLoadingComplete() {
        console.log('Preloading complete');
        
        // 로딩 완료 텍스트
        this.loadingText.setText('Loading Complete!');
        this.loadingText.setStyle({ fill: '#4af' });
        
        // 완료 애니메이션
        this.tweens.add({
            targets: [this.progressBar, this.progressBox],
            alpha: 0,
            duration: 1000,
            ease: 'Power2.easeOut'
        });
        
        this.tweens.add({
            targets: this.loadingText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.showStartInstructions();
            }
        });
    }
    
    /**
     * 시작 안내 표시
     */
    showStartInstructions() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // "Press SPACE to Start" 메시지
        const startText = this.add.text(width / 2, height * 0.85, 'Press SPACE to Start', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#4af',
            align: 'center'
        });
        startText.setOrigin(0.5, 0.5);
        
        // 깜빡이는 애니메이션
        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // 키보드 입력 대기
        this.waitForInput();
    }
    
    /**
     * 입력 대기
     */
    waitForInput() {
        // 스페이스바 입력 리스너
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        
        spaceKey.on('down', () => {
            this.startGame();
        });
        
        enterKey.on('down', () => {
            this.startGame();
        });
        
        // 클릭으로도 시작 가능
        this.input.once('pointerdown', () => {
            this.startGame();
        });
        
        // 자동 시작 타이머 (10초 후)
        this.time.delayedCall(10000, () => {
            if (this.scene.isActive()) {
                this.startGame();
            }
        });
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        console.log('Starting game from PreloadScene');
        
        // 페이드 아웃 효과
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // GameScene으로 전환
            this.scene.start('GameScene');
        });
    }
    
    /**
     * 씬 생성 완료
     */
    create() {
        // 설정 검증
        if (!GameConfig.validate()) {
            console.error('GameConfig validation failed!');
            return;
        }
        
        // 디버그 모드 체크
        if (GameConfig.DEBUG.VERBOSE_LOGGING) {
            console.log('Debug mode enabled');
            GameConfig.setDebugMode(true);
        }
        
        // 사용자 설정 로딩 (로컬스토리지에서)
        this.loadUserSettings();
        
        console.log('PreloadScene created');
    }
    
    /**
     * 사용자 설정 로딩
     */
    loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('mirrorBreakout_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // 설정 적용
                if (settings.difficulty) {
                    // 난이도 설정 적용
                    console.log('Loaded difficulty:', settings.difficulty);
                }
                
                if (settings.soundEnabled !== undefined) {
                    // 사운드 설정 적용
                    console.log('Sound enabled:', settings.soundEnabled);
                }
            }
        } catch (error) {
            console.warn('Failed to load user settings:', error);
        }
    }
    
    /**
     * 씬 업데이트
     */
    update() {
        // PreloadScene에서는 특별한 업데이트 로직 없음
    }
    
    /**
     * 씬 종료
     */
    shutdown() {
        // 이벤트 리스너 정리
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
        
        console.log('PreloadScene shutdown');
    }
}
