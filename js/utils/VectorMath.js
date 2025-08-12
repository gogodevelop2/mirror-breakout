/**
 * Vector Math Utilities
 * 벡터 연산을 위한 유틸리티 클래스 (성능 최적화된 버전)
 */

class VectorMath {
    /**
     * 벡터 생성
     */
    static create(x = 0, y = 0) {
        return { x, y };
    }
    
    /**
     * 벡터 복사
     */
    static copy(vector) {
        return { x: vector.x, y: vector.y };
    }
    
    /**
     * 벡터 설정 (기존 객체 재사용)
     */
    static set(target, x, y) {
        target.x = x;
        target.y = y;
        return target;
    }
    
    /**
     * 벡터 더하기 (결과를 target에 저장)
     */
    static add(a, b, target = null) {
        if (target) {
            target.x = a.x + b.x;
            target.y = a.y + b.y;
            return target;
        }
        return { x: a.x + b.x, y: a.y + b.y };
    }
    
    /**
     * 벡터 빼기 (결과를 target에 저장)
     */
    static subtract(a, b, target = null) {
        if (target) {
            target.x = a.x - b.x;
            target.y = a.y - b.y;
            return target;
        }
        return { x: a.x - b.x, y: a.y - b.y };
    }
    
    /**
     * 벡터 스칼라 곱 (결과를 target에 저장)
     */
    static multiply(vector, scalar, target = null) {
        if (target) {
            target.x = vector.x * scalar;
            target.y = vector.y * scalar;
            return target;
        }
        return { x: vector.x * scalar, y: vector.y * scalar };
    }
    
    /**
     * 벡터 스칼라 나누기
     */
    static divide(vector, scalar, target = null) {
        if (scalar === 0) {
            console.warn('VectorMath.divide: Division by zero');
            return target ? this.set(target, 0, 0) : { x: 0, y: 0 };
        }
        
        if (target) {
            target.x = vector.x / scalar;
            target.y = vector.y / scalar;
            return target;
        }
        return { x: vector.x / scalar, y: vector.y / scalar };
    }
    
