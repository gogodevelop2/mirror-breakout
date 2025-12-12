// js/scenes/scene-manager.js
// Manages scene transitions and lifecycle

class SceneManager {
    constructor(canvas, bgCanvas = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Background canvas (optional, for layer separation)
        this.bgCanvas = bgCanvas;
        this.bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;

        // Initialize canvas sizes
        this.initializeCanvasSize();

        // Scene registry
        this.scenes = {};
        this.currentScene = null;
        this.currentSceneName = null;

        // Animation loop
        this.animationId = null;
        this.lastTime = 0;
        this.isRunning = false;

        // Event handlers (bound to this instance)
        this.boundHandleClick = this.handleClick.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleResize = this.handleResize.bind(this);

        // Resize debounce timer
        this.resizeTimeout = null;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize canvas size from CONFIG
     */
    initializeCanvasSize() {
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Also initialize background canvas if it exists
        if (this.bgCanvas) {
            this.bgCanvas.width = CONFIG.CANVAS_WIDTH;
            this.bgCanvas.height = CONFIG.CANVAS_HEIGHT;
        }
    }

    /**
     * Register a scene
     * @param {string} name - Scene name
     * @param {BaseScene} scene - Scene instance
     */
    registerScene(name, scene) {
        scene.setCanvas(this.canvas);  // Inject main canvas reference

        // Inject background canvas if available
        if (this.bgCanvas && scene.setBgCanvas) {
            scene.setBgCanvas(this.bgCanvas);
        }

        this.scenes[name] = scene;
        console.log(`[SceneManager] Registered scene: ${name}`);
    }

    /**
     * Switch to a different scene
     * @param {string} sceneName - Name of scene to switch to
     * @param {Object} data - Data to pass to new scene
     */
    switchTo(sceneName, data = {}) {
        // Validate scene exists
        if (!this.scenes[sceneName]) {
            console.error(`[SceneManager] Scene not found: ${sceneName}`);
            return;
        }

        // Exit current scene
        let transitionData = data;
        if (this.currentScene) {
            transitionData = { ...transitionData, ...this.currentScene.onExit() };
        }

        // Enter new scene
        this.currentSceneName = sceneName;
        this.currentScene = this.scenes[sceneName];
        this.currentScene.onEnter(transitionData);

        console.log(`[SceneManager] Switched to: ${sceneName}`);

        // Start loop if not running
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;  // Initialize fixed timestep accumulator
        this.gameLoop();
        console.log('[SceneManager] Started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('[SceneManager] Stopped');
    }

    /**
     * Main game loop (Fixed Timestep)
     *
     * Uses accumulator pattern to ensure consistent game speed
     * regardless of monitor refresh rate (60Hz, 144Hz, 240Hz, etc.)
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Actual elapsed time in seconds
        this.lastTime = currentTime;

        // Accumulate elapsed time
        this.accumulator += deltaTime;

        // Cap accumulator to prevent spiral of death
        // (e.g., if browser tab was inactive for a long time)
        const maxAccumulator = CONFIG.TIMESTEP * 10; // Max 10 frames worth
        if (this.accumulator > maxAccumulator) {
            this.accumulator = maxAccumulator;
        }

        // Update with fixed timestep
        // May run multiple times (low FPS) or skip frames (high FPS)
        while (this.accumulator >= CONFIG.TIMESTEP) {
            if (this.currentScene && this.currentScene.isActive) {
                // Always use fixed timestep for deterministic simulation
                this.currentScene.update(CONFIG.TIMESTEP);
            }
            this.accumulator -= CONFIG.TIMESTEP;
        }

        // Render current scene (can run at variable framerate)
        if (this.currentScene && this.currentScene.isActive) {
            // Clear main canvas (transparent to show bgCanvas below)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Render scene (foreground elements only)
            this.currentScene.render(this.ctx);
        }

        // Continue loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas click events
        this.canvas.addEventListener('click', this.boundHandleClick);

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
        this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);

        // Mouse up on window to catch releases outside canvas
        window.addEventListener('mouseup', this.boundHandleMouseUp);

        // Initialize InputManager and subscribe to keyboard events
        Input.init(this.canvas);
        Input.subscribe('keydown', (e) => this.handleKeyDown(e));
        Input.subscribe('keyup', (e) => this.handleKeyUp(e));

        // Window resize (with debounce)
        this.boundHandleResizeDebounced = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(this.boundHandleResize, 200);
        };
        window.addEventListener('resize', this.boundHandleResizeDebounced);
    }

    /**
     * Handle click events
     */
    handleClick(event) {
        if (!this.currentScene) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.currentScene.handleClick(x, y);
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(event) {
        if (!this.currentScene) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.currentScene.handleMouseDown) {
            this.currentScene.handleMouseDown(x, y);
        }
    }

    /**
     * Handle mouse move events
     */
    handleMouseMove(event) {
        if (!this.currentScene) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Let scene handle mouse move
        if (this.currentScene.handleMouseMove) {
            this.currentScene.handleMouseMove(x, y);
        }

        // Update cursor based on button hover state
        const isHovering = this.currentScene.buttons &&
                          Object.values(this.currentScene.buttons).some(btn => btn.hovered);
        this.canvas.style.cursor = isHovering ? 'pointer' : 'default';
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp(event) {
        if (!this.currentScene) return;

        if (this.currentScene.handleMouseUp) {
            this.currentScene.handleMouseUp();
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (!this.currentScene) return;
        this.currentScene.handleKeyDown(event);
    }

    handleKeyUp(event) {
        if (!this.currentScene) return;
        this.currentScene.handleKeyUp(event);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update CONFIG canvas size
        CONFIG.updateCanvasSize();

        // Update canvas elements
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        if (this.bgCanvas) {
            this.bgCanvas.width = CONFIG.CANVAS_WIDTH;
            this.bgCanvas.height = CONFIG.CANVAS_HEIGHT;
        }

        // Notify current scene
        if (this.currentScene) {
            this.currentScene.handleResize();
        }

        console.log('[SceneManager] Resized:', CONFIG.CANVAS_WIDTH, 'x', CONFIG.CANVAS_HEIGHT);
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Stop loop
        this.stop();

        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        // Remove event listeners
        this.canvas.removeEventListener('click', this.boundHandleClick);
        this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
        this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
        window.removeEventListener('mouseup', this.boundHandleMouseUp);
        window.removeEventListener('resize', this.boundHandleResizeDebounced);

        // InputManager cleanup is handled globally, not per-scene

        // Destroy all scenes
        Object.values(this.scenes).forEach(scene => scene.destroy());
        this.scenes = {};
        this.currentScene = null;

        console.log('[SceneManager] Destroyed');
    }
}
