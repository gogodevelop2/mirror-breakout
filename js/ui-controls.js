// js/ui-controls.js
// Mirror Breakout - Physics Settings UI Controls

class UIControls {
    constructor(config, physics) {
        this.config = config;
        this.physics = physics;
        this.isCollapsed = false;

        // Store original values for reset
        this.defaults = {
            ballMass: 100,
            ballSpeed: 3.5,
            brickMass: 1000,
            brickRestitution: 0.9,
            brickFriction: 0.3,
            brickDamping: 1.0
        };

        // UI Elements
        this.panel = null;
        this.sliders = {};
        this.valueDisplays = {};

        this.init();
    }

    init() {
        this.panel = document.getElementById('settingsPanel');
        if (!this.panel) {
            console.error('Settings panel not found');
            return;
        }

        // Setup all sliders
        this.setupSlider('ballMass', 20, 160, 100, 1, 'Ball Mass', '');
        this.setupSlider('ballSpeed', 2.5, 5.0, 3.5, 0.1, 'Ball Speed', 'm/s');
        this.setupSlider('brickMass', 500, 2000, 1000, 50, 'Brick Mass', '');
        this.setupSlider('brickRestitution', 0.5, 1.0, 0.9, 0.05, 'Brick Bounce', '');
        this.setupSlider('brickFriction', 0, 0.8, 0.3, 0.05, 'Brick Friction', '');
        this.setupSlider('brickDamping', 0.5, 2.0, 1.0, 0.1, 'Brick Damping', '');

        // Setup buttons
        this.setupButtons();
    }

    setupSlider(id, min, max, defaultValue, step, label, unit) {
        const slider = document.getElementById(id);
        const display = document.getElementById(`${id}Value`);

        if (!slider || !display) {
            console.error(`Slider or display not found: ${id}`);
            return;
        }

        slider.min = min;
        slider.max = max;
        slider.value = defaultValue;
        slider.step = step;

        this.sliders[id] = slider;
        this.valueDisplays[id] = display;

        // Update display
        this.updateDisplay(id, defaultValue, unit);

        // Add event listener for real-time updates
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.updateDisplay(id, value, unit);
            this.applyPhysicsChange(id, value);
        });
    }

    updateDisplay(id, value, unit) {
        if (this.valueDisplays[id]) {
            // Format value based on type
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(2);
            this.valueDisplays[id].textContent = `${formatted}${unit}`;
        }
    }

    applyPhysicsChange(id, value) {
        switch(id) {
            case 'ballMass':
                this.config.BALL.MASS = value;
                this.updateExistingBalls();
                break;

            case 'ballSpeed':
                this.config.BALL.SPEED = value;
                this.config.BALL.BASE_SPEED = value;
                break;

            case 'brickMass':
                this.config.BRICK.MASS = value;
                this.updateExistingBricks();
                break;

            case 'brickRestitution':
                this.config.BRICK.RESTITUTION = value;
                this.updateExistingBricks();
                break;

            case 'brickFriction':
                this.config.BRICK.FRICTION = value;
                this.updateExistingBricks();
                break;

            case 'brickDamping':
                this.config.BRICK.LINEAR_DAMPING = value;
                this.config.BRICK.ANGULAR_DAMPING = value;
                this.updateExistingBricks();
                break;
        }
    }

    updateExistingBalls() {
        const balls = this.physics.getEntitiesOfType('ball');
        const ballArea = Math.PI * this.config.BALL.RADIUS * this.config.BALL.RADIUS;
        const newDensity = this.config.BALL.MASS / ballArea;

        balls.forEach(ball => {
            const fixture = ball.body.getFixtureList();
            if (fixture) {
                fixture.setDensity(newDensity);
                ball.body.resetMassData();
            }
        });
    }

    updateExistingBricks() {
        const brickTypes = ['playerTargetBrick', 'aiTargetBrick'];
        const brickArea = this.config.BRICK.WIDTH * this.config.BRICK.HEIGHT;
        const newDensity = this.config.BRICK.MASS / brickArea;

        brickTypes.forEach(type => {
            const bricks = this.physics.getEntitiesOfType(type);
            bricks.forEach(brick => {
                const fixture = brick.body.getFixtureList();
                if (fixture) {
                    // Update mass
                    fixture.setDensity(newDensity);
                    brick.body.resetMassData();

                    // Update restitution
                    fixture.setRestitution(this.config.BRICK.RESTITUTION);

                    // Update friction
                    fixture.setFriction(this.config.BRICK.FRICTION);
                }

                // Update damping
                brick.body.setLinearDamping(this.config.BRICK.LINEAR_DAMPING);
                brick.body.setAngularDamping(this.config.BRICK.ANGULAR_DAMPING);
            });
        });
    }

    setupButtons() {
        // Reset button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToDefaults());
        }

        // Toggle button
        const toggleBtn = document.getElementById('toggleSettings');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }
    }

    resetToDefaults() {
        // Reset all sliders to default values
        this.sliders.ballMass.value = this.defaults.ballMass;
        this.sliders.ballSpeed.value = this.defaults.ballSpeed;
        this.sliders.brickMass.value = this.defaults.brickMass;
        this.sliders.brickRestitution.value = this.defaults.brickRestitution;
        this.sliders.brickFriction.value = this.defaults.brickFriction;
        this.sliders.brickDamping.value = this.defaults.brickDamping;

        // Trigger input events to update everything
        Object.values(this.sliders).forEach(slider => {
            slider.dispatchEvent(new Event('input'));
        });
    }

    togglePanel() {
        this.isCollapsed = !this.isCollapsed;
        const content = document.querySelector('.settings-content');
        const toggleBtn = document.getElementById('toggleSettings');

        if (this.isCollapsed) {
            content.style.display = 'none';
            toggleBtn.textContent = '▶';
            this.panel.style.width = '40px';
        } else {
            content.style.display = 'block';
            toggleBtn.textContent = '◀';
            this.panel.style.width = '220px';
        }
    }
}
