// js/physics.js
// Mirror Breakout - Physics Engine (Planck.js)

class PhysicsEngine {
    constructor() {
        this.world = null;
        this.entities = new Map();  // Store all entities with IDs
        this.nextId = 1;
        this.collisionCallbacks = [];
    }
    
    // Initialize world
    init() {
        // Create world without gravity
        this.world = planck.World(planck.Vec2(0, 0));
        
        // Set up collision listener
        this.world.on('begin-contact', (contact) => {
            this.handleCollision(contact);
        });
        
        // Create boundaries
        this.createBoundaries();
    }
    
    // Create world boundaries with rounded corners
    createBoundaries() {
        const w = CONFIG.WORLD_WIDTH;
        const h = CONFIG.WORLD_HEIGHT;
        const thickness = 0.2;
        const cornerRadius = Utils.toMeters(CONFIG.CORNER_RADIUS);
        
        // Create full walls (temporarily no corner reduction for debugging)
        // Top wall
        this.createWall(w/2, -thickness/2, w/2, thickness/2);
        // Bottom wall  
        this.createWall(w/2, h + thickness/2, w/2, thickness/2);
        // Left wall
        this.createWall(-thickness/2, h/2, thickness/2, h/2);
        // Right wall
        this.createWall(w + thickness/2, h/2, thickness/2, h/2);
        
        // Create concave rounded corners (circles positioned to create inward curves)
        const cornerPositions = [
            { x: cornerRadius, y: cornerRadius },              // Top-left
            { x: w - cornerRadius, y: cornerRadius },          // Top-right  
            { x: w - cornerRadius, y: h - cornerRadius },      // Bottom-right
            { x: cornerRadius, y: h - cornerRadius }           // Bottom-left
        ];
        
        // TEMPORARILY DISABLED: Round corners for debugging
        // cornerPositions.forEach(pos => {
        //     this.createConcaveCorner(pos.x, pos.y, cornerRadius);
        // });
    }
    
    // Create a wall
    createWall(x, y, halfWidth, halfHeight) {
        const body = this.world.createBody({
            type: 'static',
            position: planck.Vec2(x, y)
        });
        
        body.createFixture({
            shape: planck.Box(halfWidth, halfHeight),
            userData: { type: 'wall' },
            restitution: 1.0,  // Perfect bounce
            friction: 0
        });
        
        return body;
    }
    
    // Create a proper concave corner using thin arc segments
    createConcaveCorner(cornerX, cornerY, radius) {
        const segments = 16; // More segments for smoother curve
        const w = CONFIG.WORLD_WIDTH;
        const h = CONFIG.WORLD_HEIGHT;
        
        // Determine which corner and set appropriate angles for INWARD curve
        let startAngle, endAngle;
        if (cornerX < w/2 && cornerY < h/2) {
            // Top-left: inward curve 
            startAngle = Math.PI; endAngle = 3*Math.PI/2;
        } else if (cornerX > w/2 && cornerY < h/2) {
            // Top-right: inward curve
            startAngle = 3*Math.PI/2; endAngle = 2*Math.PI;
        } else if (cornerX > w/2 && cornerY > h/2) {
            // Bottom-right: inward curve
            startAngle = 0; endAngle = Math.PI/2;
        } else {
            // Bottom-left: inward curve
            startAngle = Math.PI/2; endAngle = Math.PI;
        }
        
        const angleStep = (endAngle - startAngle) / segments;
        
        // Create thin segments that don't overlap
        for (let i = 0; i < segments; i++) {
            const angle1 = startAngle + i * angleStep;
            const angle2 = startAngle + (i + 1) * angleStep;
            
            const x1 = cornerX + radius * Math.cos(angle1);
            const y1 = cornerY + radius * Math.sin(angle1);
            const x2 = cornerX + radius * Math.cos(angle2);
            const y2 = cornerY + radius * Math.sin(angle2);
            
            // Create wall segment between points
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            
            const body = this.world.createBody({
                type: 'static',
                position: planck.Vec2(midX, midY),
                angle: angle
            });
            
            body.createFixture({
                shape: planck.Box(length / 2, 0.02), // Much thinner segments!
                userData: { type: 'wall' },
                restitution: 1.0,
                friction: 0
            });
        }
    }
    
