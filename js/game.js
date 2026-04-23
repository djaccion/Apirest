// ============================================================
// PROYEC-21 | js/game.js
// Juego Arcade de Naves Espaciales — Monolito con Namespacing
// ============================================================

// --- [1] NAMESPACE RAÍZ ---
var Game = {};

// --- [2] CONSTANTES DE CONFIGURACIÓN ---
var CONFIG = {
  CANVAS_WIDTH:        800,
  CANVAS_HEIGHT:       600,
  SHIP_SPEED:          4,
  SHIP_MAX_SPEED:      7,
  SHIP_FRICTION:       0.97,
  SHIP_ROTATION_SPEED: 0.05,
  SHIP_MIN_SPEED:      0.5,
  BULLET_SPEED:        10,
  BULLET_MAX:          5,
  PARTICLE_LIFE:       40,
  PARTICLE_COUNT:      12,
  OBSTACLE_SPAWN_RATE: 90,
  POWERUP_SPAWN_RATE:  600,
  LIVES_INITIAL:       3,
  INVINCIBLE_FRAMES:   120,
  LEVEL_SCORE_THRESHOLDS: [0, 500, 1500],
  HIT_FLASH_MS:        300,
  LEVELUP_DISPLAY_MS:  2000,
  COLORS: {
    BG:           '#0a0a1a',
    SHIP:         '#00ffff',
    SHIP_THRUST:  '#ff6600',
    BULLET:       '#ffff00',
    SHIELD:       '#00ff88',
    HIT:          '#ff0044',
    STAR_DIM:     '#334466',
    STAR_BRIGHT:  '#aaccff',
    COMET:        '#ff8844',
    ASTEROID:     '#888888',
    PLANET:       '#4466ff',
    UFO:          '#ff44ff',
    NEBULA:       '#220033',
    POWERUP_SPD:  '#ffff00',
    POWERUP_SHD:  '#00ff88',
    POWERUP_MAG:  '#ff88ff',
    PARTICLE_EXP: '#ff4400',
    PARTICLE_TRL: '#0088ff'
  }
};

// --- [3] Game.State — Máquina de Estados ---
Game.State = {
  MENU:      'MENU',
  PLAYING:   'PLAYING',
  PAUSED:    'PAUSED',
  GAME_OVER: 'GAME_OVER',

  current: 'MENU',

  els: {},

  toPlaying: function() {
    this.current = this.PLAYING;
    document.body.classList.add('is-running');
    document.body.classList.remove('is-gameover', 'is-paused');
    this.els.screenStart.classList.add('hidden');
    this.els.screenGame.classList.remove('hidden');
    this.els.screenGameover.classList.add('hidden');
    this.els.screenPause.classList.add('hidden');
  },

  toPaused: function() {
    this.current = this.PAUSED;
    document.body.classList.toggle('is-paused');
    this.els.screenPause.classList.toggle('hidden');
  },

  toGameOver: function() {
    this.current = this.GAME_OVER;
    document.body.classList.remove('is-running');
    document.body.classList.add('is-gameover');
    this.els.screenGame.classList.add('hidden');
    this.els.screenGameover.classList.remove('hidden');
  },

  toMenu: function() {
    this.current = this.MENU;
    document.body.classList.remove('is-gameover', 'is-running', 'is-paused');
    this.els.screenGameover.classList.add('hidden');
    this.els.screenStart.classList.remove('hidden');
  },

  showLevelUp: function(levelNum) {
    var overlay = this.els.overlayLevelUp;
    var numEl   = this.els.overlayLevelNumber;
    numEl.textContent = levelNum;
    overlay.classList.add('is-leveling');
    overlay.classList.remove('hidden');
    setTimeout(function() {
      overlay.classList.remove('is-leveling');
      overlay.classList.add('hidden');
    }, CONFIG.LEVELUP_DISPLAY_MS);
  }
};

// --- [4] Game.Controls — Entrada de Teclado ---
Game.Controls = {
  keys: {},

  init: function() {
    var self = this;
    window.addEventListener('keydown', function(e) {
      self.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code) !== -1) {
        e.preventDefault();
      }
      if ((e.code === 'Escape' || e.code === 'KeyP') && Game.State.current === Game.State.PLAYING) {
        Game.State.toPaused();
      } else if ((e.code === 'Escape' || e.code === 'KeyP') && Game.State.current === Game.State.PAUSED) {
        Game.State.toPaused();
      }
    });
    window.addEventListener('keyup', function(e) {
      self.keys[e.code] = false;
    });
  },

  isDown: function(code) {
    return !!this.keys[code];
  }
};

