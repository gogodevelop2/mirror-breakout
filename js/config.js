// js/config.js
// Mirror Breakout - Configuration (Planck.js optimized)

const CONFIG = {
    // Canvas dimensions (pixels)
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 700,
    
    // Physics scaling
    SCALE: 100,  // 1 meter = 100 pixels
    
    // World dimensions (meters)
    WORLD_WIDTH: 6,    // 600px / 100
    WORLD_HEIGHT: 7,   // 700px / 100
    
    // Physics settings
    TIMESTEP: 1/60,
    VELOCITY_ITERATIONS: 8,
    POSITION_ITERATIONS: 3,
    
    // Ball (meters)
    BALL: {
        RADIUS: 0.08,      // 8px
        SPEED: 3.5,        // Initial speed in m/s (350 px/s)
        MAX_SPEED: 7,      // Maximum speed (700 px/s)
        MIN_SPEED: 3,      // Minimum speed (300 px/s)
        BASE_SPEED: 3.5,   // Base speed to return to (350 px/s)
        SPEED_DECAY: 0.97, // Speed decay factor (3% per physics step when above base)
        DECAY_THRESHOLD: 4  // Only decay when speed > this value
    },
    
    // Paddle (meters)
    PADDLE: {
        WIDTH: 0.6,        // 60px
        HEIGHT: 0.12,      // 12px
        PLAYER_Y: 3.2,     // 320px from top (원본과 동일)
        AI_Y: 3.68,        // 368px from top (700 - 332 = 368)
        START_X: 3,        // 300px (화면 정중앙)
        PLAYER_SPEED: 6,   // 6 m/s = 600 px/s (최대 속도)
        AI_BASE_SPEED: 7,  // 7 m/s = 700 px/s
        ACCELERATION: 0.6, // 가속도 (m/s² per frame)
        FRICTION: 0.88,    // 마찰 계수 (12% 감속)
        AI_FRICTION: 0.9,  // AI 마찰 계수
        MOMENTUM_TRANSFER: 0.2 // 패들 속도의 20%가 공에 전달
    },
    
    // Brick (meters)
    BRICK: {
        WIDTH: 0.55,       // 55px
        HEIGHT: 0.18,      // 18px
        ROWS: 6,
        COLS: 10,
        GAP_X: 0.03,       // 3px gap (58 - 55 = 3)
        GAP_Y: 0.03,       // 3px gap (21 - 18 = 3)
        // Starting position for first brick (centered)
        OFFSET_X: 0.1,     // 10px from left (전체 너비 580px, 중앙 정렬을 위해)
        PLAYER_BRICKS_Y: 0.4,  // 40px from top (Player가 깨야 할 벽돌 - 위쪽)
        AI_BRICKS_Y: 6.42      // 642px from top (AI가 깨야 할 벽돌 - 아래쪽)
    },
    
    // Gameplay
    GAME: {
        SPLIT_TIME: 10,         // seconds
        SPAWN_INTERVAL: 10,     // seconds
        COUNTDOWN: 3,
        INITIAL_COVERAGE: 0.7,  // 70% bricks at start
        MIN_COVERAGE: 0.5       // Minimum 50%
    },
    
    // Difficulty
    DIFFICULTY: {
        MIN: 0.6,
        MAX: 2.0,
        INCREASE_RATE: 0.08,
        DECREASE_RATE: 0.06,
        UPDATE_INTERVAL: 2000,  // ms
        LERP_FACTOR: 0.1
    },
    
    // Colors
    COLORS: {
        PLAYER: '#4488ff',
        AI_BASE: '#ff4488',
        BALL: '#ffffff',
        BG_GRADIENT: ['#001133', '#000511', '#110011'],
        PLAYER_BRICK_HUE: 200,
        AI_BRICK_HUE: 340,
        // UI colors
        UI: {
            TEXT: '#ffffff',
            WIN: '#4af',
            LOSE: '#f44',
            TIME: '#fff',
            COUNTDOWN: '#ffffff',
            START: '#4af'
        }
    },
    
    // UI Fonts
    FONTS: {
        TITLE: 'bold 60px Arial',
        SUBTITLE: 'bold 36px Arial',
        LABEL: 'bold 20px Arial',
        TIME: '16px Arial',
        COUNTDOWN: 'bold 120px Arial',
        START: 'bold 80px Arial'
    },
    
    // Visual settings
    CORNER_RADIUS: 20,
    MIN_ANGLE: 0.2,  // radians
    
    // Game zones (meters)
    ZONES: {
        CENTER_LINE: 3.5,        // 중앙선 (WORLD_HEIGHT / 2)
        PLAYER_ZONE_END: 2.8,    // 플레이어 영역 끝 (중앙선에서 0.7m 위)
        AI_ZONE_START: 4.2,      // AI 영역 시작 (중앙선에서 0.7m 아래)
        NEUTRAL_ZONE_SIZE: 0.7   // 중립 지대 크기 (각 방향으로)
    }
};

