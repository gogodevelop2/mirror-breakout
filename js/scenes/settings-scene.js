// js/scenes/settings-scene.js
// Settings scene - Physics settings configuration

class SettingsScene extends BaseScene {
    constructor() {
        super('Settings');

        // Sliders configuration
        this.sliders = {
            ballMass: { label: 'Mass', min: 20, max: 160, value: 100, step: 5, unit: '', key: 'BALL.MASS' },
            ballSpeed: { label: 'Speed', min: 2.5, max: 5.0, value: 3.5, step: 0.1, unit: 'm/s', key: 'BALL.SPEED' },
            brickMass: { label: 'Mass', min: 500, max: 2000, value: 1000, step: 50, unit: '', key: 'BRICK.MASS' },
            brickRestitution: { label: 'Bounce', min: 0.5, max: 1.0, value: 0.9, step: 0.05, unit: '', key: 'BRICK.RESTITUTION' },
            brickFriction: { label: 'Friction', min: 0, max: 0.8, value: 0.3, step: 0.05, unit: '', key: 'BRICK.FRICTION' },
            brickDamping: { label: 'Damping', min: 0.5, max: 2.0, value: 1.0, step: 0.1, unit: '', key: 'BRICK.LINEAR_DAMPING' }
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
        this.sliders.brickFriction.value = CONFIG.BRICK.FRICTION;
        this.sliders.brickDamping.value = CONFIG.BRICK.LINEAR_DAMPING;

        this.updateButtonPositions();
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
        // Use auto-layout for horizontal-bottom pattern
        this.autoLayoutButtons('horizontal-bottom');
    }

    update(deltaTime) {
        // No animation needed
    }

    render(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const centerX = width / 2;

        // Background is now rendered to bgCanvas in renderBackground()

        // Title
        ctx.fillStyle = '#4af';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PHYSICS SETTINGS', centerX, 60);

        // Subtitle
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText('Adjust game physics in real-time', centerX, 100);

        // Render sliders in two columns
        const sliderKeys = Object.keys(this.sliders);
        const leftColumn = sliderKeys.slice(0, 2);   // Ball: Mass, Speed
        const rightColumn = sliderKeys.slice(2);     // Brick: Mass, Bounce, Friction, Damping

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

        // Buttons
        this.renderButton(ctx, this.buttons.back);
        this.renderButton(ctx, this.buttons.reset);

        // Footer (moved up to avoid button overlap)
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Changes apply immediately during gameplay', centerX, height - 110);
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

        // Thumb
        const gradient = ctx.createRadialGradient(thumbX, thumbY, 0, thumbX, thumbY, thumbRadius);
        gradient.addColorStop(0, '#6cf');
        gradient.addColorStop(1, '#4af');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(thumbX, thumbY, thumbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Thumb border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Store bounds for interaction
        slider.bounds = { x, y: trackY - thumbRadius, width: sliderWidth, height: thumbRadius * 2 + sliderHeight };
    }

    handleClick(x, y) {
        // Check BACK button
        const back = this.buttons.back;
        if (x >= back.x && x <= back.x + back.width &&
            y >= back.y && y <= back.y + back.height) {
            console.log('[SettingsScene] BACK clicked');
            if (this.onBack) {
                this.onBack();
            }
            return;
        }

        // Check RESET button
        const reset = this.buttons.reset;
        if (x >= reset.x && x <= reset.x + reset.width &&
            y >= reset.y && y <= reset.y + reset.height) {
            console.log('[SettingsScene] RESET clicked');
            this.resetToDefaults();
            return;
        }

        // Check sliders - start dragging
        Object.keys(this.sliders).forEach(key => {
            const slider = this.sliders[key];
            if (slider.bounds &&
                x >= slider.bounds.x && x <= slider.bounds.x + slider.bounds.width &&
                y >= slider.bounds.y && y <= slider.bounds.y + slider.bounds.height) {
                this.draggingSlider = key;
                this.updateSliderValue(key, x);
            }
        });
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

        // Calculate new value
        const ratio = Math.max(0, Math.min(1, (mouseX - slider.bounds.x) / slider.bounds.width));
        const rawValue = slider.min + ratio * (slider.max - slider.min);
        const steppedValue = Math.round(rawValue / slider.step) * slider.step;
        slider.value = Math.max(slider.min, Math.min(slider.max, steppedValue));

        // Apply to CONFIG
        this.applySliderToConfig(key, slider.value);
    }

    applySliderToConfig(key, value) {
        const keyPath = this.sliders[key].key.split('.');

        if (keyPath.length === 2) {
            CONFIG[keyPath[0]][keyPath[1]] = value;
            console.log(`[Settings] ${this.sliders[key].label} = ${value}`);
        }
    }

    resetToDefaults() {
        Object.keys(this.sliders).forEach(key => {
            this.sliders[key].value = this.defaults[key];
            this.applySliderToConfig(key, this.defaults[key]);
        });
        console.log('[Settings] Reset to defaults');
    }

    handleResize() {
        this.updateButtonPositions();
    }

    // Set callback for back button
    setBackCallback(callback) {
        this.onBack = callback;
    }
}
