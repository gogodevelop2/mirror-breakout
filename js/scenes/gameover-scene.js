// js/scenes/gameover-scene.js
// Game Over scene - Arcade Style with Score Animation & High Score Table

class GameOverScene extends BaseScene {
    constructor() {
        super('GameOver');

        // Game results
        this.results = {
            playerScore: 0,
            aiScore: 0,
            gameTime: 0,
            playerWon: false,
            finalScore: null
        };

        // Scene phase (state machine)
        this.phase = 'SCORE_ANIMATION';  // SCORE_ANIMATION, NAME_INPUT, HIGHSCORE_TABLE, READY
        this.phaseTime = 0;

        // Score animation state
        this.scoreAnimation = {
            step: 0,  // 0: Base, 1: ScoreDiff, 2: Time, 3: Total
            stepTime: 0,
            stepDelay: 0.8,  // seconds per step
            values: [0, 0, 0, 0]
        };

        // Name input state
        this.nameInput = {
            name: '',
            cursorBlink: 0,
            newRank: -1  // Rank achieved in high score table
        };

        // High score table state
        this.highScoreTable = {
            newEntryBlink: 0
        };

        // Network state (Supabase)
        this.networkState = {
            submitting: false,
            error: null,
            globalRank: -1
        };

        // Buttons
        this.buttons = {
            retry: {
                x: 0, y: 0, width: 180, height: 60,
                text: 'RETRY', hovered: false
            },
            menu: {
                x: 0, y: 0, width: 180, height: 60,
                text: 'MENU', hovered: false
            }
        };

        // Animation
        this.time = 0;

        // Callbacks
        this.onRetry = null;
        this.onMenu = null;
    }

    onEnter(data) {
        super.onEnter(data);

        // Clear background canvas with dark overlay
        if (this.bgCanvas) {
            const bgCtx = this.bgCanvas.getContext('2d');
            bgCtx.fillStyle = 'rgba(10, 10, 20, 0.95)';
            bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }

        // Store game results
        this.results = {
            playerScore: data.playerScore || 0,
            aiScore: data.aiScore || 0,
            gameTime: data.gameTime || 0,
            playerWon: data.playerWon || false,
            finalScore: data.finalScore || null
        };

        console.log('[GameOverScene] Results:', this.results);

        this.time = 0;
        this.phaseTime = 0;

        // Determine starting phase
        if (this.results.playerWon && this.results.finalScore) {
            // Victory: Start with score animation
            this.phase = 'SCORE_ANIMATION';
            this.scoreAnimation.step = 0;
            this.scoreAnimation.stepTime = 0;
        } else {
            // Defeat: Skip to high score table
            this.phase = 'HIGHSCORE_TABLE';
        }

        // Supabase 사용 가능 여부 체크
        if (!HighScore.isAvailable()) {
            console.warn('[GameOverScene] Supabase not available');
            this.networkState.error = '네트워크 연결이 필요합니다';
        } else {
            this.networkState.error = null;
        }

        // 최신 글로벌 점수 가져오기 (비동기, UI 블로킹 없음)
        this.refreshLeaderboard();

        this.updateLayout();
    }

    /**
     * 백그라운드에서 최신 리더보드 가져오기
     */
    async refreshLeaderboard() {
        try {
            await HighScore.fetchGlobalScores();
            console.log('[GameOverScene] Leaderboard refreshed');
        } catch (error) {
            console.error('[GameOverScene] Failed to refresh leaderboard:', error);
            // 캐시된 점수라도 표시 (에러는 이미 HighScore에 저장됨)
        }
    }

    /**
     * 점수 제출 (Supabase)
     */
    async submitScore(name, score, breakdown) {
        if (!HighScore.isAvailable()) {
            this.networkState.error = '네트워크 연결이 필요합니다';
            throw new Error(this.networkState.error);
        }

        this.networkState.submitting = true;
        this.networkState.error = null;

        try {
            // Supabase에 제출
            const rank = await HighScore.submitScore(name, score, breakdown);
            this.networkState.globalRank = rank;
            this.networkState.submitting = false;
            console.log('[GameOverScene] Score submitted, rank:', rank);
            return rank;

        } catch (error) {
            console.error('[GameOverScene] Failed to submit score:', error);
            this.networkState.error = '점수 제출에 실패했습니다';
            this.networkState.submitting = false;
            throw error;
        }
    }

