// js/scenes/settings-scene.js
// Settings scene - Physics settings configuration

class SettingsScene extends BaseScene {
    constructor() {
        super('Settings');

        // Sliders configuration
        this.sliders = {
            ballMass: { label: 'Mass (질량)', min: 20, max: 160, value: 100, step: 5, unit: '', key: 'BALL.MASS' },
            ballSpeed: { label: 'Speed (속도)', min: 2.5, max: 5.0, value: 3.5, step: 0.1, unit: 'm/s', key: 'BALL.SPEED' },
            brickMass: { label: 'Mass (질량)', min: 500, max: 2000, value: 1000, step: 50, unit: '', key: 'BRICK.MASS' },
            brickRestitution: { label: 'Bounce (반발력)', min: 0.5, max: 1.0, value: 0.9, step: 0.05, unit: '', key: 'BRICK.RESTITUTION' },
            brickDamping: { label: 'Damping (감쇠)', min: 0, max: 1.0, value: 1.0, step: 0.1, unit: '', key: 'BRICK.LINEAR_DAMPING' }
        };

        // Buttons
        this.buttons = {
            back: {
                x: 0,
                y: 0,
                width: 180,
                height: 50,
                text: 'BACK TO MAIN',
                hovered: false
            },
            reset: {
                x: 0,
                y: 0,
                width: 200,
                height: 50,
                text: 'RESET',
                hovered: false
            }
        };

        // Dragging state
        this.draggingSlider = null;

        // Callbacks
        this.onBack = null;

        // Store default values
        this.defaults = {};
        Object.keys(this.sliders).forEach(key => {
            this.defaults[key] = this.sliders[key].value;
        });

        // Cached gradients
        this.thumbGradientCache = null;

        // Layout mode (determined by ResponsiveLayout)
        this.layoutMode = 'double'; // 'double' or 'single'
    }

    onEnter(data) {
        super.onEnter(data);

        // Render background to bgCanvas
        if (this.bgCanvas) {
            this.renderBackground();
        }

        // Load current CONFIG values
        this.sliders.ballMass.value = CONFIG.BALL.MASS;
        this.sliders.ballSpeed.value = CONFIG.BALL.SPEED;
        this.sliders.brickMass.value = CONFIG.BRICK.MASS;
        this.sliders.brickRestitution.value = CONFIG.BRICK.RESTITUTION;
        this.sliders.brickDamping.value = CONFIG.BRICK.LINEAR_DAMPING;

        this.updateLayout();
    }

    updateLayout() {
        this.updateButtonPositions();
        this.updateSliderBounds();
    }

