// game-logic.js
class PlinkoGame {
    constructor() {
        this.canvas = document.getElementById('plinkoCanvas');
        this.physics = new PhysicsEngine(this.canvas);
        this.balance = 1000.00;
        this.currentBet = 10.00;
        this.init();
    }

    init() {
        // Generate initial board
        this.resizeCanvas();
        this.physics.generatePegs(16);
        this.generateMultipliers('high');
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        document.getElementById('dropButton').addEventListener('click', () => this.dropBall());
    }

    generateMultipliers(riskLevel) {
        // Stake's exact multiplier sequence
        const multipliers = {
            low: [0.2, 0.5, 1, 2, 3, 5, 9],
            medium: [0.3, 1, 2, 5, 10, 15, 25],
            high: [1000, 180, 260, 91, 48, 22, 2, 2, 2, 2, 24, 44, 94, 268, 630, 0]
        };
        
        const container = document.getElementById('multipliers');
        container.innerHTML = multipliers[riskLevel]
            .map(m => `<div class="multiplier-chip">${m}x</div>`)
            .join('');
    }

    dropBall() {
        if(this.balance < this.currentBet) return;
        
        // Deduct balance
        this.balance -= this.currentBet;
        this.updateBalance();

        // Create ball with Stake's initial conditions
        const ball = {
            x: this.canvas.width/2 + Math.random()*30-15,
            y: 20,
            vx: Math.random()*2-1,
            vy: 0,
            radius: 5,
            landed: false
        };

        this.physics.balls.push(ball);
        this.animate();
    }

    animate() {
        this.physics.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update physics
        this.physics.balls.forEach(ball => {
            this.physics.updateBall(ball);
            this.checkSlotCollision(ball);
        });

        // Redraw
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    checkSlotCollision(ball) {
        if(ball.y > this.canvas.height - 30) {
            ball.landed = true;
            const multiplier = this.calculateMultiplier(ball.x);
            this.balance += this.currentBet * multiplier;
            this.updateBalance();
        }
    }

    calculateMultiplier(x) {
        // Binomial distribution logic
        const slotWidth = this.canvas.width / 16;
        const slotIndex = Math.floor(x / slotWidth);
        return this.getMultiplierValue(slotIndex);
    }
}
