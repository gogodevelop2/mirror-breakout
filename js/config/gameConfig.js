/**
 * Mirror Breakout Game Configuration
 * 모든 게임 상수와 설정을 중앙 관리
 */

const GameConfig = {
    // 캔버스 설정
    CANVAS: {
        WIDTH: 600,
        HEIGHT: 700
    },
    
    // 벽돌 설정
    BRICK: {
        ROWS: 6,
        COLS: 10,
        WIDTH: 55,
        HEIGHT: 18,
        SPACING_X: 58,
        SPACING_Y: 21,
        SPAWN_INTERVAL: 10000,        // 10초 (밀리초)
        SPAWN_PROBABILITY: 0.7,       // 70% 확률로 벽돌 생성
        MIN_COUNT_RATIO: 0.66,         // 최소 66% 이상 벽돌 보장
        START_OFFSET_X: 15,           // 벽돌 시작 X 위치
        START_OFFSET_Y_PLAYER: 40,    // 플레이어 벽돌 시작 Y 위치
        START_OFFSET_Y_AI: 58         // AI 벽돌 시작 Y 위치 (바닥에서)
    },
    
    // 공 설정
    BALL: {
        RADIUS: 8,
        SPEED: 300,                   // Phaser physics 속도 단위
        SPLIT_TIME: 10000,           // 10초 후 분열
        MIN_ANGLE: 0.2,              // 최소 반사각 (라디안)
        SPEED_RETENTION: 0.98,       // 충돌 시 속도 유지율
        GLOW_RADIUS: 20              // 글로우 효과 반지름
    },
    
    // 패들 설정
    PADDLE: {
        WIDTH: 60,
        HEIGHT: 12,
        PLAYER_SPEED: 400,           // 플레이어 패들 최대 속도
        AI_BASE_SPEED: 360,          // AI 패들 기본 속도
        AI_BASE_ACCEL: 0.6,          // AI 패들 기본 가속도
        MOMENTUM_TRANSFER: 0.3,      // 패들 모멘텀 전달 계수
        FRICTION: 0.85,              // 패들 마찰 계수
        CORNER_RADIUS_RATIO: 0.5     // 패들 둥근 모서리 비율 (높이 대비)
    },
    
    // AI 시스템 설정
    AI: {
        DIFFICULTY_UPDATE_INTERVAL: 2000,  // 2초마다 난이도 조정
        MIN_MULTIPLIER: 0.6,               // 최소 난이도 배율
        MAX_MULTIPLIER: 2.0,               // 최대 난이도 배율
        REACTION_THRESHOLD_BASE: 5,        // 기본 반응 임계값
        SPEED_ADJUSTMENT_FACTOR: 0.08,     // 속도 조정 계수
        LERP_FACTOR: 0.1                   // 부드러운 전환 계수
    },
    
    // 위치 설정
    POSITIONS: {
        PLAYER_PADDLE_Y: 320,
        AI_PADDLE_Y: 368,              // canvas.height - 332 대신 고정값
        CENTER_LINE_Y: 350             // 중앙선 위치
    },
    
    // 색상 설정 (0x 형식 - Phaser 호환)
    COLORS: {
        // 기본 색상
        PLAYER: 0x4488ff,
        BALL: 0xffffff,
        
        // AI 색상 (난이도별)
        AI_MIN: 0x4488ff,              // 쉬운 난이도 (파란색)
        AI_MID: 0xff8844,              // 중간 난이도 (주황색)
        AI_MAX: 0xff4488,              // 어려운 난이도 (빨간색)
        
        // 배경 색상
        BACKGROUND: {
            TOP: 0x001133,
            MID: 0x000511,
            BOTTOM: 0x110011
        },
        
        // 효과 색상
        WAVE_CENTER: 0x64c8ff,         // 중앙 웨이브 효과
        FLASH_WHITE: 0xffffff,         // 충돌 플래시
        
        // 벽돌 색상 (HSL 기반)
        BRICK_HUE_PLAYER: 200,         // 플레이어 벽돌 기본 색조
        BRICK_HUE_AI: 340,             // AI 벽돌 기본 색조
        BRICK_SATURATION: 70,          // 채도
        BRICK_LIGHTNESS: 50            // 명도
    },
    
    // 타이밍 설정
    TIMING: {
        COUNTDOWN_DURATION: 3000,      // 3초 카운트다운
        COUNTDOWN_STEP: 1000,          // 1초씩 감소
        START_DELAY: 500,              // 카운트다운 후 시작 딜레이
        SPLIT_EFFECT_DURATION: 300,    // 분열 효과 지속시간
        BRICK_SPAWN_EFFECT_DURATION: 300, // 벽돌 생성 효과 지속시간
        VIBRATION_PADDLE_HIT: 200,     // 패들 충돌 진동 시간
        VIBRATION_BRICK_BREAK: 150     // 벽돌 파괴 진동 시간
    },
    
    // 이펙트 설정
    EFFECTS: {
        // 진동 효과
        VIBRATION: {
            PADDLE_HIT_INTENSITY: 1.0,
            BRICK_BREAK_INTENSITY: 0.8,
            CAMERA_SHAKE_DURATION: 100,
            CAMERA_SHAKE_INTENSITY: 0.01
        },
        
        // 글로우 효과
        GLOW: {
            BALL_RADIUS: 20,
            BALL_OPACITY: 0.3,
            SPLIT_EFFECT_MAX_RADIUS: 50,
            BRICK_SPAWN_MAX_RADIUS: 30
        },
        
        // 애니메이션
        ANIMATION: {
            GRADIENT_SHIFT_DURATION: 3000,
            BUTTON_HOVER_SCALE: 1.1,
            BUTTON_ACTIVE_SCALE: 0.95,
            BRICK_SPAWN_SCALE_DURATION: 300
        }
    },
    
    // 물리 설정
    PHYSICS: {
        WORLD_BOUNDS_THICKNESS: 32,    // 월드 경계 두께
        BALL_BOUNCE: 1.0,              // 공 탄성
        PADDLE_IMMOVABLE: true,        // 패들 고정
        SEPARATION_BIAS: 4,            // 충돌 분리 보정값
        VELOCITY_THRESHOLD: 0.1        // 속도 임계값
    },
    
    // 게임플레이 설정
    GAMEPLAY: {
        INITIAL_BALL_COUNT: 2,         // 초기 공 개수
        MAX_BALL_COUNT: 10,            // 최대 공 개수
        SCORE_PER_BRICK: 10,           // 벽돌당 점수
        WIN_CONDITION: 'ALL_BRICKS_DESTROYED', // 승리 조건
        BALL_SPLIT_THRESHOLD: 0.5      // 공 분열 기준 (상대 진행도)
    },
    
    // 디버그 설정
    DEBUG: {
        PHYSICS: false,                // 물리 디버그 표시
        AI_TARGET: false,              // AI 타겟 표시
        GRID: false,                   // 벽돌 그리드 표시
        PERFORMANCE: false,            // 성능 정보 표시
        COLLISION_ZONES: false,        // 충돌 영역 표시
        VERBOSE_LOGGING: false         // 상세 로그
    },
    
    // 성능 최적화 설정
    PERFORMANCE: {
        OBJECT_POOL_SIZE: 50,          // 오브젝트 풀 크기
        MAX_PARTICLES: 100,            // 최대 파티클 수
        RENDER_OPTIMIZATION: true,     // 렌더링 최적화
        PHYSICS_ITERATIONS: 4,         // 물리 반복 횟수
        COLLISION_PRECISION: 'HIGH'    // 충돌 정밀도
    }
};

