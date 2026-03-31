class NeoSlot {
    constructor() {
        this.balance = 1000;
        this.betAmount = 50;
        this.rtp = 96;
        this.totalSpins = 0;
        this.totalWins = 0;
        this.totalLosses = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.maxWin = 0;
        this.balanceHistory = [1000];
        this.achievements = new Set();
        this.soundEnabled = true;
        this.isSpinning = false;
        
        this.symbols = ['🍒', '🍊', '🍋', '💎', '7️⃣'];
        this.paytable = {
            '7️⃣7️⃣7️⃣': 50,
            '💎💎💎': 20,
            '🍋🍋🍋': 10,
            '🍊🍊🍊': 5,
            '🍒🍒🍒': 3
        };
        
        this.init();
    }
    
    init() {
        this.attachEvents();
        this.initChart();
        this.updateUI();
        this.updateStats();
        this.loadSounds();
    }
    
    attachEvents() {
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('rtpSlider').addEventListener('input', (e) => this.updateRTP(e.target.value));
        
        document.querySelectorAll('.bet-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bet-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.betAmount = parseInt(btn.dataset.bet);
            });
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }
    
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
    }
    
    updateRTP(value) {
        this.rtp = parseInt(value);
        document.getElementById('rtpValue').textContent = `${this.rtp}%`;
    }
    
    getRandomResult() {
        const rtpFactor = this.rtp / 96;
        const weightedSymbols = [];
        
        const probabilities = {
            '🍒': 45 * rtpFactor,
            '🍊': 36 * rtpFactor,
            '🍋': 18 * rtpFactor,
            '💎': 9 * rtpFactor,
            '7️⃣': 4.5 * rtpFactor
        };
        
        Object.entries(probabilities).forEach(([symbol, prob]) => {
            const count = Math.max(1, Math.floor(prob));
            for (let i = 0; i < count; i++) {
                weightedSymbols.push(symbol);
            }
        });
        
        const getSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
        return [getSymbol(), getSymbol(), getSymbol()];
    }
    
    calculateWin(result) {
        const [a, b, c] = result;
        const combo = a + b + c;
        
        if (this.paytable[combo]) {
            return this.betAmount * this.paytable[combo];
        }
        
        if (a === b || b === c || a === c) {
            return this.betAmount;
        }
        
        return 0;
    }
    
    async spin() {
        if (this.isSpinning) return;
        if (this.balance < this.betAmount) {
            this.showToast('Insufficient credits! Press RESET', 'loss');
            return;
        }
        
        this.isSpinning = true;
        this.balance -= this.betAmount;
        this.updateUI();
        
        // Start reel animation
        const reels = [1, 2, 3].map(i => document.getElementById(`reel${i}`));
        reels.forEach(reel => reel.classList.add('reel-spinning'));
        
        // Add loading state to button
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.classList.add('loading');
        
        this.playSound('spin');
        
        // Simulate spin time
        await this.delay(800);
        
        // Get result
        const result = this.getRandomResult();
        const win = this.calculateWin(result);
        
        // Stop reels one by one
        for (let i = 0; i < reels.length; i++) {
            await this.delay(100);
            reels[i].classList.remove('reel-spinning');
            this.updateReelSymbol(i + 1, result[i]);
        }
        
        if (win > 0) {
            this.balance += win;
            this.totalWins++;
            this.currentStreak++;
            
            if (win >= this.betAmount * 50) {
                this.showJackpotEffect();
                this.playSound('jackpot');
                this.unlockAchievement('jackpot');
            } else {
                this.showWinEffect(win);
                this.playSound('win');
            }
            
            if (win > this.maxWin) {
                this.maxWin = win;
            }
            
            this.showToast(`WIN! +${win} credits (${win/this.betAmount}x)`, 'win');
        } else {
            this.totalLosses++;
            this.currentStreak = 0;
            this.playSound('lose');
            this.showToast(`LOSS! -${this.betAmount} credits`, 'loss');
        }
        
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            if (this.currentStreak >= 3) this.unlockAchievement('luckyStreak');
        }
        
        this.totalSpins++;
        this.balanceHistory.push(this.balance);
        this.updateChart();
        this.updateStats();
        this.updateUI();
        
        if (this.totalSpins >= 100) this.unlockAchievement('grinder');
        if (this.balance >= 5000) this.unlockAchievement('millionaire');
        if (this.betAmount === 250) this.unlockAchievement('highRoller');
        
        if (this.balance <= 0) {
            this.showToast('GAME OVER! Press RESET', 'loss');
            document.getElementById('spinBtn').disabled = true;
        }
        
        this.isSpinning = false;
        spinBtn.classList.remove('loading');
    }
    
    updateReelSymbol(reelNum, symbol) {
        const reel = document.getElementById(`reel${reelNum}`);
        const container = reel.querySelector('.symbols-container');
        const symbols = container.querySelectorAll('.symbol');
        
        // Center the winning symbol
        const targetIndex = 2;
        symbols[targetIndex].textContent = symbol;
        
        // Adjust positions
        container.style.transform = `translateY(-${targetIndex * 200}px)`;
    }
    
    showWinEffect(win) {
        const winDisplay = document.getElementById('winDisplay');
        const winAmount = winDisplay.querySelector('.win-amount');
        winAmount.textContent = `+${win}`;
        winDisplay.classList.add('show');
        
        // Create floating particles
        for (let i = 0; i < 30; i++) {
            this.createFloatingNumber(win);
        }
        
        setTimeout(() => {
            winDisplay.classList.remove('show');
        }, 1500);
    }
    
    showJackpotEffect() {
        const winDisplay = document.getElementById('winDisplay');
        winDisplay.querySelector('.win-amount').textContent = 'JACKPOT!';
        winDisplay.classList.add('show');
        
        // Create confetti
        for (let i = 0; i < 100; i++) {
            this.createConfetti();
        }
        
        setTimeout(() => {
            winDisplay.classList.remove('show');
        }, 2000);
    }
    
    createFloatingNumber(win) {
        const el = document.createElement('div');
        el.textContent = `+${Math.floor(win / 10)}`;
        el.style.position = 'fixed';
        el.style.left = Math.random() * window.innerWidth + 'px';
        el.style.bottom = '200px';
        el.style.color = '#00e5a0';
        el.style.fontSize = Math.random() * 20 + 20 + 'px';
        el.style.fontWeight = 'bold';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1000';
        el.style.animation = 'floatUp 1s ease-out forwards';
        document.body.appendChild(el);
        
        setTimeout(() => el.remove(), 1000);
    }
    
    createConfetti() {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-20px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
    
    showToast(message, type) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
    
    unlockAchievement(id) {
        if (this.achievements.has(id)) return;
        
        this.achievements.add(id);
        const achievement = document.querySelector(`[data-achievement="${id}"]`);
        if (achievement) {
            achievement.classList.remove('locked');
            achievement.classList.add('unlocked');
            this.showToast(`🏆 ACHIEVEMENT UNLOCKED: ${achievement.querySelector('.achievement-name').textContent}`, 'achievement');
            this.playSound('win');
        }
    }
    
    initChart() {
        const ctx = document.getElementById('bankrollChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['0'],
                datasets: [{
                    label: 'Bankroll',
                    data: [1000],
                    borderColor: '#ff3b6f',
                    backgroundColor: 'rgba(255, 59, 111, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#8b92a8' } }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#8b92a8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8b92a8' }
                    }
                }
            }
        });
    }
    
    updateChart() {
        const labels = Array.from({ length: this.balanceHistory.length }, (_, i) => i);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = this.balanceHistory;
        this.chart.update();
    }
    
    updateStats() {
        const winRate = this.totalSpins > 0 ? ((this.totalWins / this.totalSpins) * 100).toFixed(1) : 0;
        const currentRTP = this.totalSpins > 0 ? 
            ((this.balanceHistory[this.balanceHistory.length-1] - 1000 + (this.totalSpins * this.betAmount)) / (this.totalSpins * this.betAmount) * 100).toFixed(1) : 0;
        
        document.getElementById('totalSpins').textContent = this.totalSpins;
        document.getElementById('winRate').textContent = `${winRate}%`;
        document.getElementById('bestStreak').textContent = this.bestStreak;
        document.getElementById('maxWin').textContent = this.maxWin;
        document.getElementById('totalLosses').textContent = this.totalLosses;
        document.getElementById('currentRTP').textContent = `${currentRTP}%`;
    }
    
    updateUI() {
        document.getElementById('balance').textContent = Math.floor(this.balance).toLocaleString();
        if (this.balance <= 0) {
            document.getElementById('spinBtn').disabled = true;
        } else {
            document.getElementById('spinBtn').disabled = false;
        }
    }
    
    reset() {
        this.balance = 1000;
        this.totalSpins = 0;
        this.totalWins = 0;
        this.totalLosses = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.maxWin = 0;
        this.balanceHistory = [1000];
        this.achievements.clear();
        
        this.updateUI();
        this.updateChart();
        this.updateStats();
        document.getElementById('spinBtn').disabled = false;
        
        document.querySelectorAll('.achievement-card').forEach(ach => {
            ach.classList.add('locked');
            ach.classList.remove('unlocked');
        });
        
        [1, 2, 3].forEach(i => {
            const reel = document.getElementById(`reel${i}`);
            const container = reel.querySelector('.symbols-container');
            container.style.transform = 'translateY(0)';
        });
        
        this.showToast('Game reset! Good luck!', 'win');
    }
    
    loadSounds() {
        this.sounds = {
            spin: this.createBeep(440, 0.1),
            win: this.createBeep(880, 0.2),
            lose: this.createBeep(220, 0.3),
            jackpot: this.createBeep(1760, 0.5)
        };
    }
    
    createBeep(freq, duration) {
        return () => {
            if (!this.soundEnabled) return;
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            gain.gain.value = 0.1;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
            osc.stop(audioCtx.currentTime + duration);
            setTimeout(() => audioCtx.close(), duration * 1000);
        };
    }
    
    playSound(name) {
        if (this.sounds[name]) this.sounds[name]();
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundToggle');
        btn.querySelector('.sound-icon').textContent = this.soundEnabled ? '🔊' : '🔇';
        this.showToast(this.soundEnabled ? 'Sound ON' : 'Sound OFF', 'info');
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const btn = document.getElementById('themeToggle');
        btn.querySelector('.theme-icon').textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-200px); opacity: 0; }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    
    body.dark-theme {
        --bg-dark: #0a0c12;
        --bg-card: #0f1117;
    }
`;
document.head.appendChild(style);

// Start the game
new NeoSlot();
