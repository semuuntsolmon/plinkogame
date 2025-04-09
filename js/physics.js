/**
 * Physics engine for Plinko game
 */
class PhysicsEngine {
    constructor(options = {}) {
        // Physics constants
        this.GRAVITY = options.gravity || 0.5;
        this.RESTITUTION = options.restitution || 0.7;
        this.FRICTION = options.friction || 0.02;
        this.FRAME_RATE = options.frameRate || 60;
        
        // Configure for mobile if needed
        if (Utils.isMobile()) {
            this.GRAVITY = this.GRAVITY * 1.2; // Slightly faster on mobile
            this.FRICTION = this.FRICTION * 1.5; // More friction to compensate
        }
        
        // Spatial partitioning for collision detection optimization
        this.CELL_SIZE = options.cellSize || 50;
        this.spatialGrid = new SpatialGrid(this.CELL_SIZE);
        
        // Ball properties
        this.ballRadius = options.ballRadius || 10;
        
        // Performance monitoring
        this.lastFrameTime = 0;
        this.frameCounter = 0;
        this.fps = 0;
    }
    
    /**
     * Initialize the physics engine
     * @param {Object} gameObjects - Game objects to initialize
     */
    init(gameObjects) {
        this.pegs = gameObjects.pegs || [];
        this.balls = gameObjects.balls || [];
        this.slots = gameObjects.slots || [];
        
        // Add pegs to spatial grid
        this.spatialGrid.clear();
        this.pegs.forEach(peg => {
            this.spatialGrid.addObject(peg);
        });
    }
    
    /**
     * Create a new ball
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Object} - New ball object
     */
    createBall(x, y) {
        return {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: this.ballRadius,
            rotation: 0,
            sleeping: false,
            path: [], // Records the path the ball takes
            inSlot: false,
            slotIndex: -1
        };
    }
    
    /**
     * Update ball physics
     * @param {Object} ball - Ball to update
     * @param {number} deltaTime - Time since last update
     */
    updateBall(ball, deltaTime) {
        // Don't run expensive physics if ball is off-screen or sleeping
        if (this.isOutOfBounds(ball) || ball.sleeping || ball.inSlot) return;
        
        const timeScale = deltaTime / (1000 / 60); // Normalize to 60 FPS
        
        // Apply gravity - scaled to frame rate for consistent experience
        ball.vy += this.GRAVITY * timeScale;
        
        // Update position with velocity
        ball.x += ball.vx * timeScale;
        ball.y += ball.vy * timeScale;
        
        // Apply air resistance (subtle)
        ball.vx *= 0.998;
        ball.vy *= 0.998;
        
        // Handle collisions
        this.handleCollisions(ball);
        
        // Update ball rotation for visual effect
        ball.rotation += ball.vx * 0.1;
        
        // Record path for visualization
        if (this.frameCounter % 3 === 0) { // Only record every few frames to save memory
            ball.path.push({ x: ball.x, y: ball.y });
        }
        
        // Check if ball entered a slot
        this.checkSlotEntry(ball);
        
        // Optimize by putting slow balls to sleep
        if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05 && ball.y > window.innerHeight - 100) {
            ball.sleeping = true;
        }
    }
    
    /**
     * Handle collisions with pegs
     * @param {Object} ball - Ball to check for collisions
     */
    handleCollisions(ball) {
        // Get nearby pegs using spatial partitioning
        const nearbyPegs = this.spatialGrid.getObjectsNear(ball.x, ball.y, ball.radius * 3);
        
        // Check for collisions with each nearby peg
        for (const peg of nearbyPegs) {
            // Calculate distance between ball and peg
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = ball.radius + peg.radius;
            
            // If collision detected
            if (distance < minDistance) {
                // Trigger peg hit animation
                if (!peg.hit) {
                    peg.hit = true;
                    setTimeout(() => { peg.hit = false; }, 100);
                }
                
                // Normalize collision vector
                const nx = dx / distance;
                const ny = dy / distance;
                
                // Calculate relative velocity
                const relativeVelocity = ball.vx * nx + ball.vy * ny;
                
                // Apply collision impulse (with restitution)
                const impulse = 2 * relativeVelocity * this.RESTITUTION;
                
                // Update ball velocity
                ball.vx -= impulse * nx;
                ball.vy -= impulse * ny;
                
                // Apply friction
                const tangentX = -ny;
                const tangentY = nx;
                const tangentVelocity = ball.vx * tangentX + ball.vy * tangentY;
                ball.vx -= tangentVelocity * this.FRICTION * tangentX;
                ball.vy -= tangentVelocity * this.FRICTION * tangentY;
                
                // Resolve overlap (push ball out of peg)
                const overlap = minDistance - distance;
                ball.x += overlap * nx;
                ball.y += overlap * ny;
                
                // Small random factor to prevent ball getting stuck
                ball.vx += Utils.random(-0.1, 0.1);
            }
        }
        
        // Handle collisions with walls
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * this.RESTITUTION;
        } else if (ball.x + ball.radius > window.innerWidth) {
            ball.x = window.innerWidth - ball.radius;
            ball.vx = -ball.vx * this.RESTITUTION;
        }
    }
    
    /**
     * Check if ball entered a slot
     * @param {Object} ball - Ball to check
     */
    checkSlotEntry(ball) {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            
            if (ball.x > slot.x && ball.x < slot.x + slot.width && ball.y > slot.y) {
                ball.inSlot = true;
                ball.slotIndex = i;
                ball.vx = 0;
                ball.vy = 0;
                ball.x = slot.x + slot.width / 2; // Center in slot
                return;
            }
        }
    }
    
    /**
     * Check if ball is out of bounds
     * @param {Object} ball - Ball to check
     * @returns {boolean} - True if out of bounds
     */
    isOutOfBounds(ball) {
        return ball.y > window.innerHeight + 100;
    }
    
    /**
     * Update physics for all objects
     * @param {number} timestamp - Current timestamp
     */
    update(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Update frame counter
        this.frameCounter++;
        
        // Calculate FPS every second
        if (timestamp - this.lastFPSUpdate > 1000) {
            this.fps = this.frameCounter;
            this.frameCounter = 0;
            this.lastFPSUpdate = timestamp;
        }
        
        // Update all balls
        for (const ball of this.balls) {
            this.updateBall(ball, deltaTime);
        }
        
        // Remove balls that are sleeping or out of bounds
        this.balls = this.balls.filter(ball => {
            return !(ball.sleeping || this.isOutOfBounds(ball));
        });
    }
}

/**
 * Spatial grid for efficient collision detection
 */
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = {};
    }
    
    /**
     * Get grid cell key
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {string} - Cell key
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    /**
     * Add object to grid
     * @param {Object} object - Object to add
     */
    addObject(object) {
        const key = this.getCellKey(object.x, object.y);
        
        if (!this.grid[key]) {
            this.grid[key] = [];
        }
        
        this.grid[key].push(object);
    }
    
    /**
     * Get objects near position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Search radius
     * @returns {Array} - Nearby objects
     */
    getObjectsNear(x, y, radius) {
        const result = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        
        // Check cells in radius
        for (let i = -cellRadius; i <= cellRadius; i++) {
            for (let j = -cellRadius; j <= cellRadius; j++) {
                const cellX = Math.floor(x / this.cellSize) + i;
                const cellY = Math.floor(y / this.cellSize) + j;
                const key = `${cellX},${cellY}`;
                
                if (this.grid[key]) {
                    result.push(...this.grid[key]);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Clear all objects from grid
     */
    clear() {
        this.grid = {};
    }
}
