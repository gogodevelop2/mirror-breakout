// ============================================
// 게임 설정 상수
// ============================================

export const CONFIG = {
    // 캔버스 설정
    CANVAS: {
        WIDTH: 600,
        HEIGHT: 700,
        CORNER_RADIUS: 20
    },
    
    // 벽돌 설정
    BRICK: {
        ROWS: 6,
        COLS: 10,
        WIDTH: 55,
        HEIGHT: 18,
        SPACING_X: 58,
        SPACING_Y: 21,
        SPAWN_INTERVAL: 10,  // 초 단위
        MIN_BRICKS_RATIO: 0.5,  // 최소 벽돌 비율
        SPAWN_CHANCE: 0.7  // 초기 벽돌 생성 확률
    },
    
    // 공 설정
    BALL: {
        RADIUS: 8,
        SPLIT_TIME: 10,  // 초 단위
        MIN_SPEED: 5,
        SPEED_DECAY: 0.95
    },
    
    // 패들 설정
    PADDLE: {
        WIDTH: 60,
        HEIGHT: 12,
        PLAYER: {
            Y: 320,
            MAX_SPEED: 10,
            ACCELERATION: 0.8,
            FRICTION: 0.85
        },
        AI: {
            Y_OFFSET: 332,  // canvas.height - this value
            BASE_SPEED: 12,
            BASE_ACCEL: 0.6,
            FRICTION: 0.9,
            REACTION_THRESHOLD_BASE: 5
        }
    },
    
    // 물리 설정
    PHYSICS: {
        MIN_ANGLE: 0.2,
        PADDLE_MOMENTUM_TRANSFER: 0.3,
        COLLISION_THRESHOLD: 8
    },
    
    // 난이도 설정
    DIFFICULTY: {
        UPDATE_INTERVAL: 2000,  // 밀리초
        MIN_MULTIPLIER: 0.6,
        MAX_MULTIPLIER: 2.0,
        BRICK_DIFF_FACTOR: 0.08,
        BRICK_DIFF_FACTOR_NEGATIVE: 0.06,
        LERP_FACTOR: 0.1
    },
    
    // 게임 플레이 설정
    GAMEPLAY: {
        COUNTDOWN_DURATION: 3,  // 초
        START_DELAY: 500  // 밀리초
    },
    
    // 색상 설정
    COLORS: {
        PLAYER: {
            PRIMARY: '#4488ff',
            HUE_BASE: 200
        },
        AI: {
            PRIMARY: '#ff4488',
            HUE_BASE: 340,
            EASY: '#4488ff',
            NORMAL: '#ff8844',
            HARD: '#ff0000',
            EXTREME: '#cc0000'
        },
        BACKGROUND: {
            TOP: '#001133',
            MIDDLE: '#000511',
            BOTTOM: '#110011'
        }
    }
};

// 계산된 상수들
export const TOTAL_BRICKS = CONFIG.BRICK.ROWS * CONFIG.BRICK.COLS;
