// 게임 핵심 설정
const GameConfig = {
    // Phaser 기본 설정
    phaser: {
        type: Phaser.AUTO,
        width: 600,
        height: 700,
        parent: 'game-container',
        backgroundColor: '#000000',
        physics: {
            default: 'matter',
            matter: {
                gravity: { x: 0, y: 0 },
                debug: false,
                enableSleeping: false
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    },

    // 게임플레이 설정
    gameplay: {
        // 벽돌 설정
        brick: {
            rows: 6,
            cols: 10,
            width: 55,
            height: 18,
            spacingX: 58,
            spacingY: 21,
            spawnInterval: 10000, // 10초
            minDensity: 0.5,      // 최소 벽돌 밀도 50%
            initialDensity: 0.7   // 초기 벽돌 밀도 70%
        },

        // 공 설정
        ball: {
            radius: 8,
            speed: 5,
            maxSpeed: 12,
            splitTime: 10000,     // 10초 후 분열
            restitution: 1.0,     // 완전 탄성 충돌
            friction: 0,
            frictionAir: 0
        },

        // 패들 설정
        paddle: {
            width: 60,
            height: 12,
            player: {
                maxSpeed: 10,
                acceleration: 0.8,
                friction: 0.85
            },
            ai: {
                baseSpeed: 12,
                baseAcceleration: 0.6,
                friction: 0.9,
                reactionThreshold: 5
            }
        },

        // 난이도 조정
        difficulty: {
            updateInterval: 2000,  // 2초마다 업데이트
            minMultiplier: 0.6,
            maxMultiplier: 2.0,
            adaptationRate: 0.1
        }
    },

    // 시각적 설정
    visual: {
        colors: {
            player: '#4488ff',
            ai: '#ff4488',
            ball: '#ffffff',
            background: {
                top: '#001133',
                middle: '#000511',
                bottom: '#110011'
            }
        },
        effects: {
            cornerRadius: 20,
            glowIntensity: 0.3,
            particleCount: 30
        }
    },

    // 물리 설정
    physics: {
        minAngle: 0.2,           // 최소 반사각
        paddleMomentumTransfer: 0.3,
        wallBounce: 1.0
    },

    // 게임 상태
    scenes: {
        preload: 'PreloadScene',
        menu: 'MenuScene',
        game: 'GameScene',
        gameOver: 'GameOverScene'
    }
};

// 전역 접근을 위한 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
} else {
    window.GameConfig = GameConfig;
}
