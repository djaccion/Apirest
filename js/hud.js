(function () {
  window.SPACE_GAME = window.SPACE_GAME || {};

  var _els = {
    score:        null,
    level:        null,
    lives:        null,
    speedBar:     null,
    powerupAlert: null,
    powerupName:  null
  };

  var _powerupAlertTimer = 0;
  var _POWERUP_ALERT_DURATION = 2000;

  function init() {
    _els.score        = document.getElementById('hud-score');
    _els.level        = document.getElementById('hud-level');
    _els.lives        = document.getElementById('hud-lives');
    _els.speedBar     = document.getElementById('hud-speed-bar');
    _els.powerupAlert = document.getElementById('hud-powerup-alert');
    _els.powerupName  = document.getElementById('hud-powerup-name');

    if (!_els.score)        throw new Error('[HUD] Elemento #hud-score no encontrado en el DOM');
    if (!_els.level)        throw new Error('[HUD] Elemento #hud-level no encontrado en el DOM');
    if (!_els.lives)        throw new Error('[HUD] Elemento #hud-lives no encontrado en el DOM');
    if (!_els.speedBar)     throw new Error('[HUD] Elemento #hud-speed-bar no encontrado en el DOM');
    if (!_els.powerupAlert) throw new Error('[HUD] Elemento #hud-powerup-alert no encontrado en el DOM');
    if (!_els.powerupName)  throw new Error('[HUD] Elemento #hud-powerup-name no encontrado en el DOM');

    // Bug 11 fix: #hud-speed-bar is empty in the HTML — create the .speed-fill
    // child element programmatically so _renderSpeedBar can find it.
    if (!_els.speedBar.querySelector('.speed-fill')) {
      var fill = document.createElement('div');
      fill.className = 'speed-fill';
      _els.speedBar.appendChild(fill);
    }
  }

  function _renderLives(lives) {
    var str = '';
    for (var i = 0; i < 3; i++) {
      if (i < lives) {
        str += '\u2665 ';
      } else {
        str += '\u2661 ';
      }
    }
    _els.lives.textContent = str;
  }

  function _renderSpeedBar(speed, maxSpeed) {
    var pct = (maxSpeed && maxSpeed > 0)
      ? Math.min(100, Math.round((speed / maxSpeed) * 100))
      : 0;
    var fill = _els.speedBar.querySelector('.speed-fill');
    if (fill) {
      fill.style.width = pct + '%';
    }
  }

  function _renderPowerupAlert(state, timestamp) {
    if (state.powerupActive === true && _powerupAlertTimer === 0) {
      _els.powerupName.textContent = state.powerupName;
      _els.powerupAlert.classList.remove('hidden');
      _powerupAlertTimer = timestamp;
    }

    if (_powerupAlertTimer > 0) {
      var elapsed = timestamp - _powerupAlertTimer;
      if (elapsed >= _POWERUP_ALERT_DURATION) {
        _els.powerupAlert.classList.add('hidden');
        _powerupAlertTimer = 0;
      }
    }
  }

  function update(state, timestamp) {
    _els.score.textContent = state.score;
    _els.level.textContent = state.level;
    _renderLives(state.lives);
    _renderSpeedBar(state.speed, state.maxSpeed);
    _renderPowerupAlert(state, timestamp);
  }

  function showLevelUp(level) {
    var el = document.querySelector('#screen-levelup .neon-text');
    if (el) {
      el.textContent = 'NIVEL ' + level;
    }
    document.getElementById('screen-levelup').classList.remove('hidden');
    setTimeout(function () {
      document.getElementById('screen-levelup').classList.add('hidden');
    }, SPACE_GAME.CONFIG.GAME.LEVELUP_DISPLAY_MS || 3000);
  }

  function reset() {
    _powerupAlertTimer = 0;
    _els.powerupAlert.classList.add('hidden');
    _els.powerupName.textContent = '';
    _els.score.textContent = 0;
    _els.level.textContent = 1;
    _renderLives(3);
  }

  window.SPACE_GAME.HUD = {
    init:        init,
    update:      update,
    showLevelUp: showLevelUp,
    reset:       reset
  };

})();