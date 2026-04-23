window.GalaxyGame = window.GalaxyGame || {};
window.GalaxyGame.Entities = {};

// ─────────────────────────────────────────────
// SHIP
// ─────────────────────────────────────────────
GalaxyGame.Entities.Ship = function(x, y) {
    var cfg = GalaxyGame.Config;
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 0;
    this.lives = 3;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.activePowerUp = null;
    this.powerUpTimer = 0;
    this.width = cfg.PLAYER.WIDTH;
    this.height = cfg.PLAYER.HEIGHT;
};

GalaxyGame.Entities.Ship.prototype.update = function(deltaTime, inputState, hasTurbo) {
    var cfg = GalaxyGame.Config;
    var ROTATION_SPEED = cfg.PLAYER.ROTATION_SPEED;
    var ACCELERATION    = cfg.PLAYER.ACCELERATION;
    var DECELERATION    = cfg.PLAYER.DECELERATION;
    var MAX_SPEED       = cfg.PLAYER.MAX_SPEED;
    var MIN_SPEED       = cfg.PLAYER.MIN_SPEED;
    var TURBO_MULT      = cfg.PLAYER.TURBO_MULTIPLIER;
    var CW              = cfg.CANVAS.WIDTH;
    var CH              = cfg.CANVAS.HEIGHT;

    // 1. Rotación
    if (inputState.left) {
        this.angle -= ROTATION_SPEED * deltaTime;
    }
    if (inputState.right) {
        this.angle += ROTATION_SPEED * deltaTime;
    }

    // 2. Aceleración
    if (inputState.up) {
        this.speed += ACCELERATION * deltaTime;
        var maxSpeed = (hasTurbo || this.activePowerUp === 'turbo')
            ? MAX_SPEED * TURBO_MULT
            : MAX_SPEED;
        this.speed = Math.min(this.speed, maxSpeed);
    }

    // 3. Frenado
    if (inputState.down) {
        this.speed -= DECELERATION * deltaTime;
        this.speed = Math.max(this.speed, MIN_SPEED);
    }

    // 4. Fricción pasiva
    if (!inputState.up && !inputState.down) {
        this.speed *= (1 - 0.05 * deltaTime);
        this.speed = Math.max(this.speed, 0);
    }

    // 5. Actualizar velocidad vectorial
    this.velocityX = Math.cos(this.angle) * this.speed;
    this.velocityY = Math.sin(this.angle) * this.speed;

    // 6. Mover posición
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // 7. Wrap de pantalla
    if (this.x < 0)  { this.x = CW; }
    if (this.x > CW) { this.x = 0; }
    if (this.y < 0)  { this.y = CH; }
    if (this.y > CH) { this.y = 0; }

    // 8. Decrementar timers
    if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= deltaTime;
        if (this.invulnerableTimer <= 0) {
            this.isInvulnerable = false;
            this.invulnerableTimer = 0;
        }
    }

    if (this.powerUpTimer > 0) {
        this.powerUpTimer -= deltaTime;
        if (this.powerUpTimer <= 0) {
            this.activePowerUp = null;
            this.powerUpTimer = 0;
        }
    }
};

GalaxyGame.Entities.Ship.prototype.takeDamage = function() {
    if (this.isInvulnerable) { return; }
    if (this.activePowerUp === 'shield') { return; }
    this.lives -= 1;
    this.isInvulnerable = true;
    this.invulnerableTimer = GalaxyGame.Config.PLAYER.INVINCIBILITY_FRAMES / 60;
};

GalaxyGame.Entities.Ship.prototype.applyPowerUp = function(type, duration) {
    this.activePowerUp = type;
    this.powerUpTimer = duration;
    if (type === 'shield') {
        this.isInvulnerable = true;
        this.invulnerableTimer = duration;
    }
};

