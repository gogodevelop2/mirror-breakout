import SwiftUI

struct GameView: View {
    @StateObject private var gameState = GameState()
    @State private var gameTimer: Timer?
    
    let onGameEnd: (Bool) -> Void
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background
                GameConfig.Colors.background
                    .ignoresSafeArea()
                
                // Game Canvas
                Canvas { context, size in
                    // Update screen size in config
                    GameConfig.updateScreenSize(width: size.width, height: size.height)
                    
                    drawGame(context: context, size: size)
                }
                .onTapGesture { location in
                    handleTap(at: location)
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            gameState.movePlayerPaddle(to: value.location.x)
                        }
                )
                
                // UI Overlay
                VStack {
                    // Score
                    HStack {
                        VStack {
                            Text("플레이어")
                                .font(.caption)
                                .foregroundColor(.white)
                            Text("\(gameState.playerScore)")
                                .font(.title2)
                                .bold()
                                .foregroundColor(.cyan)
                        }
                        
                        Spacer()
                        
                        // Game Time
                        Text(String(format: "%.0f", gameState.gameTime))
                            .font(.title3)
                            .foregroundColor(.white)
                        
                        Spacer()
                        
                        VStack {
                            Text("AI")
                                .font(.caption)
                                .foregroundColor(.white)
                            Text("\(gameState.aiScore)")
                                .font(.title2)
                                .bold()
                                .foregroundColor(.pink)
                        }
                    }
                    .padding()
                    
                    Spacer()
                    
                    // Countdown overlay
                    if gameState.phase == .countdown {
                        Text("\(gameState.countdownValue)")
                            .font(.system(size: 80, weight: .bold))
                            .foregroundColor(.white)
                            .animation(.easeInOut(duration: 0.3), value: gameState.countdownValue)
                    }
                    
                    Spacer()
                }
            }
        }
        .onAppear {
            startGameLoop()
        }
        .onDisappear {
            stopGameLoop()
        }
        .onChange(of: gameState.phase) { phase in
            if phase == .gameOver {
                stopGameLoop()
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    onGameEnd(gameState.playerWon)
                }
            }
        }
    }
    
    private func drawGame(context: GraphicsContext, size: CGSize) {
        // Draw ball
        drawBall(context: context)
        
        // Draw paddles
        drawPaddles(context: context)
        
        // Draw bricks
        drawBricks(context: context)
    }
    
    private func drawBall(context: GraphicsContext) {
        let ball = gameState.ball
        let ballRect = CGRect(
            x: ball.position.x - ball.radius,
            y: ball.position.y - ball.radius,
            width: ball.radius * 2,
            height: ball.radius * 2
        )
        
        context.fill(
            Path(ellipseIn: ballRect),
            with: .color(GameConfig.Colors.ball)
        )
    }
    
    private func drawPaddles(context: GraphicsContext) {
        // Player paddle
        let playerPaddle = gameState.playerPaddle
        let playerRect = CGRect(
            x: playerPaddle.left,
            y: playerPaddle.top,
            width: playerPaddle.width,
            height: playerPaddle.height
        )
        
        context.fill(
            Path(roundedRect: playerRect, cornerRadius: 6),
            with: .color(GameConfig.Colors.player)
        )
        
        // AI paddle
        let aiPaddle = gameState.aiPaddle
        let aiRect = CGRect(
            x: aiPaddle.left,
            y: aiPaddle.top,
            width: aiPaddle.width,
            height: aiPaddle.height
        )
        
        context.fill(
            Path(roundedRect: aiRect, cornerRadius: 6),
            with: .color(GameConfig.Colors.ai)
        )
    }
    
    private func drawBricks(context: GraphicsContext) {
        // Player bricks
        for brick in gameState.playerBricks {
            let brickRect = CGRect(
                x: brick.position.x,
                y: brick.position.y,
                width: brick.width,
                height: brick.height
            )
            
            context.fill(
                Path(roundedRect: brickRect, cornerRadius: 3),
                with: .color(brick.color)
            )
        }
        
        // AI bricks
        for brick in gameState.aiBricks {
            let brickRect = CGRect(
                x: brick.position.x,
                y: brick.position.y,
                width: brick.width,
                height: brick.height
            )
            
            context.fill(
                Path(roundedRect: brickRect, cornerRadius: 3),
                with: .color(brick.color)
            )
        }
    }
    
    private func handleTap(at location: CGPoint) {
        gameState.movePlayerPaddle(to: location.x)
    }
    
    private func startGameLoop() {
        gameTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / GameConfig.Game.targetFPS, repeats: true) { _ in
            gameState.update()
        }
    }
    
    private func stopGameLoop() {
        gameTimer?.invalidate()
        gameTimer = nil
    }
}

#Preview {
    GameView { won in
        print("Game ended. Player won: \(won)")
    }
}