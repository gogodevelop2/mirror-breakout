// ============================================
// 물리 엔진 및 벡터 연산
// ============================================

import { CONFIG } from '../config.js';

// 재사용 가능한 임시 벡터 객체들
const tempVec1 = { x: 0, y: 0 };
const tempVec2 = { x: 0, y: 0 };
const tempVec3 = { x: 0, y: 0 };

// 벡터 연산 유틸리티
export const vec = {
    dot: (a, b) => a.x * b.x + a.y * b.y,
    
    length: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
    
    normalize: (v, result) => {
        const len = Math.sqrt(v.x * v.x + v.y * v.y);
        if (len > 0) {
            result.x = v.x / len;
            result.y = v.y / len;
        } else {
            result.x = 0;
            result.y = 0;
        }
        return result;
    },
    
    multiply: (v, scalar, result) => {
        result.x = v.x * scalar;
        result.y = v.y * scalar;
        return result;
    },
    
    add: (a, b, result) => {
        result.x = a.x + b.x;
        result.y = a.y + b.y;
        return result;
    },
    
    subtract: (a, b, result) => {
        result.x = a.x - b.x;
        result.y = a.y - b.y;
        return result;
    },
    
    reflect: (incident, normal, result) => {
        const dotProduct = vec.dot(incident, normal);
        result.x = incident.x - normal.x * 2 * dotProduct;
        result.y = incident.y - normal.y * 2 * dotProduct;
        return result;
    },
    
    set: (target, x, y) => {
        target.x = x;
        target.y = y;
        return target;
    }
};

// 패들 충돌 검사
export function checkPaddleCollision(ball, paddle, isPlayer1) {
    if((isPlayer1 && ball.dy <= 0) || (!isPlayer1 && ball.dy >= 0)) return false;
    
    const paddleRadius = paddle.height / 2;
    const paddleVelocity = paddle.x - paddle.prevX;
    
    vec.set(tempVec1, paddle.x + paddleRadius, paddle.y + paddleRadius);
    vec.set(tempVec2, paddle.x + paddle.width - paddleRadius, paddle.y + paddleRadius);
    
    let collisionPoint = null;
    let normal = null;
    let hitPaddle = false;

    // 왼쪽 캡 충돌 검사
    vec.set(tempVec3, ball.x, ball.y);
    vec.subtract(tempVec3, tempVec1, tempVec3);
    const leftDist = vec.length(tempVec3);
    
    if (leftDist <= ball.radius + paddleRadius) {
        collisionPoint = tempVec1;
        vec.normalize(tempVec3, tempVec3);
        normal = tempVec3;
        hitPaddle = true;
    }
    
    // 오른쪽 캡 충돌 검사
    if (!hitPaddle) {
        vec.set(tempVec3, ball.x, ball.y);
        vec.subtract(tempVec3, tempVec2, tempVec3);
        const rightDist = vec.length(tempVec3);
        
        if (rightDist <= ball.radius + paddleRadius) {
            collisionPoint = tempVec2;
            vec.normalize(tempVec3, tempVec3);
            normal = tempVec3;
            hitPaddle = true;
        }
    }
    
    // 평평한 부분 충돌 검사
    if (!hitPaddle) {
        const ballEdge = ball.y + (isPlayer1 ? 1 : -1) * ball.radius;
        const paddleEdge = isPlayer1 ? paddle.y : paddle.y + paddle.height;
        
        if (Math.abs(ballEdge - paddleEdge) <= CONFIG.PHYSICS.COLLISION_THRESHOLD &&
            ball.x >= paddle.x + paddleRadius &&
            ball.x <= paddle.x + paddle.width - paddleRadius) {
            
            vec.set(tempVec1, ball.x, paddleEdge);
            collisionPoint = tempVec1;
            vec.set(tempVec3, 0, isPlayer1 ? -1 : 1);
            normal = tempVec3;
            hitPaddle = true;
            
            ball.y = isPlayer1 ? paddle.y - ball.radius : paddle.y + paddle.height + ball.radius;
        }
    }

    if (hitPaddle) {
        vec.set(tempVec1, ball.dx, ball.dy);
        const speed = vec.length(tempVec1);
        
        vec.reflect(tempVec1, normal, tempVec2);
        tempVec2.x += paddleVelocity * CONFIG.PHYSICS.PADDLE_MOMENTUM_TRANSFER;
        
        const newSpeed = Math.max(speed * CONFIG.BALL.SPEED_DECAY, CONFIG.BALL.MIN_SPEED);
        vec.normalize(tempVec2, tempVec2);
        
        // 최소 각도 보정
        if (Math.abs(tempVec2.y) < CONFIG.PHYSICS.MIN_ANGLE) {
            tempVec2.y = tempVec2.y > 0 ? CONFIG.PHYSICS.MIN_ANGLE : -CONFIG.PHYSICS.MIN_ANGLE;
            tempVec2.x = Math.sqrt(1 - tempVec2.y * tempVec2.y) * Math.sign(tempVec2.x);
        }
        
        ball.dx = tempVec2.x * newSpeed;
        ball.dy = tempVec2.y * newSpeed;
        
        return true;
    }
    
    return false;
}

// 벽돌 충돌 검사
export function checkBrickCollision(ball, brick) {
    return ball.x > brick.x && 
           ball.x < brick.x + brick.width &&
           ball.y - ball.radius < brick.y + brick.height &&
           ball.y + ball.radius > brick.y;
}

// 벽 충돌 처리
export function handleWallCollision(ball, canvasWidth, canvasHeight) {
    if(ball.x < CONFIG.BALL.RADIUS || ball.x > canvasWidth - CONFIG.BALL.RADIUS) {
        ball.dx = -ball.dx;
        ball.x = Math.max(CONFIG.BALL.RADIUS, Math.min(canvasWidth - CONFIG.BALL.RADIUS, ball.x));
    }
    if(ball.y < CONFIG.BALL.RADIUS || ball.y > canvasHeight - CONFIG.BALL.RADIUS) {
        ball.dy = ball.y < CONFIG.BALL.RADIUS ? Math.abs(ball.dy) : -Math.abs(ball.dy);
        ball.y = Math.max(CONFIG.BALL.RADIUS, Math.min(canvasHeight - CONFIG.BALL.RADIUS, ball.y));
    }
}
