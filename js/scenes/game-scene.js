// js/scenes/game-scene.js
// Game scene - Wraps the main game logic

class GameScene extends BaseScene {
    constructor() {
        super('Game');

        // Game systems
        this.physics = null;
        this.game = null;
        this.renderer = null;

        // Input state
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

        // Override GameManager's input handling
        this.setupInput();

        // Initialize game
        this.game.init();

        // Start countdown
        this.game.startCountdown();

        console.log('[GameScene] Game started');
    }

    onExit() {
        super.onExit();

        // Collect game results
        const results = {
            playerScore: this.game.score.player,
            aiScore: this.game.score.ai,
            gameTime: this.game.state.gameTime,
            playerWon: this.game.state.playerWon
        };

        // Clean up
        this.cleanup();

        console.log('[GameScene] Game ended', results);

        return results;
    }

    setupInput() {
        // Remove GameManager's default input listeners
        // and use our own that we can clean up properly

        const handleKeyDown = (e) => {
            this.keys[e.key] = true;
            // Pass to game
            if (this.game) {
                this.game.keys[e.key] = true;
            }
        };

        const handleKeyUp = (e) => {
            this.keys[e.key] = false;
            // Pass to game
            if (this.game) {
                this.game.keys[e.key] = false;
            }
        };

        // Store handlers for cleanup
        this._handleKeyDown = handleKeyDown;
        this._handleKeyUp = handleKeyUp;

        window.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('keyup', this._handleKeyUp);
    }

    update(deltaTime) {
        if (!this.game) return;

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

    render(ctx) {
        if (!this.renderer || !this.physics || !this.game) return;

        // Use the game's renderer
        this.renderer.render(this.physics, this.game);
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

        // Remove event listeners
        if (this._handleKeyDown) {
            window.removeEventListener('keydown', this._handleKeyDown);
        }
        if (this._handleKeyUp) {
            window.removeEventListener('keyup', this._handleKeyUp);
        }

        // Clear references
        this.physics = null;
        this.game = null;
        this.renderer = null;
        this.keys = {};
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