// 계산된 값들 (다른 설정값을 기반으로 계산)
GameConfig.CALCULATED = {
    // 벽돌 관련
    TOTAL_BRICKS: GameConfig.BRICK.ROWS * GameConfig.BRICK.COLS,
    MIN_BRICKS: Math.floor(GameConfig.BRICK.ROWS * GameConfig.BRICK.COLS * GameConfig.BRICK.MIN_COUNT_RATIO),
    
    // 패들 관련
    PADDLE_CORNER_RADIUS: GameConfig.PADDLE.HEIGHT * GameConfig.PADDLE.CORNER_RADIUS_RATIO,
    PADDLE_RECT_WIDTH: GameConfig.PADDLE.WIDTH - GameConfig.PADDLE.HEIGHT,
    
    // 게임 영역
    GAME_CENTER_X: GameConfig.CANVAS.WIDTH / 2,
    GAME_CENTER_Y: GameConfig.CANVAS.HEIGHT / 2,
    
    // AI 영역 (화면 하단에서 계산)
    AI_PADDLE_Y_FROM_BOTTOM: GameConfig.CANVAS.HEIGHT - 332,
    AI_BRICK_START_Y: GameConfig.CANVAS.HEIGHT - GameConfig.BRICK.START_OFFSET_Y_AI
};

// 설정 검증 함수
GameConfig.validate = function() {
    const errors = [];
    
    // 필수 값 검증
    if (this.CANVAS.WIDTH <= 0 || this.CANVAS.HEIGHT <= 0) {
        errors.push('Canvas dimensions must be positive');
    }
    
    if (this.BALL.RADIUS <= 0 || this.BALL.SPEED <= 0) {
        errors.push('Ball parameters must be positive');
    }
    
    if (this.PADDLE.WIDTH <= this.PADDLE.HEIGHT) {
        errors.push('Paddle width must be greater than height');
    }
    
    // 범위 검증
    if (this.AI.MIN_MULTIPLIER >= this.AI.MAX_MULTIPLIER) {
        errors.push('AI min multiplier must be less than max multiplier');
    }
    
    if (errors.length > 0) {
        console.error('GameConfig validation errors:', errors);
        return false;
    }
    
    return true;
};

// 개발용 설정 오버라이드 함수
GameConfig.setDebugMode = function(enabled) {
    Object.keys(this.DEBUG).forEach(key => {
        this.DEBUG[key] = enabled;
    });
    console.log('Debug mode:', enabled ? 'enabled' : 'disabled');
};

// 난이도 프리셋
GameConfig.DIFFICULTY_PRESETS = {
    EASY: {
        AI_SPEED_MULTIPLIER: 0.8,
        BALL_SPEED_MULTIPLIER: 0.9,
        BRICK_SPAWN_INTERVAL: 15000
    },
    NORMAL: {
        AI_SPEED_MULTIPLIER: 1.0,
        BALL_SPEED_MULTIPLIER: 1.0,
        BRICK_SPAWN_INTERVAL: 10000
    },
    HARD: {
        AI_SPEED_MULTIPLIER: 1.3,
        BALL_SPEED_MULTIPLIER: 1.2,
        BRICK_SPAWN_INTERVAL: 7000
    }
};

// 초기화 시 검증 실행
if (typeof window !== 'undefined') {
    GameConfig.validate();
}
