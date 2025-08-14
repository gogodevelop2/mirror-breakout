// js/main.js
// Mirror Breakout - Main Entry Point

class MirrorBreakout {
    constructor() {
        this.canvas = null;
        this.physics = null;
        this.game = null;
        this.renderer = null;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.button = null;
    }
    
    // Initialize the game
    init() {
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        // Get button
        this.button = document.getElementById('gameButton');
        if (!this.button) {
            console.error('Button element not found');
            return;
        }
        
        // Create game systems
        this.physics = new PhysicsEngine();
        this.game = new GameManager(this.physics);
        this.renderer = new Renderer(this.canvas);
        
        // Initialize game
        this.game.init();
        
        // Initial render
        this.renderer.render(this.physics, this.game);
        
        // Setup button handler
        this.button.onclick = () => this.toggleGame();
    }
    
    // Toggle game state
    toggleGame() {
        switch (this.game.state.phase) {
            case 'menu':
                this.startGame();
                break;
                
            case 'countdown':
            case 'playing':
                this.stopGame();
                break;
                
            case 'over':
                this.resetGame();
                break;
        }
        
        this.updateButton();
    }
    
    // Start new game
    startGame() {
        // Reset and initialize
        this.game.init();
        
        // Start countdown
        this.game.startCountdown();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    // Stop current game
    stopGame() {
        // Cancel animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Set game to over state
        this.game.state.phase = 'over';
        this.game.state.playerWon = false;
        
        // Final render
        this.renderer.render(this.physics, this.game);
    }
    
    // Reset for new game
    resetGame() {
        // Cancel any running animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Initialize fresh game
        this.game.init();
        
        // Render initial state
        this.renderer.render(this.physics, this.game);
    }
    
    // Main game loop
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update based on phase
        switch (this.game.state.phase) {
            case 'countdown':
                this.game.updateCountdown();
                break;
                
            case 'playing':
                this.game.update(deltaTime);
                break;
        }
        
        // Render
        this.renderer.render(this.physics, this.game);
        
        // Continue loop if not game over
        if (this.game.state.phase !== 'over') {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        } else {
            // Game ended naturally
            this.updateButton();
        }
    }
    
    // Update button text
    updateButton() {
        if (!this.button) return;
        
        switch (this.game.state.phase) {
            case 'menu':
                this.button.textContent = 'START';
                break;
                
            case 'countdown':
            case 'playing':
                this.button.textContent = 'STOP';
                break;
                
            case 'over':
                this.button.textContent = 'RETRY';
                break;
        }
    }
}

// Global game instance
let mirrorBreakout = null;

// Initialize when DOM is ready
function initGame() {
    // Check if Planck.js is loaded
    if (typeof planck === 'undefined') {
        console.error('Planck.js not loaded');
        return;
    }
    
    // Check if all required classes are loaded
    if (typeof PhysicsEngine === 'undefined' ||
        typeof GameManager === 'undefined' ||
        typeof Renderer === 'undefined') {
        console.error('Required game modules not loaded');
        return;
    }
    
    // Create and initialize game
    mirrorBreakout = new MirrorBreakout();
    mirrorBreakout.init();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM already loaded
    initGame();
}

// Export for debugging
window.MirrorBreakout = MirrorBreakout;
window.mirrorBreakout = mirrorBreakout;