    /**
     * Render background to bgCanvas
     */
    renderBackground() {
        if (!this.bgCanvas) return;

        const ctx = this.bgCanvas.getContext('2d');
        const width = this.bgCanvas.width;
        const height = this.bgCanvas.height;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    updateButtonPositions() {
        const layout = ResponsiveLayout.getLayoutInfo();

        // Responsive button sizes
        const backBtnSize = ResponsiveLayout.buttonSize(180, 50);
        const resetBtnSize = ResponsiveLayout.buttonSize(200, 50);
        const buttonSpacing = ResponsiveLayout.spacing(20);

        this.buttons.back.width = backBtnSize.width;
        this.buttons.back.height = backBtnSize.height;
        this.buttons.reset.width = resetBtnSize.width;
        this.buttons.reset.height = resetBtnSize.height;

        // Position buttons at bottom center
        const totalWidth = backBtnSize.width + buttonSpacing + resetBtnSize.width;
        const startX = (layout.width - totalWidth) / 2;
        const buttonY = layout.height - ResponsiveLayout.margin('bottom');

        this.buttons.back.x = startX;
        this.buttons.back.y = buttonY;
        this.buttons.reset.x = startX + backBtnSize.width + buttonSpacing;
        this.buttons.reset.y = buttonY;
    }

    updateSliderBounds() {
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;

        // Determine layout mode based on ResponsiveLayout size
        const size = ResponsiveLayout.getSize();
        this.layoutMode = (size === 'SMALL' || size === 'MEDIUM') ? 'single' : 'double';

        if (this.layoutMode === 'single') {
            this.updateSliderBoundsSingleColumn(width, height);
        } else {
            this.updateSliderBoundsDoubleColumn(width, height);
        }
    }

    updateSliderBoundsDoubleColumn(width, height) {
        const centerX = width / 2;
        const sliderKeys = Object.keys(this.sliders);
        const leftColumn = sliderKeys.slice(0, 2);  // Ball Mass, Speed
        const rightColumn = sliderKeys.slice(2);    // Brick Mass, Bounce, Damping

        let yPos = 140 + 35; // Title + section header
        const columnWidth = 230;
        const columnGap = 40;
        const leftX = centerX - columnWidth - (columnGap / 2);
        const rightX = centerX + (columnGap / 2);
        const sliderSpacing = 60;
        const sliderWidth = columnWidth - 60;
        const thumbRadius = 10;
        const sliderHeight = 4;

        // Ball section (left column)
        leftColumn.forEach(key => {
            const trackY = yPos + 18;
            this.sliders[key].bounds = {
                x: leftX,
                y: trackY - thumbRadius,
                width: sliderWidth,
                height: thumbRadius * 2 + sliderHeight
            };
            yPos += sliderSpacing;
        });

        // Brick section (right column)
        yPos = 140 + 35;
        rightColumn.forEach(key => {
            const trackY = yPos + 18;
            this.sliders[key].bounds = {
                x: rightX,
                y: trackY - thumbRadius,
                width: sliderWidth,
                height: thumbRadius * 2 + sliderHeight
            };
            yPos += sliderSpacing;
        });
    }

    updateSliderBoundsSingleColumn(width, height) {
        const centerX = width / 2;
        const sliderKeys = Object.keys(this.sliders);

        const titleHeight = 80; // Title + subtitle
        const sectionHeaderHeight = 25;
        const sliderSpacing = 45; // Tighter spacing for small screens
        const columnWidth = Math.min(width * 0.85, 280); // 85% width or max 280px
        const sliderWidth = columnWidth - 40;
        const thumbRadius = 10;
        const sliderHeight = 4;
        const x = centerX - columnWidth / 2;

        let yPos = titleHeight;

        // Ball section
        yPos += sectionHeaderHeight;
        sliderKeys.slice(0, 2).forEach(key => {
            const trackY = yPos + 18;
            this.sliders[key].bounds = {
                x: x,
                y: trackY - thumbRadius,
                width: sliderWidth,
                height: thumbRadius * 2 + sliderHeight
            };
            yPos += sliderSpacing;
        });

        // Brick section
        yPos += 10; // Gap between sections
        yPos += sectionHeaderHeight;
        sliderKeys.slice(2).forEach(key => {
            const trackY = yPos + 18;
            this.sliders[key].bounds = {
                x: x,
                y: trackY - thumbRadius,
                width: sliderWidth,
                height: thumbRadius * 2 + sliderHeight
            };
            yPos += sliderSpacing;
        });
    }

    update(deltaTime) {
        // No animation needed
    }

    render(ctx, alpha = 1.0) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        if (this.layoutMode === 'single') {
            this.renderSingleColumn(ctx, width, height);
        } else {
            this.renderDoubleColumn(ctx, width, height);
        }

        // Buttons
        this.renderButton(ctx, this.buttons.back);
        this.renderButton(ctx, this.buttons.reset);
    }