    // Create ball
    createBall(x, y, vx, vy) {
        const body = this.world.createBody({
            type: 'dynamic',
            position: planck.Vec2(x, y),
            linearVelocity: planck.Vec2(vx, vy),
            bullet: true,  // Enable CCD for fast moving balls
            fixedRotation: true
        });

        // Calculate density to achieve desired mass from config
        const ballArea = Math.PI * CONFIG.BALL.RADIUS * CONFIG.BALL.RADIUS;
        const ballDensity = CONFIG.BALL.MASS / ballArea;

        const fixture = body.createFixture({
            shape: planck.Circle(CONFIG.BALL.RADIUS),
            restitution: 1.0,  // Perfect bounce
            friction: 0,
            density: ballDensity,  // Use calculated density instead of setMassData
            userData: { type: 'ball' }
        });

        const id = this.nextId++;
        this.entities.set(id, { body, type: 'ball', id });
        body.setUserData({ id, type: 'ball' });

        return id;
    }
    
    // Create paddle (hexagon shape)
    createPaddle(x, y, isPlayer) {
        const vertices = Utils.getHexagonVertices(CONFIG.PADDLE.WIDTH, CONFIG.PADDLE.HEIGHT);
        const planckVertices = vertices.map(v => planck.Vec2(v.x, v.y));
        
        const body = this.world.createBody({
            type: 'kinematic',  // Controlled programmatically
            position: planck.Vec2(x, y)
        });
        
        body.createFixture({
            shape: planck.Polygon(planckVertices),
            restitution: 0.8,
            friction: 0,
            userData: { type: 'paddle', isPlayer }
        });
        
        const id = this.nextId++;
        const paddleType = isPlayer ? 'playerPaddle' : 'aiPaddle';
        this.entities.set(id, {
            body,
            type: paddleType,
            id,
            prevX: x  // Track previous position for momentum transfer
        });
        body.setUserData({ id, type: paddleType });
        
        return id;
    }
    
    // Create brick (iOS-style dynamic physics)
    createBrick(x, y, row, col, isPlayerTarget) {
        const body = this.world.createBody({
            type: 'dynamic',              // Changed from 'static' to 'dynamic'
            position: planck.Vec2(x, y),
            fixedRotation: false,         // Allow rotation for natural physics (same as iOS)
            linearDamping: CONFIG.BRICK.LINEAR_DAMPING,   // Stabilize movement
            angularDamping: CONFIG.BRICK.ANGULAR_DAMPING, // Prevent excessive spinning
            bullet: true                  // Enable CCD to prevent brick overlap/tunneling
        });

        const color = Utils.getBrickColor(row, isPlayerTarget);

        // Calculate density to achieve desired mass from config
        const brickArea = CONFIG.BRICK.WIDTH * CONFIG.BRICK.HEIGHT;
        const brickDensity = CONFIG.BRICK.MASS / brickArea;

        body.createFixture({
            shape: planck.Box(CONFIG.BRICK.WIDTH/2, CONFIG.BRICK.HEIGHT/2),
            userData: {
                type: 'brick',
                isPlayerTarget,
                row,
                col,
                color
            },
            density: brickDensity,  // Use calculated density for proper inertia
            restitution: CONFIG.BRICK.RESTITUTION, // Bounce factor
            friction: CONFIG.BRICK.FRICTION        // Surface friction
        });

        const id = this.nextId++;
        const brickType = isPlayerTarget ? 'playerTargetBrick' : 'aiTargetBrick';
        this.entities.set(id, { body, type: brickType, id, color, row, col });
        body.setUserData({ id, type: brickType });

        return id;
    }
    
    // Get entity by ID
    getEntity(id) {
        return this.entities.get(id);
    }
    
