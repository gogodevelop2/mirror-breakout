export const GameConfig = {
    type: Phaser.AUTO,
    width: 600,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#000000',
    
    physics: {
        default: 'matter',
        matter: {
            gravity: { x: 0, y: 0 },
            debug: false,
            enableSleeping: false
        }
    },
    
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },
    
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 300,
            height: 350
        },
        max: {
            width: 1200,
            height: 1400
        }
    },
    
    // 게임 상수
    game: {
        BRICK_ROWS: 6,
        BRICK_COLS: 10,
        BRICK_WIDTH: 55,
        BRICK_HEIGHT: 18,
        BRICK_SPACING_X: 58,
        BRICK_SPACING_Y: 21,
        BALL_RADIUS: 8,
        SPLIT_TIME: 10,
        BRICK_SPAWN_INTERVAL: 10,
        CORNER_RADIUS: 20,
        MIN_ANGLE: 0.2,
        PADDLE_MOMENTUM_TRANSFER: 0.3,
        DIFFICULTY_UPDATE_INTERVAL: 2000,
        BASE_AI_SPEED: 12,
        BASE_AI_ACCEL: 0.6,
        MIN_AI_MULTIPLIER: 0.6,
        MAX_AI_MULTIPLIER: 2.0
    }
};
