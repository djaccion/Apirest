window.GalaxyGame = window.GalaxyGame || {};
window.GalaxyGame.Renderer = (function () {

    let _ctx    = null;
    let _canvas = null;

    function init(canvasElement) {
        _canvas = canvasElement;
        _ctx    = canvasElement.getContext('2d');
    }

    function _clearScreen() {
        _ctx.fillStyle = GalaxyGame.Config.CANVAS.BG_COLOR;
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    }

    function _drawStarfield(stars) {
        for (var i = 0; i < stars.length; i++) {
            var star = stars[i];
            _ctx.globalAlpha = star.opacity;
            _ctx.fillStyle   = '#FFFFFF';
            _ctx.beginPath();
            _ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            _ctx.fill();
        }
        _ctx.globalAlpha = 1;
    }

    function _drawScanlines() {
        _ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (var i = 0; i < _canvas.height; i += 4) {
            _ctx.fillRect(0, i, _canvas.width, 2);
        }
    }

    function _drawShip(ship) {
        _ctx.save();
        _ctx.translate(ship.x, ship.y);
        _ctx.rotate(ship.angle);

        _ctx.beginPath();
        _ctx.moveTo(0, -18);
        _ctx.lineTo(12, 12);
        _ctx.lineTo(-12, 12);
        _ctx.closePath();
        _ctx.fillStyle = GalaxyGame.Config.COLORS.NEON_CYAN;
        _ctx.fill();

        _ctx.fillStyle = GalaxyGame.Config.COLORS.NEON_BLUE;
        _ctx.fillRect(-4, -8, 8, 10);

        if (ship.isBoosted) {
            _ctx.globalAlpha = 0.8;
            _ctx.beginPath();
            _ctx.moveTo(-6, 14);
            _ctx.lineTo(6, 14);
            _ctx.lineTo(0, 26);
            _ctx.closePath();
            _ctx.fillStyle = '#FF6600';
            _ctx.fill();
            _ctx.globalAlpha = 1;
        }

        if (ship.isShielded) {
            _ctx.globalAlpha = 0.6;
            _ctx.beginPath();
            _ctx.arc(0, 0, 28, 0, Math.PI * 2);
            _ctx.strokeStyle = '#00FF88';
            _ctx.lineWidth   = 2;
            _ctx.stroke();
            _ctx.globalAlpha = 1;
        }

        _ctx.restore();
    }

    function _drawObstacle(obstacle) {
        _ctx.save();
        _ctx.translate(obstacle.x, obstacle.y);

        switch (obstacle.type) {

            case 'comet': {
                var tailLen = obstacle.radius * 3.5;
                var tailAngle = obstacle.angle + Math.PI;
                var grad = _ctx.createLinearGradient(0, 0,
                    Math.cos(tailAngle) * tailLen,
                    Math.sin(tailAngle) * tailLen);
                grad.addColorStop(0,   'rgba(255, 68, 68, 0.9)');
                grad.addColorStop(1,   'rgba(255, 68, 68, 0)');
                _ctx.beginPath();
                _ctx.moveTo(0, 0);
                _ctx.lineTo(
                    Math.cos(tailAngle) * tailLen,
                    Math.sin(tailAngle) * tailLen
                );
                _ctx.strokeStyle = grad;
                _ctx.lineWidth   = obstacle.radius * 0.8;
                _ctx.lineCap     = 'round';
                _ctx.stroke();

                _ctx.save();
                _ctx.rotate(obstacle.angle);
                _ctx.scale(1, 0.55);
                _ctx.beginPath();
                _ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
                _ctx.fillStyle = '#FF4444';
                _ctx.fill();
                _ctx.restore();
                break;
            }

            case 'asteroid': {
                var verts = obstacle.vertices;
                if (verts && verts.length) {
                    _ctx.beginPath();
                    _ctx.moveTo(verts[0].x, verts[0].y);
                    for (var v = 1; v < verts.length; v++) {
                        _ctx.lineTo(verts[v].x, verts[v].y);
                    }
                    _ctx.closePath();
                } else {
                    _ctx.beginPath();
                    _ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
                }
                _ctx.fillStyle   = '#888888';
                _ctx.fill();
                _ctx.strokeStyle = '#AAAAAA';
                _ctx.lineWidth   = 1;
                _ctx.stroke();
                break;
            }

            case 'planet': {
                var grad2 = _ctx.createRadialGradient(
                    -obstacle.radius * 0.3, -obstacle.radius * 0.3, obstacle.radius * 0.1,
                    0, 0, obstacle.radius
                );
                grad2.addColorStop(0,   _lightenColor(obstacle.color, 60));
                grad2.addColorStop(0.6, obstacle.color);
                grad2.addColorStop(1,   _darkenColor(obstacle.color, 60));

                _ctx.beginPath();
                _ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
                _ctx.fillStyle = grad2;
                _ctx.fill();

                if (obstacle.radius > 35) {
                    _ctx.save();
                    _ctx.scale(1, 0.3);
                    _ctx.beginPath();
                    _ctx.arc(0, 0, obstacle.radius * 1.5, 0, Math.PI * 2);
                    _ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    _ctx.lineWidth   = 4;
                    _ctx.stroke();
                    _ctx.beginPath();
                    _ctx.arc(0, 0, obstacle.radius * 1.75, 0, Math.PI * 2);
                    _ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                    _ctx.lineWidth   = 3;
                    _ctx.stroke();
                    _ctx.restore();
                }
                break;
            }

            case 'ufo': {
                var bodyH = obstacle.radius * 0.55;

                _ctx.save();
                _ctx.scale(1, 0.55);
                _ctx.beginPath();
                _ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
                _ctx.fillStyle   = '#CC00FF';
                _ctx.fill();
                _ctx.strokeStyle = '#FF88FF';
                _ctx.lineWidth   = 1.5;
                _ctx.stroke();
                _ctx.restore();

                _ctx.beginPath();
                _ctx.arc(0, -bodyH * 0.5, obstacle.radius * 0.55, Math.PI, 0);
                _ctx.closePath();
                _ctx.fillStyle   = '#FF00FF';
                _ctx.fill();
                _ctx.strokeStyle = '#FF88FF';
                _ctx.lineWidth   = 1;
                _ctx.stroke();

                var numLights = 5;
                for (var l = 0; l < numLights; l++) {
                    var lAngle = (l / numLights) * Math.PI * 2;
                    var lx = Math.cos(lAngle) * obstacle.radius * 0.75;
                    var ly = Math.sin(lAngle) * obstacle.radius * 0.28;
                    _ctx.beginPath();
                    _ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
                    _ctx.fillStyle = (l % 2 === 0) ? '#FFFF00' : '#00FFFF';
                    _ctx.fill();
                }
                break;
            }

            case 'meteorite':
            case 'meteor': {
                _ctx.beginPath();
                _ctx.arc(0, 0, obstacle.radius, 0, Math.PI * 2);
                _ctx.fillStyle = '#FF8800';
                _ctx.fill();
                _ctx.beginPath();
                _ctx.arc(-obstacle.radius * 0.25, -obstacle.radius * 0.25,
                         obstacle.radius * 0.35, 0, Math.PI * 2);
                _ctx.fillStyle = 'rgba(255,200,100,0.5)';
                _ctx.fill();
                break;
            }

            default:
                break;
        }

        _ctx.restore();
    }

    function _drawPowerUp(powerUp) {
        _ctx.save();
        _ctx.translate(powerUp.x, powerUp.y);

        _ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
        _ctx.beginPath();
        _ctx.arc(0, 0, powerUp.radius * 1.8, 0, Math.PI * 2);
        _ctx.fillStyle = powerUp.color;
        _ctx.fill();
        _ctx.globalAlpha = 1;

        _ctx.beginPath();
        _ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
        _ctx.fillStyle = powerUp.color;
        _ctx.fill();
        _ctx.strokeStyle = '#FFFFFF';
        _ctx.lineWidth   = 1.5;
        _ctx.stroke();

        _ctx.fillStyle    = '#000000';
        _ctx.font         = 'bold ' + (powerUp.radius * 1.1) + 'px monospace';
        _ctx.textAlign    = 'center';
        _ctx.textBaseline = 'middle';

        var icon = '?';
        if (powerUp.type === 'shield') icon = 'S';
        if (powerUp.type === 'turbo')  icon = 'T';
        if (powerUp.type === 'magnet') icon = 'M';
        _ctx.fillText(icon, 0, 1);

        _ctx.restore();
    }

    function _drawParticles(particles) {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            _ctx.save();
            _ctx.globalAlpha = p.alpha !== undefined ? p.alpha : (p.opacity !== undefined ? p.opacity : 1);
            _ctx.fillStyle   = p.color;
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.restore();
        }
    }

    function _drawLevelUpBanner(levelName) {
        _ctx.save();
        _ctx.globalAlpha = 0.85;
        _ctx.fillStyle   = 'rgba(0, 0, 0, 0.6)';
        _ctx.fillRect(0, _canvas.height / 2 - 40, _canvas.width, 80);
        _ctx.globalAlpha = 1;

        _ctx.font         = '20px "Press Start 2P", monospace';
        _ctx.textAlign    = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillStyle    = GalaxyGame.Config.COLORS.NEON_YELLOW;
        _ctx.fillText('NIVEL: ' + levelName, _canvas.width / 2, _canvas.height / 2);
        _ctx.restore();
    }

    function _lightenColor(hex, amount) {
        return _shiftColor(hex, amount);
    }

    function _darkenColor(hex, amount) {
        return _shiftColor(hex, -amount);
    }

    function _shiftColor(hex, amount) {
        var num = parseInt(hex.replace('#', ''), 16);
        var r   = Math.min(255, Math.max(0, (num >> 16) + amount));
        var g   = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        var b   = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return '#' +
            ('00' + r.toString(16)).slice(-2) +
            ('00' + g.toString(16)).slice(-2) +
            ('00' + b.toString(16)).slice(-2);
    }

    function drawFrame(gameState) {
        if (!_ctx) return;

        _clearScreen();

        if (gameState.stars && gameState.stars.length) {
            _drawStarfield(gameState.stars);
        }

        if (gameState.powerUps) {
            for (var p = 0; p < gameState.powerUps.length; p++) {
                _drawPowerUp(gameState.powerUps[p]);
            }
        }

        if (gameState.obstacles) {
            for (var o = 0; o < gameState.obstacles.length; o++) {
                _drawObstacle(gameState.obstacles[o]);
            }
        }

        if (gameState.ship) {
            _drawShip(gameState.ship);
        }

        if (gameState.particles) {
            _drawParticles(gameState.particles);
        }

        if (gameState.levelUpBanner) {
            _drawLevelUpBanner(gameState.levelUpBanner);
        }

        _drawScanlines();
    }

    return {
        init:              init,
        drawFrame:         drawFrame,
        drawLevelUpBanner: _drawLevelUpBanner
    };

})();