window.GalaxyGame = window.GalaxyGame || {};

GalaxyGame.Config = {

    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        BG_COLOR: '#000011'
    },

    PLAYER: {
        START_X: 400,
        START_Y: 500,
        WIDTH: 40,
        HEIGHT: 50,
        MAX_SPEED: 6,
        MIN_SPEED: 0.5,
        ACCELERATION: 0.15,
        DECELERATION: 0.08,
        ROTATION_SPEED: 3,
        TURBO_MULTIPLIER: 1.8,
        INVINCIBILITY_FRAMES: 120
    },

    DIFFICULTY: {
        NEBULA: {
            label: 'Nebulosa',
            obstacleSpawnRate: 90,
            obstacleSpeedMultiplier: 1.0,
            maxObstaclesOnScreen: 6,
            pointsPerSecond: 10
        },
        GALAXY: {
            label: 'Galaxia',
            obstacleSpawnRate: 60,
            obstacleSpeedMultiplier: 1.4,
            maxObstaclesOnScreen: 10,
            pointsPerSecond: 25
        },
        BLACK_HOLE: {
            label: 'Agujero Negro',
            obstacleSpawnRate: 35,
            obstacleSpeedMultiplier: 2.0,
            maxObstaclesOnScreen: 16,
            pointsPerSecond: 50
        }
    },

    OBSTACLES: {
        COMET: {
            width: 20,
            height: 45,
            baseSpeed: 7,
            color: '#00FFFF',
            points: 15
        },
        ASTEROID: {
            width: 45,
            height: 40,
            baseSpeed: 3,
            color: '#FF6600',
            points: 10
        },
        PLANET: {
            width: 80,
            height: 80,
            baseSpeed: 1.5,
            color: '#AA00FF',
            points: 5
        },
        UFO: {
            width: 55,
            height: 25,
            baseSpeed: 2.5,
            color: '#00FF88',
            points: 20,
            trackingStrength: 0.03
        },
        METEORITE: {
            width: 12,
            height: 12,
            baseSpeed: 5,
            color: '#FF4444',
            points: 8,
            swarmSize: 5
        }
    },

    POWERUPS: {
        SHIELD: {
            color: '#00AAFF',
            durationFrames: 300,
            cssClass: 'is-shielded'
        },
        TURBO: {
            color: '#FFFF00',
            durationFrames: 180,
            cssClass: 'is-boosted'
        },
        MAGNET: {
            color: '#FF00FF',
            durationFrames: 240,
            attractRadius: 120,
            cssClass: 'is-agile'
        },
        SPAWN_CHANCE: 0.0015
    },

    COLORS: {
        NEON_CYAN:   '#00FFFF',
        NEON_GREEN:  '#00FF88',
        NEON_YELLOW: '#FFFF00',
        NEON_ORANGE: '#FF6600',
        NEON_PINK:   '#FF00FF',
        NEON_PURPLE: '#AA00FF',
        NEON_RED:    '#FF4444',
        NEON_BLUE:   '#00AAFF',
        WHITE:       '#FFFFFF',
        DARK_BG:     '#000011',
        HUD_TEXT:    '#00FFFF',
        STAR_DIM:    '#334466',
        STAR_BRIGHT: '#AACCFF'
    },

    STARS: {
        COUNT: 120,
        MIN_SPEED: 0.5,
        MAX_SPEED: 2.5,
        MIN_RADIUS: 0.5,
        MAX_RADIUS: 2.0
    },

    PARTICLES: {
        EXPLOSION_COUNT: 18,
        LIFETIME_FRAMES: 45,
        MIN_SPEED: 1.5,
        MAX_SPEED: 4.5
    },

    AUDIO: {
        SHOOT_FREQ:     880,
        EXPLOSION_FREQ: 120,
        POWERUP_FREQ:   660,
        LEVELUP_FREQ:   440,
        GAMEOVER_FREQ:  80,
        HIT_FREQ:       220
    }

};

Object.freeze(GalaxyGame.Config);