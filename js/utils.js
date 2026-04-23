(function() {
  window.SPACE_GAME = window.SPACE_GAME || {};
  window.SPACE_GAME.Utils = {};

  SPACE_GAME.Utils.clamp = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
  };

  SPACE_GAME.Utils.randomBetween = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  SPACE_GAME.Utils.randomInt = function(min, max) {
    return Math.floor(SPACE_GAME.Utils.randomBetween(min, max + 1));
  };

  SPACE_GAME.Utils.circlesCollide = function(ax, ay, ar, bx, by, br) {
    var dx = ax - bx;
    var dy = ay - by;
    var sumR = ar + br;
    return dx * dx + dy * dy < sumR * sumR;
  };

  SPACE_GAME.Utils.shipHitsObstacle = function(ship, obstacle) {
    if (obstacle.active === false) return false;
    return SPACE_GAME.Utils.circlesCollide(ship.x, ship.y, ship.radius, obstacle.x, obstacle.y, obstacle.radius);
  };

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
  }

  function componentToHex(c) {
    return c.toString(16).padStart(2, '0');
  }

  SPACE_GAME.Utils.lerpColor = function(colorA, colorB, t) {
    var a = hexToRgb(colorA);
    var b = hexToRgb(colorB);
    var r = Math.round(a.r + (b.r - a.r) * t);
    var g = Math.round(a.g + (b.g - a.g) * t);
    var bl = Math.round(a.b + (b.b - a.b) * t);
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(bl);
  };

  SPACE_GAME.Utils.drawNeonCircle = function(ctx, x, y, radius, color, glowIntensity) {
    ctx.save();
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  SPACE_GAME.Utils.drawNeonLine = function(ctx, x1, y1, x2, y2, color, lineWidth, glowIntensity) {
    ctx.save();
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

})();