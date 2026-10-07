/**
 * NEON PULSE - Cosmic Dodge & Energy Harvest
 * Full standalone Arcade game using HTML5 Canvas & Web Audio API
 */

// Sound Engine using Web Audio API
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    playCollect(freq = 520) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.12);
            
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch(e){}
    }

    playPowerup() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            osc.frequency.linearRampToValueAtTime(900, now + 0.25);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } catch(e){}
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } catch(e){}
    }

    playExplosion() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            // Noise burst simulation
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
            
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.5);
        } catch(e){}
    }
}

const sounds = new SoundEngine();

// Main Game Controller
class NeonPulseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Screens & UI
        this.hud = document.getElementById('hud');
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        
        // HUD values
        this.scoreValueEl = document.getElementById('scoreValue');
        this.multiplierValueEl = document.getElementById('multiplierValue');
        this.highScoreValueEl = document.getElementById('highScoreValue');
        this.energyFillEl = document.getElementById('energyFill');
        this.powerupStatusEl = document.getElementById('powerupStatus');
        
        // Game state
        this.state = 'START'; // START, PLAYING, PAUSED, GAMEOVER
        this.controlMode = 'mouse'; // 'mouse' or 'keyboard'
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neonpulse_highscore') || '0', 10);
        this.multiplier = 1;
        this.maxMultiplier = 1;
        this.orbsCollectedCount = 0;
        this.shieldEnergy = 100;
        
        // Mouse / Input tracking
        this.mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.keys = {};
        
        // Game entities
        this.player = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: 16,
            targetX: window.innerWidth / 2,
            targetY: window.innerHeight / 2,
            vx: 0,
            vy: 0,
            speed: 7,
            shieldActive: false,
            shieldTimer: 0,
            magnetActive: false,
            magnetTimer: 0,
            empActive: false,
            empTimer: 0
        };
        
        this.orbs = [];
        this.hazards = [];
        this.powerups = [];
        this.particles = [];
        this.stars = [];
        this.floatingTexts = [];
        
        this.spawnTimers = {
            orb: 0,
            hazard: 0,
            powerup: 0
        };
        
        this.lastTime = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupControls();
        this.initStarfield();
        this.updateHUD();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initStarfield() {
        this.stars = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 4000);
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.8 + 0.2,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }

    setupControls() {
        // Control Mode Toggle
        const btnMouse = document.getElementById('btnControlMouse');
        const btnKey = document.getElementById('btnControlKey');
        
        btnMouse.addEventListener('click', () => {
            this.controlMode = 'mouse';
            btnMouse.classList.add('active');
            btnKey.classList.remove('active');
            btnMouse.setAttribute('aria-pressed', 'true');
            btnKey.setAttribute('aria-pressed', 'false');
        });

        btnKey.addEventListener('click', () => {
            this.controlMode = 'keyboard';
            btnKey.classList.add('active');
            btnMouse.classList.remove('active');
            btnKey.setAttribute('aria-pressed', 'true');
            btnMouse.setAttribute('aria-pressed', 'false');
        });

        // Sound Toggle
        const btnSound = document.getElementById('btnSoundToggle');
        btnSound.addEventListener('click', () => {
            sounds.muted = !sounds.muted;
            btnSound.innerText = sounds.muted ? 'Sound: off' : 'Sound: on';
            btnSound.setAttribute('aria-label', sounds.muted ? 'Turn sound on' : 'Turn sound off');
        });

        // Start / Pause / Restart buttons
        document.getElementById('btnStart').addEventListener('click', () => {
            sounds.init();
            this.startGame();
        });
        document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btnRestartPause').addEventListener('click', () => this.startGame());
        document.getElementById('btnPlayAgain').addEventListener('click', () => this.startGame());

        // Mouse & Touch events
        window.addEventListener('mousemove', (e) => {
            if (this.controlMode === 'mouse') {
                this.mousePos.x = e.clientX;
                this.mousePos.y = e.clientY;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mousePos.x = e.touches[0].clientX;
                this.mousePos.y = e.touches[0].clientY;
            }
        }, { passive: true });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'PLAYING') this.pauseGame();
                else if (this.state === 'PAUSED') this.resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.multiplier = 1;
        this.maxMultiplier = 1;
        this.orbsCollectedCount = 0;
        this.shieldEnergy = 100;
        
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.targetX = this.player.x;
        this.player.targetY = this.player.y;
        this.player.shieldActive = false;
        this.player.magnetActive = false;
        this.player.empActive = false;
        
        this.orbs = [];
        this.hazards = [];
        this.powerups = [];
        this.particles = [];
        this.floatingTexts = [];
        
        this.spawnTimers = { orb: 0, hazard: 0, powerup: 0 };

        // Hide screens & show HUD
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');

        this.updateHUD();
        sounds.playPowerup();
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.pauseScreen.classList.add('hidden');
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        sounds.playExplosion();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonpulse_highscore', this.highScore.toString());
        }

        document.getElementById('finalScore').innerText = Math.floor(this.score);
        document.getElementById('bestScore').innerText = Math.floor(this.highScore);
        document.getElementById('orbsCollected').innerText = this.orbsCollectedCount;
        document.getElementById('maxMultiplier').innerText = `x${this.maxMultiplier}`;

        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
    }

    // Main Loop
    gameLoop(time) {
        const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.1);
        this.lastTime = time;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // Update state
    update(dt) {
        // Always scroll starfield
        this.updateStarfield(dt);

        if (this.state !== 'PLAYING') return;

        // Player movement logic
        if (this.controlMode === 'mouse') {
            this.player.x += (this.mousePos.x - this.player.x) * 0.15;
            this.player.y += (this.mousePos.y - this.player.y) * 0.15;
        } else {
            let dx = 0;
            let dy = 0;
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
            if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            this.player.x += dx * this.player.speed * 60 * dt;
            this.player.y += dy * this.player.speed * 60 * dt;

            // Clamp to screen bounds
            this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
            this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));
        }

        // Spawn particle trail behind player
        if (Math.random() < 0.7) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 10,
                y: this.player.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                radius: Math.random() * 3 + 1,
                color: '#00f0ff',
                alpha: 0.8,
                life: 0.4
            });
        }

        // Powerup Timers
        if (this.player.shieldActive) {
            this.player.shieldTimer -= dt;
            if (this.player.shieldTimer <= 0) this.player.shieldActive = false;
        }
        if (this.player.magnetActive) {
            this.player.magnetTimer -= dt;
            if (this.player.magnetTimer <= 0) this.player.magnetActive = false;
        }
        if (this.player.empActive) {
            this.player.empTimer -= dt;
            if (this.player.empTimer <= 0) this.player.empActive = false;
        }

        // Spawning Entities
        this.spawnEntities(dt);

        // Update Orbs
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            orb.x += orb.vx * dt;
            orb.y += orb.vy * dt;
            orb.life -= dt;

            // Magnet effect
            if (this.player.magnetActive) {
                const dx = this.player.x - orb.x;
                const dy = this.player.y - orb.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 280) {
                    orb.x += (dx / dist) * 220 * dt;
                    orb.y += (dy / dist) * 220 * dt;
                }
            }

            // Check collision with player
            const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
            if (dist < this.player.radius + orb.radius) {
                this.collectOrb(orb);
                this.orbs.splice(i, 1);
                continue;
            }

            if (orb.life <= 0) {
                this.orbs.splice(i, 1);
            }
        }

        // Update Hazards
        const speedMult = this.player.empActive ? 0.3 : 1.0;
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const h = this.hazards[i];
            h.x += h.vx * speedMult * dt;
            h.y += h.vy * speedMult * dt;
            h.pulse += dt * 4;

            // Screen wrap or bounce
            if (h.x < -40 || h.x > this.canvas.width + 40 || h.y < -40 || h.y > this.canvas.height + 40) {
                this.hazards.splice(i, 1);
                continue;
            }

            // Collision check
            const dist = Math.hypot(this.player.x - h.x, this.player.y - h.y);
            if (dist < this.player.radius + h.radius) {
                if (this.player.shieldActive) {
                    // Shield absorbs hit!
                    this.createExplosion(h.x, h.y, '#ff007f', 15);
                    sounds.playHit();
                    this.hazards.splice(i, 1);
                    this.addFloatingText(h.x, h.y, 'SHIELD ABSORB!', '#ff007f');
                } else {
                    // Damage player
                    this.shieldEnergy -= 35;
                    this.multiplier = 1; // Reset multiplier on hit
                    sounds.playHit();
                    this.createExplosion(h.x, h.y, '#ff2a5f', 25);
                    this.hazards.splice(i, 1);
                    this.addFloatingText(h.x, h.y, '-35 ENERGY', '#ff2a5f');

                    if (this.shieldEnergy <= 0) {
                        this.shieldEnergy = 0;
                        this.triggerGameOver();
                        break;
                    }
                }
            }
        }

        // Update Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += 30 * dt;
            p.life -= dt;

            const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
            if (dist < this.player.radius + p.radius) {
                this.activatePowerup(p.type);
                this.createExplosion(p.x, p.y, '#ffb703', 20);
                sounds.playPowerup();
                this.powerups.splice(i, 1);
                continue;
            }

            if (p.life <= 0) this.powerups.splice(i, 1);
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= dt / p.life;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 30 * dt;
            ft.alpha -= dt * 1.2;
            if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
        }

        // Passive score gain
        this.score += 5 * dt * this.multiplier;
        this.updateHUD();
    }

    spawnEntities(dt) {
        // Spawn Orbs
        this.spawnTimers.orb += dt;
        if (this.spawnTimers.orb > 0.6) {
            this.spawnTimers.orb = 0;
            const r = Math.random();
            let type = 'green';
            let pts = 10;
            let color = '#00ff88';
            if (r > 0.85) { type = 'gold'; pts = 50; color = '#ffb703'; }
            else if (r > 0.6) { type = 'cyan'; pts = 25; color = '#00f0ff'; }

            this.orbs.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: Math.random() * (this.canvas.height - 60) + 30,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                radius: type === 'gold' ? 12 : 9,
                color: color,
                pts: pts,
                type: type,
                life: 8
            });
        }

        // Spawn Hazards
        this.spawnTimers.hazard += dt;
        const hazardRate = Math.max(0.4, 1.4 - Math.floor(this.score / 200) * 0.15);
        if (this.spawnTimers.hazard > hazardRate) {
            this.spawnTimers.hazard = 0;
            
            // Spawn outside edge moving inward
            let x, y;
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { x = Math.random() * this.canvas.width; y = -20; }
            else if (side === 1) { x = this.canvas.width + 20; y = Math.random() * this.canvas.height; }
            else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + 20; }
            else { x = -20; y = Math.random() * this.canvas.height; }

            const angle = Math.atan2(this.player.y - y, this.player.x - x) + (Math.random() - 0.5) * 0.5;
            const speed = 120 + Math.random() * 100 + Math.min(200, this.score * 0.05);

            this.hazards.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 14 + Math.random() * 6,
                pulse: 0
            });
        }

        // Spawn Powerups
        this.spawnTimers.powerup += dt;
        if (this.spawnTimers.powerup > 12) {
            this.spawnTimers.powerup = 0;
            const types = ['shield', 'magnet', 'emp', 'nova'];
            const chosenType = types[Math.floor(Math.random() * types.length)];
            
            this.powerups.push({
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: -20,
                radius: 16,
                type: chosenType,
                life: 10
            });
        }
    }

    collectOrb(orb) {
        const addedScore = orb.pts * this.multiplier;
        this.score += addedScore;
        this.orbsCollectedCount++;
        
        // Multiplier progression
        if (this.orbsCollectedCount % 5 === 0) {
            this.multiplier = Math.min(10, this.multiplier + 1);
            if (this.multiplier > this.maxMultiplier) this.maxMultiplier = this.multiplier;
            this.addFloatingText(this.player.x, this.player.y - 20, `MULTIPLIER x${this.multiplier}!`, '#00f0ff');
        }

        // Recharge small energy
        this.shieldEnergy = Math.min(100, this.shieldEnergy + 2);

        sounds.playCollect(orb.type === 'gold' ? 880 : orb.type === 'cyan' ? 660 : 520);
        this.createExplosion(orb.x, orb.y, orb.color, 10);
        this.addFloatingText(orb.x, orb.y, `+${addedScore}`, orb.color);
    }

    activatePowerup(type) {
        if (type === 'shield') {
            this.player.shieldActive = true;
            this.player.shieldTimer = 8;
            this.addFloatingText(this.player.x, this.player.y - 20, 'SHIELD ACTIVE! 🛡️', '#00f0ff');
        } else if (type === 'magnet') {
            this.player.magnetActive = true;
            this.player.magnetTimer = 8;
            this.addFloatingText(this.player.x, this.player.y - 20, 'MAGNET PULSE! 🧲', '#ffb703');
        } else if (type === 'emp') {
            this.player.empActive = true;
            this.player.empTimer = 6;
            this.addFloatingText(this.player.x, this.player.y - 20, 'TIME SLOWDOWN! ⚡', '#7000ff');
        } else if (type === 'nova') {
            // Nova clears all hazards
            for (const h of this.hazards) {
                this.createExplosion(h.x, h.y, '#ff007f', 15);
            }
            this.hazards = [];
            this.addFloatingText(this.player.x, this.player.y - 20, 'HYPER NOVA BOMB! 💥', '#ff007f');
        }
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 1,
                color: color,
                alpha: 1,
                life: Math.random() * 0.4 + 0.3
            });
        }
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1
        });
    }

    updateStarfield(dt) {
        for (const star of this.stars) {
            star.y += star.speed * 60 * dt;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }

    updateHUD() {
        this.scoreValueEl.innerText = Math.floor(this.score);
        this.multiplierValueEl.innerText = `x${this.multiplier}`;
        this.highScoreValueEl.innerText = Math.floor(this.highScore);
        this.energyFillEl.style.width = `${Math.max(0, this.shieldEnergy)}%`;

        // Update active powerup icons indicator
        let statusHTML = '';
        if (this.player.shieldActive) statusHTML += '<span title="Shield">🛡️</span>';
        if (this.player.magnetActive) statusHTML += '<span title="Magnet">🧲</span>';
        if (this.player.empActive) statusHTML += '<span title="Time Slow">⚡</span>';
        this.powerupStatusEl.innerHTML = statusHTML;
    }

    // Canvas Rendering
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render Starfield
        for (const star of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Render Particles
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            // Render Orbs
            for (const orb of this.orbs) {
                this.ctx.save();
                this.ctx.fillStyle = orb.color;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = orb.color;
                this.ctx.beginPath();
                this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            // Render Hazards
            for (const h of this.hazards) {
                this.ctx.save();
                this.ctx.fillStyle = '#ff2a5f';
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ff2a5f';
                
                // Pulsing hazard shape
                const currentRadius = h.radius + Math.sin(h.pulse) * 2;
                this.ctx.beginPath();
                this.ctx.arc(h.x, h.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fill();

                // Inner core
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(h.x, h.y, currentRadius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            // Render Powerups
            for (const p of this.powerups) {
                this.ctx.save();
                this.ctx.fillStyle = '#ffb703';
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ffb703';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.font = '14px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const icon = p.type === 'shield' ? '🛡️' : p.type === 'magnet' ? '🧲' : p.type === 'emp' ? '⚡' : '💥';
                this.ctx.fillText(icon, p.x, p.y);
                this.ctx.restore();
            }

            // Render Player Ship
            this.ctx.save();
            // Shield aura if active
            if (this.player.shieldActive) {
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, this.player.radius + 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Ship Body (Glowing Neon Orb/Ship)
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner Ring Accent
            this.ctx.strokeStyle = '#00f0ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Render Floating Texts
        for (const ft of this.floatingTexts) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.font = 'bold 15px Orbitron, sans-serif';
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = ft.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
    new NeonPulseGame();
});
