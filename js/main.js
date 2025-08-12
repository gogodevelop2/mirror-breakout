/**
 * Mirror Breakout - Main Game Entry Point
 * Phaser.js 기반 리팩토링 버전
 */

class MirrorBreakout {
    constructor() {
        this.game = null;
        this.isGameRunning = false;
        
        this.initializeGame();
        this.setupUI();
    }
    
    /**
     * Phaser 게임 초기화
     */
    initializeGame() {
        const config = {
            type: Phaser.AUTO,
            width: GameConfig.CANVAS.WIDTH,
            height: GameConfig.CANVAS.HEIGHT,
            parent: 'game-container',
            backgroundColor: '#000000',
            
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: GameConfig.DEBUG.PHYSICS
                }
            },
            
            scene: [PreloadScene, GameScene, GameOverScene],
            
            // 성능 최적화 설정
            render: {
                antialias: true,
                pixelArt: false,
                roundPixels: true
            },
            
            // 스케일 설정
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };
        
        this.game = new Phaser.Game(config);
        
        // 게임 이벤트 리스너 설정
        this.setupGameEvents();
    }
    
    /**
     * 게임 이벤트 설정
     */
    setupGameEvents() {
        // 씬 간 통신을 위한 전역 이벤트
        this.game.events.on('gamestart', () => {
            this.isGameRunning = true;
            this.updateButtonText('STOP');
        });
        
        this.game.events.on('gameover', (data) => {
            this.isGameRunning = false;
            this.updateButtonText('START');
            console.log('Game Over:', data);
        });
        
        this.game.events.on('gamereset', () => {
            this.isGameRunning = false;
            this.updateButtonText('START');
        });
    }
    
    /**
     * UI 버튼 설정
     */
    setupUI() {
        const toggleButton = document.getElementById('toggleButton');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleGame();
            });
        }
        
        // 키보드 이벤트 (전역)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.toggleGame();
            }
        });
    }
    
    /**
     * 게임 시작/중지 토글
     */
    toggleGame() {
        if (this.isGameRunning) {
            this.stopGame();
        } else {
            this.startGame();
        }
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        if (this.game && this.game.scene) {
            // 현재 활성 씬 확인
            const currentScene = this.game.scene.getScene('GameScene');
            
            if (currentScene) {
                if (currentScene.scene.isActive()) {
                    // 게임 씬이 활성화되어 있으면 재시작
                    currentScene.events.emit('restartGame');
                } else {
                    // 게임 씬으로 전환
                    this.game.scene.start('GameScene');
                }
            } else {
                // 게임 씬이 없으면 새로 시작
                this.game.scene.start('GameScene');
            }
        }
    }
    
    /**
     * 게임 중지
     */
    stopGame() {
        if (this.game && this.game.scene) {
            const currentScene = this.game.scene.getScene('GameScene');
            
            if (currentScene && currentScene.scene.isActive()) {
                currentScene.events.emit('stopGame');
            }
        }
    }
    
    /**
     * 버튼 텍스트 업데이트
     */
    updateButtonText(text) {
        const toggleButton = document.getElementById('toggleButton');
        if (toggleButton) {
            toggleButton.textContent = text;
        }
    }
    
    /**
     * 게임 파괴 (정리)
     */
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

/**
 * 게임 시작
 */
window.addEventListener('load', () => {
    // 전역 게임 인스턴스
    window.mirrorBreakout = new MirrorBreakout();
    
    console.log('Mirror Breakout initialized!');
});

/**
 * 페이지 언로드 시 정리
 */
window.addEventListener('beforeunload', () => {
    if (window.mirrorBreakout) {
        window.mirrorBreakout.destroy();
    }
});
