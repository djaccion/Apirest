window.GalaxyGame = window.GalaxyGame || {};

GalaxyGame.Controls = (function () {

    const _keys = {
        left:  false,
        right: false,
        up:    false,
        down:  false,
        pause: false,
        start: false
    };

    const _keyMap = {
        'ArrowLeft':  'left',
        'ArrowRight': 'right',
        'ArrowUp':    'up',
        'ArrowDown':  'down',
        'Escape':     'pause',
        'KeyP':       'pause',
        'Enter':      'start',
        'Space':      'start'
    };

    function _onKeyDown(event) {
        const action = _keyMap[event.code];
        if (action !== undefined) {
            _keys[action] = true;
            event.preventDefault();
        }
    }

    function _onKeyUp(event) {
        const action = _keyMap[event.code];
        if (action !== undefined) {
            _keys[action] = false;
            event.preventDefault();
        }
    }

    function init() {
        window.removeEventListener('keydown', _onKeyDown);
        window.removeEventListener('keyup',   _onKeyUp);
        window.addEventListener('keydown', _onKeyDown);
        window.addEventListener('keyup',   _onKeyUp);
    }

    function getState() {
        return {
            left:  _keys.left,
            right: _keys.right,
            up:    _keys.up,
            down:  _keys.down,
            pause: _keys.pause,
            start: _keys.start
        };
    }

    function reset() {
        _keys.left  = false;
        _keys.right = false;
        _keys.up    = false;
        _keys.down  = false;
        _keys.pause = false;
        _keys.start = false;
    }

    function destroy() {
        window.removeEventListener('keydown', _onKeyDown);
        window.removeEventListener('keyup',   _onKeyUp);
        reset();
    }

    return {
        init:     init,
        getState: getState,
        reset:    reset,
        destroy:  destroy
    };

})();