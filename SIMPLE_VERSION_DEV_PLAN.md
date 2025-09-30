# MirrorBreakout iOS - 단순화 버전 개발 계획

## 프로젝트 개요

**목표**: 복잡한 구조 없이 작동하는 기본 브레이크아웃 게임 제작
**기술 스택**: SwiftUI + Canvas (Metal 없이)
**개발 원칙**: 단순성, 안정성, 점진적 개발

---

## 1. 프로젝트 구조

```
MirrorBreakout/
├── MirrorBreakoutApp.swift      # 앱 진입점
├── Views/
│   ├── GameView.swift           # 메인 게임 화면
│   └── GameOverView.swift       # 게임 오버 화면 (옵션)
├── Models/
│   ├── GameState.swift          # 게임 상태 모델
│   ├── Ball.swift               # 공 모델
│   ├── Paddle.swift             # 패들 모델
│   └── Brick.swift              # 벽돌 모델
├── GameEngine/
│   └── GameLogic.swift          # 게임 로직 및 물리
└── Assets.xcassets              # 이미지 리소스
```

---

## 2. 핵심 기능 정의

### Phase 1: 기본 게임 (MVP)
- [x] 공이 화면에서 움직임
- [x] 패들을 터치로 좌우 이동
- [x] 공과 패들 충돌 감지
- [x] 공과 벽 충돌 (상, 좌, 우)
- [x] 벽돌 배치 및 충돌
- [x] 점수 시스템
- [x] 게임 오버 조건

### Phase 2: 게임 개선 (옵션)
- [ ] 레벨 시스템
- [ ] 파워업 아이템
- [ ] 사운드 효과
- [ ] 파티클 효과
- [ ] 설정 화면

---

## 3. 기술 구현 방식

### 렌더링
- **SwiftUI Canvas** 사용
- 60fps 타이머로 게임 루프 구현
- 기본 도형(원, 사각형)으로 게임 오브젝트 표현

### 물리 엔진
- 단순한 2D 충돌 감지
- 기본적인 반사 물리
- 복잡한 물리 라이브러리 없이 직접 구현

### 상태 관리
- `@State`와 `@StateObject` 사용
- 복잡한 아키텍처 패턴 없이 단순하게

### 데이터 저장
- `UserDefaults`로 최고 점수만 저장
- CloudKit, CoreData 없음

---

## 4. 게임 화면 설계

### GameView 구성요소
```
┌─────────────────────────────┐
│          점수: 1250         │
├─────────────────────────────┤
│  ████ ████ ████ ████ ████   │  <- 벽돌들
│  ████ ████ ████ ████ ████   │
│  ████ ████ ████ ████ ████   │
│                             │
│                             │
│            ●                │  <- 공
│                             │
│                             │
│                             │
│         ▬▬▬▬▬▬▬             │  <- 패들
└─────────────────────────────┘
```

---

## 5. 개발 단계별 계획

### 1단계: 프로젝트 설정 (30분)
- [ ] Xcode에서 새 SwiftUI 프로젝트 생성
- [ ] 기본 파일 구조 생성
- [ ] Git 초기화

### 2단계: 기본 UI (1시간)
- [ ] GameView 기본 레이아웃
- [ ] Canvas를 이용한 게임 화면 구성
- [ ] 고정된 게임 오브젝트 그리기

### 3단계: 게임 오브젝트 모델 (1시간)
- [ ] Ball, Paddle, Brick 구조체 생성
- [ ] 위치, 크기, 색상 속성 정의
- [ ] 게임 상태 관리 클래스 생성

### 4단계: 기본 애니메이션 (1시간)
- [ ] Timer를 이용한 게임 루프
- [ ] 공 움직임 구현
- [ ] 패들 터치 컨트롤

### 5단계: 충돌 감지 (2시간)
- [ ] 공-벽 충돌
- [ ] 공-패들 충돌
- [ ] 공-벽돌 충돌
- [ ] 반사 각도 계산

### 6단계: 게임 로직 (1시간)
- [ ] 점수 시스템
- [ ] 벽돌 제거
- [ ] 게임 오버 조건
- [ ] 게임 클리어 조건

### 7단계: UI 개선 (1시간)
- [ ] 점수 표시
- [ ] 게임 오버 화면
- [ ] 재시작 버튼

---

## 6. 코드 구조 예시

### GameState.swift
```swift
class GameState: ObservableObject {
    @Published var ball: Ball
    @Published var paddle: Paddle
    @Published var bricks: [Brick]
    @Published var score: Int = 0
    @Published var isGameOver: Bool = false
    
    // 게임 로직 메서드들
    func updateGame()
    func checkCollisions()
    func resetGame()
}
```

### GameView.swift
```swift
struct GameView: View {
    @StateObject private var gameState = GameState()
    @State private var timer: Timer?
    
    var body: some View {
        Canvas { context, size in
            // 게임 오브젝트 그리기
            drawBall(context: context)
            drawPaddle(context: context)
            drawBricks(context: context)
        }
        .onAppear { startGame() }
        .gesture(dragGesture)
    }
}
```

---

## 7. 성능 고려사항

### 최적화 포인트
- Canvas 업데이트 최소화
- 불필요한 리렌더링 방지
- 메모리 사용량 관리
- 배터리 효율성

### 제한사항
- 복잡한 그래픽 효과 없음
- 고급 물리 시뮬레이션 없음
- 네트워크 기능 없음

---

## 8. 테스트 계획

### 기능 테스트
- [ ] 모든 기본 게임 기능 동작 확인
- [ ] 다양한 디바이스 크기에서 테스트
- [ ] 성능 테스트 (프레임 드롭 확인)

### 사용성 테스트
- [ ] 패들 컨트롤 반응성
- [ ] 게임 난이도 적절성
- [ ] UI 가독성

---

## 9. 배포 준비

### App Store 준비사항
- [ ] 앱 아이콘 생성
- [ ] 스크린샷 촬영
- [ ] 앱 설명 작성
- [ ] 개인정보 처리방침 (필요시)

---

## 10. 향후 확장 가능성

성공적으로 기본 게임이 완성되면 고려할 수 있는 기능들:

- **레벨 에디터**: 사용자가 레벨 생성
- **멀티플레이**: 로컬 또는 온라인
- **테마 시스템**: 다양한 시각적 테마
- **업적 시스템**: Game Center 연동
- **고급 물리**: 회전, 중력 등

---

## 결론

이 단순화된 접근 방식은:
- ✅ 빠른 프로토타이핑 가능
- ✅ 안정적인 코드 베이스
- ✅ 점진적 기능 추가 용이
- ✅ 학습 친화적
- ✅ 유지보수 간편

**목표: 2-3일 내에 완전히 작동하는 기본 브레이크아웃 게임 완성**