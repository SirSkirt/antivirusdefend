// title.js
(function () {
  // Ensure AVDEF exists
  window.AVDEF = window.AVDEF || {};
  const Engine = AVDEF.Engine || {};

  // --- DOM references for title + menus ---
  const titleOverlay      = document.getElementById('titleOverlay');
  const btnFreeplay       = document.getElementById('btnFreeplay');
  const btnOptions        = document.getElementById('btnOptions');
  const btnInfo           = document.getElementById('btnHowTo');
  const btnQuitTitle      = document.getElementById('btnExit');

  const heroSelectOverlay = document.getElementById('heroSelectOverlay');
  const heroGrid          = document.getElementById('heroGrid');
  const btnHeroBack       = document.getElementById('btnHeroBack');
  const btnHeroStart      = document.getElementById('btnHeroStart');

  const stageOverlay      = document.getElementById('stageOverlay');
  const stageGrid         = document.getElementById('stageGrid');
  const btnStageBack      = document.getElementById('btnStageBack');
  const btnStageStart     = document.getElementById('btnStageStart');

  const optionsOverlay    = document.getElementById('optionsOverlay');
  const optVolume         = document.getElementById('optVolume');
  const optParticles      = document.getElementById('optParticles');
  const optFullscreen     = document.getElementById('optFullscreen');
  const btnOptionsBack    = document.getElementById('btnOptionsBack');

  const infoOverlay       = document.getElementById('infoOverlay');
  const btnInfoBack       = document.getElementById('btnInfoBack');

  const modesOverlay      = document.getElementById('modesOverlay');
  const modeList          = document.getElementById('modeList');
  const btnModesBack      = document.getElementById('btnModesBack');

  // Local selection state for this UI layer
  let selectedHeroId  = Engine.getHero  ? (Engine.getHero()  || 'defender') : 'defender';
  let selectedStageId = Engine.getStage ? (Engine.getStage() || 'computer') : 'computer';

  // --- Helper: show/hide overlays like a tiny window manager ---

  function showOnly(overlay) {
    const overlays = [
      titleOverlay,
      heroSelectOverlay,
      stageOverlay,
      optionsOverlay,
      infoOverlay,
      modesOverlay
    ];

    overlays.forEach(function (el) {
      if (!el) return;
      if (el === overlay) {
        el.classList.add('visible');
      } else {
        el.classList.remove('visible');
      }
    });
  }

  function showTitle() {
    showOnly(titleOverlay);
    if (Engine.showTitle) {
      Engine.showTitle();
    }
  }

  function buildModeList() {
    if (!modeList) return;
    modeList.innerHTML = '';

    const modes = (window.AVDEF && AVDEF.GameModes)
      ? Object.values(AVDEF.GameModes)
      : [];

    if (!modes.length) {
      const empty = document.createElement('div');
      empty.className = 'disabled-tip';
      empty.textContent = 'No game modes installed yet.';
      modeList.appendChild(empty);
      return;
    }

    modes.forEach(function (mode) {
      if (!mode) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mode-card';

      const titleEl = document.createElement('div');
      titleEl.className = 'mode-card-title';
      titleEl.textContent = mode.label || mode.name || mode.id || 'Unnamed mode';

      const descEl = document.createElement('div');
      descEl.className = 'mode-card-desc';
      descEl.textContent = mode.description || '';

      card.appendChild(titleEl);
      card.appendChild(descEl);

      card.addEventListener('click', function () {
        if (Engine.setGameMode && mode.id) {
          Engine.setGameMode(mode.id);
        }

        // For now all modes share the same hero + stage select flow.
        if (Engine.getHero) {
          selectedHeroId = Engine.getHero() || selectedHeroId;
        }
        if (Engine.getStage) {
          selectedStageId = Engine.getStage() || selectedStageId;
        }

        buildHeroGrid();
        buildStageGrid();
        showHeroSelect();
      });

      modeList.appendChild(card);
    });
  }

  function showModes() {
    buildModeList();
    showOnly(modesOverlay);
  }

  function showHeroSelect() {
    showOnly(heroSelectOverlay);
  }

  function showStageSelect() {
    showOnly(stageOverlay);
  }

  function showOptions() {
    showOnly(optionsOverlay);
  }

  function showInfo() {
    showOnly(infoOverlay);
  }

  // --- HERO GRID ---

  function buildHeroGrid() {
    if (!heroGrid) {
      console.warn('[title.js] heroGrid element missing');
      return;
    }
    heroGrid.innerHTML = '';

    if (!AVDEF.Heroes || !AVDEF.Heroes.getAll) {
      console.warn('[title.js] AVDEF.Heroes.getAll missing');
      return;
    }

    const heroes = AVDEF.Heroes.getAll();
    heroes.forEach(function (hero) {
      const card = document.createElement('div');
      card.className = 'hero-card' + (hero.id === selectedHeroId ? ' selected' : '');
      card.dataset.heroId = hero.id;

      const logo = document.createElement('div');
      logo.className = 'hero-logo';
      if (hero.logoUrl) {
        logo.style.backgroundImage = 'url("' + hero.logoUrl + '")';
      } else {
        logo.textContent = hero.initial || '?';
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'hero-name';
      nameEl.textContent = hero.name;

      const roleEl = document.createElement('div');
      roleEl.className = 'hero-role';
      roleEl.textContent = hero.role;

      const descEl = document.createElement('div');
      descEl.className = 'hero-desc';
      descEl.textContent = hero.desc;

      card.appendChild(logo);
      card.appendChild(nameEl);
      card.appendChild(roleEl);
      card.appendChild(descEl);

      card.addEventListener('click', function () {
        selectedHeroId = hero.id;
        if (Engine.setHero) {
          Engine.setHero(selectedHeroId);
        }

        const cards = heroGrid.querySelectorAll('.hero-card');
        cards.forEach(function (c) {
          if (c.dataset.heroId === selectedHeroId) {
            c.classList.add('selected');
          } else {
            c.classList.remove('selected');
          }
        });
      });

      heroGrid.appendChild(card);
    });
  }

  // --- STAGE GRID ---

  function buildStageGrid() {
    if (!stageGrid) {
      console.warn('[title.js] stageGrid element missing');
      return;
    }
    stageGrid.innerHTML = '';

    if (!AVDEF.Stages || !AVDEF.Stages.list) {
      console.warn('[title.js] AVDEF.Stages.list missing');
      return;
    }

    const stages = AVDEF.Stages.list();

    stages.forEach(function (stage) {
      const card = document.createElement('div');
      card.className = 'stage-card' + (stage.unlocked ? '' : ' locked');
      card.dataset.stageId = stage.id;

      const nameEl = document.createElement('div');
      nameEl.className = 'stage-name';
      nameEl.textContent = stage.name;

      const metaEl = document.createElement('div');
      metaEl.className = 'stage-meta';
      metaEl.textContent = stage.unlocked ? stage.desc : 'Locked';

      const lockEl = document.createElement('div');
      lockEl.className = 'stage-lock';
      lockEl.textContent = stage.unlocked ? '' : '🔒';

      card.appendChild(nameEl);
      card.appendChild(metaEl);
      card.appendChild(lockEl);

      if (stage.unlocked) {
        card.addEventListener('click', function () {
          selectedStageId = stage.id;
          if (Engine.setStage) {
            Engine.setStage(selectedStageId);
          }
          updateStageCardSelection();
        });
      }

      stageGrid.appendChild(card);
    });

    updateStageCardSelection();
  }

  function updateStageCardSelection() {
    if (!stageGrid) return;
    const cards = stageGrid.querySelectorAll('.stage-card');
    cards.forEach(function (card) {
      if (card.dataset.stageId === selectedStageId) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  // --- OPTIONS & FULLSCREEN ---

  function setFullscreen(enabled){
    const elem = document.documentElement;
    if (enabled) {
      if (!document.fullscreenElement && elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  function initOptionsFromEngine() {
    if (!Engine.getOptions) return;
    const opts = Engine.getOptions();
    if (optVolume && typeof opts.volume === 'number') {
      optVolume.value = String(opts.volume);
    }
    if (optParticles) {
      optParticles.checked = !!opts.particles;
    }
    if (optFullscreen) {
      optFullscreen.checked = !!document.fullscreenElement;
    }
  }

  function wireOptionsEvents() {
    if (optVolume) {
      optVolume.addEventListener('input', function () {
        const val = parseFloat(optVolume.value);
        if (Engine.setOptions) {
          Engine.setOptions({
            volume: isNaN(val) ? 0.5 : val,
            particles: optParticles ? !!optParticles.checked : true
          });
        }
      });
    }

    if (optParticles) {
      optParticles.addEventListener('change', function () {
        if (Engine.setOptions) {
          const val = parseFloat(optVolume ? optVolume.value : '0.5');
          Engine.setOptions({
            volume: isNaN(val) ? 0.5 : val,
            particles: !!optParticles.checked
          });
        }
      });
    }

    if (optFullscreen) {
      optFullscreen.addEventListener('change', function () {
        setFullscreen(optFullscreen.checked);
      });

      document.addEventListener('fullscreenchange', function () {
        if (!optFullscreen) return;
        optFullscreen.checked = !!document.fullscreenElement;
      });
    }
  }

  // --- BUTTON WIRING ---

  function wireButtons() {
    // Title buttons
    if (btnFreeplay) {
      btnFreeplay.addEventListener('click', function () {
        showModes();
      });
    }

    if (btnOptions) {
      btnOptions.addEventListener('click', function () {
        initOptionsFromEngine();
        showOptions();
      });
    }

    if (btnInfo) {
      btnInfo.addEventListener('click', function () {
        showInfo();
      });
    }

    if (btnQuitTitle) {
      btnQuitTitle.addEventListener('click', function () {
        window.location.reload();
      });
    }

    if (btnModesBack) {
      btnModesBack.addEventListener('click', function () {
        showTitle();
      });
    }

    // Hero select buttons
    if (btnHeroBack) {
      btnHeroBack.addEventListener('click', function () {
        showTitle();
      });
    }

    if (btnHeroStart) {
      btnHeroStart.addEventListener('click', function () {
        if (Engine.setHero) {
          Engine.setHero(selectedHeroId);
        }
        buildStageGrid();
        showStageSelect();
      });
    }

    // Stage select buttons
    if (btnStageBack) {
      btnStageBack.addEventListener('click', function () {
        showHeroSelect();
      });
    }

    if (btnStageStart) {
      btnStageStart.addEventListener('click', function () {
        if (Engine.setStage) {
          Engine.setStage(selectedStageId);
        }
        if (Engine.startRun) {
          Engine.startRun();
        }
        showOnly(null);
      });
    }

    // Options back
    if (btnOptionsBack) {
      btnOptionsBack.addEventListener('click', function () {
        showTitle();
      });
    }

    // Info back
    if (btnInfoBack) {
      btnInfoBack.addEventListener('click', function () {
        showTitle();
      });
    }
  }

  // --- INIT ---

  function initTitleLayer() {
    try {
      // Seed local hero/stage from engine, if provided
      if (Engine.getHero) {
        selectedHeroId = Engine.getHero() || selectedHeroId;
      }
      if (Engine.getStage) {
        selectedStageId = Engine.getStage() || selectedStageId;
      }

      try {
        buildHeroGrid();
      } catch (err) {
        console.error('[title.js] buildHeroGrid failed', err);
      }

      try {
        buildStageGrid();
      } catch (err) {
        console.error('[title.js] buildStageGrid failed', err);
      }

      wireButtons();
      wireOptionsEvents();

      // Start on the title screen
      showTitle();

      // Expose a tiny API for engine to call back to title
      AVDEF.Title = AVDEF.Title || {};
      AVDEF.Title.showTitleScreen = showTitle;
    } catch (err) {
      console.error('[title.js] initTitleLayer failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTitleLayer);
  } else {
    initTitleLayer();
  }
})();


// --- Render engine plugin ---
// This adapter lets the Defender Game Engine delegate all screen drawing
// through a single AVDEF.Render.draw() entry point.
(function(){
  window.AVDEF = window.AVDEF || {};
  AVDEF.Render = AVDEF.Render || {};

  AVDEF.Render.draw = function(){
    if(AVDEF.Engine && typeof AVDEF.Engine._internalDraw === 'function'){
      AVDEF.Engine._internalDraw();
    }
  };
})();
