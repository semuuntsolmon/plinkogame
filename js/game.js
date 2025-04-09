class PlinkoGame {
    constructor() {
        // Stake-style multipliers
        this.multipliers = [1000, 180, 260, 91, 48, 22, 2, 2, 2, 2, 24, 44, 94, 268, 630, 0];
        this.rowCount = 16; // Fixed Stake default
        this.ballRadius = 5; // Stake-like ball size
        this.pegRadius = 3.5; // Exact Stake peg size
        
        // Stake physics parameters
        this.physics = new PhysicsEngine({
            gravity: 0.85,
            restitution: 0.62,
            friction: 0.12
        });
    }

    generateBoard() {
        // Stake's exact peg pattern
        const canvas = document.getElementById('game-canvas');
        const width = canvas.width;
        const height = canvas.height;
        
        // Stake's vertical spacing formula
        const verticalSpacing = height / (this.rowCount + 4);
        const horizontalSpacing = width / (this.rowCount * 0.68);

        for(let row = 0; row < this.rowCount; row++) {
            const xOffset = row % 2 === 0 ? 0 : horizontalSpacing/2;
            const pegCount = Math.floor(width / horizontalSpacing) - 1;
            
            for(let i = 0; i < pegCount; i++) {
                this.pegs.push({
                    x: xOffset + i * horizontalSpacing,
                    y: 40 + row * verticalSpacing,
                    radius: this.pegRadius
                });
            }
        }

        // Stake's slot positions
        const slotCount = 16;
        const slotWidth = width / slotCount;
        for(let i = 0; i < slotCount; i++) {
            this.slots.push({
                x: i * slotWidth,
                y: height - 35,
                width: slotWidth,
                multiplier: this.multipliers[i]
            });
        }
    }
}
