// js/config.js
const CONFIG = {
    // 캔버스 크기
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 700,
    
    // 벽돌 설정
    BRICK_ROWS: 6,
    BRICK_COLS: 10,
    BRICK_WIDTH: 55,
    BRICK_HEIGHT: 18,
    BRICK_SPACING_X: 58,
    BRICK_SPACING_Y: 21,
    BRICK_SPAWN_INTERVAL: 10,  // 초
    BRICK_SPAWN_PROBABILITY: 0.7,
    BRICK_MIN_COVERAGE: 0.66,  // 최소 벽돌 비율
    
    // 공 설정
    BALL_RADIUS: 8,
    BALL_INITIAL_SPEED: 5,
    BALL_MIN_SPEED: 5,
    BALL_SPEED_DECAY: 0.95,
    SPLIT_TIME: 10,  // 초
    
    // 패들 설정
    PADDLE_WIDTH: 60,
    PADDLE_HEIGHT: 12,
    PADDLE_MAX_SPEED: 10,
    PADDLE_ACCELERATION: 0.8,
    PADDLE_FRICTION: 0.85,
    PADDLE_MOMENTUM_TRANSFER: 0.3,
    
    // AI 설정
    BASE_AI_SPEED: 12,
    BASE_AI_ACCEL: 0.6,
    AI_FRICTION: 0.9,
    AI_REACTION_THRESHOLD: 5,
    MIN_AI_MULTIPLIER: 0.6,
    MAX_AI_MULTIPLIER: 2.0,
    DIFFICULTY_UPDATE_INTERVAL: 2000,  // ms
    DIFFICULTY_LERP_FACTOR: 0.1,
    
    // 물리 설정
    MIN_ANGLE: 0.2,  // 최소 반사각 (라디안)
    
    // 렌더링 설정
    CORNER_RADIUS: 20,
    COUNTDOWN_DURATION: 3,  // 초
    
    // 위치 설정
    PLAYER1_PADDLE_Y: 320,
    get PLAYER2_PADDLE_Y() { return this.CANVAS_HEIGHT - 332; },  // 동적 계산
    PLAYER1_BRICKS_START_Y: 40,
    get PLAYER2_BRICKS_START_Y() { return this.CANVAS_HEIGHT - 58; }  // 동적 계산
};

// 색상 테마
const COLORS = {
    PLAYER1: {
        PADDLE: '#4488ff',
        BRICK_BASE_HUE: 200,
        EFFECT: '#4488ff'
    },
    PLAYER2: {
        PADDLE_BASE: '#ff4488',
        BRICK_BASE_HUE: 340,
        EFFECT: '#ff4488'
    },
    BALL: '#ffffff',
    BACKGROUND: {
        TOP: '#001133',
        MIDDLE: '#000511',
        BOTTOM: '#110011'
    }
};

// 객체를 동결하여 실수로 변경되지 않도록 보호
Object.freeze(CONFIG);
Object.freeze(COLORS);
