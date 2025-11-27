// engine.js
(function(){
  // --- Canvas & UI elements ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const uiWave = document.getElementById('uiWave');
  const uiHP = document.getElementById('uiHP');
  const uiChips = document.getElementById('uiChips');
  const uiXP = document.getElementById('uiXP');
  const uiLevel = document.getElementById('uiLevel');

  const titleOverlay = document.getElementById('titleOverlay');
  const btnFreeplay = document.getElementById('btnFreeplay');
  const btnOptions = document.getElementById('btnOptions');
  const btnInfo = document.getElementById('btnInfo');
  const btnQuitTitle = document.getElementById('btnQuitTitle');

  const heroSelectOverlay = document.getElementById('heroSelectOverlay');
  const heroGrid = document.getElementById('heroGrid');
  const btnHeroBack = document.getElementById('btnHeroBack');
  const btnHeroStart = document.getElementById('btnHeroStart');

  const stageOverlay = document.getElementById('stageOverlay');
  const stageGrid = document.getElementById('stageGrid');
  const btnStageBack = document.getElementById('btnStageBack');
  const btnStageStart = document.getElementById('btnStageStart');

  const optionsOverlay = document.getElementById('optionsOverlay');
  const optVolume = document.getElementById('optVolume');
  const optParticles = document.getElementById('optParticles');
  const btnOptionsBack = document.getElementById('btnOptionsBack');

  const infoOverlay = document.getElementById('infoOverlay');
  const btnInfoBack = document.getElementById('btnInfoBack');

  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const upgradeGrid = document.getElementById('upgradeGrid');

  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverSummary = document.getElementById('gameOverSummary');
  const btnRestart = document.getElementById('btnRestart');
  const btnQuit = document.getElementById('btnQuit');

  const pauseOverlay = document.getElementById('pauseOverlay');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const btnPauseQuit = document.getElementById('btnPauseQuit');

  const ransomBar = document.getElementById('ransomBar');
  const ransomTimerBar = document.getElementById('ransomTimerBar');
  const ransomMessage = document.getElementById('ransomMessage');
  const btnPayRansom = document.getElementById('btnPayRansom');
  const btnIgnoreRansom = document.getElementById('btnIgnoreRansom');

  const touchJoystickBase = document.getElementById('touchJoystickBase');
  const touchJoystickStick = document.getElementById('touchJoystickStick');

  window.AVDEF = window.AVDEF || {};
  window.DEBUG = window.DEBUG || {};

  function dlog(msg, level, meta){
    if(window.DEBUG && DEBUG.log){
      DEBUG.log(msg, level || 'info', meta || { source:'engine.js' });
    }
  }

  if (!canvas || !ctx) {
    dlog('Canvas #gameCanvas is missing or has no context', 'error');
    return;
  }

  const world = {
    width: 960,
    height: 540
  };

  let gameState = 'title'; // 'title','heroSelect','stageSelect','playing','paused','upgrading','gameover'
  let currentMode = 'survivors';

  // --- Player + game state ---
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
  const chips = { count: 0 };
  const particles = [];
  const beams = [];
  const aoePulses = [];

  let gameTime = 0;
  let lastFrameTime = performance.now();

  let currentWave = 0;
  let waveInProgress = false;
  let spawnQueue = [];
  let spawnTimer = 0;
  let spawnInterval = 0.5;
  let enemiesRemainingThisWave = 0;
  let nextEnemyId = 1;

  let ransomActive = false;
  let ransomEndTime = 0;
  let ransomAmount = 0;
  let ransomPaid = false;

  let masterVolume = 0.5;
  let enableParticles = true;

  let audioCtx = null;
  let masterGain = null;
  let audioArmed = false;

  let scanConeAngle = 0;
  let scanConeSpeed = 1.4;
  let scanConeEnabled = true;

  let xpGainedThisRun = 0;
  let enemiesDefeatedThisRun = 0;
  let timeSurvivedThisRun = 0;
  let wavesCompletedThisRun = 0;
  let upgradesTakenThisRun = 0;

  let selectedHeroId = 'defender';

  // --- Hero logo preload ---
  const heroImages = {};
  function preloadHeroLogos(){
    if(!window.AVDEF || !AVDEF.Heroes || !AVDEF.Heroes.getAll){
      dlog('Heroes module missing at preloadHeroLogos', 'warn');
      return;
    }
    const heroes = AVDEF.Heroes.getAll();
    heroes.forEach(hero=>{
      if(!hero.logoUrl) return;
      const img = new Image();
      img.src = hero.logoUrl;
      heroImages[hero.id] = img;
    });
    dlog('preloadHeroLogos(): loaded ' + heroes.length + ' heroes', 'info');
  }
  preloadHeroLogos();

  let selectedStageId = 'computer';
  let currentStageId = 'computer';

  function buildStageGrid(){
    if(!stageGrid){
      dlog('stageGrid element missing', 'error');
      return;
    }
    stageGrid.innerHTML = '';
    if(!AVDEF.Stages || !AVDEF.Stages.list){
      dlog('AVDEF.Stages.list missing', 'error');
      return;
    }
    const stages = AVDEF.Stages.list();
    dlog('buildStageGrid(): stages length = ' + stages.length, 'info');

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

  function randRange(min,max){
    return Math.random()*(max-min)+min;
  }

  function applyHeroStats(id){
    const hero = AVDEF.Heroes.get(id);
    if (!hero) {
      dlog('applyHeroStats(): hero ' + id + ' not found', 'error');
      return;
    }

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
    lastFrameTime = performance.now();

    player.x = world.width/2;
    player.y = world.height/2;
    player.radius = 18;
    player.hp = player.maxHp;
    player.xp = 0;
    player.xpToNext = 50;
    player.level = 1;
    player.stunnedUntil = 0;
    player.chipMagnetRadius = 0;
    player.orbitProjectiles.length = 0;
    player.shieldCooldown = 10;
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
    if(ransomBar) ransomBar.classList.remove('visible');

    xpGainedThisRun = 0;
    enemiesDefeatedThisRun = 0;
    timeSurvivedThisRun = 0;
    wavesCompletedThisRun = 0;
    upgradesTakenThisRun = 0;

    updateHUD();
    dlog('resetGame(): game reset', 'info');
  }

  function ensureAudio(){
    if(audioCtx) return;
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(audioCtx.destination);
    }catch(e){
      console.warn('Audio init failed',e);
      dlog('Audio init failed: ' + e.message, 'warn');
    }
  }

  function playBeep(freq=440, duration=0.1, volume=0.2){
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
      vx: 0,
      vy: 0
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

  function spawnChip(x,y,amount){
    chips.count += amount;
    updateHUD();
  }

  function activateNortonShield(duration,stage){
    player.nortonShieldStage = stage;
    player.nortonShieldActiveUntil = gameTime + duration;
  }

  function dealDamage(amount){
    if(gameTime < player.phaseShiftingUntil) return;
    if(gameTime < player.nortonShieldActiveUntil){
      if(player.nortonShieldStage === 1){
        activateNortonShield(1.0,2);
        return;
      }else if(player.nortonShieldStage === 2){
        activateNortonShield(0,0);
        return;
      }
    }
    if(gameTime < player.stunnedUntil) return;

    player.hp -= amount;
    if(player.hp < 0) player.hp = 0;
    spawnParticles(player.x,player.y,'#f97373',10);
    playBeep(220,0.08,0.35);
    updateHUD();
    if(player.hp <= 0){
      endRun(false);
    }
  }

  function endRun(victory){
    if(gameState === 'gameover') return;
    gameState = 'gameover';
    wavesCompletedThisRun = currentWave-1;
    timeSurvivedThisRun = gameTime;
    if(gameOverTitle){
      gameOverTitle.textContent = victory ? 'System Secured!' : 'System Compromised!';
    }
    if(gameOverSummary){
      gameOverSummary.textContent =
        `Time: ${timeSurvivedThisRun.toFixed(1)}s | `+
        `Waves: ${wavesCompletedThisRun} | `+
        `XP: ${xpGainedThisRun} | `+
        `Enemies: ${enemiesDefeatedThisRun} | `+
        `Upgrades: ${upgradesTakenThisRun}`;
    }
    if(gameOverOverlay) gameOverOverlay.classList.add('visible');

    dlog('endRun(): victory=' + victory, 'info');
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

    dlog('planWave(): wave=' + currentWave + ', enemies=' + enemiesRemainingThisWave, 'info');
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
      radius: 14,
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

  function vectorToPlayer(ex,ey){
    const dx = player.x - ex;
    const dy = player.y - ey;
    const len = Math.hypot(dx,dy) || 1;
    return { dx:dx/len, dy:dy/len, dist:len };
  }

  function vectorToNearestEnemy(x,y){
    let nearest = null;
    let bestDist = Infinity;
    for(const e of enemies){
      const d = Math.hypot(e.x-x,e.y-y);
      if(d < bestDist){
        bestDist = d;
        nearest = e;
      }
    }
    if(!nearest) return null;
    const dx = nearest.x - x;
    const dy = nearest.y - y;
    const len = bestDist || 1;
    return { dx:dx/len, dy:dy/len, dist:bestDist, enemy:nearest };
  }

  function tryRansomTrigger(e){
    if(e.type !== 'ransomware') return;
    if(ransomActive) return;
    ransomActive = true;
    ransomEndTime = gameTime + 15;
    ransomAmount = 10 + Math.floor(currentWave*1.5);
    ransomPaid = false;
    if(ransomMessage){
      ransomMessage.textContent = `Ransomware detected! Pay ${ransomAmount} chips to unlock files?`;
    }
    if(ransomBar) ransomBar.classList.add('visible');
    dlog('Ransom triggered: ' + ransomAmount + ' chips', 'warn');
  }

  function applyRansomOutcome(){
    if(ransomBar) ransomBar.classList.remove('visible');
    if(ransomPaid){
      ransomActive = false;
      return;
    }
    player.speed *= 0.8;
    player.baseFireDelay *= 1.15;
  }

  function gainXP(amount){
    xpGainedThisRun += amount;
    player.xp += amount;
    if(player.xp >= player.xpToNext){
      player.xp -= player.xpToNext;
      player.level++;
      upgradesTakenThisRun++;
      player.xpToNext = Math.floor(player.xpToNext*1.35);
      updateHUD();
      gameState = 'upgrading';
      showUpgradeChoices('xp');
      return;
    }
    updateHUD();
  }

  function showUpgradeChoices(source){
    source = source || 'wave'; // 'wave' or 'xp'
    if(!upgradeGrid || !upgradeOverlay){
      dlog('Upgrade UI elements missing', 'error');
      return;
    }

    upgradeGrid.innerHTML = '';

    if(!AVDEF.Upgrades || !AVDEF.Upgrades.getPool){
      dlog('AVDEF.Upgrades.getPool missing', 'error');
      return;
    }

    const pool = AVDEF.Upgrades.getPool(currentHeroId, player);
    const picks = [];
    const poolCopy = pool.slice();
    const count = Math.min(3, poolCopy.length);

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
  }

  // --- Input bridge to input.js ---

  function getInputState(){
    if(window.AVDEF && AVDEF.Input && typeof AVDEF.Input.getState === 'function'){
      try{
        return AVDEF.Input.getState();
      }catch(e){
        dlog('AVDEF.Input.getState threw: ' + e.message, 'warn');
      }
    }
    // Fallback: no input module yet
    return {
      moveX: 0,
      moveY: 0,
      pointerX: null,
      pointerY: null,
      firing: false,
      pausePressed: false,
      abilityPressed: false,
      aimStickX: 0,
      aimStickY: 0
    };
  }

  let lastPausePressed = false;
  let lastAbilityPressed = false;

  // --- Input handling & update loop ---

  function handleInput(dt){
    const input = getInputState();

    // Movement (keyboard / touch joystick / gamepad left stick)
    let mx = input.moveX || 0;
    let my = input.moveY || 0;

    const len = Math.hypot(mx,my);
    if(len > 1){
      mx /= len;
      my /= len;
    }

    if(len > 0){
      const effSpeed = player.speed * (gameTime < player.stunnedUntil ? 0.4 : 1);
      player.x += mx*effSpeed*dt;
      player.y += my*effSpeed*dt;
      if(player.x < player.radius) player.x = player.radius;
      if(player.x > world.width-player.radius) player.x = world.width-player.radius;
      if(player.y < player.radius) player.y = player.radius;
      if(player.y > world.height-player.radius) player.y = world.height-player.radius;
    }

    // Aiming (mouse / touch pointer / gamepad right stick)
    let tx = player.x + Math.cos(player.facingAngle)*10;
    let ty = player.y + Math.sin(player.facingAngle)*10;

    if(typeof input.pointerX === 'number' && typeof input.pointerY === 'number'){
      tx = input.pointerX;
      ty = input.pointerY;
    }

    if(typeof input.aimStickX === 'number' && typeof input.aimStickY === 'number'){
      const ax2 = input.aimStickX;
      const ay2 = input.aimStickY;
      const dead2 = 0.25;
      if(Math.abs(ax2) > dead2 || Math.abs(ay2) > dead2){
        tx = player.x + ax2*200;
        ty = player.y + ay2*200;
      }
    }

    const mdx = tx - player.x;
    const mdy = ty - player.y;
    if(Math.hypot(mdx,mdy) > 4){
      player.facingAngle = Math.atan2(mdy,mdx);
    }

    const now = gameTime;
    const baseDelay = player.baseFireDelay*player.fireDelayMult;
    const canShoot = (now - player.lastShot) >= baseDelay;
    const firing = !!input.firing;

    if(canShoot && firing){
      if(!audioArmed){
        ensureAudio();
        audioArmed = true;
      }
      const baseDamage = player.baseDamage*player.damageMult;
      const stunMult = gameTime < player.stunnedUntil ? 0.6 : 1;
      const dmg = baseDamage*stunMult;
      const kind = (currentHeroId === 'defender' && player.shieldLevel>0) ? 'shield' : 'bullet';
      spawnProjectile(player.x,player.y,player.facingAngle, 420, dmg, kind);
      player.lastShot = now;
      playBeep(620,0.05,0.12);
    }

    // Ability button (space / gamepad A etc)
    if(input.abilityPressed && !lastAbilityPressed){
      if(!audioArmed){
        ensureAudio();
        audioArmed = true;
      }
      tryUseHeroAbility();
    }
    lastAbilityPressed = !!input.abilityPressed;

    // Pause button (P / Esc / gamepad Start)
    if(input.pausePressed && !lastPausePressed){
      if(gameState === 'playing' || gameState === 'paused'){
        togglePause();
      }
    }
    lastPausePressed = !!input.pausePressed;
  }

  function tryUseHeroAbility(){
    const now = gameTime;
    if(currentHeroId === 'avast'){
      const cd = player.aoeCooldown;
      if(now - player.aoeLast >= cd){
        player.aoeLast = now;
        aoePulses.push({
          x:player.x,
          y:player.y,
          radius: 20,
          maxRadius: player.aoeRadius + player.aoeLevel*20,
          life: 0.4,
          maxLife: 0.4
        });
        spawnParticles(player.x,player.y,'#f97316',20);
        playBeep(480,0.12,0.3);
      }
    }else if(currentHeroId === 'norton'){
      const cd = player.beamCooldown;
      if(now - player.beamLast >= cd){
        player.beamLast = now;
        const dir = { x:Math.cos(player.facingAngle), y:Math.sin(player.facingAngle) };
        const len = 520;
        beams.push({
          x1: player.x,
          y1: player.y,
          x2: player.x + dir.x*len,
          y2: player.y + dir.y*len,
          life: 0.18,
          maxLife: 0.18
        });
        spawnParticles(player.x,player.y,'#fde047',18);
        playBeep(900,0.09,0.25);
      }
    }else if(currentHeroId === 'defender'){
      const cd = player.shieldCooldown;
      if(player.shieldLevel>0 && now - player.shieldLast >= cd){
        player.shieldLast = now;
        spawnProjectile(
          player.x,player.y,player.facingAngle,
          320,
          player.baseDamage*player.damageMult*1.4,
          'shield-toss'
        );
        playBeep(360,0.08,0.25);
      }
    }else if(currentHeroId === 'total'){
      const cd = player.phaseShiftCooldown;
      if(player.phaseShiftLevel>0 && now - player.phaseShiftLast >= cd){
        player.phaseShiftLast = now;
        player.phaseShiftingUntil = now + player.phaseShiftDuration;
        spawnParticles(player.x,player.y,'#22c55e',22);
        playBeep(700,0.1,0.3);
      }
    }
  }

  function update(dt){
    if(gameState !== 'playing') return;

    gameTime += dt;
    timeSurvivedThisRun = gameTime;

    if(ransomActive){
      const remaining = Math.max(0, ransomEndTime - gameTime);
      const frac = remaining / 15;
      if(ransomTimerBar){
        ransomTimerBar.style.width = `${Math.max(0,Math.min(1,frac))*100}%`;
      }
      if(remaining <= 0){
        ransomActive = false;
        applyRansomOutcome();
      }
    }

    handleInput(dt);

    if(!waveInProgress){
      currentWave++;
      if(currentWave === 1){
        uiWave && (uiWave.textContent = `Wave ${currentWave}`);
      }
      planWave();
      gameState = 'upgrading';
      showUpgradeChoices('wave');
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

    // Enemy movement & collisions
    for(const e of enemies){
      const stunned = gameTime < player.stunnedUntil;
      const slowActive = gameTime < e.slowUntil;
      const confusedActive = gameTime < e.confusedUntil;
      const v = vectorToPlayer(e.x,e.y);
      let dx = v.dx;
      let dy = v.dy;
      if(confusedActive){
        const angleOffset = Math.sin(gameTime*4 + e.id)*0.9;
        const ca = Math.cos(angleOffset);
        const sa = Math.sin(angleOffset);
        const rdx = dx*ca - dy*sa;
        const rdy = dx*sa + dy*ca;
        dx = rdx;
        dy = rdy;
      }
      let speed = e.speed;
      if(stunned) speed *= 0.4;
      if(slowActive) speed *= (player.slowFactor || 0.6);
      e.x += dx*speed*dt;
      e.y += dy*speed*dt;
      if(e.x < e.radius) e.x = e.radius;
      if(e.x > world.width-e.radius) e.x = world.width-e.radius;
      if(e.y < e.radius) e.y = e.radius;
      if(e.y > world.height-e.radius) e.y = world.height-e.radius;

      const distToPlayer = Math.hypot(e.x-player.x,e.y-player.y);
      if(distToPlayer < e.radius+player.radius){
        dealDamage(8);
        spawnParticles(e.x,e.y,'#f472b6',10);
        enemiesDefeatedThisRun++;
        e.hp = 0;
      }
    }

    // Orbiting projectiles
    if(player.orbitLevel>0){
      const orbitCount = 2 + player.orbitLevel;
      if(player.orbitProjectiles.length !== orbitCount){
        player.orbitProjectiles.length = 0;
        for(let i=0;i<orbitCount;i++){
          player.orbitProjectiles.push({
            angle: (i/orbitCount)*Math.PI*2,
            radius: 40 + player.orbitLevel*4,
            damage: player.baseDamage*player.damageMult*0.7
          });
        }
      }
      for(let i=0;i<player.orbitProjectiles.length;i++){
        const orb = player.orbitProjectiles[i];
        orb.angle += dt*1.6;
      }
    }

    // Remove dead enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      if(e.hp <= 0){
        spawnParticles(e.x,e.y,'#f97373',8);
        spawnXP(e.x,e.y, 5+Math.floor(currentWave/2));
        enemies.splice(i,1);
        enemiesRemainingThisWave--;
        if(e.type === 'ransomware'){
          tryRansomTrigger(e);
        }
      }
    }

    // Projectiles
    for(let i=projectiles.length-1;i>=0;i--){
      const p = projectiles[i];
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.life -= dt;
      if(p.life <= 0){
        projectiles.splice(i,1);
        continue;
      }
      if(p.x< -40 || p.x>world.width+40 || p.y<-40 || p.y>world.height+40){
        projectiles.splice(i,1);
        continue;
      }
      for(let j=enemies.length-1;j>=0;j--){
        const e = enemies[j];
        const dist = Math.hypot(e.x-p.x,e.y-p.y);
        if(dist < e.radius + p.radius){
          e.hp -= p.damage;
          spawnParticles(e.x,e.y,'#f97373',4);
          if(currentHeroId === 'avg'){
            e.slowUntil = gameTime + (1.0 + player.slowLevel*0.35);
            if(player.confuseLevel>0){
              e.confusedUntil = gameTime + (0.4 + player.confuseLevel*0.35);
            }
          }else if(currentHeroId === 'avast' && player.aoeLevel>0){
            aoePulses.push({
              x:e.x,
              y:e.y,
              radius: 10,
              maxRadius: 70 + player.aoeLevel*15,
              life: 0.25,
              maxLife: 0.25
            });
          }else if(currentHeroId === 'norton' && player.antivirusTag === 'mcafee'){
            e.hp -= p.damage*0.25;
          }
          projectiles.splice(i,1);
          break;
        }
      }
    }

    // XP orbs
    for(const orb of xpOrbs){
      const dx = player.x - orb.x;
      const dy = player.y - orb.y;
      const dist = Math.hypot(dx,dy);
      const magnetRadius = 80 + player.chipMagnetRadius;
      if(dist < magnetRadius){
        const k = 240;
        const nx = dx/(dist||1);
        const ny = dy/(dist||1);
        orb.vx += nx*k*dt;
        orb.vy += ny*k*dt;
      }
      orb.x += orb.vx*dt;
      orb.y += orb.vy*dt;
      if(dist < player.radius + orb.radius){
        gainXP(orb.amount);
        orb.collected = true;
      }
    }
    for(let i=xpOrbs.length-1;i>=0;i--){
      if(xpOrbs[i].collected){
        xpOrbs.splice(i,1);
      }
    }

    // Particles
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.life -= dt;
      if(p.life <= 0){
        particles.splice(i,1);
      }
    }

    // Beams
    for(let i=beams.length-1;i>=0;i--){
      const b = beams[i];
      b.life -= dt;
      if(b.life <= 0){
        beams.splice(i,1);
        continue;
      }
      const dx = b.x2-b.x1;
      const dy = b.y2-b.y1;
      const length = Math.hypot(dx,dy) || 1;
      const nx = dx/length;
      const ny = dy/length;
      const radius = 22 + player.beamLevel*2;
      for(const e of enemies){
        const vx = e.x-b.x1;
        const vy = e.y-b.y1;
        const t = (vx*nx + vy*ny);
        if(t < 0 || t > length) continue;
        const px = b.x1 + nx*t;
        const py = b.y1 + ny*t;
        const dist = Math.hypot(e.x-px,e.y-py);
        if(dist < radius){
          e.hp -= player.baseDamage*player.damageMult*1.6;
        }
      }
    }

    // AOE pulses
    for(let i=aoePulses.length-1;i>=0;i--){
      const a = aoePulses[i];
      a.life -= dt;
      const t = 1 - (a.life/a.maxLife);
      a.radius = a.maxRadius * t;
      for(const e of enemies){
        const dist = Math.hypot(e.x-a.x,e.y-a.y);
        if(dist < a.radius+e.radius){
          const dx = e.x-a.x;
          const dy = e.y-a.y;
          const len = Math.hypot(dx,dy) || 1;
          e.x += (dx/len)*60*dt;
          e.y += (dy/len)*60*dt;
        }
      }
      if(a.life <= 0){
        aoePulses.splice(i,1);
      }
    }

    if(gameTime < player.phaseShiftingUntil){
      scanConeEnabled = false;
    }else{
      scanConeEnabled = true;
    }

    updateHUD();
  }

  function updateHUD(){
    if(uiWave) uiWave.textContent = `Wave ${currentWave}`;
    if(uiHP) uiHP.textContent = `HP ${player.hp}/${player.maxHp}`;
    if(uiXP) uiXP.textContent = `XP ${player.xp}/${player.xpToNext}`;
    if(uiLevel) uiLevel.textContent = `LVL ${player.level}`;
    if(uiChips) uiChips.textContent = `Chips ${chips.count}`;
  }

  // --- Drawing ---
  function drawBackgroundCase(){
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'#020617');
    grad.addColorStop(1,'#0b1120');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 2;
    const pad = 40;
    ctx.beginPath();
    ctx.moveTo(pad,pad);
    ctx.lineTo(canvas.width-pad,pad);
    ctx.lineTo(canvas.width-pad,canvas.height-pad);
    ctx.lineTo(pad,canvas.height-pad);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(56,189,248,0.18)';
    ctx.lineWidth = 1;
    const cols = 6;
    const rows = 3;
    const pad2 = 40;
    for(let i=1;i<cols;i++){
      const x = pad2 + (canvas.width-2*pad2)*(i/cols);
      ctx.beginPath();
      ctx.moveTo(x,pad2);
      ctx.lineTo(x,canvas.height-pad2);
      ctx.stroke();
    }
    for(let j=1;j<rows;j++){
      const y = pad2 + (canvas.height-2*pad2)*(j/rows);
      ctx.beginPath();
      ctx.moveTo(pad2,y);
      ctx.lineTo(canvas.width-pad2,y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(0,canvas.height-60,canvas.width,60);
    ctx.restore();
  }

  function drawXPOrbs(){
    ctx.save();
    ctx.fillStyle = '#22c55e';
    for(const orb of xpOrbs){
      ctx.beginPath();
      ctx.arc(orb.x,orb.y,orb.radius,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles(){
    ctx.save();
    for(const p of particles){
      const t = p.life/p.maxLife;
      if(t<=0) continue;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemies(){
    ctx.save();
    for(const e of enemies){
      ctx.save();
      ctx.translate(e.x,e.y);
      const slowActive = gameTime < e.slowUntil;
      const confusedActive = gameTime < e.confusedUntil;
      const radius = e.radius;

      ctx.beginPath();
      ctx.fillStyle = '#0f172a';
      ctx.arc(0,0,radius+6,0,Math.PI*2);
      ctx.fill();

      const hpFrac = e.hp/e.maxHp;
      ctx.beginPath();
      ctx.strokeStyle = '#f97373';
      ctx.lineWidth = 3;
      ctx.arc(0,0,radius+4, -Math.PI/2, -Math.PI/2 + hpFrac*Math.PI*2);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = slowActive ? '#22c55e' : (confusedActive ? '#fbbf24' : '#e5e7eb');
      ctx.arc(0,0,radius,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(-radius/3,-radius/3,3,0,Math.PI*2);
      ctx.arc(radius/3,-radius/3,3,0,Math.PI*2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = e.disguised ? '#fb7185' : '#22d3ee';
      ctx.arc(0,radius/3,4,0,Math.PI*2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  function drawHeroBody(){
    const hero = AVDEF.Heroes.get(currentHeroId) || {};
    ctx.save();
    ctx.translate(player.x,player.y);
    ctx.rotate(player.facingAngle);

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#0f172a';
    ctx.arc(0,0,player.radius+6,0,Math.PI*2);
    ctx.fill();

    const hpFrac = player.hp/player.maxHp;
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.arc(0,0,player.radius+4,-Math.PI/2,-Math.PI/2+hpFrac*Math.PI*2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const grad = ctx.createLinearGradient(-player.radius,0,player.radius,0);
    grad.addColorStop(0,'#38bdf8');
    grad.addColorStop(1,'#22c55e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0,0,player.radius*1.2,player.radius,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    if(heroImages[currentHeroId]){
      ctx.save();
      ctx.rotate(-player.facingAngle);
      const img = heroImages[currentHeroId];
      const size = player.radius*1.2;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(img,-size*0.7,-size*0.7,size*1.4,size*1.4);
      ctx.restore();
    }else{
      ctx.save();
      ctx.rotate(-player.facingAngle);
      ctx.fillStyle = '#0b1120';
      ctx.beginPath();
      ctx.arc(0,0,player.radius*0.65,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#e5e7eb';
      ctx.font = `bold ${player.radius*0.9}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hero.initial || '?',0,1);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(56,189,248,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.radius*0.7,0);
    ctx.lineTo(player.radius*1.8,0);
    ctx.stroke();
    ctx.restore();

    if(gameTime < player.nortonShieldActiveUntil){
      const t = (player.nortonShieldActiveUntil - gameTime)/3;
      const blink = 0.6 + 0.4*Math.sin(gameTime*10);
      ctx.save();
      ctx.globalAlpha = Math.max(0,Math.min(1,t))*blink;
      const grad2 = ctx.createRadialGradient(0,0,player.radius*0.6,0,0,player.radius*1.7);
      grad2.addColorStop(0,'rgba(251,191,36,0.1)');
      grad2.addColorStop(1,'rgba(251,191,36,0.5)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(0,0,player.radius*1.7,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    if(scanConeEnabled){
      ctx.save();
      ctx.globalAlpha = 0.18;
      const width = Math.PI/6;
      const start = -width/2;
      const end = width/2;
      const r = player.radius*5;
      const grad = ctx.createRadialGradient(0,0,player.radius*0.4,0,0,r);
      grad.addColorStop(0,'rgba(56,189,248,0.0)');
      grad.addColorStop(0.5,'rgba(56,189,248,0.37)');
      grad.addColorStop(1,'rgba(56,189,248,0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,r,start,end);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if(player.orbitLevel>0 && player.orbitProjectiles.length>0){
      ctx.save();
      ctx.rotate(-player.facingAngle);
      for(const orb of player.orbitProjectiles){
        const ox = Math.cos(orb.angle)*orb.radius;
        const oy = Math.sin(orb.angle)*orb.radius;
        ctx.beginPath();
        ctx.fillStyle = '#38bdf8';
        ctx.arc(ox,oy,6,0,Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56,189,248,0.45)';
        ctx.lineWidth = 1.5;
        ctx.arc(ox,oy,10,0,Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if(gameTime < player.phaseShiftingUntil){
      const t = (player.phaseShiftingUntil - gameTime)/player.phaseShiftDuration;
      ctx.save();
      ctx.globalAlpha = 0.3+0.4*t;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.arc(0,0,player.radius*1.5,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawHero(){
    drawHeroBody();
  }

  function drawProjectiles(){
    ctx.save();
    for(const p of projectiles){
      ctx.beginPath();
      if(p.kind === 'shield' || p.kind === 'shield-toss'){
        const grad = ctx.createLinearGradient(p.x-10,p.y-10,p.x+10,p.y+10);
        grad.addColorStop(0,'#60a5fa');
        grad.addColorStop(1,'#22d3ee');
        ctx.fillStyle = grad;
        ctx.arc(p.x,p.y,p.radius+2,0,Math.PI*2);
      }else{
        ctx.fillStyle = '#38bdf8';
        ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
      }
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBeams(){
    ctx.save();
    for(const b of beams){
      const t = b.life/b.maxLife;
      ctx.globalAlpha = t;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(b.x1,b.y1);
      ctx.lineTo(b.x2,b.y2);
      ctx.stroke();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x1,b.y1);
      ctx.lineTo(b.x2,b.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAOEPulses(){
    ctx.save();
    for(const a of aoePulses){
      const t = a.life/a.maxLife;
      ctx.globalAlpha = t*0.7;
      const grad = ctx.createRadialGradient(a.x,a.y,a.radius*0.2,a.x,a.y,a.radius);
      grad.addColorStop(0,'rgba(249,115,22,0.0)');
      grad.addColorStop(0.4,'rgba(249,115,22,0.5)');
      grad.addColorStop(1,'rgba(248,250,252,0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHUD(){
    const barWidth = 220;
    const barHeight = 12;
    const margin = 16;
    const startX = margin;
    const startY = canvas.height-50;

    ctx.save();
    ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.textBaseline = 'top';

    ctx.fillText(`Wave ${currentWave}`, startX, startY-18);
    ctx.fillText(`LVL ${player.level}`, startX+barWidth+40, startY-18);
    ctx.fillText(`Chips ${chips.count}`, startX+barWidth+40, startY+barHeight+4);

    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.fillRect(startX-6,startY-6,barWidth+12,barHeight+12);
    ctx.fillRect(startX-6,startY+barHeight+8,barWidth+12,barHeight+12);

    ctx.fillStyle = '#020617';
    ctx.fillRect(startX-4,startY-4,barWidth+8,barHeight+8);
    ctx.fillRect(startX-4,startY+barHeight+10,barWidth+8,barHeight+8);

    const hpFrac = player.hp/player.maxHp;
    ctx.fillStyle = '#f97373';
    ctx.fillRect(startX-2,startY-2,(barWidth+4)*hpFrac,barHeight+4);
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(startX-2,startY-2,barWidth+4,barHeight+4);

    const xpFrac = player.xp/player.xpToNext;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(startX-2,startY+barHeight+12,(barWidth+4)*xpFrac,barHeight+4);
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(startX-2,startY+barHeight+12,barWidth+4,barHeight+4);

    ctx.fillStyle = '#f97373';
    ctx.fillText(`${player.hp}/${player.maxHp}`, startX+6, startY-2);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${player.xp}/${player.xpToNext}`, startX+6, startY+barHeight+10);

    ctx.restore();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawBackgroundCase();
    drawXPOrbs();
    drawParticles();
    drawEnemies();
    drawHero();
    drawProjectiles();
    drawBeams();
    drawAOEPulses();
    drawHUD();
  }

  // --- Pause & menu wiring ---

  function togglePause(){
    if(gameState === 'playing'){
      gameState = 'paused';
      if(pauseOverlay) pauseOverlay.classList.add('visible');
    }else if(gameState === 'paused'){
      gameState = 'playing';
      if(pauseOverlay) pauseOverlay.classList.remove('visible');
    }
  }

  function showTitle(){
    if(titleOverlay) titleOverlay.classList.add('visible');
    if(heroSelectOverlay) heroSelectOverlay.classList.remove('visible');
    if(stageOverlay) stageOverlay.classList.remove('visible');
    if(optionsOverlay) optionsOverlay.classList.remove('visible');
    if(infoOverlay) infoOverlay.classList.remove('visible');
    if(gameOverOverlay) gameOverOverlay.classList.remove('visible');
    if(pauseOverlay) pauseOverlay.classList.remove('visible');
    if(upgradeOverlay) upgradeOverlay.classList.remove('visible');
    if(ransomBar) ransomBar.classList.remove('visible');
  }

  function buildHeroGrid(){
    if(!heroGrid){
      dlog('heroGrid element missing', 'error');
      return;
    }
    heroGrid.innerHTML = '';
    if(!AVDEF.Heroes || !AVDEF.Heroes.getAll){
      dlog('AVDEF.Heroes.getAll missing', 'error');
      return;
    }
    const heroes = AVDEF.Heroes.getAll();
    dlog('buildHeroGrid(): heroes length = ' + heroes.length, 'info');

    heroes.forEach(hero=>{
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

  // --- Button wiring with null checks ---

  if(btnFreeplay){
    btnFreeplay.addEventListener('click', ()=>{
      gameState = 'heroSelect';
      if(titleOverlay) titleOverlay.classList.remove('visible');
      if(heroSelectOverlay) heroSelectOverlay.classList.add('visible');
      dlog('btnFreeplay clicked → heroSelect', 'info');
    });
  } else dlog('btnFreeplay not found', 'error');

  if(btnOptions && optionsOverlay){
    btnOptions.addEventListener('click', ()=>{
      optionsOverlay.classList.add('visible');
      if(titleOverlay) titleOverlay.classList.remove('visible');
    });
  } else if(!btnOptions) dlog('btnOptions not found', 'warn');

  if(btnInfo && infoOverlay){
    btnInfo.addEventListener('click', ()=>{
      infoOverlay.classList.add('visible');
      if(titleOverlay) titleOverlay.classList.remove('visible');
    });
  } else if(!btnInfo) dlog('btnInfo not found', 'warn');

  if(btnQuitTitle){
    btnQuitTitle.addEventListener('click', ()=>{
      window.location.reload();
    });
  } else dlog('btnQuitTitle not found', 'warn');

  if(btnOptionsBack && optionsOverlay){
    btnOptionsBack.addEventListener('click', ()=>{
      optionsOverlay.classList.remove('visible');
      if(titleOverlay) titleOverlay.classList.add('visible');
    });
  }

  if(btnInfoBack && infoOverlay){
    btnInfoBack.addEventListener('click', ()=>{
      infoOverlay.classList.remove('visible');
      if(titleOverlay) titleOverlay.classList.add('visible');
    });
  }

  if(optVolume){
    optVolume.addEventListener('input', ()=>{
      masterVolume = parseFloat(optVolume.value);
      if(masterGain){
        masterGain.gain.value = masterVolume;
      }
    });
  }

  if(optParticles){
    optParticles.addEventListener('change', ()=>{
      enableParticles = !!optParticles.checked;
    });
  }

  if(btnHeroBack && heroSelectOverlay && titleOverlay){
    btnHeroBack.addEventListener('click', ()=>{
      heroSelectOverlay.classList.remove('visible');
      titleOverlay.classList.add('visible');
      gameState = 'title';
    });
  }

  if(btnHeroStart){
    btnHeroStart.addEventListener('click', ()=>{
      const hero = AVDEF.Heroes.get(selectedHeroId);
      if(!hero) {
        dlog('btnHeroStart: hero not found ' + selectedHeroId, 'error');
        return;
      }
      currentHeroId = hero.id;
      applyHeroStats(currentHeroId);
      if(heroSelectOverlay) heroSelectOverlay.classList.remove('visible');
      buildStageGrid();
      if(stageOverlay) stageOverlay.classList.add('visible');
      gameState = 'stageSelect';
      dlog('btnHeroStart → hero=' + currentHeroId, 'info');
    });
  } else dlog('btnHeroStart not found', 'error');

  if(btnStageBack && stageOverlay && heroSelectOverlay){
    btnStageBack.addEventListener('click', ()=>{
      stageOverlay.classList.remove('visible');
      heroSelectOverlay.classList.add('visible');
      gameState = 'heroSelect';
    });
  }

  if(btnStageStart){
    btnStageStart.addEventListener('click', ()=>{
      const stage = AVDEF.Stages.get(selectedStageId);
      if(!stage || !stage.unlocked) return;
      currentStageId = stage.id;
      if(stageOverlay) stageOverlay.classList.remove('visible');
      if(gameOverOverlay) gameOverOverlay.classList.remove('visible');
      if(upgradeOverlay) upgradeOverlay.classList.remove('visible');
      if(pauseOverlay) pauseOverlay.classList.remove('visible');
      resetGame();
      gameState = 'playing';
      planWave();
      dlog('btnStageStart → stage=' + currentStageId, 'info');
    });
  } else dlog('btnStageStart not found', 'error');

  if(btnRestart){
    btnRestart.addEventListener('click', ()=>{
      resetGame();
      if(gameOverOverlay) gameOverOverlay.classList.remove('visible');
      gameState = 'playing';
      planWave();
    });
  }

  if(btnQuit){
    btnQuit.addEventListener('click', ()=>{
      if(gameOverOverlay) gameOverOverlay.classList.remove('visible');
      showTitle();
      gameState = 'title';
    });
  }

  if(btnPauseResume){
    btnPauseResume.addEventListener('click', ()=>{
      togglePause();
    });
  }

  if(btnPauseQuit){
    btnPauseQuit.addEventListener('click', ()=>{
      if(pauseOverlay) pauseOverlay.classList.remove('visible');
      showTitle();
      gameState = 'title';
    });
  }

  if(btnPayRansom){
    btnPayRansom.addEventListener('click', ()=>{
      if(!ransomActive) return;
      if(chips.count >= ransomAmount){
        chips.count -= ransomAmount;
        ransomPaid = true;
        ransomActive = false;
        if(ransomBar) ransomBar.classList.remove('visible');
        updateHUD();
      }
    });
  }

  if(btnIgnoreRansom){
    btnIgnoreRansom.addEventListener('click', ()=>{
      if(!ransomActive) return;
      ransomActive = false;
      if(ransomBar) ransomBar.classList.remove('visible');
      applyRansomOutcome();
    });
  }

  function loop(){
    const now = performance.now();
    const dt = Math.min(0.05, (now-lastFrameTime)/1000);
    lastFrameTime = now;

    if(gameState === 'playing'){
      update(dt);
    }

    scanConeAngle += scanConeSpeed*dt;
    draw();

    requestAnimationFrame(loop);
  }

  // Init
  canvas.width = world.width;
  canvas.height = world.height;
  updateHUD();
  buildHeroGrid();
  showTitle();
  dlog('Engine init complete, gameState=' + gameState, 'info');
  requestAnimationFrame(loop);
})();
