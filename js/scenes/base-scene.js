// js/scenes/base-scene.js
// Base class for all game scenes

class BaseScene {
    constructor(name) {
        this.name = name;
        this.isActive = false;
        this.canvas = null;    // Main canvas reference (injected by SceneManager)
        this.bgCanvas = null;  // Background canvas reference (optional, for layer separation)
    }

    /**
     * Set canvas reference (called by SceneManager)
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    setCanvas(canvas) {
        this.canvas = canvas;
    }

    /**
     * Set background canvas reference (called by SceneManager)
     * @param {HTMLCanvasElement} bgCanvas - Background canvas element
     */
    setBgCanvas(bgCanvas) {
        this.bgCanvas = bgCanvas;
    }

    /**
     * Called when entering this scene
     * @param {Object} data - Data passed from previous scene
     */
    onEnter(data = {}) {
        this.isActive = true;
        console.log(`[Scene] Entering: ${this.name}`, data);
    }

    /**
     * Called when exiting this scene
     * @returns {Object} Data to pass to next scene
     */
    onExit() {
        this.isActive = false;
        console.log(`[Scene] Exiting: ${this.name}`);
        return {};
    }

    /**
     * Update scene logic
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Override in subclass
    }

    /**
     * Render scene to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        // Override in subclass
    }

    /**
     * Handle mouse/touch click events
     * @param {number} x - Click x coordinate
     * @param {number} y - Click y coordinate
     */
    handleClick(x, y) {
        // Override in subclass
    }

    /**
     * Handle mouse move events
     * @param {number} x - Mouse x coordinate
     * @param {number} y - Mouse y coordinate
     */
    handleMouseMove(x, y) {
        // Override in subclass
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp() {
        // Override in subclass
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        // Override in subclass
    }

    handleKeyUp(event) {
        // Override in subclass
    }

    /**
     * Check if mouse is hovering over a button and return hover state
     * @param {number} x - Mouse x coordinate
     * @param {number} y - Mouse y coordinate
     * @returns {boolean} True if hovering over any button
     */
    updateButtonHover(x, y) {
        if (!this.buttons) return false;

        let isHovering = false;

        Object.values(this.buttons).forEach(button => {
            button.hovered = (
                x >= button.x &&
                x <= button.x + button.width &&
                y >= button.y &&
                y <= button.y + button.height
            );
            if (button.hovered) isHovering = true;
        });

        return isHovering;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Override in subclass
    }

    /**
     * Auto-layout buttons with common patterns
     * @param {string} layout - Layout type: 'vertical-center', 'horizontal-center', 'horizontal-bottom'
     * @param {Object} options - Layout options { startY, spacing, gap }
     */
    autoLayoutButtons(layout = 'vertical-center', options = {}) {
        if (!this.canvas || !this.buttons) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const height = this.canvas.height;

        const buttons = Object.values(this.buttons);
        const defaultSpacing = CONFIG.UI_LAYOUT.BUTTON.VERTICAL_SPACING;
        const defaultGap = CONFIG.UI_LAYOUT.BUTTON.HORIZONTAL_GAP;

        switch (layout) {
            case 'vertical-center':
                // Vertical stack, centered horizontally and vertically
                const startY = options.startY || (centerY + CONFIG.UI_LAYOUT.MENU.BUTTON_START_Y_OFFSET);
                const spacing = options.spacing || defaultSpacing;

                buttons.forEach((btn, i) => {
                    btn.x = centerX - btn.width / 2;
                    btn.y = startY + (i * spacing);
                });
                break;

            case 'horizontal-center':
                // Horizontal row, centered both ways
                const totalWidth = buttons.reduce((sum, btn) => sum + btn.width, 0) +
                                  (buttons.length - 1) * (options.gap || defaultGap);
                const startX = centerX - totalWidth / 2;
                const posY = options.startY || (centerY + CONFIG.UI_LAYOUT.GAMEOVER.BUTTON_Y_OFFSET);

                let currentX = startX;
                buttons.forEach((btn) => {
                    btn.x = currentX;
                    btn.y = posY;
                    currentX += btn.width + (options.gap || defaultGap);
                });
                break;

            case 'horizontal-bottom':
                // Horizontal row at bottom of screen
                const gap = options.gap || defaultGap;
                const bottomY = options.bottomY || (height - CONFIG.UI_LAYOUT.SETTINGS.BUTTON_BOTTOM_MARGIN);

                // Calculate total width
                const total = buttons.reduce((sum, btn) => sum + btn.width, 0) +
                             (buttons.length - 1) * gap;
                let x = centerX - total / 2;

                buttons.forEach((btn) => {
                    btn.x = x;
                    btn.y = bottomY;
                    x += btn.width + gap;
                });
                break;

            default:
                console.warn(`[BaseScene] Unknown layout: ${layout}`);
        }
    }

    /**
     * Render a button (common UI component)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} button - Button object with x, y, width, height, text, hovered
     */
    renderButton(ctx, button) {
        // Button shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(button.x + 4, button.y + 4, button.width, button.height);

        // Button background
        if (button.hovered) {
            const gradient = ctx.createLinearGradient(
                button.x, button.y,
                button.x, button.y + button.height
            );
            gradient.addColorStop(0, '#5bf');
            gradient.addColorStop(1, '#4af');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#4af';
        }

        ctx.fillRect(button.x, button.y, button.width, button.height);

        // Button border
        ctx.strokeStyle = button.hovered ? '#fff' : '#6cf';
        ctx.lineWidth = 3;
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = button.hovered ? 'bold 22px Arial' : 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            button.text,
            button.x + button.width / 2,
            button.y + button.height / 2
        );
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.isActive = false;
        console.log(`[Scene] Destroyed: ${this.name}`);
    }
}
