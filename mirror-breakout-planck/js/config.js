// js/config.js
// Mirror Breakout - Configuration (Planck.js optimized)

const CONFIG = {
    // Canvas dimensions (pixels)
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 700,
    
    // Physics scaling
    SCALE: 100,  // 1 meter = 100 pixels (better for Planck.js)
    
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
        SPEED: 4,          // Initial speed in m/s
        MAX_SPEED: 8,      
        MIN_SPEED: 3
    },
    
    // Paddle (meters)
    PADDLE: {
        WIDTH: 0.6,        // 60px
        HEIGHT: 0.12,      // 12px
        PLAYER_Y: 6.2,     // 620px from top (near bottom)
        AI_Y: 0.8,         // 80px from top (near top)
        START_X: 3,        // Center
        PLAYER_SPEED: 8,   // m/s
        AI_BASE_SPEED: 10,
        MOMENTUM_TRANSFER: 0.3
    },
    
    // Brick (meters)
    BRICK: {
        WIDTH: 0.55,       // 55px
        HEIGHT: 0.18,      // 18px
        ROWS: 6,
        COLS: 10,
        GAP_X: 0.03,       // 3px gap
        GAP_Y: 0.03,
        // Starting position for first brick
        OFFSET_X: 0.15,    // 15px from left
        PLAYER_OFFSET_Y: 4.0,  // 400px from top (player bricks at bottom area)
        AI_OFFSET_Y: 1.6       // 160px from top (AI bricks at top area)
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
        DECREASE_RATE: 0.06
    },
    
    // Colors
    COLORS: {
        PLAYER: '#4488ff',
        AI_BASE: '#ff4488',
        BALL: '#ffffff',
        BG_GRADIENT: ['#001133', '#000511', '#110011'],
        PLAYER_BRICK_HUE: 200,
        AI_BRICK_HUE: 340
    },
    
    // UI Fonts
    FONTS: {
        TITLE: 'bold 60px Arial',
        SUBTITLE: 'bold 36px Arial',
        LABEL: 'bold 20px Arial',
        TIME: '16px Arial',
        COUNTDOWN: 'bold 120px Arial'
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
    
    // Get hexagon vertices for paddle
    getHexagonVertices(width, height) {
        const hw = width / 2;
        const hh = height / 2;
        // For a hexagon inscribed in the paddle rectangle
        const sideOffset = hh * 0.866;  // height/2 * sqrt(3)/2
        
        return [
            { x: -hw, y: 0 },                    // Left point
            { x: -hw + sideOffset, y: -hh },     // Top left
            { x: hw - sideOffset, y: -hh },      // Top right
            { x: hw, y: 0 },                     // Right point
            { x: hw - sideOffset, y: hh },       // Bottom right
            { x: -hw + sideOffset, y: hh }       // Bottom left
        ];
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
Object.freeze(CONFIG.FONTS);