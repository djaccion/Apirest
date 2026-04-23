window.SPACE_GAME = window.SPACE_GAME || {};

window.SPACE_GAME.Controls = (function () {

  const _keys = {
    up:    false,
    down:  false,
    left:  false,
    right: false,
    fire:  false,
    pause: false,
  };

  const _keyMap = {
    'ArrowUp':    'up',
    'ArrowDown':  'down',
    'ArrowLeft':  'left',
    'ArrowRight': 'right',
    'w':          'up',
    's':          'down',
    'a':          'left',
    'd':          'right',
    'W':          'up',
    'S':          'down',
    'A':          'left',
    'D':          'right',
    ' ':          'fire',
    'p':          'pause',
    'P':          'pause',
    'Escape':     'pause',
  };

  const _preventDefaultActions = ['up', 'down', 'left', 'right', 'fire'];

  let _pausePressed = false;
  let _onPauseCallback = null;

  function _onKeyDown(event) {
    var action = _keyMap[event.key];
    if (action === undefined) {
      return;
    }

    if (_preventDefaultActions.indexOf(action) !== -1) {
      event.preventDefault();
    }

    if (action === 'pause') {
      if (!_pausePressed) {
        _pausePressed = true;
        if (typeof _onPauseCallback === 'function') {
          _onPauseCallback();
        }
      }
      return;
    }

    _keys[action] = true;
  }

  function _onKeyUp(event) {
    var action = _keyMap[event.key];
    if (action === undefined) {
      return;
    }

    if (action === 'pause') {
      _pausePressed = false;
      return;
    }

    _keys[action] = false;
  }

  function _reset() {
    Object.keys(_keys).forEach(function (k) {
      _keys[k] = false;
    });
    _pausePressed = false;
  }

  function activate() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  function deactivate() {
    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup',   _onKeyUp);
    _reset();
  }

  function getState() {
    return {
      up:    _keys.up,
      down:  _keys.down,
      left:  _keys.left,
      right: _keys.right,
      fire:  _keys.fire,
    };
  }

  function setPauseCallback(fn) {
    if (typeof fn === 'function') {
      _onPauseCallback = fn;
    }
  }

  return {
    activate:         activate,
    deactivate:       deactivate,
    getState:         getState,
    setPauseCallback: setPauseCallback,
  };

})();