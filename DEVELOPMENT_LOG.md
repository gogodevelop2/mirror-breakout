# Mirror Breakout 웹 버전 개발 로그

## 프로젝트 개요
- **목표**: iOS 버전의 물리 기반 브레이크아웃 게임을 웹으로 포팅
- **물리 엔진**: Planck.js (Box2D JavaScript 포팅)
- **핵심 컨셉**: iOS와 동일한 자연스러운 물리 시뮬레이션

---

## 2025-10-01: iOS 스타일 동적 벽돌 물리 구현

### 주요 변경 사항

#### 1. 정적 → 동적 벽돌로 전환
**문제**: 기존에는 벽돌이 `static` 타입으로 고정된 장애물이었음

**해결**:
- `physics.js:193` - 벽돌을 `dynamic` 타입으로 변경
- `fixedRotation: false` - 회전 허용
- `bullet: true` - CCD 활성화로 고속 충돌 시 겹침 방지

#### 2. 질량 시스템 재설계
**문제**: `setMassData()` 사용 시 관성(Inertia) 계산 오류로 물리 붕괴

**해결**:
- Density를 계산하여 Box2D가 자동으로 올바른 관성 계산하도록 변경
- 공: `mass = 40` (density = 40 / πr²)
- 벽돌: `mass = 1000` (density = 1000 / (w×h))
- 질량 비율 1:25 유지 (iOS와 동일한 비율, 절대값은 조정)

```javascript
// config.js
BALL.MASS: 40
BRICK.MASS: 1000

// physics.js
const ballDensity = CONFIG.BALL.MASS / ballArea;
const brickDensity = CONFIG.BRICK.MASS / brickArea;
```

#### 3. 벽돌 파괴 페이드아웃 효과
**문제**: 벽돌이 즉시 사라져서 물리적 움직임을 볼 수 없음

**해결**:
- `game.js:410-421` - 0.15초 지연 후 제거
- 파괴 중 alpha = 0.5 (반투명)
- 지연 시간 동안 물리 바디 유지하여 밀리는 모습 표현

#### 4. 회전 렌더링 구현
**문제**: 벽돌이 물리적으로는 회전하지만 화면에 표시되지 않음
- 각속도 로그 확인: `angularVelocity: 0.622, -0.240, -1.354...` ✅
- `fillRect()`는 회전을 표현 못함

**해결** (`renderer.js:99-152`):
```javascript
const angle = brick.body.getAngle();
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);  // 회전 적용!
ctx.fillRect(-w/2, -h/2, w, h);
ctx.restore();
```

#### 5. 물리 안정성 개선
**문제**: 회전하는 동적 오브젝트 120개로 인한 충돌 불안정

**해결**:
```javascript
// config.js
VELOCITY_ITERATIONS: 10  // 8 → 10
POSITION_ITERATIONS: 8   // 3 → 8
BRICK.LINEAR_DAMPING: 1.0
BRICK.ANGULAR_DAMPING: 1.0
BRICK.FRICTION: 0.3

// physics.js - Sub-stepping
const subSteps = 2;  // 60fps → 120 physics steps/sec
```

#### 6. 코드 최적화
**제거**:
- `keepBallsInBounds()` 함수 (60줄)
- 주석 처리된 최소 각도 강제 로직 (14줄)
- 모든 디버그 로그 주석 (5개)
- `CONFIG.MIN_ANGLE` 설정

**개선**:
- 하드코딩된 질량 값 → CONFIG 참조
- 설정 중앙화

---

## 현재 상태

### ✅ 구현 완료
- [x] 동적 벽돌 물리 (질량, 회전, 충돌)
- [x] iOS 스타일 질량 비율 (1:25)
- [x] 벽돌 파괴 페이드아웃 (0.15초)
- [x] 충격점 기반 회전 토크
- [x] 회전 시각화
- [x] Sub-stepping으로 안정성 확보
- [x] CCD로 터널링 방지
- [x] 코드 정리 및 최적화

