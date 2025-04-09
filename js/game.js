/**
 * Main game controller for Plinko
 */
class PlinkoGame {
    constructor() {
        // Initialize canvas and context
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = {
            isRunning: false,
            animationId: null,
            balls: [],
            pegs: [],
            slots: [],
            bet: 100,
            balance: 1000,
            risk: 'high',
            rows: 16,
            multipliers: [],
            soundEnabled: true,
            animationSpeed: 3, // 1-5 scale
            recentDrops: []
        };
        
        // Constants
        this.PEG_RADIUS = 4;
        this.BALL_RADIUS = 8;
        this.PEG_SPACING = 40;
        this.SLOT_HEIGHT = 40;
        
        // Load settings from storage
        this.loadSettings();
        
        // Initialize physics engine
        this.physics = new PhysicsEngine({
            ballRadius: this.BALL_RADIUS,
            gravity: 0.5 * (this.gameState.animationSpeed / 3)
        });
        
        // Load game sounds
        this.sounds = {
            drop: new Audio('assets/sounds/ball_drop.mp3'),
            hit: new Audio('assets/sounds/hit.mp3'),
            win: new Audio('assets/sounds/win.mp3')
        };
        
        // Set initial values to UI elements
        document.getElementById('bet-amount').value = this.gameState.bet;
        document.getElementById('risk-level').value = this.gameState.risk;
        document.getElementById('rows-count').value = this.gameState.rows;
        document.querySelector('.balance-value').textContent = Utils.formatCurrency(this.gameState.balance);
        document.getElementById('sound-toggle').checked = this.gameState.soundEnabled;
        document.getElementById('animation-speed').value = this.gameState.animationSpeed;
        
        // Initialize game
        this.initGame();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize game elements
     */
    initGame() {
        // Resize canvas to container
        this.resizeCanvas();
        
        // Generate pegs layout based on rows
        this.generatePegs();
        
        // Generate slot layout
        const slotCount = this.gameState.rows + 1;
        this.generateSlots(slotCount);
        
        // Generate multipliers based on risk level
        this.gameState.multipliers = Utils.generateMultipliers(this.gameState.risk, slotCount);
        
        // Initialize physics engine
        this.physics.init({
            pegs: this.gameState.pegs,
            balls: this.gameState.balls,
            slots: this.gameState.slots
        });
        
        // Update UI
        this.updateMultipliersDisplay();
        
        // Start game loop
        this.gameLoop();
    }
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Window resize event
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCanvas();
            this.generatePegs();
            this.generateSlots(this.gameState.rows + 1);
            this.updateMultipliersDisplay();
            this.physics.init({
                pegs: this.gameState.pegs,
                balls: this.gameState.balls,
                slots: this.gameState.slots
            });
        }, 250));
        
        // Drop ball button
        document.getElementById('drop-ball').addEventListener('click', () => {
            this.dropBall();
        });
        
        // Bet amount input
        document.getElementById('bet-amount').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            if (isNaN(value) || value <= 0) {
                e.target.value = this.gameState.bet;
                return;
            }
            this.gameState.bet = Math.min(value, this.gameState.balance);
            e.target.value = this.gameState.bet;
            this.saveSettings();
        });
        
        // Risk level select
        document.getElementById('risk-level').addEventListener('change', (e) => {
            this.gameState.risk = e.target.value;
            const slotCount = this.gameState.rows + 1;
            this.gameState.multipliers = Utils.generateMultipliers(this.gameState.risk, slotCount);
            this.updateMultipliersDisplay();
            this.saveSettings();
        });
        
        // Rows count select
        document.getElementById('rows-count').addEventListener('change', (e) => {
            this.gameState.rows = parseInt(e.target.value);
            this.initGame();
            this.saveSettings();
        });
        
        // Bet half button
        document.querySelector('.bet-half').addEventListener('click', () => {
            const betInput = document.getElementById('bet-amount');
            betInput.value = Utils.formatCurrency(this.gameState.bet / 2);
            betInput.dispatchEvent(new Event('change'));
        });
        
        // Bet double button
        document.querySelector('.bet-double').addEventListener('click', () => {
            const betInput = document.getElementById('bet-amount');
            betInput.value = Utils.formatCurrency(this.gameState.bet * 2);
            betInput.dispatchEvent(new Event('change'));
        });
        
        // Bet mode buttons
        document.querySelectorAll('.bet-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bet-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // Auto betting functionality would be implemented here
            });
        });
        
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showModal('.settings-modal');
        });
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModals();
            });
        });
        
        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.gameState.soundEnabled = e.target.checked;
            this.saveSettings();
        });
        
        // Animation speed
        document.getElementById('animation-speed').addEventListener('input', (e) => {
            this.gameState.animationSpeed = parseInt(e.target.value);
            this.physics.GRAVITY = 0.5 * (this.gameState.animationSpeed / 3);
            this.saveSettings();
        });
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    /**
     * Generate peg layout
     */
    generatePegs() {
        this.gameState.pegs = [];
        
        const startY = 80;
        const endY = this.canvas.height - this.SLOT_HEIGHT - 20;
        const availableHeight = endY - startY;
        
        const rowHeight = availableHeight / (this.gameState.rows - 1);
        
        for (let row = 0; row < this.gameState.rows; row++) {
            const y = startY + row * rowHeight;
            const pegsInRow = row + 1;
            const totalWidth = pegsInRow * this.PEG_SPACING;
            const startX = (this.canvas.width - totalWidth) / 2 + (row % 2 === 0 ? this.PEG_SPACING / 2 : 0);
            
            for (let col = 0; col < pegsInRow; col++) {
                const x = startX + col * this.PEG_SPACING;
                
                this.gameState.pegs.push({
                    x,
                    y,
                    radius: this.PEG_RADIUS,
                    hit: false
                });
            }
        }
    }
    
    /**
     * Generate slot layout
     * @param {number} count - Number of slots
     */
    generateSlots(count) {
        this.gameState.slots = [];
        
        const slotWidth = this.canvas.width / count;
        const slotY = this.canvas.height - this.SLOT_HEIGHT;
        
        for (let i = 0; i < count; i++) {
            this.gameState.slots.push({
                x: i * slotWidth,
                y: slotY,
                width: slotWidth,
                height: this.SLOT_HEIGHT
            });
        }
    }
    
    /**
     * Update multipliers display in UI
     */
    updateMultipliersDisplay() {
        const container = document.querySelector('.multipliers-container');
        container.innerHTML = '';
        
        this.gameState.multipliers.forEach((value, i) => {
            const multiplier = document.createElement('div');
            multiplier.className = 'multiplier';
            
            // Set color based on multiplier value
            if (value >= 100) multiplier.classList.add('slot-1000x');
            else if (value >= 25) multiplier.classList.add('slot-130x');
            else if (value >= 10) multiplier.classList.add('slot-26x');
            else if (value >= 5) multiplier.classList.add('slot-9x');
            else if (value >= 2) multiplier.classList.add('slot-4x');
            else if (value >= 1) multiplier.classList.add('slot-2x');
            else multiplier.classList.add('slot-0-2x');
            
            multiplier.textContent = value + 'x';
            container.appendChild(multiplier);
        });
    }
    
    /**
     * Drop a new ball
     */
    dropBall() {
        // Check if player has enough balance
        if (this.gameState.balance < this.gameState.bet) {
            alert('Insufficient balance!');
            return;
        }
        
        // Deduct bet from balance
        this.gameState.balance -= this.gameState.bet;
        this.updateBalance();
        
        // Disable the drop button temporarily
        const dropBtn = document.getElementById('drop-ball');
        dropBtn.disabled = true;
        setTimeout(() => {
            dropBtn.disabled = false;
        }, 2000);
        
        // Create a new ball at top center of the canvas
        const ball = this.physics.createBall(
            this.canvas.width / 2 + Utils.random(-5, 5),
            50
        );
        
        // Add initial velocity
        ball.vx = Utils.random(-0.5, 0.5);
        ball.vy = 1;
        
        // Add ball to the game
        this.gameState.balls.push(ball);
        
        // Play drop sound
        this.playSound('drop');
        
        // Set a timeout to check the result
        setTimeout(() => {
            if (!ball.inSlot) {
                // If ball hasn't entered a slot within timeout, set it to inSlot with a random index
                ball.inSlot = true;
                ball.slotIndex = Math.floor(Utils.random(0, this.gameState.slots.length));
            }
            this.handleWin(ball);
        }, 10000);
    }
    
    /**
     * Handle win when ball enters a slot
     * @param {Object} ball - Ball that entered a slot
     */
    handleWin(ball) {
        if (!ball.inSlot) return;
        
        const slotIndex = ball.slotIndex;
        const multiplier = this.gameState.multipliers[slotIndex];
        const winAmount = this.gameState.bet * multiplier;
        
        // Update balance with winnings
        this.gameState.balance += winAmount;
        this.updateBalance();
        
        // Add to recent drops
        this.addToRecentDrops(multiplier);
        
        // Show win notification
        if (multiplier > 1) {
            this.showWinNotification(winAmount);
            this.playSound('win');
        }
    }
    
    /**
     * Update balance display
     */
    updateBalance() {
        document.querySelector('.balance-value').textContent = Utils.formatCurrency(this.gameState.balance);
    }
    
    /**
     * Add a drop to recent drops display
     * @param {number} multiplier - Multiplier value
     */
    addToRecentDrops(multiplier) {
        // Add to recent drops array (max 10)
        this.gameState.recentDrops.unshift(multiplier);
        if (this.gameState.recentDrops.length > 10) {
            this.gameState.recentDrops.pop();
        }
        
        // Update recent drops display
        const container = document.querySelector('.recent-drops');
        container.innerHTML = '';
        
        this.gameState.recentDrops.forEach(value => {
            const drop = document.createElement('div');
            drop.className = 'recent-drop';
            drop.textContent = value + 'x';
            
            // Set color based on value
            drop.style.backgroundColor = Utils.getMultiplierColor(value);
            
            container.appendChild(drop);
        });
    }
    
    /**
     * Show win notification
     * @param {number} amount - Win amount
     */
    showWinNotification(amount) {
        const notification = document.querySelector('.win-notification');
        const amountEl = notification.querySelector('.win-amount');
        
        amountEl.textContent = Utils.formatCurrency(amount);
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Show a modal
     * @param {string} selector - Modal selector
     */
    showModal(selector) {
        const modal = document.querySelector(selector);
        modal.style.display = 'flex';
    }
    
    /**
     * Hide all modals
     */
    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    /**
     * Play a sound effect
     * @param {string} sound - Sound name
     */
    playSound(sound) {
        if (!this.gameState.soundEnabled) return;
        
        // Clone the audio for overlapping sounds
        const audio = this.sounds[sound].cloneNode();
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play error:', e));
    }
    
    /**
     * Load settings from local storage
     */
    loadSettings() {
        const settings = Utils.loadFromStorage('plinko-settings', {});
        
        if (settings.bet) this.gameState.bet = settings.bet;
        if (settings.risk) this.gameState.risk = settings.risk;
        if (settings.rows) this.gameState.rows = settings.rows;
        if (settings.soundEnabled !== undefined) this.gameState.soundEnabled = settings.soundEnabled;
        if (settings.animationSpeed) this.gameState.animationSpeed = settings.animationSpeed;
        if (settings.balance) this.gameState.balance = settings.balance;
    }
    
    /**
     * Save settings to local storage
     */
    saveSettings() {
        Utils.saveToStorage('plinko-settings', {
            bet: this.gameState.bet,
            risk: this.gameState.risk,
            rows: this.gameState.rows,
            soundEnabled: this.gameState.soundEnabled,
            animationSpeed: this.gameState.animationSpeed,
            balance: this.gameState.balance
        });
    }
    
    /**
     * Draw all game objects
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pegs
        for (const peg of this.gameState.pegs) {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            
            // Add glow effect for hit pegs
            if (peg.hit) {
                this.ctx.shadowColor = 'white';
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw slots
        for (let i = 0; i < this.gameState.slots.length; i++) {
            const slot = this.gameState.slots[i];
            const multiplier = this.gameState.multipliers[i];
            
            // Set color based on multiplier
            this.ctx.fillStyle = Utils.getMultiplierColor(multiplier);
            
            this.ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
        }
        
        // Draw balls
        for (const ball of this.gameState.balls) {
            // Draw trail
            if (ball.path.length > 5) {
                this.ctx.beginPath();
                this.ctx.moveTo(ball.path[0].x, ball.path[0].y);
                
                for (let i = 1; i < ball.path.length; i++) {
                    this.ctx.lineTo(ball.path[i].x, ball.path[i].y);
                }
                
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // Draw ball
            this.ctx.save();
            this.ctx.translate(ball.x, ball.y);
            this.ctx.rotate(ball.rotation);
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.shadowColor = 'white';
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            
            // Draw pattern on ball
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#0d1421';
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        // Update physics
        this.physics.update(timestamp);
        
        // Draw everything
        this.draw();
        
        // Loop
        this.gameState.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Preload assets
    const preloadSounds = () => {
        const sounds = [
            'assets/sounds/ball_drop.mp3',
            'assets/sounds/hit.mp3',
            'assets/sounds/win.mp3'
        ];
        
        sounds.forEach(src => {
            const audio = new Audio();
            audio.src = src;
        });
    };
    
    preloadSounds();
    
    // Initialize game
    const game = new PlinkoGame();
});
