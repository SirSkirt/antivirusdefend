(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const uiWave = document.getElementById('uiWave');
  const uiHP = document.getElementById('uiHP');
  const uiChips = document.getElementById('uiChips');

  const titleOverlay = document.getElementById('titleOverlay');
  const heroSelectOverlay = document.getElementById('heroSelectOverlay');
  const stageOverlay = document.getElementById('stageOverlay');
  const optionsOverlay = document.getElementById('optionsOverlay');
  const infoOverlay = document.getElementById('infoOverlay');
  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');

  const heroGrid = document.getElementById('heroGrid');
  const stageGrid = document.getElementById('stageGrid');
  const upgradeGrid = document.getElementById('upgradeGrid');

  const btnFreeplay = document.getElementById('btnFreeplay');
  const btnOptions = document.getElementById('btnOptions');
  const btnInfo = document.getElementById('btnInfo');
  const btnQuitTitle = document.getElementById('btnQuitTitle');

  const btnHeroBack = document.getElementById('btnHeroBack');
  const btnHeroStart = document.getElementById('btnHeroStart');

  const btnStageBack = document.getElementById('btnStageBack');
  const btnStageStart = document.getElementById('btnStageStart');

  const optVolume = document.getElementById('optVolume');
  const optParticles = document.getElementById('optParticles');
  const btnOptionsBack = document.getElementById('btnOptionsBack');

  const btnInfoBack = document.getElementById('btnInfoBack');

  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverSummary = document.getElementById('gameOverSummary');
  const btnRestart = document.getElementById('btnRestart');
  const btnQuit = document.getElementById('btnQuit');

  const btnPauseResume = document.getElementById('btnPauseResume');
  const btnPauseQuit = document.getElementById('btnPauseQuit');

  const ransomBar = document.getElementById('ransomBar');
  const ransomTimerBar = document.getElementById('ransomTimerBar');
  const ransomMessage = document.getElementById('ransomMessage');
  const btnPayRansom = document.getElementById('btnPayRansom');
  const btnIgnoreRansom = document.getElementById('btnIgnoreRansom');

  const uiXP = document.getElementById('uiXP');
  const uiLevel = document.getElementById('uiLevel');

  const touchJoystickBase = document.getElementById('touchJoystickBase');
  const touchJoystickStick = document.getElementById('touchJoystickStick');

  const world = {
    width: 960,
    height: 540
  };

  let gameState = 'menu'; // 'menu','heroSelect','stageSelect','playing','paused','upgrade','gameover'
  let lastTime = performance.now();

  const player = {
    x: world.width/2,
    y: world.height/2,
    radius: 18,
    speed: 220,
    baseDamage: 10,
    damageMult: 1,
    baseFireDelay: 0.7,
    fireDelayMult: 1,
    lastShot: 0,
    facingAngle: 0,
    hp: 100,
    maxHp: 100,
    xp: 0,
    xpToNext: 50,
    level: 1,
    stunnedUntil: 0,
    chipMagnetRadius: 0,
    aoeLevel: 0,
    aoeCooldown: 5,
    aoeLast: -999,
    aoeRadius: 120,
    aoeModePaid: false,
    beamLevel: 0,
    beamCooldown: 8,
    beamLast: -999,
    orbitLevel: 0,
    orbitProjectiles: [],
    shieldLevel: 0,
    shieldCooldown: 10,
    shieldLast: -999,
    slowLevel: 0,
    slowFactor: 0.6,
    confuseLevel: 0,
    confuseDuration: 0.8,
    abilities: ['basicShot'],
    phaseShiftLevel: 0,
    phaseShiftDuration: 0.5,
    phaseShiftCooldown: 12,
    phaseShiftLast: -999,
    phaseShiftingUntil: 0,
    antivirusTag: null,
    nortonShieldActiveUntil: 0,
    nortonShieldStage: 0
  };

  let currentHeroId = 'defender';

  const enemies = [];
  const projectiles = [];
  const xpOrbs = [];
  const particles = [];
  const beams = [];
  const aoePulses = [];

  const chips = { count: 0 };

  let currentWave = 1;
  let waveInProgress = false;
  let spawnQueue = [];
  let spawnTimer = 0;
  let spawnInterval = 0.5;
  let enemiesRemainingThisWave = 0;
  let nextEnemyId = 1;

  let gameTime = 0;

  let ransomActive = false;
  let ransomEndTime = 0;
  let ransomAmount = 0;
  let ransomPaid = false;

  let masterVolume = 0.5;
  let enableParticles = true;
  let audioCtx = null;
  let masterGain = null;

  let selectedHeroId = 'defender';

  const heroImages = {};
  function preloadHeroLogos(){
    window.AVDEF = window.AVDEF || {};
    if(!AVDEF.Heroes) return;
    AVDEF.Heroes.getAll().forEach(hero=>{
      if(!hero.logoUrl) return;
      const img = new Image();
      img.src = hero.logoUrl;
      heroImages[hero.id] = img;
    });
  }
  preloadHeroLogos();

  // HERO DATA moved to heroes/heroes.js

  // STAGES moved to stages/stages.js

  let selectedStageId = 'computer';
  let currentStageId = 'computer';

  function buildStageGrid(){
    stageGrid.innerHTML = '';
    AVDEF.Stages.list().forEach(stage=>{
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
          updateStageCardSelection();
        });
      }

      stageGrid.appendChild(card);
    });
    updateStageCardSelection();
  }

  function updateStageCardSelection(){
    const cards = stageGrid.querySelectorAll('.stage-card');
    cards.forEach(card=>{
      if(card.dataset.stageId === selectedStageId){
        card.classList.add('selected');
      }else{
        card.classList.remove('selected');
      }
    });
  }

  function randRange(min,max){
    return Math.random()*(max-min)+min;
  }

  function applyHeroStats(id){
    const hero = AVDEF.Heroes.get(id);
    player.speed = hero.speed;
    player.baseDamage = hero.baseDamage;
    player.baseFireDelay = hero.fireDelay;
    player.damageMult = 1;
    player.fireDelayMult = 1;
    player.hp = player.maxHp = 100;
    player.xp = 0;
    player.xpToNext = 50;
    player.level = 1;
    player.aoeLevel = 0;
    player.beamLevel = 0;
    player.orbitLevel = 0;
    player.shieldLevel = 0;
    player.slowLevel = 0;
    player.confuseLevel = 0;
    player.phaseShiftLevel = 0;
    player.aoeModePaid = false;
    player.abilities = ['basicShot'];
    player.nortonShieldActiveUntil = 0;
    player.nortonShieldStage = 0;
  }

  function resetGame(){
    gameTime = 0;
    player.x = world.width/2;
    player.y = world.height/2;
    player.hp = player.maxHp;
    player.xp = 0;
    player.xpToNext = 50;
    player.level = 1;
    player.stunnedUntil = 0;
    player.chipMagnetRadius = 0;
    player.orbitProjectiles.length = 0;
    player.shieldLast = -999;
    player.aoeLast = -999;
    player.beamLast = -999;
    player.phaseShiftLast = -999;
    player.phaseShiftingUntil = 0;
    player.antivirusTag = null;
    player.nortonShieldActiveUntil = 0;
    player.nortonShieldStage = 0;

    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;
    particles.length = 0;
    beams.length = 0;
    aoePulses.length = 0;

    currentWave = 1;
    waveInProgress = false;
    spawnQueue = [];
    spawnTimer = 0;
    spawnInterval = 0.5;
    enemiesRemainingThisWave = 0;
    nextEnemyId = 1;

    ransomActive = false;
    ransomEndTime = 0;
    ransomAmount = 0;
    ransomPaid = false;
    ransomBar.classList.remove('visible');

    chips.count = 0;
    updateTopUI();
  }

  function ensureAudio(){
    if(audioCtx) return;
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(audioCtx.destination);
    }catch(e){
      console.warn('Audio init failed', e);
    }
  }

  function playBeep(freq=440,duration=0.1,volume=0.2){
    if(!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(masterGain);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now+duration);
  }

  function spawnProjectile(x,y,angle,speed,damage,kind){
    projectiles.push({
      x,y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      radius: 6,
      damage,
      kind,
      life: 3
    });
  }

  function spawnXP(x,y,amount){
    xpOrbs.push({
      x,y,
      radius: 6,
      amount,
      vx:0,
      vy:0
    });
  }

  function spawnParticles(x,y,color,count=6){
    if(!enableParticles) return;
    for(let i=0;i<count;i++){
      const a = Math.random()*Math.PI*2;
      const s = randRange(30,90);
      particles.push({
        x,y,
        vx: Math.cos(a)*s,
        vy: Math.sin(a)*s,
        life: randRange(0.2,0.6),
        maxLife: randRange(0.2,0.6),
        color
      });
    }
  }

  function spawnEnemy(type){
    const margin = 40;
    const edge = Math.floor(Math.random()*4);
    let x,y;
    if(edge===0){
      x = Math.random()*world.width;
      y = -margin;
    }else if(edge===1){
      x = Math.random()*world.width;
      y = world.height+margin;
    }else if(edge===2){
      x = -margin;
      y = Math.random()*world.height;
    }else{
      x = world.width+margin;
      y = Math.random()*world.height;
    }

    const stats = AVDEF.Enemies.getStats(type, currentWave);

    const e = {
      id: nextEnemyId++,
      type,
      x,y,
      vx:0,vy:0,
      radius:14,
      speed: stats.speed,
      hp: stats.hp,
      maxHp: stats.hp,
      disguised: !!stats.disguised,
      stolenAbility: null,
      lastAttack: 0,
      slowUntil: 0,
      confusedUntil: 0,
      xpValue: stats.xpValue
    };

    enemies.push(e);
  }

  function activateNortonShield(duration,stage){
    player.nortonShieldStage = stage;
    player.nortonShieldActiveUntil = gameTime + duration;
  }

  function damagePlayer(amount){
    if(player.hp<=0) return;

    if(gameTime < player.nortonShieldActiveUntil){
      if(player.nortonShieldStage === 1){
        activateNortonShield(1.0,2);
        return;
      }else if(player.nortonShieldStage === 2){
        activateNortonShield(0,0);
        return;
      }
    }

    if(gameTime < player.phaseShiftingUntil) return;

    player.hp -= amount;
    if(player.hp<0) player.hp = 0;
    spawnParticles(player.x,player.y,'#f97373',10);
    playBeep(220,0.08,0.35);
    updateTopUI();

    if(player.hp<=0){
      endRun(false);
    }
  }

  function gainXP(amount){
    player.xp += amount;
    while(player.xp >= player.xpToNext){
      player.xp -= player.xpToNext;
      player.level++;
      player.xpToNext = Math.floor(player.xpToNext*1.35);
      showUpgradeChoices('xp');
      gameState = 'upgrade';
    }
    updateTopUI();
  }

  // BASE_UPGRADES & heroSpecificUpgrades moved to upgrades/upgrades.js

  function showUpgradeChoices(source){
    source = source || 'wave'; // 'wave' or 'xp'
    upgradeGrid.innerHTML = '';
    const pool = AVDEF.Upgrades.getPool(currentHeroId, player);
    const picks = [];
    const poolCopy = pool.slice();
    const count = Math.min(3,poolCopy.length);
    for(let i=0;i<count;i++){
      const idx = Math.floor(Math.random()*poolCopy.length);
      picks.push(poolCopy.splice(idx,1)[0]);
    }
    picks.forEach(up=>{
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      const h3 = document.createElement('h3');
      h3.textContent = up.name;
      const p = document.createElement('p');
      p.textContent = up.desc;
      card.appendChild(h3);
      card.appendChild(p);
      card.onclick = ()=>{
        up.apply();
        upgradeOverlay.classList.remove('visible');
        if(source === 'wave'){
          planWave();
        }
        gameState = 'playing';
      };
      upgradeGrid.appendChild(card);
    });
    upgradeOverlay.classList.add('visible');
  }

  function endRun(victory){
    if(gameState === 'gameover') return;
    gameState = 'gameover';
    gameOverTitle.textContent = victory ? 'System Secured!' : 'System Compromised!';
    gameOverSummary.textContent = `Wave ${currentWave} | XP ${player.xp} | Chips ${chips.count}`;
    gameOverOverlay.classList.add('visible');
  }

  function planWave(){
    waveInProgress = true;
    spawnQueue = [];
    const baseAdware = 6 + currentWave*2;
    const virusCount = Math.floor(currentWave/3);
    const spywareCount = Math.floor(currentWave/2);
    const ransomwareCount = currentWave >= 5 ? Math.floor((currentWave-4)/3)+1 : 0;

    for(let i=0;i<baseAdware;i++) spawnQueue.push('adware');
    for(let i=0;i<spywareCount;i++) spawnQueue.push('spyware');
    for(let i=0;i<virusCount;i++) spawnQueue.push('virus');
    for(let i=0;i<ransomwareCount;i++) spawnQueue.push('ransomware');

    enemiesRemainingThisWave = spawnQueue.length;
    spawnInterval = Math.max(0.15,0.5 - currentWave*0.01);
  }

  function updateTopUI(){
    uiWave.textContent = `Wave ${currentWave}`;
    uiHP.textContent = `HP ${player.hp}/${player.maxHp}`;
    uiXP.textContent = `XP ${player.xp}/${player.xpToNext}`;
    uiLevel.textContent = `LVL ${player.level}`;
    uiChips.textContent = `Chips ${chips.count}`;
  }

  function update(dt){
    if(gameState !== 'playing') return;

    gameTime += dt;

    if(!waveInProgress){
      currentWave++;
      planWave();
      showUpgradeChoices('wave');
      gameState = 'upgrade';
      return;
    }

    spawnTimer += dt;
    while(spawnTimer >= spawnInterval && spawnQueue.length>0){
      spawnTimer -= spawnInterval;
      const type = spawnQueue.shift();
      spawnEnemy(type);
    }

    if(spawnQueue.length===0 && enemiesRemainingThisWave<=0){
      waveInProgress = false;
    }

    // TODO: move, collide, update enemies/projectiles/xp etc
    // (unchanged from your original – keep that block here)
  }

  function draw(){
    // draw background, player, enemies, projectiles, HUD
    // (the rest of your original draw code goes here unchanged)
  }

  function onKeyDown(e){
    if(e.code === 'Space' && gameState === 'playing'){
      // basic ability trigger left as in your original code
    }
    if(e.code === 'Escape'){
      if(gameState === 'playing'){
        gameState = 'paused';
        pauseOverlay.classList.add('visible');
      }else if(gameState === 'paused'){
        gameState = 'playing';
        pauseOverlay.classList.remove('visible');
      }
    }
  }

  function onKeyUp(e){
    // keep your original keyup logic if any
  }

  function resizeCanvas(){
    canvas.width = world.width;
    canvas.height = world.height;
  }

  function buildHeroGrid(){
    heroGrid.innerHTML = '';
    AVDEF.Heroes.getAll().forEach(hero=>{
      const card = document.createElement('div');
      card.className = 'hero-card' + (hero.id === selectedHeroId ? ' selected':'');
      card.dataset.heroId = hero.id;

      const logo = document.createElement('div');
      logo.className = 'hero-logo';
      if(heroImages[hero.id]){
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
        document.querySelectorAll('.hero-card').forEach(c=>{
          c.classList.toggle('selected', c.dataset.heroId === selectedHeroId);
        });
      });

      heroGrid.appendChild(card);
    });
  }

  // ---- Buttons & UI wiring ----

  btnFreeplay.addEventListener('click', ()=>{
    gameState = 'heroSelect';
    titleOverlay.classList.remove('visible');
    heroSelectOverlay.classList.add('visible');
  });

  btnOptions.addEventListener('click', ()=>{
    optionsOverlay.classList.add('visible');
    titleOverlay.classList.remove('visible');
  });

  btnInfo.addEventListener('click', ()=>{
    infoOverlay.classList.add('visible');
    titleOverlay.classList.remove('visible');
  });

  btnQuitTitle.addEventListener('click', ()=>{
    window.location.reload();
  });

  btnOptionsBack.addEventListener('click', ()=>{
    optionsOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  btnInfoBack.addEventListener('click', ()=>{
    infoOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  optVolume.addEventListener('input', ()=>{
    masterVolume = parseFloat(optVolume.value);
    if(masterGain){
      masterGain.gain.value = masterVolume;
    }
  });

  optParticles.addEventListener('change', ()=>{
    enableParticles = !!optParticles.checked;
  });

  btnHeroBack.addEventListener('click', ()=>{
    heroSelectOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  btnHeroStart.addEventListener('click', ()=>{
    const hero = AVDEF.Heroes.get(selectedHeroId);
    if(!hero) return;
    currentHeroId = hero.id;
    applyHeroStats(currentHeroId);
    heroSelectOverlay.classList.remove('visible');
    buildStageGrid();
    stageOverlay.classList.add('visible');
  });

  btnStageBack.addEventListener('click', ()=>{
    stageOverlay.classList.remove('visible');
    heroSelectOverlay.classList.add('visible');
  });

  btnStageStart.addEventListener('click', ()=>{
    const stage = AVDEF.Stages.get(selectedStageId);
    if(!stage || !stage.unlocked) return;
    currentStageId = stage.id;
    stageOverlay.classList.remove('visible');
    resetGame();
    gameState = 'playing';
    planWave();
  });

  btnRestart.addEventListener('click', ()=>{
    resetGame();
    gameOverOverlay.classList.remove('visible');
    gameState = 'playing';
    planWave();
  });

  btnQuit.addEventListener('click', ()=>{
    gameOverOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
    gameState = 'menu';
  });

  btnPauseResume.addEventListener('click', ()=>{
    if(gameState === 'paused'){
      gameState = 'playing';
      pauseOverlay.classList.remove('visible');
    }else if(gameState === 'playing'){
      gameState = 'paused';
      pauseOverlay.classList.add('visible');
    }
  });

  btnPauseQuit.addEventListener('click', ()=>{
    pauseOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
    gameState = 'menu';
  });

  btnPayRansom.addEventListener('click', ()=>{
    if(!ransomActive) return;
    if(chips.count >= ransomAmount){
      chips.count -= ransomAmount;
      ransomPaid = true;
      ransomActive = false;
      ransomBar.classList.remove('visible');
      updateTopUI();
    }
  });

  btnIgnoreRansom.addEventListener('click', ()=>{
    if(!ransomActive) return;
    ransomActive = false;
    ransomBar.classList.remove('visible');
    player.speed *= 0.8;
    player.baseFireDelay *= 1.15;
  });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function loop(now){
    const dt = Math.min(0.05,(now-lastTime)/1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resizeCanvas();
  updateTopUI();
  buildHeroGrid();
  requestAnimationFrame(loop);
})();