// --- [5] Game.Ship — Física de la Nave ---
Game.Ship = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: 0,
  radius: 16,
  lives: CONFIG.LIVES_INITIAL,
  invincibleFrames: 0,
  shieldActive: false,
  shieldTimer: 0,
  speedBoostActive: false,
  speedBoostTimer: 0,
  magnetActive: false,
  magnetTimer: 0,
  bullets: [],
  shootCooldown: 0,
  thrustOn: false,

  init: function() {
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.CANVAS_HEIGHT / 2;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.lives = CONFIG.LIVES_INITIAL;
    this.invincibleFrames = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.speedBoostActive = false;
    this.speedBoostTimer = 0;
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.bullets = [];
    this.shootCooldown = 0;
    this.thrustOn = false;
  },

  update: function() {
    var maxSpeed = this.speedBoostActive
      ? CONFIG.SHIP_MAX_SPEED * 1.6
      : CONFIG.SHIP_MAX_SPEED;
    var accel = this.speedBoostActive
      ? CONFIG.SHIP_SPEED * 1.4
      : CONFIG.SHIP_SPEED;

    if (Game.Controls.isDown('ArrowLeft')) {
      this.angle -= CONFIG.SHIP_ROTATION_SPEED;
    }
    if (Game.Controls.isDown('ArrowRight')) {
      this.angle += CONFIG.SHIP_ROTATION_SPEED;
    }

    this.thrustOn = Game.Controls.isDown('ArrowUp');
    if (this.thrustOn) {
      this.vx += Math.cos(this.angle) * (accel * 0.1);
      this.vy += Math.sin(this.angle) * (accel * 0.1);
    }

    // Fricción
    this.vx *= CONFIG.SHIP_FRICTION;
    this.vy *= CONFIG.SHIP_FRICTION;

    // Velocidad mínima no-cero (deriva espacial)
    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0 && speed < CONFIG.SHIP_MIN_SPEED) {
      var ratio = CONFIG.SHIP_MIN_SPEED / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Clamp velocidad máxima
    if (speed > maxSpeed) {
      var clampRatio = maxSpeed / speed;
      this.vx *= clampRatio;
      this.vy *= clampRatio;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Wrap-around de pantalla
    if (this.x < -this.radius) this.x = CONFIG.CANVAS_WIDTH + this.radius;
    if (this.x > CONFIG.CANVAS_WIDTH + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = CONFIG.CANVAS_HEIGHT + this.radius;
    if (this.y > CONFIG.CANVAS_HEIGHT + this.radius) this.y = -this.radius;

    // Disparo
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (Game.Controls.isDown('Space') && this.shootCooldown === 0 && this.bullets.length < CONFIG.BULLET_MAX) {
      this.bullets.push({
        x: this.x + Math.cos(this.angle) * this.radius,
        y: this.y + Math.sin(this.angle) * this.radius,
        vx: Math.cos(this.angle) * CONFIG.BULLET_SPEED + this.vx,
        vy: Math.sin(this.angle) * CONFIG.BULLET_SPEED + this.vy,
        life: 60
      });
      this.shootCooldown = 12;
      Game.Audio.playShoot();
    }

    // Actualizar balas
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      var b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 ||
          b.x < 0 || b.x > CONFIG.CANVAS_WIDTH ||
          b.y < 0 || b.y > CONFIG.CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
      }
    }

    // Timers de power-ups
    if (this.invincibleFrames > 0) this.invincibleFrames--;

    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        document.getElementById('player-ship').classList.remove('is-powered');
      }
    }
    if (this.speedBoostActive) {
      this.speedBoostTimer--;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
        if (!this.shieldActive && !this.magnetActive) {
          document.getElementById('player-ship').classList.remove('is-powered');
        }
      }
    }
    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
        if (!this.shieldActive && !this.speedBoostActive) {
          document.getElementById('player-ship').classList.remove('is-powered');
        }
      }
    }
  },

  hit: function() {
    if (this.invincibleFrames > 0 || this.shieldActive) {
      if (this.shieldActive) {
        this.shieldActive = false;
        this.shieldTimer = 0;
        document.getElementById('player-ship').classList.remove('is-powered');
        Game.Audio.playShieldBreak();
      }
      return;
    }
    this.lives--;
    this.invincibleFrames = CONFIG.INVINCIBLE_FRAMES;
    var shipEl = document.getElementById('player-ship');
    shipEl.classList.add('is-hit');
    setTimeout(function() {
      shipEl.classList.remove('is-hit');
    }, CONFIG.HIT_FLASH_MS);
    Game.Audio.playExplosion();
    Game.Particles.spawnExplosion(Game.Ship.x, Game.Ship.y);
  },

  applyPowerUp: function(type) {
    var shipEl = document.getElementById('player-ship');
    shipEl.classList.add('is-powered');
    if (type === 'speed') {
      this.speedBoostActive = true;
      this.speedBoostTimer = 300;
    } else if (type === 'shield') {
      this.shieldActive = true;
      this.shieldTimer = 400;
    } else if (type === 'magnet') {
      this.magnetActive = true;
      this.magnetTimer = 350;
    }
    Game.Audio.playPowerUp();
  }
};

