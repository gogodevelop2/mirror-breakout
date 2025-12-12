// js/scenes/gameover-scene.js
// Game Over scene - Shows results and options

class GameOverScene extends BaseScene {
    constructor() {
        super('GameOver');

        // Game results
        this.results = {
            playerScore: 0,
            aiScore: 0,
            gameTime: 0,
            playerWon: false,
            finalScore: null  // Final score breakdown (승리 시에만)
        };

        // Buttons
        this.buttons = {
            retry: {
                x: 0,
                y: 0,
                width: 180,
                height: 60,
                text: 'RETRY',
                hovered: false
            },
            menu: {
                x: 0,
                y: 0,
                width: 180,
                height: 60,
                text: 'MENU',
                hovered: false
            }
        };

        // Animation
        this.time = 0;
        this.titleScale = 1.0;

        // Callbacks
        this.onRetry = null;
        this.onMenu = null;
    }

    onEnter(data) {
        super.onEnter(data);

        // Clear background canvas with dark overlay
        if (this.bgCanvas) {
            const bgCtx = this.bgCanvas.getContext('2d');
            bgCtx.fillStyle = 'rgba(10, 10, 20, 0.95)';
            bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }

        // Store game results
        this.results = {
            playerScore: data.playerScore || 0,
            aiScore: data.aiScore || 0,
            gameTime: data.gameTime || 0,
            playerWon: data.playerWon || false,
            finalScore: data.finalScore || null
        };

        console.log('[GameOverScene] Results:', this.results);

        this.time = 0;
        this.updateLayout();
    }

    updateLayout() {
        if (!this.canvas) return;

        const layout = ResponsiveLayout.getLayoutInfo();

        // Responsive button sizes
        const btnSize = ResponsiveLayout.buttonSize(180, 60);
        this.buttons.retry.width = btnSize.width;
        this.buttons.retry.height = btnSize.height;
        this.buttons.menu.width = btnSize.width;
        this.buttons.menu.height = btnSize.height;

        // Button positions (horizontal center)
        const gap = ResponsiveLayout.spacing(20);
        const totalWidth = btnSize.width * 2 + gap;
        const buttonY = layout.centerY + ResponsiveLayout.spacing(180);

        this.buttons.retry.x = layout.centerX - totalWidth / 2;
        this.buttons.retry.y = buttonY;
        this.buttons.menu.x = this.buttons.retry.x + btnSize.width + gap;
        this.buttons.menu.y = buttonY;

        // Store responsive layout values for rendering
        this.layout = {
            centerX: layout.centerX,
            centerY: layout.centerY,
            titleY: layout.centerY - ResponsiveLayout.spacing(200),
            titleSize: ResponsiveLayout.fontSize(72),
            finalScoreY: layout.centerY - ResponsiveLayout.spacing(120),
            finalScoreSize: ResponsiveLayout.fontSize(60),
            scoreBreakdownY: layout.centerY - ResponsiveLayout.spacing(70),
            scoreBreakdownSize: ResponsiveLayout.fontSize(16),
            scoreboardY: layout.centerY - ResponsiveLayout.spacing(20),
            scoreboardWidth: ResponsiveLayout.widgetSize(400),
            scoreboardHeight: ResponsiveLayout.spacing(40),
            timeY: layout.centerY + ResponsiveLayout.spacing(60),
            timeSize: ResponsiveLayout.fontSize(24),
            footerY: layout.height - ResponsiveLayout.margin('bottom') / 2,
            footerSize: ResponsiveLayout.fontSize(14)
        };
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Title scale pulse
        this.titleScale = 1.0 + Math.sin(this.time * 3) * 0.05;
    }

