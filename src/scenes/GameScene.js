// 메인 게임 씬
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene started');
        
        // 게임 설정 초기화
        this.config = GameConfig.gameplay;
        this.gameState = {
            running: false,
            paused: false,
            gameTime: 0,
            startTime: 0,
            playerScore: 0,
            aiScore: 0,
            ballSplitDone: false,
            lastBrickSpawn: 0
        };
        
        // 시스템 초기화
        this.initializeSystems();
        
        // 게임 엔티티 생성
        this.createGameEntities();
        
        // UI 생성
        this.createUI();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 입력 처리 설정
        this.setupInput();
        
        // 게임 시작 카운트다운
        this.startCountdown();
    }

    initializeSystems() {
        // 물리 관리자
        this.physicsManager = new PhysicsManager(this);
        
        // 난이도 관리자
        this.difficultyManager = new DifficultyManager(this);
        
        console.log('Game systems initialized');
    }

    createGameEntities() {
        const { width, height } = this.sys.game.config;
        
        // 배경 생성
        this.createBackground();
        
        // 게임 필드 경계 생성
        this.walls = this.physicsManager.createWalls();
        
        // 패들 생성
        this.createPaddles();
        
        // 벽돌 생성
        this.createBricks();
        
        // 공 생성
        this.createBalls();
        
        // 특수 효과 그룹들
        this.effectGroups = {
            splitEffects: this.add.group(),
            spawnEffects: this.add.group(),
            particles: this.add.group()
        };
    }

    createBackground() {
        const { width, height } = this.sys.game.config;
        const colors = GameConfig.visual.colors.background;
        
        // 그라데이션 배경
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(colors.top).color,
            Phaser.Display.Color.HexStringToColor(colors.top).color,
            Phaser.Display.Color.HexStringToColor(colors.middle).color,
            Phaser.Display.Color.HexStringToColor(colors.bottom).color
        );
        graphics.fillRect(0, 0, width, height);
        
        // 중앙 분할선
        const centerY = height / 2;
        graphics.lineStyle(1, 0x4488ff, 0.3);
        graphics.lineBetween(0, centerY, width, centerY);
    }

    createPaddles() {
        const { width, height } = this.sys.game.config;
        
        // 플레이어 패들 (하단)
        this.playerPaddle = this.physicsManager.createPaddle(
            width / 2,
            height - 80,
            true // isPlayer
        );
        
        // AI 패들 (상단)
        this.aiPaddle = this.physicsManager.createPaddle(
            width / 2,
            80,
            false // isPlayer
        );
        
        // AI 컨트롤러 생성
        this.aiController = new AIController(this, this.aiPaddle, this.difficultyManager);
        
        // 패들 스프라이트 생성 (물리 바디 위에 표시용)
        this.playerPaddleSprite = this.add.image(0, 0, 'paddle_player').setOrigin(0.5);
        this.aiPaddleSprite = this.add.image(0, 0, 'paddle_ai').setOrigin(0.5);
    }

    createBricks() {
        this.bricks = {
            player: [],
            ai: []
        };
        
        // 랜덤 패턴 생성
        const pattern = this.generateBrickPattern();
        
        // 플레이어 영역 벽돌 (하단)
        this.createBrickSet(pattern, true);
        
        // AI 영역 벽돌 (상단)
        this.createBrickSet(pattern, false);
    }

    generateBrickPattern() {
        const { rows, cols, initialDensity } = this.config.brick;
        const pattern = [];
        
        for (let i = 0; i < rows * cols; i++) {
            pattern.push(Math.random() < initialDensity);
        }
        
        // 최소 벽돌 수 보장
        const minBricks = Math.floor(rows * cols * this.config.brick.minDensity);
        const currentBricks = pattern.filter(Boolean).length;
        
        if (currentBricks < minBricks) {
            const emptyPositions = pattern.map((hasBrick, index) => hasBrick ? -1 : index)
                .filter(index => index !== -1);
            
            for (let i = 0; i < minBricks - currentBricks && emptyPositions.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                const position = emptyPositions.splice(randomIndex, 1)[0];
                pattern[position] = true;
            }
        }
        
        return pattern;
    }

    createBrickSet(pattern, isPlayerArea) {
        const { rows, cols, width, height, spacingX, spacingY } = this.config.brick;
        const { width: gameWidth, height: gameHeight } = this.sys.game.config;
        
        const brickArray = isPlayerArea ? this.bricks.player : this.bricks.ai;
        const texturePrefix = isPlayerArea ? 'brick_player_' : 'brick_ai_';
        
        for (let i = 0; i < pattern.length; i++) {
            if (!pattern[i]) continue;
            
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // 위치 계산
            const x = col * spacingX + 15;
            const y = isPlayerArea ?
                gameHeight - 150 + row * spacingY : // 플레이어 영역 (하단)
                50 + row * spacingY; // AI 영역 (상단)
            
            // 물리 바디 생성
            const brickBody = this.physicsManager.createBrick(x, y, isPlayerArea);
            
            // 스프라이트 생성
            const textureIndex = row % 6; // 6가지 색상 순환
            const brickSprite = this.add.image(x + width/2, y + height/2, texturePrefix + textureIndex)
                .setOrigin(0.5);
            
            // 벽돌 객체
            const brick = {
                body: brickBody,
                sprite: brickSprite,
                row: row,
                col: col,
                destroyed: false
            };
            
            brickArray.push(brick);
        }
    }

    createBalls() {
        const { width, height } = this.sys.game.config;
        this.balls = [];
        
        // 초기 공 2개 생성
        const ball1 = this.createBall(width/2, height/2 - 50, { dx: 3, dy: -4 });
        const ball2 = this.createBall(width/2, height/2 + 50, { dx: -3, dy: 4 });
        
        this.balls.push(ball1, ball2);
    }

    createBall(x, y, velocity = {}) {
        const ballConfig = this.config.ball;
        
        // 물리 바디 생성
        const ballBody = this.physicsManager.createBall(x, y, {
            angle: Math.atan2(velocity.dy || 0, velocity.dx || 0),
            speed: Math.sqrt((velocity.dx || 0)**2 + (velocity.dy || 0)**2) || ballConfig.speed
        });
        
        // 스프라이트 생성
        const ballSprite = this.add.image(x, y, 'ball').setOrigin(0.5);
        
        return {
            body: ballBody,
            sprite: ballSprite
        };
    }

    createUI() {
        const { width, height } = this.sys.game.config;
        
        // 점수 표시
        this.ui = {
            playerScoreText: this.add.text(50, 50, 'PLAYER: 0', {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fontWeight: '700',
                fill: '#4488ff'
            }),
            
            aiScoreText: this.add.text(50, height - 80, 'AI: 0', {
                fontFamily: 'Orbitron',
                fontSize: '24px',
                fontWeight: '700',
                fill: '#ff4488'
            }),
            
            timeText: this.add.text(width - 50, 50, 'TIME: 0:00', {
                fontFamily: 'Orbitron',
                fontSize: '20px',
                fill: '#ffffff'
            }).setOrigin(1, 0),
            
            pauseText: this.add.text(width/2, height/2, 'PAUSED', {
                fontFamily: 'Orbitron',
                fontSize: '48px',
                fontWeight: '900',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setVisible(false)
        };
        
        // 카운트다운 텍스트
        this.countdownText = this.add.text(width/2, height/2, '', {
            fontFamily: 'Orbitron',
            fontSize: '120px',
            fontWeight: '900',
            fill: '#4af',
            stroke: '#002244',
            strokeThickness: 6
        }).setOrigin(0.5);
    }

    setupEventListeners() {
        // 물리 충돌 이벤트
        this.events.on('ballPaddleCollision', this.handleBallPaddleCollision, this);
        this.events.on('ballBrickCollision', this.handleBallBrickCollision, this);
    }

    setupInput() {
        // 키보드 입력
        this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,P,R,ESC');
        
        // 연속 입력을 위한 커서 키
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    startCountdown() {
        this.gameState.running = false;
        let count = 3;
        
        const countdown = () => {
            if (count > 0) {
                this.countdownText.setText(count.toString());
                this.tweens.add({
                    targets: this.countdownText,
                    scaleX: { from: 1.5, to: 1 },
                    scaleY: { from: 1.5, to: 1 },
                    alpha: { from: 0.5, to: 1 },
                    duration: 800,
                    ease: 'Back.easeOut'
                });
                count--;
                this.time.delayedCall(1000, countdown);
            } else {
                this.countdownText.setText('START!');
                this.tweens.add({
                    targets: this.countdownText,
                    scaleX: { from: 1.5, to: 0 },
                    scaleY: { from: 1.5, to: 0 },
                    alpha: { from: 1, to: 0 },
                    duration: 1000,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        this.startGame();
                    }
                });
            }
        };
        
        countdown();
    }

    startGame() {
        this.gameState.running = true;
        this.gameState.startTime = this.time.now;
        console.log('Game started!');
    }

    update(time, delta) {
        if (!this.gameState.running || this.gameState.paused) {
            return;
        }
        
        // 게임 시간 업데이트
        this.gameState.gameTime = (time - this.gameState.startTime) / 1000;
        
        // 입력 처리
        this.handleInput();
        
        // AI 업데이트
        this.aiController.update(this.balls, delta);
        
        // 게임 엔티티 업데이트
        this.updateBalls();
        this.updatePaddles();
        
        // UI 업데이트
        this.updateUI();
    }

    handleInput() {
        const paddleSpeed = this.config.paddle.player.maxSpeed;
        
        // 패들 이동
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.physicsManager.movePaddle(this.playerPaddle,
                this.playerPaddle.position.x - paddleSpeed, paddleSpeed);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.physicsManager.movePaddle(this.playerPaddle,
                this.playerPaddle.position.x + paddleSpeed, paddleSpeed);
        }
        
        // 일시정지
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            this.togglePause();
        }
        
        // 재시작
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.restartGame();
        }
        
        // 메뉴로 돌아가기
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.returnToMenu();
        }
    }

    updateBalls() {
        this.balls.forEach(ball => {
            // 스프라이트 위치를 물리 바디와 동기화
            ball.sprite.setPosition(ball.body.position.x, ball.body.position.y);
            
            // 속도 제한
            this.physicsManager.limitBallSpeed(ball.body);
        });
    }

    updatePaddles() {
        // 패들 스프라이트를 물리 바디와 동기화
        this.playerPaddleSprite.setPosition(
            this.playerPaddle.position.x,
            this.playerPaddle.position.y
        );
        
        this.aiPaddleSprite.setPosition(
            this.aiPaddle.position.x,
            this.aiPaddle.position.y
        );
    }

    updateUI() {
        // 점수 업데이트
        this.ui.playerScoreText.setText(`PLAYER: ${this.gameState.playerScore}`);
        this.ui.aiScoreText.setText(`AI: ${this.gameState.aiScore}`);
        
        // 시간 업데이트
        const minutes = Math.floor(this.gameState.gameTime / 60);
        const seconds = Math.floor(this.gameState.gameTime % 60);
        this.ui.timeText.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    // 이벤트 핸들러들
    handleBallPaddleCollision(data) {
        console.log('Ball hit paddle');
    }

    handleBallBrickCollision(data) {
        console.log('Ball hit brick');
    }

    // 게임 제어 메서드들
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        this.ui.pauseText.setVisible(this.gameState.paused);
        
        if (this.gameState.paused) {
            this.matter.world.enabled = false;
        } else {
            this.matter.world.enabled = true;
        }
    }

    restartGame() {
        this.scene.restart();
    }

    returnToMenu() {
        this.scene.start('MenuScene');
    }

    // 정리
    destroy() {
        if (this.physicsManager) {
            this.physicsManager.destroy();
        }
        if (this.difficultyManager) {
            this.difficultyManager.destroy();
        }
        if (this.aiController) {
            this.aiController.destroy();
        }
    }
}

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameScene;
} else {
    window.GameScene = GameScene;
}
