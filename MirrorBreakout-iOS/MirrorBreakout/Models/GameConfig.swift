import SwiftUI

struct GameConfig {
    // Screen dimensions will be set dynamically based on device
    static var screenWidth: CGFloat = 400
    static var screenHeight: CGFloat = 700
    
    // Game objects dimensions (relative to screen)
    struct Ball {
        static let radius: CGFloat = 8
        static let initialSpeed: CGFloat = 300 // pixels per second
        static let maxSpeed: CGFloat = 600
        static let minSpeed: CGFloat = 200
    }
    
    struct Paddle {
        static let width: CGFloat = 80
        static let height: CGFloat = 12
        static let playerY: CGFloat = 550 // from top
        static let aiY: CGFloat = 150     // from top
        static let maxSpeed: CGFloat = 400 // pixels per second
    }
    
    struct Brick {
        static let width: CGFloat = 55
        static let height: CGFloat = 18
        static let rows: Int = 6
        static let cols: Int = 7
        static let gapX: CGFloat = 3
        static let gapY: CGFloat = 3
        
        // Player bricks (top)
        static let playerStartY: CGFloat = 50
        
        // AI bricks (bottom) 
        static let aiStartY: CGFloat = 500
    }
    
    struct Game {
        static let targetFPS: Double = 60
        static let splitTime: Double = 10 // seconds
        static let countdownDuration: Double = 3
    }
    
    struct Colors {
        static let player = Color.blue
        static let ai = Color.red
        static let ball = Color.white
        static let playerBricks = Color.cyan
        static let aiBricks = Color.pink
        static let background = LinearGradient(
            colors: [
                Color(red: 0/255, green: 17/255, blue: 51/255),
                Color(red: 0/255, green: 5/255, blue: 17/255),
                Color(red: 17/255, green: 0/255, blue: 17/255)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    // Update screen dimensions based on available space
    static func updateScreenSize(width: CGFloat, height: CGFloat) {
        screenWidth = width
        screenHeight = height
        
        // Adjust object positions based on new screen size
        // This ensures the game scales properly on different devices
    }
}

// Utility functions
extension GameConfig {
    static func centerX() -> CGFloat {
        screenWidth / 2
    }
    
    static func centerY() -> CGFloat {
        screenHeight / 2
    }
    
    static func brickGridWidth() -> CGFloat {
        CGFloat(Brick.cols) * Brick.width + CGFloat(Brick.cols - 1) * Brick.gapX
    }
    
    static func brickGridStartX() -> CGFloat {
        (screenWidth - brickGridWidth()) / 2
    }
}