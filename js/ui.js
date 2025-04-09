class UI {
    drawBoard(pegs, balls) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pegs with proper scaling
        pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = peg.hit ? '#ff5555' : '#ffffff44';
            this.ctx.fill();
        });

        // Draw balls with proper scaling
        balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fill();
        });

        // Draw slots with correct positioning
        this.ctx.fillStyle = '#ffffff22';
        this.slots.forEach(slot => {
            this.ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight * 0.7; // Better aspect ratio
        
        // Maintain proper scaling
        this.ctx.scale(1, 1);
        this.game.redraw();
    }
}
