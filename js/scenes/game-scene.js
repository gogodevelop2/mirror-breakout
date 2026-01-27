// js/scenes/game-scene.js
// Game scene - Wraps the main game logic

class GameScene extends BaseScene {
    constructor() {
        super('Game');

        // Game systems
        this.physics = null;
        this.game = null;
        this.renderer = null;

        // Local key state (used by scene-level handlers)
        this.keys = {};

        // Callbacks
        this.onGameOver = null;

        // Game over flag to prevent multiple callbacks
        this.gameOverTriggered = false;
    }

    onEnter(data) {
        super.onEnter(data);

        console.log('[GameScene] Initializing game systems...');

        // Clear background canvas (game renders its own background)
        if (this.bgCanvas) {
            const bgCtx = this.bgCanvas.getContext('2d');
            bgCtx.fillStyle = '#000';
            bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }

        // Reset game over flag
        this.gameOverTriggered = false;

        // Create physics engine
        this.physics = new PhysicsEngine();

        // Create game manager
        this.game = new GameManager(this.physics);

        // Create renderer (using injected canvas)
        this.renderer = new Renderer(this.canvas);

        // Initialize game
        this.game.init();

        // Start countdown
        this.game.startCountdown();

        console.log('[GameScene] Game started');
    }

    onExit() {
        super.onExit();

        // Calculate final score (승리 시에만)
        const finalScore = this.game.state.playerWon ? this.game.calculateFinalScore() : null;

        // Collect game results
        const results = {
            playerScore: this.game.score.player,
            aiScore: this.game.score.ai,
            gameTime: this.game.state.gameTime,
            playerWon: this.game.state.playerWon,
            finalScore: finalScore  // 최종 점수 정보 추가
        };

        // Clean up
        this.cleanup();

        console.log('[GameScene] Game ended', results);

        return results;
    }

    update(deltaTime) {
        if (!this.game) return;

        // Update game with InputManager keys
        this.game.keys = Input.keys;

        // Update based on game phase
        switch (this.game.state.phase) {
            case 'countdown':
                this.game.updateCountdown();
                break;

            case 'playing':
                this.game.update(deltaTime);
                break;

            case 'over':
                // Game ended - trigger callback once
                if (!this.gameOverTriggered) {
                    this.gameOverTriggered = true;  // Set flag FIRST
                    if (this.onGameOver) {
                        this.onGameOver();
                    }
                }
                break;
        }
    }

    render(ctx, alpha = 1.0) {
        if (!this.renderer || !this.physics || !this.game) return;

        // Use the game's renderer with interpolation
        this.renderer.render(this.physics, this.game, alpha);
    }

    handleKeyDown(event) {
        // ESC key to quit game immediately
        if (event.key === 'Escape') {
            console.log('[GameScene] ESC pressed - ending game');
            if (this.game && !this.gameOverTriggered) {
                this.gameOverTriggered = true;  // Set flag FIRST
                this.game.state.phase = 'over';
                // Don't set playerWon - let current scores determine winner
                if (this.onGameOver) {
                    this.onGameOver();
                }
            }
            return;
        }

        this.keys[event.key] = true;
        if (this.game) {
            this.game.keys[event.key] = true;
        }
    }

    handleKeyUp(event) {
        this.keys[event.key] = false;
        if (this.game) {
            this.game.keys[event.key] = false;
        }
    }

    handleResize() {
        if (!this.renderer || !this.game) return;

        // Update renderer
        this.renderer.resize();

        // Re-initialize game with new dimensions
        this.game.init();

        // Restart countdown
        this.game.startCountdown();
    }

    cleanup() {
        // Clear all game timers
        if (this.game && this.game.timers) {
            this.game.timers.forEach(timerId => clearTimeout(timerId));
            this.game.timers = [];
        }

        // Clear references
        this.physics = null;
        this.game = null;
        this.renderer = null;
    }

    destroy() {
        this.cleanup();
        super.destroy();
    }

    // Set callback for when game ends
    setGameOverCallback(callback) {
        this.onGameOver = callback;
    }
}
