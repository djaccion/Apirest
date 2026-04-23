window.GalaxyGame = window.GalaxyGame || {};
window.GalaxyGame.Utils = {};

GalaxyGame.Utils.clamp = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
};

GalaxyGame.Utils.randomBetween = function(min, max) {
    return Math.random() * (max - min) + min;
};

GalaxyGame.Utils.randomIntBetween = function(min, max) {
    return Math.floor(GalaxyGame.Utils.randomBetween(min, max + 1));
};

GalaxyGame.Utils.lerp = function(a, b, t) {
    return a + (b - a) * t;
};

GalaxyGame.Utils.degToRad = function(degrees) {
    return degrees * (Math.PI / 180);
};

GalaxyGame.Utils.normalizeAngle = function(angle) {
    return ((angle % 360) + 360) % 360;
};

GalaxyGame.Utils.checkAABB = function(rectA, rectB) {
    return !(
        rectA.x + rectA.width  < rectB.x ||
        rectA.x                > rectB.x + rectB.width ||
        rectA.y + rectA.height < rectB.y ||
        rectA.y                > rectB.y + rectB.height
    );
};

GalaxyGame.Utils.getDistance = function(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
};

GalaxyGame.Utils.getAngleBetween = function(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
};

GalaxyGame.Utils.isOutOfBounds = function(x, y, width, height, canvasWidth, canvasHeight) {
    return x + width < 0 || x > canvasWidth || y + height < 0 || y > canvasHeight;
};

GalaxyGame.Utils.pickRandom = function(array) {
    return array[GalaxyGame.Utils.randomIntBetween(0, array.length - 1)];
};