// Enemy definitions module placeholder.
// Move enemy type stats and spawn helpers here.
// ===== ENEMIES MODULE =====
// Defines enemy types and a creation factory.

window.AVDEF = window.AVDEF || {};

AVDEF.Enemies = (() => {

  const TYPES = {
    basic: {
      baseSpeed: 80,
      baseHp: (wave) => 35 + wave * 4,
      xpValue: 5
    },

    fast: {
      baseSpeed: 140,
      baseHp: (wave) => 20 + wave * 3,
      xpValue: 4
    },

    tank: {
      baseSpeed: 60,
      baseHp: (wave) => 90 + wave * 8,
      xpValue: 10
    },

    ransomware: {
      baseSpeed: 75,
      baseHp: (wave) => 120 + wave * 10,
      xpValue: 25,
      ransomware: true
    }
  };

  // Factory to spawn a new enemy
  function create(type, ctx) {
    const def = TYPES[type] || TYPES.basic;
    const wave = ctx.wave || 1;

    return {
      id: ctx.idGen(),
      type,
      x: ctx.x,
      y: ctx.y,
      speed: def.baseSpeed,
      hp: def.baseHp(wave),
      maxHp: def.baseHp(wave),
      xpValue: def.xpValue,
      ransomware: !!def.ransomware,
      color: '#ff4b4b'
    };
  }

  return {
    TYPES,
    create
  };

})();