// --- [6] Game.Particles — Sistema de Partículas ---
Game.Particles = {
  list: [],

  spawnExplosion: function(x, y) {
    for (var i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      var angle = (Math.PI * 2 / CONFIG.PARTICLE_COUNT) * i + (Math.random() - 0.5) * 0.5;
      var speed = 1.5 + Math.random() * 3;
      this.list.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: CONFIG.PARTICLE_LIFE,
        maxLife: CONFIG.PARTICLE_LIFE,
        color: CONFIG.COLORS.PARTICLE_EXP,
        size: 2 + Math.random() * 3,
        type: 'explosion'
      });
    }
  },

  spawnTrail: function(x, y, angle) {
    var trailAngle = angle + Math.PI + (Math.random() - 0.5) * 0.6;
    var speed = 1 + Math.random() * 2;
    this.list.push({
      x: x,
      y: y,
      vx: Math.cos(trailAngle) * speed,
      vy: Math.sin(trailAngle) * speed,
      life: 15 + Math.floor(Math.random() * 10),
      maxLife: 25,
      color: CONFIG.COLORS.SHIP_THRUST,
      size: 1.5 + Math.random() * 2,
      type: 'trail'
    });
  },

  spawnCollect: function(x, y, color) {
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      this.list.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 20,
        maxLife: 20,
        color: color || CONFIG.COLORS.STAR_BRIGHT,
        size: 2,
        type: 'collect'
      });
    }
  },

  update: function() {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) {
        this.list.splice(i, 1);
      }
    }
  },

  clear: function() {
    this.list = [];
  }
};

