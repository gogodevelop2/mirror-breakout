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
        const width = CONFIG.CANVAS_WIDTH || 600;
        const height = CONFIG.CANVAS_HEIGHT || 700;

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
        this.updateButtonPositions();

        // Render static background to bgCanvas if available
        if (this.bgCanvas) {
            this.renderBackground();
        }
    }

    updateButtonPositions() {
        // Use auto-layout for vertical-center pattern
        this.autoLayoutButtons('vertical-center');
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Gradient animation (same as CSS header - 0% to 100% to 0%)
        const cycle = (this.time * 0.33) % 2;  // 6 second full cycle (3s forward, 3s back)
        this.gradientOffset = cycle <= 1 ? cycle : 2 - cycle;  // 0→1→0 (ping-pong)

        // Update background balls
        const width = CONFIG.CANVAS_WIDTH || 600;
        const height = CONFIG.CANVAS_HEIGHT || 700;

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

    render(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Note: Background is now rendered to bgCanvas in renderBackground()
        // This canvas (gameCanvas) only renders foreground elements

        // Title with gradient animation (matches CSS header)
        ctx.save();

        const titleY = height * 0.25;  // 화면 상단 25% 위치

        // Create animated gradient (centered oscillation)
        const gradientWidth = 800;
        // Oscillate from -300 to +300 (centered around text)
        const offset = (this.gradientOffset - 0.5) * 600;

        const titleGradient = ctx.createLinearGradient(
            width / 2 - gradientWidth / 2 + offset,
            titleY,
            width / 2 + gradientWidth / 2 + offset,
            titleY
        );
        titleGradient.addColorStop(0, '#4af');
        titleGradient.addColorStop(0.5, '#f4a');
        titleGradient.addColorStop(1, '#4af');

        // Main title (Orbitron font) - two lines
        ctx.fillStyle = titleGradient;
        ctx.font = '900 48px Orbitron, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MIRROR', width / 2, titleY - 30);
        ctx.fillText('BREAKOUT', width / 2, titleY + 30);

        ctx.restore();

        // Subtitle
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Physics-Based Competitive Breakout', width / 2, titleY + 80);
        ctx.globalAlpha = 1.0;

        // Buttons
        this.renderButton(ctx, this.buttons.start);
        this.renderButton(ctx, this.buttons.settings);

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Mirror Breakout', width / 2, height - 30);
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
        this.updateButtonPositions();

        // Reset background balls to fit new canvas size
        const width = CONFIG.CANVAS_WIDTH || 600;
        const height = CONFIG.CANVAS_HEIGHT || 700;

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