// ─────────────────────────────────────────────
// OBSTACLE
// ─────────────────────────────────────────────
GalaxyGame.Entities.Obstacle = function(type, x, y, speedMultiplier) {
    var cfg = GalaxyGame.Config;
    var obsCfg = cfg.OBSTACLES;

    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;

    var typeCfg;
    if (type === 'comet')     { typeCfg = obsCfg.COMET; }
    else if (type === 'asteroid')  { typeCfg = obsCfg.ASTEROID; }
    else if (type === 'planet')    { typeCfg = obsCfg.PLANET; }
    else if (type === 'ufo')       { typeCfg = obsCfg.UFO; }
    else if (type === 'meteorite') { typeCfg = obsCfg.METEORITE; }
    else                           { typeCfg = obsCfg.ASTEROID; }

    this.radius = (typeCfg.width / 2);
    this.width  = typeCfg.width;
    this.height = typeCfg.height;
    this.points = typeCfg.points;
    this.color  = typeCfg.color;

    if (type === 'ufo') {
        this.angle = 0;
    } else {
        this.angle = GalaxyGame.Utils.randomBetween(0, Math.PI * 2);
    }

    var baseSpeed = typeCfg.baseSpeed * (speedMultiplier || 1);

    if (type === 'comet') {
        this.velocityX = Math.cos(this.angle) * baseSpeed * 1.8;
        this.velocityY = Math.sin(this.angle) * baseSpeed * 1.8;
    } else if (type === 'asteroid') {
        this.velocityX = GalaxyGame.Utils.randomBetween(-baseSpeed, baseSpeed);
        this.velocityY = GalaxyGame.Utils.randomBetween(-baseSpeed, baseSpeed);
    } else if (type === 'planet') {
        this.velocityX = Math.cos(this.angle) * baseSpeed * 0.4;
        this.velocityY = Math.sin(this.angle) * baseSpeed * 0.4;
    } else if (type === 'ufo') {
        this.velocityX = Math.cos(this.angle) * baseSpeed;
        this.velocityY = Math.sin(this.angle) * baseSpeed;
    } else if (type === 'meteorite') {
        this.velocityX = GalaxyGame.Utils.randomBetween(-baseSpeed, baseSpeed) * 1.2;
        this.velocityY = GalaxyGame.Utils.randomBetween(-baseSpeed, baseSpeed) * 1.2;
    } else {
        this.velocityX = Math.cos(this.angle) * baseSpeed;
        this.velocityY = Math.sin(this.angle) * baseSpeed;
    }
};

GalaxyGame.Entities.Obstacle.prototype.update = function(deltaTime, shipX, shipY) {
    var CW = GalaxyGame.Config.CANVAS.WIDTH;
    var CH = GalaxyGame.Config.CANVAS.HEIGHT;

    if (this.type === 'ufo') {
        var dx = shipX - this.x;
        var dy = shipY - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            var ufoSpeed = Math.sqrt(
                this.velocityX * this.velocityX + this.velocityY * this.velocityY
            );
            if (ufoSpeed === 0) {
                ufoSpeed = GalaxyGame.Config.OBSTACLES.UFO.baseSpeed;
            }
            this.velocityX = (dx / dist) * ufoSpeed;
            this.velocityY = (dy / dist) * ufoSpeed;
        }
    }

    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    var margin = this.radius;
    if (this.x < -margin)        { this.x = CW + margin; }
    if (this.x > CW + margin)    { this.x = -margin; }
    if (this.y < -margin)        { this.y = CH + margin; }
    if (this.y > CH + margin)    { this.y = -margin; }
};

// ─────────────────────────────────────────────
// POWERUP
// ─────────────────────────────────────────────
GalaxyGame.Entities.PowerUp = function(type, x, y) {
    var cfg = GalaxyGame.Config;
    var puCfg;
    if (type === 'shield')      { puCfg = cfg.POWERUPS.SHIELD; }
    else if (type === 'turbo')  { puCfg = cfg.POWERUPS.TURBO; }
    else if (type === 'magnet') { puCfg = cfg.POWERUPS.MAGNET; }
    else                        { puCfg = cfg.POWERUPS.SHIELD; }

    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.radius = 14;
    this.width  = this.radius * 2;
    this.height = this.radius * 2;
    this.duration = puCfg.durationFrames / 60;
    this.color = puCfg.color;
    this.angle = 0;
    this.floatTimer = 0;
    this.floatAmplitude = 4;
    this.floatSpeed = 2;
    this.baseY = y;
};

GalaxyGame.Entities.PowerUp.prototype.update = function(deltaTime) {
    this.floatTimer += deltaTime;
    this.y = this.baseY + Math.sin(this.floatTimer * this.floatSpeed) * this.floatAmplitude;
    this.angle += 1.5 * deltaTime;
};

// ─────────────────────────────────────────────
// PARTICLE
// ─────────────────────────────────────────────
GalaxyGame.Entities.Particle = function(x, y, velocityX, velocityY, color, life, radius) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.radius = radius !== undefined ? radius : 2;
    this.active = true;
};

GalaxyGame.Entities.Particle.prototype.update = function(deltaTime) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.life -= deltaTime;
    this.velocityX *= (1 - 0.8 * deltaTime);
    this.velocityY *= (1 - 0.8 * deltaTime);
    if (this.life <= 0) {
        this.active = false;
        this.life = 0;
    }
};

Object.defineProperty(GalaxyGame.Entities.Particle.prototype, 'alpha', {
    get: function() {
        return this.maxLife > 0 ? Math.max(0, this.life / this.maxLife) : 0;
    }
});