    updateLayout() {
        if (!this.canvas) return;

        const layout = ResponsiveLayout.getLayoutInfo();

        // Responsive button sizes
        const btnSize = ResponsiveLayout.buttonSize(180, 60);
        this.buttons.retry.width = btnSize.width;
        this.buttons.retry.height = btnSize.height;
        this.buttons.menu.width = btnSize.width;
        this.buttons.menu.height = btnSize.height;

        // Button positions (horizontal center)
        const gap = ResponsiveLayout.spacing(20);
        const totalWidth = btnSize.width * 2 + gap;
        const buttonY = layout.centerY + ResponsiveLayout.spacing(240);

        this.buttons.retry.x = layout.centerX - totalWidth / 2;
        this.buttons.retry.y = buttonY;
        this.buttons.menu.x = this.buttons.retry.x + btnSize.width + gap;
        this.buttons.menu.y = buttonY;

        // Store responsive layout values for rendering
        this.layout = {
            centerX: layout.centerX,
            centerY: layout.centerY,
            width: layout.width,
            height: layout.height
        };
    }

    update(deltaTime) {
        this.time += deltaTime;
        this.phaseTime += deltaTime;

        switch (this.phase) {
            case 'SCORE_ANIMATION':
                this.updateScoreAnimation(deltaTime);
                break;

            case 'NAME_INPUT':
                this.updateNameInput(deltaTime);
                break;

            case 'HIGHSCORE_TABLE':
                this.updateHighScoreTable(deltaTime);
                break;

            case 'READY':
                // Just wait for user input
                break;
        }
    }

    updateScoreAnimation(deltaTime) {
        this.scoreAnimation.stepTime += deltaTime;

        const fs = this.results.finalScore;

        // Progress through steps
        if (this.scoreAnimation.step === 0 && this.scoreAnimation.stepTime >= this.scoreAnimation.stepDelay) {
            this.scoreAnimation.values[0] = fs.base;
            this.scoreAnimation.step = 1;
            this.scoreAnimation.stepTime = 0;
        } else if (this.scoreAnimation.step === 1 && this.scoreAnimation.stepTime >= this.scoreAnimation.stepDelay) {
            this.scoreAnimation.values[1] = fs.scoreDiffBonus;
            this.scoreAnimation.step = 2;
            this.scoreAnimation.stepTime = 0;
        } else if (this.scoreAnimation.step === 2 && this.scoreAnimation.stepTime >= this.scoreAnimation.stepDelay) {
            this.scoreAnimation.values[2] = fs.timeBonus;
            this.scoreAnimation.step = 3;
            this.scoreAnimation.stepTime = 0;
        } else if (this.scoreAnimation.step === 3 && this.scoreAnimation.stepTime >= this.scoreAnimation.stepDelay) {
            this.scoreAnimation.values[3] = fs.total;
            this.scoreAnimation.step = 4;
            this.scoreAnimation.stepTime = 0;
        } else if (this.scoreAnimation.step === 4 && this.scoreAnimation.stepTime >= 1.0) {
            // Animation complete - check if high score
            if (HighScore.isHighScore(fs.total)) {
                this.phase = 'NAME_INPUT';
                this.nameInput.name = '';
                this.nameInput.newRank = HighScore.getRank(fs.total);
            } else {
                this.phase = 'HIGHSCORE_TABLE';
            }
            this.phaseTime = 0;
        }
    }

    updateNameInput(deltaTime) {
        this.nameInput.cursorBlink += deltaTime;
    }

    updateHighScoreTable(deltaTime) {
        this.highScoreTable.newEntryBlink += deltaTime;

        // Auto-advance to READY after 3 seconds
        if (this.phaseTime >= 3.0) {
            this.phase = 'READY';
            this.phaseTime = 0;
        }
    }

    render(ctx, alpha = 1.0) {
        if (!this.layout) return;

        switch (this.phase) {
            case 'SCORE_ANIMATION':
                this.renderScoreAnimation(ctx);
                break;

            case 'NAME_INPUT':
                this.renderNameInput(ctx);
                break;

            case 'HIGHSCORE_TABLE':
                this.renderHighScoreTable(ctx);
                break;

            case 'READY':
                this.renderReady(ctx);
                break;
        }
    }

