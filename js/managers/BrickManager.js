// js/managers/BrickManager.js - 테스트 버전
class BrickManager {
    constructor() {}
    
    createBricks(isPlayer1, pattern) {
        const baseHue = isPlayer1 ? COLORS.PLAYER1.BRICK_BASE_HUE : COLORS.PLAYER2.BRICK_BASE_HUE;
        const newBricks = [];
        
        for (let i = 0; i < CONFIG.BRICK_ROWS * CONFIG.BRICK_COLS; i++) {
            if (!pattern[i]) continue;
            
            const row = Math.floor(i / CONFIG.BRICK_COLS);
            const col = i % CONFIG.BRICK_COLS;
            
            const brick = {
                x: col * CONFIG.BRICK_SPACING_X + 15,
                y: isPlayer1
                    ? row * CONFIG.BRICK_SPACING_Y + CONFIG.PLAYER1_BRICKS_START_Y
                    : CONFIG.CANVAS_HEIGHT - (row * CONFIG.BRICK_SPACING_Y + 58),
                width: CONFIG.BRICK_WIDTH,
                height: CONFIG.BRICK_HEIGHT,
                color: `hsl(${baseHue + row * 10}, 70%, 50%)`
            };
            
            newBricks.push(brick);
            brickGrid.addBrick(brick, isPlayer1);
        }
        
        return newBricks;
    }
    
    createSingleBrick(row, col, isPlayer1) {
        const baseHue = isPlayer1 ? COLORS.PLAYER1.BRICK_BASE_HUE : COLORS.PLAYER2.BRICK_BASE_HUE;
        const x = col * CONFIG.BRICK_SPACING_X + 15;
        const y = isPlayer1
            ? row * CONFIG.BRICK_SPACING_Y + CONFIG.PLAYER1_BRICKS_START_Y
            : CONFIG.CANVAS_HEIGHT - (row * CONFIG.BRICK_SPACING_Y + 58);
        
        return {
            x: x,
            y: y,
            width: CONFIG.BRICK_WIDTH,
            height: CONFIG.BRICK_HEIGHT,
            color: `hsl(${baseHue + row * 10}, 70%, 50%)`
        };
    }
    
    checkBrickSpawn(gameState) {
        if (gameState.time < CONFIG.BRICK_SPAWN_INTERVAL ||
            Date.now() - gameState.lastBrickSpawn < CONFIG.BRICK_SPAWN_INTERVAL * 1000) {
            return;
        }
        
        gameState.lastBrickSpawn = Date.now();
        this.spawnBrickForPlayer(true, gameState);
        this.spawnBrickForPlayer(false, gameState);
    }
    
    spawnBrickForPlayer(isPlayer1, gameState) {
        const emptyPositions = brickGrid.findEmptyPositions(isPlayer1);
        
        if (emptyPositions.length > 0) {
            const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            const newBrick = this.createSingleBrick(randomPos.row, randomPos.col, isPlayer1);
            
            const brickSet = isPlayer1 ? gameState.bricks.player1 : gameState.bricks.player2;
            brickSet.push(newBrick);
            brickGrid.addBrick(newBrick, isPlayer1);
            
            this.addSpawnEffect(newBrick, isPlayer1, gameState);
        }
    }
    
    addSpawnEffect(brick, isPlayer1, gameState) {
        gameState.brickSpawnEffects.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height / 2,
            radius: 0,
            maxRadius: 30,
            opacity: 1,
            color: isPlayer1 ? COLORS.PLAYER1.EFFECT : COLORS.PLAYER2.EFFECT
        });
    }
    
    initializeBricks(gameState) {
        brickGrid.init();
        const brickPattern = BrickGrid.generateRandomPattern();
        gameState.bricks.player1 = this.createBricks(true, brickPattern);
        gameState.bricks.player2 = this.createBricks(false, brickPattern);
    }
}

const brickManager = new BrickManager();
