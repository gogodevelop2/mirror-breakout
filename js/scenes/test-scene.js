// js/scenes/test-scene.js
// Test scene for verifying SceneManager works

class TestScene extends BaseScene {
    constructor(name, color, message) {
        super(name);
        this.color = color;
        this.message = message;
        this.time = 0;
    }

    onEnter(data) {
        super.onEnter(data);
        this.time = 0;
    }

    update(deltaTime) {
        this.time += deltaTime;
    }

    render(ctx) {
        // Background
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Scene name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.message, ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);

        // Timer
        ctx.font = '24px Arial';
        ctx.fillText(`Time: ${this.time.toFixed(1)}s`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);

        // Instruction
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Click anywhere to continue...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 100);
    }

    handleClick(x, y) {
        console.log(`[${this.name}] Clicked at (${x}, ${y})`);
    }
}
