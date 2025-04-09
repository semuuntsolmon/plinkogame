/**
 * UI and Interface handling for Plinko game
 */
class UI {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.multiplierElements = [];
        
        // Game controls
        this.betInput = document.getElementById('bet-amount');
        this.riskSelect = document.getElementById('risk-level');
        this.rowsSelect = document.getElementById('rows-count');
        this.dropButton = document.getElementById('drop-ball');
        this.betModeButtons = document.querySelectorAll('.bet-mode-btn');
        
        // Game settings
        this.soundToggle = document.getElementById('sound-toggle');
        this.animationSpeed = document.getElementById('animation-speed');
        
        // UI controls
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.querySelector('.settings-modal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.betHalfBtn = document.querySelector('.bet-half');
        this.betDoubleBtn = document.querySelector('.bet-double');
        
        // Win notification
        this.winNotification = document.querySelector('.win-notification');
        this.winAmount = document.querySelector('.win-amount');
        
        // Recent drops
        this.recentDropsContainer = document.querySelector('.recent-drops');
        
        // Balance display
        this.balanceValue = document.querySelector('.balance-value');
        
        // Sound effects
        this.sounds = {
            drop: new Audio('assets/sounds/drop.mp3'),
            hit: new Audio('assets/sounds/hit.mp3'),
            win: new Audio('assets/sounds/win.mp3')
        };
        
        // Set default values
        this.soundEnabled = Utils.loadFromStorage('sound', true);
        this.soundToggle.checked = this.soundEnabled;
        
        this.speed = Utils.loadFromStorage('speed', 3);
        this.animationSpeed.value = this.speed;
        
        // Initialize
        this.initEventListeners();
        this.initMultipliers();
        this.resizeCanvas();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Resize event
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // Drop ball button
        this.dropButton.addEventListener('click', () => {
            if (!this.game.isRunning) {
                this.game.placeBet();
            }
        });
        
        // Bet mode toggle
        this.betModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.betModeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.game.setBetMode(btn.dataset.mode);
            });
        });
        
        // Settings button
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.style.display = 'flex';
        });
        
        // Close modal button
        this.closeModalBtn.addEventListener('click', () => {
            this.settingsModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.settingsModal.style.display = 'none';
            }
        });
        
        // Sound toggle
        this.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            Utils.saveToStorage('sound', this.soundEnabled);
        });
        
        // Animation speed
        this.animationSpeed.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            Utils.saveToStorage('speed', this.speed);
            this.game.updateSpeed(this.speed);
        });
        
        // Bet amount shortcuts
        this.betHalfBtn.addEventListener('click', () => {
            const currentBet = parseFloat(this.betInput.value);
            this.betInput.value = Utils.formatCurrency(currentBet / 2);
        });
        
        this.betDoubleBtn.addEventListener('click', () => {
            const currentBet = parseFloat(this.betInput.value);
            this.betInput.value = Utils.formatCurrency(currentBet * 2);
        });
        
        // Game options change events
        this.riskSelect.addEventListener('change', () => {
            this.game.updateRiskLevel(this.riskSelect.value);
            this.initMultipliers();
        });
        
        this.rowsSelect.addEventListener('change', () => {
            this.game.updateRowCount(parseInt(this.rowsSelect.value));
            this.initMultipliers();
        });
    }
    
    /**
     * Initialize multiplier display
     */
    initMultipliers() {
        const multiplierContainer = document.querySelector('.multipliers-container');
        multiplierContainer.innerHTML = '';
        
        const multipliers = this.game.multipliers;
        
        multipliers.forEach((value, i) => {
            const multiplierEl = document.createElement('div');
            multiplierEl.className = 'multiplier';
            multiplierEl.textContent = `${value}x`;
            multiplierEl.style.backgroundColor = Utils.getMultiplierColor(value);
            
            multiplierContainer.appendChild(multiplierEl);
            this.multiplierElements[i] = multiplierEl;
        });
    }
    
    /**
     * Resize canvas to match container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 50; // Account for multipliers bar
        
        // Redraw the game
        this.game.redraw();
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of sound to play
     */
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                // Silently handle autoplay restrictions
            });
        }
    }
    
    /**
     * Draw the game board
     * @param {Array} pegs - Array of peg objects
     * @param {Array} balls - Array of ball objects
     */
    drawBoard(pegs, balls) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#182338';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines (subtle)
        this.ctx.strokeStyle = 'rgba(41, 57, 86, 0.5)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        const verticalSpacing = this.canvas.width / 12;
        for (let x = verticalSpacing; x < this.canvas.width; x += verticalSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        const horizontalSpacing = this.canvas.height / 10;
        for (let y = horizontalSpacing; y < this.canvas.height; y += horizontalSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw pegs
        pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = peg.hit ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
            
            // Draw peg glow
            if (peg.hit) {
                this.ctx.beginPath();
                this.ctx.arc(peg.x, peg.y, peg.radius * 1.8, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
            }
        });
        
        // Draw slots dividers
        const slotWidth = this.canvas.width / this.game.multipliers.length;
        const slotY = this.canvas.height - 5;
        
        for (let i = 0; i <= this.game.multipliers.length; i++) {
            const x = i * slotWidth;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, slotY - 40);
            this.ctx.lineTo(x, slotY);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw ball trails
        balls.forEach(ball => {
            if (ball.path && ball.path.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(ball.path[0].x, ball.path[0].y);
                
                for (let i = 1; i < ball.path.length; i++) {
                    this.ctx.lineTo(ball.path[i].x, ball.path[i].y);
                }
                
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }
        });
        
        // Draw balls
        balls.forEach(ball => {
            // Skip if outside viewport
            if (ball.y > this.canvas.height + 50) return;
            
            this.ctx.save();
            this.ctx.translate(ball.x, ball.y);
            this.ctx.rotate(ball.rotation);
            
            // Ball shadow
            this.ctx.beginPath();
            this.ctx.arc(2, 2, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();
            
            // Ball main body
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            
            // Gradient for 3D effect
            const gradient = this.ctx.createRadialGradient(
                -ball.radius/3, -ball.radius/3, 0,
                0, 0, ball.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(220, 220, 240, 0.8)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Ball highlight
            this.ctx.beginPath();
            this.ctx.arc(-ball.radius/3, -ball.radius/3, ball.radius/3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    /**
     * Highlight the winning slot
     * @param {number} slotIndex - Index of winning slot
     */
    highlightWinningSlot(slotIndex) {
        // Reset all multipliers
        this.multiplierElements.forEach(el => {
            el.style.transform = 'scale(1)';
            el.style.transition = 'transform 0.2s ease-out';
        });
        
        // Highlight winning multiplier
        if (this.multiplierElements[slotIndex]) {
            this.multiplierElements[slotIndex].style.transform = 'scale(1.1)';
        }
    }
    
    /**
     * Show win notification
     * @param {number} amount - Win amount
     */
    showWinNotification(amount) {
        this.winAmount.textContent = Utils.formatCurrency(amount);
        this.winNotification.classList.add('show');
        
        setTimeout(() => {
            this.winNotification.classList.remove('show');
        }, 2000);
    }
    
    /**
     * Update balance display
     * @param {number} balance - Current balance
     */
    updateBalance(balance) {
        this.balanceValue.textContent = Utils.formatCurrency(balance);
    }
    
    /**
     * Add a result to recent drops
     * @param {number} multiplier - Result multiplier
     */
    addRecentDrop(multiplier) {
        const recentDrop = document.createElement('div');
        recentDrop.className = 'recent-drop';
        recentDrop.textContent = `${multiplier}x`;
        recentDrop.style.backgroundColor = Utils.getMultiplierColor(multiplier);
        
        this.recentDropsContainer.prepend(recentDrop);
        
        // Limit to 5 recent drops
        while (this.recentDropsContainer.children.length > 5) {
            this.recentDropsContainer.removeChild(this.recentDropsContainer.lastChild);
        }
    }
    
    /**
     * Toggle drop button state
     * @param {boolean} enabled - Whether button should be enabled
     */
    toggleDropButton(enabled) {
        this.dropButton.disabled = !enabled;
        this.dropButton.textContent = enabled ? 'Bet' : 'Dropping...';
    }
    
    /**
     * Reset peg hit states
     * @param {Array} pegs - Array of peg objects
     */
    resetPegHits(pegs) {
        pegs.forEach(peg => {
            peg.hit = false;
        });
    }
}
