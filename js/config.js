// js/config.js
// Mirror Breakout - Configuration (Planck.js optimized)

// Calculate responsive canvas size
function calculateCanvasSize() {
    const padding = 40;  // body padding 20px * 2 (top+bottom or left+right)
    const maxWidth = window.innerWidth - padding;
    const maxHeight = window.innerHeight - padding;

    // Maintain 6:7 aspect ratio (width:height)
    const aspectRatio = 6 / 7;

    let canvasHeight = maxHeight;
    let canvasWidth = canvasHeight * aspectRatio;

    // If width exceeds available space, scale down based on width
    if (canvasWidth > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    return {
        width: Math.floor(canvasWidth),
        height: Math.floor(canvasHeight),
        scale: canvasHeight / 7  // SCALE = height / WORLD_HEIGHT
    };
}

// Initialize canvas dimensions
let canvasSize = calculateCanvasSize();

const CONFIG = {
    // Canvas dimensions (pixels) - now dynamic
    CANVAS_WIDTH: canvasSize.width,
    CANVAS_HEIGHT: canvasSize.height,

    // Physics scaling - now dynamic
    SCALE: canvasSize.scale,  // 1 meter = SCALE pixels

    // World dimensions (meters) - always fixed
    WORLD_WIDTH: 6,
    WORLD_HEIGHT: 7,

    // Update canvas size dynamically
    updateCanvasSize() {
        canvasSize = calculateCanvasSize();
        this.CANVAS_WIDTH = canvasSize.width;
        this.CANVAS_HEIGHT = canvasSize.height;
        this.SCALE = canvasSize.scale;
    },

    // Physics settings
    TIMESTEP: 1/60,
    VELOCITY_ITERATIONS: 10,  // Increased for rotating dynamic bricks (Box2D recommends 10 for complex scenes)
    POSITION_ITERATIONS: 8,   // Increased for better collision resolution with many dynamic objects
    
    // Ball (meters)
    BALL: {
        RADIUS: 0.08,      // 8px
        SPEED: 3.5,        // Initial speed in m/s (350 px/s)
        MAX_SPEED: 7,      // Maximum speed (700 px/s)
        MIN_SPEED: 3,      // Minimum speed (300 px/s)
        BASE_SPEED: 3.5,   // Base speed to return to (350 px/s)
        SPEED_DECAY: 0.99, // Speed decay factor (1% per physics step when above base)
        DECAY_THRESHOLD: 5, // Only decay when speed > this value
        MASS: 100,         // Target mass for ball (ball:brick ratio 1:10, brick=1000)
        LAUNCH_ANGLE_VARIATION: 30  // Random angle variation in degrees (±30°)
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
        ROWS: 7,           // Increased from 6 to 7 (added one row)
        COLS: 10,
        GAP_X: 0.03,       // 3px gap (58 - 55 = 3)
        GAP_Y: 0.03,       // 3px gap (21 - 18 = 3)
        // Starting position for first brick (centered)
        OFFSET_X: 0.1,     // 10px from left (전체 너비 580px, 중앙 정렬을 위해)
        PLAYER_BRICKS_Y: 0.19,  // Moved closer to top edge (removed PLAYER label space)
        AI_BRICKS_Y: 6.63,      // Moved closer to bottom edge (removed COMPUTER label space)
        // Physics properties (iOS-style dynamic bricks)
        MASS: 1000,             // Target mass for bricks (ball:brick ratio 1:25, ball=40)
        RESTITUTION: 0.9,       // Bounce coefficient (0.9 = slightly inelastic)
        FRICTION: 0.3,          // Surface friction (helps stabilize brick-brick collisions)
        LINEAR_DAMPING: 1.0,    // Movement damping (higher for stability in JavaScript physics)
        ANGULAR_DAMPING: 1.0,   // Rotation damping (prevents excessive rotation causing overlap)
        // Visual effects for destroyed bricks
        DESTROY_DELAY: 0.15,    // Delay before removal (0.15 seconds, same as iOS)
        DESTROY_ALPHA: 0.5      // Alpha during destruction (0.5 = semi-transparent)
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

    // Game zones (meters)
    ZONES: {
        CENTER_LINE: 3.5,        // 중앙선 (WORLD_HEIGHT / 2)
        PLAYER_ZONE_END: 2.8,    // 플레이어 영역 끝 (중앙선에서 0.7m 위)
        AI_ZONE_START: 4.2,      // AI 영역 시작 (중앙선에서 0.7m 아래)
        NEUTRAL_ZONE_SIZE: 0.7   // 중립 지대 크기 (각 방향으로)
    },

    // 렌더링 설정
    RENDERING: {
        // 그림자 효과
        SHADOW: {
            BRICK: {
                color: 'rgba(0, 0, 0, 0.3)',
                blur: 2,
                offsetX: 1,
                offsetY: 1
            },
            PADDLE: {
                color: 'rgba(0, 0, 0, 0.4)',
                blur: 4,
                offsetX: 2,
                offsetY: 2
            }
        },

        // 이펙트 설정
        EFFECTS: {
            SPLIT_RING_SCALES: [1, 0.7, 1.3],  // 분열 이펙트 링 크기
            SPLIT_RING_OPACITY_DECAY: 0.3,     // 링별 투명도 감소
            SPLIT_RING_BASE_WIDTH: 3,          // 기본 선 굵기
            SPAWN_RING_WIDTH: 2                // 스폰 이펙트 링 굵기
        },

        // 조명 효과
        LIGHTING: {
            BRICK_HIGHLIGHT: 'rgba(255, 255, 255, 0.2)',
            BRICK_SHADOW: 'rgba(0, 0, 0, 0.2)',
            PADDLE_SHINE: [
                { stop: 0, color: 'rgba(255, 255, 255, 0.3)' },
                { stop: 0.5, color: 'rgba(255, 255, 255, 0.1)' },
                { stop: 1, color: 'rgba(0, 0, 0, 0.2)' }
            ]
        }
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

    /**
     * 값을 min과 max 사이로 제한
     * @param {number} value - 제한할 값
     * @param {number} min - 최소값
     * @param {number} max - 최대값
     * @returns {number}
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 대칭 범위로 클램핑 (-limit ~ +limit)
     * @param {number} value - 제한할 값
     * @param {number} limit - 절대값 제한
     * @returns {number}
     */
    clampSymmetric(value, limit) {
        return Math.max(-limit, Math.min(limit, value));
    },

    /**
     * 원형 물체의 밀도 계산
     * @param {number} mass - 질량
     * @param {number} radius - 반지름
     * @returns {number}
     */
    calculateCircleDensity(mass, radius) {
        const area = Math.PI * radius * radius;
        return mass / area;
    },

    /**
     * 사각형 물체의 밀도 계산
     * @param {number} mass - 질량
     * @param {number} width - 너비
     * @param {number} height - 높이
     * @returns {number}
     */
    calculateRectDensity(mass, width, height) {
        const area = width * height;
        return mass / area;
    },

    /**
     * 공 밀도 (CONFIG 기반)
     * @returns {number}
     */
    getBallDensity() {
        return this.calculateCircleDensity(CONFIG.BALL.MASS, CONFIG.BALL.RADIUS);
    },

    /**
     * 브릭 밀도 (CONFIG 기반)
     * @returns {number}
     */
    getBrickDensity() {
        return this.calculateRectDensity(
            CONFIG.BRICK.MASS,
            CONFIG.BRICK.WIDTH,
            CONFIG.BRICK.HEIGHT
        );
    },
    
    // Get brick color
    getBrickColor(row, isPlayer) {
        const hue = isPlayer ? CONFIG.COLORS.PLAYER_BRICK_HUE : CONFIG.COLORS.AI_BRICK_HUE;
        return `hsl(${hue + row * 10}, 70%, 50%)`;
    },
    
    // Calculate AI paddle color based on difficulty (red spectrum only)
    getAIDifficultyColor(multiplier) {
        if (multiplier <= 0.6) {
            return '#ff8866';  // Easy - light coral/orange
        } else if (multiplier <= 1.0) {
            // Normal - coral to pink-red transition
            const t = (multiplier - 0.6) / 0.4;
            const r = 255;
            const g = Math.round(136 - 68 * t);
            const b = Math.round(102 + 34 * t);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (multiplier <= 1.5) {
            // Hard - pink-red to bright red
            const t = (multiplier - 1.0) / 0.5;
            const r = 255;
            const g = Math.round(68 - 68 * t);
            const b = Math.round(136 - 68 * t);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Extreme - bright red to dark red
            const t = Math.min((multiplier - 1.5) / 0.5, 1);
            const r = Math.round(255 - 51 * t);
            const g = 0;
            const b = Math.round(68 * (1 - t));
            return `rgb(${r}, ${g}, ${b})`;
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
    },

    // Get random launch velocity with angle variation
    getRandomLaunchVelocity(baseVx, baseVy) {
        const speed = Math.sqrt(baseVx * baseVx + baseVy * baseVy);
        const baseAngle = Math.atan2(baseVy, baseVx);

        // Random variation in radians
        const variation = (Math.random() - 0.5) * 2 * (CONFIG.BALL.LAUNCH_ANGLE_VARIATION * Math.PI / 180);
        const newAngle = baseAngle + variation;

        return {
            vx: speed * Math.cos(newAngle),
            vy: speed * Math.sin(newAngle)
        };
    }
};

// Don't freeze CONFIG to allow dynamic updates from UI
// Object.freeze(CONFIG);
// Object.freeze(CONFIG.BALL);
// Object.freeze(CONFIG.PADDLE);
// Object.freeze(CONFIG.BRICK);
// Object.freeze(CONFIG.GAME);
// Object.freeze(CONFIG.DIFFICULTY);
// Object.freeze(CONFIG.COLORS);
// Object.freeze(CONFIG.COLORS.UI);
// Object.freeze(CONFIG.FONTS);
