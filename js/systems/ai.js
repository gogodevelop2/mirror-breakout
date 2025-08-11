// ============================================
// AI 시스템
// ============================================

import { CONFIG } from '../config.js';

export class AISystem {
    constructor(paddle) {
        this.paddle = paddle;
    }
    
    update(balls, difficultyMultiplier) {
        // AI가 추적할 공 찾기 (아래로 향하는 공 중 가장 가까운 것)
        const targetBall = balls
            .filter(ball => ball.dy < 0)
            .sort((a, b) => Math.abs(a.y - this.paddle.y) - Math.abs(b.y - this.paddle.y))[0];

        if(targetBall) {
            const diff = targetBall.x - (this.paddle.x + this.paddle.width / 2);
            const direction = Math.sign(diff);
            
            // 난이도에 따른 반응 속도 조절
            const reactionThreshold = CONFIG.PADDLE.AI.REACTION_THRESHOLD_BASE / difficultyMultiplier;
            
            if(Math.abs(diff) > reactionThreshold) {
                this.paddle.speed += direction * this.paddle.acceleration;
                this.paddle.speed = Math.max(
                    -this.paddle.maxSpeed, 
                    Math.min(this.paddle.maxSpeed, this.paddle.speed)
                );
            }
        }
        
        // 마찰 적용
        this.paddle.speed *= this.paddle.friction;
        this.paddle.prevX = this.paddle.x;
        this.paddle.x = Math.max(
            0, 
            Math.min(CONFIG.CANVAS.WIDTH - this.paddle.width, this.paddle.x + this.paddle.speed)
        );
    }
}
