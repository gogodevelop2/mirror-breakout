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
     * @param {number} alpha - Interpolation alpha (0-1) for smooth rendering
     */
    render(ctx, alpha = 1.0) {
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
     * Update layout based on responsive system
     * Override this in subclass to calculate responsive positions/sizes
     */
    updateLayout() {
        // Override in subclass
        // Use ResponsiveLayout methods to calculate positions
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Call updateLayout by default
        this.updateLayout();
    }

    /**
     * Render a button (common UI component)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} button - Button object with x, y, width, height, text, hovered
     */
    renderButton(ctx, button) {
        // Responsive values
        const shadowOffset = Math.max(2, ResponsiveLayout.spacing(4));
        const borderWidth = ResponsiveLayout.borderWidth(3);
        const fontSize = ResponsiveLayout.fontSize(20);

        // Button shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            button.x + shadowOffset,
            button.y + shadowOffset,
            button.width,
            button.height
        );

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
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = button.hovered
            ? `bold ${fontSize + 2}px Arial`
            : `bold ${fontSize}px Arial`;
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
