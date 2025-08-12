export class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.config = scene.game.config.game;
        
        this.setupPhysics();
    }

    setupPhysics() {
        // Matter.js 물리 세계 설정
        this.scene.matter.world.setBounds(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height, 32, true, true, false, true);
        
        // 중력 제거 (공이 자유롭게 움직이도록)
        this.scene.matter.world.setGravity(0, 0);
        
        // 물리 업데이트 빈도 설정
        this.scene.matter.world.runner.delta = 1000 / 60; // 60 FPS
    }

    createBallBody(x, y, radius) {
        // 공 물리 바디 생성
        const ball = this.scene.matter.add.circle(x, y, radius, {
            restitution: 1.0,      // 완전 탄성 충돌
            friction: 0,           // 마찰 없음
            frictionAir: 0,        // 공기 저항 없음
            density: 0.001,        // 가벼운 밀도
            inertia: Infinity,     // 회전 방지
            label: 'ball'
        });
        
        return ball;
    }

    createPaddleBody(x, y, width, height) {
        // 패들 물리 바디 생성 (둥근 모서리)
        const paddleRadius = height / 2;
        
        // 복합 바디 생성 (중앙 사각형 + 양쪽 원)
        const centerRect = this.scene.matter.add.rectangle(
            x + width / 2, y + height / 2,
            width - height, height,
            { isStatic: true, label: 'paddle' }
        );
        
        const leftCircle = this.scene.matter.add.circle(
            x + paddleRadius, y + paddleRadius,
            paddleRadius,
            { isStatic: true, label: 'paddle' }
        );
        
        const rightCircle = this.scene.matter.add.circle(
            x + width - paddleRadius, y + paddleRadius,
            paddleRadius,
            { isStatic: true, label: 'paddle' }
        );
        
        // 복합 바디로 결합
        const paddle = this.scene.matter.add.constraint(centerRect, leftCircle, 0, 1);
        this.scene.matter.add.constraint(centerRect, rightCircle, 0, 1);
        
        return { centerRect, leftCircle, rightCircle };
    }

    createBrickBody(x, y, width, height) {
        // 벽돌 물리 바디 생성
        const brick = this.scene.matter.add.rectangle(
            x + width / 2, y + height / 2,
            width, height,
            {
                isStatic: true,
                label: 'brick',
                restitution: 1.0
            }
        );
        
        return brick;
    }

    setBallVelocity(ballBody, vx, vy) {
        // 공 속도 설정
        this.scene.matter.setVelocity(ballBody, { x: vx, y: vy });
    }

    getBallVelocity(ballBody) {
        // 공 속도 가져오기
        return ballBody.velocity;
    }

    updatePaddlePosition(paddleBody, x, y) {
        // 패들 위치 업데이트
        if (paddleBody.centerRect) {
            this.scene.matter.setPosition(paddleBody.centerRect, { x: x + paddleBody.centerRect.bounds.max.x - paddleBody.centerRect.bounds.min.x, y });
            this.scene.matter.setPosition(paddleBody.leftCircle, { x: x + paddleBody.leftCircle.circleRadius, y: y + paddleBody.leftCircle.circleRadius });
            this.scene.matter.setPosition(paddleBody.rightCircle, { x: x + paddleBody.rightCircle.circleRadius, y: y + paddleBody.rightCircle.circleRadius });
        }
    }

    removeBrick(brickBody) {
        // 벽돌 제거
        this.scene.matter.world.remove(brickBody);
    }

    // 벡터 유틸리티 메서드들 (성능 최적화를 위해 재사용)
    normalizeVector(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: vector.x / length, y: vector.y / length };
    }

    reflectVector(incident, normal) {
        const dotProduct = incident.x * normal.x + incident.y * normal.y;
        return {
            x: incident.x - normal.x * 2 * dotProduct,
            y: incident.y - normal.y * 2 * dotProduct
        };
    }

    clampVector(vector, minMagnitude, maxMagnitude) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude < minMagnitude) {
            const normalized = this.normalizeVector(vector);
            return {
                x: normalized.x * minMagnitude,
                y: normalized.y * minMagnitude
            };
        }
        if (magnitude > maxMagnitude) {
            const normalized = this.normalizeVector(vector);
            return {
                x: normalized.x * maxMagnitude,
                y: normalized.y * maxMagnitude
            };
        }
        return vector;
    }

    ensureMinimumAngle(vector, minAngle) {
        // 공이 너무 수평으로 움직이는 것을 방지
        const normalized = this.normalizeVector(vector);
        if (Math.abs(normalized.y) < minAngle) {
            normalized.y = normalized.y > 0 ? minAngle : -minAngle;
            normalized.x = Math.sqrt(1 - normalized.y * normalized.y) * Math.sign(normalized.x);
        }
        
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return {
            x: normalized.x * magnitude,
            y: normalized.y * magnitude
        };
    }
}