// --- [7] Game.Obstacles — Fábrica de Obstáculos ---
Game.Obstacles = {
  list: [],
  spawnTimer: 0,

  TYPES: ['comet', 'asteroid', 'planet', 'ufo', 'nebula'],

  create: function(type, level) {
    var edge = Math.floor(Math.random() * 4);
    var x, y, vx, vy;
    var margin = 40;

    if (edge === 0) { x = Math.random() * CONFIG.CANVAS_WIDTH; y = -margin; }
    else if (edge === 1) { x = CONFIG.CANVAS_WIDTH + margin; y = Math.random() * CONFIG.CANVAS_HEIGHT; }
    else if (edge === 2) { x = Math.random() * CONFIG.CANVAS_WIDTH; y = CONFIG.CANVAS_HEIGHT + margin; }
    else { x = -margin; y = Math.random() * CONFIG.CANVAS_HEIGHT; }

    var targetX = CONFIG.CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 300;
    var targetY = CONFIG.CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 300;
    var dx = targetX - x;
    var dy = targetY - y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var baseSpeed = 1.2 + Math.random() * 1.5 + (level - 1) * 0.4;

    vx = (dx / dist) * baseSpeed;
    vy = (dy / dist) * baseSpeed;

    var obstacle = { x: x, y: y, vx: vx, vy: vy, type: type, angle: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.04 };

    if (type === 'comet') {
      obstacle.radius = 10 + Math.random() * 8;
      obstacle.color = CONFIG.COLORS.COMET;
      obstacle.damage = true;
      obstacle.points = 15;
    } else if (type === 'asteroid') {
      obstacle.radius = 18 + Math.random() * 14;
      obstacle.color = CONFIG.COLORS.ASTEROID;
      obstacle.damage = true;
      obstacle.points = 10;
      obstacle.vertices = [];
      for (var i = 0; i < 8; i++) {
        obstacle.vertices.push(0.7 + Math.random() * 0.5);
      }
    } else if (type === 'planet') {
      obstacle.radius = 28 + Math.random() * 16;
      obstacle.color = CONFIG.COLORS.PLANET;
      obstacle.damage = true;
      obstacle.points = 5;
      obstacle.vx *= 0.5;
      obstacle.vy *= 0.5;
    } else if (type === 'ufo') {
      obstacle.radius = 20;
      obstacle.color = CONFIG.COLORS.UFO;
      obstacle.damage = true;
      obstacle.points = 25;
      obstacle.wobble = 0;
    } else if (type === 'nebula') {
      obstacle.radius = 35 + Math.random() * 20;
      obstacle.color = CONFIG.COLORS.NEBULA;
      obstacle.damage = false;
      obstacle.trap = true;
      obstacle.points = 0;
      obstacle.vx *= 0.3;
      obstacle.vy *= 0.3;
      obstacle.alpha = 0.55;
    }

    return obstacle;
  },

  spawn: function(level) {
    this.spawnTimer++;
    var rate = Math.max(40, CONFIG.OBSTACLE_SPAWN_RATE - (level - 1) * 20);
    if (this.spawnTimer >= rate) {
      this.spawnTimer = 0;
      var typeIndex = Math.floor(Math.random() * this.TYPES.length);
      // Nebula only from level 2+
      if (this.TYPES[typeIndex] === 'nebula' && level < 2) {
        typeIndex = Math.floor(Math.random() * 4);
      }
      this.list.push(this.create(this.TYPES[typeIndex], level));
    }
  },

  update: function(level) {
    this.spawn(level);
    for (var i = this.list.length - 1; i >= 0; i--) {
      var o = this.list[i];
      o.x += o.vx;
      o.y += o.vy;
      o.angle += o.rotSpeed;
      if (o.type === 'ufo') {
        o.wobble += 0.05;
        o.y += Math.sin(o.wobble) * 0.8;
      }
      // Eliminar si sale de pantalla con margen
      var margin = 80;
      if (o.x < -margin || o.x > CONFIG.CANVAS_WIDTH + margin ||
          o.y < -margin || o.y > CONFIG.CANVAS_HEIGHT + margin) {
        this.list.splice(i, 1);
      }
    }
  },

  clear: function() {
    this.list = [];
    this.spawnTimer = 0;
  }
};

// --- [8] Game.PowerUps — Fábrica de Power-Ups ---
Game.PowerUps = {
  list: [],
  spawnTimer: 0,

  TYPES: ['speed', 'shield', 'magnet'],

  create: function(type) {
    var x = 60 + Math.random() * (CONFIG.CANVAS_WIDTH - 120);
    var y = 60 + Math.random() * (CONFIG.CANVAS_HEIGHT - 120);
    var colorMap = {
      speed:  CONFIG.COLORS.POWERUP_SPD,
      shield: CONFIG.COLORS.POWERUP_SHD,
      magnet: CONFIG.COLORS.POWERUP_MAG
    };
    return {
      x: x,
      y: y,
      type: type,
      radius: 12,
      color: colorMap[type],
      life: 400,
      pulse: 0
    };
  },

  spawn: function() {
    this.spawnTimer++;
    if (this.spawnTimer >= CONFIG.POWERUP_SPAWN_RATE) {
      this.spawnTimer = 0;
      var type = this.TYPES[Math.floor(Math.random() * this.TYPES.length)];
      this.list.push(this.create(type));
    }
  },

  update: function() {
    this.spawn();
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.pulse += 0.08;
      p.life--;

      // Imán: atraer hacia nave
      if (Game.Ship.magnetActive) {
        var dx = Game.Ship.x - p.x;
        var dy = Game.Ship.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 1) {
          p.x += (dx / dist) * 3;
          p.y += (dy / dist) * 3;
        }
      }

      if (p.life <= 0) {
        this.list.splice(i, 1);
      }
    }
  },

  clear: function() {
    this.list = [];
    this.spawnTimer = 0;
  }
};

