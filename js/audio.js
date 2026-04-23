window.GalaxyGame = window.GalaxyGame || {};
window.GalaxyGame.Audio = (function () {

    let audioCtx = null;
    let masterGain = null;
    let isMuted = false;

    function _initContext() {
        if (audioCtx) return;
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
    }

    function _playTone(config) {
        if (isMuted) return;
        if (!audioCtx || !masterGain) return;

        var now = audioCtx.currentTime;
        var startTime = (config.startTime !== undefined) ? config.startTime : 0;
        var duration = config.duration;
        var gainPeak = config.gainPeak;

        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = config.type;

        oscillator.frequency.setValueAtTime(config.frequency, now + startTime);

        if (config.endFrequency !== config.frequency) {
            oscillator.frequency.exponentialRampToValueAtTime(
                config.endFrequency,
                now + startTime + duration
            );
        }

        gainNode.gain.setValueAtTime(0, now + startTime);
        gainNode.gain.linearRampToValueAtTime(gainPeak, now + startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + startTime + duration);

        oscillator.start(now + startTime);
        oscillator.stop(now + startTime + duration + 0.05);
    }

    function playShoot() {
        _initContext();
        _playTone({
            type: 'square',
            frequency: 880,
            endFrequency: 220,
            duration: 0.12,
            gainPeak: 0.4,
            startTime: 0
        });
    }

    function playExplosion() {
        _initContext();
        _playTone({
            type: 'sawtooth',
            frequency: 150,
            endFrequency: 30,
            duration: 0.6,
            gainPeak: 0.6,
            startTime: 0
        });
        _playTone({
            type: 'square',
            frequency: 80,
            endFrequency: 20,
            duration: 0.8,
            gainPeak: 0.4,
            startTime: 0
        });
    }

    function playPowerUp() {
        _initContext();
        _playTone({
            type: 'sine',
            frequency: 440,
            endFrequency: 440,
            duration: 0.1,
            gainPeak: 0.5,
            startTime: 0
        });
        _playTone({
            type: 'sine',
            frequency: 554,
            endFrequency: 554,
            duration: 0.1,
            gainPeak: 0.5,
            startTime: 0.1
        });
        _playTone({
            type: 'sine',
            frequency: 659,
            endFrequency: 880,
            duration: 0.2,
            gainPeak: 0.6,
            startTime: 0.2
        });
    }

    function playLevelUp() {
        _initContext();
        _playTone({
            type: 'square',
            frequency: 523,
            endFrequency: 523,
            duration: 0.12,
            gainPeak: 0.5,
            startTime: 0.00
        });
        _playTone({
            type: 'square',
            frequency: 659,
            endFrequency: 659,
            duration: 0.12,
            gainPeak: 0.5,
            startTime: 0.13
        });
        _playTone({
            type: 'square',
            frequency: 784,
            endFrequency: 784,
            duration: 0.12,
            gainPeak: 0.5,
            startTime: 0.26
        });
        _playTone({
            type: 'square',
            frequency: 1047,
            endFrequency: 1047,
            duration: 0.25,
            gainPeak: 0.7,
            startTime: 0.39
        });
    }

    function playGameOver() {
        _initContext();
        _playTone({
            type: 'sawtooth',
            frequency: 440,
            endFrequency: 220,
            duration: 0.4,
            gainPeak: 0.6,
            startTime: 0.0
        });
        _playTone({
            type: 'sawtooth',
            frequency: 220,
            endFrequency: 110,
            duration: 0.4,
            gainPeak: 0.5,
            startTime: 0.4
        });
        _playTone({
            type: 'sawtooth',
            frequency: 110,
            endFrequency: 40,
            duration: 0.6,
            gainPeak: 0.4,
            startTime: 0.8
        });
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (masterGain) {
            masterGain.gain.value = isMuted ? 0 : 0.3;
        }
        return isMuted;
    }

    function getMuteState() {
        return isMuted;
    }

    return {
        playShoot: playShoot,
        playExplosion: playExplosion,
        playPowerUp: playPowerUp,
        playLevelUp: playLevelUp,
        playGameOver: playGameOver,
        toggleMute: toggleMute,
        getMuteState: getMuteState
    };

})();