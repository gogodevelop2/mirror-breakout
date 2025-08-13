// js/main.js

// 전역 변수
let canvas;
let ctx;
let renderer;
let animationId;

// 초기화
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    // 렌더러 생성
    renderer = new Renderer(canvas, ctx);
    
    // 초기 게임 설정
    gameLogic.initGame();
    
    // 초기 화면 그리기
    renderer.render();
}

// 게임 시작/정지 토글
function toggleGame() {
    if (gameState.running || gameState.over) {
        resetGame();
    } else {
        startGame();
    }
    
    updateButtonText();
}

// 게임 시작
function startGame() {
    // 게임 초기화
    gameLogic.initGame();
    
    // 상태 리셋
    gameState.running = false;
    gameState.over = false;
    gameState.playerWon = false;
    gameState.time = 0;
    gameState.ballSplitDone = false;
    
    // 카운트다운 시작
    gameState.startCountdown();
    
    // 카운트다운 루프 시작
    countdownLoop();
}

// 게임 리셋
function resetGame() {
    // 애니메이션 중지
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // 상태 리셋
    gameState.reset();
    
    // 게임 재초기화
    gameLogic.initGame();
    
    // 화면 다시 그리기
    renderer.render();
    
    updateButtonText();
}

// 카운트다운 루프
function countdownLoop() {
    const countdownComplete = gameLogic.updateCountdown();
    
    if (!countdownComplete) {
        // 카운트다운 중 - 화면 업데이트
        renderer.render();
        animationId = requestAnimationFrame(countdownLoop);
    } else {
        // 카운트다운 완료 - 게임 시작
        setTimeout(() => {
            gameState.running = true;
            gameState.startTime = Date.now();
            gameLoop();
        }, 500);
    }
}

// 메인 게임 루프
function gameLoop() {
    if (gameState.running) {
        // 게임 로직 업데이트
        gameLogic.update();
        
        // 화면 렌더링
        renderer.render();
        
        // 다음 프레임
        animationId = requestAnimationFrame(gameLoop);
    } else {
        // 게임 종료 시 버튼 텍스트 업데이트
        if (gameState.over) {
            updateButtonText();
        }
    }
}

// 버튼 텍스트 업데이트
function updateButtonText() {
    const button = document.getElementById('gameButton');
    
    if (gameState.running) {
        button.textContent = 'STOP';
    } else if (gameState.over) {
        button.textContent = 'RETRY';
    } else {
        button.textContent = 'START';
    }
}

// 윈도우 로드 시 초기화
window.addEventListener('DOMContentLoaded', init);

// 전역 함수로 노출 (HTML onclick용)
window.toggleGame = toggleGame;
