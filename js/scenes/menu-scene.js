// js/scenes/menu-scene.js
// Menu scene - Title screen with START button

class MenuScene extends BaseScene {
    constructor() {
        super('Menu');

        // Button dimensions and position
        this.buttons = {
            start: {
                x: 0,
                y: 0,
                width: 200,
                height: 60,
                text: 'START GAME',
                hovered: false
            },
            settings: {
                x: 0,
                y: 0,
                width: 200,
                height: 60,
                text: 'SETTINGS',
                hovered: false
            }
        };

        // Animation
        this.time = 0;
        this.gradientOffset = 0;

        // Background balls animation
        this.bgBalls = [];
        this.initBackgroundBalls();

        // Callbacks
        this.onStartGame = null;
        this.onSettings = null;
    }

    initBackgroundBalls() {
        // Create 5 slow-moving balls for background animation
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;

        for (let i = 0; i < 5; i++) {
            this.bgBalls.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 50,  // pixels per second
                vy: (Math.random() - 0.5) * 50,
                radius: 20 + Math.random() * 30,
                alpha: 0.1 + Math.random() * 0.2
            });
        }
    }

    onEnter(data) {
        super.onEnter(data);
        this.time = 0;
        this.updateLayout();

        // Render static background to bgCanvas if available
        if (this.bgCanvas) {
            this.renderBackground();
        }
    }

    updateLayout() {
        if (!this.canvas) return;

        const layout = ResponsiveLayout.getLayoutInfo();

        // Responsive button sizes
        const btnSize = ResponsiveLayout.buttonSize(200, 60);
        this.buttons.start.width = btnSize.width;
        this.buttons.start.height = btnSize.height;
        this.buttons.settings.width = btnSize.width;
        this.buttons.settings.height = btnSize.height;

        // Title and subtitle positions
        const titleY = ResponsiveLayout.verticalPosition(0.25);
        const subtitleY = titleY + ResponsiveLayout.spacing(80);

        // Button positions (below subtitle, centered vertically in remaining space)
        const buttonGap = ResponsiveLayout.spacing(80);
        const remainingSpace = layout.height - subtitleY - ResponsiveLayout.margin('bottom');
        const buttonAreaStartY = subtitleY + remainingSpace * 0.3; // Start 30% into remaining space

        this.buttons.start.x = layout.centerX - btnSize.width / 2;
        this.buttons.start.y = buttonAreaStartY;
        this.buttons.settings.x = layout.centerX - btnSize.width / 2;
        this.buttons.settings.y = buttonAreaStartY + buttonGap;

        // Store responsive layout values for rendering
        this.layout = {
            centerX: layout.centerX,
            centerY: layout.centerY,
            titleY: titleY,
            titleSize: ResponsiveLayout.fontSize(48),
            subtitleY: subtitleY,
            subtitleSize: ResponsiveLayout.fontSize(16),
            footerY: layout.height - ResponsiveLayout.margin('bottom') / 2,
            footerSize: ResponsiveLayout.fontSize(14),
            gradientBlur: ResponsiveLayout.spacing(20)
        };
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Gradient animation (same as CSS header - 0% to 100% to 0%)
        const cycle = (this.time * 0.33) % 2;  // 6 second full cycle (3s forward, 3s back)
        this.gradientOffset = cycle <= 1 ? cycle : 2 - cycle;  // 0→1→0 (ping-pong)

        // Update background balls
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;

        this.bgBalls.forEach(ball => {
            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;

            // Bounce off walls
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
                ball.vx *= -1;
                ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
            }
            if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) {
                ball.vy *= -1;
                ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y));
            }
        });

        // Re-render background with animated balls if bgCanvas is available
        if (this.bgCanvas) {
            this.renderBackground();
        }
    }

    /**
     * Render background to bgCanvas (static gradient + animated balls)
     */
    renderBackground() {
        if (!this.bgCanvas) return;

        const ctx = this.bgCanvas.getContext('2d');
        const width = this.bgCanvas.width;
        const height = this.bgCanvas.height;

        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#0a0a1a');
        bgGradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Background balls
        this.bgBalls.forEach(ball => {
            ctx.fillStyle = `rgba(68, 170, 255, ${ball.alpha})`;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    render(ctx, alpha = 1.0) {
        if (!this.layout) return;

        // Title with gradient animation
        ctx.save();

        // Create animated gradient (centered oscillation) - responsive
        const gradientWidth = ResponsiveLayout.spacing(800);
        const offset = (this.gradientOffset - 0.5) * ResponsiveLayout.spacing(600);

        const titleGradient = ctx.createLinearGradient(
            this.layout.centerX - gradientWidth / 2 + offset,
            this.layout.titleY,
            this.layout.centerX + gradientWidth / 2 + offset,
            this.layout.titleY
        );
        titleGradient.addColorStop(0, '#4af');
        titleGradient.addColorStop(0.5, '#f4a');
        titleGradient.addColorStop(1, '#4af');

        // Main title (Orbitron font) - two lines - responsive
        ctx.fillStyle = titleGradient;
        ctx.font = `900 ${this.layout.titleSize}px Orbitron, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lineSpacing = ResponsiveLayout.spacing(30);
        ctx.fillText('MIRROR', this.layout.centerX, this.layout.titleY - lineSpacing);
        ctx.fillText('BREAKOUT', this.layout.centerX, this.layout.titleY + lineSpacing);

        ctx.restore();

        // Subtitle - responsive
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#aaa';
        ctx.font = `${this.layout.subtitleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Physics-Based Competitive Breakout', this.layout.centerX, this.layout.subtitleY);
        ctx.globalAlpha = 1.0;

        // Buttons
        this.renderButton(ctx, this.buttons.start);
        this.renderButton(ctx, this.buttons.settings);

        // Footer - responsive
        ctx.fillStyle = '#666';
        ctx.font = `${this.layout.footerSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Mirror Breakout', this.layout.centerX, this.layout.footerY);
    }

    handleMouseMove(x, y) {
        // Update button hover states using BaseScene method
        this.updateButtonHover(x, y);
    }

    handleClick(x, y) {
        // Check if START button was clicked
        const startBtn = this.buttons.start;
        if (x >= startBtn.x && x <= startBtn.x + startBtn.width &&
            y >= startBtn.y && y <= startBtn.y + startBtn.height) {
            console.log('[MenuScene] START button clicked');
            if (this.onStartGame) {
                this.onStartGame();
            }
            return;
        }

        // Check if SETTINGS button was clicked
        const settingsBtn = this.buttons.settings;
        if (x >= settingsBtn.x && x <= settingsBtn.x + settingsBtn.width &&
            y >= settingsBtn.y && y <= settingsBtn.y + settingsBtn.height) {
            console.log('[MenuScene] SETTINGS button clicked');
            if (this.onSettings) {
                this.onSettings();
            }
            return;
        }
    }

    handleResize() {
        this.updateLayout();

        // Reset background balls to fit new canvas size
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;

        this.bgBalls.forEach(ball => {
            ball.x = Math.min(ball.x, width - ball.radius);
            ball.y = Math.min(ball.y, height - ball.radius);
        });

        // Re-render background after resize
        if (this.bgCanvas) {
            this.renderBackground();
        }
    }

    // Set callback for when game starts
    setStartGameCallback(callback) {
        this.onStartGame = callback;
    }

    // Set callback for when settings is opened
    setSettingsCallback(callback) {
        this.onSettings = callback;
    }
}
