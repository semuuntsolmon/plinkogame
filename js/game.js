class PlinkoGame {
    constructor() {
        this.isRunning = false;
        this.balance = 1000;
        this.rowCount = 16;
        this.riskLevel = 'high';
        this.pegs = [];
        this.balls = [];
        this.slots = [];
        this.physics = new PhysicsEngine();
        this.ui = new UI(this);
        this.init();
    }

    generateBoard() {
        this.pegs = [];
        this.slots = [];
        const canvas = document.getElementById('game-canvas');
        const width = canvas.width;
        const height = canvas.height;

        // Adjusted peg sizing and spacing
        const pegRadius = 4; // Reduced from dynamic calculation
        const horizontalSpacing = width / (this.rowCount + 1) * 0.8;
        const verticalSpacing = height / (this.rowCount + 1) * 1.2;

        // Improved staggered peg layout
        for (let row = 0; row < this.rowCount; row++) {
            const pegCount = row + 1;
            const rowWidth = pegCount * horizontalSpacing;
            const startX = (width - rowWidth) / 2 + horizontalSpacing / 2;
            
            // Stagger every other row
            const xOffset = row % 2 === 0 ? horizontalSpacing / 2 : 0;
            
            for (let i = 0; i < pegCount; i++) {
                this.pegs.push({
                    x: startX + i * horizontalSpacing + xOffset,
                    y: 50 + row * verticalSpacing, // Start lower with more spacing
                    radius: pegRadius,
                    hit: false
                });
            }
        }

        // Proper slot positioning
        const slotCount = this.rowCount + 1;
        const slotWidth = width / slotCount;
        for (let i = 0; i < slotCount; i++) {
            this.slots.push({
                x: i * slotWidth,
                y: height - 30, // Fixed bottom position
                width: slotWidth,
                height: 40,
                index: i,
                multiplier: this.multipliers[i]
            });
        }
    }

    placeBet() {
        const canvas = document.getElementById('game-canvas');
        const ball = this.physics.createBall(
            canvas.width / 2 + Utils.random(-20, 20), // Add horizontal variance
            10 // Start just below top
        );
        
        // Increased initial velocity randomness
        ball.vx = Utils.random(-1.5, 1.5);
        this.balls.push(ball);
    }
}
