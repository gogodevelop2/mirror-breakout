# Mirror Breakout

물리 엔진을 사용한 혁신적인 브레이크아웃 게임입니다. 플레이어와 AI가 각각 자신의 벽돌을 모두 파괴하기 위해 경쟁합니다.

An innovative breakout game using physics engine. Players and AI compete to destroy all their respective bricks.

## 게임 특징

- **대칭적 게임플레이**: 상하 대칭 구조로 플레이어(위)와 AI(아래)가 경쟁
- **동적 벽돌 물리**: iOS 스타일의 회전하고 밀리는 벽돌 시뮬레이션
- **실시간 물리 조절**: 게임 중 Ball/Brick 물리 속성을 슬라이더로 실시간 변경
- **반응형 디자인**: 브라우저 크기에 맞춰 자동으로 게임 화면 조절
- **동적 난이도**: AI가 게임 상황에 따라 난이도를 자동 조절 (0.6x ~ 2.0x)
- **실시간 벽돌 생성**: 게임 진행 중 새로운 벽돌이 랜덤하게 생성
- **볼 분할 시스템**: 10초 후 우세한 쪽의 볼이 자동으로 분할되어 게임 속도 증가
- **랜덤 발사 각도**: 매 게임마다 ±30° 랜덤 변화로 다른 패턴 생성

## 게임 규칙

### 목표
- **플레이어**: 화면 위쪽의 파란색 벽돌을 모두 파괴
- **AI**: 화면 아래쪽의 빨간색 벽돌을 모두 파괴
- 먼저 자신의 벽돌을 모두 파괴하는 쪽이 승리

### 조작법
- **← / →**: 패들 이동 (가속도 시스템 적용)

### 게임 시스템
1. **카운트다운**: 게임 시작 전 3초 카운트다운
2. **볼 분할**: 10초 후 우세한 쪽 영역의 볼이 분할
3. **벽돌 생성**: 10초마다 양쪽에 새로운 벽돌 생성
4. **난이도 조절**: AI가 상황에 따라 속도와 반응성 자동 조절

## 기술 스택

- **HTML5 Canvas**: 게임 렌더링
- **Planck.js**: 2D 물리 엔진
- **JavaScript ES6+**: 게임 로직 구현
- **CSS3**: 스타일링 및 레이아웃

## 파일 구조

```
game-test01/
├── index.html          # 메인 HTML 파일
├── css/
│   └── styles.css      # 게임 스타일 (반응형 레이아웃)
├── js/
│   ├── config.js       # 게임 설정 (동적 캔버스 계산)
│   ├── physics.js      # 물리 엔진 래퍼 (Planck.js)
│   ├── game.js         # 게임 로직 및 상태 관리
│   ├── renderer.js     # 렌더링 시스템 (반응형)
│   ├── ui-controls.js  # 물리 설정 UI 컨트롤
│   └── main.js         # 메인 게임 루프
└── README.md
```

## 실행 방법

1. 웹서버를 통해 실행 (CORS 제한으로 인해 직접 HTML 파일 열기 불가)
2. 간단한 로컬 서버 실행:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (http-server 설치 필요)
   npx http-server
   ```
3. 브라우저에서 `http://localhost:8000` 접속

## 게임 메커니즘

### 물리 시스템
- **동적 벽돌 물리**: 벽돌이 회전하고 밀리는 iOS 스타일 시뮬레이션
  - Ball:Brick 질량 비율 1:10 (기본값: Ball 100, Brick 1000)
  - 벽돌 반발력 90%, 마찰 0.3, 감쇠 1.0
  - CCD(Continuous Collision Detection)로 고속 충돌 처리
- **반응형 물리 스케일**: 화면 크기에 관계없이 일정한 물리 동작 (6m×7m 고정 세계)
- **실시간 물리 조절**: 슬라이더로 게임 중 Ball/Brick 속성 변경 가능

### AI 시스템
- 동적 난이도 조절 (0.6x ~ 2.0x)
- 게임 상황 분석 기반 반응 (벽돌 개수 차이로 계산)
- 색상으로 난이도 표시 (파란색→보라색→빨간색)
- 영역 기반 공 추적 시스템

### 시각 효과
- 볼 분할 시 원형 확산 효과
- 벽돌 생성 시 스폰 애니메이션
- 벽돌 파괴 시 0.15초 페이드아웃 효과
- 실시간 점수 및 시간 표시

## 라이선스

이 프로젝트는 [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/)에 따라 라이선스가 부여됩니다.

### 사용 조건
- ✅ **자유로운 사용**: 개인적, 교육적, 연구 목적으로 자유롭게 사용 가능
- ✅ **수정 허용**: 코드 수정 및 개선 가능
- ✅ **배포 허용**: 수정된 버전 배포 가능
- ⚠️ **출처 표기 필수**: 원작자와 출처를 반드시 명시
- ❌ **상업적 사용 금지**: 상업적 목적으로 사용 불가

