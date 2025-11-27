// title.js
 function(){
  window.AVDEF = window.AVDEF || {};
  const Engine = AVDEF.Engine || {};

  // --- DOM references for title + menus ---
  const titleOverlay      = document.getElementById('titleOverlay');
  const btnFreeplay       = document.getElementById('btnFreeplay');
  const btnOptions        = document.getElementById('btnOptions');
  const btnInfo           = document.getElementById('btnInfo');
  const btnQuitTitle      = document.getElementById('btnQuitTitle');

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
  const btnOptionsBack    = document.getElementById('btnOptionsBack');

  const infoOverlay       = document.getElementById('infoOverlay');
  const btnInfoBack       = document.getElementById('btnInfoBack');

  // Local selection state for this UI layer
  let selectedHeroId  = Engine.getHero ? Engine.getHero() : 'defender';
  let selectedStageId = Engine.getStage ? Engine.getStage() : 'computer';

  // --- Helper: show/hide overlays like a tiny window manager ---

  function showOnly(overlay){
    const overlays = [
      titleOverlay,
      heroSelectOverlay,
      stageOverlay,
      optionsOverlay,
      infoOverlay
    ];
    overlays.forEach(el=>{
      if(!el) return;
      if(el === overlay){
        el.classList.add('visible');
      }else{
        el.classList.remove('visible');
      }
    });
  }

  function showTitle(){
    showOnly(titleOverlay);
    if(Engine.showTitle){
      Engine.showTitle();
    }
  }
  // Expose a small API so engine.js can request the title screen
  AVDEF.Title = AVDEF.Title || {};
  AVDEF.Title.showTitleScreen = showTitle;


  function showHeroSelect(){
    showOnly(heroSelectOverlay);
  }

  function showStageSelect(){
    showOnly(stageOverlay);
  }

  function showOptions(){
    showOnly(optionsOverlay);
  }

  function showInfo(){
    showOnly(infoOverlay);
  }

  // --- HERO GRID ---

  function buildHeroGrid(){
    if(!heroGrid){
      console.warn('[title.js] heroGrid element missing');
      return;
    }
    heroGrid.innerHTML = '';

    if(!AVDEF.Heroes || !AVDEF.Heroes.getAll){
      console.warn('[title.js] AVDEF.Heroes.getAll missing');
      return;
    }

    const heroes = AVDEF.Heroes.getAll();
    heroes.forEach(hero=>{
      const card = document.createElement('div');
      card.className = 'hero-card' + (hero.id === selectedHeroId ? ' selected':'');
      card.dataset.heroId = hero.id;

      const logo = document.createElement('div');
      logo.className = 'hero-logo';
      if(hero.logoUrl){
        logo.style.backgroundImage = `url("${hero.logoUrl}")`;
      }else{
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

      card.addEventListener('click', ()=>{
        selectedHeroId = hero.id;
        if(Engine.setHero){
          Engine.setHero(selectedHeroId);
        }

        const cards = heroGrid.querySelectorAll('.hero-card');
        cards.forEach(c=>{
          if(c.dataset.heroId === selectedHeroId){
            c.classList.add('selected');
          }else{
            c.classList.remove('selected');
          }
        });
      });

      heroGrid.appendChild(card);
    });
  }

  // --- STAGE GRID ---

  function buildStageGrid(){
    if(!stageGrid){
      console.warn('[title.js] stageGrid element missing');
      return;
    }
    stageGrid.innerHTML = '';

    if(!AVDEF.Stages || !AVDEF.Stages.list){
      console.warn('[title.js] AVDEF.Stages.list missing');
      return;
    }

    const stages = AVDEF.Stages.list();

    stages.forEach(stage=>{
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

      if(stage.unlocked){
        card.addEventListener('click', ()=>{
          selectedStageId = stage.id;
          if(Engine.setStage){
            Engine.setStage(selectedStageId);
          }
          updateStageCardSelection();
        });
      }

      stageGrid.appendChild(card);
    });

    updateStageCardSelection();
  }

  function updateStageCardSelection(){
    if(!stageGrid) return;
    const cards = stageGrid.querySelectorAll('.stage-card');
    cards.forEach(card=>{
      if(card.dataset.stageId === selectedStageId){
        card.classList.add('selected');
      }else{
        card.classList.remove('selected');
      }
    });
  }

  // --- OPTIONS BINDING ---

  function initOptionsFromEngine(){
    if(!Engine.getOptions) return;
    const opts = Engine.getOptions();
    if(optVolume && typeof opts.volume === 'number'){
      optVolume.value = String(opts.volume);
    }
    if(optParticles){
      optParticles.checked = !!opts.particles;
    }
  }

  function wireOptionsEvents(){
    if(optVolume){
      optVolume.addEventListener('input', ()=>{
        const val = parseFloat(optVolume.value);
        if(Engine.setOptions){
          Engine.setOptions({
            volume: isNaN(val) ? 0.5 : val,
            particles: optParticles ? !!optParticles.checked : true
          });
        }
      });
    }

    if(optParticles){
      optParticles.addEventListener('change', ()=>{
        if(Engine.setOptions){
          const val = parseFloat(optVolume ? optVolume.value : '0.5');
          Engine.setOptions({
            volume: isNaN(val) ? 0.5 : val,
            particles: !!optParticles.checked
          });
        }
      });
    }
  }

  // --- BUTTON WIRING ---

  function wireButtons(){
    // Title buttons
    if(btnFreeplay){
      btnFreeplay.addEventListener('click', ()=>{
        showHeroSelect();
      });
    }

    if(btnOptions){
      btnOptions.addEventListener('click', ()=>{
        initOptionsFromEngine();
        showOptions();
      });
    }

    if(btnInfo){
      btnInfo.addEventListener('click', ()=>{
        showInfo();
      });
    }

    if(btnQuitTitle){
      btnQuitTitle.addEventListener('click', ()=>{
        // Same behaviour as before: just reload the page
        window.location.reload();
      });
    }

    // Hero select buttons
    if(btnHeroBack){
      btnHeroBack.addEventListener('click', ()=>{
        showTitle();
      });
    }

    if(btnHeroStart){
      btnHeroStart.addEventListener('click', ()=>{
        // We assume selectedHeroId has been kept in sync already
        if(Engine.setHero){
          Engine.setHero(selectedHeroId);
        }
        buildStageGrid();
        showStageSelect();
      });
    }

    // Stage select buttons
    if(btnStageBack){
      btnStageBack.addEventListener('click', ()=>{
        showHeroSelect();
      });
    }

    if(btnStageStart){
      btnStageStart.addEventListener('click', ()=>{
        if(Engine.setStage){
          Engine.setStage(selectedStageId);
        }
        if(Engine.startRun){
          Engine.startRun();
        }
        // Once the game starts, hide all pre-game overlays
        showOnly(null);
      });
    }

    // Options back
    if(btnOptionsBack){
      btnOptionsBack.addEventListener('click', ()=>{
        showTitle();
      });
    }

    // Info back
    if(btnInfoBack){
      btnInfoBack.addEventListener('click', ()=>{
        showTitle();
      });
    }
  }
  

  // --- INIT ---

  function initTitleLayer(){
    // Seed local hero/stage from engine, if provided
    if(Engine.getHero){
      selectedHeroId = Engine.getHero() || selectedHeroId;
    }
    if(Engine.getStage){
      selectedStageId = Engine.getStage() || selectedStageId;
    }

    buildHeroGrid();
    buildStageGrid();
    wireButtons();
    wireOptionsEvents();

    // Start on the title screen
    showTitle();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTitleLayer);
  }else{
    initTitleLayer();
  }
})();
