import SwiftUI

struct MenuView: View {
    let onStartGame: () -> Void
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Game Title
            VStack(spacing: 10) {
                Text("Mirror")
                    .font(.system(size: 48, weight: .bold, design: .default))
                    .foregroundColor(.white)
                
                Text("Breakout")
                    .font(.system(size: 48, weight: .bold, design: .default))
                    .foregroundColor(.cyan)
            }
            
            Spacer()
            
            // Start Button
            Button(action: onStartGame) {
                Text("START")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 40)
                    .padding(.vertical, 15)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.cyan)
                    )
            }
            
            // Game Description
            VStack(spacing: 8) {
                Text("플레이어 vs AI")
                    .font(.system(size: 16))
                    .foregroundColor(.gray)
                
                Text("화면을 터치해서 패들을 조작하세요")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    ZStack {
        LinearGradient(
            colors: [
                Color(red: 0/255, green: 17/255, blue: 51/255),
                Color(red: 0/255, green: 5/255, blue: 17/255)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
        
        MenuView(onStartGame: {})
    }
}