### 저작권
© 2025 Mirror Breakout. All rights reserved.

**저작권으로 보호되는 독창적 요소**:

1. **핵심 게임 메커니즘** (영업 비밀/특허 가능):
   - **물리적 공유 공간**: 상하 대칭으로 연결된 하나의 물리 공간을 두 플레이어가 공유하며 대결하는 구조 (현재는 플레이어 vs AI, 향후 멀티플레이어 확장 가능)
   - **동적 긴장감 시스템**: 3개의 공이 만들어내는 복잡성과 우연성이 게임 균형을 지속적으로 변화시켜, 긴장감 있는 게임 진행을 유도하는 메커니즘
   - **영역 기반 AI 추적**: 공의 방향과 위치로 추적 대상을 결정하는 알고리즘

2. **기술적 구현** (저작권 자동 보호):
   - 모든 JavaScript 소스 코드
   - 동적 벽돌 물리 시스템 (질량/회전/충돌 알고리즘)
   - 반응형 캔버스 시스템 (동적 SCALE 계산)
   - 실시간 물리 조절 UI 시스템
   - Box2D/Planck.js 통합 방식

3. **시각적 요소** (저작권 보호):
   - 육각형 패들 디자인
   - 색상 스킴 및 그라디언트
   - UI 레이아웃 및 애니메이션

**브레이크아웃 장르 자체는 공공 영역**이며, 본 게임의 독창적인 메커니즘과 구현만 보호됩니다.

상업적 사용을 원하시는 경우 별도로 연락해 주세요.

## 개발자 정보

이 게임은 물리 엔진과 게임 AI의 학습 목적으로 제작되었습니다.

---

# English Version

## Game Features

- **Symmetric Gameplay**: Vertical symmetric structure where player (top) and AI (bottom) compete
- **Dynamic Brick Physics**: iOS-style rotating and moving brick simulation
- **Real-time Physics Control**: Adjust Ball/Brick physics properties with sliders during gameplay
- **Responsive Design**: Game canvas automatically adjusts to browser size
- **Dynamic Difficulty**: AI automatically adjusts difficulty (0.6x ~ 2.0x) based on game situation
- **Real-time Brick Generation**: New bricks randomly spawn during gameplay
- **Ball Split System**: Ball automatically splits after 10 seconds to increase game pace
- **Random Launch Angles**: ±30° random variation creates different patterns each game

## Game Rules

### Objective
- **Player**: Destroy all blue bricks at the top of the screen
- **AI**: Destroy all red bricks at the bottom of the screen
- First to destroy all their bricks wins

### Controls
- **← / →**: Move paddle (with acceleration system)

### Game Systems
1. **Countdown**: 3-second countdown before game starts
2. **Ball Split**: Ball in the dominant side's area splits after 10 seconds
3. **Brick Generation**: New bricks spawn on both sides every 10 seconds
4. **Difficulty Adjustment**: AI automatically adjusts speed and responsiveness based on situation

## Tech Stack

- **HTML5 Canvas**: Game rendering
- **Planck.js**: 2D physics engine
- **JavaScript ES6+**: Game logic implementation
- **CSS3**: Styling and layout

## How to Run

1. Run through web server (direct HTML file opening not possible due to CORS restrictions)
2. Simple local server setup:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (requires http-server)
   npx http-server
   ```
3. Access `http://localhost:8000` in browser

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](http://creativecommons.org/licenses/by-nc/4.0/).

### Usage Terms
- ✅ **Free Use**: Free for personal, educational, and research purposes
- ✅ **Modification Allowed**: Code modification and improvement allowed
- ✅ **Distribution Allowed**: Distribution of modified versions allowed
- ⚠️ **Attribution Required**: Must credit original author and source
- ❌ **No Commercial Use**: Commercial use prohibited

### Copyright
© 2025 Mirror Breakout. All rights reserved.

**Copyrighted Original Elements**:

1. **Core Game Mechanisms** (Trade Secret/Patentable):
   - **Physical Shared Space**: Structure where two players compete while sharing one vertically symmetric physical space (currently Player vs AI, expandable to multiplayer)
   - **Dynamic Tension System**: Mechanism that uses complexity and randomness created by 3 balls to continuously change game balance, inducing engaging gameplay
   - **Zone-based AI Tracking**: Algorithm that determines tracking targets based on ball direction and position

2. **Technical Implementation** (Automatically Copyrighted):
   - All JavaScript source code
   - Dynamic brick physics system (mass/rotation/collision algorithms)
   - Responsive canvas system (dynamic SCALE calculation)
   - Real-time physics adjustment UI system
   - Box2D/Planck.js integration approach

3. **Visual Elements** (Copyrighted):
   - Hexagonal paddle design
   - Color schemes and gradients
   - UI layout and animations

**The breakout game genre itself is in the public domain**; only the original mechanisms and implementation of this game are protected.

For commercial use, please contact separately.

## Developer Info

This game was created for learning purposes of physics engines and game AI.