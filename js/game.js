/* ============================================================
   PROYEC-21 — js/game.js
   Namespace raíz: window.GAME
   ============================================================ */

(function(global) {

  // ============================================================
  // --- SECCIÓN 1: CONSTANTES Y CONFIGURACIÓN ---
  // ============================================================

  var CONFIG = {
    CANVAS_WIDTH:         800,
    CANVAS_HEIGHT:        600,
    TARGET_FPS:           60,
    PLAYER_SPEED_MAX:     300,
    PLAYER_SPEED_MIN:     40,
    PLAYER_ACCEL:         200,
    PLAYER_DECEL:         150,
    PLAYER_TURN_SPEED:    3.0,
    BULLET_SPEED:         500,
    BULLET_MAX:           10,
    PLAYER_LIVES:         3,
    PLAYER_INVINCIBLE_MS: 2000,
    DAMAGE_FLASH_MS:      300,
    POWERUP_DURATION_MS:  8000,
    OBSTACLE_POOL_SIZE:   30,
    POWERUP_POOL_SIZE:    5,
    BULLET_POOL_SIZE:     10,
    LEVEL_THRESHOLDS:     [0, 500, 1500, 3500],
    LEVELUP_DISPLAY_MS:   2000,
    STAR_COUNT:           80,
    COLORS: {
      PLAYER:          '#00FFFF',
      BULLET:          '#FFFF00',
      SHIELD:          '#00FF88',
      COMET:           '#FF6633',
      ASTEROID:        '#AA8855',
      PLANET:          '#8844FF',
      UFO:             '#FF00FF',
      NEBULA:          '#334488',
      POWERUP_SHIELD:  '#00FF88',
      POWERUP_TURBO:   '#FFAA00',
      POWERUP_TRIPLE:  '#FF44FF',
      HUD_TEXT:        '#00FFFF',
      STAR:            '#FFFFFF',
      BACKGROUND:      '#000011'
    }
  };

  // ============================================================
  // --- SECCIÓN 2: CONTRATO DE DATOS (DTOs) ---
  // ============================================================

  /*
    CONTRATO Obstacle:
    { type, x, y, vx, vy, radius, rotation, rotSpeed, hp, points, active, color }
  */
  function createObstacle() {
    return {
      type: 'asteroid', x: 0, y: 0, vx: 0, vy: 0,
      radius: 20, rotation: 0, rotSpeed: 0,
      hp: 1, points: 100, active: false, color: CONFIG.COLORS.ASTEROID
    };
  }

  /*
    CONTRATO PowerUp:
    { type, x, y, radius, active, color }
  */
  function createPowerUp() {
    return { type: 'shield', x: 0, y: 0, radius: 12, active: false, color: CONFIG.COLORS.POWERUP_SHIELD };
  }

  /*
    CONTRATO Bullet:
    { x, y, vx, vy, active }
  */
  function createBullet() {
    return { x: 0, y: 0, vx: 0, vy: 0, active: false };
  }

  /*
    CONTRATO Player:
    { x, y, angle, speed, vx, vy, lives, invincibleTimer, damageFlashTimer,
      hasShield, hasTurbo, hasTriple, powerupTimer, shieldHits }
  */
  function createPlayer() {
    return {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: CONFIG.CANVAS_HEIGHT / 2,
      angle: 0,
      speed: CONFIG.PLAYER_SPEED_MIN,
      vx: 0,
      vy: 0,
      lives: CONFIG.PLAYER_LIVES,
      invincibleTimer: 0,
      damageFlashTimer: 0,
      hasShield: false,
      hasTurbo: false,
      hasTriple: false,
      powerupTimer: 0,
      shieldHits: 0
    };
  }

  // ============================================================
  // --- SECCIÓN 3: ESTADO GLOBAL DEL JUEGO (GameState) ---
  // ============================================================

  var GameState = (function() {
    var state = {
      running:       false,
      paused:        false,
      levelingUp:    false,
      score:         0,
      level:         1,
      difficulty:    'medium',
      survivalTime:  0,
      levelupTimer:  0,
      rafId:         null
    };

    function getDifficultyMultiplier() {
      if (state.difficulty === 'easy')   return 0.6;
      if (state.difficulty === 'hard')   return 1.5;
      return 1.0;
    }

    function start() {
      state.running      = true;
      state.paused       = false;
      state.levelingUp   = false;
      state.score        = 0;
      state.level        = 1;
      state.survivalTime = 0;
      state.levelupTimer = 0;

      Player.reset();
      ObstacleManager.reset();
      PowerUpManager.reset();
      ScoreSystem.reset();
      Controls.reset();

      var screenMenu     = document.getElementById('screen-menu');
      var screenGame     = document.getElementById('screen-game');
      var screenPause    = document.getElementById('screen-pause');
      var screenGameover = document.getElementById('screen-gameover');
      var screenLevelup  = document.getElementById('screen-levelup');
      var hudPowerup     = document.getElementById('hud-powerup-indicator');

      screenMenu.hidden     = true;
      screenGame.hidden     = false;
      screenPause.hidden    = true;
      screenGameover.hidden = true;
      screenLevelup.hidden  = true;
      hudPowerup.hidden     = true;

      document.getElementById('hud-score').textContent = '000000';
      document.getElementById('hud-level').textContent = '01';
      document.getElementById('hud-lives').textContent = String(CONFIG.PLAYER_LIVES);

      screenGame.classList.remove('is-paused');

      if (state.rafId) cancelAnimationFrame(state.rafId);
      GameLoop.start();
    }

    function pause() {
      if (!state.running || state.paused) return;
      state.paused = true;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = null;
      document.getElementById('screen-pause').hidden = false;
      document.getElementById('screen-game').classList.add('is-paused');
      AudioManager.playPause();
    }

    function resume() {
      if (!state.running || !state.paused) return;
      state.paused = false;
      document.getElementById('screen-pause').hidden = true;
      document.getElementById('screen-game').classList.remove('is-paused');
      GameLoop.start();
    }

    function gameOver() {
      state.running = false;
      state.paused  = false;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = null;

      document.getElementById('gameover-score-value').textContent = String(state.score);
      document.getElementById('gameover-level-value').textContent = String(state.level);
      document.getElementById('screen-gameover').hidden = false;
      document.getElementById('screen-game').hidden     = true;
      AudioManager.playGameOver();
    }

    function reset() {
      document.getElementById('screen-gameover').hidden = true;
      start();
    }

    function levelUp() {
      if (state.levelingUp) return;
      state.level++;
      state.levelingUp   = true;
      state.levelupTimer = CONFIG.LEVELUP_DISPLAY_MS / 1000;

      document.getElementById('levelup-level-value').textContent =
        state.level < 10 ? '0' + state.level : String(state.level);
      document.getElementById('screen-levelup').hidden = false;

      AudioManager.playLevelUp();
    }

    function checkLevelUp() {
      var thresholds = CONFIG.LEVEL_THRESHOLDS;
      var nextLevel  = state.level + 1;
      if (nextLevel < thresholds.length && state.score >= thresholds[nextLevel]) {
        levelUp();
      }
    }

    function setRafId(id) { state.rafId = id; }
    function getRafId()   { return state.rafId; }

    return {
      state:                  state,
      getDifficultyMultiplier: getDifficultyMultiplier,
      start:                  start,
      pause:                  pause,
      resume:                 resume,
      gameOver:               gameOver,
      reset:                  reset,
      levelUp:                levelUp,
      checkLevelUp:           checkLevelUp,
      setRafId:               setRafId,
      getRafId:               getRafId
    };
  })();

  // ============================================================
  // --- SECCIÓN 4: CONTROLES (Controls) ---
  // ============================================================

  var Controls = (function() {
    var keys = {};
    var shootPressed = false;

    function onKeyDown(e) {
      keys[e.code] = true;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (GameState.state.running && !GameState.state.paused) {
          GameState.pause();
        } else if (GameState.state.paused) {
          GameState.resume();
        }
      }

      if ((e.code === 'Space' || e.code === 'KeyZ') && !shootPressed) {
        shootPressed = true;
        if (GameState.state.running && !GameState.state.paused && !GameState.state.levelingUp) {
          Player.shoot();
        }
      }

      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code) !== -1) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      keys[e.code] = false;
      if (e.code === 'Space' || e.code === 'KeyZ') shootPressed = false;
    }

    function isDown(code) { return !!keys[code]; }

    function reset() {
      keys         = {};
      shootPressed = false;
    }

    function init() {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup',   onKeyUp);
    }

    return { isDown: isDown, reset: reset, init: init };
  })();

  // ============================================================
  // --- SECCIÓN 5: NAVE DEL JUGADOR (Player) ---
  // ============================================================

  var Player = (function() {
    var data = createPlayer();
    var bulletPool = [];

    function initPool() {
      bulletPool = [];
      for (var i = 0; i < CONFIG.BULLET_POOL_SIZE; i++) {
        bulletPool.push(createBullet());
      }
    }

    function reset() {
      data = createPlayer();
      initPool();
      var el = document.getElementById('game-canvas');
      if (el) {
        el.classList.remove('is-damaged');
        el.classList.remove('is-powered');
        el.classList.remove('is-shield');
      }
    }

    function getFreeBullet() {
      for (var i = 0; i < bulletPool.length; i++) {
        if (!bulletPool[i].active) return bulletPool[i];
      }
      return null;
    }

    function fireBullet(angle) {
      var b = getFreeBullet();
      if (!b) return;
      b.x      = data.x;
      b.y      = data.y;
      b.vx     = Math.sin(angle)  * CONFIG.BULLET_SPEED;
      b.vy     = -Math.cos(angle) * CONFIG.BULLET_SPEED;
      b.active = true;
    }

    function shoot() {
      if (data.hasTriple) {
        fireBullet(data.angle - 0.25);
        fireBullet(data.angle);
        fireBullet(data.angle + 0.25);
      } else {
        fireBullet(data.angle);
      }
      AudioManager.playShoot();
    }

    function applyPowerUp(type) {
      data.hasShield = false;
      data.hasTurbo  = false;
      data.hasTriple = false;
      data.powerupTimer = CONFIG.POWERUP_DURATION_MS / 1000;

      if (type === 'shield') { data.hasShield = true; data.shieldHits = 1; }
      if (type === 'turbo')  { data.hasTurbo  = true; }
      if (type === 'triple') { data.hasTriple = true; }

      var indicator = document.getElementById('hud-powerup-indicator');
      indicator.hidden = false;
      indicator.textContent = type.toUpperCase();

      var canvas = document.getElementById('game-canvas');
      canvas.classList.add('is-powered');
      if (type === 'shield') canvas.classList.add('is-shield');
      else canvas.classList.remove('is-shield');

      AudioManager.playPowerUp();
    }

    function clearPowerUp() {
      data.hasShield    = false;
      data.hasTurbo     = false;
      data.hasTriple    = false;
      data.powerupTimer = 0;
      document.getElementById('hud-powerup-indicator').hidden = true;
      var canvas = document.getElementById('game-canvas');
      canvas.classList.remove('is-powered');
      canvas.classList.remove('is-shield');
    }

    function takeDamage() {
      if (data.invincibleTimer > 0) return;
      if (data.hasShield && data.shieldHits > 0) {
        data.shieldHits--;
        if (data.shieldHits <= 0) clearPowerUp();
        return;
      }
      data.lives--;
      data.invincibleTimer  = CONFIG.PLAYER_INVINCIBLE_MS / 1000;
      data.damageFlashTimer = CONFIG.DAMAGE_FLASH_MS / 1000;

      document.getElementById('hud-lives').textContent = String(Math.max(0, data.lives));
      document.getElementById('game-canvas').classList.add('is-damaged');
      AudioManager.playHit();

      if (data.lives <= 0) GameState.gameOver();
    }

    function update(dt) {
      var speedMax = data.hasTurbo
        ? CONFIG.PLAYER_SPEED_MAX * 1.6
        : CONFIG.PLAYER_SPEED_MAX;

      if (Controls.isDown('ArrowLeft'))  data.angle -= CONFIG.PLAYER_TURN_SPEED * dt;
      if (Controls.isDown('ArrowRight')) data.angle += CONFIG.PLAYER_TURN_SPEED * dt;

      if (Controls.isDown('ArrowUp')) {
        data.speed += CONFIG.PLAYER_ACCEL * dt;
        if (data.speed > speedMax) data.speed = speedMax;
      } else if (Controls.isDown('ArrowDown')) {
        data.speed -= CONFIG.PLAYER_DECEL * dt;
        if (data.speed < CONFIG.PLAYER_SPEED_MIN) data.speed = CONFIG.PLAYER_SPEED_MIN;
      } else {
        data.speed -= CONFIG.PLAYER_DECEL * 0.5 * dt;
        if (data.speed < CONFIG.PLAYER_SPEED_MIN) data.speed = CONFIG.PLAYER_SPEED_MIN;
      }

      data.vx = Math.sin(data.angle)  * data.speed;
      data.vy = -Math.cos(data.angle) * data.speed;
      data.x += data.vx * dt;
      data.y += data.vy * dt;

      if (data.x < 0)                    data.x = CONFIG.CANVAS_WIDTH;
      if (data.x > CONFIG.CANVAS_WIDTH)  data.x = 0;
      if (data.y < 0)                    data.y = CONFIG.CANVAS_HEIGHT;
      if (data.y > CONFIG.CANVAS_HEIGHT) data.y = 0;

      if (data.invincibleTimer > 0) {
        data.invincibleTimer -= dt;
        if (data.invincibleTimer < 0) data.invincibleTimer = 0;
      }

      if (data.damageFlashTimer > 0) {
        data.damageFlashTimer -= dt;
        if (data.damageFlashTimer <= 0) {
          data.damageFlashTimer = 0;
          document.getElementById('game-canvas').classList.remove('is-damaged');
        }
      }

      if (data.powerupTimer > 0) {
        data.powerupTimer -= dt;
        if (data.powerupTimer <= 0) clearPowerUp();
      }

      updateBullets(dt);
    }

    function updateBullets(dt) {
      for (var i = 0; i < bulletPool.length; i++) {
        var b = bulletPool[i];
        if (!b.active) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 0 || b.x > CONFIG.CANVAS_WIDTH || b.y < 0 || b.y > CONFIG.CANVAS_HEIGHT) {
          b.active = false;
        }
      }
    }

    function getData()       { return data; }
    function getBullets()    { return bulletPool; }

    return {
      reset:       reset,
      update:      update,
      shoot:       shoot,
      takeDamage:  takeDamage,
      applyPowerUp: applyPowerUp,
      getData:     getData,
      getBullets:  getBullets
    };
  })();

  // ============================================================
  // --- SECCIÓN 6: GESTOR DE OBSTÁCULOS (ObstacleManager) ---
  // ============================================================

  var ObstacleManager = (function() {
    var pool        = [];
    var spawnTimer  = 0;
    var spawnInterval = 1.5;

    var OBSTACLE_TYPES = ['comet', 'asteroid', 'planet', 'ufo', 'nebula'];

    var TYPE_CONFIG = {
      comet:    { radius: 10, hp: 1, points: 150, color: CONFIG.COLORS.COMET,    rotSpeed: 0 },
      asteroid: { radius: 22, hp: 2, points: 100, color: CONFIG.COLORS.ASTEROID, rotSpeed: 1.2 },
      planet:   { radius: 35, hp: 3, points: 200, color: CONFIG.COLORS.PLANET,   rotSpeed: 0.4 },
      ufo:      { radius: 18, hp: 2, points: 250, color: CONFIG.COLORS.UFO,      rotSpeed: 0 },
      nebula:   { radius: 45, hp: 1, points: 50,  color: CONFIG.COLORS.NEBULA,   rotSpeed: 0.2 }
    };

    function initPool() {
      pool = [];
      for (var i = 0; i < CONFIG.OBSTACLE_POOL_SIZE; i++) {
        pool.push(createObstacle());
      }
    }

    function reset() {
      initPool();
      spawnTimer    = 0;
      spawnInterval = 1.5;
    }

    function getFreeSlot() {
      for (var i = 0; i < pool.length; i++) {
        if (!pool[i].active) return pool[i];
      }
      return null;
    }

    function spawnObstacle() {
      var o = getFreeSlot();
      if (!o) return;

      var level = GameState.state.level;
      var diff  = GameState.getDifficultyMultiplier();

      var typeIndex = Math.floor(Math.random() * Math.min(OBSTACLE_TYPES.length, 2 + level));
      var type      = OBSTACLE_TYPES[typeIndex];
      var tc        = TYPE_CONFIG[type];

      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0) { x = Math.random() * CONFIG.CANVAS_WIDTH; y = -tc.radius; }
      else if (edge === 1) { x = CONFIG.CANVAS_WIDTH + tc.radius; y = Math.random() * CONFIG.CANVAS_HEIGHT; }
      else if (edge === 2) { x = Math.random() * CONFIG.CANVAS_WIDTH; y = CONFIG.CANVAS_HEIGHT + tc.radius; }
      else { x = -tc.radius; y = Math.random() * CONFIG.CANVAS_HEIGHT; }

      var baseSpeed = (60 + Math.random() * 80) * diff * (1 + (level - 1) * 0.2);
      var angle     = Math.atan2(
        CONFIG.CANVAS_HEIGHT / 2 - y + (Math.random() - 0.5) * 200,
        CONFIG.CANVAS_WIDTH  / 2 - x + (Math.random() - 0.5) * 200
      );

      o.type     = type;
      o.x        = x;
      o.y        = y;
      o.vx       = Math.cos(angle) * baseSpeed;
      o.vy       = Math.sin(angle) * baseSpeed;
      o.radius   = tc.radius;
      o.rotation = Math.random() * Math.PI * 2;
      o.rotSpeed = (Math.random() - 0.5) * 2 * tc.rotSpeed;
      o.hp       = tc.hp;
      o.points   = tc.points;
      o.active   = true;
      o.color    = tc.color;
    }

    function updateUFOAI(o, dt) {
      var player = Player.getData();
      var dx     = player.x - o.x;
      var dy     = player.y - o.y;
      var dist   = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed  = 90 * GameState.getDifficultyMultiplier();
      o.vx += (dx / dist) * speed * dt * 0.5;
      o.vy += (dy / dist) * speed * dt * 0.5;
      var currentSpeed = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
      if (currentSpeed > speed) {
        o.vx = (o.vx / currentSpeed) * speed;
        o.vy = (o.vy / currentSpeed) * speed;
      }
    }

    function isOffScreen(o) {
      var margin = o.radius + 60;
      return (
        o.x < -margin || o.x > CONFIG.CANVAS_WIDTH  + margin ||
        o.y < -margin || o.y > CONFIG.CANVAS_HEIGHT + margin
      );
    }

    function update(dt) {
      var level = GameState.state.level;
      spawnInterval = Math.max(0.4, 1.5 - (level - 1) * 0.3) / GameState.getDifficultyMultiplier();
      spawnTimer += dt;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnObstacle();
      }

      for (var i = 0; i < pool.length; i++) {
        var o = pool[i];
        if (!o.active) continue;
        if (o.type === 'ufo') updateUFOAI(o, dt);
        o.x        += o.vx * dt;
        o.y        += o.vy * dt;
        o.rotation += o.rotSpeed * dt;
        if (isOffScreen(o)) o.active = false;
      }
    }

    function getPool() { return pool; }

    return { reset: reset, update: update, getPool: getPool };
  })();

  // ============================================================
  // --- SECCIÓN 7: GESTOR DE POWER-UPS (PowerUpManager) ---
  // ============================================================

  var PowerUpManager = (function() {
    var pool       = [];
    var spawnTimer = 0;
    var SPAWN_INTERVAL = 12;
    var TYPES = ['shield', 'turbo', 'triple'];

    function initPool() {
      pool = [];
      for (var i = 0; i < CONFIG.POWERUP_POOL_SIZE; i++) {
        pool.push(createPowerUp());
      }
    }

    function reset() {
      initPool();
      spawnTimer = 0;
    }

    function getFreeSlot() {
      for (var i = 0; i < pool.length; i++) {
        if (!pool[i].active) return pool[i];
      }
      return null;
    }

    function spawnPowerUp() {
      var p = getFreeSlot();
      if (!p) return;
      var type  = TYPES[Math.floor(Math.random() * TYPES.length)];
      var colorMap = {
        shield: CONFIG.COLORS.POWERUP_SHIELD,
        turbo:  CONFIG.COLORS.POWERUP_TURBO,
        triple: CONFIG.COLORS.POWERUP_TRIPLE
      };
      p.type   = type;
      p.x      = 40 + Math.random() * (CONFIG.CANVAS_WIDTH  - 80);
      p.y      = 40 + Math.random() * (CONFIG.CANVAS_HEIGHT - 80);
      p.radius = 12;
      p.active = true;
      p.color  = colorMap[type];
    }

    function update(dt) {
      spawnTimer += dt;
      if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        spawnPowerUp();
      }
      var player = Player.getData();
      for (var i = 0; i < pool.length; i++) {
        var p = pool[i];
        if (!p.active) continue;
        var dx   = player.x - p.x;
        var dy   = player.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.speed * 0 + 16 + p.radius) {
          p.active = false;
          Player.applyPowerUp(p.type);
          ScoreSystem.addPoints(50);
        }
      }
    }

    function getPool() { return pool; }

    return { reset: reset, update: update, getPool: getPool };
  })();

  // ============================================================
  // --- SECCIÓN 8: SISTEMA DE PUNTUACIÓN (ScoreSystem) ---
  // ============================================================

  var ScoreSystem = (function() {
    var score         = 0;
    var survivalAccum = 0;

    function reset() {
      score         = 0;
      survivalAccum = 0;
    }

    function addPoints(pts) {
      score += pts;
      GameState.state.score = score;
      updateHUD();
      GameState.checkLevelUp();
    }

    function updateSurvival(dt) {
      survivalAccum += dt;
      if (survivalAccum >= 1.0) {
        survivalAccum -= 1.0;
        addPoints(10);
        GameState.state.survivalTime += 1;
      }
    }

    function updateHUD() {
      var s   = String(score);
      var pad = '000000'.slice(s.length) + s;
      document.getElementById('hud-score').textContent = pad;
      var lvl = String(GameState.state.level);
      document.getElementById('hud-level').textContent = lvl.length < 2 ? '0' + lvl : lvl;
    }

    function getScore() { return score; }

    return { reset: reset, addPoints: addPoints, updateSurvival: updateSurvival, getScore: getScore };
  })();

  // ============================================================
  // --- SECCIÓN 9: AUDIO (AudioManager) ---
  // ============================================================

  var AudioManager = (function() {
    var ctx = null;

    function getCtx() {
      if (!ctx) {
        try {
          ctx = new (global.AudioContext || global.webkitAudioContext)();
        } catch(e) { ctx = null; }
      }
      return ctx;
    }

    function playTone(freq, type, duration, gainVal, startDelay) {
      var c = getCtx();
      if (!c) return;
      var osc  = c.createOscillator();
      var gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type            = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainVal || 0.15, c.currentTime + (startDelay || 0));
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (startDelay || 0) + duration);
      osc.start(c.currentTime + (startDelay || 0));
      osc.stop(c.currentTime  + (startDelay || 0) + duration);
    }

    function playShoot() {
      playTone(880, 'square', 0.08, 0.12);
      playTone(440, 'square', 0.06, 0.08, 0.04);
    }

    function playHit() {
      playTone(120, 'sawtooth', 0.25, 0.2);
      playTone(80,  'sawtooth', 0.2,  0.15, 0.1);
    }

    function playExplosion() {
      playTone(200, 'sawtooth', 0.15, 0.18);
      playTone(100, 'sawtooth', 0.3,  0.2,  0.05);
    }

    function playPowerUp() {
      playTone(440, 'sine', 0.1, 0.15);
      playTone(660, 'sine', 0.1, 0.15, 0.1);
      playTone(880, 'sine', 0.15, 0.15, 0.2);
    }

    function playLevelUp() {
      playTone(523, 'square', 0.12, 0.15);
      playTone(659, 'square', 0.12, 0.15, 0.13);
      playTone(784, 'square', 0.2,  0.15, 0.26);
    }

    function playGameOver() {
      playTone(440, 'sawtooth', 0.3,  0.2);
      playTone(330, 'sawtooth', 0.3,  0.2,  0.3);
      playTone(220, 'sawtooth', 0.5,  0.2,  0.6);
    }

    function playPause() {
      playTone(660, 'square', 0.08, 0.1);
      playTone(440, 'square', 0.08, 0.1, 0.09);
    }

    return {
      playShoot:    playShoot,
      playHit:      playHit,
      playExplosion: playExplosion,
      playPowerUp:  playPowerUp,
      playLevelUp:  playLevelUp,
      playGameOver: playGameOver,
      playPause:    playPause
    };
  })();

  // ============================================================
  // --- SECCIÓN 10: RENDERER ---
  // ============================================================

  var Renderer = (function() {
    var canvas  = null;
    var ctx     = null;
    var stars   = [];

    function init() {
      canvas = document.getElementById('game-canvas');
      ctx    = canvas.getContext('2d');
      canvas.width  = CONFIG.CANVAS_WIDTH;
      canvas.height = CONFIG.CANVAS_HEIGHT;
      initStars();
    }

    function initStars() {
      stars = [];
      for (var i = 0; i < CONFIG.STAR_COUNT; i++) {
        stars.push({
          x:    Math.random() * CONFIG.CANVAS_WIDTH,
          y:    Math.random() * CONFIG.CANVAS_HEIGHT,
          r:    0.5 + Math.random() * 1.5,
          alpha: 0.4 + Math.random() * 0.6
        });
      }
    }

    function clearFrame() {
      ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    function drawStars() {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle   = CONFIG.COLORS.STAR;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawPlayer(player) {
      var isInvincible = player.invincibleTimer > 0;
      if (isInvincible && Math.floor(player.invincibleTimer * 10) % 2 === 0) return;

      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      ctx.strokeStyle = CONFIG.COLORS.PLAYER;
      ctx.lineWidth   = 2;
      ctx.shadowColor = CONFIG.COLORS.PLAYER;
      ctx.shadowBlur  = 8;

      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-5, 8);
      ctx.lineTo(5, 8);
      ctx.lineTo(12, 14);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = CONFIG.COLORS.PLAYER;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(-5, 8);
      ctx.lineTo(0, -4);
      ctx.lineTo(5, 8);
      ctx.stroke();

      if (player.hasShield) {
        ctx.strokeStyle = CONFIG.COLORS.SHIELD;
        ctx.lineWidth   = 2;
        ctx.shadowColor = CONFIG.COLORS.SHIELD;
        ctx.shadowBlur  = 14;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (player.hasTurbo) {
        ctx.fillStyle   = CONFIG.COLORS.POWERUP_TURBO;
        ctx.shadowColor = CONFIG.COLORS.POWERUP_TURBO;
        ctx.shadowBlur  = 10;
        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(0, 22 + Math.random() * 8);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function drawBullets(bullets) {
      ctx.fillStyle   = CONFIG.COLORS.BULLET;
      ctx.shadowColor = CONFIG.COLORS.BULLET;
      ctx.shadowBlur  = 6;
      for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        if (!b.active) continue;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function drawComet(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      var speed = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
      var angle = Math.atan2(o.vy, o.vx);
      ctx.rotate(angle);
      var grad = ctx.createLinearGradient(-o.radius * 3, 0, o.radius, 0);
      grad.addColorStop(0, 'rgba(255,102,51,0)');
      grad.addColorStop(1, o.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, o.radius * 3, o.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle   = '#FFFFFF';
      ctx.shadowColor = o.color;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(o.radius * 0.5, 0, o.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawAsteroid(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.strokeStyle = o.color;
      ctx.lineWidth   = 2;
      ctx.shadowColor = o.color;
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      var points = 7;
      for (var i = 0; i < points; i++) {
        var a   = (i / points) * Math.PI * 2;
        var jit = o.radius * (0.75 + (((i * 137 + 31) % 100) / 100) * 0.5);
        var px  = Math.cos(a) * jit;
        var py  = Math.sin(a) * jit;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function drawPlanet(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.fillStyle   = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur  = 16;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#CC88FF';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, o.radius * 1.5, o.radius * 0.35, 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawUFO(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.strokeStyle = o.color;
      ctx.fillStyle   = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur  = 12;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.ellipse(0, 2, o.radius, o.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(0, -2, o.radius * 0.55, o.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      var dotAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      for (var i = 0; i < dotAngles.length; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.cos(dotAngles[i]) * o.radius * 0.65,
          2 + Math.sin(dotAngles[i]) * o.radius * 0.2,
          2, 0, Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }

    function drawNebula(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, o.radius);
      grad.addColorStop(0, 'rgba(51,68,136,0.55)');
      grad.addColorStop(1, 'rgba(51,68,136,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,130,220,0.4)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawObstacles(obstacles) {
      for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (!o.active) continue;
        if (o.type === 'comet')    drawComet(o);
        else if (o.type === 'asteroid') drawAsteroid(o);
        else if (o.type === 'planet')   drawPlanet(o);
        else if (o.type === 'ufo')      drawUFO(o);
        else if (o.type === 'nebula')   drawNebula(o);
      }
    }

    function drawPowerUps(powerups) {
      var t = Date.now() / 400;
      for (var i = 0; i < powerups.length; i++) {
        var p = powerups[i];
        if (!p.active) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t);
        ctx.strokeStyle = p.color;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 14;
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 0.85 + Math.sin(t * 3) * 0.15;
        ctx.beginPath();
        for (var j = 0; j < 6; j++) {
          var a  = (j / 6) * Math.PI * 2;
          var px = Math.cos(a) * p.radius;
          var py = Math.sin(a) * p.radius;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = p.color;
        ctx.font        = 'bold 9px monospace';
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        var label = p.type === 'shield' ? 'S' : p.type === 'turbo' ? 'T' : '3';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }

    function drawExplosion(x, y, color, radius) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = 20;
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function render(player, bullets, obstacles, powerups) {
      clearFrame();
      drawStars();
      drawPowerUps(powerups);
      drawObstacles(obstacles);
      drawBullets(bullets);
      drawPlayer(player);
    }

    return {
      init:          init,
      render:        render,
      drawExplosion: drawExplosion
    };
  })();

  // ============================================================
  // --- SECCIÓN 11: GAME LOOP ---
  // ============================================================

  var GameLoop = (function() {
    var lastTime     = 0;
    var explosions   = [];

    function addExplosion(x, y, color, radius) {
      explosions.push({ x: x, y: y, color: color, radius: radius, timer: 0.18 });
    }

    function checkBulletObstacleCollisions() {
      var bullets   = Player.getBullets();
      var obstacles = ObstacleManager.getPool();

      for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        if (!b.active) continue;
        for (var j = 0; j < obstacles.length; j++) {
          var o = obstacles[j];
          if (!o.active) continue;
          var dx   = b.x - o.x;
          var dy   = b.y - o.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < o.radius + 3) {
            b.active = false;
            o.hp--;
            if (o.hp <= 0) {
              addExplosion(o.x, o.y, o.color, o.radius);
              ScoreSystem.addPoints(o.points);
              AudioManager.playExplosion();
              o.active = false;
            }
            break;
          }
        }
      }
    }

    function checkPlayerObstacleCollisions() {
      var player    = Player.getData();
      var obstacles = ObstacleManager.getPool();
      if (player.invincibleTimer > 0) return;

      for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (!o.active) continue;
        var dx   = player.x - o.x;
        var dy   = player.y - o.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < o.radius + 14) {
          Player.takeDamage();
          addExplosion(o.x, o.y, o.color, o.radius * 0.6);
          if (o.type !== 'nebula') o.active = false;
          break;
        }
      }
    }

    function updateExplosions(dt) {
      for (var i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer -= dt;
        if (explosions[i].timer <= 0) explosions.splice(i, 1);
      }
    }

    function renderExplosions() {
      for (var i = 0; i < explosions.length; i++) {
        var e = explosions[i];
        Renderer.drawExplosion(e.x, e.y, e.color, e.radius);
      }
    }

    function updateLevelUp(dt) {
      GameState.state.levelupTimer -= dt;
      if (GameState.state.levelupTimer <= 0) {
        GameState.state.levelingUp = false;
        document.getElementById('screen-levelup').hidden = true;
      }
    }

    function tick(timestamp) {
      var dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      if (dt > 0.1) dt = 0.1;

      if (GameState.state.levelingUp) {
        updateLevelUp(dt);
        var rafId = requestAnimationFrame(tick);
        GameState.setRafId(rafId);
        return;
      }

      Controls.isDown('ArrowUp');

      Player.update(dt);
      ObstacleManager.update(dt);
      PowerUpManager.update(dt);
      ScoreSystem.updateSurvival(dt);

      checkBulletObstacleCollisions();
      checkPlayerObstacleCollisions();
      updateExplosions(dt);

      Renderer.render(
        Player.getData(),
        Player.getBullets(),
        ObstacleManager.getPool(),
        PowerUpManager.getPool()
      );
      renderExplosions();

      if (GameState.state.running && !GameState.state.paused) {
        var id = requestAnimationFrame(tick);
        GameState.setRafId(id);
      }
    }

    function start() {
      lastTime   = performance.now();
      explosions = [];
      var id = requestAnimationFrame(tick);
      GameState.setRafId(id);
    }

    return { start: start, addExplosion: addExplosion };
  })();

  // ============================================================
  // --- SECCIÓN 12: INICIALIZACIÓN Y EVENTOS DOM ---
  // ============================================================

  function initDifficultyButtons() {
    var btnEasy   = document.getElementById('btn-difficulty-easy');
    var btnMedium = document.getElementById('btn-difficulty-medium');
    var btnHard   = document.getElementById('btn-difficulty-hard');

    function setDifficulty(level) {
      GameState.state.difficulty = level;
      btnEasy.classList.remove('is-active');
      btnMedium.classList.remove('is-active');
      btnHard.classList.remove('is-active');
      if (level === 'easy')   btnEasy.classList.add('is-active');
      if (level === 'medium') btnMedium.classList.add('is-active');
      if (level === 'hard')   btnHard.classList.add('is-active');
    }

    btnEasy.addEventListener('click',   function() { setDifficulty('easy'); });
    btnMedium.addEventListener('click', function() { setDifficulty('medium'); });
    btnHard.addEventListener('click',   function() { setDifficulty('hard'); });

    setDifficulty('medium');
  }

  function initScreenButtons() {
    document.getElementById('btn-start').addEventListener('click', function() {
      GameState.start();
    });

    document.getElementById('btn-resume').addEventListener('click', function() {
      GameState.resume();
    });

    document.getElementById('btn-restart').addEventListener('click', function() {
      GameState.reset();
    });
  }

  function initScreenStates() {
    document.getElementById('screen-menu').hidden     = false;
    document.getElementById('screen-game').hidden     = true;
    document.getElementById('screen-pause').hidden    = true;
    document.getElementById('screen-gameover').hidden = true;
    document.getElementById('screen-levelup').hidden  = true;
    document.getElementById('hud-powerup-indicator').hidden = true;
  }

  function init() {
    Renderer.init();
    Controls.init();
    initScreenStates();
    initDifficultyButtons();
    initScreenButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.GAME = {
    GameState:       GameState,
    Player:          Player,
    ObstacleManager: ObstacleManager,
    PowerUpManager:  PowerUpManager,
    ScoreSystem:     ScoreSystem,
    AudioManager:    AudioManager,
    Renderer:        Renderer,
    GameLoop:        GameLoop,
    Controls:        Controls,
    CONFIG:          CONFIG
  };

})(window);