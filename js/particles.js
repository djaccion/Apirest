(function(global) {
  'use strict';

  const POOL_SIZE = 300;

  const _pool = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    _pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      radius: 0,
      color: '#ffffff',
      type: 'explosion'
    });
  }

  function _getInactive() {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (_pool[i].active === false) {
        return _pool[i];
      }
    }
    return null;
  }

  function emit(x, y, type, count) {
    var explosionColors = ['#ff4444', '#ff8800', '#ffff00'];
    var thrustColors = ['#00ffff', '#ffffff', '#aaaaff'];

    for (var i = 0; i < count; i++) {
      var p = _getInactive();
      if (p === null) {
        break;
      }

      p.active = true;
      p.x = x;
      p.y = y;
      p.type = type;

      if (type === 'explosion') {
        p.vx = Math.random() * 200 - 100;
        p.vy = Math.random() * 200 - 100;
        p.life = 0.4 + Math.random() * 0.4;
        p.maxLife = p.life;
        p.radius = 2 + Math.random() * 4;
        p.color = explosionColors[Math.floor(Math.random() * explosionColors.length)];

      } else if (type === 'thrust') {
        p.vx = Math.random() * 40 - 20;
        p.vy = 60 + Math.random() * 60;
        p.life = 0.1 + Math.random() * 0.15;
        p.maxLife = p.life;
        p.radius = 1 + Math.random() * 2;
        p.color = thrustColors[Math.floor(Math.random() * thrustColors.length)];

      } else if (type === 'pickup') {
        var angle = Math.random() * Math.PI * 2;
        var speed = 40 + Math.random() * 60;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0.5 + Math.random() * 0.3;
        p.maxLife = p.life;
        p.radius = 2 + Math.random() * 3;
        p.color = '#ffff00';
      }
    }
  }

  function update(dt) {
    for (var i = 0; i < POOL_SIZE; i++) {
      var p = _pool[i];
      if (p.active === true) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
        }
      }
    }
  }

  function draw(ctx) {
    for (var i = 0; i < POOL_SIZE; i++) {
      var p = _pool[i];
      if (p.active === true) {
        var alpha = p.life / p.maxLife;

        ctx.save();

        if (p.type === 'explosion') {
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  function reset() {
    for (var i = 0; i < POOL_SIZE; i++) {
      _pool[i].active = false;
    }
  }

  global.SPACE_GAME = global.SPACE_GAME || {};
  global.SPACE_GAME.Particles = { emit: emit, update: update, draw: draw, reset: reset };

})(window);