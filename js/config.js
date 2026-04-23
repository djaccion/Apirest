window.SPACE_GAME = window.SPACE_GAME || {};

const CONFIG = {

  CANVAS: {
    WIDTH:  800,
    HEIGHT: 600
  },

  GAME: {
    TARGET_FPS:         60,
    INITIAL_LIVES:       3,
    LEVEL_UP_SCORE:   1000,
    MAX_LEVEL:           3,
    LEVELUP_DISPLAY_MS: 3000,
    POWERUP_ALERT_MS:   2000
  },

  SHIP: {
    WIDTH:            40,
    HEIGHT:           30,
    SPEED:           300,
    BULLET_SPEED:    500,
    BULLET_COOLDOWN:  0.25,
    DAMAGE_FLASH_MS: 500
  },

  OBSTACLES: {
    SPAWN_INTERVAL_BASE: 1.5,
    SPAWN_INTERVAL_MIN:  0.4,
    SPEED_BASE:         80,
    SPEED_INCREMENT:    40,
    TYPES: {
      ASTEROID: { hp: 1, points:  100, radius: 20, color: '#aaaaaa', rotSpeed: 1.2 },
      DRONE:    { hp: 2, points:  250, radius: 15, color: '#ff4444', rotSpeed: 0.5 },
      MINE:     { hp: 1, points:  150, radius: 12, color: '#ffff00', rotSpeed: 0.0 }
    }
  },

  PARTICLES: {
    EXPLOSION_COUNT: 12,
    SPEED_MIN:       60,
    SPEED_MAX:      180,
    LIFETIME_MIN:    0.4,
    LIFETIME_MAX:    0.9,
    RADIUS_MIN:       2,
    RADIUS_MAX:       5
  },

  COLORS: {
    BG:        '#000011',
    PRIMARY:   '#00ffff',
    SECONDARY: '#ff00ff',
    ACCENT:    '#ffff00',
    DANGER:    '#ff4444',
    SUCCESS:   '#44ff44',
    TEXT:      '#ffffff'
  },

  AUDIO: {
    SHOOT_FREQ:       880,
    SHOOT_DURATION:   0.08,
    EXPLODE_FREQ:     120,
    EXPLODE_DURATION: 0.3,
    LEVELUP_FREQ:     660,
    LEVELUP_DURATION: 0.5
  },

  STARS: {
    COUNT:     80,
    SPEED_MIN: 20,
    SPEED_MAX: 80
  }

};

window.SPACE_GAME.CONFIG = CONFIG;