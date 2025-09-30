import SwiftUI
import Foundation

// Game phases
enum GamePhase {
    case countdown
    case playing
    case paused
    case gameOver
}

// Game state management
class GameState: ObservableObject {
    @Published var phase: GamePhase = .countdown
    @Published var countdownValue: Int = 3
    @Published var gameTime: Double = 0
    @Published var playerScore: Int = 0
    @Published var aiScore: Int = 0
    @Published var playerWon: Bool = false
    
    // Game objects
    @Published var ball: Ball = Ball()
    @Published var playerPaddle: Paddle = Paddle(isPlayer: true)
    @Published var aiPaddle: Paddle = Paddle(isPlayer: false)
    @Published var playerBricks: [Brick] = []
    @Published var aiBricks: [Brick] = []
    
    // Game timing
    private var lastUpdateTime: Date = Date()
    private var countdownStartTime: Date = Date()
    private var gameStartTime: Date = Date()
    
    init() {
        reset()
    }
    
    func reset() {
        phase = .countdown
        countdownValue = Int(GameConfig.Game.countdownDuration)
        gameTime = 0
        playerScore = 0
        aiScore = 0
        playerWon = false
        
        // Reset game objects
        ball = Ball()
        playerPaddle = Paddle(isPlayer: true)
        aiPaddle = Paddle(isPlayer: false)
        
        // Create bricks
        createBricks()
        
        // Reset timing
        countdownStartTime = Date()
        lastUpdateTime = Date()
    }
    
    func startCountdown() {
        phase = .countdown
        countdownStartTime = Date()
    }
    
    func startGame() {
        phase = .playing
        gameStartTime = Date()
        lastUpdateTime = Date()
    }
    
    func endGame(playerWon: Bool) {
        self.playerWon = playerWon
        phase = .gameOver
    }
    
    func update() {
        let currentTime = Date()
        let deltaTime = currentTime.timeIntervalSince(lastUpdateTime)
        lastUpdateTime = currentTime
        
        switch phase {
        case .countdown:
            updateCountdown(currentTime: currentTime)
        case .playing:
            updateGame(deltaTime: deltaTime)
        case .paused, .gameOver:
            break
        }
    }
    
    private func updateCountdown(currentTime: Date) {
        let elapsed = currentTime.timeIntervalSince(countdownStartTime)
        let remaining = GameConfig.Game.countdownDuration - elapsed
        
        if remaining <= 0 {
            startGame()
        } else {
            countdownValue = Int(ceil(remaining))
        }
    }
    
    private func updateGame(deltaTime: Double) {
        gameTime = Date().timeIntervalSince(gameStartTime)
        
        // Update ball
        ball.update(deltaTime: deltaTime)
        
        // Update AI paddle
        aiPaddle.updateAI(ballPosition: ball.position, deltaTime: deltaTime)
        
        // Check collisions
        checkCollisions()
        
        // Check win conditions
        if playerBricks.isEmpty {
            endGame(playerWon: true)
        } else if aiBricks.isEmpty {
            endGame(playerWon: false)
        }
        
        // Check if ball is out of bounds (game over condition)
        if ball.position.y < -50 || ball.position.y > GameConfig.screenHeight + 50 {
            // Reset ball position
            ball.reset()
        }
    }
    
    private func checkCollisions() {
        // Ball vs Player Paddle
        if ball.intersects(with: playerPaddle) {
            ball.bounceOffPaddle(paddle: playerPaddle)
        }
        
        // Ball vs AI Paddle
        if ball.intersects(with: aiPaddle) {
            ball.bounceOffPaddle(paddle: aiPaddle)
        }
        
        // Ball vs Player Bricks
        for (index, brick) in playerBricks.enumerated() {
            if ball.intersects(with: brick) {
                ball.bounceOffBrick(brick: brick)
                playerBricks.remove(at: index)
                playerScore += 10
                break
            }
        }
        
        // Ball vs AI Bricks
        for (index, brick) in aiBricks.enumerated() {
            if ball.intersects(with: brick) {
                ball.bounceOffBrick(brick: brick)
                aiBricks.remove(at: index)
                aiScore += 10
                break
            }
        }
        
        // Ball vs Walls
        ball.bounceOffWalls()
    }
    
    private func createBricks() {
        playerBricks.removeAll()
        aiBricks.removeAll()
        
        let startX = GameConfig.brickGridStartX()
        
        // Create player bricks (top)
        for row in 0..<GameConfig.Brick.rows {
            for col in 0..<GameConfig.Brick.cols {
                let x = startX + CGFloat(col) * (GameConfig.Brick.width + GameConfig.Brick.gapX)
                let y = GameConfig.Brick.playerStartY + CGFloat(row) * (GameConfig.Brick.height + GameConfig.Brick.gapY)
                
                let brick = Brick(
                    position: CGPoint(x: x, y: y),
                    isPlayerBrick: true
                )
                playerBricks.append(brick)
            }
        }
        
        // Create AI bricks (bottom)
        for row in 0..<GameConfig.Brick.rows {
            for col in 0..<GameConfig.Brick.cols {
                let x = startX + CGFloat(col) * (GameConfig.Brick.width + GameConfig.Brick.gapX)
                let y = GameConfig.Brick.aiStartY + CGFloat(row) * (GameConfig.Brick.height + GameConfig.Brick.gapY)
                
                let brick = Brick(
                    position: CGPoint(x: x, y: y),
                    isPlayerBrick: false
                )
                aiBricks.append(brick)
            }
        }
    }
    
    // Player input handling
    func movePlayerPaddle(to x: CGFloat) {
        playerPaddle.moveTo(x: x)
    }
}