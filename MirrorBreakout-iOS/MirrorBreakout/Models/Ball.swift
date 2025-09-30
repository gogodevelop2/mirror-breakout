import SwiftUI
import Foundation

struct Ball {
    var position: CGPoint
    var velocity: CGPoint
    var radius: CGFloat
    
    init() {
        self.radius = GameConfig.Ball.radius
        self.position = CGPoint(
            x: GameConfig.centerX(),
            y: GameConfig.centerY()
        )
        
        // Initial velocity - random angle upward for player
        let angle = Double.random(in: -Double.pi/4...Double.pi/4) // -45 to 45 degrees
        let speed = GameConfig.Ball.initialSpeed
        self.velocity = CGPoint(
            x: sin(angle) * speed,
            y: -cos(angle) * speed // Negative for upward movement
        )
    }
    
    mutating func update(deltaTime: Double) {
        // Update position based on velocity
        position.x += velocity.x * deltaTime
        position.y += velocity.y * deltaTime
        
        // Limit speed
        limitSpeed()
    }
    
    mutating func reset() {
        position = CGPoint(
            x: GameConfig.centerX(),
            y: GameConfig.centerY()
        )
        
        // Random initial direction
        let angle = Double.random(in: -Double.pi/4...Double.pi/4)
        let speed = GameConfig.Ball.initialSpeed
        velocity = CGPoint(
            x: sin(angle) * speed,
            y: -cos(angle) * speed
        )
    }
    
    mutating func bounceOffWalls() {
        let radius = self.radius
        
        // Left wall
        if position.x - radius <= 0 {
            position.x = radius
            velocity.x = abs(velocity.x)
        }
        
        // Right wall
        if position.x + radius >= GameConfig.screenWidth {
            position.x = GameConfig.screenWidth - radius
            velocity.x = -abs(velocity.x)
        }
        
        // Top wall
        if position.y - radius <= 0 {
            position.y = radius
            velocity.y = abs(velocity.y)
        }
        
        // Bottom wall
        if position.y + radius >= GameConfig.screenHeight {
            position.y = GameConfig.screenHeight - radius
            velocity.y = -abs(velocity.y)
        }
    }
    
    mutating func bounceOffPaddle(paddle: Paddle) {
        // Simple bounce calculation
        let relativeX = (position.x - paddle.center.x) / (paddle.width / 2)
        let bounceAngle = relativeX * Double.pi / 3 // Max 60 degree angle
        
        let speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        
        if paddle.isPlayer {
            // Player paddle - ball goes up
            velocity.x = sin(bounceAngle) * speed
            velocity.y = -abs(cos(bounceAngle) * speed)
            
            // Position ball above paddle
            position.y = paddle.center.y - paddle.height/2 - radius
        } else {
            // AI paddle - ball goes down
            velocity.x = sin(bounceAngle) * speed
            velocity.y = abs(cos(bounceAngle) * speed)
            
            // Position ball below paddle
            position.y = paddle.center.y + paddle.height/2 + radius
        }
    }
    
    mutating func bounceOffBrick(brick: Brick) {
        // Simple brick collision - just reverse Y velocity
        velocity.y = -velocity.y
        
        // Move ball outside of brick to prevent sticking
        if velocity.y > 0 {
            position.y = brick.position.y + brick.height + radius
        } else {
            position.y = brick.position.y - radius
        }
    }
    
    private mutating func limitSpeed() {
        let currentSpeed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        
        if currentSpeed > GameConfig.Ball.maxSpeed {
            let scale = GameConfig.Ball.maxSpeed / currentSpeed
            velocity.x *= scale
            velocity.y *= scale
        } else if currentSpeed < GameConfig.Ball.minSpeed && currentSpeed > 0 {
            let scale = GameConfig.Ball.minSpeed / currentSpeed
            velocity.x *= scale
            velocity.y *= scale
        }
    }
    
    // Collision detection
    func intersects(with paddle: Paddle) -> Bool {
        let ballLeft = position.x - radius
        let ballRight = position.x + radius
        let ballTop = position.y - radius
        let ballBottom = position.y + radius
        
        let paddleLeft = paddle.center.x - paddle.width / 2
        let paddleRight = paddle.center.x + paddle.width / 2
        let paddleTop = paddle.center.y - paddle.height / 2
        let paddleBottom = paddle.center.y + paddle.height / 2
        
        return ballRight >= paddleLeft &&
               ballLeft <= paddleRight &&
               ballBottom >= paddleTop &&
               ballTop <= paddleBottom
    }
    
    func intersects(with brick: Brick) -> Bool {
        let ballLeft = position.x - radius
        let ballRight = position.x + radius
        let ballTop = position.y - radius
        let ballBottom = position.y + radius
        
        let brickLeft = brick.position.x
        let brickRight = brick.position.x + brick.width
        let brickTop = brick.position.y
        let brickBottom = brick.position.y + brick.height
        
        return ballRight >= brickLeft &&
               ballLeft <= brickRight &&
               ballBottom >= brickTop &&
               ballTop <= brickBottom
    }
}