// js/utils/BrickGrid.js

class BrickGrid {
    constructor() {
        this.player1 = null;
        this.player2 = null;
        this.init();
    }
    
    init() {
        this.player1 = Array(CONFIG.BRICK_ROWS).fill().map(() => Array(CONFIG.BRICK_COLS).fill(null));
        this.player2 = Array(CONFIG.BRICK_ROWS).fill().map(() => Array(CONFIG.BRICK_COLS).fill(null));
    }
    
    // 벽돌 위치를 행/열로 변환
    getBrickGridPosition(brick, isPlayer1) {
        const col = Math.round((brick.x - 15) / CONFIG.BRICK_SPACING_X);
        let row;
        if (isPlayer1) {
            row = Math.round((brick.y - CONFIG.PLAYER1_BRICKS_START_Y) / CONFIG.BRICK_SPACING_Y);
        } else {
            row = Math.round((CONFIG.CANVAS_HEIGHT - brick.y - 58) / CONFIG.BRICK_SPACING_Y);
        }
        return { row, col };
    }
    
    // 그리드에 벽돌 등록
    addBrick(brick, isPlayer1) {
        const { row, col } = this.getBrickGridPosition(brick, isPlayer1);
        if (row >= 0 && row < CONFIG.BRICK_ROWS && col >= 0 && col < CONFIG.BRICK_COLS) {
            const grid = isPlayer1 ? this.player1 : this.player2;
            grid[row][col] = brick;
        }
    }
    
    // 그리드에서 벽돌 제거
    removeBrick(brick, isPlayer1) {
        const { row, col } = this.getBrickGridPosition(brick, isPlayer1);
        if (row >= 0 && row < CONFIG.BRICK_ROWS && col >= 0 && col < CONFIG.BRICK_COLS) {
            const grid = isPlayer1 ? this.player1 : this.player2;
            grid[row][col] = null;
        }
    }
    
    // 빈 자리 탐색 (최적화된 버전)
    findEmptyPositions(isPlayer1) {
        const emptyPositions = [];
        const grid = isPlayer1 ? this.player1 : this.player2;
        
        for (let row = 0; row < CONFIG.BRICK_ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK_COLS; col++) {
                if (grid[row][col] === null) {
                    const x = col * CONFIG.BRICK_SPACING_X + 15;
                    const y = isPlayer1 
                        ? row * CONFIG.BRICK_SPACING_Y + CONFIG.PLAYER1_BRICKS_START_Y
                        : CONFIG.CANVAS_HEIGHT - (row * CONFIG.BRICK_SPACING_Y + 58);
                    emptyPositions.push({ row, col, x, y });
                }
            }
        }
        
        return emptyPositions;
    }
    
    // 랜덤 벽돌 패턴 생성
    static generateRandomPattern() {
        const pattern = [];
        const totalPositions = CONFIG.BRICK_ROWS * CONFIG.BRICK_COLS;
        
        for (let i = 0; i < totalPositions; i++) {
            const hasBrick = Math.random() < CONFIG.BRICK_SPAWN_PROBABILITY;
            pattern.push(hasBrick);
        }
        
        // 최소 벽돌 수 보장
        const minBricks = Math.floor(totalPositions * CONFIG.BRICK_MIN_COVERAGE);
        const currentBricks = pattern.filter(Boolean).length;
        
        if (currentBricks < minBricks) {
            const emptyPositions = pattern.map((hasBrick, index) => hasBrick ? -1 : index).filter(index => index !== -1);
            const needToAdd = minBricks - currentBricks;
            
            for (let i = 0; i < needToAdd && emptyPositions.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                const position = emptyPositions.splice(randomIndex, 1)[0];
                pattern[position] = true;
            }
        }
        
        return pattern;
    }
}

// 전역 인스턴스
const brickGrid = new BrickGrid();
