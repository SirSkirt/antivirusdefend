(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const uiWave = document.getElementById('uiWave');
  const uiHP = document.getElementById('uiHP');
  const uiChips = document.getElementById('uiChips');

  const titleOverlay = document.getElementById('titleOverlay');
  const heroSelectOverlay = document.getElementById('heroSelectOverlay');
  const heroGrid = document.getElementById('heroGrid');
  const stageOverlay = document.getElementById('stageOverlay');
  const stageGrid = document.getElementById('stageGrid');
  const optionsOverlay = document.getElementById('optionsOverlay');
  const infoOverlay = document.getElementById('infoOverlay');
  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const upgradeGrid = document.getElementById('upgradeGrid');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const gameOverText = document.getElementById('gameOverText');
  const pauseOverlay = document.getElementById('pauseOverlay');

  const btnFreeplay = document.getElementById('btnFreeplay');
  const btnOptions = document.getElementById('btnOptions');
  const btnHowTo = document.getElementById('btnHowTo');
  const btnExit = document.getElementById('btnExit');

  const btnHeroBack = document.getElementById('btnHeroBack');
  const btnHeroStart = document.getElementById('btnHeroStart');
  const btnStageBack = document.getElementById('btnStageBack');
  const btnStageStart = document.getElementById('btnStageStart');

  const btnOptionsBack = document.getElementById('btnOptionsBack');
  const optSfx = document.getElementById('optSfx');
  const optVolume = document.getElementById('optVolume');

  const btnInfoBack = document.getElementById('btnInfoBack');
  const btnRestart = document.getElementById('btnRestart');
  const btnQuit = document.getElementById('btnQuit');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const btnPauseTitle = document.getElementById('btnPauseTitle');

  const ransomBar = document.getElementById('ransomBar');
  const ransomText = document.getElementById('ransomText');
  const btnPayRansom = document.getElementById('btnPayRansom');
  const btnIgnoreRansom = document.getElementById('btnIgnoreRansom');

  // Joystick
  const joyWrap = document.getElementById('joystick');
  const joyKnob = document.getElementById('joyKnob');
  let joyActive = false;
  let joyCenter = {x:0,y:0};
  let joyVector = {x:0,y:0};

  // Mouse position for scan cone
  let mouseWorld = {x:0,y:0};
  let hasMouse = false;

  function resizeCanvas(){
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const desiredAspect = 16/9;
    let cw = w, ch = h;
    if(cw/ch > desiredAspect){
      cw = ch * desiredAspect;
    }else{
      ch = cw / desiredAspect;
    }
    canvas.width = cw * window.devicePixelRatio;
    canvas.height = ch * window.devicePixelRatio;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
  }
  window.addEventListener('resize', resizeCanvas);

  const world = {
    width: 960,
    height: 540
  };

  function screenToWorld(px,py){
    const sx = canvas.width/window.devicePixelRatio/world.width;
    const sy = canvas.height/window.devicePixelRatio/world.height;
    const s = Math.min(sx,sy);
    const offsetX = (canvas.width/window.devicePixelRatio - world.width*s)/2;
    const offsetY = (canvas.height/window.devicePixelRatio - world.height*s)/2;
    const rect = canvas.getBoundingClientRect();
    const x = (px - rect.left)/window.devicePixelRatio;
    const y = (py - rect.top)/window.devicePixelRatio;
    return {
      x: (x - offsetX)/s,
      y: (y - offsetY)/s
    };
  }

  // Input
  const keys = {};

  window.addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    keys[k] = true;

    // Pause / resume with Escape or P
    if(k === 'escape' || k === 'p'){
      if(gameState === 'playing'){
        // enter pause
        pauseGame();
      }else if(gameState === 'paused'){
        resumeGame();
      }
    }
  });

  window.addEventListener('keyup', e=>{
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener('mousemove', e=>{
    hasMouse = true;
    mouseWorld = screenToWorld(e.clientX,e.clientY);
  });

  // Joystick input
  function joyPointerDown(e){
    e.preventDefault();
    joyActive = true;
    const rect = joyWrap.getBoundingClientRect();
    joyCenter.x = rect.left + rect.width/2;
    joyCenter.y = rect.top + rect.height/2;
    updateJoy(e);
  }
  function joyPointerMove(e){
    if(!joyActive) return;
    e.preventDefault();
    updateJoy(e);
  }
  function joyPointerUp(e){
    if(!joyActive) return;
    e.preventDefault();
    joyActive = false;
    joyVector.x = 0;
    joyVector.y = 0;
    joyKnob.style.transform = 'translate(-50%,-50%)';
  }
  function getPointFromEvent(e){
    if(e.touches && e.touches.length>0){
      return {x:e.touches[0].clientX, y:e.touches[0].clientY};
    }
    return {x:e.clientX,y:e.clientY};
  }
  function updateJoy(e){
    const pt = getPointFromEvent(e);
    const dx = pt.x - joyCenter.x;
    const dy = pt.y - joyCenter.y;
    const maxR = 50;
    const dist = Math.hypot(dx,dy);
    let ux = dx, uy = dy;
    if(dist > maxR){
      ux = dx/dist * maxR;
      uy = dy/dist * maxR;
    }
    joyVector.x = (dist>8) ? ux/maxR : 0;
    joyVector.y = (dist>8) ? uy/maxR : 0;
    joyKnob.style.transform = `translate(calc(-50% + ${ux}px),calc(-50% + ${uy}px))`;
  }

  joyWrap.addEventListener('pointerdown', joyPointerDown);
  window.addEventListener('pointermove', joyPointerMove);
  window.addEventListener('pointerup', joyPointerUp);
  window.addEventListener('pointercancel', joyPointerUp);

  // AUDIO
  let audioCtx = null;
  let masterGain = null;
  let sfxEnabled = true;
  let masterVolume = 0.8;
  let lastStepTime = 0;

  function initAudio(){
    if(audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(audioCtx.destination);
  }

  function ensureAudio(){
    if(!audioCtx) initAudio();
    if(audioCtx && audioCtx.state === 'suspended'){
      audioCtx.resume();
    }
  }

  function playScanStep(){
    if(!sfxEnabled || !audioCtx) return;
    const ctxA = audioCtx;
    const now = ctxA.currentTime;

    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  function playShoot(){
    if(!sfxEnabled || !audioCtx) return;
    const ctxA = audioCtx;
    const now = ctxA.currentTime;

    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  optSfx.addEventListener('change', ()=>{
    sfxEnabled = optSfx.checked;
  });
  optVolume.addEventListener('input', ()=>{
    masterVolume = parseFloat(optVolume.value);
    if(masterGain){
      masterGain.gain.value = masterVolume;
    }
  });

  // HERO DATA
  const HEROES = {
    defender:{
      id:'defender',
      name:'Windows Defender',
      role:'Balanced Shield Toss',
      desc:'Young and eager, ready to save Windows with shield tosses.',
      speed:230,
      baseDamage:12,
      fireDelay:0.7,
      initial:'WD',
      color:'#1d4ed8',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Windows-defender.svg/240px-Windows-defender.svg.png"
    },
    avg:{
      id:'avg',
      name:'AVG',
      role:'Slow but strong',
      desc:'Older antivirus. Slower, harder-hitting shots that debuff threats.',
      speed:200,
      baseDamage:16,
      fireDelay:0.8,
      initial:'A',
      color:'#f97316',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/AVG_Similar_Icon.svg/960px-AVG_Similar_Icon.svg.png?20200830015222"
    },
    avast:{
      id:'avast',
      name:'Avast',
      role:'AOE & scanning',
      desc:'Free Trial with scans and knockback pulses. Paid upgrades get wild.',
      speed:220,
      baseDamage:11,
      fireDelay:0.65,
      initial:'AV',
      color:'#f97316',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/4/4e/Avast_Software_white_logo.png?20190728134047"
    },
    norton:{
      id:'norton',
      name:'Norton',
      role:'Beam DPS & shields',
      desc:'Grandfather AV. Rolling turret with beam combos and emergency shields.',
      speed:195,
      baseDamage:18,
      fireDelay:0.85,
      initial:'N',
      color:'#facc15',
      logoUrl:"https://cdn.brandfetch.io/idooDSluCu/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    mcafee:{
      id:'mcafee',
      name:'McAfee',
      role:'Tag Team',
      desc:'Best when paired with Defender. Can call in a Defender ally.',
      speed:215,
      baseDamage:14,
      fireDelay:0.7,
      initial:'M',
      color:'#b91c1c',
      logoUrl:"https://companieslogo.com/img/orig/MCFE-d6ec69dd.png?t=1720244492"
    },
    q360:{
      id:'q360',
      name:'360 Total Security',
      role:'Agile',
      desc:'Fast, rounded stats for aggressive play.',
      speed:245,
      baseDamage:11,
      fireDelay:0.6,
      initial:'360',
      color:'#16a34a',
      logoUrl:"https://packagestore.com/wp-content/uploads/2023/07/0D56757242667073F5E9610001F2E43A.png"
    }
  };

  const STAGES = [
    {
      id:'computer',
      name:'Computer',
      desc:'Standard desktop case interior – the current battlefield.',
      difficulty:'Normal',
      unlocked:true
    },
    { id:'laptop', name:'Laptop', desc:'Compact thermal chaos.', difficulty:'Locked', unlocked:false },
    { id:'datacenter', name:'Datacenter', desc:'Racks, cables, and lag.', difficulty:'Locked', unlocked:false },
    { id:'smartphone', name:'Smartphone', desc:'Touchscreen territory.', difficulty:'Locked', unlocked:false },
    { id:'router', name:'Router', desc:'Packets, ports, and pings.', difficulty:'Locked', unlocked:false },
    { id:'bios', name:'BIOS', desc:'Low-level panic zone.', difficulty:'Locked', unlocked:false }
  ];

  let selectedStageId = 'computer';
  let currentStageId = 'computer';

  function buildStageGrid(){
    stageGrid.innerHTML = '';
    STAGES.forEach(stage=>{
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

  // In-canvas logo images (for heads & virus mimic)
  const heroImages = {};
  function preloadHeroLogos(){
    Object.values(HEROES).forEach(hero=>{
      if(!hero.logoUrl) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      heroImages[hero.id] = {img, ready:false};
      img.onload = ()=>{ heroImages[hero.id].ready = true; };
      img.onerror = ()=>{ heroImages[hero.id].ready = false; };
      img.src = hero.logoUrl;
    });
  }
  preloadHeroLogos();

  let selectedHeroId = 'defender';
  let currentHeroId = 'defender';

  // Build hero select grid
  function buildHeroGrid(){
    heroGrid.innerHTML = '';
    Object.values(HEROES).forEach(hero=>{
      const card = document.createElement('div');
      card.className = 'hero-card';
      card.dataset.heroId = hero.id;

      const header = document.createElement('div');
      header.className = 'hero-header';

      const iconWrap = document.createElement('div');
      iconWrap.className = 'hero-icon';

      if(hero.logoUrl){
        const img = document.createElement('img');
        img.src = hero.logoUrl;
        iconWrap.appendChild(img);
      }else{
        iconWrap.style.background = hero.color || '#1f2937';
        iconWrap.textContent = hero.initial || hero.name[0];
      }

      const nameWrap = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'hero-name';
      nameEl.textContent = hero.name;
      const roleEl = document.createElement('div');
      roleEl.className = 'hero-role';
      roleEl.textContent = hero.role;
      nameWrap.appendChild(nameEl);
      nameWrap.appendChild(roleEl);

      header.appendChild(iconWrap);
      header.appendChild(nameWrap);

      const desc = document.createElement('div');
      desc.className = 'hero-desc';
      desc.textContent = hero.desc;

      const stats = document.createElement('div');
      stats.className = 'stat-line';
      stats.textContent = `Speed: ${hero.speed} • Damage: ${hero.baseDamage}`;

      card.appendChild(header);
      card.appendChild(desc);
      card.appendChild(stats);

      card.addEventListener('click', ()=>{
        selectedHeroId = hero.id;
        updateHeroCardSelection();
      });

      heroGrid.appendChild(card);
    });
    updateHeroCardSelection();
  }

  function updateHeroCardSelection(){
    const cards = heroGrid.querySelectorAll('.hero-card');
    cards.forEach(card=>{
      if(card.dataset.heroId === selectedHeroId){
        card.classList.add('selected');
      }else{
        card.classList.remove('selected');
      }
    });
  }

  // Game state
  let gameState = 'menu'; // menu | playing | upgrade | gameover | paused
  let lastTime = performance.now();
  let gameTime = 0;

  const player = {
    x: world.width/2,
    y: world.height/2,
    radius: 16,
    speed: 230,
    hp: 5,
    maxHp: 5,
    baseDamage: 12,
    damageMult: 1,
    baseFireDelay: 0.7,
    fireDelayMult: 1,
    fireCooldown: 0,
    facingAngle: 0,
    stunnedUntil: 0,
    invertedUntil: 0,
    abilities: ['basicShot'],
    orbitLevel: 0,
    orbitCooldown: 0,
    orbitPeriod: 4,

    // XP / level
    xp: 0,
    xpToNext: 40,
    level: 1,

    // Hero-specific ability levels/state
    shieldLevel: 0,      // Defender
    slowLevel: 0,        // AVG
    aoeLevel: 0,         // Avast
    aoeModePaid: false,
    beamLevel: 0,        // Norton
    beamCombo: 0,
    lastBeamEnemyId: null,
    lastBeamTime: 0,
    nortonShieldStage: 0,
    nortonShieldActiveUntil: 0,

    tagLevel: 0,         // McAfee
    nextTagTime: 0,
  };

  const projectiles = [];
  const enemies = [];
  const beams = [];  // Norton beam visuals
  const aoePulses = []; // Avast pulses

  const chips = { amount: 0 };

  let currentWave = 0;
  let spawnQueue = [];
  let spawnTimer = 0;
  let waveInProgress = false;

  // Ransomware state
  let activeRansom = null;
  let nextEnemyId = 1;

  // McAfee ally
  let ally = null;

  function randRange(min,max){
    return Math.random()*(max-min)+min;
  }

  function applyHeroStats(id){
    const hero = HEROES[id] || HEROES.defender;
    player.speed = hero.speed;
    player.baseDamage = hero.baseDamage;
    player.baseFireDelay = hero.fireDelay;
  }

  function resetHeroState(){
    player.shieldLevel = 0;
    player.slowLevel = 0;
    player.aoeLevel = 0;
    player.aoeModePaid = false;
    player.beamLevel = 0;
    player.beamCombo = 0;
    player.lastBeamEnemyId = null;
    player.lastBeamTime = 0;
    player.nortonShieldStage = 0;
    player.nortonShieldActiveUntil = 0;
    player.tagLevel = 0;
    player.nextTagTime = gameTime + 10;
    ally = null;
  }

  function resetGame(){
    gameTime = 0;
    currentWave = 0;
    spawnQueue = [];
    spawnTimer = 0;
    waveInProgress = false;
    enemies.length = 0;
    projectiles.length = 0;
    beams.length = 0;
    aoePulses.length = 0;
    chips.amount = 0;
    activeRansom = null;
    player.x = world.width/2;
    player.y = world.height/2;
    player.hp = 5;
    player.maxHp = 5;
    player.damageMult = 1;
    player.fireDelayMult = 1;
    player.fireCooldown = 0;
    player.facingAngle = 0;
    player.stunnedUntil = 0;
    player.invertedUntil = 0;
    player.abilities = ['basicShot'];
    player.orbitLevel = 0;
    player.orbitPeriod = 4;
    player.xp = 0;
    player.xpToNext = 40;
    player.level = 1;

    resetHeroState();
    applyHeroStats(currentHeroId);
    updateTopUI();
  }

  function updateTopUI(){
    uiWave.textContent = currentWave;
    uiHP.textContent = player.hp;
    uiChips.textContent = chips.amount;
  }

  // XP / Level
  function gainXP(amount){
    player.xp += amount;
    while(player.xp >= player.xpToNext){
      player.xp -= player.xpToNext;
      player.level++;
      player.xpToNext = Math.floor(player.xpToNext * 1.25 + 10);
      // Level-based upgrade (separate from wave upgrades)
      if(gameState === 'playing'){
        showUpgradeChoices('xp');
      }
    }
  }

  // Enemy factory
  function spawnEnemy(type){
    let x,y;
    const edge = Math.floor(Math.random()*4);
    const margin = 40;
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
    const e = {
      id: nextEnemyId++,
      type,
      x,y,
      vx:0,vy:0,
      radius: 14,
      speed: 60,
      hp: 1,
      maxHp: 1,
      disguised: false,
      stolenAbility: null,
      lastAttack: 0,
      slowUntil: 0,
      confusedUntil: 0,
      xpValue: 6
    };
    if(type==='adware'){
      e.speed = 75;
      e.hp = e.maxHp = 20 + currentWave*3;
      e.xpValue = 7;
    }else if(type==='spyware'){
      e.speed = 70;
      e.hp = e.maxHp = 25 + currentWave*4;
      e.xpValue = 8;
    }else if(type==='virus'){
      e.speed = 80;
      e.hp = e.maxHp = 35 + currentWave*5;
      e.disguised = true;
      e.xpValue = 10;
    }else if(type==='ransomware'){
      e.speed = 60;
      e.hp = e.maxHp = 80 + currentWave*10;
      e.xpValue = 18;
    }
    enemies.push(e);
  }

  function activateNortonShield(duration,stage){
    player.nortonShieldStage = stage;
    player.nortonShieldActiveUntil = gameTime + duration;
  }

  function damagePlayer(amount){
    if(player.hp<=0) return;

    // Norton shield prevention
    if(currentHeroId === 'norton' && gameTime < player.nortonShieldActiveUntil){
      return;
    }

    player.hp -= amount;
    if(player.hp<=0){
      player.hp = 0;
      updateTopUI();
      triggerGameOver();
    }else{
      updateTopUI();

      if(currentHeroId === 'norton'){
        const ratio = player.hp / player.maxHp;
        if(player.nortonShieldStage < 1 && ratio <= 0.45 && ratio > 0.25){
          activateNortonShield(10,1);
        }else if(player.nortonShieldStage < 2 && ratio <= 0.25 && ratio > 0.05){
          activateNortonShield(10,2);
        }else if(player.nortonShieldStage < 3 && ratio <= 0.05){
          activateNortonShield(30,3);
        }
      }
    }
  }

  function triggerGameOver(){
    gameState = 'gameover';
    gameOverText.textContent = `You survived to wave ${currentWave} on ${currentStageId}, reached level ${player.level}, and collected ${chips.amount} chips.`;
    gameOverOverlay.classList.add('visible');
  }

  function pauseGame(){
    if(gameState !== 'playing') return;
    gameState = 'paused';
    pauseOverlay.classList.add('visible');
  }

  function resumeGame(){
    if(gameState !== 'paused') return;
    pauseOverlay.classList.remove('visible');
    gameState = 'playing';
  }

  // Upgrades
  const BASE_UPGRADES = [
    {
      id:'fireRate',
      name:'Software Update',
      desc:'Increases attack speed by 15%.',
      apply(){
        player.fireDelayMult *= 0.85;
      }
    },
    {
      id:'damage',
      name:'Virus Definitions Update',
      desc:'Increases damage by 20%.',
      apply(){
        player.damageMult *= 1.20;
      }
    },
    {
      id:'defenderOrbit',
      name:'Defender Shield',
      desc:'Adds or strengthens orbiting Defender shields.',
      apply(){
        player.orbitLevel++;
        if(!player.abilities.includes('orbit')){
          player.abilities.push('orbit');
        }
      }
    }
  ];

  function heroSpecificUpgrades(){
    const list = [];
    if(currentHeroId === 'defender'){
      list.push({
        id:'wd_shield',
        name:'Shield Toss Upgrade',
        desc:'Your Defender shield toss hits harder and slightly faster.',
        apply(){
          player.shieldLevel++;
          player.damageMult *= 1.10;
          player.fireDelayMult *= 0.95;
        }
      });
    }else if(currentHeroId === 'avg'){
      list.push({
        id:'avg_slow',
        name:'Digital Antibodies',
        desc:'Antibody shots slow and confuse enemies for longer.',
        apply(){
          player.slowLevel++;
        }
      });
    }else if(currentHeroId === 'avast'){
      list.push({
        id:'avast_aoe',
        name: player.aoeModePaid ? 'Paid Subscription Boost' : 'Upgrade to Paid Version',
        desc: player.aoeModePaid
          ? 'Stronger knockback pulses and more chaos between enemies.'
          : 'Unlock the paid version: stronger pulses, faster speed, and chaos.',
        apply(){
          if(!player.aoeModePaid){
            player.aoeModePaid = true;
            player.aoeLevel++;
            player.speed += 25;
          }else{
            player.aoeLevel++;
          }
        }
      });
    }else if(currentHeroId === 'norton'){
      list.push({
        id:'norton_beam',
        name:'Beam Optimisation',
        desc:'Beam combos hit harder and ramp damage faster.',
        apply(){
          player.beamLevel++;
        }
      });
    }else if(currentHeroId === 'mcafee'){
      list.push({
        id:'mcafee_tag',
        name:'Tag Team Training',
        desc:'Defender ally lasts longer and hits harder.',
        apply(){
          player.tagLevel++;
        }
      });
    }
    return list;
  }

  function showUpgradeChoices(source){
    source = source || 'wave'; // 'wave' or 'xp'
    upgradeGrid.innerHTML = '';
    const pool = BASE_UPGRADES.concat(heroSpecificUpgrades());
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
        gameState = 'playing';
        upgradeOverlay.classList.remove('visible');
        if(source === 'wave'){
          planWave();
        }
      };
      upgradeGrid.appendChild(card);
    });
    upgradeOverlay.classList.add('visible');
    gameState = 'upgrade';
  }

  // Ransomware logic
  function stealAbility(enemy){
    const stealable = player.abilities.filter(a=>a!=='basicShot');
    if(stealable.length===0) return;
    const idx = Math.floor(Math.random()*stealable.length);
    const ability = stealable[idx];
    player.abilities = player.abilities.filter(a=>a!==ability);
    enemy.stolenAbility = ability;
    activeRansom = {
      enemyId: enemy.id,
      ability,
      cost: 50
    };
    ransomText.textContent = `Ransomware stole your ${ability === 'orbit' ? 'Defender orbit' : ability}! Pay 50 chips? (65% chance of return)`;
    ransomBar.style.display = 'flex';
  }

  btnPayRansom.addEventListener('click', ()=>{
    if(!activeRansom) return;
    if(chips.amount < activeRansom.cost) return;
    chips.amount -= activeRansom.cost;
    if(Math.random() < 0.65){
      if(!player.abilities.includes(activeRansom.ability)){
        player.abilities.push(activeRansom.ability);
      }
    }
    activeRansom = null;
    ransomBar.style.display = 'none';
    updateTopUI();
  });
  btnIgnoreRansom.addEventListener('click', ()=>{
    activeRansom = null;
    ransomBar.style.display = 'none';
  });

  // Projectiles
  function spawnProjectile(x,y,angle,speed,damage,fromEnemy=false,kind='bullet'){
    const r = (kind === 'defenderShield') ? 7 : 5;
    projectiles.push({
      x,y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      radius: r,
      damage,
      fromEnemy,
      kind,
      angle
    });
  }

  function vectorToNearestEnemy(px,py){
    let best = null;
    let bestDist = Infinity;
    for(const e of enemies){
      const dx = e.x-px;
      const dy = e.y-py;
      const d = Math.hypot(dx,dy);
      if(d<bestDist){
        bestDist = d;
        best = e;
      }
    }
    if(!best) return null;
    return {enemy:best, dist:bestDist, dx:best.x-px, dy:best.y-py};
  }

  function planWave(){
    currentWave++;
    waveInProgress = true;
    spawnQueue = [];
    const baseAdware = 6 + currentWave*2;
    const spywareCount = currentWave>=2 ? Math.floor(currentWave*0.8) : 0;
    const virusCount = currentWave>=3 ? Math.floor(currentWave*0.7) : 0;
    const ransomwareCount = currentWave>=4 ? (currentWave%3===1 ? 1 : 0) : 0;

    for(let i=0;i<baseAdware;i++) spawnQueue.push('adware');
    for(let i=0;i<spywareCount;i++) spawnQueue.push('spyware');
    for(let i=0;i<virusCount;i++) spawnQueue.push('virus');
    for(let i=0;i<ransomwareCount;i++) spawnQueue.push('ransomware');

    for(let i=spawnQueue.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [spawnQueue[i],spawnQueue[j]] = [spawnQueue[j],spawnQueue[i]];
    }
    spawnTimer = 0.5;
    updateTopUI();
  }

  function triggerAvastPulse(){
    const baseRadius = 110 + player.aoeLevel*12;
    const knock = 22 + player.aoeLevel*6;
    const dmg = 4 + player.aoeLevel*2;
    const confuseExtra = player.aoeModePaid ? (1.0 + 0.3*player.aoeLevel) : 0;

    for(const e of enemies){
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx,dy) || 1;
      if(dist <= baseRadius){
        const nx = dx / dist;
        const ny = dy / dist;
        e.x += nx * knock;
        e.y += ny * knock;
        e.hp -= dmg;

        if(confuseExtra > 0){
          e.confusedUntil = Math.max(e.confusedUntil, gameTime + confuseExtra);
        }
      }
    }
    aoePulses.push({
      x: player.x,
      y: player.y,
      radius: baseRadius,
      life: 0.35
    });
  }

  function maybeHandleMcAfeeTag(dt){
    if(currentHeroId !== 'mcafee') return;
    if(!ally && gameTime >= player.nextTagTime){
      const duration = 60 + player.tagLevel*10;
      summonAlly(duration);
      const baseCd = 120;
      player.nextTagTime = gameTime + (baseCd - player.tagLevel*10);
    }
    if(ally && gameTime >= ally.despawnAt){
      ally = null;
    }
  }

  function summonAlly(duration){
    ally = {
      x: player.x+40,
      y: player.y,
      angle: 0,
      fireCooldown: 0,
      despawnAt: gameTime + duration
    };
  }

  function update(dt){
    if(gameState !== 'playing'){
      return;
    }

    gameTime += dt;

    const stunned = gameTime < player.stunnedUntil;
    const inverted = gameTime < player.invertedUntil;

    let mx = 0, my = 0;
    if(!stunned){
      if(joyVector.x !== 0 || joyVector.y !== 0){
        mx = joyVector.x;
        my = joyVector.y;
      }else{
        if(keys['w'] || keys['arrowup']) my -= 1;
        if(keys['s'] || keys['arrowdown']) my += 1;
        if(keys['a'] || keys['arrowleft']) mx -= 1;
        if(keys['d'] || keys['arrowright']) mx += 1;
      }
      if(inverted){
        mx *= -1;
        my *= -1;
      }
    }
    const mlen = Math.hypot(mx,my);
    if(mlen>0){
      mx /= mlen;
      my /= mlen;
      player.x += mx * player.speed * dt;
      player.y += my * player.speed * dt;

      if(audioCtx){
        const now = audioCtx.currentTime;
        if(now - lastStepTime > 0.25){
          lastStepTime = now;
          playScanStep();
        }
      }
    }

    // Facing direction = movement or mouse
    if(mlen>0){
      player.facingAngle = Math.atan2(my,mx);
    }else if(hasMouse){
      const dxm = mouseWorld.x - player.x;
      const dym = mouseWorld.y - player.y;
      if(Math.hypot(dxm,dym)>1){
        player.facingAngle = Math.atan2(dym,dxm);
      }
    }

    // Clamp
    player.x = Math.max(player.radius, Math.min(world.width-player.radius, player.x));
    player.y = Math.max(player.radius + 30, Math.min(world.height-player.radius, player.y)); // keep off HUD

    // Shooting auto-lock w/ hero-specific spread
    const fireDelay = player.baseFireDelay * player.fireDelayMult;
    player.fireCooldown -= dt;
    if(player.fireCooldown <= 0){
      const targetInfo = vectorToNearestEnemy(player.x, player.y);
      if(targetInfo){
        let angle = Math.atan2(targetInfo.dy,targetInfo.dx);
        let spread = 0.20;
        if(currentHeroId === 'norton') spread = 0.0;
        if(currentHeroId === 'avg') spread = 0.15;
        if(currentHeroId === 'q360') spread = 0.18;
        if(currentHeroId === 'avast') spread = 0.22;
        if(currentHeroId === 'mcafee') spread = 0.12;
        angle += randRange(-spread,spread);

        const dmg = player.baseDamage*player.damageMult;
        const kind = (currentHeroId === 'defender') ? 'defenderShield' : 'bullet';
        spawnProjectile(player.x,player.y,angle,260,dmg,false,kind);

        // Norton beam visual + combo base hint (actual combo handled on hit)
        if(currentHeroId === 'norton' && targetInfo){
          beams.push({
            x1: player.x,
            y1: player.y,
            x2: targetInfo.enemy.x,
            y2: targetInfo.enemy.y,
            life: 0.12
          });
        }

        player.fireCooldown = fireDelay;
        playShoot();
      }
    }

    // Avast AOE pulses
    if(currentHeroId === 'avast'){
      if(!player._nextPulse){ player._nextPulse = gameTime + 6; }
      const baseInterval = player.aoeModePaid ? 4.5 : 6;
      const interval = Math.max(2.4, baseInterval - player.aoeLevel*0.4);
      if(gameTime >= player._nextPulse){
        triggerAvastPulse();
        player._nextPulse = gameTime + interval;
      }
    }

    if(player.abilities.includes('orbit') && player.orbitLevel>0){
      player.orbitCooldown += dt;
      if(player.orbitCooldown >= player.orbitPeriod){
        player.orbitCooldown = 0;
      }
    }

    // Spawn enemies
    if(waveInProgress && spawnQueue.length>0){
      spawnTimer -= dt;
      if(spawnTimer<=0){
        const type = spawnQueue.shift();
        spawnEnemy(type);
        spawnTimer = 0.5 + Math.max(0, 2 - currentWave*0.08);
      }
    }

    // Enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx,dy) || 1;
      let moveX = 0, moveY = 0;

      if(e.type === 'adware'){
        moveX = dx/dist;
        moveY = dy/dist;
      }else if(e.type === 'spyware'){
        let moveAllowed = true;
        if(hasMouse){
          const px = player.x;
          const py = player.y;
          const vdx = e.x - px;
          const vdy = e.y - py;
          const vdist = Math.hypot(vdx,vdy) || 1;

          const dirToEnemyX = vdx/vdist;
          const dirToEnemyY = vdy/vdist;
          const coneDirX = Math.cos(player.facingAngle);
          const coneDirY = Math.sin(player.facingAngle);
          const dot = dirToEnemyX*coneDirX + dirToEnemyY*coneDirY;
          const inCone = dot > Math.cos(Math.PI/6);

          if(inCone){
            moveAllowed = false;
          }
        }
        if(moveAllowed){
          moveX = dx/dist;
          moveY = dy/dist;
        }
      }else if(e.type === 'virus'){
        if(e.disguised && dist < 120){
          e.disguised = false;
        }
        moveX = dx/dist;
        moveY = dy/dist;
      }else if(e.type === 'ransomware'){
        moveX = dx/dist;
        moveY = dy/dist;
        if(e.stolenAbility){
          e.lastAttack += dt;
          if(e.lastAttack > 2.5){
            e.lastAttack = 0;
            const ang = Math.atan2(player.y - e.y, player.x - e.x);
            spawnProjectile(e.x,e.y,ang,220,player.baseDamage*0.8,true,'enemy');
          }
        }
      }

      // Confusion overrides movement
      const now = gameTime;
      let effectiveSpeed = e.speed;
      if(e.slowUntil > now){
        const slowFactor = 0.45 - 0.05*player.slowLevel;
        effectiveSpeed *= Math.max(0.2, slowFactor);
      }
      if(e.confusedUntil > now){
        const angRand = randRange(0,Math.PI*2);
        moveX = Math.cos(angRand);
        moveY = Math.sin(angRand);
      }

      e.x += moveX*effectiveSpeed*dt;
      e.y += moveY*effectiveSpeed*dt;

      // Collision with player
      if(dist < player.radius + e.radius){
        if(e.type === 'adware'){
          if(Math.random()<0.7){
            const stunDur = randRange(1,5);
            player.stunnedUntil = Math.max(player.stunnedUntil, gameTime + stunDur);
          }
          if(Math.random()<0.7){
            const invDur = randRange(2,6);
            player.invertedUntil = Math.max(player.invertedUntil, gameTime + invDur);
          }
          damagePlayer(1);
        }else if(e.type === 'spyware'){
          damagePlayer(1);
        }else if(e.type === 'virus'){
          damagePlayer(2);
        }else if(e.type === 'ransomware'){
          damagePlayer(1);
          if(!e.stolenAbility){
            stealAbility(e);
          }
        }
        e.x -= moveX*8;
        e.y -= moveY*8;
      }

      // Orbit damage
      if(player.abilities.includes('orbit') && player.orbitLevel>0){
        const orbits = Math.min(4, player.orbitLevel);
        const baseRadius = 45 + player.orbitLevel*4;
        for(let k=0;k<orbits;k++){
          const t = gameTime/player.orbitPeriod*2*Math.PI + (k/orbits)*2*Math.PI;
          const sx = player.x + Math.cos(t)*baseRadius;
          const sy = player.y + Math.sin(t)*baseRadius;
          const d2 = Math.hypot(e.x-sx,e.y-sy);
          if(d2 < e.radius + 10){
            const odmg = player.baseDamage*0.6*player.damageMult;
            e.hp -= odmg*dt*5;
          }
        }
      }

      if(e.hp <= 0){
        chips.amount += 3 + Math.floor(currentWave*0.4);
        gainXP(e.xpValue || 5);
        if(e.stolenAbility){
          if(!player.abilities.includes(e.stolenAbility)){
            player.abilities.push(e.stolenAbility);
          }
          if(activeRansom && activeRansom.enemyId === e.id){
            activeRansom = null;
            ransomBar.style.display = 'none';
          }
        }
        enemies.splice(i,1);
        updateTopUI();
      }
    }

    // Projectiles
    for(let i=projectiles.length-1;i>=0;i--){
      const p = projectiles[i];
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      if(p.x < -40 || p.x > world.width+40 || p.y < -40 || p.y > world.height+40){
        projectiles.splice(i,1);
        continue;
      }
      if(p.fromEnemy){
        const d = Math.hypot(p.x-player.x,p.y-player.y);
        if(d < player.radius + p.radius){
          damagePlayer(1);
          projectiles.splice(i,1);
          continue;
        }
      }else{
        let hit = false;
        for(let j=enemies.length-1;j>=0;j--){
          const e = enemies[j];
          const d = Math.hypot(p.x-e.x,p.y-e.y);
          if(d < e.radius + p.radius){
            // AVG slow/confuse on hit
            if(currentHeroId === 'avg'){
              const baseSlow = 1.6 + 0.4*player.slowLevel;
              const baseConfuse = 0.8 + 0.3*player.slowLevel;
              e.slowUntil = Math.max(e.slowUntil, gameTime + baseSlow);
              e.confusedUntil = Math.max(e.confusedUntil, gameTime + baseConfuse);
            }

            if(currentHeroId === 'norton'){
              // Norton beam combo logic overrides base projectile damage
              const nowT = gameTime;
              if(player.lastBeamEnemyId === e.id && nowT - player.lastBeamTime < 1.0){
                player.beamCombo = (player.beamCombo || 0) + 1;
              }else{
                player.beamCombo = 0;
              }
              player.lastBeamEnemyId = e.id;
              player.lastBeamTime = nowT;
              const comboMult = 1 + 0.25*(player.beamCombo||0) + 0.15*player.beamLevel;
              const base = player.baseDamage*player.damageMult;
              e.hp -= base * comboMult;
            }else{
              e.hp -= p.damage;
            }
            hit = true;
            break;
          }
        }
        if(hit){
          projectiles.splice(i,1);
        }
      }
    }

    // Ally (McAfee tag team)
    maybeHandleMcAfeeTag(dt);
    if(ally){
      ally.angle += dt*1.5;
      ally.x = player.x + Math.cos(ally.angle)*50;
      ally.y = player.y + Math.sin(ally.angle)*30;
      ally.fireCooldown -= dt;
      if(ally.fireCooldown <= 0){
        const targetInfo = vectorToNearestEnemy(ally.x, ally.y);
        if(targetInfo){
          const ang = Math.atan2(targetInfo.dy,targetInfo.dx);
          const spread = 0.15;
          const shotAng = ang + randRange(-spread,spread);
          const allyDmgMult = 1.1 + 0.2*player.tagLevel;
          const dmg = player.baseDamage*player.damageMult * allyDmgMult;
          spawnProjectile(ally.x,ally.y,shotAng,260,dmg,false,'defenderShield');
          ally.fireCooldown = player.baseFireDelay * 0.8;
        }
      }
    }

    // Avast pulse visuals
    for(let i=aoePulses.length-1;i>=0;i--){
      const pulse = aoePulses[i];
      pulse.life -= dt;
      if(pulse.life <= 0){
        aoePulses.splice(i,1);
      }
    }

    // Beam visuals
    for(let i=beams.length-1;i>=0;i--){
      const b = beams[i];
      b.life -= dt;
      if(b.life <= 0){
        beams.splice(i,1);
      }
    }

    if(waveInProgress && spawnQueue.length===0 && enemies.length===0){
      waveInProgress = false;
      showUpgradeChoices('wave');
    }
  }

  // New animated computer case background
  function drawFan(cx, cy, r, tOffset){
    const t = gameTime*2 + tOffset;
    ctx.save();
    ctx.translate(cx, cy);

    // Outer ring
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0,0,r+4,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(15,23,42,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.stroke();

    // Blades
    ctx.rotate(t);
    ctx.fillStyle = 'rgba(56,189,248,0.65)';
    for(let i=0;i<3;i++){
      ctx.rotate((Math.PI*2)/3);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.quadraticCurveTo(r*0.8,-r*0.15,0,-r);
      ctx.quadraticCurveTo(-r*0.4,-r*0.1,0,0);
      ctx.fill();
    }

    // Glow
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0,0,r+8,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBackgroundCase(){
    ctx.save();

    // Base dark
    ctx.fillStyle = '#020617';
    ctx.fillRect(0,0,world.width,world.height);

    const margin = 40;
    const caseX = margin;
    const caseY = margin;
    const caseW = world.width - margin*2;
    const caseH = world.height - margin*2;

    // Case body
    let g = ctx.createLinearGradient(caseX,caseY,caseX+caseW,caseY+caseH);
    g.addColorStop(0,'#020617');
    g.addColorStop(0.4,'#020617');
    g.addColorStop(1,'#030712');
    ctx.fillStyle = g;

    const radius = 20;
    ctx.beginPath();
    ctx.moveTo(caseX+radius, caseY);
    ctx.lineTo(caseX+caseW-radius, caseY);
    ctx.quadraticCurveTo(caseX+caseW, caseY, caseX+caseW, caseY+radius);
    ctx.lineTo(caseX+caseW, caseY+caseH-radius);
    ctx.quadraticCurveTo(caseX+caseW, caseY+caseH, caseX+caseW-radius, caseY+caseH);
    ctx.lineTo(caseX+radius, caseY+caseH);
    ctx.quadraticCurveTo(caseX, caseY+caseH, caseX, caseY+caseH-radius);
    ctx.lineTo(caseX, caseY+radius);
    ctx.quadraticCurveTo(caseX, caseY, caseX+radius, caseY);
    ctx.closePath();
    ctx.fill();

    // Inner glow edge
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // PCB glow stripes
    const stripeCount = 6;
    for(let i=0;i<stripeCount;i++){
      const y = caseY + 24 + i*(caseH-60)/(stripeCount-1);
      const animOffset = (gameTime*40 + i*80)%(caseW+120) - 60;
      const sx = animOffset + caseX;
      const ex = sx + 120;
      const grad = ctx.createLinearGradient(sx,y,ex,y);
      grad.addColorStop(0,'rgba(56,189,248,0)');
      grad.addColorStop(0.4,'rgba(56,189,248,0.35)');
      grad.addColorStop(1,'rgba(56,189,248,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(caseX+8,y);
      ctx.lineTo(caseX+caseW-8,y);
      ctx.stroke();
    }

    // Fans (top-left & bottom-right)
    const fanR = 42;
    drawFan(caseX+fanR+24, caseY+fanR+24, fanR, 0);
    drawFan(caseX+caseW-fanR-24, caseY+caseH-fanR-24, fanR, Math.PI);

    // Subtle grid overlay inside the case window
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(caseX+radius, caseY+8);
    ctx.lineTo(caseX+caseW-radius, caseY+8);
    ctx.quadraticCurveTo(caseX+caseW-8, caseY+8, caseX+caseW-8, caseY+radius);
    ctx.lineTo(caseX+caseW-8, caseY+caseH-radius);
    ctx.quadraticCurveTo(caseX+caseW-8, caseY+caseH-8, caseX+caseW-radius, caseY+caseH-8);
    ctx.lineTo(caseX+radius, caseY+caseH-8);
    ctx.quadraticCurveTo(caseX+8, caseY+caseH-8, caseX+8, caseY+caseH-radius);
    ctx.lineTo(caseX+8, caseY+radius);
    ctx.quadraticCurveTo(caseX+8, caseY+8, caseX+radius, caseY+8);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = 'rgba(30,64,175,0.15)';
    ctx.lineWidth = 1;
    for(let x=caseX+16;x<caseX+caseW;x+=40){
      ctx.beginPath();
      ctx.moveTo(x,caseY+16);
      ctx.lineTo(x,caseY+caseH-16);
      ctx.stroke();
    }
    for(let y=caseY+16;y<caseY+caseH;y+=40){
      ctx.beginPath();
      ctx.moveTo(caseX+16,y);
      ctx.lineTo(caseX+caseW-16,y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  function drawHUD(){
    const hudX = 40;
    const hudY = 10;
    const hudW = world.width - 80;

    // Health bar
    const hpRatio = player.hp / player.maxHp;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    ctx.roundRect(hudX,hudY,hudW,14,7);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(hudX+2,hudY+2,hudW-4,10,5);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(hudX+2,hudY+2,(hudW-4)*Math.max(0,Math.min(1,hpRatio)),10,5);
    ctx.fill();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, hudX+6, hudY+7);

    // XP bar just under HP
    const xpY = hudY + 18;
    const xpRatio = player.xp / player.xpToNext;
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath();
    ctx.roundRect(hudX,xpY,hudW,10,6);
    ctx.fill();

    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(hudX+2,xpY+2,(hudW-4)*Math.max(0,Math.min(1,xpRatio)),6,4);
    ctx.fill();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`XP ${Math.floor(player.xp)}/${player.xpToNext}`, hudX+6, xpY+5);
    ctx.textAlign = 'right';
    ctx.fillText(`Lv ${player.level}`, hudX+hudW-6, xpY+5);
    ctx.restore();
  }

  function drawScanCone(){
    if(!hasMouse) return;
    ctx.save();
    ctx.translate(player.x,player.y);
    const ang = player.facingAngle;
    const half = Math.PI/6;
    const radius = 220;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,radius,ang-half,ang+half);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56,189,248,0.08)';
    ctx.fill();
    ctx.restore();
  }

  function drawHeroBody(){
    const hero = HEROES[currentHeroId] || HEROES.defender;
    ctx.save();
    ctx.translate(player.x,player.y);
    const baseR = player.radius;

    const bob = Math.sin(gameTime*4)*1.5;

    // Aura / animation per hero
    if(hero.id === 'avast'){
      const pulse = 0.5 + 0.5*Math.sin(gameTime*4);
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.08*pulse;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0,0,baseR+10+4*pulse,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    if(hero.id === 'norton'){
      const sweep = gameTime*1.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(250,204,21,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0,0,baseR+8,sweep,sweep+Math.PI/3);
      ctx.stroke();
      ctx.restore();
    }
    if(hero.id === 'q360'){
      const breath = 2 + Math.sin(gameTime*3)*2;
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0,0,baseR+breath,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Norton emergency shield visual
    if(hero.id === 'norton' && gameTime < player.nortonShieldActiveUntil){
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,0,baseR+14,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Body (torso)
    ctx.save();
    ctx.translate(0,bob);

    if(hero.id === 'defender'){
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0,0,baseR,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0,-10);
      ctx.lineTo(10,-3);
      ctx.lineTo(6,10);
      ctx.lineTo(-6,10);
      ctx.lineTo(-10,-3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0,-6);
      ctx.lineTo(6,-1);
      ctx.lineTo(3,7);
      ctx.lineTo(-3,7);
      ctx.lineTo(-6,-1);
      ctx.closePath();
      ctx.fill();
    } else if(hero.id === 'avg'){
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0,0,baseR,0,Math.PI*2);
      ctx.fill();

      const colors = ['#f97316','#22c55e','#3b82f6','#ef4444'];
      for(let i=0;i<4;i++){
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(0,0);
        const a0 = i*Math.PI/2;
        const a1 = (i+1)*Math.PI/2;
        ctx.arc(0,0,baseR,a0,a1);
        ctx.closePath();
        ctx.fill();
      }
    } else if(hero.id === 'avast'){
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0,0,baseR,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      for(let i=0;i<4;i++){
        const ang = i*(Math.PI/2);
        const sx = Math.cos(ang)*(baseR+4);
        const sy = Math.sin(ang)*(baseR+4);
        ctx.beginPath();
        ctx.arc(sx,sy,6,0,Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0,0,baseR-4,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0,0,6,0,Math.PI*2);
      ctx.fill();
    } else if(hero.id === 'norton'){
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0,0,baseR,0,Math.PI*2);
      ctx.stroke();

      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-5,2);
      ctx.lineTo(-1,8);
      ctx.lineTo(8,-4);
      ctx.stroke();
    } else if(hero.id === 'mcafee'){
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0,-baseR);
      ctx.lineTo(baseR*0.9,-baseR*0.2);
      ctx.lineTo(baseR*0.6,baseR);
      ctx.lineTo(-baseR*0.6,baseR);
      ctx.lineTo(-baseR*0.9,-baseR*0.2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-baseR*0.5,0);
      ctx.lineTo(-baseR*0.25,-baseR*0.3);
      ctx.lineTo(0,0);
      ctx.lineTo(baseR*0.25,-baseR*0.3);
      ctx.lineTo(baseR*0.5,0);
      ctx.stroke();
    } else if(hero.id === 'q360'){
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0,0,baseR,0,Math.PI*2);
      ctx.fill();

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,0,baseR-4,Math.PI*0.15,Math.PI*1.85);
      ctx.stroke();

      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(0,0,5,0,Math.PI*2);
      ctx.fill();
    }

    ctx.restore();

    // Logo head
    const imgData = heroImages[hero.id];
    const headOffsetY = -baseR-6 + bob;
    if(imgData && imgData.ready){
      const size = baseR*1.6;
      ctx.save();
      ctx.translate(0,headOffsetY);
      ctx.beginPath();
      ctx.arc(0,0,size*0.52,0,Math.PI*2);
      ctx.clip();
      ctx.drawImage(imgData.img,-size/2,-size/2,size,size);
      ctx.restore();
    }else{
      // Simple fallback head
      ctx.save();
      ctx.translate(0,headOffsetY);
      ctx.fillStyle = hero.color || '#e5e7eb';
      ctx.beginPath();
      ctx.arc(0,0,baseR*0.8,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawDefenderShieldSprite(cx,cy,radius,angle){
    ctx.save();
    ctx.translate(cx,cy);
    if(typeof angle === 'number'){
      ctx.rotate(angle + Math.PI/2);
    }
    const base = radius;
    // Outer shield
    ctx.beginPath();
    ctx.moveTo(0,-base);
    ctx.lineTo(base*0.75,-base*0.2);
    ctx.lineTo(base*0.5,base*0.9);
    ctx.lineTo(-base*0.5,base*0.9);
    ctx.lineTo(-base*0.75,-base*0.2);
    ctx.closePath();
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();
    // Inner highlight
    ctx.beginPath();
    ctx.moveTo(0,-base*0.6);
    ctx.lineTo(base*0.45,-base*0.05);
    ctx.lineTo(base*0.25,base*0.6);
    ctx.lineTo(-base*0.25,base*0.6);
    ctx.lineTo(-base*0.45,-base*0.05);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.restore();
  }

  function drawOrbitShields(){
    if(!player.abilities.includes('orbit') || player.orbitLevel<=0) return;
    const orbits = Math.min(4, player.orbitLevel);
    const baseRadius = 45 + player.orbitLevel*4;
    for(let k=0;k<orbits;k++){
      const t = gameTime/player.orbitPeriod*2*Math.PI + (k/orbits)*2*Math.PI;
      const sx = player.x + Math.cos(t)*baseRadius;
      const sy = player.y + Math.sin(t)*baseRadius;
      const angle = t + gameTime*0.8;
      drawDefenderShieldSprite(sx,sy,10,angle);
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    const sx = canvas.width/window.devicePixelRatio/world.width;
    const sy = canvas.height/window.devicePixelRatio/world.height;
    const s = Math.min(sx,sy);
    ctx.translate((canvas.width/window.devicePixelRatio - world.width*s)/2,
                  (canvas.height/window.devicePixelRatio - world.height*s)/2);
    ctx.scale(s,s);

    // Animated computer case background
    drawBackgroundCase();

    // HUD (HP + XP bars at top)
    drawHUD();

    // Player aura
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(player.x,player.y,80,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Scan cone
    drawScanCone();

    // Avast scan glow around nearby enemies
    const avastScanRadius = 140;
    if(currentHeroId === 'avast'){
      ctx.save();
      ctx.strokeStyle = 'rgba(56,189,248,0.25)';
      ctx.lineWidth = 1.5;
      for(const e of enemies){
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx,dy);
        if(dist <= avastScanRadius){
          ctx.beginPath();
          ctx.arc(e.x,e.y,e.radius+4,0,Math.PI*2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // AOE pulses
    for(const pulse of aoePulses){
      ctx.save();
      const alpha = Math.max(0, pulse.life / 0.35);
      ctx.globalAlpha = 0.25*alpha;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pulse.x,pulse.y,pulse.radius*(1+(0.3*(1-alpha))),0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Enemies
    for(const e of enemies){
      ctx.save();
      ctx.translate(e.x,e.y);

      // Small per-enemy bob for life
      const bob = Math.sin(gameTime*4 + e.id)*1.5;
      ctx.translate(0,bob);

      if(e.type==='adware'){
        // Adware: pop-up window / webpage ad look
        const w = e.radius*2.6;
        const h = e.radius*1.8;
        const wiggle = Math.sin(gameTime*8 + e.id)*2;
        ctx.translate(wiggle,0);

        // Window background
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(-w/2,-h/2,w,h,4);
        ctx.fill();

        // Title bar
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(-w/2,-h/2,w,8,{tl:4,tr:4,br:0,bl:0});
        ctx.fill();

        // "Close" buttons
        ctx.fillStyle = '#f97373';
        ctx.beginPath();
        ctx.arc(-w/2+6,-h/2+4,2,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-w/2+12,-h/2+4,2,0,Math.PI*2);
        ctx.fill();

        // Flashing banner
        const pulse = 0.5 + 0.5*Math.sin(gameTime*10 + e.id);
        ctx.fillStyle = `rgba(250,204,21,${0.35+pulse*0.3})`;
        ctx.fillRect(-w/2+4,-h/2+10,w-8,6);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('AD',0,-h/2+16);

        // Text block lines
        ctx.strokeStyle = 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 1;
        for(let i=0;i<3;i++){
          const yy = -h/2+24+i*5;
          ctx.beginPath();
          ctx.moveTo(-w/2+6,yy);
          ctx.lineTo(w/2-6,yy);
          ctx.stroke();
        }
      }else if(e.type==='spyware'){
        // Spyware: eye that tracks the player
        const eyeW = e.radius*2.3;
        const eyeH = e.radius*1.4;

        // Eye white
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(0,0,eyeW/2,eyeH/2,0,0,Math.PI*2);
        ctx.fill();

        // Direction towards player
        const dxp = player.x - e.x;
        const dyp = player.y - e.y;
        const ang = Math.atan2(dyp,dxp);
        const pupilOffset = 4;
        const px = Math.cos(ang)*pupilOffset;
        const py = Math.sin(ang)*pupilOffset;

        // Pupil
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(px,py,7,0,Math.PI*2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.arc(px+3,py-3,3,0,Math.PI*2);
        ctx.fill();
      }else if(e.type==='virus'){
        const defImgData = heroImages['defender'];
        if(e.disguised && defImgData && defImgData.ready){
          const size = e.radius*2.4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(0,0,size*0.52,0,Math.PI*2);
          ctx.clip();
          ctx.drawImage(defImgData.img,-size/2,-size/2,size,size);
          ctx.restore();
        }else if(e.disguised){
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0,0,e.radius,0,Math.PI*2);
          ctx.fill();
        }else{
          // Animated purple spiky ball
          ctx.save();
          ctx.rotate(gameTime*1.8);
          ctx.strokeStyle = '#a855f7';
          ctx.beginPath();
          const spikes = 8;
          const outer = e.radius+4;
          for(let k=0;k<spikes;k++){
            const ang = k/spikes*Math.PI*2;
            const sx2 = Math.cos(ang)*outer;
            const sy2 = Math.sin(ang)*outer;
            ctx.moveTo(0,0);
            ctx.lineTo(sx2,sy2);
          }
          ctx.stroke();

          const pulse = 1 + 0.2*Math.sin(gameTime*6 + e.id);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0,0,(e.radius-3)*pulse,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
      }else if(e.type==='ransomware'){
        // Ransomware: bouncing lock
        const lockW = e.radius*2.2;
        const lockH = e.radius*2.0;
        const bounce = Math.sin(gameTime*3 + e.id)*2;
        ctx.translate(0,bounce);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(-lockW/2,-lockH/2,lockW,lockH,4);
        ctx.fill();

        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-lockW/2,-lockH/2,lockW,lockH);

        // Shackle
        ctx.beginPath();
        ctx.arc(0,-lockH/2,8,Math.PI*0.15,Math.PI*0.85);
        ctx.stroke();

        // Keyhole
        ctx.beginPath();
        ctx.arc(0,-2,3,0,Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0,1);
        ctx.lineTo(0,7);
        ctx.stroke();
      }
      ctx.restore();

      // Enemy HP bar
      ctx.save();
      ctx.translate(e.x,e.y-4);
      const ratio = e.hp/e.maxHp;
      ctx.fillStyle = '#111827';
      ctx.fillRect(-14,-20,28,4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-14,-20,28*ratio,4);
      ctx.restore();
    }

    // Projectiles
    for(const p of projectiles){
      if(p.kind === 'defenderShield'){
        // Windows Defender / Tag-Team shields
        drawDefenderShieldSprite(p.x,p.y,p.radius,p.angle);
      }else if(p.fromEnemy){
        // Enemy shots as small red diamonds
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.angle || 0);
        ctx.beginPath();
        ctx.moveTo(0,-p.radius);
        ctx.lineTo(p.radius,0);
        ctx.lineTo(0,p.radius);
        ctx.lineTo(-p.radius,0);
        ctx.closePath();
        ctx.fillStyle = '#f97373';
        ctx.fill();
        ctx.restore();
      }else{
        // Generic player bullets
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.beginPath();
        ctx.fillStyle = '#38bdf8';
        ctx.arc(0,0,p.radius,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Norton beams
    for(const b of beams){
      const alpha = Math.max(0,b.life/0.12);
      ctx.save();
      ctx.globalAlpha = 0.35*alpha;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x1,b.y1);
      ctx.lineTo(b.x2,b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Ally (McAfee Defender)
    if(ally){
      ctx.save();
      ctx.translate(ally.x,ally.y);
      const r = 12;
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0,0,r,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0,-r-4,6,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // Player
    drawHeroBody();

    // Orbit shields
    drawOrbitShields();

    ctx.restore();
  }

  // BUTTONS / UI
  btnFreeplay.addEventListener('click', ()=>{
    ensureAudio();
    titleOverlay.classList.remove('visible');
    heroSelectOverlay.classList.add('visible');
    gameState = 'menu';
  });

  btnOptions.addEventListener('click', ()=>{
    titleOverlay.classList.remove('visible');
    optionsOverlay.classList.add('visible');
  });

  btnOptionsBack.addEventListener('click', ()=>{
    optionsOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  btnHowTo.addEventListener('click', ()=>{
    titleOverlay.classList.remove('visible');
    infoOverlay.classList.add('visible');
  });

  btnInfoBack.addEventListener('click', ()=>{
    infoOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  btnExit.addEventListener('click', ()=>{
    window.close();
  });

  btnHeroBack.addEventListener('click', ()=>{
    heroSelectOverlay.classList.remove('visible');
    titleOverlay.classList.add('visible');
  });

  btnHeroStart.addEventListener('click', ()=>{
    ensureAudio();
    currentHeroId = selectedHeroId;
    heroSelectOverlay.classList.remove('visible');
    stageOverlay.classList.add('visible');
    buildStageGrid();
    gameState = 'menu';
  });


  btnStageBack.addEventListener('click', ()=>{
    stageOverlay.classList.remove('visible');
    heroSelectOverlay.classList.add('visible');
  });

  btnStageStart.addEventListener('click', ()=>{
    const stage = STAGES.find(s=>s.id === selectedStageId && s.unlocked);
    if(!stage) return;
    currentStageId = stage.id;
    stageOverlay.classList.remove('visible');
    gameOverOverlay.classList.remove('visible');
    upgradeOverlay.classList.remove('visible');
    pauseOverlay.classList.remove('visible');
    resetGame();
    gameState = 'playing';
    planWave();
  });

  btnPauseResume.addEventListener('click', ()=>{
    resumeGame();
  });

  btnPauseTitle.addEventListener('click', ()=>{
    pauseOverlay.classList.remove('visible');
    resetGame();
    gameState = 'menu';
    titleOverlay.classList.add('visible');
  });
  btnRestart.addEventListener('click', ()=>{
    ensureAudio();
    gameOverOverlay.classList.remove('visible');
    resetGame();
    gameState = 'playing';
    planWave();
  });

  btnQuit.addEventListener('click', ()=>{
    gameOverOverlay.classList.remove('visible');
    resetGame();
    gameState = 'menu';
    titleOverlay.classList.add('visible');
  });

  // Init
  resizeCanvas();
  updateTopUI();
  buildHeroGrid();
  requestAnimationFrame(function loop(now){
    const dt = Math.min(0.05, (now-lastTime)/1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  });
})();