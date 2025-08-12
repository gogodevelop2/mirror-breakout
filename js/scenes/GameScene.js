/**
 * Game Scene
 * 메인 게임플레이 씬 - 모든 시스템을 통합하여 게임을 실행
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 게임 상태
        this.gameState = {
            running: false,
            over: false,
            playerWon: false,
            startTime: 0,
            currentTime: 0,
            ballSplitDone: false,
            countdown: 0,
            countdownStartTime: 0,
            lastBrickSpawn: 0,
            playerScore: 0,
            computerScore: 0
        };
        
        // 게임 엔티티
        this.entities = {
            balls: null,
            playerPaddle: null,
            aiPaddle: null,
            playerBricks: null,
            aiBricks: null
        };
        
        // 게임 시스템
        this.systems = {
            physics: null,
            ai: null,
            collision: null
        };
        
        // 그래픽 요소들
        this.graphics = {
            background: null,
            centerWave: null,
            ui: null
        };
        
        // UI 요소들
        this.uiElements = {
            playerLabel: null,
            aiLabel: null,
            timeLabel: null
        };
        
        // 오버레이들
        this.countdownOverlay = null;
        this.gameOverOverlay = null;
        this.countdownText = null;
        
        // 입력 처리
        this.controls = {
            leftKey: null,
            rightKey: null,
            spaceKey: null
        };
        
        // 벽돌 그리드 (최적화용)
        this.brickGrid = {
            player: null,
            ai: null
        };
    }
    
    /**
     * 씬 초기화
     */
    init() {
        console.log('GameScene initialized');
        
        // 페이드 인 효과
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // 전역 이벤트 리스너
        this.events.on('restartGame', this.restartGame, this);
        this.events.on('stopGame', this.stopGame, this);
    }
    
    /**
     * 씬 생성
     */
    create() {
        // 1. 배경 및 UI 생성
        this.createBackground();
        this.createUI();
        
        // 2. 게임 엔티티 생성
        this.createGameEntities();
        
        // 3. 시스템 초기화
        this.initializeSystems();
        
        // 4. 입력 설정
        this.setupInput();
        
        // 5. 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 6. 게임 시작
        this.startGameSequence();
        
        console.log('GameScene created');
    }
    
    /**
     * 배경 생성
     */
    createBackground() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        // 배경 그라데이션
        this.graphics.background = this.add.graphics();
        this.graphics.background.fillGradientStyle(
            GameConfig.COLORS.BACKGROUND.TOP,
            GameConfig.COLORS.BACKGROUND.TOP,
            GameConfig.COLORS.BACKGROUND.MID,
            GameConfig.COLORS.BACKGROUND.BOTTOM
        );
        this.graphics.background.fillRect(0, 0, width, height);
        this.graphics.background.setDepth(-10);
        
        // 중앙 웨이브 효과
        this.graphics.centerWave = this.add.graphics();
        this.graphics.centerWave.setDepth(-5);
        this.updateCenterWave();
        
        // 웨이브 애니메이션
        this.tweens.add({
            targets: { phase: 0 },
            phase: Math.PI * 2,
            duration: 4000,
            ease: 'Linear',
            repeat: -1,
            onUpdate: (tween) => {
                this.updateCenterWave(tween.targets[0].phase);
            }
        });
    }
    
    /**
     * 중앙 웨이브 업데이트
     */
    updateCenterWave(phase = 0) {
        if (!this.graphics.centerWave) return;
        
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        const centerY = height / 2;
        
        this.graphics.centerWave.clear();
        this.graphics.centerWave.fillGradientStyle(
            GameConfig.COLORS.WAVE_CENTER, GameConfig.COLORS.WAVE_CENTER,
            GameConfig.COLORS.WAVE_CENTER, GameConfig.COLORS.WAVE_CENTER,
            0, 0.1, 0.1, 0
        );
        
        // 웨이브 형태 그리기
        const waveHeight = 30;
        const waveFreq = 0.02;
        
        this.graphics.centerWave.beginPath();
        this.graphics.centerWave.moveTo(0, centerY);
        
        for (let x = 0; x <= width; x += 2) {
            const waveY = centerY + Math.sin(x * waveFreq + phase) * Math.sin(phase * 0.5) * waveHeight * 0.3;
            this.graphics.centerWave.lineTo(x, waveY);
        }
        
        this.graphics.centerWave.lineTo(width, centerY + waveHeight);
        this.graphics.centerWave.lineTo(0, centerY + waveHeight);
        this.graphics.centerWave.closePath();
        this.graphics.centerWave.fillPath();
    }
    
    /**
     * UI 생성
     */
    createUI() {
        // UI 텍스트 객체들 생성 (한 번만)
        this.uiElements = {
            playerLabel: this.add.text(20, 30, 'PLAYER (You)', {
                fontSize: '20px',
                fontWeight: 'bold',
                fill: '#4488ff'
            }),
            
            aiLabel: this.add.text(20, GameConfig.CANVAS.HEIGHT - 10, 'COMPUTER', {
                fontSize: '20px',
                fontWeight: 'bold',
                fill: '#ff4488'
            }),
            
            timeLabel: this.add.text(GameConfig.CANVAS.WIDTH - 100, 30, 'Time: 0:00', {
                fontSize: '16px',
                fill: '#ffffff'
            })
        };
        
        // 깊이 설정
        Object.values(this.uiElements).forEach(element => {
            element.setDepth(100);
        });
    }
    
    /**
     * 게임 엔티티 생성
     */
    createGameEntities() {
        // 패들 생성
        this.entities.playerPaddle = new Paddle(
            this,
            GameConfig.CALCULATED.GAME_CENTER_X,
            GameConfig.POSITIONS.PLAYER_PADDLE_Y,
            true // isPlayer
        );
        
        this.entities.aiPaddle = new Paddle(
            this,
            GameConfig.CALCULATED.GAME_CENTER_X,
            GameConfig.POSITIONS.AI_PADDLE_Y,
            false // isPlayer
        );
        
        // 공 그룹 생성
        this.entities.balls = this.add.group();
        
        // 초기 공들 생성
        this.createInitialBalls();
        
        // 벽돌 그룹 생성
        this.entities.playerBricks = this.add.group();
        this.entities.aiBricks = this.add.group();
        
        // 벽돌 생성
        this.createBricks();
        
        console.log('Game entities created');
    }
    
    /**
     * 초기 공들 생성
     */
    createInitialBalls() {
        const playerBall = BallFactory.createPlayerBall(
            this,
            this.entities.playerPaddle.x + this.entities.playerPaddle.paddleWidth / 2,
            this.entities.playerPaddle.y
        );
        
        const aiBall = BallFactory.createAIBall(
            this,
            this.entities.aiPaddle.x + this.entities.aiPaddle.paddleWidth / 2,
            this.entities.aiPaddle.y
        );
        
        this.entities.balls.add(playerBall);
        this.entities.balls.add(aiBall);
    }
    
    /**
     * 벽돌 생성
     */
    createBricks() {
        // 그리드 초기화
        this.initBrickGrid();
        
        // 랜덤 패턴 생성
        const brickPattern = BrickFactory.generateRandomPattern();
        
        // 플레이어 벽돌
        const playerBricks = BrickFactory.createBrickGroup(this, brickPattern, true);
        playerBricks.forEach(brick => {
            this.entities.playerBricks.add(brick);
            this.addBrickToGrid(brick, true);
        });
        
        // AI 벽돌
        const aiBricks = BrickFactory.createBrickGroup(this, brickPattern, false);
        aiBricks.forEach(brick => {
            this.entities.aiBricks.add(brick);
            this.addBrickToGrid(brick, false);
        });
        
        console.log(`Created ${playerBricks.length} player bricks, ${aiBricks.length} AI bricks`);
    }
    
    /**
     * 벽돌 그리드 초기화
     */
    initBrickGrid() {
        this.brickGrid.player = Array(GameConfig.BRICK.ROWS).fill().map(() =>
            Array(GameConfig.BRICK.COLS).fill(null)
        );
        this.brickGrid.ai = Array(GameConfig.BRICK.ROWS).fill().map(() =>
            Array(GameConfig.BRICK.COLS).fill(null)
        );
    }
    
    /**
     * 벽돌을 그리드에 추가
     */
    addBrickToGrid(brick, isPlayerSide) {
        const grid = isPlayerSide ? this.brickGrid.player : this.brickGrid.ai;
        if (brick.row >= 0 && brick.row < GameConfig.BRICK.ROWS &&
            brick.col >= 0 && brick.col < GameConfig.BRICK.COLS) {
            grid[brick.row][brick.col] = brick;
        }
    }
    
    /**
     * 벽돌을 그리드에서 제거
     */
    removeBrickFromGrid(brick, isPlayerSide) {
        const grid = isPlayerSide ? this.brickGrid.player : this.brickGrid.ai;
        if (brick.row >= 0 && brick.row < GameConfig.BRICK.ROWS &&
            brick.col >= 0 && brick.col < GameConfig.BRICK.COLS) {
            grid[brick.row][brick.col] = null;
        }
    }
    
    /**
     * 시스템 초기화
     */
    initializeSystems() {
        // 물리 시스템
        this.systems.physics = new PhysicsSystem(this);
        
        // AI 시스템
        this.systems.ai = new AISystem(this);
        
        // 충돌 시스템
        this.systems.collision = new CollisionSystem(this);
        
        // 시스템들 연결
        this.systems.collision.setPhysicsSystem(this.systems.physics);
        
        // 시스템들 설정
        this.systems.physics.setup(
            this.entities.balls,
            {
                player: this.entities.playerPaddle,
                ai: this.entities.aiPaddle
            },
            {
                player: this.entities.playerBricks,
                ai: this.entities.aiBricks
            }
        );
        
        this.systems.ai.setup(
            this.entities.aiPaddle,
            this.entities.playerPaddle,
            this.entities.balls,
            {
                player: this.entities.playerBricks,
                ai: this.entities.aiBricks
            }
        );
        
        this.systems.collision.setup({
            balls: this.entities.balls,
            playerPaddle: this.entities.playerPaddle,
            aiPaddle: this.entities.aiPaddle,
            playerBricks: this.entities.playerBricks,
            aiBricks: this.entities.aiBricks
        });
        
        console.log('Game systems initialized');
    }
    
    /**
     * 입력 설정
     */
    setupInput() {
        // 키보드 입력
        this.controls.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.controls.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.controls.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // 스페이스바 이벤트
        this.controls.spaceKey.on('down', () => {
            this.toggleGame();
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 공 관련 이벤트
        this.events.on('ballOutOfBounds', this.onBallOutOfBounds, this);
        this.events.on('ballPaddleHit', this.onBallPaddleHit, this);
        
        // 벽돌 관련 이벤트
        this.events.on('brickHit', this.onBrickHit, this);
        this.events.on('brickDestroyed', this.onBrickDestroyed, this);
        
        // 점수 관련 이벤트
        this.events.on('scoreUpdate', this.onScoreUpdate, this);
    }
    
    /**
     * 게임 시작 시퀀스
     */
    startGameSequence() {
        this.gameState.countdown = 3;
        this.gameState.countdownStartTime = Date.now();
        this.runCountdown();
    }
    
    /**
     * 카운트다운 실행
     */
    runCountdown() {
        if (this.gameState.countdown > 0) {
            // 카운트다운 UI 업데이트는 update()에서 처리
            
            this.time.delayedCall(1000, () => {
                this.gameState.countdown--;
                if (this.gameState.countdown > 0) {
                    this.runCountdown();
                } else {
                    this.startGameplay();
                }
            });
        }
    }
    
    /**
     * 실제 게임플레이 시작
     */
    startGameplay() {
        this.gameState.running = true;
        this.gameState.startTime = Date.now();
        this.gameState.lastBrickSpawn = Date.now();
        
        // 공들 발사
        this.entities.balls.children.entries.forEach(ball => {
            ball.launch({ x: ball.body.velocity.x || 3, y: ball.body.velocity.y || -4 });
        });
        
        // 게임 시작 이벤트
        this.game.events.emit('gamestart');
        
        console.log('Gameplay started');
    }
    
    /**
     * 게임 토글 (시작/중지)
     */
    toggleGame() {
        if (this.gameState.running) {
            this.stopGame();
        } else if (this.gameState.over) {
            this.restartGame();
        } else {
            this.startGameSequence();
        }
    }
    
    /**
     * 게임 중지
     */
    stopGame() {
        this.gameState.running = false;
        
        // 공들 정지
        this.entities.balls.children.entries.forEach(ball => {
            ball.setVelocity(0, 0);
        });
        
        // 게임 중지 이벤트
        this.game.events.emit('gamereset');
        
        console.log('Game stopped');
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        // 상태 리셋
        this.gameState = {
            running: false,
            over: false,
            playerWon: false,
            startTime: 0,
            currentTime: 0,
            ballSplitDone: false,
            countdown: 0,
            countdownStartTime: 0,
            lastBrickSpawn: 0,
            playerScore: 0,
            computerScore: 0
        };
        
        // 엔티티들 제거
        this.entities.balls.clear(true, true);
        this.entities.playerBricks.clear(true, true);
        this.entities.aiBricks.clear(true, true);
        
        // 패들 위치 리셋
        this.entities.playerPaddle.resetPosition();
        this.entities.aiPaddle.resetPosition();
        
        // 시스템들 리셋
        if (this.systems.physics) this.systems.physics.reset();
        if (this.systems.ai) this.systems.ai.resetAI();
        if (this.systems.collision) this.systems.collision.reset();
        
        // 다시 생성
        this.createInitialBalls();
        this.createBricks();
        
        // 시스템들 재설정
        this.initializeSystems();
        
        console.log('Game restarted');
    }
    
    /**
     * 공이 경계를 벗어났을 때
     */
    onBallOutOfBounds(data) {
        const { ball, side } = data;
        
        // 공 제거
        ball.destroy();
        
        console.log(`Ball lost on ${side} side`);
        
        // 게임 종료 체크
        this.checkGameEnd();
    }
    
    /**
     * 공-패들 충돌
     */
    onBallPaddleHit(data) {
        const { ball, paddle, paddleType } = data;
        
        // AI 성능 추적
        if (this.systems.ai) {
            this.systems.ai.onBallHit(ball, paddle);
        }
    }
    
    /**
     * 벽돌 충돌
     */
    onBrickHit(data) {
        const { ball, brick, brickSide } = data;
        
        // 그리드에서 제거
        this.removeBrickFromGrid(brick, brickSide === 'player');
    }
    
    /**
     * 벽돌 파괴
     */
    onBrickDestroyed(data) {
        const { brick, brickSide, destroyed } = data;
        
        if (destroyed) {
            // 점수 업데이트
            if (brickSide === 'player') {
                this.gameState.computerScore++;
            } else {
                this.gameState.playerScore++;
            }
            
            // 게임 종료 체크
            this.checkGameEnd();
        }
    }
    
    /**
     * 점수 업데이트
     */
    onScoreUpdate(data) {
        const { side, points } = data;
        
        if (side === 'player') {
            this.gameState.playerScore += points;
        } else {
            this.gameState.computerScore += points;
        }
    }
    
    /**
     * 공 분열 체크 및 실행
     */
    checkAndExecuteBallSplit() {
        if (this.gameState.ballSplitDone ||
            this.gameState.currentTime < GameConfig.BALL.SPLIT_TIME / 1000) {
            return;
        }
        
        // 승부 상황 분석
        const playerBricksLeft = this.entities.playerBricks.children.entries.length;
        const aiBricksLeft = this.entities.aiBricks.children.entries.length;
        
        const winningPlayer = playerBricksLeft > aiBricksLeft ? 'ai' : 'player';
        
        // 이기고 있는 플레이어 영역의 공을 분열
        const targetBall = this.entities.balls.children.entries.find(ball => {
            if (winningPlayer === 'player') {
                return ball.y > GameConfig.CALCULATED.GAME_CENTER_Y;
            } else {
                return ball.y < GameConfig.CALCULATED.GAME_CENTER_Y;
            }
        });
        
        if (targetBall && this.systems.physics) {
            const newBall = this.systems.physics.splitBall(targetBall);
            if (newBall) {
                this.entities.balls.add(newBall);
                this.gameState.ballSplitDone = true;
                
                console.log('Ball split executed');
            }
        }
    }
    
    /**
     * 새 벽돌 생성 체크
     */
    checkAndSpawnNewBricks() {
        const now = Date.now();
        if (now - this.gameState.lastBrickSpawn < GameConfig.BRICK.SPAWN_INTERVAL) {
            return;
        }
        
        this.gameState.lastBrickSpawn = now;
        
        // 빈 자리 찾기
        const emptyPlayerPositions = this.findEmptyPositions(true);
        const emptyAIPositions = this.findEmptyPositions(false);
        
        // 플레이어 사이드에 벽돌 추가
        if (emptyPlayerPositions.length > 0) {
            const randomPos = emptyPlayerPositions[Math.floor(Math.random() * emptyPlayerPositions.length)];
            const newBrick = BrickFactory.createBrick(this, randomPos.row, randomPos.col, true);
            this.entities.playerBricks.add(newBrick);
            this.addBrickToGrid(newBrick, true);
        }
        
        // AI 사이드에 벽돌 추가
        if (emptyAIPositions.length > 0) {
            const randomPos = emptyAIPositions[Math.floor(Math.random() * emptyAIPositions.length)];
            const newBrick = BrickFactory.createBrick(this, randomPos.row, randomPos.col, false);
            this.entities.aiBricks.add(newBrick);
            this.addBrickToGrid(newBrick, false);
        }
    }
    
    /**
     * 빈 위치 찾기
     */
    findEmptyPositions(isPlayerSide) {
        const emptyPositions = [];
        const grid = isPlayerSide ? this.brickGrid.player : this.brickGrid.ai;
        
        for (let row = 0; row < GameConfig.BRICK.ROWS; row++) {
            for (let col = 0; col < GameConfig.BRICK.COLS; col++) {
                if (grid[row][col] === null) {
                    emptyPositions.push({ row, col });
                }
            }
        }
        
        return emptyPositions;
    }
    
    /**
     * 게임 종료 체크
     */
    checkGameEnd() {
        if (!this.gameState.running) return;
        
        const playerBricksLeft = this.entities.playerBricks.children.entries.length;
        const aiBricksLeft = this.entities.aiBricks.children.entries.length;
        const ballsLeft = this.entities.balls.children.entries.length;
        
        // 승리 조건: 상대방 벽돌을 모두 깨거나, 공이 모두 없어짐
        if (playerBricksLeft === 0 || aiBricksLeft === 0 || ballsLeft === 0) {
            this.endGame(playerBricksLeft === 0);
        }
    }
    
    /**
     * 게임 종료
     */
    endGame(playerWon) {
        this.gameState.running = false;
        this.gameState.over = true;
        this.gameState.playerWon = playerWon;
        
        // 게임 종료 이벤트
        this.game.events.emit('gameover', {
            playerWon: playerWon,
            playerScore: this.gameState.playerScore,
            computerScore: this.gameState.computerScore,
            duration: this.gameState.currentTime
        });
        
        console.log(`Game ended - ${playerWon ? 'Player' : 'Computer'} won`);
        
        // GameOverScene으로 전환
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', {
                playerWon: playerWon,
                playerScore: this.gameState.playerScore,
                computerScore: this.gameState.computerScore,
                duration: this.gameState.currentTime
            });
        });
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 시간 업데이트
        if (this.uiElements && this.uiElements.timeLabel) {
            const minutes = Math.floor(this.gameState.currentTime / 60);
            const seconds = this.gameState.currentTime % 60;
            this.uiElements.timeLabel.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        // AI 색상 업데이트
        if (this.uiElements && this.uiElements.aiLabel && this.entities.aiPaddle) {
            const aiColor = `#${this.entities.aiPaddle.currentColor.toString(16).padStart(6, '0')}`;
            this.uiElements.aiLabel.setColor(aiColor);
        }
        
        // 카운트다운 오버레이
        this.updateCountdownOverlay();
        
        // 게임 오버 오버레이
        this.updateGameOverOverlay();
    }
    
    /**
     * 카운트다운 오버레이 업데이트
     */
    updateCountdownOverlay() {
        if (this.gameState.countdown > 0) {
            if (!this.countdownOverlay) {
                this.createCountdownOverlay();
            }
            this.updateCountdownDisplay();
        } else if (this.countdownOverlay) {
            this.countdownOverlay.destroy();
            this.countdownOverlay = null;
        }
    }
    
    /**
     * 카운트다운 오버레이 생성
     */
    createCountdownOverlay() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        this.countdownOverlay = this.add.container(0, 0);
        this.countdownOverlay.setDepth(200);
        
        // 반투명 배경
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, width, height);
        
        // 카운트다운 텍스트
        this.countdownText = this.add.text(width / 2, height / 2, '', {
            fontSize: '120px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        });
        this.countdownText.setOrigin(0.5, 0.5);
        
        this.countdownOverlay.add([overlay, this.countdownText]);
    }
    
    /**
     * 카운트다운 표시 업데이트
     */
    updateCountdownDisplay() {
        if (this.countdownText) {
            this.countdownText.setText(this.gameState.countdown.toString());
            
            // 펄스 효과
            const elapsed = Date.now() - this.gameState.countdownStartTime;
            const scale = Math.sin(elapsed % 1000 / 1000 * Math.PI) * 0.2 + 1;
            this.countdownText.setScale(scale);
        }
    }
    
    /**
     * 게임 오버 오버레이 업데이트
     */
    updateGameOverOverlay() {
        if (this.gameState.over && !this.gameOverOverlay) {
            this.createGameOverOverlay();
        }
    }
    
    /**
     * 게임 오버 오버레이 생성
     */
    createGameOverOverlay() {
        const width = GameConfig.CANVAS.WIDTH;
        const height = GameConfig.CANVAS.HEIGHT;
        
        this.gameOverOverlay = this.add.container(0, 0);
        this.gameOverOverlay.setDepth(200);
        
        // 반투명 배경
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        
        // 게임 오버 텍스트
        const gameOverText = this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
            fontSize: '60px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        });
        gameOverText.setOrigin(0.5, 0.5);
        
        // 승패 텍스트
        const resultText = this.add.text(width / 2, height / 2 + 20,
            this.gameState.playerWon ? 'YOU WIN' : 'YOU LOSE', {
            fontSize: '36px',
            fontWeight: 'bold',
            fill: this.gameState.playerWon ? '#4af' : '#f44',
            align: 'center'
        });
        resultText.setOrigin(0.5, 0.5);
        
        this.gameOverOverlay.add([overlay, gameOverText, resultText]);
    }
    
    /**
     * 씬 업데이트 (메인 게임 루프)
     */
    update(time, deltaTime) {
        if (this.gameState.running) {
            // 게임 시간 업데이트
            this.gameState.currentTime = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            
            // 플레이어 입력 처리
            this.handlePlayerInput();
            
            // 시스템 업데이트
            if (this.systems.physics) {
                this.systems.physics.update(deltaTime);
            }
            
            if (this.systems.ai) {
                this.systems.ai.update(deltaTime);
            }
            
            if (this.systems.collision) {
                this.systems.collision.update(deltaTime);
            }
            
            // 게임 로직 업데이트
            this.checkAndExecuteBallSplit();
            this.checkAndSpawnNewBricks();
            this.checkGameEnd();
        }
        
        // UI 업데이트 (항상 실행)
        this.updateUI();
    }
    
    /**
     * 플레이어 입력 처리
     */
    handlePlayerInput() {
        const playerPaddle = this.entities.playerPaddle;
        
        if (this.controls.leftKey.isDown) {
            playerPaddle.moveLeft();
        } else if (this.controls.rightKey.isDown) {
            playerPaddle.moveRight();
        } else {
            playerPaddle.stopMovement();
        }
    }
    
    /**
     * 씬 종료
     */
    shutdown() {
        // 오버레이 정리
        if (this.countdownOverlay) {
            this.countdownOverlay.destroy();
            this.countdownOverlay = null;
        }
        
        if (this.gameOverOverlay) {
            this.gameOverOverlay.destroy();
            this.gameOverOverlay = null;
        }
        
        // 이벤트 리스너 정리
        this.events.off('restartGame');
        this.events.off('stopGame');
        this.events.off('ballOutOfBounds');
        this.events.off('ballPaddleHit');
        this.events.off('brickHit');
        this.events.off('brickDestroyed');
        this.events.off('scoreUpdate');
        
        // 키보드 리스너 정리
        if (this.controls.spaceKey) {
            this.controls.spaceKey.off('down');
        }
        
        // 시스템들 정리
        if (this.systems.physics) this.systems.physics.destroy();
        if (this.systems.ai) this.systems.ai.destroy();
        if (this.systems.collision) this.systems.collision.destroy();
        
        console.log('GameScene shutdown');
    }
}
