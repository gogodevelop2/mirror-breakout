// 벡터 수학 유틸리티
class VectorMath {
    // 두 벡터의 내적
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    
    // 벡터 정규화
    static normalize(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }
    
    // 벡터 반사 (더 정확한 물리 반사)
    static reflect(velocity, normal) {
        const dot = this.dot(velocity, normal);
        return {
            x: velocity.x - 2 * dot * normal.x,
            y: velocity.y - 2 * dot * normal.y
        };
    }
    
    // 속도 제한
    static limitSpeed(velocity, maxSpeed) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            return {
                x: velocity.x * scale,
                y: velocity.y * scale
            };
        }
        return velocity;
    }
    
    // 각도를 벡터로 변환
    static angleToVector(angle, magnitude = 1) {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    }
    
    // 벡터를 각도로 변환
    static vectorToAngle(vector) {
        return Math.atan2(vector.y, vector.x);
    }
    
    // 최소 각도 보정 (너무 평평한 각도 방지)
    static ensureMinimumAngle(velocity, minAngle = 0.3) {
        const angle = this.vectorToAngle(velocity);
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // 너무 수평에 가까운지 체크
        if (Math.abs(Math.sin(angle)) < minAngle) {
            const newAngle = velocity.y > 0 ? minAngle : -minAngle;
            return {
                x: Math.cos(angle) * speed * 0.8,
                y: Math.sin(angle > 0 ? minAngle : -minAngle) * speed
            };
        }
        
        return velocity;
    }
}
