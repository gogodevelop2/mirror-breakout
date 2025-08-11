// Phaser 게임 인스턴스를 저장할 전역 변수
let game;

// DOM이 로드되면 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
    initGame();
});

function initGame() {
    // Phaser 설정에 씬 추가
    const config = {
        ...PHASER_CONFIG,
        scene: [PreloadScene, GameScene, GameOverScene]
    };
    
    // Phaser 게임 인스턴스 생성
    game = new Phaser.Game(config);
    
    // 브라우저 리사이즈 대응
    window.addEventListener('resize', () => {
        resizeGame();
    });
    
    // 초기 크기 조정
    resizeGame();
}

function resizeGame() {
    // 게임 캔버스 크기를 유지하면서 중앙 정렬
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.width = GAME_CONFIG.CANVAS.WIDTH + 'px';
        canvas.style.height = GAME_CONFIG.CANVAS.HEIGHT + 'px';
    }
}

// 게임 일시정지/재개 기능 (선택적)
function pauseGame() {
    if (game && game.scene.isActive('GameScene')) {
        game.scene.pause('GameScene');
    }
}

function resumeGame() {
    if (game && game.scene.isPaused('GameScene')) {
        game.scene.resume('GameScene');
    }
}

// 페이지 가시성 변경 시 자동 일시정지
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGame();
    } else {
        resumeGame();
    }
});

// 디버그 모드 토글 (개발용)
let debugMode = false;
window.addEventListener('keydown', (e) => {
    // F1 키로 디버그 모드 토글
    if (e.key === 'F1') {
        e.preventDefault();
        debugMode = !debugMode;
        
        if (game && game.config) {
            game.config.physics.arcade.debug = debugMode;
            
            // 현재 실행 중인 씬 재시작
            const currentScene = game.scene.getScenes(true)[0];
            if (currentScene) {
                currentScene.scene.restart();
            }
        }
        
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    }
});

// 게임 통계 추적 (선택적)
class GameStats {
    static totalGames = 0;
    static wins = 0;
    static losses = 0;
    static highScore = 0;
    
    static recordGame(won, score) {
        this.totalGames++;
        if (won) {
            this.wins++;
        } else {
            this.losses++;
        }
        
        if (score > this.highScore) {
            this.highScore = score;
            console.log('New high score:', score);
        }
        
        // 로컬 스토리지에 저장
        this.saveStats();
    }
    
    static saveStats() {
        const stats = {
            totalGames: this.totalGames,
            wins: this.wins,
            losses: this.losses,
            highScore: this.highScore
        };
        localStorage.setItem('mirrorBreakoutStats', JSON.stringify(stats));
    }
    
    static loadStats() {
        const saved = localStorage.getItem('mirrorBreakoutStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.totalGames = stats.totalGames || 0;
            this.wins = stats.wins || 0;
            this.losses = stats.losses || 0;
            this.highScore = stats.highScore || 0;
        }
    }
    
    static getWinRate() {
        if (this.totalGames === 0) return 0;
        return Math.round((this.wins / this.totalGames) * 100);
    }
}

// 통계 로드
GameStats.loadStats();

// 전역 함수로 통계 기록 (GameOverScene에서 호출 가능)
window.recordGameResult = function(won, score) {
    GameStats.recordGame(won, score);
};

// 콘솔에서 통계 확인 가능
window.getGameStats = function() {
    return {
        totalGames: GameStats.totalGames,
        wins: GameStats.wins,
        losses: GameStats.losses,
        winRate: GameStats.getWinRate() + '%',
        highScore: GameStats.highScore
    };
};

console.log('Mirror Breakout - Phaser Edition loaded!');
console.log('Press F1 to toggle debug mode');
console.log('Type getGameStats() in console to see statistics');
