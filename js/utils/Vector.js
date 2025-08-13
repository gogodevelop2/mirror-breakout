// js/utils/Vector.js

// 벡터 연산용 재사용 객체들 (메모리 할당 최소화)
const tempVec1 = { x: 0, y: 0 };
const tempVec2 = { x: 0, y: 0 };
const tempVec3 = { x: 0, y: 0 };

// 벡터 유틸리티 함수들 (객체 재사용)
const vec = {
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