### 🎮 게임 동작
- 공과 벽돌이 모두 질량을 가짐
- 공이 벽돌의 오른쪽을 치면 → 시계방향 회전
- 공이 벽돌의 왼쪽을 치면 → 반시계방향 회전
- 벽돌이 밀리면서 페이드아웃
- 자연스러운 물리 시뮬레이션

### 📊 성능
- 120개 동적 벽돌 + 회전
- Sub-stepping (2x)
- 안정적인 60fps 유지

---

## 기술적 세부사항

### Box2D/Planck.js 차이점
- **iOS SpriteKit**: 네이티브 C++ Box2D (매우 안정적)
- **웹 Planck.js**: JavaScript 포팅 (부동소수점 오차)
- **대응**: 더 높은 iteration + damping + sub-stepping

### 질량 vs Density
❌ **잘못된 방법**: `setMassData()` 직접 사용
```javascript
body.setMassData({ mass: 5000, center: Vec2(0,0), I: body.getInertia() });
// → 관성 계산 오류로 물리 붕괴
```

✅ **올바른 방법**: Density로 자동 계산
```javascript
body.createFixture({ density: mass / area });
// → Box2D가 올바른 관성 자동 계산
```

### 회전 렌더링 패턴
```javascript
// Canvas 회전 변환
ctx.save();
ctx.translate(centerX, centerY);  // 회전 중심으로 이동
ctx.rotate(angle);                // 회전
// 모든 그리기를 (0,0) 중심으로
ctx.fillRect(-w/2, -h/2, w, h);
ctx.restore();
```

---

## 다음 세션을 위한 참고사항

### 현재 Git 상태
```bash
# 백업 커밋: 8fbb263 - Static brick version
# 현재: Dynamic brick system (미커밋)
```

### 개발 이어가기
1. 이 문서 읽기 (`DEVELOPMENT_LOG.md`)
2. Git 로그 확인: `git log --oneline`
3. 변경사항 확인: `git diff 8fbb263`

### 조정 가능한 값
```javascript
// config.js
BALL.MASS: 40           // 가볍게 → 벽돌 더 많이 움직임
BRICK.MASS: 1000        // 무겁게 → 벽돌 덜 움직임
BRICK.LINEAR_DAMPING: 1.0   // 높이면 빨리 멈춤
BRICK.ANGULAR_DAMPING: 1.0  // 높이면 회전 덜함

// physics.js
const subSteps = 2;     // 높이면 더 정밀하지만 느림
```

### 알려진 제약
- JavaScript 물리 정밀도 < 네이티브 C++
- 많은 동적 오브젝트 → Sub-stepping 필수
- 회전 + 충돌 → 높은 iterations 필요

---

## 파일 구조
```
game-test01/
├── index.html
├── js/
│   ├── config.js      - 모든 게임 설정 (244줄)
│   ├── physics.js     - Planck.js 물리 엔진 (485줄)
│   ├── game.js        - 게임 로직 (621줄)
│   ├── renderer.js    - Canvas 렌더링 (524줄)
│   └── main.js        - 진입점 (195줄)
└── DEVELOPMENT_LOG.md - 이 문서
```

---

## 레퍼런스

### iOS 버전 경로
`/Users/joejeon/Documents/develop/MirrorBreakout/`

### 핵심 iOS 설정 (참고용)
```swift
GameConfig.Physics {
    ballMass: 200.0
    brickMass: 5000.0
    restitution: 1.0
    brickRestitution: 0.9
}

GameConfig.Visual {
    brickDestroyDelay: 0.15
    brickDestroyAlpha: 0.5
}
```

### 웹 버전 (조정됨)
```javascript
BALL.MASS: 40
BRICK.MASS: 1000
// 비율 1:25 유지, 절대값 조정으로 더 활발한 움직임
```