// Utility functions
const Utils = {
    // Convert pixels to meters
    toMeters(pixels) {
        return pixels / CONFIG.SCALE;
    },
    
    // Convert meters to pixels
    toPixels(meters) {
        return meters * CONFIG.SCALE;
    },
    
    // Get brick color
    getBrickColor(row, isPlayer) {
        const hue = isPlayer ? CONFIG.COLORS.PLAYER_BRICK_HUE : CONFIG.COLORS.AI_BRICK_HUE;
        return `hsl(${hue + row * 10}, 70%, 50%)`;
    },
    
    // Calculate AI paddle color based on difficulty
    getAIDifficultyColor(multiplier) {
        if (multiplier <= 0.6) {
            return '#4488ff';  // Easy - blue
        } else if (multiplier <= 1.0) {
            // Normal - blue to pink transition
            const t = (multiplier - 0.6) / 0.4;
            const r = Math.round(68 + 187 * t);
            const g = Math.round(136 - 68 * t);
            const b = Math.round(255 - 119 * t);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (multiplier <= 1.5) {
            // Hard - pink to red
            const t = (multiplier - 1.0) / 0.5;
            const r = 255;
            const g = Math.round(68 - 68 * t);
            const b = Math.round(136 - 136 * t);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Extreme - dark red
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            const r = Math.round(200 - 50 * t);
            return `rgb(${r}, 0, 0)`;
        }
    },
    
    // Get hexagon vertices for paddle (정확한 육각형 비율)
    getHexagonVertices(width, height) {
        // 육각형을 패들 사각형에 맞추기
        // 양 끝은 삼각형, 중앙은 사각형 형태
        const hw = width / 2;
        const hh = height / 2;
        
        // 삼각형 부분의 너비 = 높이 * tan(30°) = height * 0.577
        // 하지만 패들 모양을 위해 조정
        const triWidth = hh * Math.sqrt(3) / 2;  // 정삼각형 비율
        const rectWidth = hw - triWidth;
        
        // 육각형이 너무 뾰족하면 중앙 사각형 부분 확보
        const minRectWidth = hw * 0.4;  // 최소 40% 는 평평한 부분
        const actualTriWidth = Math.min(triWidth, hw - minRectWidth);
        
        return [
            { x: -hw, y: 0 },                          // 왼쪽 꼭짓점
            { x: -hw + actualTriWidth, y: -hh },       // 왼쪽 위
            { x: hw - actualTriWidth, y: -hh },        // 오른쪽 위
            { x: hw, y: 0 },                           // 오른쪽 꼭짓점
            { x: hw - actualTriWidth, y: hh },         // 오른쪽 아래
            { x: -hw + actualTriWidth, y: hh }         // 왼쪽 아래
        ];
    },
    
    // 공이 어느 영역에 있는지 판단
    getBallZone(ballY) {
        if (ballY < CONFIG.ZONES.PLAYER_ZONE_END) {
            return 'player';    // 플레이어 영역 (상단)
        } else if (ballY > CONFIG.ZONES.AI_ZONE_START) {
            return 'ai';        // AI 영역 (하단)
        } else {
            return 'neutral';   // 중립 영역 (중앙)
        }
    },
    
    // AI가 관심을 가져야 하는 공인지 판단 (방향 기반 절대 원칙)
    shouldAITrackBall(ballPos, ballVel) {
        // 절대 원칙 1: 위에서 아래로 내려오는 공은 신경쓰지 않는다 (플레이어 영역 공)
        if (ballVel.y > 0) {
            return false;
        }
        
        // 절대 원칙 2: 아래에서 중앙으로 올라가는 공은 끝까지 쫓아간다
        if (ballVel.y < 0) {
            return true;
        }
        
        // 수평으로만 움직이는 공 (ballVel.y = 0)은 위치에 따라 판단
        const ballZone = this.getBallZone(ballPos.y);
        if (ballZone === 'ai' || ballZone === 'neutral') {
            return true;
        }
        
        return false;
    }
};

// Freeze config
Object.freeze(CONFIG);
Object.freeze(CONFIG.BALL);
Object.freeze(CONFIG.PADDLE);
Object.freeze(CONFIG.BRICK);
Object.freeze(CONFIG.GAME);
Object.freeze(CONFIG.DIFFICULTY);
Object.freeze(CONFIG.COLORS);
Object.freeze(CONFIG.COLORS.UI);
Object.freeze(CONFIG.FONTS);