    renderDoubleColumn(ctx, width, height) {
        const centerX = width / 2;

        // Title - responsive
        ctx.fillStyle = '#4af';
        ctx.font = `bold ${ResponsiveLayout.fontSize(48)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PHYSICS SETTINGS', centerX, ResponsiveLayout.spacing(60));

        // Subtitle - responsive
        ctx.fillStyle = '#aaa';
        ctx.font = `${ResponsiveLayout.fontSize(16)}px Arial`;
        ctx.fillText('Adjust game physics in real-time', centerX, ResponsiveLayout.spacing(100));
        const sliderKeys = Object.keys(this.sliders);
        const leftColumn = sliderKeys.slice(0, 2);  // Ball Mass, Speed
        const rightColumn = sliderKeys.slice(2);    // Brick Mass, Bounce, Damping

        let yPos = 140;
        const columnWidth = 230;
        const columnGap = 40;
        const leftX = centerX - columnWidth - (columnGap / 2);
        const rightX = centerX + (columnGap / 2);
        const sliderSpacing = 60;

        // Ball section (left column)
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⚪ Ball', leftX, yPos);
        yPos += 35;

        leftColumn.forEach(key => {
            this.renderSlider(ctx, key, this.sliders[key], leftX, yPos, columnWidth);
            yPos += sliderSpacing;
        });

        // Brick section (right column)
        yPos = 140;
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🟦 Brick', rightX, yPos);
        yPos += 35;

        rightColumn.forEach(key => {
            this.renderSlider(ctx, key, this.sliders[key], rightX, yPos, columnWidth);
            yPos += sliderSpacing;
        });

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Changes apply immediately during gameplay', centerX, height - 110);
    }

    renderSingleColumn(ctx, width, height) {
        const centerX = width / 2;

        // Smaller title - responsive
        ctx.fillStyle = '#4af';
        ctx.font = `bold ${ResponsiveLayout.fontSize(32)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PHYSICS SETTINGS', centerX, ResponsiveLayout.spacing(40));

        // Smaller subtitle - responsive
        ctx.fillStyle = '#aaa';
        ctx.font = `${ResponsiveLayout.fontSize(13)}px Arial`;
        ctx.fillText('Adjust physics in real-time', centerX, ResponsiveLayout.spacing(65));

        const sliderKeys = Object.keys(this.sliders);
        const columnWidth = Math.min(width * 0.85, 280);
        const x = centerX - columnWidth / 2;
        const sliderSpacing = 45;

        let yPos = 80;

        // Ball section
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⚪ Ball', x, yPos);
        yPos += 25;

        sliderKeys.slice(0, 2).forEach(key => {
            this.renderSlider(ctx, key, this.sliders[key], x, yPos, columnWidth);
            yPos += sliderSpacing;
        });

        // Brick section
        yPos += 10;
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🟦 Brick', x, yPos);
        yPos += 25;

        sliderKeys.slice(2).forEach(key => {
            this.renderSlider(ctx, key, this.sliders[key], x, yPos, columnWidth);
            yPos += sliderSpacing;
        });

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Changes apply immediately', centerX, height - 90);
    }

    renderSlider(ctx, key, slider, x, y, width) {
        const sliderWidth = width - 60;
        const sliderHeight = 4;
        const thumbRadius = 10;

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(slider.label, x, y);

        // Value
        const displayValue = slider.value.toFixed(slider.step < 1 ? 2 : 0);
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${displayValue}${slider.unit}`, x + width, y);

        // Slider track
        const trackY = y + 18;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, trackY, sliderWidth, sliderHeight);

        // Slider fill
        const ratio = (slider.value - slider.min) / (slider.max - slider.min);
        ctx.fillStyle = '#4af';
        ctx.fillRect(x, trackY, sliderWidth * ratio, sliderHeight);

        // Slider thumb
        const thumbX = x + sliderWidth * ratio;
        const thumbY = trackY + sliderHeight / 2;

        // Thumb shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(thumbX + 2, thumbY + 2, thumbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Thumb with cached gradient
        if (!this.thumbGradientCache) {
            this.thumbGradientCache = ctx.createRadialGradient(0, 0, 0, 0, 0, thumbRadius);
            this.thumbGradientCache.addColorStop(0, '#6cf');
            this.thumbGradientCache.addColorStop(1, '#4af');
        }

        ctx.save();
        ctx.translate(thumbX, thumbY);
        ctx.fillStyle = this.thumbGradientCache;
        ctx.beginPath();
        ctx.arc(0, 0, thumbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Thumb border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    handleClick(x, y) {
        // Check BACK button
        const back = this.buttons.back;
        if (x >= back.x && x <= back.x + back.width &&
            y >= back.y && y <= back.y + back.height) {
            if (this.onBack) {
                this.onBack();
            }
            return;
        }

        // Check RESET button
        const reset = this.buttons.reset;
        if (x >= reset.x && x <= reset.x + reset.width &&
            y >= reset.y && y <= reset.y + reset.height) {
            this.resetToDefaults();
            return;
        }
    }

    handleMouseDown(x, y) {
        // Check sliders - start dragging
        for (const key of Object.keys(this.sliders)) {
            const slider = this.sliders[key];
            if (slider.bounds &&
                x >= slider.bounds.x && x <= slider.bounds.x + slider.bounds.width &&
                y >= slider.bounds.y && y <= slider.bounds.y + slider.bounds.height) {
                this.draggingSlider = key;
                this.updateSliderValue(key, x);
                return; // Early exit after finding match
            }
        }
    }

    handleMouseMove(x, y) {
        // Update dragging slider
        if (this.draggingSlider) {
            this.updateSliderValue(this.draggingSlider, x);
        }

        // Update button hover states using BaseScene method
        this.updateButtonHover(x, y);
    }

    handleMouseUp() {
        this.draggingSlider = null;
    }

    updateSliderValue(key, mouseX) {
        const slider = this.sliders[key];
        if (!slider.bounds) return;

        // Calculate new value (ratio is already clamped 0-1)
        const ratio = Math.max(0, Math.min(1, (mouseX - slider.bounds.x) / slider.bounds.width));
        const rawValue = slider.min + ratio * (slider.max - slider.min);
        slider.value = Math.round(rawValue / slider.step) * slider.step;

        // Apply to CONFIG
        this.applySliderToConfig(key, slider.value);
    }

    applySliderToConfig(key, value) {
        const keyPath = this.sliders[key].key.split('.');

        if (keyPath.length === 2) {
            CONFIG[keyPath[0]][keyPath[1]] = value;
            // Console logging removed for performance (called every frame during drag)
        }
    }

    resetToDefaults() {
        Object.keys(this.sliders).forEach(key => {
            this.sliders[key].value = this.defaults[key];
            this.applySliderToConfig(key, this.defaults[key]);
        });
    }

    handleResize() {
        this.updateLayout();
    }

    // Set callback for back button
    setBackCallback(callback) {
        this.onBack = callback;
    }
}
