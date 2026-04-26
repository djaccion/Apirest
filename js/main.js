'use strict';
const Game = (function () {

  // =========================================================
  // --- MÓDULO: CONFIG ---
  // =========================================================
  const CONFIG = {
    canvas: { width: 800, height: 600 },
    ship: {
      startX: 400, startY: 300,
      thrust: 280,
      maxSpeed: 320,
      rotSpeed: 3.2,
      friction: 0.985,
      size: 14,
      invincibleDuration: 2.0
    },
    obstacles: {
      maxActive: 20,
      spawnInterval: 2.0,
      types: {
        comet:    { radius: 8,  hp: 1, points: 150, color: '#88CCFF', speedMin: 180, speedMax: 320 },
        asteroid: { radius: 22, hp: 2, points: 80,  color: '#AA8866', speedMin: 60,  speedMax: 140 },
        planet:   { radius: 38, hp: 4, points: 200, color: '#66AA88', speedMin: 30,  speedMax: 70  },
        ufo:      { radius: 16, hp: 2, points: 300, color: '#FF44FF', speedMin: 90,  speedMax: 180 },
        nebula:   { radius: 30, hp: 1, points: 50,  color: '#4422AA', speedMin: 20,  speedMax: 50  }
      }
    },
    powerups: {
      maxActive: 3,
      spawnInterval: 12.0,
      lifespan: 8.0,
      duration: 7.0,
      radius: 10,
      speed: 40,
      effects: {
        speed:    { multiplier: 1.8 },
        maneuver: { rotMultiplier: 1.6, thrustMultiplier: 1.4 }
      }
    },
    scoring: {
      survivalPointsPerSecond: 5,
      levelUpThreshold: 1000
    },
    levelUp: {
      displayDuration: 2.0,
      spawnIntervalReduction: 0.15,
      minSpawnInterval: 0.5
    },
    stars: {
      count: 120
    }
  };

  // =========================================================
  // --- MÓDULO: GameState ---
  // =========================================================
  const GameState = {
    score: 0,
    level: 1,
    lives: 3,
    running: false,
    paused: false,
    rafId: 0,
    speedMultiplier: 1.0,
    shieldActive: false,
    maneuverActive: false,
    powerupTimers: {
      speed: 0,
      shield: 0,
      maneuver: 0
    },
    _scoreAccumulator: 0,
    _spawnTimer: 0,
    _powerupSpawnTimer: 0,
    _levelUpTimer: 0,
    _nextLevelThreshold: 1000,

    reset: function () {
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.running = false;
      this.paused = false;
      this.rafId = 0;
      this.speedMultiplier = 1.0;
      this.shieldActive = false;
      this.maneuverActive = false;
      this.powerupTimers.speed = 0;
      this.powerupTimers.shield = 0;
      this.powerupTimers.maneuver = 0;
      this._scoreAccumulator = 0;
      this._spawnTimer = 0;
      this._powerupSpawnTimer = 0;
      this._levelUpTimer = 0;
      this._nextLevelThreshold = CONFIG.scoring.levelUpThreshold;
    }
  };

  // =========================================================
  // --- MÓDULO: InputHandler ---
  // =========================================================
  const InputHandler = {
    keys: {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      Space: false,
      KeyP: false,
      Escape: false
    },
    _onKeyDown: null,
    _onKeyUp: null,

    init: function () {
      this._onKeyDown = function (e) {
        if (InputHandler.keys.hasOwnProperty(e.code)) {
          InputHandler.keys[e.code] = true;
          if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
            e.preventDefault();
          }
        }
      };
      this._onKeyUp = function (e) {
        if (InputHandler.keys.hasOwnProperty(e.code)) {
          InputHandler.keys[e.code] = false;
        }
      };
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    },

    destroy: function () {
      if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
      if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
      this._onKeyDown = null;
      this._onKeyUp = null;
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = false;
      this.keys.ArrowUp = false;
      this.keys.ArrowDown = false;
      this.keys.Space = false;
      this.keys.KeyP = false;
      this.keys.Escape = false;
    }
  };

  // =========================================================
  // --- MÓDULO: AudioManager ---
  // =========================================================
  const AudioManager = (function () {
    let ctx = null;

    function getCtx() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          return null;
        }
      }
      return ctx;
    }

    function playTone(frequency, type, duration, gainVal, startDelay) {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(frequency, c.currentTime + (startDelay || 0));
      gain.gain.setValueAtTime(gainVal || 0.15, c.currentTime + (startDelay || 0));
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (startDelay || 0) + duration);
      osc.start(c.currentTime + (startDelay || 0));
      osc.stop(c.currentTime + (startDelay || 0) + duration);
    }

    return {
      playThrust: function () {
        playTone(80, 'sawtooth', 0.08, 0.08);
      },
      playExplosion: function () {
        playTone(120, 'sawtooth', 0.3, 0.2);
        playTone(60, 'square', 0.4, 0.15, 0.05);
      },
      playPowerUp: function () {
        playTone(440, 'sine', 0.1, 0.2);
        playTone(660, 'sine', 0.1, 0.2, 0.1);
        playTone(880, 'sine', 0.15, 0.2, 0.2);
      },
      playLevelUp: function () {
        playTone(330, 'square', 0.1, 0.2);
        playTone(440, 'square', 0.1, 0.2, 0.12);
        playTone(550, 'square', 0.1, 0.2, 0.24);
        playTone(660, 'square', 0.2, 0.2, 0.36);
      },
      playHit: function () {
        playTone(200, 'square', 0.15, 0.25);
        playTone(100, 'sawtooth', 0.2, 0.2, 0.05);
      },
      playGameOver: function () {
        playTone(440, 'square', 0.2, 0.2);
        playTone(330, 'square', 0.2, 0.2, 0.25);
        playTone(220, 'square', 0.2, 0.2, 0.5);
        playTone(110, 'sawtooth', 0.4, 0.2, 0.75);
      }
    };
  })();

  // =========================================================
  // --- MÓDULO: Ship ---
  // =========================================================
  const Ship = {
    x: CONFIG.ship.startX,
    y: CONFIG.ship.startY,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    rotSpeed: CONFIG.ship.rotSpeed,
    thrust: CONFIG.ship.thrust,
    maxSpeed: CONFIG.ship.maxSpeed,
    friction: CONFIG.ship.friction,
    lives: 3,
    invincible: false,
    invincibleTimer: 0,
    size: CONFIG.ship.size,
    _thrustSoundTimer: 0,

    reset: function () {
      this.x = CONFIG.ship.startX;
      this.y = CONFIG.ship.startY;
      this.vx = 0;
      this.vy = 0;
      this.angle = -Math.PI / 2;
      this.rotSpeed = CONFIG.ship.rotSpeed;
      this.thrust = CONFIG.ship.thrust;
      this.maxSpeed = CONFIG.ship.maxSpeed;
      this.friction = CONFIG.ship.friction;
      this.lives = 3;
      this.invincible = false;
      this.invincibleTimer = 0;
      this._thrustSoundTimer = 0;
    },

    update: function (dt) {
      const keys = InputHandler.keys;
      const maneuver = GameState.maneuverActive;
      const currentRotSpeed = maneuver
        ? this.rotSpeed * CONFIG.powerups.effects.maneuver.rotMultiplier
        : this.rotSpeed;
      const currentThrust = maneuver
        ? this.thrust * CONFIG.powerups.effects.maneuver.thrustMultiplier
        : this.thrust;
      const currentMaxSpeed = this.maxSpeed * GameState.speedMultiplier;

      if (keys.ArrowLeft) this.angle -= currentRotSpeed * dt;
      if (keys.ArrowRight) this.angle += currentRotSpeed * dt;

      if (keys.ArrowUp) {
        this.vx += Math.cos(this.angle) * currentThrust * dt;
        this.vy += Math.sin(this.angle) * currentThrust * dt;
        this._thrustSoundTimer -= dt;
        if (this._thrustSoundTimer <= 0) {
          AudioManager.playThrust();
          this._thrustSoundTimer = 0.12;
        }
      } else {
        this._thrustSoundTimer = 0;
      }

      this.vx *= this.friction;
      this.vy *= this.friction;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > currentMaxSpeed) {
        const scale = currentMaxSpeed / speed;
        this.vx *= scale;
        this.vy *= scale;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      if (this.x < -this.size) this.x = w + this.size;
      if (this.x > w + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = h + this.size;
      if (this.y > h + this.size) this.y = -this.size;

      if (this.invincible) {
        this.invincibleTimer -= dt;
        if (this.invincibleTimer <= 0) {
          this.invincible = false;
          this.invincibleTimer = 0;
          const el = document.getElementById('canvas-game');
          if (el) el.classList.remove('is-damaged');
        }
      }
    },

    takeDamage: function () {
      if (this.invincible || GameState.shieldActive) {
        if (GameState.shieldActive) {
          AudioManager.playHit();
        }
        return;
      }
      this.lives--;
      GameState.lives = this.lives;
      AudioManager.playHit();
      this.invincible = true;
      this.invincibleTimer = CONFIG.ship.invincibleDuration;
      const el = document.getElementById('canvas-game');
      if (el) el.classList.add('is-damaged');
      setTimeout(function () {
        const el2 = document.getElementById('canvas-game');
        if (el2) el2.classList.remove('is-damaged');
      }, 500);
    }
  };

  // =========================================================
  // --- MÓDULO: ObstacleManager ---
  // =========================================================
  const ObstacleManager = {
    pool: [],

    _createObstacle: function (type) {
      const cfg = CONFIG.obstacles.types[type];
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);

      if (side === 0) { x = Math.random() * w; y = -cfg.radius; }
      else if (side === 1) { x = w + cfg.radius; y = Math.random() * h; }
      else if (side === 2) { x = Math.random() * w; y = h + cfg.radius; }
      else { x = -cfg.radius; y = Math.random() * h; }

      const targetX = w * 0.2 + Math.random() * w * 0.6;
      const targetY = h * 0.2 + Math.random() * h * 0.6;
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      vx = (dx / dist) * speed;
      vy = (dy / dist) * speed;

      if (type === 'ufo') {
        vx = (Math.random() < 0.5 ? 1 : -1) * speed;
        vy = (Math.random() - 0.5) * speed * 0.5;
      }

      return {
        type: type,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: cfg.radius,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.0,
        hp: cfg.hp,
        points: cfg.points,
        active: true,
        color: cfg.color
      };
    },

    spawn: function () {
      const types = Object.keys(CONFIG.obstacles.types);
      const level = GameState.level;
      const weights = {
        comet:    0.25 + level * 0.02,
        asteroid: 0.30,
        planet:   0.10 + level * 0.01,
        ufo:      0.15 + level * 0.02,
        nebula:   0.20 - level * 0.01
      };
      const totalWeight = types.reduce(function (s, t) { return s + (weights[t] || 0.1); }, 0);
      let rand = Math.random() * totalWeight;
      let chosenType = types[0];
      for (let i = 0; i < types.length; i++) {
        rand -= (weights[types[i]] || 0.1);
        if (rand <= 0) { chosenType = types[i]; break; }
      }

      const activeCount = this.pool.filter(function (o) { return o.active; }).length;
      if (activeCount >= CONFIG.obstacles.maxActive) return;

      const slot = this.pool.findIndex(function (o) { return !o.active; });
      const newObs = this._createObstacle(chosenType);
      if (slot !== -1) {
        this.pool[slot] = newObs;
      } else {
        this.pool.push(newObs);
      }
    },

    update: function (dt) {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      for (let i = 0; i < this.pool.length; i++) {
        const o = this.pool[i];
        if (!o.active) continue;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.rotation += o.rotSpeed * dt;

        if (o.type === 'ufo') {
          o.vy += Math.sin(o.x * 0.02) * 30 * dt;
        }

        const margin = o.radius + 60;
        if (o.x < -margin || o.x > w + margin || o.y < -margin || o.y > h + margin) {
          o.active = false;
        }
      }
    },

    clearAll: function () {
      this.pool = [];
    },

    checkCollisionWithShip: function () {
      for (let i = 0; i < this.pool.length; i++) {
        const o = this.pool[i];
        if (!o.active) continue;
        const dx = o.x - Ship.x;
        const dy = o.y - Ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < o.radius + Ship.size) {
          if (o.type === 'nebula') {
            Ship.takeDamage();
            o.active = false;
          } else {
            Ship.takeDamage();
            o.hp--;
            if (o.hp <= 0) {
              ScoreSystem.addPoints(o.points);
              AudioManager.playExplosion();
              o.active = false;
            }
          }
        }
      }
    }
  };

  // =========================================================
  // --- MÓDULO: PowerUpManager ---
  // =========================================================
  const PowerUpManager = {
    pool: [],

    _createPowerUp: function () {
      const types = ['speed', 'shield', 'maneuver'];
      const type = types[Math.floor(Math.random() * types.length)];
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      const r = CONFIG.powerups.radius;
      if (side === 0) { x = Math.random() * w; y = -r; }
      else if (side === 1) { x = w + r; y = Math.random() * h; }
      else if (side === 2) { x = Math.random() * w; y = h + r; }
      else { x = -r; y = Math.random() * h; }

      const targetX = w * 0.25 + Math.random() * w * 0.5;
      const targetY = h * 0.25 + Math.random() * h * 0.5;
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = CONFIG.powerups.speed;

      return {
        type: type,
        x: x,
        y: y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        radius: r,
        active: true,
        lifeTimer: CONFIG.powerups.lifespan
      };
    },

    spawn: function () {
      const activeCount = this.pool.filter(function (p) { return p.active; }).length;
      if (activeCount >= CONFIG.powerups.maxActive) return;
      const slot = this.pool.findIndex(function (p) { return !p.active; });
      const newPU = this._createPowerUp();
      if (slot !== -1) {
        this.pool[slot] = newPU;
      } else {
        this.pool.push(newPU);
      }
    },

    update: function (dt) {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.lifeTimer -= dt;
        if (p.lifeTimer <= 0) {
          p.active = false;
        }
      }

      const timers = GameState.powerupTimers;
      if (timers.speed > 0) {
        timers.speed -= dt;
        if (timers.speed <= 0) {
          timers.speed = 0;
          GameState.speedMultiplier = 1.0;
          document.getElementById('hud-powerup-speed').classList.remove('is-active');
        }
      }
      if (timers.shield > 0) {
        timers.shield -= dt;
        if (timers.shield <= 0) {
          timers.shield = 0;
          GameState.shieldActive = false;
          document.getElementById('hud-powerup-shield').classList.remove('is-active');
          Ship.invincible = false;
        }
      }
      if (timers.maneuver > 0) {
        timers.maneuver -= dt;
        if (timers.maneuver <= 0) {
          timers.maneuver = 0;
          GameState.maneuverActive = false;
          document.getElementById('hud-powerup-maneuver').classList.remove('is-active');
        }
      }
    },

    checkCollisionWithShip: function () {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;
        const dx = p.x - Ship.x;
        const dy = p.y - Ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.radius + Ship.size) {
          p.active = false;
          AudioManager.playPowerUp();
          this._applyEffect(p.type);
        }
      }
    },

    _applyEffect: function (type) {
      const duration = CONFIG.powerups.duration;
      if (type === 'speed') {
        GameState.speedMultiplier = CONFIG.powerups.effects.speed.multiplier;
        GameState.powerupTimers.speed = duration;
        document.getElementById('hud-powerup-speed').classList.add('is-active');
      } else if (type === 'shield') {
        GameState.shieldActive = true;
        GameState.powerupTimers.shield = duration;
        Ship.invincible = true;
        document.getElementById('hud-powerup-shield').classList.add('is-active');
      } else if (type === 'maneuver') {
        GameState.maneuverActive = true;
        GameState.powerupTimers.maneuver = duration;
        document.getElementById('hud-powerup-maneuver').classList.add('is-active');
      }
    },

    clearAll: function () {
      this.pool = [];
      GameState.speedMultiplier = 1.0;
      GameState.shieldActive = false;
      GameState.maneuverActive = false;
      GameState.powerupTimers.speed = 0;
      GameState.powerupTimers.shield = 0;
      GameState.powerupTimers.maneuver = 0;
      document.getElementById('hud-powerup-speed').classList.remove('is-active');
      document.getElementById('hud-powerup-shield').classList.remove('is-active');
      document.getElementById('hud-powerup-maneuver').classList.remove('is-active');
    }
  };

  // =========================================================
  // --- MÓDULO: ScoreSystem ---
  // =========================================================
  const ScoreSystem = {
    addPoints: function (pts) {
      GameState.score += pts;
      this._checkLevelUp();
      this._updateHUD();
    },

    addSurvivalPoints: function (dt) {
      GameState._scoreAccumulator += CONFIG.scoring.survivalPointsPerSecond * dt;
      if (GameState._scoreAccumulator >= 1) {
        const whole = Math.floor(GameState._scoreAccumulator);
        GameState.score += whole;
        GameState._scoreAccumulator -= whole;
        this._checkLevelUp();
        this._updateHUD();
      }
    },

    _checkLevelUp: function () {
      if (GameState.score >= GameState._nextLevelThreshold) {
        GameState.level++;
        GameState._nextLevelThreshold += CONFIG.scoring.levelUpThreshold * GameState.level;
        AudioManager.playLevelUp();
        this._showLevelUp();
      }
    },

    _showLevelUp: function () {
      const el = document.getElementById('screen-levelup');
      const lvlEl = document.getElementById('text-level-reached-up');
      if (lvlEl) lvlEl.textContent = GameState.level;
      el.classList.remove('hidden');
      setTimeout(function () {
        el.classList.add('hidden');
      }, 2000);
    },

    _updateHUD: function () {
      document.getElementById('hud-score').textContent = GameState.score;
      document.getElementById('hud-level').textContent = GameState.level;
      document.getElementById('hud-lives').textContent = Ship.lives;
    },

    updateHUD: function () {
      this._updateHUD();
    }
  };

  // =========================================================
  // --- MÓDULO: Renderer ---
  // =========================================================
  const Renderer = (function () {
    let canvas = null;
    let ctx = null;
    let stars = [];

    function initStars() {
      stars = [];
      for (let i = 0; i < CONFIG.stars.count; i++) {
        stars.push({
          x: Math.random() * CONFIG.canvas.width,
          y: Math.random() * CONFIG.canvas.height,
          r: Math.random() * 1.5 + 0.3,
          brightness: Math.random()
        });
      }
    }

    function drawBackground() {
      ctx.fillStyle = '#000008';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const alpha = 0.4 + s.brightness * 0.6;
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawShip() {
      if (Ship.invincible && !GameState.shieldActive) {
        if (Math.floor(Date.now() / 80) % 2 === 0) return;
      }

      ctx.save();
      ctx.translate(Ship.x, Ship.y);
      ctx.rotate(Ship.angle);

      if (GameState.shieldActive) {
        ctx.beginPath();
        ctx.arc(0, 0, Ship.size + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,200,255,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        const shieldGrad = ctx.createRadialGradient(0, 0, Ship.size, 0, 0, Ship.size + 8);
        shieldGrad.addColorStop(0, 'rgba(100,200,255,0.0)');
        shieldGrad.addColorStop(1, 'rgba(100,200,255,0.25)');
        ctx.fillStyle = shieldGrad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(Ship.size + 4, 0);
      ctx.lineTo(-Ship.size, -Ship.size * 0.7);
      ctx.lineTo(-Ship.size * 0.5, 0);
      ctx.lineTo(-Ship.size, Ship.size * 0.7);
      ctx.closePath();

      const shipGrad = ctx.createLinearGradient(-Ship.size, 0, Ship.size + 4, 0);
      if (GameState.maneuverActive) {
        shipGrad.addColorStop(0, '#003366');
        shipGrad.addColorStop(1, '#00AAFF');
      } else if (GameState.speedMultiplier > 1.0) {
        shipGrad.addColorStop(0, '#663300');
        shipGrad.addColorStop(1, '#FF6600');
      } else {
        shipGrad.addColorStop(0, '#002244');
        shipGrad.addColorStop(1, '#4488FF');
      }
      ctx.fillStyle = shipGrad;
      ctx.fill();
      ctx.strokeStyle = '#88CCFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (InputHandler.keys.ArrowUp) {
        ctx.beginPath();
        ctx.moveTo(-Ship.size * 0.5, -Ship.size * 0.3);
        ctx.lineTo(-Ship.size - 10 - Math.random() * 8, 0);
        ctx.lineTo(-Ship.size * 0.5, Ship.size * 0.3);
        ctx.closePath();
        ctx.fillStyle = GameState.speedMultiplier > 1.0 ? '#FF8800' : '#FF4400';
        ctx.fill();
      }

      ctx.restore();
    }

    function drawObstacles() {
      for (let i = 0; i < ObstacleManager.pool.length; i++) {
        const o = ObstacleManager.pool[i];
        if (!o.active) continue;
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rotation);

        if (o.type === 'comet') {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, o.radius);
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.4, o.color);
          grad.addColorStop(1, 'rgba(136,204,255,0)');
          ctx.beginPath();
          ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          const speed = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
          const tailLen = Math.min(speed * 0.3, 60);
          const tailAngle = Math.atan2(-o.vy, -o.vx) - o.rotation;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const tailGrad = ctx.createLinearGradient(0, 0, Math.cos(tailAngle) * tailLen, Math.sin(tailAngle) * tailLen);
          tailGrad.addColorStop(0, 'rgba(136,204,255,0.6)');
          tailGrad.addColorStop(1, 'rgba(136,204,255,0)');
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = o.radius * 0.8;
          ctx.lineCap = 'round';
          ctx.lineTo(Math.cos(tailAngle) * tailLen, Math.sin(tailAngle) * tailLen);
          ctx.stroke();

        } else if (o.type === 'asteroid') {
          ctx.beginPath();
          const points = 8;
          for (let j = 0; j < points; j++) {
            const ang = (j / points) * Math.PI * 2;
            const jitter = o.radius * (0.75 + ((j * 7 + 3) % 5) * 0.07);
            const px = Math.cos(ang) * jitter;
            const py = Math.sin(ang) * jitter;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = o.color;
          ctx.fill();
          ctx.strokeStyle = '#CCAA88';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-o.radius * 0.25, -o.radius * 0.2, o.radius * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fill();

        } else if (o.type === 'planet') {
          const grad = ctx.createRadialGradient(-o.radius * 0.3, -o.radius * 0.3, 0, 0, 0, o.radius);
          grad.addColorStop(0, '#AAFFCC');
          grad.addColorStop(0.5, o.color);
          grad.addColorStop(1, '#112233');
          ctx.beginPath();
          ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = '#88BBAA';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, 0, o.radius * 1.5, o.radius * 0.35, Math.PI * 0.2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(150,220,180,0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();

        } else if (o.type === 'ufo') {
          ctx.beginPath();
          ctx.ellipse(0, 0, o.radius, o.radius * 0.4, 0, 0, Math.PI * 2);
          const ufoGrad = ctx.createRadialGradient(0, -o.radius * 0.1, 0, 0, 0, o.radius);
          ufoGrad.addColorStop(0, '#FF88FF');
          ufoGrad.addColorStop(1, '#880088');
          ctx.fillStyle = ufoGrad;
          ctx.fill();
          ctx.strokeStyle = '#FF44FF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, -o.radius * 0.3, o.radius * 0.5, o.radius * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200,255,200,0.6)';
          ctx.fill();
          for (let j = 0; j < 5; j++) {
            const lx = -o.radius * 0.8 + j * o.radius * 0.4;
            ctx.beginPath();
            ctx.arc(lx, o.radius * 0.1, 2, 0, Math.PI * 2);
            ctx.fillStyle = Math.floor(Date.now() / 200 + j) % 2 === 0 ? '#FFFF00' : '#FF4400';
            ctx.fill();
          }

        } else if (o.type === 'nebula') {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, o.radius);
          grad.addColorStop(0, 'rgba(80,50,200,0.55)');
          grad.addColorStop(0.5, 'rgba(68,34,170,0.35)');
          grad.addColorStop(1, 'rgba(40,10,100,0)');
          ctx.beginPath();
          ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          for (let j = 0; j < 3; j++) {
            const ox = (j - 1) * o.radius * 0.4;
            const oy = Math.sin(j * 2.1) * o.radius * 0.3;
            const sg = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.radius * 0.5);
            sg.addColorStop(0, 'rgba(120,80,255,0.3)');
            sg.addColorStop(1, 'rgba(120,80,255,0)');
            ctx.beginPath();
            ctx.arc(ox, oy, o.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = sg;
            ctx.fill();
          }
        }

        ctx.restore();
      }
    }

    function drawPowerUps() {
      const now = Date.now();
      for (let i = 0; i < PowerUpManager.pool.length; i++) {
        const p = PowerUpManager.pool[i];
        if (!p.active) continue;
        ctx.save();
        ctx.translate(p.x, p.y);

        const pulse = 0.8 + 0.2 * Math.sin(now * 0.005);
        const r = p.radius * pulse;

        let color1, color2, symbol;
        if (p.type === 'speed') {
          color1 = '#FF8800'; color2 = '#FFCC00'; symbol = '▶';
        } else if (p.type === 'shield') {
          color1 = '#0088FF'; color2 = '#00CCFF'; symbol = '◈';
        } else {
          color1 = '#00FF88'; color2 = '#AAFFCC'; symbol = '✦';
        }

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 4);
        grad.addColorStop(0, color2);
        grad.addColorStop(0.6, color1);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = color2;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + (r * 1.2) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 0);

        if (p.lifeTimer < 3.0) {
          const alpha = (Math.floor(now / 150) % 2 === 0) ? 0.9 : 0.2;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        ctx.restore();
      }
    }

    function drawHUD() {
      ScoreSystem.updateHUD();
    }

    function drawPauseOverlay() {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.fillStyle = '#00FFCC';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
      ctx.font = '20px monospace';
      ctx.fillStyle = '#88FFEE';
      ctx.fillText('Press P or ESC to resume', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 50);
    }

    return {
      init: function () {
        canvas = document.getElementById('canvas-game');
        ctx = canvas.getContext('2d');
        canvas.width = CONFIG.canvas.width;
        canvas.height = CONFIG.canvas.height;
        initStars();
      },

      frame: function () {
        drawBackground();
        drawObstacles();
        drawPowerUps();
        drawShip();
        drawHUD();
        if (GameState.paused) drawPauseOverlay();
      },

      getCtx: function () { return ctx; },
      getCanvas: function () { return canvas; }
    };
  })();

  // =========================================================
  // --- MÓDULO: GameEngine ---
  // =========================================================
  const GameEngine = {
    _lastTime: 0,
    _pauseKeyHeld: false,

    _loop: function (timestamp) {
      if (!GameState.running) return;

      const dt = Math.min((timestamp - GameEngine._lastTime) / 1000, 0.05);
      GameEngine._lastTime = timestamp;

      if (!GameState.paused) {
        GameEngine._update(dt);
      }

      Renderer.frame();
      GameState.rafId = requestAnimationFrame(GameEngine._loop);
    },

    _update: function (dt) {
      const keys = InputHandler.keys;

      if ((keys.KeyP || keys.Escape) && !GameEngine._pauseKeyHeld) {
        GameEngine._pauseKeyHeld = true;
        GameEngine.togglePause();
        return;
      }
      if (!keys.KeyP && !keys.Escape) {
        GameEngine._pauseKeyHeld = false;
      }

      Ship.update(dt);

      GameState._spawnTimer += dt;
      const currentInterval = Math.max(
        CONFIG.levelUp.minSpawnInterval,
        CONFIG.obstacles.spawnInterval - (GameState.level - 1) * CONFIG.levelUp.spawnIntervalReduction
      );
      if (GameState._spawnTimer >= currentInterval) {
        GameState._spawnTimer = 0;
        ObstacleManager.spawn();
      }

      GameState._powerupSpawnTimer += dt;
      if (GameState._powerupSpawnTimer >= CONFIG.powerups.spawnInterval) {
        GameState._powerupSpawnTimer = 0;
        PowerUpManager.spawn();
      }

      ObstacleManager.update(dt);
      PowerUpManager.update(dt);

      ObstacleManager.checkCollisionWithShip();
      PowerUpManager.checkCollisionWithShip();

      ScoreSystem.addSurvivalPoints(dt);

      if (Ship.lives <= 0) {
        GameEngine.triggerGameOver();
      }
    },

    togglePause: function () {
      GameState.paused = !GameState.paused;
      const screenGame = document.getElementById('screen-game');
      if (GameState.paused) {
        screenGame.classList.add('is-paused');
      } else {
        screenGame.classList.remove('is-paused');
        GameEngine._lastTime = performance.now();
      }
    },

    startGame: function () {
      GameState.reset();
      Ship.reset();
      ObstacleManager.clearAll();
      PowerUpManager.clearAll();

      document.getElementById('screen-menu').classList.add('hidden');
      document.getElementById('screen-gameover').classList.add('hidden');
      document.getElementById('screen-levelup').classList.add('hidden');
      document.getElementById('screen-game').classList.remove('hidden');
      document.getElementById('hud').classList.remove('hidden');
      document.getElementById('screen-game').classList.remove('is-paused');

      ScoreSystem.updateHUD();
      InputHandler.init();

      GameState.running = true;
      GameState.paused = false;
      GameEngine._lastTime = performance.now();
      GameState.rafId = requestAnimationFrame(GameEngine._loop);
    },

    triggerGameOver: function () {
      GameState.running = false;
      cancelAnimationFrame(GameState.rafId);
      InputHandler.destroy();

      document.getElementById('screen-game').classList.add('hidden');
      document.getElementById('hud').classList.add('hidden');
      document.getElementById('text-final-score').textContent = GameState.score;
      document.getElementById('text-level-reached').textContent = GameState.level;
      document.getElementById('screen-gameover').classList.remove('hidden');

      AudioManager.playGameOver();
    },

    restartGame: function () {
      document.getElementById('screen-gameover').classList.add('hidden');
      GameEngine.startGame();
    }
  };

  // =========================================================
  // --- INIT PÚBLICO ---
  // =========================================================
  function init() {
    Renderer.init();

    document.getElementById('screen-menu').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('hidden');
    document.getElementById('screen-gameover').classList.add('hidden');
    document.getElementById('screen-levelup').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');

    document.getElementById('btn-start').addEventListener('click', function () {
      GameEngine.startGame();
    });

    document.getElementById('btn-restart').addEventListener('click', function () {
      GameEngine.restartGame();
    });

    document.getElementById('btn-pause').addEventListener('click', function () {
      if (GameState.running) {
        GameEngine.togglePause();
      }
    });
  }

  return { init: init };
})();

window.addEventListener('load', Game.init);