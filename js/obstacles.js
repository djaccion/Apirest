(function(SPACE_GAME) {

  // ─── Private State ───────────────────────────────────────────────────────────
  var _pool = [];
  var _config = null;

  // ─── Private: Create blank obstacle DTO ──────────────────────────────────────
  function _createBlankObstacle() {
    return {
      type:      'asteroid-small',
      x:         0,
      y:         0,
      vx:        0,
      vy:        0,
      radius:    0,
      rotation:  0,
      rotSpeed:  0,
      hp:        0,
      points:    0,
      active:    false,
      color:     '#ffffff'
    };
  }

  // ─── Private: Get first inactive obstacle from pool ──────────────────────────
  function _getInactive() {
    for (var i = 0; i < _pool.length; i++) {
      if (_pool[i].active === false) {
        return _pool[i];
      }
    }
    return null;
  }

  // ─── Private: Spawn config by type ───────────────────────────────────────────
  function _spawnConfig(type) {
    switch (type) {
      case 'asteroid-small':
        return {
          radius:   15,
          hp:       1,
          points:   10,
          color:    '#8B7355',
          rotSpeed: 0.5 + Math.random() * 1.5
        };
      case 'asteroid-medium':
        return {
          radius:   28,
          hp:       2,
          points:   25,
          color:    '#6B5B45',
          rotSpeed: 0.3 + Math.random() * 0.9
        };
      case 'asteroid-large':
        return {
          radius:   45,
          hp:       4,
          points:   50,
          color:    '#5A4A38',
          rotSpeed: 0.1 + Math.random() * 0.5
        };
      case 'enemy-drone':
        return {
          radius:   18,
          hp:       3,
          points:   100,
          color:    '#ff4444',
          rotSpeed: 0
        };
      default:
        return {
          radius:   15,
          hp:       1,
          points:   10,
          color:    '#8B7355',
          rotSpeed: 0.5 + Math.random() * 1.5
        };
    }
  }

  // ─── Private: Draw asteroid ───────────────────────────────────────────────────
  function _drawAsteroid(ctx, obstacle) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.rotation);

    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var r = obstacle.radius * (0.75 + Math.sin(i * 127.1) * 0.25);
      var vx = Math.cos(angle) * r;
      var vy = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(vx, vy);
      } else {
        ctx.lineTo(vx, vy);
      }
    }
    ctx.closePath();

    ctx.fillStyle   = obstacle.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ─── Private: Draw drone ──────────────────────────────────────────────────────
  function _drawDrone(ctx, obstacle) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    var r = obstacle.radius;

    // Body — hexagonal hull
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      var px = Math.cos(angle) * r;
      var py = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle   = obstacle.color;
    ctx.strokeStyle = '#ff8888';
    ctx.lineWidth   = 1.5;
    ctx.fill();
    ctx.stroke();

    // Core — inner circle
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaaaa';
    ctx.fill();

    // Wing left
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.2);
    ctx.lineTo(-r * 1.1, 0);
    ctx.lineTo(-r * 0.3,  r * 0.2);
    ctx.closePath();
    ctx.fillStyle   = '#cc2222';
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth   = 1;
    ctx.fill();
    ctx.stroke();

    // Wing right
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.2);
    ctx.lineTo(r * 1.1,  0);
    ctx.lineTo(r * 0.3,  r * 0.2);
    ctx.closePath();
    ctx.fillStyle   = '#cc2222';
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth   = 1;
    ctx.fill();
    ctx.stroke();

    // Engine glow — bottom
    ctx.beginPath();
    ctx.arc(0, r * 0.6, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 100, 0, 0.85)';
    ctx.fill();

    ctx.restore();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  /**
   * init()
   * Reads config, pre-fills the pool with blank inactive obstacles.
   * Bug 10 fix: CONFIG.OBSTACLES does not define POOL_SIZE — use a hardcoded
   * fallback constant of 64 so the pool is never empty.
   */
  var POOL_SIZE = 64;

  function init() {
    _config = SPACE_GAME.CONFIG;
    _pool   = [];

    for (var i = 0; i < POOL_SIZE; i++) {
      _pool.push(_createBlankObstacle());
    }
  }

  /**
   * spawn(type, canvasWidth, canvasHeight, speedMultiplier)
   * Activates one pooled obstacle of the given type.
   */
  function spawn(type, canvasWidth, canvasHeight, speedMultiplier) {
    var obstacle = _getInactive();
    if (obstacle === null) {
      return;
    }

    var cfg = _spawnConfig(type);

    obstacle.active   = true;
    obstacle.type     = type;
    obstacle.radius   = cfg.radius;
    obstacle.hp       = cfg.hp;
    obstacle.points   = cfg.points;
    obstacle.color    = cfg.color;
    obstacle.rotSpeed = cfg.rotSpeed;
    obstacle.rotation = Math.random() * Math.PI * 2;

    obstacle.x  = Math.random() * canvasWidth;
    obstacle.y  = -cfg.radius;

    var mult = (typeof speedMultiplier === 'number') ? speedMultiplier : 1;

    obstacle.vx = (-80 + Math.random() * 160) * mult;

    if (type === 'enemy-drone') {
      obstacle.vy = (120 + Math.random() * 160) * mult;
    } else {
      obstacle.vy = (80  + Math.random() * 120) * mult;
    }
  }

  /**
   * update(dt, canvasWidth, canvasHeight)
   * Advances physics for all active obstacles. dt is in SECONDS.
   */
  function update(dt, canvasWidth, canvasHeight) {
    for (var i = 0; i < _pool.length; i++) {
      var o = _pool[i];
      if (!o.active) { continue; }

      o.x        += o.vx * dt;
      o.y        += o.vy * dt;
      o.rotation += o.rotSpeed * dt;

      // Deactivate if out of bounds
      if (o.y > canvasHeight + o.radius) {
        o.active = false;
        continue;
      }
      if (o.x < -o.radius || o.x > canvasWidth + o.radius) {
        o.active = false;
      }
    }
  }

  /**
   * draw(ctx)
   * Renders all active obstacles onto the canvas context.
   */
  function draw(ctx) {
    for (var i = 0; i < _pool.length; i++) {
      var o = _pool[i];
      if (!o.active) { continue; }

      if (o.type === 'enemy-drone') {
        _drawDrone(ctx, o);
      } else {
        _drawAsteroid(ctx, o);
      }
    }
  }

  /**
   * checkCollision(entity)
   * Checks circle-circle collision between entity and every active obstacle.
   * entity must have { x, y, radius } properties.
   * Returns the first obstacle hit, or null if none.
   */
  function checkCollision(entity) {
    for (var i = 0; i < _pool.length; i++) {
      var o = _pool[i];
      if (!o.active) { continue; }

      var dx   = entity.x - o.x;
      var dy   = entity.y - o.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < entity.radius + o.radius) {
        return o;
      }
    }
    return null;
  }

  /**
   * damage(obstacle, amount)
   * Reduces hp by amount. Deactivates obstacle if hp reaches 0.
   * Returns true if the obstacle was destroyed.
   */
  function damage(obstacle, amount) {
    obstacle.hp -= amount;
    if (obstacle.hp <= 0) {
      obstacle.active = false;
      return true;
    }
    return false;
  }

  /**
   * reset()
   * Deactivates all obstacles in the pool (used on game restart).
   */
  function reset() {
    for (var i = 0; i < _pool.length; i++) {
      _pool[i].active = false;
    }
  }

  /**
   * getPool()
   * Returns the raw pool array (read-only intent — for game.js iteration).
   */
  function getPool() {
    return _pool;
  }

  // ─── Register on namespace ────────────────────────────────────────────────────
  SPACE_GAME.Obstacles = {
    init:           init,
    spawn:          spawn,
    update:         update,
    draw:           draw,
    checkCollision: checkCollision,
    damage:         damage,
    reset:          reset,
    getPool:        getPool
  };

})(window.SPACE_GAME = window.SPACE_GAME || {});