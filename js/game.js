window.GalaxyGame = window.GalaxyGame || {};

GalaxyGame.Game = (function () {

    // ─── Estado de la máquina ───────────────────────────────────────────────
    let _state = 'menu';

    // ─── Referencias DOM ────────────────────────────────────────────────────
    let _canvasWrapper = null;
    let _screens = {};
    let _hud = {};

    // ─── Estado de partida ──────────────────────────────────────────────────
    let _score = 0;
    let _lives = 3;
    let _level = 1;
    let _difficulty = 'easy';
    let _highScore = 0;
    let _activePowerUp = null;
    let _powerUpTimer = 0;

    // ─── Game loop ──────────────────────────────────────────────────────────
    let _lastTimestamp = 0;
    let _rafId = null;

    // ─── Entidades ──────────────────────────────────────────────────────────
    let _ship = null;
    let _obstacles = [];
    let _powerUps = [];
    let _particles = [];
    let _stars = [];

    // ─── Timers de spawn ────────────────────────────────────────────────────
    let _obstacleSpawnTimer = 0;
    let _powerUpSpawnTimer = 0;

    // ─── Puntuación por tiempo ──────────────────────────────────────────────
    let _scoreAccumulator = 0;

    // ─── Level-up banner ────────────────────────────────────────────────────
    let _levelUpTimer = 0;
    let _levelUpLabel = '';

    // ─── Invulnerabilidad tras daño ─────────────────────────────────────────
    let _invincibleTimer = 0;

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN
    // ═══════════════════════════════════════════════════════════════════════

    function _getDifficultyConfig() {
        var configs = {
            easy:   { obstacleInterval: 2000, speedMultiplier: 1.0, lives: 5, scoreRate: 1 },
            medium: { obstacleInterval: 1200, speedMultiplier: 1.5, lives: 3, scoreRate: 2 },
            hard:   { obstacleInterval: 700,  speedMultiplier: 2.2, lives: 1, scoreRate: 3 }
        };
        return configs[_difficulty] || configs.easy;
    }

    function _getLevelConfig() {
        var levels = {
            1: { speedBonus: 0,   spawnBonus: 0,   label: 'NEBULOSA'      },
            2: { speedBonus: 0.4, spawnBonus: 300,  label: 'GALAXIA'       },
            3: { speedBonus: 0.9, spawnBonus: 600,  label: 'AGUJERO NEGRO' }
        };
        return levels[_level] || levels[1];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PANTALLAS Y ESTADO
    // ═══════════════════════════════════════════════════════════════════════

    function _showScreen(screenId) {
        ['screen-start', 'screen-game', 'screen-gameover', 'screen-pause'].forEach(function (id) {
            document.getElementById(id).classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    function _setGameState(newState) {
        _state = newState;
        _canvasWrapper.classList.remove('is-running', 'is-paused', 'is-gameover');

        if (newState === 'playing') {
            _canvasWrapper.classList.add('is-running');
            _showScreen('screen-game');
        } else if (newState === 'paused') {
            _canvasWrapper.classList.add('is-paused');
            _showScreen('screen-pause');
        } else if (newState === 'gameover') {
            _canvasWrapper.classList.add('is-gameover');
            _showScreen('screen-gameover');
        } else if (newState === 'menu') {
            _showScreen('screen-start');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET Y HUD
    // ═══════════════════════════════════════════════════════════════════════

    function _resetGame() {
        var config = _getDifficultyConfig();
        _score = 0;
        _lives = config.lives;
        _level = 1;
        _activePowerUp = null;
        _powerUpTimer = 0;
        _obstacles = [];
        _powerUps = [];
        _particles = [];
        _obstacleSpawnTimer = 0;
        _powerUpSpawnTimer = 0;
        _scoreAccumulator = 0;
        _lastTimestamp = 0;
        _levelUpTimer = 0;
        _levelUpLabel = '';
        _invincibleTimer = 0;

        // Bug 16 corregido: Ship(x, y) requiere coordenadas; usar las de config
        var startX = GalaxyGame.Config.PLAYER.START_X;
        var startY = GalaxyGame.Config.PLAYER.START_Y;
        _ship = new GalaxyGame.Entities.Ship(startX, startY);

        GalaxyGame.Controls.reset();
        _updateHUD();
    }

    function _updateHUD() {
        _hud.scoreValue.textContent = _score;
        _hud.livesValue.textContent = _lives;
        _hud.levelValue.textContent = _getLevelConfig().label;

        if (_activePowerUp) {
            _hud.powerupContainer.classList.remove('hidden');
            _hud.powerupValue.textContent = _activePowerUp.type.toUpperCase()
                + ' ' + Math.ceil(_activePowerUp.timeLeft / 1000) + 's';
        } else {
            _hud.powerupContainer.classList.add('hidden');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPAWN
    // ═══════════════════════════════════════════════════════════════════════

    function _spawnObstacle(dt) {
        var diffCfg  = _getDifficultyConfig();
        var levelCfg = _getLevelConfig();
        var interval = diffCfg.obstacleInterval - levelCfg.spawnBonus;
        if (interval < 300) { interval = 300; }

        _obstacleSpawnTimer += dt;
        if (_obstacleSpawnTimer >= interval) {
            _obstacleSpawnTimer = 0;
            var speedMult = diffCfg.speedMultiplier + levelCfg.speedBonus;
            // Bug 1 corregido: nombre incorrecto y firma diferente
            // Era: GalaxyGame.Obstacles.createRandom(speedMult)
            // Debe ser: GalaxyGame.Obstacles.spawnRandom(cw, ch, difficultyMult)
            var cw = GalaxyGame.Config.CANVAS.WIDTH;
            var ch = GalaxyGame.Config.CANVAS.HEIGHT;
            var obstacle = GalaxyGame.Obstacles.spawnRandom(cw, ch, speedMult);
            if (obstacle) { _obstacles.push(obstacle); }
        }
    }

    function _spawnPowerUp(dt) {
        var interval = 8000;
        _powerUpSpawnTimer += dt;
        if (_powerUpSpawnTimer >= interval) {
            _powerUpSpawnTimer = 0;
            // Bug 2 corregido: nombre incorrecto y firma diferente
            // Era: GalaxyGame.Obstacles.createPowerUp()
            // Debe ser: GalaxyGame.Obstacles.spawnPowerUp(cw, ch)
            var cw = GalaxyGame.Config.CANVAS.WIDTH;
            var ch = GalaxyGame.Config.CANVAS.HEIGHT;
            var pu = GalaxyGame.Obstacles.spawnPowerUp(cw, ch);
            if (pu) { _powerUps.push(pu); }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COLISIONES
    // ═══════════════════════════════════════════════════════════════════════

    function _checkCollisions() {
        if (!_ship) { return; }

        var i, obs, pu, hit;

        // Obstáculos
        for (i = _obstacles.length - 1; i >= 0; i--) {
            obs = _obstacles[i];
            hit = GalaxyGame.Utils.checkAABB(_ship, obs);
            if (hit) {
                _obstacles.splice(i, 1);
                _onShipHit(obs);
            }
        }

        // Power-ups
        for (i = _powerUps.length - 1; i >= 0; i--) {
            pu = _powerUps[i];
            hit = GalaxyGame.Utils.checkAABB(_ship, pu);
            if (hit) {
                _powerUps.splice(i, 1);
                _onPowerUpCollected(pu);
            }
        }
    }

    function _onShipHit(obs) {
        if (_invincibleTimer > 0) { return; }

        var shielded = _activePowerUp && _activePowerUp.type === 'shield';
        if (shielded) {
            _activePowerUp = null;
            _canvasWrapper.classList.remove('is-shielded');
            GalaxyGame.Audio.playExplosion();
            _spawnParticles(obs.x, obs.y, '#00ffff', 12);
            _updateHUD();
            return;
        }

        _lives -= 1;
        _invincibleTimer = 2000;
        GalaxyGame.Audio.playExplosion();
        _spawnParticles(obs.x, obs.y, '#ff4444', 18);
        _updateHUD();

        if (_lives <= 0) {
            _triggerGameOver();
        }
    }

    function _onPowerUpCollected(pu) {
        GalaxyGame.Audio.playPowerUp();
        _activePowerUp = { type: pu.type, timeLeft: 8000 };
        _powerUpTimer  = 8000;

        _canvasWrapper.classList.remove('is-shielded', 'is-boosted', 'is-agile');
        if (pu.type === 'shield') {
            _canvasWrapper.classList.add('is-shielded');
        } else if (pu.type === 'turbo') {
            _canvasWrapper.classList.add('is-boosted');
        } else if (pu.type === 'magnet') {
            _canvasWrapper.classList.add('is-agile');
        }

        _score += 50 * _getDifficultyConfig().scoreRate;
        _spawnParticles(pu.x, pu.y, '#ffff00', 14);
        _updateHUD();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARTÍCULAS
    // ═══════════════════════════════════════════════════════════════════════

    function _spawnParticles(x, y, color, count) {
        var cfg = GalaxyGame.Config.PARTICLES;
        for (var i = 0; i < count; i++) {
            // Bug 17 corregido: Particle(x, y, velocityX, velocityY, color, life, radius)
            // Era: new GalaxyGame.Entities.Particle(x, y, color) — faltan velocityX, velocityY, life
            var angle = Math.random() * Math.PI * 2;
            var speed = GalaxyGame.Utils.randomBetween(cfg.MIN_SPEED, cfg.MAX_SPEED);
            var vx    = Math.cos(angle) * speed;
            var vy    = Math.sin(angle) * speed;
            var life  = cfg.LIFETIME_FRAMES / 60;
            _particles.push(new GalaxyGame.Entities.Particle(x, y, vx, vy, color, life, 2));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUNTUACIÓN Y NIVELES
    // ═══════════════════════════════════════════════════════════════════════

    function _updateScore(dt) {
        var config = _getDifficultyConfig();
        _scoreAccumulator += dt;
        if (_scoreAccumulator >= 1000) {
            _scoreAccumulator -= 1000;
            _score += config.scoreRate;
            _checkLevelUp();
            _updateHUD();
        }
    }

    function _checkLevelUp() {
        var newLevel = _level;
        if (_score >= 200 && _level < 2) { newLevel = 2; }
        if (_score >= 600 && _level < 3) { newLevel = 3; }

        if (newLevel !== _level) {
            _level = newLevel;
            _levelUpLabel = _getLevelConfig().label;
            _levelUpTimer = 3000;
            GalaxyGame.Audio.playLevelUp();
            _canvasWrapper.classList.add('is-level-up');
        }
    }

    function _updateLevelUpBanner(dt) {
        if (_levelUpTimer <= 0) { return; }
        _levelUpTimer -= dt;
        if (_levelUpTimer <= 0) {
            _levelUpTimer = 0;
            _canvasWrapper.classList.remove('is-level-up');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POWER-UP TIMER
    // ═══════════════════════════════════════════════════════════════════════

    function _updatePowerUpTimer(dt) {
        if (!_activePowerUp) { return; }
        _activePowerUp.timeLeft -= dt;
        if (_activePowerUp.timeLeft <= 0) {
            _canvasWrapper.classList.remove('is-shielded', 'is-boosted', 'is-agile');
            _activePowerUp = null;
            _updateHUD();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INVULNERABILIDAD
    // ═══════════════════════════════════════════════════════════════════════

    function _updateInvincibility(dt) {
        if (_invincibleTimer <= 0) { return; }
        _invincibleTimer -= dt;
        if (_invincibleTimer < 0) { _invincibleTimer = 0; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTUALIZACIÓN DE ENTIDADES
    // ═══════════════════════════════════════════════════════════════════════

    function _updateShip(dt) {
        if (!_ship) { return; }
        var controls = GalaxyGame.Controls.getState();
        var hasTurbo = _activePowerUp && _activePowerUp.type === 'turbo';
        _ship.update(dt, controls, hasTurbo);
    }

    function _updateObstacles(dt) {
        var cw = GalaxyGame.Config.CANVAS.WIDTH;
        var ch = GalaxyGame.Config.CANVAS.HEIGHT;
        var shipX = _ship ? _ship.x : cw / 2;
        var shipY = _ship ? _ship.y : ch / 2;

        // Bug 3 corregido: nombre y firma completamente distintos
        // Era: GalaxyGame.Obstacles.updateObstacle(obs, dt, speedMult, _ship) en bucle
        // Debe ser: GalaxyGame.Obstacles.updateAll(obstacleList, dt, shipX, shipY, cw, ch)
        GalaxyGame.Obstacles.updateAll(_obstacles, dt, shipX, shipY, cw, ch);

        // Bug 4 corregido: isOutOfBounds no existe en la API pública de obstacles.js
        // updateAll ya marca obs.active = false cuando sale de bounds;
        // usar filterActive para limpiar el array
        _obstacles = GalaxyGame.Obstacles.filterActive(_obstacles);
    }

    function _updatePowerUps(dt) {
        var cw = GalaxyGame.Config.CANVAS.WIDTH;
        var ch = GalaxyGame.Config.CANVAS.HEIGHT;

        // Bug 5 corregido: los power-ups son objetos planos, no instancias con .update()
        // Bug 4 corregido: isOutOfBounds no existe en la API pública
        // Usar Obstacles.updatePowerUps que gestiona movimiento y bounds internamente
        GalaxyGame.Obstacles.updatePowerUps(_powerUps, dt, cw, ch);
        _powerUps = GalaxyGame.Obstacles.filterActive(_powerUps);
    }

    function _updateParticles(dt) {
        for (var i = _particles.length - 1; i >= 0; i--) {
            _particles[i].update(dt);
            // Bug 6 corregido: Particle no tiene isDead(); usar la propiedad .active
            // Era: _particles[i].isDead()
            // Debe ser: !_particles[i].active
            if (!_particles[i].active) {
                _particles.splice(i, 1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME OVER
    // ═══════════════════════════════════════════════════════════════════════

    function _triggerGameOver() {
        GalaxyGame.Audio.playGameOver();

        if (_score > _highScore) {
            _highScore = _score;
            _saveHighScore();
        }

        _canvasWrapper.classList.remove('is-shielded', 'is-boosted', 'is-agile', 'is-level-up');

        document.getElementById('gameover-score-value').textContent    = _score;
        document.getElementById('gameover-highscore-value').textContent = _highScore;

        _setGameState('gameover');

        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERSISTENCIA HIGH SCORE
    // ═══════════════════════════════════════════════════════════════════════

    function _loadHighScore() {
        try {
            var stored = localStorage.getItem('galaxyGame_highScore');
            _highScore = stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            _highScore = 0;
        }
    }

    function _saveHighScore() {
        try {
            localStorage.setItem('galaxyGame_highScore', String(_highScore));
        } catch (e) { /* silencioso */ }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function _gameLoop(timestamp) {
        if (_state !== 'playing') { return; }

        if (_lastTimestamp === 0) { _lastTimestamp = timestamp; }
        var dt = timestamp - _lastTimestamp;
        if (dt > 100) { dt = 100; }
        _lastTimestamp = timestamp;

        _updateShip(dt);
        _updateObstacles(dt);
        _updatePowerUps(dt);
        _updateParticles(dt);
        _spawnObstacle(dt);
        _spawnPowerUp(dt);
        _checkCollisions();
        _updateScore(dt);
        _updatePowerUpTimer(dt);
        _updateInvincibility(dt);
        _updateLevelUpBanner(dt);

        var levelLabel = _levelUpTimer > 0 ? _levelUpLabel : '';
        var isInvincible = _invincibleTimer > 0;

        // Bug 10 corregido: drawFrame espera un objeto gameState, no 7 argumentos posicionales
        // Era: GalaxyGame.Renderer.drawFrame(_stars, _ship, _obstacles, _powerUps, _particles, levelLabel, isInvincible)
        // Debe ser: GalaxyGame.Renderer.drawFrame({ stars, ship, obstacles, powerUps, particles, levelUpBanner })
        GalaxyGame.Renderer.drawFrame({
            stars:         _stars,
            ship:          _ship,
            obstacles:     _obstacles,
            powerUps:      _powerUps,
            particles:     _particles,
            levelUpBanner: levelLabel || null
        });

        _rafId = requestAnimationFrame(_gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTOS DE UI
    // ═══════════════════════════════════════════════════════════════════════

    function _onDifficultySelect(e) {
        var btn = e.currentTarget;
        var diff = btn.getAttribute('data-difficulty');
        if (!diff) { return; }

        _difficulty = diff;

        document.querySelectorAll('.btn-difficulty').forEach(function (b) {
            b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
    }

    function _onStartGame() {
        _resetGame();
        _setGameState('playing');
        _lastTimestamp = 0;
        _rafId = requestAnimationFrame(_gameLoop);
    }

    function _onPause() {
        if (_state !== 'playing') { return; }
        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
        _setGameState('paused');
    }

    function _onResume() {
        if (_state !== 'paused') { return; }
        _lastTimestamp = 0;
        _setGameState('playing');
        _rafId = requestAnimationFrame(_gameLoop);
    }

    function _onQuitToMenu() {
        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
        _canvasWrapper.classList.remove('is-running', 'is-paused', 'is-gameover',
            'is-shielded', 'is-boosted', 'is-agile', 'is-level-up');
        _updateStartScreenHighScore();
        _setGameState('menu');
    }

    function _onRestart() {
        _resetGame();
        _setGameState('playing');
        _lastTimestamp = 0;
        _rafId = requestAnimationFrame(_gameLoop);
    }

    function _onKeyboardGlobal(e) {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (_state === 'playing') { _onPause(); }
            else if (_state === 'paused') { _onResume(); }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS DE UI
    // ═══════════════════════════════════════════════════════════════════════

    function _updateStartScreenHighScore() {
        var el = document.getElementById('start-highscore-value');
        if (el) { el.textContent = _highScore; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN DE ESTRELLAS
    // ═══════════════════════════════════════════════════════════════════════

    function _initStars() {
        _stars = [];
        var cfg    = GalaxyGame.Config;
        var starCfg = cfg.STARS;
        var cw     = cfg.CANVAS.WIDTH;
        var ch     = cfg.CANVAS.HEIGHT;
        var count  = starCfg.COUNT || 120;

        // Bug 7 corregido: GalaxyGame.Entities.Star no existe en entities.js
        // Construir objetos planos de estrella directamente
        for (var i = 0; i < count; i++) {
            _stars.push({
                x:      GalaxyGame.Utils.randomBetween(0, cw),
                y:      GalaxyGame.Utils.randomBetween(0, ch),
                radius: GalaxyGame.Utils.randomBetween(starCfg.MIN_RADIUS, starCfg.MAX_RADIUS),
                speed:  GalaxyGame.Utils.randomBetween(starCfg.MIN_SPEED,  starCfg.MAX_SPEED),
                opacity: GalaxyGame.Utils.randomBetween(0.3, 1.0)
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INIT PÚBLICO
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        _loadHighScore();

        // Referencias DOM
        _canvasWrapper = document.getElementById('game-canvas-wrapper');

        _screens = {
            start:    document.getElementById('screen-start'),
            game:     document.getElementById('screen-game'),
            pause:    document.getElementById('screen-pause'),
            gameover: document.getElementById('screen-gameover')
        };

        _hud = {
            scoreValue:       document.getElementById('hud-score-value'),
            livesValue:       document.getElementById('hud-lives-value'),
            levelValue:       document.getElementById('hud-level-value'),
            powerupLabel:     document.getElementById('hud-powerup-label'),
            powerupValue:     document.getElementById('hud-powerup-value'),
            powerupContainer: document.getElementById('hud-powerup')
        };

        // Inicializar sub-módulos
        GalaxyGame.Controls.init();
        GalaxyGame.Renderer.init(document.getElementById('game-canvas'));
        _initStars();

        // Botones de dificultad
        document.querySelectorAll('.btn-difficulty').forEach(function (btn) {
            btn.addEventListener('click', _onDifficultySelect);
        });

        // Botón inicio
        var btnStart = document.getElementById('btn-start');
        if (btnStart) { btnStart.addEventListener('click', _onStartGame); }

        // Botón reanudar
        var btnResume = document.getElementById('btn-resume');
        if (btnResume) { btnResume.addEventListener('click', _onResume); }

        // Botón salir desde pausa
        var btnQuitPause = document.getElementById('btn-quit-pause');
        if (btnQuitPause) { btnQuitPause.addEventListener('click', _onQuitToMenu); }

        // Botón reiniciar desde game over
        var btnRestart = document.getElementById('btn-restart');
        if (btnRestart) { btnRestart.addEventListener('click', _onRestart); }

        // Botón salir desde game over
        var btnQuitGameover = document.getElementById('btn-quit-gameover');
        if (btnQuitGameover) { btnQuitGameover.addEventListener('click', _onQuitToMenu); }

        // Teclado global (pausa con Escape/P)
        document.addEventListener('keydown', _onKeyboardGlobal);

        // Marcar dificultad fácil como activa por defecto
        var defaultBtn = document.getElementById('btn-difficulty-easy');
        if (defaultBtn) { defaultBtn.classList.add('is-active'); }

        // Mostrar high score en pantalla de inicio
        _updateStartScreenHighScore();

        // Estado inicial
        _setGameState('menu');
    }

    // ─── API pública ────────────────────────────────────────────────────────
    return {
        init: init
    };

})();

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    GalaxyGame.Game.init();
});