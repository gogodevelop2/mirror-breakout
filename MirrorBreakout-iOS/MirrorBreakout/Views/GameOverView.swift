import SwiftUI

struct GameOverView: View {
    let playerWon: Bool
    let onRestart: () -> Void
    let onMainMenu: () -> Void
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Result Message
            VStack(spacing: 20) {
                Text(playerWon ? "승리!" : "패배!")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(playerWon ? .green : .red)
                
                Text(playerWon ? "플레이어 승리" : "AI 승리")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
            }
            
            Spacer()
            
            // Buttons
            VStack(spacing: 20) {
                Button(action: onRestart) {
                    Text("다시 하기")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 40)
                        .padding(.vertical, 15)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.blue)
                        )
                }
                
                Button(action: onMainMenu) {
                    Text("메인 메뉴")
                        .font(.system(size: 18))
                        .foregroundColor(.gray)
                        .padding(.horizontal, 30)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray, lineWidth: 1)
                        )
                }
            }
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    Group {
        // Player Win Preview
        ZStack {
            Color.black.ignoresSafeArea()
            GameOverView(playerWon: true, onRestart: {}, onMainMenu: {})
        }
        
        // AI Win Preview
        ZStack {
            Color.black.ignoresSafeArea()
            GameOverView(playerWon: false, onRestart: {}, onMainMenu: {})
        }
    }
}