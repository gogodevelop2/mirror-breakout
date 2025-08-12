// 메인 게임 씬
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene started');
        
        // 게임 설정 초기화
        this.config = GameConfig.gameplay;
        this.gameState = {
            running: false,
            paused: false,
            gameTime: 0,
            startTime: 0,
            playerScore: 0,
            aiScore: 0,
            ballSplitDone: false,
            lastBrickSpawn: 0
        };
        
        // 시스템 초기화
        this.initializeSystems();
        
        // 게임 엔티티 생성
        this.createGameEntities();
        
        // UI 생성
        this.createUI();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 입력 처리 설정
        this.setupInput();
        
        // 게임 시작 카운트다운
        this.startCountdown();
    }
