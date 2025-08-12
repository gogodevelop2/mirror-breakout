export class Shaders {
    constructor(scene) {
        this.scene = scene;
        this.shaders = {};
        
        // 셰이더 초기화
        this.initializeShaders();
    }

    initializeShaders() {
        // 현재는 간단한 효과만 구현
        // 추후 WebGL 셰이더 추가 예정
        
        this.shaders = {
            glow: this.createGlowShader(),
            ripple: this.createRippleShader(),
            chromatic: this.createChromaticShader()
        };
    }

    createGlowShader() {
        // CSS 기반 글로우 효과 (WebGL 셰이더로 대체 예정)
        return {
            name: 'glow',
            apply: (target, intensity = 1.0, color = '#ffffff') => {
                if (target && target.setPostPipeline) {
                    // Phaser 3의 PostFX 파이프라인 사용 예정
                    console.log('Glow shader applied', { intensity, color });
                }
            },
            remove: (target) => {
                if (target && target.clearPostPipeline) {
                    target.clearPostPipeline();
                }
            }
        };
    }

    createRippleShader() {
        // 물결 효과 셰이더
        return {
            name: 'ripple',
            apply: (target, centerX, centerY, radius = 50, strength = 0.1) => {
                // 추후 구현: 실제 ripple 셰이더
                console.log('Ripple shader applied', { centerX, centerY, radius, strength });
            },
            remove: (target) => {
                if (target && target.clearPostPipeline) {
                    target.clearPostPipeline();
                }
            }
        };
    }

    createChromaticShader() {
        // 색수차 효과 셰이더
        return {
            name: 'chromatic',
            apply: (target, strength = 0.02) => {
                // 추후 구현: chromatic aberration 셰이더
                console.log('Chromatic aberration shader applied', { strength });
            },
            remove: (target) => {
                if (target && target.clearPostPipeline) {
                    target.clearPostPipeline();
                }
            }
        };
    }

    // 공용 셰이더 적용 메서드
    applyShader(shaderName, target, ...params) {
        const shader = this.shaders[shaderName];
        if (shader) {
            shader.apply(target, ...params);
        } else {
            console.warn(`Shader '${shaderName}' not found`);
        }
    }

    // 셰이더 제거
    removeShader(shaderName, target) {
        const shader = this.shaders[shaderName];
        if (shader) {
            shader.remove(target);
        }
    }

    // 모든 셰이더 제거
    removeAllShaders(target) {
        Object.values(this.shaders).forEach(shader => {
            shader.remove(target);
        });
    }
}

// WebGL 셰이더 코드 (추후 구현용)
export const ShaderCode = {
    // 글로우 효과 버텍스 셰이더
    glowVertexShader: `
        attribute vec2 aPosition;
        attribute vec2 aTexCoord;
        
        varying vec2 vTexCoord;
        
        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
            vTexCoord = aTexCoord;
        }
    `,
    
    // 글로우 효과 프래그먼트 셰이더
    glowFragmentShader: `
        precision mediump float;
        
        uniform sampler2D uMainSampler;
        uniform float uIntensity;
        uniform vec3 uGlowColor;
        
        varying vec2 vTexCoord;
        
        void main() {
            vec4 color = texture2D(uMainSampler, vTexCoord);
            
            // 가장자리 감지
            float edge = length(color.rgb - vec3(0.5));
            edge = smoothstep(0.2, 0.8, edge);
            
            // 글로우 계산
            vec3 glow = uGlowColor * uIntensity * edge;
            
            gl_FragColor = vec4(color.rgb + glow, color.a);
        }
    `,
    
    // 물결 효과 프래그먼트 셰이더
    rippleFragmentShader: `
        precision mediump float;
        
        uniform sampler2D uMainSampler;
        uniform vec2 uCenter;
        uniform float uRadius;
        uniform float uStrength;
        uniform float uTime;
        
        varying vec2 vTexCoord;
        
        void main() {
            vec2 coord = vTexCoord;
            vec2 toCenter = coord - uCenter;
            float distance = length(toCenter);
            
            if (distance < uRadius) {
                float ripple = sin(distance * 10.0 - uTime * 5.0) * uStrength;
                ripple *= (1.0 - distance / uRadius);
                
                vec2 offset = normalize(toCenter) * ripple;
                coord += offset;
            }
            
            gl_FragColor = texture2D(uMainSampler, coord);
        }
    `,
    
    // 색수차 효과 프래그먼트 셰이더
    chromaticFragmentShader: `
        precision mediump float;
        
        uniform sampler2D uMainSampler;
        uniform float uStrength;
        
        varying vec2 vTexCoord;
        
        void main() {
            vec2 coord = vTexCoord;
            vec2 center = vec2(0.5, 0.5);
            vec2 offset = (coord - center) * uStrength;
            
            float r = texture2D(uMainSampler, coord + offset).r;
            float g = texture2D(uMainSampler, coord).g;
            float b = texture2D(uMainSampler, coord - offset).b;
            
            gl_FragColor = vec4(r, g, b, 1.0);
        }
    `
};
