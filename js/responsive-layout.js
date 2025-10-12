// js/responsive-layout.js
// Centralized responsive layout system for all scenes

/**
 * ResponsiveLayout - Singleton class for managing responsive UI across all scenes
 *
 * Key features:
 * - Breakpoint-based sizing (SMALL, MEDIUM, LARGE, XLARGE)
 * - Scale-based calculations for smooth transitions
 * - Consistent spacing, fonts, and margins
 * - Widget size calculations
 *
 * Usage:
 *   const fontSize = ResponsiveLayout.fontSize(20);
 *   const spacing = ResponsiveLayout.spacing(60);
 *   const btnSize = ResponsiveLayout.buttonSize(180, 60);
 */
class ResponsiveLayout {
    /**
     * Breakpoints (px)
     */
    static breakpoints = {
        SMALL: 300,   // Very small screens
        MEDIUM: 500,  // Mobile
        LARGE: 700    // Tablet / Desktop
    };

    /**
     * Get current size category based on canvas width
     * @returns {'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE'}
     */
    static getSize() {
        const width = CONFIG.CANVAS_WIDTH;
        if (width < this.breakpoints.SMALL) return 'SMALL';
        if (width < this.breakpoints.MEDIUM) return 'MEDIUM';
        if (width < this.breakpoints.LARGE) return 'LARGE';
        return 'XLARGE';
    }

    /**
     * Get scale factor based on canvas width
     * Returns value between 0.4 and 1.2 (더 작은 화면 지원)
     * @param {number} baseWidth - Base reference width (default: 600)
     * @returns {number} Scale factor
     */
    static getScale(baseWidth = 600) {
        const width = CONFIG.CANVAS_WIDTH;
        return Math.max(0.4, Math.min(1.2, width / baseWidth));
    }

    /**
     * Get responsive font size
     * @param {number} base - Base font size in pixels
     * @returns {number} Scaled font size
     */
    static fontSize(base) {
        const size = this.getSize();
        const multipliers = {
            SMALL: 0.5,   // 더 작게 (0.65 -> 0.5)
            MEDIUM: 0.75, // 더 작게 (0.85 -> 0.75)
            LARGE: 1.0,
            XLARGE: 1.1
        };
        return Math.floor(base * multipliers[size]);
    }

    /**
     * Get responsive spacing/gap
     * @param {number} base - Base spacing in pixels
     * @returns {number} Scaled spacing
     */
    static spacing(base) {
        const scale = this.getScale();
        return Math.floor(base * scale);
    }

    /**
     * Get responsive button size
     * @param {number} baseWidth - Base button width
     * @param {number} baseHeight - Base button height
     * @returns {{width: number, height: number}}
     */
    static buttonSize(baseWidth, baseHeight) {
        const scale = this.getScale();
        return {
            width: Math.floor(baseWidth * scale),
            height: Math.floor(baseHeight * scale)
        };
    }

    /**
     * Get responsive widget size (scoreboard, panels, etc.)
     * Widget scales with canvas width but has min/max bounds
     * @param {number} baseWidth - Base widget width
     * @param {number} minRatio - Minimum width ratio (default: 0.5)
     * @param {number} maxRatio - Maximum width ratio (default: 0.8)
     * @returns {number} Widget width
     */
    static widgetSize(baseWidth, minRatio = 0.5, maxRatio = 0.8) {
        const width = CONFIG.CANVAS_WIDTH;
        const minWidth = baseWidth * minRatio;
        const maxWidth = baseWidth;
        const targetWidth = width * maxRatio;

        return Math.floor(Math.max(minWidth, Math.min(maxWidth, targetWidth)));
    }

    /**
     * Get responsive margin
     * @param {'top' | 'bottom' | 'side'} type - Margin type
     * @returns {number} Margin in pixels
     */
    static margin(type) {
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;

        const margins = {
            top: Math.max(20, height * 0.05),
            bottom: Math.max(40, height * 0.1),
            side: Math.max(10, width * 0.05)
        };

        return Math.floor(margins[type] || 20);
    }

    /**
     * Get responsive padding
     * @param {number} base - Base padding
     * @returns {number} Scaled padding
     */
    static padding(base) {
        return this.spacing(base);
    }

    /**
     * Get responsive border width
     * @param {number} base - Base border width (default: 3)
     * @returns {number} Scaled border width
     */
    static borderWidth(base = 3) {
        const scale = this.getScale();
        return Math.max(1, Math.floor(base * scale));
    }

    /**
     * Calculate vertical position based on ratio
     * @param {number} ratio - Ratio of canvas height (0-1)
     * @returns {number} Y position
     */
    static verticalPosition(ratio) {
        return Math.floor(CONFIG.CANVAS_HEIGHT * ratio);
    }

    /**
     * Calculate horizontal position based on ratio
     * @param {number} ratio - Ratio of canvas width (0-1)
     * @returns {number} X position
     */
    static horizontalPosition(ratio) {
        return Math.floor(CONFIG.CANVAS_WIDTH * ratio);
    }

    /**
     * Get layout info object with common responsive values
     * Useful for Scene initialization
     * @returns {Object} Layout info
     */
    static getLayoutInfo() {
        return {
            size: this.getSize(),
            scale: this.getScale(),
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            centerX: Math.floor(CONFIG.CANVAS_WIDTH / 2),
            centerY: Math.floor(CONFIG.CANVAS_HEIGHT / 2),
            margin: {
                top: this.margin('top'),
                bottom: this.margin('bottom'),
                side: this.margin('side')
            }
        };
    }

    /**
     * Debug method - log current responsive state
     */
    static logState() {
        const info = this.getLayoutInfo();
        console.log('[ResponsiveLayout] State:', {
            size: info.size,
            scale: info.scale.toFixed(2),
            canvas: `${info.width}x${info.height}`,
            fontSize: {
                base20: this.fontSize(20),
                base48: this.fontSize(48),
                base72: this.fontSize(72)
            },
            spacing: {
                base20: this.spacing(20),
                base60: this.spacing(60),
                base150: this.spacing(150)
            },
            button: this.buttonSize(180, 60)
        });
    }
}
