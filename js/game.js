(function () {
  window.SPACE_GAME = window.SPACE_GAME || {};

  // ─── Private module variables ───────────────────────────────────────────────
  let _canvas, _ctx;
  let _state = {};
  let _listenersAttached = false;

  const SHIP_RADIUS             = 18;
  const SHIP_ACCEL              = 600;
  const SHIP_FRICTION           = 0.85;
  const SPEED_BASE              = [200, 320, 480];
  const SCORE_LEVEL_THRESHOLDS  = [0, 500, 1500];
  const POWERUP_DURATION        = 8;
  const LIVES_START             = 3;

  // ─── Private: reset state ───────────────────────────────────────────────────
  function _resetState() {
    _state.score        = 0;
    _state.lives        = LIVES_START;
    _state.level        = 1;
    _state.shipX        = _canvas.width  / 2;
    _state.shipY        = _canvas.height / 2;
    _state.shipVX       = 0;
    _state.shipVY       = 0;
    _state.speed        = SPEED_BASE[0];
    _state.isPaused     = false;
    _state.isGameOver   = false;
    _state.isLevelingUp = false;
    _state.powerup      = null;
    _state.powerupTimer = 0;
    _state.lastTime     = 0;
    _state.rafId        = 0;
    // highscore is preserved intentionally
  }

  // ─── Private: toggle pause ──────────────────────────────────────────────────
  function _togglePause() {
    if (_state.isGameOver) return;
    if (_state.isPaused) {
      SPACE_GAME.Game.resume();
    } else {
      SPACE_GAME.Game.pause();
    }
  }

  // ─── Private: level management ──────────────────────────────────────────────
  function _checkLevelUp() {
    if (_state.isLevelingUp) return;

    let newLevel = 1;
    for (let i = SCORE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (_state.score >= SCORE_LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    if (newLevel > _state.level) {
      _state.level        = newLevel;
      _state.speed        = SPEED_BASE[Math.min(newLevel - 1, SPEED_BASE.length - 1)];
      _state.isLevelingUp = true;

      // Update body level classes
      document.body.classList.remove('is-level-1', 'is-level-2', 'is-level-3');
      document.body.classList.add('is-level-' + _state.level);

      // Bug 1 fix: init() accepts no parameters — call without arguments
      SPACE_GAME.Obstacles.init();

      // Show level-up screen for 3 seconds
      // Bug 5 fix: use SPACE_GAME.HUD (all caps) not SPACE_GAME.Hud
      SPACE_GAME.HUD.showLevelUp(_state.level);

      setTimeout(function () {
        _state.isLevelingUp = false;
      }, 3000);
    }
  }

  // ─── Private: collision handling ────────────────────────────────────────────
  function _handleCollisions() {
    if (_state.powerup === 'shield') return; // shield absorbs all hits

    const pool = SPACE_GAME.Obstacles.getPool();
    for (let i = 0; i < pool.length; i++) {
      const obs = pool[i];
      if (!obs.active) continue;

      const dx = _state.shipX - obs.x;
      const dy = _state.shipY - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = SHIP_RADIUS + obs.radius;

      if (dist < minDist) {
        // Bug 2 fix: pass the obstacle object, not the index; pass amount=1
        SPACE_GAME.Obstacles.damage(obs, 1);
        // Bug 9 fix: correct emit signature — emit(x, y, type, count)
        SPACE_GAME.Particles.emit(_state.shipX, _state.shipY, 'explosion', 12);
        // Bug 13 fix: correct sound name is 'playerHit' not 'hit'
        SPACE_GAME.Audio.play('playerHit');

        _state.lives -= 1;
        // Bug 5 fix: use SPACE_GAME.HUD (all caps)
        SPACE_GAME.HUD.update(_state, performance.now());

        // Visual damage feedback
        const screenGame = document.getElementById('screen-game');
        screenGame.classList.add('is-damaged');
        setTimeout(function () {
          screenGame.classList.remove('is-damaged');
        }, 500);

        if (_state.lives <= 0) {
          SPACE_GAME.Game.stop();
          return;
        }
        break; // one hit per frame
      }
    }
  }

  // ─── Private: power-up pickup ────────────────────────────────────────────────
  function _checkPowerupPickup() {
    const pool = SPACE_GAME.Obstacles.getPool();
    for (let i = 0; i < pool.length; i++) {
      const obs = pool[i];
      if (!obs.active || obs.type !== 'powerup') continue;

      const dx = _state.shipX - obs.x;
      const dy = _state.shipY - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SHIP_RADIUS + obs.radius) {
        _state.powerup      = obs.powerupType || 'shield';
        _state.powerupTimer = POWERUP_DURATION;

        // Apply CSS state
        const screenGame = document.getElementById('screen-game');
        if (_state.powerup === 'boost') {
          screenGame.classList.add('is-boosted');
          screenGame.classList.remove('is-shielded');
        } else {
          screenGame.classList.add('is-shielded');
          screenGame.classList.remove('is-boosted');
        }

        // Bug 4 fix: _renderPowerupAlert is private — HUD.update handles it via state
        // Bug 12 fix: set powerupActive and powerupName on _state so HUD.update renders the alert
        _state.powerupActive = true;
        _state.powerupName   = _state.powerup;

        // Bug 14 fix: correct sound name is 'powerUp' not 'powerup'
        SPACE_GAME.Audio.play('powerUp');
        // Bug 3 fix: pass the obstacle object, not the index; pass amount=1
        SPACE_GAME.Obstacles.damage(obs, 1);
        break;
      }
    }
  }

  // ─── Private: update ────────────────────────────────────────────────────────
  function _update(dt) {
    // 7a. Read controls
    const ctrl = SPACE_GAME.Controls.getState();

    // 7b. Apply acceleration
    if (ctrl.left)  _state.shipVX -= SHIP_ACCEL * dt;
    if (ctrl.right) _state.shipVX += SHIP_ACCEL * dt;
    if (ctrl.up)    _state.shipVY -= SHIP_ACCEL * dt;
    if (ctrl.down)  _state.shipVY += SHIP_ACCEL * dt;

    // Boost modifier
    const speedMult = (_state.powerup === 'boost') ? 1.6 : 1.0;

    // 7c. Apply friction
    _state.shipVX *= SHIP_FRICTION;
    _state.shipVY *= SHIP_FRICTION;

    // 7d. Clamp velocity to max speed
    const maxSpeed = _state.speed * speedMult;
    const currentSpeed = Math.sqrt(_state.shipVX * _state.shipVX + _state.shipVY * _state.shipVY);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      _state.shipVX *= scale;
      _state.shipVY *= scale;
    }

    // 7e. Move ship
    _state.shipX += _state.shipVX * dt;
    _state.shipY += _state.shipVY * dt;

    // 7f. Clamp to canvas bounds
    _state.shipX = Math.max(SHIP_RADIUS, Math.min(_canvas.width  - SHIP_RADIUS, _state.shipX));
    _state.shipY = Math.max(SHIP_RADIUS, Math.min(_canvas.height - SHIP_RADIUS, _state.shipY));

    // Bug 6 fix: pass canvasWidth and canvasHeight, not _state.level
    SPACE_GAME.Obstacles.update(dt, _canvas.width, _canvas.height);

    // 7h. Update particles
    SPACE_GAME.Particles.update(dt);

    // Bug 7 fix: spawn(type, canvasWidth, canvasHeight, speedMultiplier)
    // Determine obstacle type based on level and spawn with correct signature
    const obstacleTypes = ['asteroid-small', 'asteroid-medium', 'enemy-drone'];
    const spawnType = obstacleTypes[Math.min(_state.level - 1, obstacleTypes.length - 1)];
    const spawnSpeedMult = 1 + (_state.level - 1) * 0.5;
    SPACE_GAME.Obstacles.spawn(spawnType, _canvas.width, _canvas.height, spawnSpeedMult);

    // 7j. Collision detection
    _handleCollisions();

    // 7k. Power-up pickup
    _checkPowerupPickup();

    // 7l. Power-up timer
    if (_state.powerup !== null) {
      _state.powerupTimer -= dt;
      if (_state.powerupTimer <= 0) {
        const screenGame = document.getElementById('screen-game');
        screenGame.classList.remove('is-boosted', 'is-shielded');
        _state.powerup       = null;
        _state.powerupTimer  = 0;
        _state.powerupActive = false;
        _state.powerupName   = null;
      }
    }

    // 7m. Score increment (1 point per frame roughly, scaled by level)
    _state.score += _state.level * dt * 10;
    _state.score = Math.floor(_state.score);

    // 7n. Check level up
    _checkLevelUp();

    // Bug 5 fix: use SPACE_GAME.HUD (all caps); also pass timestamp for powerup alert timer
    SPACE_GAME.HUD.update(_state, performance.now());
  }

  // ─── Private: render ────────────────────────────────────────────────────────
  function _render() {
    // Clear canvas
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    // Background fill
    _ctx.fillStyle = '#000011';
    _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

    // Draw particles (behind everything)
    SPACE_GAME.Particles.draw(_ctx);

    // Draw obstacles
    SPACE_GAME.Obstacles.draw(_ctx);

    // Draw ship
    _drawShip();
  }

  // ─── Private: draw ship ──────────────────────────────────────────────────────
  function _drawShip() {
    const x = _state.shipX;
    const y = _state.shipY;

    _ctx.save();
    _ctx.translate(x, y);

    // Shield visual
    if (_state.powerup === 'shield') {
      _ctx.beginPath();
      _ctx.arc(0, 0, SHIP_RADIUS + 8, 0, Math.PI * 2);
      _ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
      _ctx.lineWidth   = 3;
      _ctx.stroke();

      const shieldGrad = _ctx.createRadialGradient(0, 0, SHIP_RADIUS, 0, 0, SHIP_RADIUS + 8);
      shieldGrad.addColorStop(0, 'rgba(0, 255, 255, 0.0)');
      shieldGrad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
      _ctx.fillStyle = shieldGrad;
      _ctx.fill();
    }

    // Engine glow
    const engineGrad = _ctx.createRadialGradient(0, 10, 0, 0, 10, 14);
    engineGrad.addColorStop(0, 'rgba(255, 140, 0, 0.9)');
    engineGrad.addColorStop(1, 'rgba(255, 60,  0, 0.0)');
    _ctx.beginPath();
    _ctx.arc(0, 10, 14, 0, Math.PI * 2);
    _ctx.fillStyle = engineGrad;
    _ctx.fill();

    // Ship body
    _ctx.beginPath();
    _ctx.moveTo(0, -SHIP_RADIUS);
    _ctx.lineTo(SHIP_RADIUS * 0.7,  SHIP_RADIUS * 0.6);
    _ctx.lineTo(0,                   SHIP_RADIUS * 0.2);
    _ctx.lineTo(-SHIP_RADIUS * 0.7,  SHIP_RADIUS * 0.6);
    _ctx.closePath();

    const shipColor = (_state.powerup === 'boost') ? '#ffff00' : '#00ffff';
    _ctx.fillStyle   = shipColor;
    _ctx.strokeStyle = '#ffffff';
    _ctx.lineWidth   = 1.5;
    _ctx.fill();
    _ctx.stroke();

    // Cockpit
    _ctx.beginPath();
    _ctx.arc(0, -4, 5, 0, Math.PI * 2);
    _ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    _ctx.fill();

    _ctx.restore();

    // Bug 8 fix: correct emit signature — emit(x, y, type, count)
    SPACE_GAME.Particles.emit(x, y + SHIP_RADIUS * 0.6, 'thrust', 1);
  }

  // ─── Private: game loop ──────────────────────────────────────────────────────
  function _loop(timestamp) {
    const dt        = (timestamp - _state.lastTime) / 1000;
    _state.lastTime = timestamp;
    const dtClamped = Math.min(dt, 0.05);

    if (_state.isPaused || _state.isGameOver || _state.isLevelingUp) {
      _state.rafId = requestAnimationFrame(_loop);
      return;
    }

    _update(dtClamped);
    _render();

    _state.rafId = requestAnimationFrame(_loop);
  }

  // ─── Public: init ────────────────────────────────────────────────────────────
  function init() {
    _canvas = document.getElementById('game-canvas');
    _ctx    = _canvas.getContext('2d');

    const stored = localStorage.getItem('spaceGameHighscore');
    _state.highscore = stored !== null ? Number(stored) : 0;

    _resetState();

    // Bug 1 fix: init() accepts no parameters
    SPACE_GAME.Obstacles.init();
    SPACE_GAME.Particles.reset();
    // Bug 5 fix: use SPACE_GAME.HUD (all caps)
    SPACE_GAME.HUD.init();
    SPACE_GAME.Audio.init();
    SPACE_GAME.Controls.setPauseCallback(_togglePause);

    if (!_listenersAttached) {
      _listenersAttached = true;

      document.getElementById('btn-start').addEventListener('click', function () {
        document.getElementById('screen-menu').classList.add('hidden');
        document.getElementById('screen-game').classList.remove('hidden');
        SPACE_GAME.Controls.activate();
        SPACE_GAME.Game.start();
      });

      document.getElementById('btn-restart').addEventListener('click', function () {
        document.getElementById('screen-gameover').classList.add('hidden');

        // Clean up level classes
        document.body.classList.remove('is-level-1', 'is-level-2', 'is-level-3');
        document.body.classList.add('is-level-1');

        // Clean up state classes
        const screenGame = document.getElementById('screen-game');
        screenGame.classList.remove('is-paused', 'is-damaged', 'is-boosted', 'is-shielded');

        // Bug 1 fix: init() accepts no parameters
        SPACE_GAME.Obstacles.init();
        SPACE_GAME.Particles.reset();
        // Bug 5 fix: use SPACE_GAME.HUD (all caps)
        SPACE_GAME.HUD.reset();

        _state.highscore = Number(localStorage.getItem('spaceGameHighscore')) || 0;
        _resetState();

        SPACE_GAME.Controls.activate();
        document.getElementById('screen-game').classList.remove('hidden');
        SPACE_GAME.Game.start();
      });

      document.getElementById('btn-resume').addEventListener('click', function () {
        SPACE_GAME.Game.resume();
      });
    }

    document.body.classList.remove('is-level-1', 'is-level-2', 'is-level-3');
    document.body.classList.add('is-level-1');
  }

  // ─── Public: start ───────────────────────────────────────────────────────────
  function start() {
    _state.lastTime = performance.now();
    _state.rafId    = requestAnimationFrame(_loop);
  }

  // ─── Public: stop (game over) ────────────────────────────────────────────────
  function stop() {
    cancelAnimationFrame(_state.rafId);
    _state.isGameOver = true;

    SPACE_GAME.Controls.deactivate();

    // Update highscore
    if (_state.score > _state.highscore) {
      _state.highscore = _state.score;
      localStorage.setItem('spaceGameHighscore', String(_state.highscore));
    }

    // Clean up state classes
    const screenGame = document.getElementById('screen-game');
    screenGame.classList.remove('is-paused', 'is-boosted', 'is-shielded');

    screenGame.classList.add('hidden');

    document.getElementById('gameover-score').textContent     = _state.score;
    document.getElementById('gameover-highscore').textContent = _state.highscore;
    document.getElementById('screen-gameover').classList.remove('hidden');
  }

  // ─── Public: pause ───────────────────────────────────────────────────────────
  function pause() {
    if (_state.isGameOver || _state.isPaused) return;
    _state.isPaused = true;
    document.getElementById('overlay-pause').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('is-paused');
  }

  // ─── Public: resume ──────────────────────────────────────────────────────────
  function resume() {
    if (!_state.isPaused) return;
    _state.isPaused = false;
    // Reset lastTime so dt doesn't spike after unpause
    _state.lastTime = performance.now();
    document.getElementById('overlay-pause').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('is-paused');
  }

  // ─── Public: getState ────────────────────────────────────────────────────────
  function getState() {
    return _state;
  }

  // ─── Expose public API ───────────────────────────────────────────────────────
  window.SPACE_GAME.Game = {
    init:     init,
    start:    start,
    stop:     stop,
    pause:    pause,
    resume:   resume,
    getState: getState
  };

})();