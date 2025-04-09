class PhysicsEngine {
    constructor() {
        this.GRAVITY = 0.8;
        this.RESTITUTION = 0.6; // Reduced from 0.7
        this.FRICTION = 0.1;
        this.ballRadius = 6; // Reduced from 10
        this.CELL_SIZE = 40; // Optimized spatial grid
    }

    handleCollisions(ball) {
        const nearbyPegs = this.spatialGrid.getNearbyObjects(ball.x, ball.y, ball.radius * 2);
        
        for (const peg of nearbyPegs) {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = ball.radius + peg.radius;

            if (distance < minDistance) {
                // Improved collision resolution
                const nx = dx / distance;
                const ny = dy / distance;
                const penetration = minDistance - distance;
                
                // Position correction
                ball.x += nx * penetration * 0.8;
                ball.y += ny * penetration * 0.8;

                // Velocity adjustment
                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx = (ball.vx - 2 * dot * nx) * this.RESTITUTION;
                ball.vy = (ball.vy - 2 * dot * ny) * this.RESTITUTION;

                // Add random velocity to prevent sticking
                ball.vx += Utils.random(-0.2, 0.2);
                ball.vy += Utils.random(-0.2, 0.2);
            }
        }
    }

    checkSlotEntry(ball) {
        for (const slot of this.slots) {
            if (ball.y + ball.radius > slot.y && 
                ball.x > slot.x && 
                ball.x < slot.x + slot.width) {
                ball.inSlot = true;
                ball.vx = 0;
                ball.vy = 0;
                ball.y = slot.y - ball.radius;
                if (ball.onSlotEnter) ball.onSlotEnter(slot.index);
                break;
            }
        }
    }

    isOutOfBounds(ball) {
        return ball.y > this.canvas.height + 50;
    }
}