// --- [9] Game.Renderer — Dibujo Procedural ---
Game.Renderer = {
  canvas: null,
  ctx: null,
  stars: [],

  init: function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    this.generateStars();
  },

  generateStars: function() {
    this.stars = [];
    for (var i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        r: Math.random() < 0.2 ? 1.5 : 0.8,
        bright: Math.random() < 0.25,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  },

  clear: function() {
    var ctx = this.ctx;
    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  },

  drawStars: function(frame) {
    var ctx = this.ctx;
    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];
      s.twinkle += 0.03;
      var alpha = s.bright ? 0.6 + Math.sin(s.twinkle) * 0.4 : 0.3 + Math.sin(s.twinkle) * 0.1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.bright ? CONFIG.COLORS.STAR_BRIGHT : CONFIG.COLORS.STAR_DIM;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawShip: function(ship) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Parpadeo de invencibilidad
    if (ship.invincibleFrames > 0 && Math.floor(ship.invincibleFrames / 6) % 2 === 0) {
      ctx.restore();
      return;
    }

    var shipColor = ship.shieldActive ? CONFIG.COLORS.SHIELD : CONFIG.COLORS.SHIP;

    // Estela de propulsión
    if (ship.thrustOn) {
      ctx.beginPath();
      ctx.moveTo(-ship.radius * 0.6, -ship.radius * 0.4);
      ctx.lineTo(-ship.radius * 1.4 - Math.random() * 6, 0);
      ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.4);
      ctx.closePath();
      ctx.fillStyle = CONFIG.COLORS.SHIP_THRUST;
      ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Cuerpo de la nave (triángulo con detalle)
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius * 0.7, -ship.radius * 0.55);
    ctx.lineTo(-ship.radius * 0.4, 0);
    ctx.lineTo(-ship.radius * 0.7, ship.radius * 0.55);
    ctx.closePath();
    ctx.strokeStyle = shipColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cabina
    ctx.beginPath();
    ctx.arc(ship.radius * 0.1, 0, ship.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = shipColor;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Escudo visual
    if (ship.shieldActive) {
      ctx.beginPath();
      ctx.arc(0, 0, ship.radius * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = CONFIG.COLORS.SHIELD;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },

  drawBullets: function(bullets) {
    var ctx = this.ctx;
    for (var i = 0; i < bullets.length; i++) {
      var b = bullets[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.BULLET;
      ctx.shadowColor = CONFIG.COLORS.BULLET;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  },

  drawObstacle: function(o) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.angle);

    if (o.type === 'comet') {
      // Estela del cometa
      var grad = ctx.createLinearGradient(-o.radius * 3, 0, o.radius, 0);
      grad.addColorStop(0, 'rgba(255,136,68,0)');
      grad.addColorStop(1, CONFIG.COLORS.COMET);
      ctx.beginPath();
      ctx.moveTo(-o.radius * 3, -o.radius * 0.3);
      ctx.lineTo(o.radius, 0);
      ctx.lineTo(-o.radius * 3, o.radius * 0.3);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      // Núcleo
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COLORS.COMET;
      ctx.fill();
      ctx.strokeStyle = '#ffcc88';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (o.type === 'asteroid') {
      ctx.beginPath();
      var verts = o.vertices;
      for (var i = 0; i < verts.length; i++) {
        var a = (Math.PI * 2 / verts.length) * i;
        var r = o.radius * verts[i];
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = CONFIG.COLORS.ASTEROID;
      ctx.fill();
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (o.type === 'planet') {
      // Planeta con gradiente
      var pGrad = ctx.createRadialGradient(-o.radius * 0.3, -o.radius * 0.3, o.radius * 0.1, 0, 0, o.radius);
      pGrad.addColorStop(0, '#88aaff');
      pGrad.addColorStop(0.6, CONFIG.COLORS.PLANET);
      pGrad.addColorStop(1, '#112244');
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fillStyle = pGrad;
      ctx.fill();
      // Anillo
      ctx.beginPath();
      ctx.ellipse(0, 0, o