import SwiftUI

struct ContentView: View {
    @State private var currentView: GameScreen = .menu
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0/255, green: 17/255, blue: 51/255),
                    Color(red: 0/255, green: 5/255, blue: 17/255),
                    Color(red: 17/255, green: 0/255, blue: 17/255)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            switch currentView {
            case .menu:
                MenuView(onStartGame: {
                    currentView = .game
                })
            case .game:
                GameView(onGameEnd: { won in
                    currentView = .gameOver(won: won)
                })
            case .gameOver(let won):
                GameOverView(
                    playerWon: won,
                    onRestart: {
                        currentView = .game
                    },
                    onMainMenu: {
                        currentView = .menu
                    }
                )
            }
        }
    }
}

enum GameScreen {
    case menu
    case game
    case gameOver(won: Bool)
}

#Preview {
    ContentView()
}