    renderScoreAnimation(ctx) {
        const centerX = this.layout.centerX;
        const centerY = this.layout.centerY;
        const fs = this.results.finalScore;

        // Title
        ctx.fillStyle = '#4af';
        ctx.font = `bold ${ResponsiveLayout.fontSize(48)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VICTORY!', centerX, centerY - ResponsiveLayout.spacing(180));

        // Score breakdown with arcade style
        const lineHeight = ResponsiveLayout.spacing(40);
        let y = centerY - ResponsiveLayout.spacing(80);

        const labelSize = ResponsiveLayout.fontSize(20);
        const valueSize = ResponsiveLayout.fontSize(28);

        // Base Score
        if (this.scoreAnimation.step >= 1) {
            this.renderScoreLine(ctx, centerX, y, 'BASE SCORE', this.scoreAnimation.values[0], labelSize, valueSize);
            y += lineHeight;
        }

        // Score Diff Bonus
        if (this.scoreAnimation.step >= 2) {
            this.renderScoreLine(ctx, centerX, y, 'DIFFERENCE BONUS', this.scoreAnimation.values[1], labelSize, valueSize);
            y += lineHeight;
        }

        // Time Bonus
        if (this.scoreAnimation.step >= 3) {
            this.renderScoreLine(ctx, centerX, y, 'TIME BONUS', this.scoreAnimation.values[2], labelSize, valueSize);
            y += lineHeight * 1.5;
        }

        // Total
        if (this.scoreAnimation.step >= 4) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = ResponsiveLayout.borderWidth(2);
            ctx.beginPath();
            ctx.moveTo(centerX - ResponsiveLayout.spacing(150), y - ResponsiveLayout.spacing(10));
            ctx.lineTo(centerX + ResponsiveLayout.spacing(150), y - ResponsiveLayout.spacing(10));
            ctx.stroke();

            y += lineHeight * 0.5;

            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${ResponsiveLayout.fontSize(24)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('TOTAL SCORE', centerX, y);

            y += lineHeight * 0.8;

            // Glow effect for total
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = ResponsiveLayout.spacing(20);
            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${ResponsiveLayout.fontSize(52)}px monospace`;
            ctx.fillText(this.scoreAnimation.values[3].toLocaleString(), centerX, y);
            ctx.shadowBlur = 0;
        }
    }

    renderScoreLine(ctx, centerX, y, label, value, labelSize, valueSize) {
        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${labelSize}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(label, centerX - ResponsiveLayout.spacing(150), y);

        // Value with dots
        ctx.fillStyle = '#444';
        ctx.fillText('.'.repeat(30), centerX - ResponsiveLayout.spacing(140), y);

        // Value
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${valueSize}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(value.toLocaleString(), centerX + ResponsiveLayout.spacing(150), y);
    }

    renderNameInput(ctx) {
        const centerX = this.layout.centerX;
        const centerY = this.layout.centerY;

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${ResponsiveLayout.fontSize(36)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Blink effect
        const blink = Math.floor(this.time * 2) % 2 === 0;
        if (blink) {
            ctx.fillText('*** NEW HIGH SCORE ***', centerX, centerY - ResponsiveLayout.spacing(120));
        }

        // Rank
        ctx.fillStyle = '#4af';
        ctx.font = `bold ${ResponsiveLayout.fontSize(28)}px monospace`;
        ctx.fillText(`RANK ${this.nameInput.newRank}`, centerX, centerY - ResponsiveLayout.spacing(60));

        // Instruction
        ctx.fillStyle = '#aaa';
        ctx.font = `${ResponsiveLayout.fontSize(18)}px monospace`;
        ctx.fillText('ENTER YOUR NAME', centerX, centerY);

        // Name input boxes
        const boxSize = ResponsiveLayout.spacing(60);
        const boxGap = ResponsiveLayout.spacing(20);
        const totalWidth = boxSize * 3 + boxGap * 2;
        const startX = centerX - totalWidth / 2;
        const boxY = centerY + ResponsiveLayout.spacing(50);

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (boxSize + boxGap);

            // Box
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = ResponsiveLayout.borderWidth(3);
            ctx.strokeRect(x, boxY, boxSize, boxSize);

            // Letter
            const letter = this.nameInput.name[i] || '';
            if (letter) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold ${ResponsiveLayout.fontSize(40)}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(letter, x + boxSize / 2, boxY + boxSize / 2);
            } else if (i === this.nameInput.name.length) {
                // Cursor blink
                if (Math.floor(this.nameInput.cursorBlink * 3) % 2 === 0) {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(x + boxSize / 2 - 2, boxY + boxSize / 2 - ResponsiveLayout.spacing(15), ResponsiveLayout.borderWidth(4), ResponsiveLayout.spacing(30));
                }
            }
        }

        // Instructions
        ctx.fillStyle = '#666';
        ctx.font = `${ResponsiveLayout.fontSize(14)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('USE A-Z KEYS | BACKSPACE TO DELETE | ENTER TO CONFIRM', centerX, boxY + boxSize + ResponsiveLayout.spacing(40));
    }

    renderHighScoreTable(ctx) {
        const centerX = this.layout.centerX;
        const centerY = this.layout.centerY;

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${ResponsiveLayout.fontSize(36)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GLOBAL HIGH SCORES', centerX, centerY - ResponsiveLayout.spacing(200));

        // 로딩/에러 상태 표시
        const statusY = centerY - ResponsiveLayout.spacing(160);
        if (this.networkState.submitting) {
            ctx.fillStyle = '#888';
            ctx.font = `${ResponsiveLayout.fontSize(14)}px monospace`;
            ctx.fillText('Submitting score...', centerX, statusY);
        } else if (HighScore.isLoading()) {
            ctx.fillStyle = '#888';
            ctx.font = `${ResponsiveLayout.fontSize(14)}px monospace`;
            ctx.fillText('Loading leaderboard...', centerX, statusY);
        } else if (this.networkState.error) {
            ctx.fillStyle = '#f44';
            ctx.font = `${ResponsiveLayout.fontSize(12)}px monospace`;
            ctx.fillText(`⚠ ${this.networkState.error}`, centerX, statusY);
        } else if (HighScore.getError()) {
            ctx.fillStyle = '#f80';
            ctx.font = `${ResponsiveLayout.fontSize(12)}px monospace`;
            ctx.fillText('⚠ 네트워크 오류 (캐시된 데이터 표시 중)', centerX, statusY);
        }

        // Table header
        const tableY = centerY - ResponsiveLayout.spacing(140);
        const lineHeight = ResponsiveLayout.spacing(30);
        const fontSize = ResponsiveLayout.fontSize(16);

        ctx.fillStyle = '#888';
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('RANK', centerX - ResponsiveLayout.spacing(180), tableY);
        ctx.textAlign = 'center';
        ctx.fillText('NAME', centerX - ResponsiveLayout.spacing(40), tableY);
        ctx.textAlign = 'right';
        ctx.fillText('SCORE', centerX + ResponsiveLayout.spacing(180), tableY);

        // Scores
        const scores = HighScore.getScores();
        const blink = Math.floor(this.highScoreTable.newEntryBlink * 3) % 2 === 0;

        for (let i = 0; i < 10; i++) {
            const y = tableY + (i + 1) * lineHeight;
            const entry = scores[i];

            if (entry) {
                // Check if this is a new entry (within last 5 seconds)
                const isNew = (Date.now() - new Date(entry.date).getTime()) < 5000;
                const color = (isNew && blink) ? '#ffd700' : '#4af';

                ctx.fillStyle = color;
                ctx.font = `${fontSize}px monospace`;

                // Rank
                ctx.textAlign = 'left';
                ctx.fillText(`${i + 1}.`, centerX - ResponsiveLayout.spacing(180), y);

                // Name
                ctx.textAlign = 'center';
                ctx.fillText(entry.name, centerX - ResponsiveLayout.spacing(40), y);

                // Score
                ctx.textAlign = 'right';
                ctx.fillText(entry.score.toLocaleString(), centerX + ResponsiveLayout.spacing(180), y);
            } else {
                // Empty slot
                ctx.fillStyle = '#333';
                ctx.font = `${fontSize}px monospace`;
                ctx.textAlign = 'left';
                ctx.fillText(`${i + 1}.`, centerX - ResponsiveLayout.spacing(180), y);
                ctx.textAlign = 'center';
                ctx.fillText('---', centerX - ResponsiveLayout.spacing(40), y);
                ctx.textAlign = 'right';
                ctx.fillText('---', centerX + ResponsiveLayout.spacing(180), y);
            }
        }

        // Show buttons in HIGHSCORE_TABLE phase too
        if (this.phase === 'HIGHSCORE_TABLE') {
            this.renderButton(ctx, this.buttons.retry);
            this.renderButton(ctx, this.buttons.menu);

            // Footer
            ctx.fillStyle = '#666';
            ctx.font = `${ResponsiveLayout.fontSize(14)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('© 2025 Mirror Breakout', centerX, this.layout.height - ResponsiveLayout.margin('bottom') / 2);
        }
    }

    renderReady(ctx) {
        const centerX = this.layout.centerX;
        const centerY = this.layout.centerY;

        // High score table (no title needed - already shown before)
        this.renderHighScoreTable(ctx);

        // Buttons
        this.renderButton(ctx, this.buttons.retry);
        this.renderButton(ctx, this.buttons.menu);

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = `${ResponsiveLayout.fontSize(14)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('© 2025 Mirror Breakout', centerX, this.layout.height - ResponsiveLayout.margin('bottom') / 2);
    }

    handleKeyDown(event) {
        if (this.phase === 'NAME_INPUT') {
            const key = event.key.toUpperCase();

            // Letter keys
            if (key.length === 1 && key >= 'A' && key <= 'Z' && this.nameInput.name.length < 3) {
                this.nameInput.name += key;
            }
            // Backspace
            else if (event.key === 'Backspace' && this.nameInput.name.length > 0) {
                this.nameInput.name = this.nameInput.name.slice(0, -1);
            }
            // Enter - submit
            else if (event.key === 'Enter' && this.nameInput.name.length === 3) {
                const fs = this.results.finalScore;

                // 비동기 제출
                this.submitScore(this.nameInput.name, fs.total, fs)
                    .then(rank => {
                        console.log('[GameOverScene] Score submitted successfully, rank:', rank);
                    })
                    .catch(error => {
                        console.error('[GameOverScene] Submit failed:', error);
                        // 에러는 networkState에 저장되어 UI에 표시됨
                    });

                // 즉시 하이스코어 테이블로 전환 (제출 결과를 기다리지 않음)
                this.phase = 'HIGHSCORE_TABLE';
                this.phaseTime = 0;
            }
        } else if (this.phase === 'HIGHSCORE_TABLE') {
            // Skip to READY on any key
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
                this.phase = 'READY';
                this.phaseTime = 0;
            }
        }
    }

    handleMouseMove(x, y) {
        if (this.phase === 'READY' || this.phase === 'HIGHSCORE_TABLE') {
            this.updateButtonHover(x, y);
        }
    }

    handleClick(x, y) {
        if (this.phase === 'READY' || this.phase === 'HIGHSCORE_TABLE') {
            // Check RETRY button
            const retry = this.buttons.retry;
            if (x >= retry.x && x <= retry.x + retry.width &&
                y >= retry.y && y <= retry.y + retry.height) {
                console.log('[GameOverScene] RETRY clicked');
                if (this.onRetry) {
                    this.onRetry();
                }
                return;
            }

            // Check MENU button
            const menu = this.buttons.menu;
            if (x >= menu.x && x <= menu.x + menu.width &&
                y >= menu.y && y <= menu.y + menu.height) {
                console.log('[GameOverScene] MENU clicked');
                if (this.onMenu) {
                    this.onMenu();
                }
                return;
            }
        } else if (this.phase === 'SCORE_ANIMATION') {
            // Click to skip animation
            if (this.scoreAnimation.step < 4) {
                this.scoreAnimation.step = 4;
                this.scoreAnimation.stepTime = 0;
                const fs = this.results.finalScore;
                this.scoreAnimation.values = [fs.base, fs.scoreDiffBonus, fs.timeBonus, fs.total];
            }
        }
    }

    handleResize() {
        this.updateLayout();

        // Re-render background overlay after resize
        if (this.bgCanvas) {
            const bgCtx = this.bgCanvas.getContext('2d');
            bgCtx.fillStyle = 'rgba(10, 10, 20, 0.95)';
            bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
    }

    // Set callbacks
    setRetryCallback(callback) {
        this.onRetry = callback;
    }

    setMenuCallback(callback) {
        this.onMenu = callback;
    }
}
