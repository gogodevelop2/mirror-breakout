class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 게임 상태
        this.gameStarted = false;
        this.gameTime = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        
        // 게임 오브젝트
        this.ball = null;
        this.paddlePlayer = null;
        this.paddleAI = null;
        this.bricksPlayer = null;
        this.bricksAI = null;
        
        // 입력
        this.cursors = null;
        
        // AI 상태
        this.aiUpdateTime = 0;
    }
    
    create() {
        // 배경 그라데이션 효과
        this.createBackground();
        
        // 물리 그룹 생성
        this.bricksPlayer = this.physics.add.staticGroup();
        this.bricksAI = this.physics.add.staticGroup();
        
        // 게임 오브젝트 생성
        this.createPaddles();
        this.createBall();
        this.createBricks();
        
        // 충돌 설정
        this.setupCollisions();
        
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
    }
    
    createPaddles() {
        // 플레이어 패들 (상단)
        this.paddlePlayer = this.physics.add.sprite(
            this.cameras.main.width / 2,
            GAME_CONFIG.PADDLE.PLAYER.Y,
            'paddlePlayer'
        );
        this.paddlePlayer.setImmovable(true);
        this.paddlePlayer.body.allowGravity = false;
        this.paddlePlayer.setCollideWorldBounds(true);
        
        // AI 패들 (하단)
        this.paddleAI = this.physics.add.sprite(
            this.cameras.main.width / 2,
            GAME_CONFIG.PADDLE.AI.Y,
            'paddleAI'
        );
        this.paddleAI.setImmovable(true);
        this.paddleAI.body.allowGravity = false;
        this.paddleAI.setCollideWorldBounds(true);
    }
    
    createBall() {
        // 공 생성 (중앙에서 시작)
        this.ball = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'ball'
        );
        
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(GAME_CONFIG.PHYSICS.BALL_BOUNCE);
        this.ball.body.allowGravity = false;
        
        // 공에 글로우 효과 추가
        this.ball.setScale(1);
        this.ball.preFX.addGlow(0xffffff, 4, 0, false, 0.1, 10);
    }
    
    createBricks() {
        const brickWidth = GAME_CONFIG.BRICK.WIDTH;
        const brickHeight = GAME_CONFIG.BRICK.HEIGHT;
        const padding = GAME_CONFIG.BRICK.PADDING;
        
        // 플레이어 벽돌 (상단)
        for (let row = 0; row < GAME_CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.BRICK.COLS; col++) {
                // 70% 확률로 벽돌 생성
                if (Math.random() < 0.7) {
                    const x = col * (brickWidth + padding) + brickWidth / 2 + 15;
                    const y = row * (brickHeight + padding) + GAME_CONFIG.BRICK.OFFSET_TOP;
                    
                    const brick = this.bricksPlayer.create(x, y, `brickPlayer${row}`);
                    brick.setOrigin(0.5, 0.5);
                    brick.refreshBody();
                }
            }
        }
        
        // AI 벽돌 (하단 - 미러링)
        for (let row = 0; row < GAME_CONFIG.BRICK.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.BRICK.COLS; col++) {
                // 플레이어와 동일한 패턴으로 생성
                if (Math.random() < 0.7) {
                    const x = col * (brickWidth + padding) + brickWidth / 2 + 15;
                    const y = this.cameras.main.height - (row * (brickHeight + padding) + GAME_CONFIG.BRICK.OFFSET_BOTTOM + brickHeight);
                    
                    const brick = this.bricksAI.create(x, y, `brickAI${row}`);
                    brick.setOrigin(0.5, 0.5);
                    brick.refreshBody();
                }
            }
        }
    }
    
    setupCollisions() {
        // 패들과 공 충돌
        this.physics.add.collider(
            this.ball,
            this.paddlePlayer,
            this.hitPaddle,
            null,
            this
        );
        
        this.physics.add.collider(
            this.ball,
            this.paddleAI,
            this.hitPaddle,
            null,
            this
        );
        
        // 벽돌과 공 충돌
        this.physics.add.collider(
            this.ball,
            this.bricksPlayer,
            this.hitBrick,
            null,
            this
        );
        
        this.physics.add.collider(
            this.ball,
            this.bricksAI,
            this.hitBrickAI,
            null,
            this
        );
    }
    
    hitPaddle(ball, paddle) {
        // 패들 중심과 공의 상대 위치에 따라 반사 각도 조정
        const diff = ball.x - paddle.x;
        const normalizedDiff = diff / (paddle.width / 2);
        
        // X 속도를 상대 위치에 따라 조정
        ball.setVelocityX(normalizedDiff * 300);
        
        // Y 속도 방향 반전 및 약간의 가속
        const currentVelY = ball.body.velocity.y;
        ball.setVelocityY(-currentVelY * GAME_CONFIG.PHYSICS.PADDLE_BOUNCE);
        
        // 최대 속도 제한
        const velocity = ball.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > GAME_CONFIG.BALL.MAX_SPEED) {
            const scale = GAME_CONFIG.BALL.MAX_SPEED / speed;
            ball.setVelocity(velocity.x * scale, velocity.y * scale);
        }
        
        // 패들 히트 효과
        this.tweens.add({
            targets: paddle,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 100,
            yoyo: true
        });
    }
    
    hitBrick(ball, brick) {
        brick.destroy();
        this.playerScore += GAME_CONFIG.SCORE.BRICK_DESTROY;
        this.updateScore();
        
        // 파티클 효과
        this.createBrickDestroyEffect(brick.x, brick.y, 0x4488ff);
        
        // 승리 체크
        if (this.bricksPlayer.countActive() === 0) {
            this.gameWin(true);
        }
    }
    
    hitBrickAI(ball, brick) {
        brick.destroy();
        this.aiScore += GAME_CONFIG.SCORE.BRICK_DESTROY;
        this.updateScore();
        
        // 파티클 효과
        this.createBrickDestroyEffect(brick.x, brick.y, 0xff4488);
        
        // 패배 체크
        if (this.bricksAI.countActive() === 0) {
            this.gameWin(false);
        }
    }
    
    createBrickDestroyEffect(x, y, color) {
        // 간단한 파티클 효과
        const particles = this.add.particles(x, y, 'ball', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            quantity: 5,
            tint: color
        });
        
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    createUI() {
        // 플레이어 라벨
        this.add.text(20, 20, 'PLAYER', {
            fontSize: '20px',
            color: '#4488ff',
            fontWeight: 'bold'
        });
        
        // AI 라벨
        this.add.text(20, this.cameras.main.height - 40, 'COMPUTER', {
            fontSize: '20px',
            color: '#ff4488',
            fontWeight: 'bold'
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
                fontWeight: 'bold'
            }
        );
        countdownText.setOrigin(0.5, 0.5);
        
        let count = 3;
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                } else {
                    countdownText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        countdownText.destroy();
                        this.launchBall();
                        this.gameStarted = true;
                    });
                }
            },
            repeat: 3
        });
    }
    
    launchBall() {
        // 랜덤 방향으로 공 발사
        const velocityX = Phaser.Math.Between(-200, 200);
        const velocityY = Phaser.Math.Between(0, 1) === 0 ? -300 : 300;
        this.ball.setVelocity(velocityX, velocityY);
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
    
    updateAI() {
        if (!this.gameStarted || !this.ball) return;
        
        const currentTime = this.time.now;
        
        // AI 반응 시간 체크
        if (currentTime - this.aiUpdateTime < GAME_CONFIG.PADDLE.AI.REACTION_TIME) {
            return;
        }
        
        this.aiUpdateTime = currentTime;
        
        // 공이 AI 쪽으로 향할 때만 반응
        if (this.ball.body.velocity.y > 0) {
            const diff = this.ball.x - this.paddleAI.x;
            
            // 부드러운 추적
            if (Math.abs(diff) > 5) {
                const moveSpeed = Math.min(Math.abs(diff) * 2, GAME_CONFIG.PADDLE.AI.BASE_SPEED);
                this.paddleAI.setVelocityX(diff > 0 ? moveSpeed : -moveSpeed);
            } else {
                this.paddleAI.setVelocityX(0);
            }
        } else {
            // 중앙으로 복귀
            const centerDiff = this.cameras.main.width / 2 - this.paddleAI.x;
            if (Math.abs(centerDiff) > 10) {
                this.paddleAI.setVelocityX(centerDiff > 0 ? 100 : -100);
            } else {
                this.paddleAI.setVelocityX(0);
            }
        }
    }
    
    gameWin(playerWon) {
        this.gameStarted = false;
        this.ball.setVelocity(0, 0);
        
        // 게임 오버 씬으로 데이터 전달
        this.scene.start('GameOverScene', {
            playerWon: playerWon,
            score: this.playerScore,
            time: this.gameTime
        });
    }
    
    update() {
        if (!this.gameStarted) return;
        
        // 플레이어 패들 컨트롤
        if (this.cursors.left.isDown) {
            this.paddlePlayer.setVelocityX(-GAME_CONFIG.PADDLE.PLAYER.SPEED);
        } else if (this.cursors.right.isDown) {
            this.paddlePlayer.setVelocityX(GAME_CONFIG.PADDLE.PLAYER.SPEED);
        } else {
            this.paddlePlayer.setVelocityX(0);
        }
        
        // AI 업데이트
        this.updateAI();
        
        // 공이 화면 밖으로 나갔는지 체크 (안전장치)
        if (this.ball.y < -50 || this.ball.y > this.cameras.main.height + 50) {
            // 공 리셋
            this.ball.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
            this.launchBall();
        }
    }
}
