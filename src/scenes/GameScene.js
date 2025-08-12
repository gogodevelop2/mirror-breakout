import { PhysicsManager } from '../systems/PhysicsManager.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { AIController } from '../systems/AIController.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { ParticleEffects } from '../effects/ParticleEffects.js';
import { Ball } from '../entities/Ball.js';
import { Paddle } from '../entities/Paddle.js';
import { Brick } from '../entities/Brick.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // 게임 상태 초기화
        this.gameState = {
            running: false,
            over: false,
            playerWon: false,
            startTime: 0,
            time: 0,
            ballSplitDone: false,
            playerScore: 0,
            computerScore: 0,
            countdown: 0,
            countdownStartTime: 0,
            lastBrickSpawn: 0
        };
        
        // 엔티티 배열
        this.balls = [];
        this.bricks = { player1: [], player2: [] };
        
        // 입력 상태
        this.keys = {};
    }

    create() {
        // 시스템 초기화
        this.setupSystems();
        
        // 배경 생성
        this.createBackground();
        
        // 게임 엔티티 생성
        this.createEntities();
        
        // UI 생성
        this.createUI();
        
        // 입력 설정
        this.setupInput();
        
        // 게임 시작
        this.startCountdown();
    }

    setupSystems() {
        // 물리 시스템
        this.physicsManager = new PhysicsManager(this);
        
        // 충돌 시스템
        this.collisionSystem = new CollisionSystem(this);
        
        // 난이도 관리자
        this.difficultyManager = new DifficultyManager(this);
        
        // 파티클 효과
        this.particleEffects = new ParticleEffects(this);
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        
        // 배경 그라데이션
        const graphics = this.add.graphics();
        
        const colors = [0x001133, 0x000511, 0x110011];
        
        for (let i = 0; i < height; i++) {
            const progress = i / height;
            let color;
            
            if (progress < 0.5) {
                const t = progress * 2;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(colors[0]),
                    Phaser.Display.Color.ValueToColor(colors[1]),
                    1,
                    t
                );
            } else {
                const t = (progress - 0.5) * 2;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(colors[1]),
                    Phaser.Display.Color.ValueToColor(colors[2]),
                    1,
                    t
                );
            }
            
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, i, width, 1);
        }

        // 중앙 효과
        const centerEffect = this.add.graphics();
        centerEffect.fillGradientStyle(0x64c8ff, 0x64c8ff, 0x64c8ff, 0x64c8ff, 0, 0.1, 0, 0);
        centerEffect.fillRect(0, height/2 - 30, width, 60);
    }

    createEntities() {
        // 패들 생성
        this.paddle1 = new Paddle(this, 270, 320, true);
        this.paddle2 = new Paddle(this, 270, this.cameras.main.height - 332, false);
        
        // AI 컨트롤러 설정
        this.aiController = new AIController(this, this.paddle2, this.difficultyManager);
        
        // 공 생성
        this.createBalls();
        
        // 벽돌 생성
        this.createBricks();
    }

    createBalls() {
        this.balls = [
            new Ball(this, 300, 280, 3, -4),
            new Ball(this, 300, 420, -3, 4)
        ];
    }

    createBricks() {
        // 랜덤 패턴 생성
        const pattern = this.generateRandomBrickPattern();
        
        // 플레이어1 벽돌 (상단)
        this.bricks.player1 = this.createBrickSet(true, pattern);
        
        // 플레이어2 벽돌 (하단)
        this.bricks.player2 = this.createBrickSet(false, pattern);
    }

    generateRandomBrickPattern() {
        const config = this.game.config.game;
        const totalBricks = config.BRICK_ROWS * config.BRICK_COLS;
        const pattern = [];
        
        for (let i = 0; i < totalBricks; i++) {
            pattern.push(Math.random() < 0.7);
        }
        
        // 최소 벽돌 수 보장
        const minBricks = Math.floor(totalBricks * 0.5);
        const currentBricks = pattern.filter(Boolean).length;
        
        if (currentBricks < minBricks) {
            const emptyPositions = pattern.map((hasBrick, index) => hasBrick ? -1 : index).filter(index => index !== -1);
            const needToAdd = minBricks - currentBricks;
            
            for (let i = 0; i < needToAdd && emptyPositions.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * emptyPositions.length);
                const position = emptyPositions.splice(randomIndex, 1)[0];
                pattern[position] = true;
            }
        }
        
        return pattern;
    }

    createBrickSet(isPlayer1, pattern) {
        const config = this.game.config.game;
        const bricks = [];
        
        for (let i = 0; i < config.BRICK_ROWS * config.BRICK_COLS; i++) {
            if (!pattern[i]) continue;
            
            const row = Math.floor(i / config.BRICK_COLS);
            const col = i % config.BRICK_COLS;
            
            const x = col * config.BRICK_SPACING_X + 15;
            const y = isPlayer1
                ? row * config.BRICK_SPACING_Y + 40
                : this.cameras.main.height - (row * config.BRICK_SPACING_Y + 58);
            
            const brick = new Brick(this, x, y, isPlayer1, row);
            bricks.push(brick);
        }
        
        return bricks;
    }

    createUI() {
        const { width, height } = this.cameras.main;
        
        // 플레이어 라벨
        this.add.text(20, 30, 'PLAYER (You)', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            fill: '#4488ff'
        });
        
        this.add.text(20, height - 10, 'COMPUTER', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            fill: '#ff4488'
        });
        
        // 시간 표시
        this.timeText = this.add.text(width - 100, 30, 'Time: 0:00', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            fill: '#fff'
        });
    }

    setupInput() {
        // 키보드 입력
        this.input.keyboard.on('keydown', (event) => {
            this.keys[event.key] = true;
        });
        
        this.input.keyboard.on('keyup', (event) => {
            this.keys[event.key] = false;
        });
        
        // ESC 키로 메뉴로 돌아가기
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    startCountdown() {
        this.gameState.countdown = 3;
        this.gameState.countdownStartTime = Date.now();
        this.runCountdown();
    }

    runCountdown() {
        const elapsed = Date.now() - this.gameState.countdownStartTime;
        const secondsElapsed = Math.floor(elapsed / 1000);
        
        if (secondsElapsed < 3) {
            this.gameState.countdown = 3 - secondsElapsed;
            this.time.delayedCall(100, () => this.runCountdown());
        } else {
            this.gameState.countdown = 0;
            this.time.delayedCall(500, () => {
                this.gameState.running = true;
                this.gameState.startTime = Date.now();
            });
        }
    }

    update() {
        if (!this.gameState.running) return;
        
        // 시간 업데이트
        this.gameState.time = Math.floor((Date.now() - this.gameState.startTime) / 1000);
        this.updateUI();
        
        // 시스템 업데이트
        this.difficultyManager.update();
        this.aiController.update(this.balls);
        
        // 플레이어 패들 업데이트
        this.paddle1.update(this.keys);
        this.paddle2.update();
        
        // 공 업데이트
        this.balls.forEach(ball => ball.update());
        
        // 충돌 체크
        this.collisionSystem.checkAllCollisions(this.balls, [this.paddle1, this.paddle2], this.bricks);
        
        // 공 분열 체크
        this.checkBallSplit();
        
        // 새 벽돌 생성
        this.spawnNewBricks();
        
        // 게임 종료 체크
        this.checkGameEnd();
    }

    updateUI() {
        const minutes = Math.floor(this.gameState.time / 60);
        const seconds = this.gameState.time % 60;
        this.timeText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    checkBallSplit() {
        const config = this.game.config.game;
        if (this.gameState.ballSplitDone || this.gameState.time < config.SPLIT_TIME || this.balls.length === 0) return;

        const totalBricks = config.BRICK_ROWS * config.BRICK_COLS;
        const p1Broken = totalBricks - this.bricks.player1.length;
        const p2Broken = totalBricks - this.bricks.player2.length;
        const winningPlayer = p1Broken > p2Broken ? 'player1' : 'player2';
        
        const targetBall = this.balls.find(ball =>
            winningPlayer === 'player1' ? ball.y < this.cameras.main.height / 2 : ball.y > this.cameras.main.height / 2
        ) || this.balls[0];
        
        if (targetBall) {
            // 분열 효과
            this.particleEffects.createSplitEffect(targetBall.x, targetBall.y, winningPlayer === 'player1' ? '#4488ff' : '#ff4488');
            
            // 새 공 생성
            const newBall = new Ball(this, targetBall.x, targetBall.y, -targetBall.dx * 1.2, -targetBall.dy * 0.8);
            this.balls.push(newBall);
            
            this.gameState.ballSplitDone = true;
        }
    }

    spawnNewBricks() {
        const config = this.game.config.game;
        if (this.gameState.time < config.BRICK_SPAWN_INTERVAL ||
            Date.now() - this.gameState.lastBrickSpawn < config.BRICK_SPAWN_INTERVAL * 1000) return;
        
        this.gameState.lastBrickSpawn = Date.now();
        
        // 플레이어1 영역에 벽돌 추가
        this.trySpawnBrick(true);
        
        // 플레이어2 영역에 벽돌 추가
        this.trySpawnBrick(false);
    }

    trySpawnBrick(isPlayer1) {
        const config = this.game.config.game;
        const emptyPositions = this.findEmptyPositions(isPlayer1);
        
        if (emptyPositions.length > 0) {
            const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            const newBrick = new Brick(this, randomPos.x, randomPos.y, isPlayer1, randomPos.row);
            
            if (isPlayer1) {
                this.bricks.player1.push(newBrick);
            } else {
                this.bricks.player2.push(newBrick);
            }
            
            // 스폰 효과
            this.particleEffects.createSpawnEffect(
                newBrick.x + newBrick.width / 2,
                newBrick.y + newBrick.height / 2,
                isPlayer1 ? '#4488ff' : '#ff4488'
            );
        }
    }

    findEmptyPositions(isPlayer1) {
        const config = this.game.config.game;
        const emptyPositions = [];
        const existingBricks = isPlayer1 ? this.bricks.player1 : this.bricks.player2;
        
        for (let row = 0; row < config.BRICK_ROWS; row++) {
            for (let col = 0; col < config.BRICK_COLS; col++) {
                const x = col * config.BRICK_SPACING_X + 15;
                const y = isPlayer1
                    ? row * config.BRICK_SPACING_Y + 40
                    : this.cameras.main.height - (row * config.BRICK_SPACING_Y + 58);
                
                // 해당 위치에 벽돌이 있는지 확인
                const hasExistingBrick = existingBricks.some(brick =>
                    Math.abs(brick.x - x) < 5 && Math.abs(brick.y - y) < 5
                );
                
                if (!hasExistingBrick) {
                    emptyPositions.push({ row, col, x, y });
                }
            }
        }
        
        return emptyPositions;
    }

    checkGameEnd() {
        if (!this.gameState.running) return;

        const p1Count = this.bricks.player1.length;
        const p2Count = this.bricks.player2.length;

        if (p1Count === 0 || p2Count === 0) {
            this.gameState.running = false;
            this.gameState.over = true;
            this.gameState.playerWon = p1Count === 0;
            
            // 게임 오버 씬으로 전환
            this.time.delayedCall(2000, () => {
                this.scene.start('GameOverScene', {
                    playerWon: this.gameState.playerWon,
                    time: this.gameState.time,
                    playerScore: this.gameState.playerScore,
                    computerScore: this.gameState.computerScore
                });
            });
        }
    }

    render() {
        // 카운트다운 표시
        if (this.gameState.countdown > 0) {
            const { width, height } = this.cameras.main;
            
            // 오버레이
            this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
            
            // 카운트다운 텍스트
            const countdownText = this.add.text(width / 2, height / 2, this.gameState.countdown.toString(), {
                fontSize: '120px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            // 애니메이션 효과
            const scale = Math.sin((Date.now() - this.gameState.countdownStartTime) % 1000 / 1000 * Math.PI) * 0.2 + 1;
            countdownText.setScale(scale);
        }
        
        // START 표시
        else if (this.gameState.countdown === 0 && !this.gameState.running && !this.gameState.over && this.gameState.countdownStartTime > 0) {
            const { width, height } = this.cameras.main;
            
            this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
            
            const startText = this.add.text(width / 2, height / 2, 'START!', {
                fontSize: '80px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: '#4af'
            }).setOrigin(0.5);
        }

        // 게임 오버 표시
        if (this.gameState.over) {
            const { width, height } = this.cameras.main;
            
            this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
            
            this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
                fontSize: '60px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            this.add.text(width / 2, height / 2 + 20, this.gameState.playerWon ? 'YOU WIN' : 'YOU LOSE', {
                fontSize: '36px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: this.gameState.playerWon ? '#4af' : '#f44'
            }).setOrigin(0.5);
        }
    }
}
