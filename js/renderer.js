// js/renderer.js
// Mirror Breakout - Rendering Engine

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        // Cache for performance
        this.gradientCache = {};
        this.setupGradients();
    }
    
    // Setup cached gradients
    setupGradients() {
        // Background gradient
        this.gradientCache.background = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        this.gradientCache.background.addColorStop(0, CONFIG.COLORS.BG_GRADIENT[0]);
        this.gradientCache.background.addColorStop(0.5, CONFIG.COLORS.BG_GRADIENT[1]);
        this.gradientCache.background.addColorStop(1, CONFIG.COLORS.BG_GRADIENT[2]);
        
        // Center wave effect
        this.gradientCache.wave = this.ctx.createLinearGradient(
            0, CONFIG.CANVAS_HEIGHT/2 - 30,
            0, CONFIG.CANVAS_HEIGHT/2 + 30
        );
        this.gradientCache.wave.addColorStop(0, 'rgba(100, 200, 255, 0)');
        this.gradientCache.wave.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
        this.gradientCache.wave.addColorStop(1, 'rgba(100, 200, 255, 0)');
    }
    
    // Main render function
    render(physics, game) {
        // Clear canvas
        this.clear();
        
        // Draw background
        this.drawBackground();
        
        // Draw game entities
        this.drawBricks(physics);
        this.drawPaddles(physics, game);
        this.drawBalls(physics);
        
        // Draw effects
        this.drawEffects(game);
        
        // Draw UI
        this.drawUI(game);
        
        // Draw overlays (countdown, game over)
        this.drawOverlays(game);
    }
    
    // Clear canvas
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
    
    // Draw background
    drawBackground() {
        // Gradient background
        this.ctx.fillStyle = this.gradientCache.background;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Center wave effect
        this.ctx.fillStyle = this.gradientCache.wave;
        this.ctx.fillRect(0, CONFIG.CANVAS_HEIGHT/2 - 30, CONFIG.CANVAS_WIDTH, 60);
    }
    
    // Draw all bricks
    drawBricks(physics) {
        // Get all bricks
        const playerBricks = physics.getEntitiesOfType('playerBrick');
        const aiBricks = physics.getEntitiesOfType('aiBrick');
        
        [...playerBricks, ...aiBricks].forEach(brick => {
            const pos = brick.body.getPosition();
            const x = Utils.toPixels(pos.x);
            const y = Utils.toPixels(pos.y);
            const w = Utils.toPixels(CONFIG.BRICK.WIDTH);
            const h = Utils.toPixels(CONFIG.BRICK.HEIGHT);
            
            // Draw brick
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(x - w/2, y - h/2, w, h);
            
            // Add border
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x - w/2, y - h/2, w, h);
            
            // Add simple lighting effect
            const gradient = this.ctx.createLinearGradient(
                x - w/2, y - h/2,
                x - w/2, y + h/2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x - w/2, y - h/2, w, h);
        });
    }
    
    // Draw paddles
    drawPaddles(physics, game) {
        // Player paddle
        const playerPaddle = physics.getEntity(game.paddleIds.player);
        if (playerPaddle) {
            this.drawHexagonPaddle(playerPaddle.body, CONFIG.COLORS.PLAYER);
        }
        
        // AI paddle with difficulty color
        const aiPaddle = physics.getEntity(game.paddleIds.ai);
        if (aiPaddle) {
            this.drawHexagonPaddle(aiPaddle.body, game.ai.color);
        }
    }
    
    // Draw hexagon paddle
    drawHexagonPaddle(body, color) {
        const pos = body.getPosition();
        const x = Utils.toPixels(pos.x);
        const y = Utils.toPixels(pos.y);
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Get vertices in pixels
        const vertices = Utils.getHexagonVertices(
            CONFIG.PADDLE.WIDTH,
            CONFIG.PADDLE.HEIGHT
        );
        
        // Draw hexagon shape
        this.ctx.beginPath();
        vertices.forEach((v, i) => {
            const px = Utils.toPixels(v.x);
            const py = Utils.toPixels(v.y);
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        });
        this.ctx.closePath();
        
        // Fill with base color
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Add shine effect
        const shineGradient = this.ctx.createLinearGradient(
            0, -Utils.toPixels(CONFIG.PADDLE.HEIGHT/2),
            0, Utils.toPixels(CONFIG.PADDLE.HEIGHT/2)
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        this.ctx.fillStyle = shineGradient;
        this.ctx.fill();
        
        // Add border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // Draw balls
    drawBalls(physics) {
        const balls = physics.getEntitiesOfType('ball');
        
        balls.forEach(ball => {
            const pos = ball.body.getPosition();
            const x = Utils.toPixels(pos.x);
            const y = Utils.toPixels(pos.y);
            const r = Utils.toPixels(CONFIG.BALL.RADIUS);
            
            // Draw ball
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fillStyle = CONFIG.COLORS.BALL;
            this.ctx.fill();
            
            // Add glow effect
            const glow = this.ctx.createRadialGradient(x, y, 0, x, y, r * 2);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, r * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = glow;
            this.ctx.fill();
        });
    }
    
    // Draw effects
    drawEffects(game) {
        // Split effect
        if (game.effects.splitEffect) {
            const effect = game.effects.splitEffect;
            const x = Utils.toPixels(effect.x);
            const y = Utils.toPixels(effect.y);
            const radius = Utils.toPixels(effect.radius);
            
            // Draw multiple rings
            [1, 0.7, 1.3].forEach((scale, i) => {
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3 - i;
                this.ctx.globalAlpha = effect.opacity * (1 - i * 0.3);
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius * scale, 0, Math.PI * 2);
                this.ctx.stroke();
            });
            
            this.ctx.globalAlpha = 1;
        }
        
        // Spawn effects
        game.effects.spawnEffects.forEach(effect => {
            const x = Utils.toPixels(effect.x);
            const y = Utils.toPixels(effect.y);
            const radius = Utils.toPixels(effect.radius);
            
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = effect.opacity;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    // Draw UI elements
    drawUI(game) {
        // Player label
        this.ctx.font = CONFIG.FONTS.LABEL;
        this.ctx.fillStyle = CONFIG.COLORS.PLAYER;
        this.ctx.fillText('PLAYER (You)', 20, 30);
        
        // AI label
        this.ctx.fillStyle = game.ai.color;
        this.ctx.fillText('COMPUTER', 20, CONFIG.CANVAS_HEIGHT - 10);
        
        // Time display
        if (game.state.phase === 'playing') {
            this.ctx.font = CONFIG.FONTS.TIME;
            this.ctx.fillStyle = CONFIG.COLORS.UI.TEXT;
            this.ctx.fillText(
                `Time: ${game.getTimeString()}`,
                CONFIG.CANVAS_WIDTH - 100,
                30
            );
        }
        
        // Score (optional - not in original)
        // this.ctx.fillText(`Score: ${game.score.player} - ${game.score.ai}`, 20, 60);
    }
    
    // Draw overlays (countdown, game over)
    drawOverlays(game) {
        if (game.state.phase === 'countdown') {
            this.drawCountdown(game);
        } else if (game.state.phase === 'over') {
            this.drawGameOver(game);
        }
    }
    
    // Draw countdown
    drawCountdown(game) {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Countdown number
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = CONFIG.FONTS.COUNTDOWN;
        this.ctx.fillStyle = CONFIG.COLORS.UI.TEXT;
        
        // Animate scale
        const elapsed = (Date.now() - game.state.countdownStartTime) % 1000;
        const scale = 1 + Math.sin(elapsed / 1000 * Math.PI) * 0.2;
        
        this.ctx.translate(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        this.ctx.scale(scale, scale);
        
        if (game.state.countdown > 0) {
            this.ctx.fillText(game.state.countdown.toString(), 0, 0);
        } else {
            // Show "START!" briefly
            this.ctx.font = 'bold 80px Arial';
            this.ctx.fillStyle = CONFIG.COLORS.PLAYER;
            this.ctx.fillText('START!', 0, 0);
        }
        
        this.ctx.restore();
    }
    
    // Draw game over screen
    drawGameOver(game) {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Game Over text
        this.ctx.font = CONFIG.FONTS.TITLE;
        this.ctx.fillStyle = CONFIG.COLORS.UI.TEXT;
        this.ctx.fillText(
            'GAME OVER',
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2 - 40
        );
        
        // Win/Lose text
        this.ctx.font = CONFIG.FONTS.SUBTITLE;
        this.ctx.fillStyle = game.state.playerWon ? CONFIG.COLORS.UI.WIN : CONFIG.COLORS.UI.LOSE;
        this.ctx.fillText(
            game.state.playerWon ? 'YOU WIN!' : 'YOU LOSE',
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2 + 20
        );
        
        // Final score
        this.ctx.font = CONFIG.FONTS.LABEL;
        this.ctx.fillStyle = CONFIG.COLORS.UI.TEXT;
        this.ctx.fillText(
            `Player: ${game.score.player} | Computer: ${game.score.ai}`,
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2 + 70
        );
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
}