    render(ctx) {
        if (!this.layout) return;

        // Victory/Defeat title
        ctx.save();
        ctx.translate(this.layout.centerX, this.layout.titleY);
        ctx.scale(this.titleScale, this.titleScale);

        if (this.results.playerWon) {
            // Victory
            ctx.fillStyle = '#4af';
            ctx.font = `bold ${this.layout.titleSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VICTORY!', 0, 0);

            // Glow effect
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = ResponsiveLayout.spacing(20);
            ctx.fillText('VICTORY!', 0, 0);
        } else {
            // Defeat
            ctx.fillStyle = '#f44';
            ctx.font = `bold ${this.layout.titleSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DEFEAT', 0, 0);

            // Glow effect
            ctx.shadowColor = '#f44';
            ctx.shadowBlur = ResponsiveLayout.spacing(20);
            ctx.fillText('DEFEAT', 0, 0);
        }

        ctx.restore();

        // Final Score (승리 시에만 표시)
        if (this.results.playerWon && this.results.finalScore) {
            const fs = this.results.finalScore;

            // Total score (큰 숫자)
            ctx.fillStyle = '#ffd700';  // Gold color
            ctx.font = `bold ${this.layout.finalScoreSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = ResponsiveLayout.spacing(15);
            ctx.fillText(fs.total.toLocaleString(), this.layout.centerX, this.layout.finalScoreY);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Score breakdown (작은 글씨)
            ctx.fillStyle = '#aaa';
            ctx.font = `${this.layout.scoreBreakdownSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
                `Base: ${fs.base} + Difference: ${fs.scoreDiffBonus} + Time: ${fs.timeBonus}`,
                this.layout.centerX,
                this.layout.scoreBreakdownY
            );
        }

        // Scoreboard (responsive)
        this.renderScoreboard(
            ctx,
            this.layout.centerX,
            this.layout.scoreboardY,
            this.layout.scoreboardWidth,
            this.layout.scoreboardHeight
        );

        // Game time (responsive)
        const minutes = Math.floor(this.results.gameTime / 60);
        const seconds = Math.floor(this.results.gameTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        ctx.fillStyle = '#aaa';
        ctx.font = `${this.layout.timeSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Time: ${timeStr}`, this.layout.centerX, this.layout.timeY);

        // Buttons
        this.renderButton(ctx, this.buttons.retry);
        this.renderButton(ctx, this.buttons.menu);

        // Footer (responsive)
        ctx.fillStyle = '#666';
        ctx.font = `${this.layout.footerSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Mirror Breakout', this.layout.centerX, this.layout.footerY);
    }

    renderScoreboard(ctx, centerX, centerY, width, height) {
        const barX = centerX - width / 2;

        // Total bricks
        const totalBricks = this.results.playerScore + this.results.aiScore;
        const playerRatio = totalBricks > 0 ? this.results.playerScore / totalBricks : 0.5;

        // Background bar
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, centerY, width, height);

        // Player bar (from left)
        ctx.fillStyle = '#4af';
        ctx.fillRect(barX, centerY, width * playerRatio, height);

        // AI bar (from right)
        ctx.fillStyle = '#f44';
        ctx.fillRect(barX + width * playerRatio, centerY, width * (1 - playerRatio), height);

        // Border (responsive)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = ResponsiveLayout.borderWidth(2);
        ctx.strokeRect(barX, centerY, width, height);

        // Labels (responsive font)
        const labelSize = ResponsiveLayout.fontSize(18);
        const padding = ResponsiveLayout.spacing(10);

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${labelSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`PLAYER: ${this.results.playerScore}`, barX + padding, centerY + height / 2);

        ctx.textAlign = 'right';
        ctx.fillText(`AI: ${this.results.aiScore}`, barX + width - padding, centerY + height / 2);
    }

    handleMouseMove(x, y) {
        // Update button hover states using BaseScene method
        this.updateButtonHover(x, y);
    }

    handleClick(x, y) {
        // Check RETRY button
        const retry = this.buttons.retry;
        if (x >= retry.x && x <= retry.x + retry.width &&
            y >= retry.y && y <= retry.y + retry.height) {
            console.log('[GameOverScene] RETRY clicked');
            if (this.onRetry) {
                this.onRetry();
            }
            return;
        }

        // Check MENU button
        const menu = this.buttons.menu;
        if (x >= menu.x && x <= menu.x + menu.width &&
            y >= menu.y && y <= menu.y + menu.height) {
            console.log('[GameOverScene] MENU clicked');
            if (this.onMenu) {
                this.onMenu();
            }
            return;
        }
    }

    handleResize() {
        this.updateLayout();

        // Re-render background overlay after resize
        if (this.bgCanvas) {
            const bgCtx = this.bgCanvas.getContext('2d');
            bgCtx.fillStyle = 'rgba(10, 10, 20, 0.95)';
            bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
    }

    // Set callbacks
    setRetryCallback(callback) {
        this.onRetry = callback;
    }

    setMenuCallback(callback) {
        this.onMenu = callback;
    }
}
