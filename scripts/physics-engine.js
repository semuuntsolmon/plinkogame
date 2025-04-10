class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.balls = [];
        this.pegs = [];
        
        // Physics constants (Stake-tuned)
        this.GRAVITY = 0.85;
        this.RESTITUTION = 0.62;
        this.FRICTION = 0.12;
        this.BALL_RADIUS = 5;
    }

    generatePegs(rows = 16) {
        // Stake's exact peg generation algorithm
        const verticalSpacing = this.canvas.height / (rows + 4);
        const baseSpacing = this.canvas.width / (rows * 0.68);
        
        for(let row = 0; row < rows; row++) {
            const count = Math.floor(this.canvas.width / (baseSpacing - row * 0.8));
            const offset = row % 2 === 0 ? 0 : baseSpacing/2;
            
            for(let i = 0; i < count; i++) {
                this.pegs.push({
                    x: offset + i * (this.canvas.width / (count - 0.5)),
                    y: 40 + row * verticalSpacing,
                    radius: 3.5
                });
            }
        }
    }

    updateBall(ball) {
        if(ball.landed) return;

        // Apply forces
        ball.vy += this.GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision detection
        this.pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if(distance < ball.radius + peg.radius) {
                // Stake's collision response
                const nx = dx / distance;
                const ny = dy / distance;
                const penetration = ball.radius + peg.radius - distance;
                
                // Position correction
                ball.x += nx * penetration * 0.7;
                ball.y += ny * penetration * 0.7;

                // Velocity reflection
                const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
                ball.vx = nx * speed * this.RESTITUTION;
                ball.vy = ny * speed * this.RESTITUTION;
            }
        });
    }
}
