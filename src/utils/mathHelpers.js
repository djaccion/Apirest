export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function getRadialPosition(index, total, cx, cy, radius, angleOffset = -Math.PI / 2) {
    const angle = (2 * Math.PI * index / total) + angleOffset;
    return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
    };
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function getQuadraticBezierPoint(t, p0, p1, p2) {
    const mt = 1 - t;
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
}

export function getDistance(p0, p1) {
    return Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
}

export function normalize(value, min, max) {
    return clamp((value - min) / (max - min), 0, 1);
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function getMidControlPoint(p0, p1, curvature = 0.3) {
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
        return { x: midX, y: midY };
    }

    const perpX = -dy / distance;
    const perpY = dx / distance;

    return {
        x: midX + perpX * curvature * distance,
        y: midY + perpY * curvature * distance
    };
}

export function getAngle(p0, p1) {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}