    /**
     * 벡터 내적 (dot product)
     */
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    
    /**
     * 벡터 외적 (cross product) - 2D에서는 스칼라 값
     */
    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }
    
    /**
     * 벡터 길이
     */
    static length(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }
    
    /**
     * 벡터 길이의 제곱 (제곱근 연산 생략으로 성능 향상)
     */
    static lengthSquared(vector) {
        return vector.x * vector.x + vector.y * vector.y;
    }
    
    /**
     * 두 벡터 간의 거리
     */
    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 두 벡터 간의 거리의 제곱
     */
    static distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }
    
    /**
     * 벡터 정규화 (단위 벡터로 변환)
     */
    static normalize(vector, target = null) {
        const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        
        if (len === 0) {
            return target ? this.set(target, 0, 0) : { x: 0, y: 0 };
        }
        
        if (target) {
            target.x = vector.x / len;
            target.y = vector.y / len;
            return target;
        }
        
        return { x: vector.x / len, y: vector.y / len };
    }
    
    /**
     * 벡터 반사 (incident를 normal에 대해 반사)
     */
    static reflect(incident, normal, target = null) {
        const dotProduct = this.dot(incident, normal);
        
        if (target) {
            target.x = incident.x - normal.x * 2 * dotProduct;
            target.y = incident.y - normal.y * 2 * dotProduct;
            return target;
        }
        
        return {
            x: incident.x - normal.x * 2 * dotProduct,
            y: incident.y - normal.y * 2 * dotProduct
        };
    }
    
    /**
     * 벡터 회전 (라디안)
     */
    static rotate(vector, angle, target = null) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const newX = vector.x * cos - vector.y * sin;
        const newY = vector.x * sin + vector.y * cos;
        
        if (target) {
            target.x = newX;
            target.y = newY;
            return target;
        }
        
        return { x: newX, y: newY };
    }
    
    /**
     * 벡터 각도 (라디안)
     */
    static angle(vector) {
        return Math.atan2(vector.y, vector.x);
    }
    
    /**
     * 두 벡터 간의 각도
     */
    static angleBetween(a, b) {
        return Math.atan2(this.cross(a, b), this.dot(a, b));
    }
    
    /**
     * 각도에서 단위 벡터 생성
     */
    static fromAngle(angle, target = null) {
        if (target) {
            target.x = Math.cos(angle);
            target.y = Math.sin(angle);
            return target;
        }
        
        return { x: Math.cos(angle), y: Math.sin(angle) };
    }
    
    /**
     * 벡터 선형 보간 (Linear Interpolation)
     */
    static lerp(a, b, t, target = null) {
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        
        if (target) {
            target.x = x;
            target.y = y;
            return target;
        }
        
        return { x, y };
    }
    
    /**
     * 벡터 클램프 (최소/최대 길이 제한)
     */
    static clamp(vector, minLength, maxLength, target = null) {
        const len = this.length(vector);
        
        if (len === 0) {
            return target ? this.set(target, 0, 0) : { x: 0, y: 0 };
        }
        
        const clampedLength = Math.max(minLength, Math.min(maxLength, len));
        const scale = clampedLength / len;
        
        if (target) {
            target.x = vector.x * scale;
            target.y = vector.y * scale;
            return target;
        }
        
        return { x: vector.x * scale, y: vector.y * scale };
    }
    
    /**
     * 벡터가 0인지 확인
     */
    static isZero(vector, epsilon = 1e-10) {
        return Math.abs(vector.x) < epsilon && Math.abs(vector.y) < epsilon;
    }
    
    /**
     * 두 벡터가 같은지 확인
     */
    static equals(a, b, epsilon = 1e-10) {
        return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
    }
    
    /**
     * 벡터를 문자열로 변환 (디버깅용)
     */
    static toString(vector, precision = 2) {
        return `(${vector.x.toFixed(precision)}, ${vector.y.toFixed(precision)})`;
    }
}

/**
 * 객체 풀을 사용한 임시 벡터 관리
 * 가비지 컬렉션을 줄이기 위한 최적화
 */
class VectorPool {
    constructor(size = 10) {
        this.pool = [];
        this.index = 0;
        
        // 풀 초기화
        for (let i = 0; i < size; i++) {
            this.pool.push({ x: 0, y: 0 });
        }
    }
    
    /**
     * 임시 벡터 가져오기
     */
    get() {
        const vector = this.pool[this.index];
        this.index = (this.index + 1) % this.pool.length;
        return vector;
    }
    
    /**
     * 임시 벡터 초기화해서 가져오기
     */
    getZero() {
        const vector = this.get();
        vector.x = 0;
        vector.y = 0;
        return vector;
    }
    
    /**
     * 임시 벡터 복사해서 가져오기
     */
    getCopy(source) {
        const vector = this.get();
        vector.x = source.x;
        vector.y = source.y;
        return vector;
    }
}

// 전역 벡터 풀 인스턴스
VectorMath.tempPool = new VectorPool(20);

/**
 * 임시 벡터 헬퍼 함수들
 */
VectorMath.temp = {
    get: () => VectorMath.tempPool.get(),
    getZero: () => VectorMath.tempPool.getZero(),
    getCopy: (source) => VectorMath.tempPool.getCopy(source)
};

/**
 * 자주 사용되는 상수 벡터들
 */
VectorMath.ZERO = Object.freeze({ x: 0, y: 0 });
VectorMath.ONE = Object.freeze({ x: 1, y: 1 });
VectorMath.UP = Object.freeze({ x: 0, y: -1 });
VectorMath.DOWN = Object.freeze({ x: 0, y: 1 });
VectorMath.LEFT = Object.freeze({ x: -1, y: 0 });
VectorMath.RIGHT = Object.freeze({ x: 1, y: 0 });

// 기존 코드와의 호환성을 위한 별칭
const vec = VectorMath;
