// js/input-manager.js
// Mirror Breakout - Input Manager

/**
 * 통합 입력 관리자
 * 키보드/마우스 입력을 중앙에서 관리
 */
class InputManager {
    constructor() {
        // 키 상태
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};

        // 마우스 상태
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {},
            isDown: false
        };

        // 이벤트 핸들러 바인딩
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleKeyUp = this._handleKeyUp.bind(this);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);

        // 구독자 목록
        this._subscribers = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: []
        };

        this._isInitialized = false;
    }

    /**
     * 입력 시스템 초기화
     * @param {HTMLCanvasElement} canvas - 마우스 이벤트 타겟
     */
    init(canvas) {
        if (this._isInitialized) return;

        this.canvas = canvas;

        // 키보드 이벤트 (window 레벨)
        window.addEventListener('keydown', this._boundHandleKeyDown);
        window.addEventListener('keyup', this._boundHandleKeyUp);

        // 마우스 이벤트 (canvas 레벨)
        canvas.addEventListener('mousemove', this._boundHandleMouseMove);
        canvas.addEventListener('mousedown', this._boundHandleMouseDown);
        window.addEventListener('mouseup', this._boundHandleMouseUp);

        this._isInitialized = true;
        console.log('[InputManager] Initialized');
    }

    /**
     * 매 프레임 끝에 호출 - 일회성 상태 초기화
     */
    update() {
        this.keysJustPressed = {};
        this.keysJustReleased = {};
    }

    // === 키보드 API ===

    isKeyDown(key) {
        return this.keys[key] === true;
    }

    isKeyJustPressed(key) {
        return this.keysJustPressed[key] === true;
    }

    isKeyJustReleased(key) {
        return this.keysJustReleased[key] === true;
    }

    // === 이벤트 구독 ===

    subscribe(eventType, callback) {
        if (this._subscribers[eventType]) {
            this._subscribers[eventType].push(callback);
        }
    }

    unsubscribe(eventType, callback) {
        if (this._subscribers[eventType]) {
            const index = this._subscribers[eventType].indexOf(callback);
            if (index > -1) {
                this._subscribers[eventType].splice(index, 1);
            }
        }
    }

    // === Private 핸들러 ===

    _handleKeyDown(event) {
        if (!this.keys[event.key]) {
            this.keysJustPressed[event.key] = true;
        }
        this.keys[event.key] = true;

        this._notify('keydown', event);
    }

    _handleKeyUp(event) {
        this.keys[event.key] = false;
        this.keysJustReleased[event.key] = true;

        this._notify('keyup', event);
    }

    _handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;

        this._notify('mousemove', { x: this.mouse.x, y: this.mouse.y, event });
    }

    _handleMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.buttons[event.button] = true;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this._notify('mousedown', { x, y, button: event.button, event });
    }

    _handleMouseUp(event) {
        this.mouse.isDown = false;
        this.mouse.buttons[event.button] = false;

        this._notify('mouseup', { button: event.button, event });
    }

    _notify(eventType, data) {
        this._subscribers[eventType].forEach(callback => callback(data));
    }

    /**
     * 정리
     */
    destroy() {
        window.removeEventListener('keydown', this._boundHandleKeyDown);
        window.removeEventListener('keyup', this._boundHandleKeyUp);
        window.removeEventListener('mouseup', this._boundHandleMouseUp);

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this._boundHandleMouseMove);
            this.canvas.removeEventListener('mousedown', this._boundHandleMouseDown);
        }

        this.keys = {};
        this._subscribers = { keydown: [], keyup: [], mousedown: [], mouseup: [], mousemove: [] };
        this._isInitialized = false;

        console.log('[InputManager] Destroyed');
    }
}

// 싱글톤 인스턴스
const Input = new InputManager();
