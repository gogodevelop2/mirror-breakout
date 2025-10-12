// js/main.js
// Mirror Breakout - Scene-based Main Entry Point

class MirrorBreakout {
    constructor() {
        this.canvas = null;
        this.bgCanvas = null;
        this.sceneManager = null;
        this.uiControls = null;

        // Scenes
        this.menuScene = null;
        this.gameScene = null;
        this.gameOverScene = null;
        this.settingsScene = null;
    }

    // Initialize the game
    init() {
        // Get canvases
        this.canvas = document.getElementById('gameCanvas');
        this.bgCanvas = document.getElementById('bgCanvas');

        if (!this.canvas) {
            console.error('gameCanvas element not found');
            return;
        }

        if (!this.bgCanvas) {
            console.error('bgCanvas element not found');
            return;
        }

        // Create scene manager with both canvases
        this.sceneManager = new SceneManager(this.canvas, this.bgCanvas);

        // Create scenes
        this.createScenes();

        // Setup scene callbacks
        this.setupSceneCallbacks();

        // Register scenes
        this.sceneManager.registerScene('menu', this.menuScene);
        this.sceneManager.registerScene('game', this.gameScene);
        this.sceneManager.registerScene('gameover', this.gameOverScene);
        this.sceneManager.registerScene('settings', this.settingsScene);

        // Setup UI controls (physics settings panel)
        // Note: UIControls will be initialized when game scene starts
        // because it needs physics engine reference

        // Start with menu scene
        this.sceneManager.switchTo('menu');

        console.log('[MirrorBreakout] Initialized with Scene system');
    }

    // Create all scenes
    createScenes() {
        this.menuScene = new MenuScene();
        this.gameScene = new GameScene();
        this.gameOverScene = new GameOverScene();
        this.settingsScene = new SettingsScene();
    }

    // Setup scene transition callbacks
    setupSceneCallbacks() {
        // Menu -> Game
        this.menuScene.setStartGameCallback(() => {
            console.log('[MirrorBreakout] Starting game...');
            this.sceneManager.switchTo('game');

            // Initialize UI controls when game starts
            if (!this.uiControls && this.gameScene.physics) {
                this.uiControls = new UIControls(CONFIG, this.gameScene.physics);
            }
        });

        // Menu -> Settings
        this.menuScene.setSettingsCallback(() => {
            console.log('[MirrorBreakout] Opening settings...');
            this.sceneManager.switchTo('settings');
        });

        // Game -> GameOver
        this.gameScene.setGameOverCallback(() => {
            console.log('[MirrorBreakout] Game over');
            this.sceneManager.switchTo('gameover');
        });

        // GameOver -> Game (Retry)
        this.gameOverScene.setRetryCallback(() => {
            console.log('[MirrorBreakout] Retrying game...');
            this.sceneManager.switchTo('game');

            // Re-initialize UI controls for new game
            if (this.gameScene.physics) {
                if (this.uiControls) {
                    this.uiControls.destroy();
                    this.uiControls = new UIControls(CONFIG, this.gameScene.physics);
                }
            }
        });

        // GameOver -> Menu
        this.gameOverScene.setMenuCallback(() => {
            console.log('[MirrorBreakout] Returning to menu...');
            this.sceneManager.switchTo('menu');
        });

        // Settings -> Menu (Back button)
        this.settingsScene.setBackCallback(() => {
            console.log('[MirrorBreakout] Back to menu...');
            this.sceneManager.switchTo('menu');
        });
    }

    // Clean up resources
    destroy() {
        if (this.sceneManager) {
            this.sceneManager.destroy();
        }
        if (this.uiControls) {
            this.uiControls.destroy();
            this.uiControls = null;
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
        typeof Renderer === 'undefined' ||
        typeof UIControls === 'undefined' ||
        typeof BaseScene === 'undefined' ||
        typeof SceneManager === 'undefined' ||
        typeof MenuScene === 'undefined' ||
        typeof GameScene === 'undefined' ||
        typeof GameOverScene === 'undefined' ||
        typeof SettingsScene === 'undefined') {
        console.error('Required game modules not loaded');
        console.log('Check browser console for missing scripts');
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
