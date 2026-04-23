window.GalaxyGame = window.GalaxyGame || {};
window.GalaxyGame.Obstacles = {};

(function (Obstacles) {

    var TYPES = {
        COMET:    'comet',
        ASTEROID: 'asteroid',
        PLANET:   'planet',
        UFO:      'ufo',
        METEOR:   'meteor'
    };

    var POWERUP_TYPES = {
        SHIELD: 'shield',
        TURBO:  'turbo',
        MAGNET: 'magnet'
    };

    function _rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function _randInt(min, max) {
        return Math.floor(_rand(min, max + 1));
    }

    function _sign() {
        return Math.random() < 0.5 ? -1 : 1;
    }

    function _lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function _createComet(cw, ch, dm) {
        var spawnEdge = _randInt(0, 2);
        var x, y, vx, vy;
        var radius = _rand(8, 14);
        var speedMag = _rand(150, 300) * dm;

        if (spawnEdge === 0) {
            x  = _rand(0, cw);
            y  = -radius * 2;
            vx = _sign() * _rand(80, 200) * dm;
            vy = speedMag;
        } else if (spawnEdge === 1) {
            x  = -radius * 2;
            y  = _rand(0, ch * 0.6);
            vx = _rand(150, 300) * dm;
            vy = _rand(100, 250) * dm;
        } else {
            x  = cw + radius * 2;
            y  = _rand(0, ch * 0.6);
            vx = -_rand(150, 300) * dm;
            vy = _rand(100, 250) * dm;
        }

        return {
            type:     TYPES.COMET,
            x:        x,
            y:        y,
            vx:       vx,
            vy:       vy,
            radius:   radius,
            width:    radius * 2,
            height:   radius * 2,
            rotation: Math.atan2(vy, vx),
            rotSpeed: 0,
            hp:       1,
            points:   15,
            active:   true,
            color:    '#00FFFF',
            trail:    []
        };
    }

    function _createAsteroid(cw, ch, dm) {
        var radius = _rand(20, 35);
        var x      = _rand(radius, cw - radius);
        var y      = -radius * 2;
        var vxBase = _sign() * _rand(20, 60) * dm;
        var vy     = _rand(80, 160) * dm;

        return {
            type:        TYPES.ASTEROID,
            x:           x,
            y:           y,
            vx:          vxBase,
            vy:          vy,
            radius:      radius,
            width:       radius * 2,
            height:      radius * 2,
            rotation:    _rand(0, Math.PI * 2),
            rotSpeed:    _sign() * _rand(0.5, 2.0),
            hp:          2,
            points:      25,
            active:      true,
            color:       '#FF8800',
            vxBase:      vxBase,
            wobbleTimer: 0,
            wobbleFreq:  _rand(1.5, 3.5),
            wobbleAmp:   _rand(40, 90) * dm
        };
    }

    function _createPlanet(cw, ch, dm) {
        var radius = _rand(45, 70);
        var x      = _rand(radius, cw - radius);
        var y      = -radius * 2;
        var vy     = _rand(30, 60) * dm;

        return {
            type:       TYPES.PLANET,
            x:          x,
            y:          y,
            vx:         0,
            vy:         vy,
            radius:     radius,
            width:      radius * 2,
            height:     radius * 2,
            rotation:   0,
            rotSpeed:   _sign() * _rand(0.05, 0.2),
            hp:         5,
            points:     50,
            active:     true,
            color:      '#AA44FF',
            ringAngle:  Math.random() * Math.PI
        };
    }

    function _createUFO(cw, ch, dm) {
        var spawnLeft = Math.random() < 0.5;
        var radius    = _rand(22, 28);
        var x         = spawnLeft ? -radius * 2 : cw + radius * 2;
        var y         = _rand(ch * 0.1, ch * 0.5);
        var speed     = _rand(80, 140) * dm;
        var vx        = spawnLeft ? speed : -speed;

        return {
            type:          TYPES.UFO,
            x:             x,
            y:             y,
            vx:            vx,
            vy:            0,
            radius:        radius,
            width:         radius * 2,
            height:        radius * 2,
            rotation:      0,
            rotSpeed:      0,
            hp:            3,
            points:        75,
            active:        true,
            color:         '#FF00FF',
            targetX:       cw / 2,
            targetY:       ch / 2,
            speed:         speed,
            shootTimer:    0,
            shootCooldown: 2.5
        };
    }

    function _createMeteor(cw, ch, dm, offsetX, baseY) {
        var radius = _rand(5, 9);
        var x      = (offsetX !== undefined) ? offsetX : _rand(radius, cw - radius);
        var y      = (baseY  !== undefined)  ? baseY   : -radius * 2;

        return {
            type:     TYPES.METEOR,
            x:        x,
            y:        y,
            vx:       _sign() * _rand(0, 20) * dm,
            vy:       _rand(200, 350) * dm,
            radius:   radius,
            width:    radius * 2,
            height:   radius * 2,
            rotation: _rand(0, Math.PI * 2),
            rotSpeed: _sign() * _rand(1.0, 4.0),
            hp:       1,
            points:   10,
            active:   true,
            color:    '#FF4444'
        };
    }

    var POWERUP_COLORS = {
        shield: '#00FFFF',
        turbo:  '#FFFF00',
        magnet: '#FF00FF'
    };

    function _createPowerUp(cw, ch, type) {
        var radius = 14;
        var x      = _rand(radius + 10, cw - radius - 10);

        return {
            type:        type,
            x:           x,
            y:           -20,
            vx:          0,
            vy:          _rand(60, 80),
            radius:      radius,
            width:       28,
            height:      28,
            active:      true,
            pulseTimer:  0,
            color:       POWERUP_COLORS[type] || '#FFFFFF'
        };
    }

    function _updateUFO(ufo, shipX, shipY, dt) {
        var dx     = shipX - ufo.x;
        var dy     = shipY - ufo.y;
        var dist   = Math.sqrt(dx * dx + dy * dy) || 1;
        var dirX   = dx / dist;
        var dirY   = dy / dist;

        var lerpFactor = Math.min(dt * 2.5, 1);
        ufo.vx = _lerp(ufo.vx, dirX * ufo.speed, lerpFactor);
        ufo.vy = _lerp(ufo.vy, dirY * ufo.speed, lerpFactor);

        ufo.shootTimer += dt;
    }

    function _updateObstacle(obs, dt, shipX, shipY) {
        if (obs.type === TYPES.UFO) {
            _updateUFO(obs, shipX, shipY, dt);
        }

        if (obs.type === TYPES.ASTEROID) {
            obs.wobbleTimer += dt;
            obs.vx = obs.vxBase + Math.sin(obs.wobbleTimer * obs.wobbleFreq) * obs.wobbleAmp;
        }

        if (obs.pulseTimer !== undefined) {
            obs.pulseTimer += dt;
        }

        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;

        obs.rotation += obs.rotSpeed * dt;
    }

    function _isOutOfBounds(obs, cw, ch) {
        var margin = (obs.radius || 40) * 3;
        return (
            obs.y > ch + margin  ||
            obs.y < -margin      ||
            obs.x > cw + margin  ||
            obs.x < -margin
        );
    }

    Obstacles.spawnRandom = function (cw, ch, difficultyMult) {
        var dm   = difficultyMult || 1;
        var roll = Math.random();
        if (roll < 0.25)       return _createComet(cw, ch, dm);
        else if (roll < 0.55)  return _createAsteroid(cw, ch, dm);
        else if (roll < 0.70)  return _createPlanet(cw, ch, dm);
        else if (roll < 0.90)  return _createUFO(cw, ch, dm);
        else                   return _createMeteor(cw, ch, dm);
    };

    Obstacles.spawnByType = function (type, cw, ch, difficultyMult) {
        var dm = difficultyMult || 1;
        switch (type) {
            case TYPES.COMET:    return _createComet(cw, ch, dm);
            case TYPES.ASTEROID: return _createAsteroid(cw, ch, dm);
            case TYPES.PLANET:   return _createPlanet(cw, ch, dm);
            case TYPES.UFO:      return _createUFO(cw, ch, dm);
            case TYPES.METEOR:   return _createMeteor(cw, ch, dm);
            default:
                console.warn('[Obstacles] Tipo desconocido: ' + type);
                return _createAsteroid(cw, ch, dm);
        }
    };

    Obstacles.spawnMeteorSwarm = function (cw, ch, difficultyMult) {
        var dm      = difficultyMult || 1;
        var count   = _randInt(4, 7);
        var swarm   = [];
        var centerX = _rand(60, cw - 60);
        var baseY   = _rand(-60, -20);
        var spread  = 40;

        for (var i = 0; i < count; i++) {
            var offsetX = centerX + _rand(-spread, spread);
            var offsetY = baseY   + _rand(-15, 15);
            offsetX = Math.max(10, Math.min(cw - 10, offsetX));
            swarm.push(_createMeteor(cw, ch, dm, offsetX, offsetY));
        }
        return swarm;
    };

    Obstacles.spawnPowerUp = function (cw, ch) {
        var types = [POWERUP_TYPES.SHIELD, POWERUP_TYPES.TURBO, POWERUP_TYPES.MAGNET];
        var type  = types[_randInt(0, 2)];
        return _createPowerUp(cw, ch, type);
    };

    Obstacles.spawnPowerUpByType = function (type, cw, ch) {
        return _createPowerUp(cw, ch, type);
    };

    Obstacles.updateAll = function (obstacleList, dt, shipX, shipY, cw, ch) {
        var i;
        for (i = 0; i < obstacleList.length; i++) {
            var obs = obstacleList[i];
            if (!obs.active) continue;
            _updateObstacle(obs, dt, shipX, shipY);
            if (_isOutOfBounds(obs, cw, ch)) {
                obs.active = false;
            }
        }
    };

    Obstacles.updatePowerUps = function (powerUpList, dt, cw, ch) {
        var i;
        for (i = 0; i < powerUpList.length; i++) {
            var pu = powerUpList[i];
            if (!pu.active) continue;
            pu.pulseTimer += dt;
            pu.x += pu.vx * dt;
            pu.y += pu.vy * dt;
            if (_isOutOfBounds(pu, cw, ch)) {
                pu.active = false;
            }
        }
    };

    Obstacles.filterActive = function (list) {
        var result = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].active) result.push(list[i]);
        }
        return result;
    };

    Obstacles.destroy = function (obs) {
        obs.active = false;
    };

    Obstacles.hit = function (obs, damage) {
        var dmg = (damage !== undefined) ? damage : 1;
        obs.hp -= dmg;
        if (obs.hp <= 0) {
            obs.active = false;
            return true;
        }
        return false;
    };

    Obstacles.isOutOfBounds = function (obs, cw, ch) {
        var canvasWidth  = cw  !== undefined ? cw  : (window.GalaxyGame && window.GalaxyGame.Config ? window.GalaxyGame.Config.CANVAS.WIDTH  : 800);
        var canvasHeight = ch  !== undefined ? ch  : (window.GalaxyGame && window.GalaxyGame.Config ? window.GalaxyGame.Config.CANVAS.HEIGHT : 600);
        return _isOutOfBounds(obs, canvasWidth, canvasHeight);
    };

    Obstacles.TYPES        = TYPES;
    Obstacles.POWERUP_TYPES = POWERUP_TYPES;

}(window.GalaxyGame.Obstacles));