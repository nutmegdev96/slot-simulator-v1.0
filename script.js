// NEO SLOT - Complete Game Script
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
        console.log('🎰 NEO SLOT Initialized');
        this.attachEvents();
        this.initChart();
        this.updateUI();
        this.updateStats();
        this.loadSounds();
        // Reset reel positions
        [1, 2, 3].forEach(i => this.updateReelSymbol(i, '🍒'));
    }
    
    attachEvents() {
        const spinBtn = document.getElementById('spinBtn');
        const resetBtn = document.getElementById('resetBtn');
        const soundToggle = document.getElementById('soundToggle');
        const themeToggle = document.getElementById('themeToggle');
        const rtpSlider = document.getElementById('rtpSlider');
        
        if (spinBtn) spinBtn.addEventListener('click', () => this.spin());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (soundToggle) soundToggle.addEventListener('click', () => this.toggleSound());
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());
        if (rtpSlider) rtpSlider.addEventListener('input', (e) => this.updateRTP(e.target.value));
        
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
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`${tab}-tab`);
        if (activeContent) activeContent.classList.add('active');
    }
    
    updateRTP(value) {
        this.rtp = parseInt(value);
        const rtpValue = document.getElementById('rtpValue');
        if (rtpValue) rtpValue.textContent = `${this.rtp}%`;
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
            for (let i = 0; i < count; i++) weightedSymbols.push(symbol);
        });
        const getSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
        return [getSymbol(), getSymbol(), getSymbol()];
    }
    
    calculateWin(result) {
        const [a, b, c] = result;
        const combo = a + b + c;
        if (this.paytable[combo]) return this.betAmount * this.paytable[combo];
        if (a === b || b === c || a === c) return this.betAmount;
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
        
        const reels = [1, 2, 3].map(i => document.getElementById(`reel${i}`));
        reels.forEach(reel => {
            if (reel) reel.classList.add('reel-spinning');
        });
        
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) spinBtn.classList.add('loading');
        this.playSound('spin');
        
        await this.delay(800);
        
        const result = this.getRandomResult();
        const win = this.calculateWin(result);
        
        for (let i = 0; i < reels.length; i++) {
            await this.delay(120);
            if (reels[i]) {
                reels[i].classList.remove('reel-spinning');
                this.updateReelSymbol(i + 1, result[i]);
            }
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
            if (win > this.maxWin) this.maxWin = win;
            this.showToast(`WIN! +${win} credits (${win/this.betAmount}x)`, 'win');
            if (this.totalWins === 1) this.unlockAchievement('firstWin');
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
            const spinBtnDisable = document.getElementById('spinBtn');
            if (spinBtnDisable) spinBtnDisable.disabled = true;
        }
        
        this.isSpinning = false;
        if (spinBtn) spinBtn.classList.remove('loading');
    }
    
    updateReelSymbol(reelNum, symbol) {
        const reel = document.getElementById(`reel${reelNum}`);
        if (!reel) return;
        const container = reel.querySelector('.symbols-container');
        if (!container) return;
        const symbols = container.querySelectorAll('.symbol');
        if (!symbols.length) return;
        
        let targetIndex = 2;
        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i].textContent === symbol) {
                targetIndex = i;
                break;
            }
        }
        container.style.transform = `translateY(-${targetIndex * 180}px)`;
    }
    
    showWinEffect(win) {
        const winDisplay = document.getElementById('winDisplay');
        if (winDisplay) {
            const winAmount = winDisplay.querySelector('.win-amount');
            if (winAmount) winAmount.textContent = `+${win}`;
            winDisplay.classList.add('show');
        }
        for (let i = 0; i < 20; i++) this.createFloatingNumber(win);
        setTimeout(() => {
            if (winDisplay) winDisplay.classList.remove('show');
        }, 1500);
    }
    
    showJackpotEffect() {
        const winDisplay = document.getElementById('winDisplay');
        if (winDisplay) {
            const winAmount = winDisplay.querySelector('.win-amount');
            if (winAmount) winAmount.textContent = 'JACKPOT!';
            winDisplay.classList.add('show');
        }
        for (let i = 0; i < 60; i++) this.createConfetti();
        setTimeout(() => {
            if (winDisplay) winDisplay.classList.remove('show');
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
        if (!container) return;
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
            this.showToast(`🏆 UNLOCKED: ${achievement.querySelector('.achievement-name').textContent}`, 'achievement');
            this.playSound('win');
        }
    }
    
    initChart() {
        const canvas = document.getElementById('bankrollChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
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
                    pointRadius: 0 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true, 
                plugins: { 
                    legend: { labels: { color: '#8b92a8' } } 
                }, 
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b92a8' } }, 
                    x: { ticks: { color: '#8b92a8' } } 
                } 
            }
        });
    }
    
    updateChart() {
        if (!this.chart) return;
        const labels = Array.from({ length: this.balanceHistory.length }, (_, i) => i);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = this.balanceHistory;
        this.chart.update();
    }
    
    updateStats() {
        const winRate = this.totalSpins > 0 ? ((this.totalWins / this.totalSpins) * 100).toFixed(1) : 0;
        const currentRTP = this.totalSpins > 0 ? 
            ((this.balanceHistory[this.balanceHistory.length-1] - 1000 + (this.totalSpins * this.betAmount)) / (this.totalSpins * this.betAmount) * 100).toFixed(1) : 0;
        
        const totalSpinsEl = document.getElementById('totalSpins');
        const winRateEl = document.getElementById('winRate');
        const bestStreakEl = document.getElementById('bestStreak');
        const maxWinEl = document.getElementById('maxWin');
        const totalLossesEl = document.getElementById('totalLosses');
        const currentRTPEl = document.getElementById('currentRTP');
        
        if (totalSpinsEl) totalSpinsEl.textContent = this.totalSpins;
        if (winRateEl) winRateEl.textContent = `${winRate}%`;
        if (bestStreakEl) bestStreakEl.textContent = this.bestStreak;
        if (maxWinEl) maxWinEl.textContent = this.maxWin;
        if (totalLossesEl) totalLossesEl.textContent = this.totalLosses;
        if (currentRTPEl) currentRTPEl.textContent = `${currentRTP}%`;
    }
    
    updateUI() {
        const balanceEl = document.getElementById('balance');
        if (balanceEl) balanceEl.textContent = Math.floor(this.balance).toLocaleString();
        
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            if (this.balance <= 0) spinBtn.disabled = true;
            else spinBtn.disabled = false;
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
        
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) spinBtn.disabled = false;
        
        document.querySelectorAll('.achievement-card').forEach(ach => { 
            ach.classList.add('locked'); 
            ach.classList.remove('unlocked'); 
        });
        
        [1, 2, 3].forEach(i => this.updateReelSymbol(i, '🍒'));
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
        if (btn) {
            const soundIcon = btn.querySelector('.sound-icon');
            if (soundIcon) soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
        }
        this.showToast(this.soundEnabled ? 'Sound ON' : 'Sound OFF', 'info');
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const btn = document.getElementById('themeToggle');
        if (btn) {
            const themeIcon = btn.querySelector('.theme-icon');
            if (themeIcon) themeIcon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        }
    }
    
    delay(ms) { 
        return new Promise(resolve => setTimeout(resolve, ms)); 
    }
}

// START THE GAME - This is the critical part that was missing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded - Starting NEO SLOT...');
    window.game = new NeoSlot();
});
