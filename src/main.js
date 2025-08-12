// Mirror Breakout - Main Entry Point
class MirrorBreakout {
    constructor() {
        this.game = null;
        this.init();
    }

    init() {
        // 로딩 표시 제거
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Phaser 게임 인스턴스 생성
        const config = {
            ...GameConfig.phaser,
            scene: [
                PreloadScene,
                MenuScene,
                GameScene,
                GameOverScene
            ]
        };

        this.game = new Phaser.Game(config);

        // 전역 게임 상태 관리자
        this.game.registry.set('gameState', {
            playerScore: 0,
            aiScore: 0,
            currentLevel: 1,
            gameTime: 0,
            bestTime: localStorage.getItem('mirrorBreakout_bestTime') || null
        });

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 키보드 입력 처리
        this.setupKeyboardControls();
        
        // 윈도우 크기 변경 처리
        window.addEventListener('resize', () => {
            this.game.scale.refresh();
        });

        // 게임 포커스 관리
        window.addEventListener('blur', () => {
            if (this.game.scene.isActive('GameScene')) {
                this.game.scene.getScene('GameScene').pauseGame();
            }
        });

        // 브라우저 닫기 전 경고 (게임 중일 때만)
        window.addEventListener('beforeunload', (e) => {
            if (this.game.scene.isActive('GameScene')) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    setupKeyboardControls() {
        // 전역 키보드 단축키
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyP':
                    // 일시정지 토글
                    if (this.game.scene.isActive('GameScene')) {
                        this.game.scene.getScene('GameScene').togglePause();
                    }
                    break;
                
                case 'KeyR':
                    // 게임 재시작
                    if (this.game.scene.isActive('GameScene') || this.game.scene.isActive('GameOverScene')) {
                        this.restartGame();
                    }
                    break;
                
                case 'Escape':
                    // 메뉴로 돌아가기
                    if (this.game.scene.isActive('GameScene')) {
                        this.returnToMenu();
                    }
                    break;
            }
        });
    }

    // 게임 제어 메서드들
    startNewGame() {
        this.game.scene.start('GameScene');
    }

    restartGame() {
        if (this.game.scene.isActive('GameScene')) {
            this.game.scene.restart('GameScene');
        } else {
            this.game.scene.start('GameScene');
        }
    }

    returnToMenu() {
        this.game.scene.start('MenuScene');
    }

    showGameOver(playerWon, gameTime) {
        // 최고 기록 업데이트
        const currentBest = this.game.registry.get('gameState').bestTime;
        if (!currentBest || gameTime < currentBest) {
            this.game.registry.set('gameState', {
                ...this.game.registry.get('gameState'),
                bestTime: gameTime
            });
            localStorage.setItem('mirrorBreakout_bestTime', gameTime.toString());
        }

        // 게임 오버 씬으로 전환
        this.game.scene.start('GameOverScene', { 
            playerWon, 
            gameTime,
            newRecord: !currentBest || gameTime < currentBest
        });
    }

    // 게임 상태 관리
    updateScore(player, score) {
        const gameState = this.game.registry.get('gameState');
        if (player === 'player') {
            gameState.playerScore = score;
        } else {
            gameState.aiScore = score;
        }
        this.game.registry.set('gameState', gameState);
    }

    getGameState() {
        return this.game.registry.get('gameState');
    }

    // 설정 관리
    saveSettings(settings) {
        localStorage.setItem('mirrorBreakout_settings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('mirrorBreakout_settings');
        return saved ? JSON.parse(saved) : {
            soundEnabled: true,
            musicEnabled: true,
            difficulty: 'normal'
        };
    }
}

// 게임 초기화 및 시작
document.addEventListener('DOMContentLoaded', () => {
    window.mirrorBreakout = new MirrorBreakout();
    
    // 개발 모드에서 디버그 정보 출력
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Mirror Breakout - Development Mode');
        console.log('Game Config:', GameConfig);
        console.log('Phaser Version:', Phaser.VERSION);
    }
});
