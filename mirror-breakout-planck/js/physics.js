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
    
    // Create world boundaries
    createBoundaries() {
        const w = CONFIG.WORLD_WIDTH;
        const h = CONFIG.WORLD_HEIGHT;
        const thickness = 0.1;
        
        // Top wall
        this.createWall(w/2, -thickness/2, w/2, thickness/2);
        // Bottom wall
        this.createWall(w/2, h + thickness/2, w/2, thickness/2);
        // Left wall
        this.createWall(-thickness/2, h/2, thickness/2, h/2);
        // Right wall
        this.createWall(w + thickness/2, h/2, thickness/2, h/2);
    }
    
    // Create a wall
    createWall(x, y, halfWidth, halfHeight) {
        const body = this.world.createBody({
            type: 'static',
            position: planck.Vec2(x, y)
        });
        
        body.createFixture({
            shape: planck.Box(halfWidth, halfHeight),
            userData: { type: 'wall' }
        });
        
        return body;
    }
    
    // Create ball
    createBall(x, y, vx, vy) {
        const body = this.world.createBody({
            type: 'dynamic',
            position: planck.Vec2(x, y),
            linearVelocity: planck.Vec2(vx, vy),
            bullet: true,  // Enable CCD
            fixedRotation: true
        });
        
        body.createFixture({
            shape: planck.Circle(CONFIG.BALL.RADIUS),
            restitution: 1.0,  // Perfect bounce
            friction: 0,
            density: 1,
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
            userData: { type: 'paddle', isPlayer }
        });
        
        const id = this.nextId++;
        const paddleType = isPlayer ? 'playerPaddle' : 'aiPaddle';
        this.entities.set(id, { body, type: paddleType, id });
        body.setUserData({ id, type: paddleType });
        
        return id;
    }
    
    // Create brick
    createBrick(x, y, row, col, isPlayerSide) {
        const body = this.world.createBody({
            type: 'static',
            position: planck.Vec2(x, y)
        });
        
        const color = Utils.getBrickColor(row, isPlayerSide);
        
        body.createFixture({
            shape: planck.Box(CONFIG.BRICK.WIDTH/2, CONFIG.BRICK.HEIGHT/2),
            userData: {
                type: 'brick',
                isPlayerSide,
                row,
                col,
                color
            }
        });
        
        const id = this.nextId++;
        const brickType = isPlayerSide ? 'playerBrick' : 'aiBrick';
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
            entity.body.setLinearVelocity(planck.Vec2(velocityX, 0));
        }
    }
    
    // Handle collision
    handleCollision(contact) {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();
        const bodyA = fixtureA.getBody();
        const bodyB = fixtureB.getBody();
        const dataA = bodyA.getUserData();
        const dataB = bodyB.getUserData();
        
        if (!dataA || !dataB) return;
        
        // Ball-Brick collision
        if ((dataA.type === 'ball' && (dataB.type === 'playerBrick' || dataB.type === 'aiBrick')) ||
            (dataB.type === 'ball' && (dataA.type === 'playerBrick' || dataA.type === 'aiBrick'))) {
            
            const ballData = dataA.type === 'ball' ? dataA : dataB;
            const brickData = dataA.type === 'ball' ? dataB : dataA;
            
            // Queue brick for removal
            this.collisionCallbacks.push({
                type: 'brickHit',
                brickId: brickData.id,
                ballId: ballData.id,
                isPlayerBrick: brickData.type === 'playerBrick'
            });
        }
        
        // Ball-Paddle collision
        if ((dataA.type === 'ball' && (dataB.type === 'playerPaddle' || dataB.type === 'aiPaddle')) ||
            (dataB.type === 'ball' && (dataA.type === 'playerPaddle' || dataA.type === 'aiPaddle'))) {
            
            const ballBody = dataA.type === 'ball' ? bodyA : bodyB;
            const paddleBody = dataA.type === 'ball' ? bodyB : bodyA;
            
            // Add paddle momentum to ball
            const paddleVel = paddleBody.getLinearVelocity();
            const ballVel = ballBody.getLinearVelocity();
            
            ballBody.setLinearVelocity(planck.Vec2(
                ballVel.x + paddleVel.x * CONFIG.PADDLE.MOMENTUM_TRANSFER,
                ballVel.y
            ));
            
            this.collisionCallbacks.push({
                type: 'paddleHit',
                paddleType: dataA.type === 'ball' ? dataB.type : dataA.type
            });
        }
    }
    
    // Step physics and process callbacks
    step() {
        // Step physics
        this.world.step(CONFIG.TIMESTEP, CONFIG.VELOCITY_ITERATIONS, CONFIG.POSITION_ITERATIONS);
        
        // Limit ball speeds
        this.limitBallSpeeds();
        
        // Process collision callbacks
        const callbacks = this.collisionCallbacks.slice();
        this.collisionCallbacks = [];
        
        return callbacks;
    }
    
    // Limit ball speeds
    limitBallSpeeds() {
        const balls = this.getEntitiesOfType('ball');
        balls.forEach(ball => {
            const vel = ball.body.getLinearVelocity();
            const speed = vel.length();
            
            if (speed > CONFIG.BALL.MAX_SPEED) {
                const factor = CONFIG.BALL.MAX_SPEED / speed;
                ball.body.setLinearVelocity(planck.Vec2(vel.x * factor, vel.y * factor));
            } else if (speed < CONFIG.BALL.MIN_SPEED && speed > 0) {
                const factor = CONFIG.BALL.MIN_SPEED / speed;
                ball.body.setLinearVelocity(planck.Vec2(vel.x * factor, vel.y * factor));
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
