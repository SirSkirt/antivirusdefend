// ===== TEXTURES MODULE =====
// Central place for visual resources: hero logos, projectile palettes, stage styles.
// This is purely cosmetic and does not affect gameplay numbers.

window.AVDEF = window.AVDEF || {};

AVDEF.Textures = (function() {
  // Hero logo URLs (used by engine.js when drawing hero heads / disguised enemies)
  const HERO_LOGOS = {
    'defender': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Windows-defender.svg/240px-Windows-defender.svg.png',
    'avg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/AVG_Similar_Icon.svg/960px-AVG_Similar_Icon.svg.png?20200830015222',
    'avast': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Avast_Software_white_logo.png?20190728134047',
    'norton': 'https://cdn.brandfetch.io/idooDSluCu/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    'mcafee': 'https://companieslogo.com/img/orig/MCFE-d6ec69dd.png?t=1720244492',
    'q360': 'https://packagestore.com/wp-content/uploads/2023/07/0D56757242667073F5E9610001F2E43A.png'
  };

  // Projectile color palettes per hero.
  // These values mirror the ones that were previously hard-coded in drawProjectiles().
  const PROJECTILE_PALETTES = {
    default: {
      inner: '#e0f2fe',
      mid:   '#38bdf8',
      outer: '#0ea5e9'
    },
    defender: {
      inner: '#e0f2fe',
      mid:   '#38bdf8',
      outer: '#0ea5e9'
    },
    avg: {
      inner: '#fefce8',
      mid:   '#facc15',
      outer: '#ca8a04'
    },
    avast: {
      inner: '#ffedd5',
      mid:   '#fb923c',
      outer: '#ea580c'
    },
    norton: {
      inner: '#fefce8',
      mid:   '#fde047',
      outer: '#facc15'
    },
    q360: {
      inner: '#dcfce7',
      mid:   '#4ade80',
      outer: '#16a34a'
    },
    total: {
      inner: '#dcfce7',
      mid:   '#4ade80',
      outer: '#16a34a'
    },
    mcafee: {
      inner: '#fee2e2',
      mid:   '#f97373',
      outer: '#e11d48'
    }
  };

  // Stage styles hook – right now the board look is driven by drawBackgroundCase()
  // in engine.js, but if you later want per-stage color palettes or textures,
  // they can live here keyed by stage id.
  const STAGE_STYLES = {
    computer: {},
    laptop:   {},
    phone:    {},
    tablet:   {},
    router:   {},
    bios:     {}
  };

  return {
    heroLogos: HERO_LOGOS,
    projectilePalettes: PROJECTILE_PALETTES,
    stageStyles: STAGE_STYLES
  };
})();
