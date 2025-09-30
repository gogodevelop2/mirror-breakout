import SwiftUI

struct Brick: Identifiable {
    let id = UUID()
    let position: CGPoint
    let width: CGFloat
    let height: CGFloat
    let isPlayerBrick: Bool
    
    init(position: CGPoint, isPlayerBrick: Bool) {
        self.position = position
        self.width = GameConfig.Brick.width
        self.height = GameConfig.Brick.height
        self.isPlayerBrick = isPlayerBrick
    }
    
    var color: Color {
        isPlayerBrick ? GameConfig.Colors.playerBricks : GameConfig.Colors.aiBricks
    }
    
    var rect: CGRect {
        CGRect(
            x: position.x,
            y: position.y,
            width: width,
            height: height
        )
    }
    
    // Computed properties for easier collision detection
    var left: CGFloat { position.x }
    var right: CGFloat { position.x + width }
    var top: CGFloat { position.y }
    var bottom: CGFloat { position.y + height }
    var centerX: CGFloat { position.x + width / 2 }
    var centerY: CGFloat { position.y + height / 2 }
}