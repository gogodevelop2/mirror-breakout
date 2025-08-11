// 게임 설정 상수
const GAME_CONFIG = {
    // 캔버스 설정
    CANVAS: {
        WIDTH: 600,
        HEIGHT: 700
    },
    
    // 공 설정
    BALL: {
        RADIUS: 8,
        INITIAL_SPEED_X: 200,
        INITIAL_SPEED_Y: -300,
        MAX_SPEED: 500,
        COLOR: 0xffffff
    },
    
    // 패들 설정
    PADDLE: {
        WIDTH: 60,
        HEIGHT: 12,
        PLAYER: {
            Y: 320,  // 상단 패들
            COLOR: 0x4488ff,
            SPEED: 400
        },
        AI: {
            Y: 380,  // 하단 패들 (700 - 320)
            COLOR: 0xff4488,
            BASE_SPEED: 300,
            REACTION_TIME: 100  // ms
        }
    },
    
    // 벽돌 설정
    BRICK: {
        ROWS: 6,
        COLS: 10,
        WIDTH: 55,
        HEIGHT: 18,
        PADDING: 3,
        OFFSET_TOP: 40,
        OFFSET_BOTTOM: 40,
        PLAYER_COLOR_START: 0x4488ff,
        AI_COLOR_START: 0xff4488
    },
    
    // 물리 설정
    PHYSICS: {
        GRAVITY: 0,
        BALL_BOUNCE: 1.01,  // 약간의 가속
        PADDLE_BOUNCE: 1.1,
        WALL_BOUNCE: 1
    },
    
    // 게임 플레이 설정
    GAMEPLAY: {
        COUNTDOWN_TIME: 3,
        BALL_SPLIT_TIME: 10000,  // 10초 (ms)
        BRICK_SPAWN_INTERVAL: 10000  // 10초 (ms)
    },
    
    // 색상 (Phaser는 16진수 색상 사용)
    COLORS: {
        BACKGROUND: 0x000511,
        PLAYER: {
            PRIMARY: 0x4488ff,
            SECONDARY: 0x66aaff
        },
        AI: {
            PRIMARY: 0xff4488,
            SECONDARY: 0xff6688
        },
        BALL: 0xffffff,
        TEXT: 0xffffff
    },
    
    // 점수 설정
    SCORE: {
        BRICK_DESTROY: 10,
        TIME_BONUS: 1  // 초당 보너스
    }
};

// Phaser 게임 설정
const PHASER_CONFIG = {
    type: Phaser.AUTO,
    parent: 'game-canvas',
    width: GAME_CONFIG.CANVAS.WIDTH,
    height: GAME_CONFIG.CANVAS.HEIGHT,
    backgroundColor: '#000511',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.PHYSICS.GRAVITY },
            debug: false  // 개발 중에는 true로 설정 가능
        }
    },
    scene: []  // main.js에서 추가될 예정
};
