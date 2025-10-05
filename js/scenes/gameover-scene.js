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
            playerWon: false
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
            playerWon: data.playerWon || false
        };

        console.log('[GameOverScene] Results:', this.results);

        this.time = 0;
        this.updateButtonPositions();
    }

    updateButtonPositions() {
        // Use auto-layout for horizontal-center pattern
        this.autoLayoutButtons('horizontal-center');
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Title scale pulse
        this.titleScale = 1.0 + Math.sin(this.time * 3) * 0.05;
    }

    render(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Background is now rendered to bgCanvas in onEnter()

        // Victory/Defeat title
        ctx.save();
        ctx.translate(centerX, centerY - 150);
        ctx.scale(this.titleScale, this.titleScale);

        if (this.results.playerWon) {
            // Victory
            ctx.fillStyle = '#4af';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VICTORY!', 0, 0);

            // Glow effect
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = 20;
            ctx.fillText('VICTORY!', 0, 0);
        } else {
            // Defeat
            ctx.fillStyle = '#f44';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DEFEAT', 0, 0);

            // Glow effect
            ctx.shadowColor = '#f44';
            ctx.shadowBlur = 20;
            ctx.fillText('DEFEAT', 0, 0);
        }

        ctx.restore();

        // Scoreboard
        this.renderScoreboard(ctx, centerX, centerY - 50);

        // Game time
        const minutes = Math.floor(this.results.gameTime / 60);
        const seconds = Math.floor(this.results.gameTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        ctx.fillStyle = '#aaa';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Time: ${timeStr}`, centerX, centerY + 100);

        // Buttons
        this.renderButton(ctx, this.buttons.retry);
        this.renderButton(ctx, this.buttons.menu);

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Mirror Breakout', centerX, height - 30);
    }

    renderScoreboard(ctx, centerX, centerY) {
        const barWidth = 400;
        const barHeight = 40;
        const barX = centerX - barWidth / 2;

        // Total bricks
        const totalBricks = this.results.playerScore + this.results.aiScore;
        const playerRatio = totalBricks > 0 ? this.results.playerScore / totalBricks : 0.5;

        // Background bar
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, centerY, barWidth, barHeight);

        // Player bar (from left)
        ctx.fillStyle = '#4af';
        ctx.fillRect(barX, centerY, barWidth * playerRatio, barHeight);

        // AI bar (from right)
        ctx.fillStyle = '#f44';
        ctx.fillRect(barX + barWidth * playerRatio, centerY, barWidth * (1 - playerRatio), barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, centerY, barWidth, barHeight);

        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`PLAYER: ${this.results.playerScore}`, barX + 10, centerY + barHeight / 2);

        ctx.textAlign = 'right';
        ctx.fillText(`AI: ${this.results.aiScore}`, barX + barWidth - 10, centerY + barHeight / 2);
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
        this.updateButtonPositions();
    }

    // Set callbacks
    setRetryCallback(callback) {
        this.onRetry = callback;
    }

    setMenuCallback(callback) {
        this.onMenu = callback;
    }
}
