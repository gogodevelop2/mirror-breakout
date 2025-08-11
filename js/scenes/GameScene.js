class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 게임 상태
        this.gameStarted = false;
        this.gameTime = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        
        // 게임 오브젝트
        this.balls = [];
        this.paddlePlayer = null;
        this.paddleAI = null;
        this.bricksPlayer = null;
        this.bricksAI = null;
        
        // 시스템
        this.physicsSystem = null;
        this.collisionSystem = null;
        this.aiSystem = null;
        
        // 입력
        this.cursors = null;
    }
    
    create() {
        // 배경 그라데이션 효과
        this.createBackground();
        
        // 물리 그룹 생성
        this.bricksPlayer = this.physics.add.staticGroup();
        this.bricksAI = this.physics.add.staticGroup();
        
        // 게임 오브젝트 생성
        this.createPaddles();
        this.createBalls();
        this.createBricks();
        
        // 시스템 초기화
        this.physicsSystem = new PhysicsSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.init(this.physicsSystem);
        this.aiSystem = new AISystem(this, this.paddleAI);
        
        // 충돌 설정
        this.setupCollisions();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 입력 설정
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 시간 이벤트
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
        
        // UI 텍스트
        this.createUI();
        
        // 게임 시작
        this.startGame();
    }
    
    createBackground() {
        // 배경 그라데이션
        const graphics = this.add.graphics();
        
        // 상단 (플레이어 영역) - 파란색 계열
        const gradientTop = graphics.createLinearGradient(0, 0, 0, this.cameras.main.height / 2);
        gradientTop.addColorStop(0, '#001133');
        gradientTop.addColorStop(1, '#000511');
        
        graphics.fillGradientStyle(gradientTop);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height / 2);
        
        // 하단 (AI 영역) - 빨간색 계열
        const gradientBottom = graphics.createLinearGradient(0, this.cameras.main.height / 2, 0, this.cameras.main.height);
        gradientBottom.addColorStop(0, '#000511');
        gradientBottom.addColorStop(1, '#110011');
        
        graphics.fillGradientStyle(gradientBottom);
        graphics.fillRect(0, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height / 2);
        
        // 중앙 라인 효과
        graphics.fillStyle(0x4488ff, 0.1);
        graphics.fillRect(0, this.cameras.main.height / 2 - 2, this.cameras.main.width, 4);
        
        // 배경 파티클 효과 (분위기)
        this.createBackgroundParticles();
    }
    
    createBackgroundParticles() {
        // 은은한 배경 파티클
        const particles1 = this.add.particles(0, 0, 'ball', {
            x: { min: 0, max: this.cameras.main.width },
            y: { min: 0, max: this.cameras.main.height },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            speed: 20,
            lifespan: 3000,
            frequency: 500,
            tint: 0x4488ff,
            blendMode: 'ADD'
        });
        particles1.setDepth(-1);
    }
    
    createPaddles() {
        // 플레이어 패들 (상단)
        this.paddlePlayer = new Paddle(
            this,
            this.cameras.main.width / 2,
            GAME_CONFIG.PADDLE.PLAYER.Y,
            'player'
        );
        
        // AI 패들 (하단)
        this.paddleAI = new Paddle(
            this,
            this.cameras.main.width / 2,
            GAME_CONFIG.PADDLE.AI.Y,
            'ai'
        );
    }
    
    createBalls() {
        // 초기 공 생성
        const ball = new Ball(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        this.balls.push(ball);
    }
    
    createBricks() {
        const brickWidth = GAME_CONFIG.BRICK.WIDTH;
        const brickHeight = GAME_CONFIG.BRICK.HEIGHT;
        const padding = GAME_CONFIG.BRICK.PADDING;
        
        // 랜덤 패턴 생성
        const pattern = this.generateBrickPattern();
        
        // 플레이어 벽돌 (상단)
        for (let row = 0; row < GAME_CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.BRICK.COLS; col++) {
                const index = row * GAME_CONFIG.BRICK.COLS + col;
                if (pattern[index]) {
                    const x = col * (brickWidth + padding) + brickWidth / 2 + 15;
                    const y = row * (brickHeight + padding) + GAME_CONFIG.BRICK.OFFSET_TOP;
                    
                    const brick = this.bricksPlayer.create(x, y, `brickPlayer${row}`);
                    brick.setOrigin(0.5, 0.5);
                    brick.refreshBody();
                }
            }
        }
        
        // AI 벽돌 (하단 - 동일 패턴 미러링)
        for (let row = 0; row < GAME_CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.BRICK.COLS; col++) {
                const index = row * GAME_CONFIG.BRICK.COLS + col;
                if (pattern[index]) {
                    const x = col * (brickWidth + padding) + brickWidth / 2 + 15;
                    const y = this.cameras.main.height - (row * (brickHeight + padding) + GAME_CONFIG.BRICK.OFFSET_BOTTOM + brickHeight);
                    
                    const brick = this.bricksAI.create(x, y, `brickAI${row}`);
                    brick.setOrigin(0.5, 0.5);
                    brick.refreshBody();
                }
            }
        }
    }
    
    generateBrickPattern() {
        // 랜덤하지만 플레이 가능한 패턴 생성
        const pattern = [];
        const totalBricks = GAME_CONFIG.BRICK.ROWS * GAME_CONFIG.BRICK.COLS;
        
        for (let i = 0; i < totalBricks; i++) {
            pattern.push(Math.random() < 0.7);
        }
        
        // 최소 벽돌 수 보장 (50%)
        const brickCount = pattern.filter(b => b).length;
        const minBricks = Math.floor(totalBricks * 0.5);
        
        if (brickCount < minBricks) {
            // 부족한 만큼 추가
            let added = 0;
            for (let i = 0; i < totalBricks && added < minBricks - brickCount; i++) {
                if (!pattern[i]) {
                    pattern[i] = true;
                    added++;
                }
            }
        }
        
        return pattern;
    }
    
    setupCollisions() {
        // CollisionSystem을 통한 충돌 설정
        this.collisionSystem.setupCollisions(
            this.balls,
            this.paddlePlayer,
            this.paddleAI,
            this.bricksPlayer,
            this.bricksAI
        );
    }
    
    setupEventListeners() {
        // 충돌 이벤트 리스너
        this.events.on('brickDestroyed', (data) => {
            // 점수 업데이트
            if (data.owner === 'player') {
                this.aiScore += data.points;
            } else {
                this.playerScore += data.points;
            }
            this.updateScore();
            
            // 파티클 효과
            const color = data.owner === 'player' ? 0x4488ff : 0xff4488;
            this.createBrickDestroyEffect(data.x, data.y, color);
            
            // 승리 체크
            if (this.bricksPlayer.countActive() === 0) {
                this.gameWin(true);
            } else if (this.bricksAI.countActive() === 0) {
                this.gameWin(false);
            }
        });
        
        // 콤보 이벤트
        this.events.on('combo', (data) => {
            this.showComboText(data.owner, data.count);
        });
    }
    
    showComboText(owner, count) {
        // 콤보 텍스트 표시
        const y = owner === 'player' ? 100 : this.cameras.main.height - 100;
        const color = owner === 'player' ? '#4488ff' : '#ff4488';
        
        const comboText = this.add.text(
            this.cameras.main.width / 2,
            y,
            `${count}x COMBO!`,
            {
                fontSize: '32px',
                color: color,
                fontWeight: 'bold',
                fontFamily: 'Orbitron'
            }
        );
        comboText.setOrigin(0.5, 0.5);
        
        // 애니메이션
        this.tweens.add({
            targets: comboText,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            onComplete: () => comboText.destroy()
        });
    }
    
    createBrickDestroyEffect(x, y, color) {
        // 벽돌 파괴 파티클
        const particles = this.add.particles(x, y, 'ball', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            lifespan: 400,
            quantity: 8,
            tint: color,
            angle: { min: 0, max: 360 }
        });
        
        // 충격파 효과
        const shockwave = this.add.circle(x, y, 10, color, 0.5);
        this.tweens.add({
            targets: shockwave,
            radius: 40,
            alpha: 0,
            duration: 300,
            onComplete: () => shockwave.destroy()
        });
        
        this.time.delayedCall(600, () => {
            particles.destroy();
        });
    }
    
    createUI() {
        // 플레이어 라벨
        this.add.text(20, 20, 'PLAYER', {
            fontSize: '20px',
            color: '#4488ff',
            fontWeight: 'bold',
            fontFamily: 'Arial'
        });
        
        // AI 라벨
        this.add.text(20, this.cameras.main.height - 40, 'COMPUTER', {
            fontSize: '20px',
            color: '#ff4488',
            fontWeight: 'bold',
            fontFamily: 'Arial'
        });
        
        // 점수 텍스트 (외부 HTML 업데이트)
        this.updateScore();
    }
    
    startGame() {
        // 카운트다운 후 게임 시작
        const countdownText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '3',
            {
                fontSize: '80px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'Orbitron'
            }
        );
        countdownText.setOrigin(0.5, 0.5);
        countdownText.setDepth(100);
        
        let count = 3;
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                    // 카운트다운 효과
                    this.tweens.add({
                        targets: countdownText,
                        scale: { from: 1.5, to: 1 },
                        duration: 300,
                        ease: 'Back'
                    });
                } else {
                    countdownText.setText('GO!');
                    countdownText.setColor('#4af');
                    this.tweens.add({
                        targets: countdownText,
                        scale: { from: 1, to: 2 },
                        alpha: { from: 1, to: 0 },
                        duration: 500,
                        onComplete: () => {
                            countdownText.destroy();
                            this.launchBalls();
                            this.gameStarted = true;
                        }
                    });
                }
            },
            repeat: 3
        });
    }
    
    launchBalls() {
        // 모든 공 발사
        this.balls.forEach((ball, index) => {
            this.time.delayedCall(index * 100, () => {
                const angle = Phaser.Math.FloatBetween(-Math.PI/4, Math.PI/4) - Math.PI/2;
                ball.launch(angle);
            });
        });
    }
    
    updateGameTime() {
        if (this.gameStarted) {
            this.gameTime++;
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            document.getElementById('time').textContent =
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent =
            `Score: ${this.playerScore}`;
    }
    
    gameWin(playerWon) {
        this.gameStarted = false;
        
        // 모든 공 정지
        this.balls.forEach(ball => {
            ball.setVelocity(0, 0);
        });
        
        // 게임 오버 씬으로 데이터 전달
        this.scene.start('GameOverScene', {
            playerWon: playerWon,
            score: this.playerScore,
            time: this.gameTime
        });
    }
    
    update(time, delta) {
        if (!this.gameStarted) return;
        
        // 플레이어 패들 컨트롤
        if (this.cursors.left.isDown) {
            this.paddlePlayer.moveLeft();
        } else if (this.cursors.right.isDown) {
            this.paddlePlayer.moveRight();
        } else {
            this.paddlePlayer.stop();
        }
        
        // 패들 업데이트
        this.paddlePlayer.update(delta);
        this.paddleAI.update(delta);
        
        // AI 업데이트
        this.aiSystem.update(time, this.balls);
        
        // 공 업데이트
        this.balls.forEach(ball => {
            ball.update();
            
            // 공이 화면 밖으로 나갔는지 체크 (안전장치)
            if (ball.y < -50 || ball.y > this.cameras.main.height + 50) {
                ball.reset(this.cameras.main.width / 2, this.cameras.main.height / 2);
                ball.launch();
            }
        });
    }
}
