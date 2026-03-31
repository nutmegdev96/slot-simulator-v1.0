class NeoSlotSimulator {
    constructor() {
        this.balance = 1000;
        this.betAmount = 50;
        this.history = [];
        this.totalSpins = 0;
        this.totalWins = 0;
        this.totalLosses = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.maxWin = 0;
        this.balanceHistory = [1000];
        this.achievements = new Set();
        this.soundEnabled = true;
        this.rtp = 96;
        
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
        this.updateUI();
        this.attachEvents();
        this.initChart();
        this.initParticles();
        this.loadSoundEffects();
        this.updateStats();
    }
    
    attachEvents() {
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('darkModeBtn').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('rtpSlider').addEventListener('input', (e) => this.updateRTP(e.target.value));
        
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.betAmount = parseInt(btn.dataset.bet);
                this.updateUI();
            });
        });
    }
    
    updateRTP(value) {
        this.rtp = parseInt(value);
        document.getElementById('rtpDisplay').textContent = `${this.rtp}%`;
    }
    
    getRandomResult() {
        // RTP-based probability
        const rtpFactor = this.rtp / 96;
        const weightedSymbols = [];
        
        // Adjust probabilities based on RTP
        const baseProbabilities = {
            '🍒': 45,
            '🍊': 36,
            '🍋': 18,
            '💎': 9,
            '7️⃣': 4.5
        };
        
        Object.entries(baseProbabilities).forEach(([symbol, prob]) => {
            let adjustedProb = prob * rtpFactor;
            if (symbol === '7️⃣' && this.rtp < 85) adjustedProb *= 0.7;
            if (symbol === '🍒' && this.rtp > 90) adjustedProb *= 1.2;
            
            const count = Math.max(1, Math.floor(adjustedProb));
            for (let i = 0; i < count; i++) {
                weightedSymbols.push(symbol);
            }
        });
        
        const getRandomSymbol = () => weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
        return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    }
    
    calculateWin(result) {
        const [a, b, c] = result;
        const combination = a + b + c;
        
        if (this.paytable[combination]) {
            return this.betAmount * this.paytable[combination];
        }
        
        if (a === b || b === c || a === c) {
            return this.betAmount;
        }
        
        return 0;
    }
    
    async spin() {
        if (this.balance < this.betAmount) {
            this.showMessage('❌ Crediti insufficienti! Premi RESET', 'error');
            return;
        }
        
        this.balance -= this.betAmount;
        this.updateUI();
        
        // Animation
        const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
        reels.forEach(reel => reel.classList.add('spinning'));
        
        this.playSound('spin');
        this.createParticleExplosion();
        
        // Simulate spin
        await this.delay(300);
        
        const result = this.getRandomResult();
        this.displayResult(result);
        const win = this.calculateWin(result);
        
        if (win > 0) {
            this.balance += win;
            this.totalWins++;
            this.currentStreak++;
            if (win >= this.betAmount * 50) {
                this.playSound('jackpot');
                this.showJackpotEffect();
                this.unlockAchievement('jackpot');
            } else {
                this.playSound('win');
                this.showWinEffect(win);
            }
            
            if (win > this.maxWin) {
                this.maxWin = win;
                document.getElementById('maxWin').textContent = win;
            }
            
            this.showMessage(`🎉 VINTO! +${win} crediti (x${win/this.betAmount}) 🎉`, 'win');
        } else {
            this.totalLosses++;
            this.currentStreak = 0;
            this.playSound('lose');
            this.showMessage(`😢 Perso! -${this.betAmount} crediti`, 'loss');
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
        
        reels.forEach(reel => reel.classList.remove('spinning'));
        
        if (this.balance <= 0) {
            this.showMessage('💀 GAME OVER! Premi RESET', 'error');
            document.getElementById('spinBtn').disabled = true;
        }
        
        // Check achievements
        if (this.totalSpins >= 100) this.unlockAchievement('grinder');
        if (this.balance >= 5000) this.unlockAchievement('millionaire');
        if (this.betAmount === 250) this.unlockAchievement('highRoller');
    }
    
    displayResult(result) {
        const reels = ['reel1', 'reel2', 'reel3'];
        reels.forEach((id, index) => {
            const reel = document.getElementById(id);
            reel.querySelector('.reel-inner').textContent = result[index];
        });
    }
    
    showWinEffect(win) {
        const container = document.querySelector('.container');
        container.classList.add('win-flash');
        setTimeout(() => container.classList.remove('win-flash'), 500);
        
        // Create floating numbers
        for (let i = 0; i < 10; i++) {
            const floatNum = document.createElement('div');
            floatNum.textContent = `+${Math.floor(win/10)}`;
            floatNum.style.position = 'fixed';
            floatNum.style.left = Math.random() * window.innerWidth + 'px';
            floatNum.style.top = window.innerHeight / 2 + 'px';
            floatNum.style.color = '#00ff9d';
            floatNum.style.fontSize = Math.random() * 20 + 20 + 'px';
            floatNum.style.fontWeight = 'bold';
            floatNum.style.pointerEvents = 'none';
            floatNum.style.zIndex = '1000';
            floatNum.style.animation = `floatUp ${Math.random() * 1 + 1}s ease-out forwards`;
            document.body.appendChild(floatNum);
            
            setTimeout(() => floatNum.remove(), 1000);
        }
    }
    
    showJackpotEffect() {
        const container = document.querySelector('.slot-container');
        container.classList.add('jackpot');
        setTimeout(() => container.classList.remove('jackpot'), 500);
        
        // Create confetti effect
        for (let i = 0; i < 50; i++) {
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
    }
    
    updateStats() {
        const winRate = this.totalSpins > 0 ? ((this.totalWins / this.totalSpins) * 100).toFixed(1) : 0;
        const currentRTP = this.totalSpins > 0 ? 
            ((this.balanceHistory[this.balanceHistory.length-1] - 1000 + (this.totalSpins * this.betAmount)) / (this.totalSpins * this.betAmount) * 100).toFixed(1) : 0;
        
        document.getElementById('totalSpins').textContent = this.totalSpins;
        document.getElementById('totalWins').textContent = this.totalWins;
        document.getElementById('totalLosses').textContent = this.totalLosses;
        document.getElementById('winRate').textContent = `${winRate}%`;
        document.getElementById('bestStreak').textContent = this.bestStreak;
        document.getElementById('currentRTP').textContent = `${currentRTP}%`;
    }
    
    unlockAchievement(achievementId) {
        if (this.achievements.has(achievementId)) return;
        
        this.achievements.add(achievementId);
        const achievementElement = document.querySelector(`[data-achievement="${achievementId}"]`);
        if (achievementElement) {
            achievementElement.classList.remove('locked');
            achievementElement.classList.add('unlocked');
            this.showMessage(`🏆 ACHIEVEMENT SBLoccATO: ${achievementElement.querySelector('.achievement-name').textContent} 🏆`, 'win');
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
                    borderColor: '#00ff9d',
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }
    
    updateChart() {
        const labels = Array.from({length: this.balanceHistory.length}, (_, i) => i);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = this.balanceHistory;
        this.chart.update();
    }
    
    initParticles() {
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.createParticle();
            }
        }, 500);
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = Math.random() * window.innerHeight + 'px';
        document.getElementById('particles').appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }
    
    createParticleExplosion() {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => this.createParticle(), i * 50);
        }
    }
    
    loadSoundEffects() {
        // Create Audio objects (using Web Audio API for beep sounds since external files aren't guaranteed)
        this.sounds = {
            spin: this.createBeepSound(440, 0.1),
            win: this.createBeepSound(880, 0.2),
            lose: this.createBeepSound(220, 0.3),
            jackpot: this.createBeepSound(1760, 0.5)
        };
    }
    
    createBeepSound(frequency, duration) {
        return () => {
            if (!this.soundEnabled) return;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
            oscillator.stop(audioContext.currentTime + duration);
            
            setTimeout(() => audioContext.close(), duration * 1000);
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundToggle');
        btn.textContent = this.soundEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
        this.showMessage(this.soundEnabled ? '🔊 Audio attivato' : '🔇 Audio disattivato', 'info');
    }
    
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const btn = document.getElementById('darkModeBtn');
        btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ LIGHT MODE' : '🌙 DARK MODE';
    }
    
    showMessage(msg, type) {
        const messageDiv = document.getElementById('messageArea');
        messageDiv.innerHTML = `<div class="message-content">${msg}</div>`;
        
        const colors = {
            win: '#00ff9d',
            loss: '#ff006e',
            error: '#ff006e',
            info: '#00ff9d'
        };
        
        messageDiv.querySelector('.message-content').style.borderLeftColor = colors[type] || '#00ff9d';
        
        setTimeout(() => {
            if (messageDiv.innerHTML.includes(msg)) {
                messageDiv.innerHTML = '<div class="message-content">🎮 Pronto a giocare?</div>';
            }
        }, 3000);
    }
    
    updateUI() {
        document.getElementById('balance').textContent = Math.floor(this.balance);
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
        this.showMessage('🔄 Partita resettata! Buona fortuna!', 'win');
        document.getElementById('spinBtn').disabled = false;
        document.getElementById('maxWin').textContent = '0';
        
        // Reset achievements UI
        document.querySelectorAll('.achievement').forEach(ach => {
            ach.classList.add('locked');
            ach.classList.remove('unlocked');
        });
        
        const reels = ['reel1', 'reel2', 'reel3'];
        reels.forEach(id => {
            document.getElementById(id).querySelector('.reel-inner').textContent = '🍒';
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(-100px);
            opacity: 0;
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Start the game
new NeoSlotSimulator();
