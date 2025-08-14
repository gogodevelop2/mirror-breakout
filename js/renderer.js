// js/renderer.js
// Mirror Breakout - Rendering Engine

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        // Enable anti-aliasing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
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
        // Setup rounded corners clipping
        this.setupRoundedClip();
        
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
        
        // Restore context
        this.ctx.restore();
    }
    
    // Setup rounded corner clipping
    setupRoundedClip() {
        this.ctx.save();
        this.ctx.beginPath();
        const r = CONFIG.CORNER_RADIUS;
        this.ctx.moveTo(r, 0);
        this.ctx.arcTo(CONFIG.CANVAS_WIDTH, 0, CONFIG.CANVAS_WIDTH, r, r);
        this.ctx.arcTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH - r, CONFIG.CANVAS_HEIGHT, r);
        this.ctx.arcTo(0, CONFIG.CANVAS_HEIGHT, 0, CONFIG.CANVAS_HEIGHT - r, r);
        this.ctx.arcTo(0, 0, r, 0, r);
        this.ctx.closePath();
        this.ctx.clip();
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
        const playerTargetBricks = physics.getEntitiesOfType('playerTargetBrick');
        const aiTargetBricks = physics.getEntitiesOfType('aiTargetBrick');
        
        [...playerTargetBricks, ...aiTargetBricks].forEach(brick => {
            const pos = brick.body.getPosition();
            const x = Utils.toPixels(pos.x);
            const y = Utils.toPixels(pos.y);
            const w = Utils.toPixels(CONFIG.BRICK.WIDTH);
            const h = Utils.toPixels(CONFIG.BRICK.HEIGHT);
            
            // Draw brick with shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            
            // Draw brick
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(x - w/2, y - h/2, w, h);
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            
            // Add simple lighting effect
            const gradient = this.ctx.createLinearGradient(
                x - w/2, y - h/2,
                x - w/2, y + h/2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x - w/2, y - h/2, w, h);
            
            // Add border
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(x - w/2, y - h/2, w, h);
        });
    }
    
    // Draw paddles
    drawPaddles(physics, game) {
        // Player paddle (top)
        const playerPaddle = physics.getEntity(game.paddleIds.player);
        if (playerPaddle) {
            this.drawHexagonPaddle(playerPaddle.body, CONFIG.COLORS.PLAYER);
        }
        
        // AI paddle (bottom) with difficulty color
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
        
        // Add shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
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
        
        // Reset shadow for shine effect
        this.ctx.shadowColor = 'transparent';
        
        // Add metallic shine effect
        const shineGradient = this.ctx.createLinearGradient(
            0, -Utils.toPixels(CONFIG.PADDLE.HEIGHT/2),
            0, Utils.toPixels(CONFIG.PADDLE.HEIGHT/2)
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shineGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        this.ctx.fillStyle = shineGradient;
        this.ctx.fill();
        
        // Add edge highlight
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
            
            // Draw ball with shadow
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            
            // Draw ball
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fillStyle = CONFIG.COLORS.BALL;
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            
            // Add shine
            const shine = this.ctx.createRadialGradient(
                x - r * 0.3, y - r * 0.3, 0,
                x - r * 0.3, y - r * 0.3, r * 0.7
            );
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fillStyle = shine;
            this.ctx.fill();
            
            // Add glow effect
            const glow = this.ctx.createRadialGradient(x, y, r, x, y, r * 2.5);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = glow;
            this.ctx.fill();
            
            this.ctx.restore();
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
        // Player label (top)
        this.ctx.font = CONFIG.FONTS.LABEL;
        this.ctx.fillStyle = CONFIG.COLORS.PLAYER;
        this.ctx.fillText('PLAYER (You)', 20, 30);
        
        // AI label (bottom)
        this.ctx.fillStyle = game.ai.color;
        this.ctx.fillText('COMPUTER', 20, CONFIG.CANVAS_HEIGHT - 10);
        
        // Time display
        if (game.state.phase === 'playing') {
            this.ctx.font = CONFIG.FONTS.TIME;
            this.ctx.fillStyle = CONFIG.COLORS.UI.TIME;
            this.ctx.fillText(
                `Time: ${game.getTimeString()}`,
                CONFIG.CANVAS_WIDTH - 100,
                30
            );
        }
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
        
        // Countdown animation
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Animate scale
        const elapsed = (Date.now() - game.state.countdownStartTime) % 1000;
        const scale = 1 + Math.sin(elapsed / 1000 * Math.PI) * 0.2;
        
        this.ctx.translate(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        this.ctx.scale(scale, scale);
        
        if (game.state.countdown > 0) {
            // Countdown number
            this.ctx.font = CONFIG.FONTS.COUNTDOWN;
            this.ctx.fillStyle = CONFIG.COLORS.UI.COUNTDOWN;
            this.ctx.fillText(game.state.countdown.toString(), 0, 0);
            
            // Add glow
            this.ctx.strokeStyle = 'rgba(68, 170, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(game.state.countdown.toString(), 0, 0);
        } else {
            // Show "START!" briefly
            this.ctx.font = CONFIG.FONTS.START;
            
            // Gradient text
            const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
            glow.addColorStop(0, CONFIG.COLORS.UI.START);
            glow.addColorStop(1, 'rgba(68, 170, 255, 0.3)');
            this.ctx.fillStyle = glow;
            this.ctx.fillText('START!', 0, 0);
            
            // Outline
            this.ctx.strokeStyle = CONFIG.COLORS.UI.START;
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('START!', 0, 0);
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
            CONFIG.CANVAS_HEIGHT / 2 - 60
        );
        
        // Win/Lose text
        this.ctx.font = CONFIG.FONTS.SUBTITLE;
        this.ctx.fillStyle = game.state.playerWon ? CONFIG.COLORS.UI.WIN : CONFIG.COLORS.UI.LOSE;
        this.ctx.fillText(
            game.state.playerWon ? 'YOU WIN!' : 'YOU LOSE',
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2
        );
        
        // Final score
        this.ctx.font = CONFIG.FONTS.LABEL;
        this.ctx.fillStyle = CONFIG.COLORS.UI.TEXT;
        this.ctx.fillText(
            `Player: ${game.score.player} | Computer: ${game.score.ai}`,
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2 + 50
        );
        
        // Time played
        this.ctx.font = CONFIG.FONTS.TIME;
        this.ctx.fillText(
            `Time: ${game.getTimeString()}`,
            CONFIG.CANVAS_WIDTH / 2,
            CONFIG.CANVAS_HEIGHT / 2 + 80
        );
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    // DEBUG: Draw all physics bodies with walls in red
    drawPhysicsDebug(physics) {
        if (!physics.world) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'red';
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        
        // Iterate through all bodies in the physics world
        let body = physics.world.getBodyList();
        while (body) {
            const fixtures = body.getFixtureList();
            let fixture = fixtures;
            
            while (fixture) {
                const userData = fixture.getUserData();
                
                // Only draw walls (not balls, paddles, or bricks)
                if (userData && userData.type === 'wall') {
                    const shape = fixture.getShape();
                    const bodyPos = body.getPosition();
                    const bodyAngle = body.getAngle();
                    
                    this.ctx.save();
                    this.ctx.translate(Utils.toPixels(bodyPos.x), Utils.toPixels(bodyPos.y));
                    this.ctx.rotate(bodyAngle);
                    
                    if (shape.getType() === 'polygon') {
                        // Draw rectangle/polygon
                        const vertices = shape.m_vertices;
                        this.ctx.beginPath();
                        vertices.forEach((vertex, i) => {
                            const x = Utils.toPixels(vertex.x);
                            const y = Utils.toPixels(vertex.y);
                            if (i === 0) {
                                this.ctx.moveTo(x, y);
                            } else {
                                this.ctx.lineTo(x, y);
                            }
                        });
                        this.ctx.closePath();
                        this.ctx.fill();
                        this.ctx.stroke();
                        
                    } else if (shape.getType() === 'circle') {
                        // Draw circle
                        const radius = Utils.toPixels(shape.getRadius());
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.stroke();
                    }
                    
                    this.ctx.restore();
                }
                
                fixture = fixture.getNext();
            }
            
            body = body.getNext();
        }
        
        this.ctx.restore();
    }
}
