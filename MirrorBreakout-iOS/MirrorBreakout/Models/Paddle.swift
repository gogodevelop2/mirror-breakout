import SwiftUI
import Foundation

struct Paddle {
    var center: CGPoint
    let width: CGFloat
    let height: CGFloat
    let isPlayer: Bool
    
    // AI movement
    private var targetX: CGFloat
    private var velocity: CGFloat = 0
    
    init(isPlayer: Bool) {
        self.isPlayer = isPlayer
        self.width = GameConfig.Paddle.width
        self.height = GameConfig.Paddle.height
        
        let centerX = GameConfig.centerX()
        let y = isPlayer ? GameConfig.Paddle.playerY : GameConfig.Paddle.aiY
        
        self.center = CGPoint(x: centerX, y: y)
        self.targetX = centerX
    }
    
    mutating func moveTo(x: CGFloat) {
        let halfWidth = width / 2
        let newX = max(halfWidth, min(GameConfig.screenWidth - halfWidth, x))
        center.x = newX
    }
    
    mutating func updateAI(ballPosition: CGPoint, deltaTime: Double) {
        guard !isPlayer else { return }
        
        // Simple AI: follow ball X position
        targetX = ballPosition.x
        
        // Smooth movement towards target
        let distance = targetX - center.x
        let maxSpeed = GameConfig.Paddle.maxSpeed
        
        if abs(distance) > 1 {
            let direction: CGFloat = distance > 0 ? 1 : -1
            velocity = direction * maxSpeed * 0.8 // AI moves at 80% max speed
        } else {
            velocity = 0
        }
        
        // Update position
        let newX = center.x + velocity * deltaTime
        moveTo(x: newX)
    }
    
    // Computed properties for easier access
    var left: CGFloat {
        center.x - width / 2
    }
    
    var right: CGFloat {
        center.x + width / 2
    }
    
    var top: CGFloat {
        center.y - height / 2
    }
    
    var bottom: CGFloat {
        center.y + height / 2
    }
}