    // Get all entities of type
    getEntitiesOfType(type) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (entity.type === type) {
                result.push(entity);
            }
        }
        return result;
    }
    
    // Remove entity
    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            this.world.destroyBody(entity.body);
            this.entities.delete(id);
        }
    }
    
    // Move paddle
    movePaddle(paddleId, velocityX) {
        const entity = this.entities.get(paddleId);
        if (entity && (entity.type === 'playerPaddle' || entity.type === 'aiPaddle')) {
            // Store previous position for momentum calculation
            const currentPos = entity.body.getPosition();
            entity.prevX = currentPos.x;
            
            // Set velocity
            entity.body.setLinearVelocity(planck.Vec2(velocityX, 0));
            
            // Clamp position to screen bounds
            const nextX = currentPos.x + velocityX * CONFIG.TIMESTEP;
            const halfWidth = CONFIG.PADDLE.WIDTH / 2;
            
            if (nextX - halfWidth < 0 || nextX + halfWidth > CONFIG.WORLD_WIDTH) {
                // Stop at boundary
                const clampedX = Math.max(halfWidth, Math.min(CONFIG.WORLD_WIDTH - halfWidth, nextX));
                entity.body.setPosition(planck.Vec2(clampedX, currentPos.y));
                entity.body.setLinearVelocity(planck.Vec2(0, 0));
            }
        }
    }
    
    // Handle collision
    handleCollision(contact) {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();
        const bodyA = fixtureA.getBody();
        const bodyB = fixtureB.getBody();
        
        // Try both body and fixture userData (some objects use different sources)
        const dataA = bodyA.getUserData() || fixtureA.getUserData();
        const dataB = bodyB.getUserData() || fixtureB.getUserData();
        
        if (!dataA || !dataB) return;
        
        // Ball-Brick collision
        if ((dataA.type === 'ball' && (dataB.type === 'playerTargetBrick' || dataB.type === 'aiTargetBrick')) ||
            (dataB.type === 'ball' && (dataA.type === 'playerTargetBrick' || dataA.type === 'aiTargetBrick'))) {

            const ballData = dataA.type === 'ball' ? dataA : dataB;
            const brickData = dataA.type === 'ball' ? dataB : dataA;

            // Queue brick for removal
            this.collisionCallbacks.push({
                type: 'brickHit',
                brickId: brickData.id,
                ballId: ballData.id,
                isPlayerTarget: brickData.type === 'playerTargetBrick'
            });
        }
        
        // Ball-Paddle collision
        if ((dataA.type === 'ball' && (dataB.type === 'playerPaddle' || dataB.type === 'aiPaddle')) ||
            (dataB.type === 'ball' && (dataA.type === 'playerPaddle' || dataA.type === 'aiPaddle'))) {
            
            const ballBody = dataA.type === 'ball' ? bodyA : bodyB;
            const paddleData = dataA.type === 'ball' ? dataB : dataA;
            const paddleEntity = this.entities.get(paddleData.id);
            
            if (paddleEntity) {
                // Calculate paddle momentum
                const paddlePos = paddleEntity.body.getPosition();
                const paddleMomentum = (paddlePos.x - paddleEntity.prevX) / CONFIG.TIMESTEP;
                
                // Add paddle momentum to ball (reduced effect)
                const ballVel = ballBody.getLinearVelocity();
                const currentSpeed = ballVel.length();
                
                // Only add momentum if ball is not at max speed
                if (currentSpeed < CONFIG.BALL.MAX_SPEED * 0.9) {
                    ballBody.setLinearVelocity(planck.Vec2(
                        ballVel.x + paddleMomentum * CONFIG.PADDLE.MOMENTUM_TRANSFER,
                        ballVel.y
                    ));
                }
                
                // Ensure minimum vertical velocity
                const newVel = ballBody.getLinearVelocity();
                if (Math.abs(newVel.y) < 2) {
                    const sign = paddleData.type === 'playerPaddle' ? 1 : -1;  // Player is top, AI is bottom
                    ballBody.setLinearVelocity(planck.Vec2(
                        newVel.x,
                        sign * 2
                    ));
                }
                
                this.collisionCallbacks.push({
                    type: 'paddleHit',
                    paddleType: paddleData.type
                });
            }
        }
        
        // Ball-Wall collision
        if ((dataA.type === 'ball' && dataB.type === 'wall') ||
            (dataB.type === 'ball' && dataA.type === 'wall')) {

            const ballBody = dataA.type === 'ball' ? bodyA : bodyB;

            // Store pre-collision velocity for angle restoration
            const preCollisionVel = ballBody.getLinearVelocity();
            const preCollisionSpeed = preCollisionVel.length();
            
            // Fix collision resolution destroying angles
            setTimeout(() => {
                const postVel = ballBody.getLinearVelocity();
                const postSpeed = postVel.length();
                
                // Check if collision destroyed the angle (became too vertical or horizontal)
                const absX = Math.abs(postVel.x);
                const absY = Math.abs(postVel.y);
                const ratio = Math.min(absX, absY) / Math.max(absX, absY);
                
                // If angle became too shallow (ratio < 0.1 means less than ~6 degrees)
                if (ratio < 0.1 && postSpeed > 0.5) {
                    // Restore some angle based on pre-collision direction
                    const targetSpeed = Math.max(preCollisionSpeed, CONFIG.BALL.BASE_SPEED);
                    
                    let newVelX, newVelY;
                    if (absX < absY) {
                        // Too vertical, add horizontal component
                        const sign = Math.sign(preCollisionVel.x) || (Math.random() > 0.5 ? 1 : -1);
                        newVelX = sign * targetSpeed * 0.3; // 30% horizontal
                        newVelY = Math.sign(postVel.y) * targetSpeed * 0.95; // 95% vertical
                    } else {
                        // Too horizontal, add vertical component
                        const sign = Math.sign(preCollisionVel.y) || (Math.random() > 0.5 ? 1 : -1);
                        newVelX = Math.sign(postVel.x) * targetSpeed * 0.95; // 95% horizontal
                        newVelY = sign * targetSpeed * 0.3; // 30% vertical
                    }

                    ballBody.setLinearVelocity(planck.Vec2(newVelX, newVelY));
                }
                // Energy compensation if speed dropped too much
                else if (postSpeed < preCollisionSpeed * 0.8) {
                    const boostFactor = Math.max(1.1, preCollisionSpeed / postSpeed);
                    ballBody.setLinearVelocity(planck.Vec2(
                        postVel.x * boostFactor,
                        postVel.y * boostFactor
                    ));
                }
            }, 1);
            
            this.collisionCallbacks.push({
                type: 'wallHit'
            });
        }
    }
    
    // Step physics and process callbacks
    step() {
        // Sub-stepping: Break down each frame into smaller steps for more accurate collision detection
        // This prevents tunneling and overlap issues with many dynamic rotating bodies
        const subSteps = 2;  // 2 sub-steps per frame (60fps → 120 physics steps/sec)
        const subTimeStep = CONFIG.TIMESTEP / subSteps;

        for (let i = 0; i < subSteps; i++) {
            this.world.step(subTimeStep, CONFIG.VELOCITY_ITERATIONS, CONFIG.POSITION_ITERATIONS);
        }

        // Update paddle previous positions
        ['playerPaddle', 'aiPaddle'].forEach(type => {
            const paddles = this.getEntitiesOfType(type);
            paddles.forEach(paddle => {
                const pos = paddle.body.getPosition();
                paddle.prevX = pos.x;
            });
        });
        
        // Limit ball speeds
        this.limitBallSpeeds();

        // Process collision callbacks
        const callbacks = this.collisionCallbacks.slice();
        this.collisionCallbacks = [];
        
        return callbacks;
    }
    
    // Limit and decay ball speeds
    limitBallSpeeds() {
        const balls = this.getEntitiesOfType('ball');
        balls.forEach(ball => {
            const vel = ball.body.getLinearVelocity();
            const speed = vel.length();
            
            // Apply hard limit at MAX_SPEED
            if (speed > CONFIG.BALL.MAX_SPEED) {
                const factor = CONFIG.BALL.MAX_SPEED / speed;
                ball.body.setLinearVelocity(planck.Vec2(vel.x * factor, vel.y * factor));
            }
            // Apply minimum speed
            else if (speed < CONFIG.BALL.MIN_SPEED && speed > 0) {
                const factor = CONFIG.BALL.MIN_SPEED / speed;
                ball.body.setLinearVelocity(planck.Vec2(vel.x * factor, vel.y * factor));
            }
            // Gradual decay when above base speed
            else if (speed > CONFIG.BALL.DECAY_THRESHOLD) {
                // Apply decay to gradually return to base speed
                const decayFactor = CONFIG.BALL.SPEED_DECAY;
                const targetSpeed = speed * decayFactor;
                
                // Don't decay below base speed
                if (targetSpeed > CONFIG.BALL.BASE_SPEED) {
                    const factor = targetSpeed / speed;
                    ball.body.setLinearVelocity(planck.Vec2(vel.x * factor, vel.y * factor));
                }
            }
            
        });
    }
    
    // Clear all entities
    clear() {
        // Check if world exists
        if (this.world) {
            // Destroy all bodies
            let body = this.world.getBodyList();
            while (body) {
                const next = body.getNext();
                this.world.destroyBody(body);
                body = next;
            }
        }
        
        // Clear entity map
        this.entities.clear();
        this.nextId = 1;
        this.collisionCallbacks = [];
    }
    
    // Get world for debugging
    getWorld() {
        return this.world;
    }
}
