(function() {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let _isMuted = false;
  let _initialized = false;

  const SOUNDS = {
    shoot: {
      type: 'square',
      frequency: 880,
      freqEnd: 220,
      duration: 0.12,
      gainPeak: 0.3,
      gainEnd: 0.0
    },
    explosion: {
      type: 'sawtooth',
      frequency: 150,
      freqEnd: 30,
      duration: 0.4,
      gainPeak: 0.6,
      gainEnd: 0.0
    },
    playerHit: {
      type: 'square',
      frequency: 200,
      freqEnd: 80,
      duration: 0.3,
      gainPeak: 0.5,
      gainEnd: 0.0
    },
    powerUp: {
      type: 'sine',
      frequency: 440,
      freqEnd: 880,
      duration: 0.25,
      gainPeak: 0.4,
      gainEnd: 0.0
    },
    levelUp: {
      type: 'triangle',
      frequency: 330,
      freqEnd: 660,
      duration: 0.5,
      gainPeak: 0.5,
      gainEnd: 0.0
    },
    gameOver: {
      type: 'sawtooth',
      frequency: 220,
      freqEnd: 55,
      duration: 0.8,
      gainPeak: 0.7,
      gainEnd: 0.0
    },
    menuSelect: {
      type: 'sine',
      frequency: 660,
      freqEnd: 660,
      duration: 0.08,
      gainPeak: 0.2,
      gainEnd: 0.0
    }
  };

  function init() {
    if (_initialized) {
      return;
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 1.0;
    _initialized = true;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function _playTone(config) {
    if (!_initialized || _isMuted) {
      return;
    }

    var osc = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, audioCtx.currentTime);

    if (config.freqEnd !== config.frequency) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(config.freqEnd, 0.001),
        audioCtx.currentTime + config.duration
      );
    }

    gainNode.gain.setValueAtTime(config.gainPeak, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(config.gainEnd, 0.001),
      audioCtx.currentTime + config.duration
    );

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + config.duration);
  }

  function play(soundName) {
    if (!_initialized) {
      return;
    }

    var config = SOUNDS[soundName];

    if (config === undefined) {
      return;
    }

    _playTone(config);
  }

  function setMuted(bool) {
    _isMuted = bool;

    if (masterGain) {
      masterGain.gain.value = _isMuted ? 0.0 : 1.0;
    }
  }

  function isMuted() {
    return _isMuted;
  }

  window.SPACE_GAME = window.SPACE_GAME || {};
  window.SPACE_GAME.Audio = {
    init: init,
    play: play,
    setMuted: setMuted,
    isMuted: isMuted
  };

})();