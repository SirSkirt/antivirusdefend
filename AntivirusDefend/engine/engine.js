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


  const upgradeOverlay = document.getElementById('upgradeOverlay');
  const upgradeGrid = document.getElementById('upgradeGrid');

  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverSummary = document.getElementById('gameOverSummary');
  const btnRestart = document.getElementById('btnRestart');
  const btnQuit = document.getElementById('btnQuit');

  const pauseOverlay = document.getElementById('pauseOverlay');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const btnPauseTitle = document.getElementById('btnPauseTitle');
  const btnPauseQuit = btnPauseTitle || document.getElementById('btnPauseQuit');
  const btnPauseOptions = document.getElementById('btnPauseOptions');
  const btnPauseTouch = document.getElementById('btnPauseTouch');

  const optionsOverlay = document.getElementById('optionsOverlay');
  const optVolume = document.getElementById('optVolume');
  const optParticles = document.getElementById('optParticles');
  const optFullscreen = document.getElementById('optFullscreen');

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
  }
  // Background scrolling state
  // let bgScrollX (unused after case redesign) = 0;
  // let bgScrollY (unused after case redesign) = 0;
  // const BG_TILE (unused after case redesign) = 64;
  // const BG_SCROLL_SPEED (unused after case redesign) = 18; // pixels per second
;


  // Logical world size is fixed; canvas pixels scale to fit viewport
  const BASE_WORLD_WIDTH = world.width;
  const BASE_WORLD_HEIGHT = world.height;

  // How many canvas pixels correspond to one world unit (same for X/Y because we keep aspect)
  let renderScale = 1;

  // Camera center in world units (follows the player)
  let camX = world.width * 0.5;
  let camY = world.height * 0.5;


  
function resizeGameCanvas(){
    if (!canvas || !ctx) return;

    // Measure the actual game wrapper so the canvas matches the visible game window
    const gameWrap =
      (canvas.parentElement && canvas.parentElement.classList && canvas.parentElement.classList.contains('game-wrap'))
        ? canvas.parentElement
        : document.querySelector('.game-wrap') || canvas.parentElement || document.body;

    const rect = gameWrap.getBoundingClientRect();

    // Use almost the full wrapper area (a little padding to avoid touching edges)
    const padding = 6;
    const availWidth  = Math.max(320, rect.width  - padding * 2);
    const availHeight = Math.max(240, rect.height - padding * 2);

    const dpr = window.devicePixelRatio || 1;

    // Size of the CSS box (display size in CSS pixels)
    canvas.style.width  = availWidth + 'px';
    canvas.style.height = availHeight + 'px';

    // Actual backing resolution (real canvas pixels)
    canvas.width  = Math.round(availWidth  * dpr);
    canvas.height = Math.round(availHeight * dpr);

    // Uniform scale so the 960x540 world fits inside whatever size we ended up with
    const scaleX = canvas.width  / BASE_WORLD_WIDTH;
    const scaleY = canvas.height / BASE_WORLD_HEIGHT;
    renderScale = Math.min(scaleX, scaleY);
}



  let currentMode = null;        // No mode running
  let activePlugin = null;       // Track plugin object
  let gameState = 'title';       // Just the UI state


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
  let bestWaveEver = 0;
  let ramsticks = 0;

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
    let radius = 6;
    if(window.AVDEF && AVDEF.Textures && AVDEF.Textures.projectileSprites){
      const sprites = AVDEF.Textures.projectileSprites;
      const sprite = sprites[currentHeroId] || sprites.default;
      if(sprite && typeof sprite.radius === 'number'){
        radius = sprite.radius;
      }
    }
    projectiles.push({
      x,y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      radius,
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

  function spawnChip(x, y, amount){
    // Award chips to the player when enemies are defeated.
    // x, y are reserved for future VFX spawn positions.
    if (typeof amount !== 'number') amount = 1;
    chips.count += amount;
    updateHUD();
  }


function loadProgress(){
    try{
      const raw = window.localStorage ? localStorage.getItem('avdefProgress') : null;
      if(!raw) return;
      const data = JSON.parse(raw);
      if(typeof data.bestWave === 'number') bestWaveEver = data.bestWave;
      if(typeof data.ramsticks === 'number') ramsticks = data.ramsticks;
    }catch(err){
      dlog('Failed to load progress', 'warn', { error: String(err) });
    }
  }

  function saveProgress(){
    try{
      if(!window.localStorage) return;
      const payload = { bestWave: bestWaveEver, ramsticks };
      localStorage.setItem('avdefProgress', JSON.stringify(payload));
    }catch(err){
      dlog('Failed to save progress', 'warn', { error: String(err) });
    }
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

    // Update persistent progress: highest wave reached this run
    const reachedWave = Math.max(1, currentWave);
    if(reachedWave > bestWaveEver){
      bestWaveEver = reachedWave;
    }

    // Convert leftover chips into global RAM sticks
    const gainedRam = chips.count * 0.06;
    if(gainedRam > 0){
      ramsticks += gainedRam;
    }
    chips.count = 0;
    saveProgress();
    updateHUD();

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
    // Spawn enemies in a ring around the player so the world feels infinite.
    const baseRadius = Math.max(world.width, world.height) * 0.75;
    const spawnRadius = baseRadius + 80;
    const angle = Math.random() * Math.PI * 2;
    let x = player.x + Math.cos(angle) * spawnRadius;
    let y = player.y + Math.sin(angle) * spawnRadius;

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

    }

    // Aiming (mouse / touch pointer / gamepad right stick)
    let dirX = Math.cos(player.facingAngle);
    let dirY = Math.sin(player.facingAngle);

    // Mouse / touch pointer: convert from screen space to world-space
    // relative to the player (who is kept at the center of the world view).
    if(typeof input.pointerX === 'number' && typeof input.pointerY === 'number' && renderScale > 0){
      const sx = input.pointerX / renderScale;
      const sy = input.pointerY / renderScale;
      const dx = sx - world.width * 0.5;
      const dy = sy - world.height * 0.5;
      if(Math.hypot(dx,dy) > 4){
        dirX = dx;
        dirY = dy;
      }
    }

    // Gamepad right stick aim overrides pointer if active
    if(typeof input.aimStickX === 'number' && typeof input.aimStickY === 'number'){
      const ax2 = input.aimStickX;
      const ay2 = input.aimStickY;
      const dead2 = 0.25;
      if(Math.abs(ax2) > dead2 || Math.abs(ay2) > dead2){
        dirX = ax2;
        dirY = ay2;
      }
    }

    const mag = Math.hypot(dirX, dirY);
    if(mag > 0.0001){
      player.facingAngle = Math.atan2(dirY, dirX);
    }

    // NOTE: no shooting here anymore – shooting is handled centrally
    // in update(dt) using auto-lock.

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

    // --- Auto-lock shooting with hero-specific spread ---
    const baseDelay = player.baseFireDelay * player.fireDelayMult;
    const nowShoot = gameTime;

    if(nowShoot - player.lastShot >= baseDelay){
      const targetInfo = vectorToNearestEnemy(player.x, player.y);
      if(targetInfo){
        let angle = Math.atan2(targetInfo.dy, targetInfo.dx);

        // Default spread, tweaked per hero
        let spread = 0.20;
        if(currentHeroId === 'norton') spread = 0.0;
        else if(currentHeroId === 'avg') spread = 0.15;
        else if(currentHeroId === 'q360' || currentHeroId === 'total') spread = 0.18;
        else if(currentHeroId === 'avast') spread = 0.22;
        else if(currentHeroId === 'mcafee') spread = 0.12;

        angle += randRange(-spread, spread);

        if(!audioArmed){
          ensureAudio();
          audioArmed = true;
        }

        const baseDamage = player.baseDamage * player.damageMult;
        const stunMult = gameTime < player.stunnedUntil ? 0.6 : 1;
        const dmg = baseDamage * stunMult;

        // Always use the standard stylized projectile for Defender's basic shots.
        const kind = 'bullet';

        spawnProjectile(player.x, player.y, angle, 260, dmg, kind);
        player.lastShot = nowShoot;
        playBeep(620, 0.05, 0.12);
      }
    }


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

      // Spyware: freezes when the player's scan cone (facingAngle) is pointed at it.
      if(e.type === 'spyware' && scanConeEnabled){
        const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
        let diff = angleToEnemy - player.facingAngle;
        while(diff > Math.PI) diff -= Math.PI*2;
        while(diff < -Math.PI) diff += Math.PI*2;
        const coneWidth = Math.PI/6; // matches the visual cone width
        const maxAngle = coneWidth/2;
        const maxDist = player.radius*5; // same as cone radius
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if(Math.abs(diff) < maxAngle && dist <= maxDist){
          // Locked by gaze this frame.
          dx = 0;
          dy = 0;
        }
      }

      // Virus mimics: act as friendly turrets while disguised,
      // then reveal into aggressive purple viruses when the player gets close.
      if(e.type === 'virus'){
        const revealRadius = player.radius*5; // use same radius as the scan cone length
        const distToPlayerCenter = Math.hypot(e.x - player.x, e.y - player.y);
        if(e.disguised && distToPlayerCenter <= revealRadius){
          // Player has entered the mimic's personal bubble: reveal!
          e.disguised = false;
        }

        if(e.disguised){
          // While disguised, stay mostly in place and shoot at other enemies.
          dx = 0;
          dy = 0;

          const now = gameTime;
          const cooldown = 1.2; // seconds between mimic shots
          if(now - (e.lastAttack || 0) >= cooldown){
            let target = null;
            let best = Infinity;
            for(const other of enemies){
              if(other === e) continue;
              if(other.hp <= 0) continue;
              // Only shoot non-virus enemies so they look like they're helping you.
              if(other.type === 'virus') continue;
              const dd = Math.hypot(other.x - e.x, other.y - e.y);
              if(dd < best){
                best = dd;
                target = other;
              }
            }
            if(target){
              e.lastAttack = now;
              const ang = Math.atan2(target.y - e.y, target.x - e.x);
              const dmg = player.baseDamage * player.damageMult * 0.5;
              spawnProjectile(e.x, e.y, ang, 260, dmg, 'virusTurret');
            }
          }
        }
      }


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
        // Award some chips based on their XP value (rounded, minimum 1)
        const chipGain = Math.max(1, Math.floor((e.xpValue || 6) * 0.5));
        spawnChip(e.x,e.y, chipGain);
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
      // Cull projectiles based on distance from the player, not fixed world edges,
      // so the world can feel infinite while keeping performance sane.
      const offX = p.x - player.x;
      const offY = p.y - player.y;
      const marginX = world.width * 0.9;
      const marginY = world.height * 0.9;
      if(offX < -marginX || offX > marginX || offY < -marginY || offY > marginY){
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

    // Allow current game mode plugin to run custom per-frame logic
    if(window.AVDEF && AVDEF.GameModes && AVDEF.GameModes[currentMode] && typeof AVDEF.GameModes[currentMode].onUpdate === 'function'){
      AVDEF.GameModes[currentMode].onUpdate(dt);
    }

    updateHUD();
  }

  function updateHUD(){
    const displayBestWave = Math.max(bestWaveEver, currentWave);
    if(uiWave) uiWave.textContent = `Best ${displayBestWave}`;
    if(uiHP) uiHP.textContent = `HP ${player.hp}/${player.maxHp}`;
    if(uiXP) uiXP.textContent = `XP ${player.xp}/${player.xpToNext}`;
    if(uiLevel) uiLevel.textContent = `LVL ${player.level}`;
    if(uiChips) uiChips.textContent = `Ramsticks ${ramsticks.toFixed(2)}`;
  }

  // --- Drawing ---
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
  const tileW = world.width;
  const tileH = world.height;

  // Repeat the case art in a small grid around the camera
  const baseTileX = Math.floor(camX / tileW);
  const baseTileY = Math.floor(camY / tileH);

  for (let ty = baseTileY - 1; ty <= baseTileY + 1; ty++){
    for (let tx = baseTileX - 1; tx <= baseTileX + 1; tx++){
      ctx.save();
      ctx.translate(tx * tileW, ty * tileH);
      drawBackgroundCaseSingle();
      ctx.restore();
    }
  }
}

function drawBackgroundCaseSingle(){
  const w = world.width;
  const h = world.height;

  // Dark base that everything sits on
  const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
  baseGrad.addColorStop(0, '#020617');
  baseGrad.addColorStop(0.4, '#02081a');
  baseGrad.addColorStop(1, '#000814');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // Inner motherboard slab (no grids, just a big PCB plate)
  const pad = 24;
  const innerX = pad;
  const innerY = pad + 8;
  const innerW = w - pad*2;
  const innerH = h - pad*2 - 16;

  ctx.save();
  ctx.beginPath();
  const r = 18;
  ctx.moveTo(innerX + r, innerY);
  ctx.lineTo(innerX + innerW - r, innerY);
  ctx.quadraticCurveTo(innerX + innerW, innerY, innerX + innerW, innerY + r);
  ctx.lineTo(innerX + innerW, innerY + innerH - r);
  ctx.quadraticCurveTo(innerX + innerW, innerY + innerH, innerX + innerW - r, innerY + innerH);
  ctx.lineTo(innerX + r, innerY + innerH);
  ctx.quadraticCurveTo(innerX, innerY + innerH, innerX, innerY + innerH - r);
  ctx.lineTo(innerX, innerY + r);
  ctx.quadraticCurveTo(innerX, innerY, innerX + r, innerY);
  ctx.closePath();

  const pcbGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
  pcbGrad.addColorStop(0, '#020f18');
  pcbGrad.addColorStop(0.4, '#02233b');
  pcbGrad.addColorStop(1, '#011423');
  ctx.fillStyle = pcbGrad;
  ctx.fill();

  // Soft inner glow along edges
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.clip();

  // --- Animated "traces" that pulse like data moving around the board ---
  const t = gameTime || 0;

  function drawTraceStrip(y, phase){
    const glow = 0.35 + 0.25 * Math.sin(t * 2.0 + phase);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(56,189,248,${glow})`;
    ctx.beginPath();
    let x = innerX + 16;
    ctx.moveTo(x, y);
    const step = 56;
    let dir = 1;
    while (x < innerX + innerW - 24){
      const nx = x + step;
      const ny = y + dir * 14;
      ctx.lineTo(nx, ny);
      x = nx;
      y = ny;
      dir *= -1;
    }
    ctx.stroke();
  }

  // A few horizontal "bus" lines
  for(let i=0;i<4;i++){
    const lineY = innerY + innerH*0.2 + i*innerH*0.17;
    drawTraceStrip(lineY, i*0.9);
  }

  // Vertical power rails with little indicator nodes
  ctx.lineWidth = 4;
  for(let i=0;i<3;i++){
    const railX = innerX + innerW*0.2 + i*innerW*0.25;
    const pulse = 0.25 + 0.2 * Math.sin(t*1.6 + i*1.3);
    ctx.strokeStyle = `rgba(34,197,94,${0.45 + pulse})`;
    ctx.beginPath();
    ctx.moveTo(railX, innerY + 24);
    ctx.lineTo(railX, innerY + innerH - 24);
    ctx.stroke();

    // nodes
    ctx.fillStyle = `rgba(190,242,100,${0.35 + pulse})`;
    for(let n=0;n<5;n++){
      const yy = innerY + 32 + n*(innerH-64)/4;
      ctx.beginPath();
      ctx.arc(railX, yy, 3.5, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // --- Fans in the corners that actually spin ---
  function drawFan(cx, cy, radius, phase){
    ctx.save();
    ctx.translate(cx, cy);

    // Housing ring
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating blades
    const rot = t * 4.0 + phase;
    const blades = 4;
    ctx.fillStyle = '#0ea5e9';
    for(let i=0;i<blades;i++){
      ctx.save();
      ctx.rotate(rot + i*(Math.PI*2/blades));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(radius*0.7, -radius*0.2, radius*0.9, 0);
      ctx.quadraticCurveTo(radius*0.7, radius*0.2, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    // Center cap
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(0, 0, radius*0.18, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  const fanR = 26;
  drawFan(innerX + fanR + 14, innerY + fanR + 14, fanR, 0.0);
  drawFan(innerX + innerW - fanR - 14, innerY + fanR + 14, fanR, 0.7);
  drawFan(innerX + fanR + 14, innerY + innerH - fanR - 14, fanR, 1.4);
  drawFan(innerX + innerW - fanR - 14, innerY + innerH - fanR - 14, fanR, 2.2);

  // A central "CPU" block that gently pulses
  const cpuW = innerW * 0.18;
  const cpuH = innerH * 0.22;
  const cpuX = innerX + innerW*0.5 - cpuW*0.5;
  const cpuY = innerY + innerH*0.45 - cpuH*0.5;

  const pulse = 0.15 + 0.1 * Math.sin(t*3.0);
  const cpuGrad = ctx.createLinearGradient(cpuX, cpuY, cpuX + cpuW, cpuY + cpuH);
  cpuGrad.addColorStop(0, `rgba(15,23,42,0.95)`);
  cpuGrad.addColorStop(1, `rgba(30,64,175,${0.7 + pulse})`);
  ctx.fillStyle = cpuGrad;
  ctx.fillRect(cpuX, cpuY, cpuW, cpuH);

  ctx.strokeStyle = 'rgba(129,140,248,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cpuX, cpuY, cpuW, cpuH);

  // Small LEDs under the CPU
  const ledCount = 6;
  for(let i=0;i<ledCount;i++){
    const lx = cpuX + 6 + i*(cpuW-12)/(ledCount-1);
    const ly = cpuY + cpuH + 10;
    const phase = t*4 + i*0.7;
    const a = 0.25 + 0.35*Math.max(0, Math.sin(phase));
    ctx.fillStyle = `rgba(56,189,248,${a})`;
    ctx.fillRect(lx-3, ly-2, 6, 4);
  }

  ctx.restore();
}

function drawCaseFrame(){
  const w = world.width;
  const h = world.height;

  // Outer bezel that stays fixed to the screen (drawn after camera transforms).
  const pad = 24;

  // Outer shell
  ctx.save();
  const outerGrad = ctx.createLinearGradient(0, 0, 0, h);
  outerGrad.addColorStop(0, '#020617');
  outerGrad.addColorStop(0.5, '#020617');
  outerGrad.addColorStop(1, '#000814');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(0, 0, w, h);

  // Inner window cutout
  const r = 22;
  const x = pad;
  const y = pad;
  const innerW = w - pad*2;
  const innerH = h - pad*2;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + innerW - r, y);
  ctx.quadraticCurveTo(x + innerW, y, x + innerW, y + r);
  ctx.lineTo(x + innerW, y + innerH - r);
  ctx.quadraticCurveTo(x + innerW, y + innerH, x + innerW - r, y + innerH);
  ctx.lineTo(x + r, y + innerH);
  ctx.quadraticCurveTo(x, y + innerH, x, y + innerH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Glass edge
  ctx.strokeStyle = 'rgba(148,163,184,0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + innerW - r, y);
  ctx.quadraticCurveTo(x + innerW, y, x + innerW, y + r);
  ctx.lineTo(x + innerW, y + innerH - r);
  ctx.quadraticCurveTo(x + innerW, y + innerH, x + innerW - r, y + innerH);
  ctx.lineTo(x + r, y + innerH);
  ctx.quadraticCurveTo(x, y + innerH, x, y + innerH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();

  // Tiny "screws" at bezel corners
  const screwR = 4;
  const screwCenters = [
    [x + 12, y + 12],
    [x + innerW - 12, y + 12],
    [x + 12, y + innerH - 12],
    [x + innerW - 12, y + innerH - 12]
  ];
  for(const [sx, sy] of screwCenters){
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(sx, sy, screwR, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx - 2, sy);
    ctx.lineTo(sx + 2, sy);
    ctx.moveTo(sx, sy - 2);
    ctx.lineTo(sx, sy + 2);
    ctx.stroke();
  }

  // Bottom info bar where the HUD sits
  ctx.fillStyle = 'rgba(15,23,42,0.96)';
  ctx.fillRect(0, h - 46, w, 46);

  // Subtle top glow strip
  const glowGrad = ctx.createLinearGradient(0, 0, 0, 32);
  glowGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
  glowGrad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(x + 4, y + 4, innerW - 8, 18);

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
        const defImg = heroImages['defender'];
        const canDrawLogo = !!(defImg && defImg.complete && defImg.naturalWidth > 0);
        if(e.disguised && canDrawLogo){
          const size = e.radius*2.4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(0,0,size*0.52,0,Math.PI*2);
          ctx.clip();
          ctx.drawImage(defImg,-size/2,-size/2,size,size);
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

    
    ctx.restore();
  }

function drawHeroBody(){
    const hero = AVDEF.Heroes.get(currentHeroId) || {};
    ctx.save();
    ctx.translate(player.x,player.y);
    ctx.rotate(player.facingAngle);

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
      if(p.kind === 'shield'){
        // Keep shield shots as a glowing orb
        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x-10,p.y-10,p.x+10,p.y+10);
        grad.addColorStop(0,'#60a5fa');
        grad.addColorStop(1,'#22d3ee');
        ctx.fillStyle = grad;
        ctx.arc(p.x,p.y,p.radius+2,0,Math.PI*2);
        ctx.fill();
        continue;
      }

      // Direction of travel for a small tail
      const speedLen = Math.hypot(p.vx, p.vy) || 1;
      const nx = p.vx / speedLen;
      const ny = p.vy / speedLen;
      let tailLen = 18;

      // Pull projectile sprite shape from AVDEF.Textures.projectileSprites
      if(window.AVDEF && AVDEF.Textures && AVDEF.Textures.projectileSprites){
        const sprites = AVDEF.Textures.projectileSprites;
        const sprite = sprites[currentHeroId] || sprites.default;
        if(sprite && typeof sprite.tail === 'number'){
          tailLen = sprite.tail;
        }
      }

      const x2 = p.x;
      const y2 = p.y;
      const x1 = p.x - nx * tailLen;
      const y1 = p.y - ny * tailLen;

      // Color palette per hero comes from AVDEF.Textures
      let inner = '#e0f2fe';
      let mid   = '#38bdf8';
      let outer = '#0ea5e9';

      if(window.AVDEF && AVDEF.Textures && AVDEF.Textures.projectilePalettes){
        const palettes = AVDEF.Textures.projectilePalettes;
        const base = palettes.default || { inner, mid, outer };
        const heroPalette = palettes[currentHeroId] || base;
        inner = heroPalette.inner || inner;
        mid   = heroPalette.mid   || mid;
        outer = heroPalette.outer || outer;
      }

      // Draw tail
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(15,23,42,0)');
      grad.addColorStop(0.4, outer);
      grad.addColorStop(0.9, mid);

      ctx.lineWidth = Math.max(2, p.radius*0.9);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Small glowing core at the tip
      ctx.beginPath();
      const coreGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius*1.8);
      coreGrad.addColorStop(0, inner);
      coreGrad.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = coreGrad;
      ctx.arc(p.x, p.y, p.radius*1.4, 0, Math.PI*2);
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
  const barWidth  = 220;
  const barHeight = 12;
  const margin    = 16;

  // Draw relative to the logical world size, not raw canvas pixels
  const startX = margin;
  const startY = world.height - 60;

  ctx.save();
  ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'top';

  // --- Glassy background panel ---
  const panelWidth  = barWidth + 140;
  const panelHeight = 52;

  const gradPanel = ctx.createLinearGradient(startX, startY, startX, startY + panelHeight);
  gradPanel.addColorStop(0, 'rgba(15,23,42,0.96)');
  gradPanel.addColorStop(1, 'rgba(15,23,42,0.88)');

  ctx.fillStyle = gradPanel;
  ctx.beginPath();
  const r = 10;
  const x0 = startX - 10;
  const y0 = startY - 16;
  const x1 = x0 + panelWidth;
  const y1 = y0 + panelHeight;
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.fill();

  // Border glow
  ctx.strokeStyle = 'rgba(56,189,248,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Subtle scanline overlay
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  for(let y = y0 + 4; y < y1; y += 4){
    ctx.moveTo(x0+4, y);
    ctx.lineTo(x1-4, y);
  }
  ctx.strokeStyle = 'rgba(15,23,42,0.9)';
  ctx.stroke();
  ctx.globalAlpha = 1;

  // --- Labels & numbers ---
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText('Wave', startX, startY - 14);
  ctx.fillText('LVL',  startX + barWidth + 50, startY - 14);

  // Little CPU icon next to Chips
  const cpuIconX = startX + barWidth + 50;
  const cpuIconY = startY + barHeight + 8;
  ctx.save();
  ctx.translate(cpuIconX, cpuIconY);
  ctx.strokeStyle = '#facc15';
  ctx.fillStyle = '#020617';
  ctx.lineWidth = 1;
  // CPU body
  ctx.beginPath();
  ctx.rect(-6, -6, 12, 12);
  ctx.fill();
  ctx.stroke();
  // Pins
  for(let i=-4;i<=4;i+=4){
    ctx.beginPath();
    ctx.moveTo(-8,i); ctx.lineTo(-6,i);
    ctx.moveTo(6,i);  ctx.lineTo(8,i);
    ctx.moveTo(i,-8); ctx.lineTo(i,-6);
    ctx.moveTo(i,6);  ctx.lineTo(i,8);
    ctx.stroke();
  }
  // Core
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-3,-3,6,6);
  ctx.restore();

  ctx.fillText('Chips', cpuIconX + 14, startY + barHeight + 6);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(String(currentWave), startX + 40, startY - 14);
  ctx.fillText(String(player.level), startX + barWidth + 82, startY - 14);
  ctx.fillStyle = '#facc15';
  ctx.fillText(String(chips.count), cpuIconX + 70, startY + barHeight + 6);

  // --- HP Bar ---
  const hpFrac = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const xpFrac = Math.max(0, Math.min(1, player.xp / player.xpToNext));

  // Outer frames
  ctx.fillStyle = 'rgba(15,23,42,0.95)';
  ctx.fillRect(startX - 4, startY - 4, barWidth + 8, barHeight + 8);
  ctx.fillRect(startX - 4, startY + barHeight + 10, barWidth + 8, barHeight + 8);

  // Inner background
  ctx.fillStyle = '#020617';
  ctx.fillRect(startX - 2, startY - 2, barWidth + 4, barHeight + 4);
  ctx.fillRect(startX - 2, startY + barHeight + 12, barWidth + 4, barHeight + 4);

  // HP gradient
  const hpGrad = ctx.createLinearGradient(startX - 2, startY, startX + barWidth + 2, startY);
  hpGrad.addColorStop(0, '#ef4444');
  hpGrad.addColorStop(0.5, '#f97373');
  hpGrad.addColorStop(1, '#fecaca');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(startX - 2, startY - 2, (barWidth + 4) * hpFrac, barHeight + 4);

  // XP gradient
  const xpGrad = ctx.createLinearGradient(startX - 2, startY + barHeight + 12, startX + barWidth + 2, startY + barHeight + 12);
  xpGrad.addColorStop(0, '#22c55e');
  xpGrad.addColorStop(1, '#bbf7d0');
  ctx.fillStyle = xpGrad;
  ctx.fillRect(startX - 2, startY + barHeight + 12, (barWidth + 4) * xpFrac, barHeight + 4);

  // Number overlays
  ctx.fillStyle = '#0b1120';
  ctx.fillText(player.hp + '/' + player.maxHp, startX + 6, startY - 2);
  ctx.fillStyle = '#052e16';
  ctx.fillText(player.xp + '/' + player.xpToNext, startX + 6, startY + barHeight + 10);

  ctx.restore();
}

function draw(){
    if (!canvas || !ctx) return;

    // Clear the raw canvas
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Scale world space (960x540) into the current canvas resolution
    ctx.setTransform(renderScale,0,0,renderScale,0,0);

    // Camera follows the player so the world scrolls around them
    // Simple smoothing keeps motion from feeling too jerky
    const camLerp = 0.15;
    camX += (player.x - camX) * camLerp;
    camY += (player.y - camY) * camLerp;

    // --- World layer (moves with camera) ---
    ctx.save();
    ctx.translate(world.width * 0.5 - camX, world.height * 0.5 - camY);

    // Inside-the-case world
    drawBackgroundCase();
    drawXPOrbs();
    drawParticles();
    drawEnemies();
    drawHero();
    drawProjectiles();
    drawBeams();
    drawAOEPulses();

    ctx.restore();

    // --- HUD / UI layer (fixed on screen) ---
    ctx.save();
    ctx.setTransform(renderScale,0,0,renderScale,0,0);
    drawHUD();
    ctx.restore();
  }

    // Expose raw draw for external render plugins
    AVDEF.Engine = AVDEF.Engine || {};
    AVDEF.Engine._internalDraw = draw;


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

  // Let other layers reopen the paused state
  AVDEF.Engine = AVDEF.Engine || {};
  AVDEF.Engine.showPauseOverlay = function(){
    gameState = 'paused';
    if(pauseOverlay) pauseOverlay.classList.add('visible');
  };

  // --- Button wiring with null checks ---

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
      // future logic for returning to title/menu can go here
    });
  }

if(btnPauseResume){
    btnPauseResume.addEventListener('click', ()=>{
      togglePause();
    });
  }

  if(btnPauseOptions){
    btnPauseOptions.addEventListener('click', ()=>{
      // Sync current engine options into the UI sliders/toggles
      if(window.AVDEF && AVDEF.Engine && AVDEF.Engine.getOptions){
        const opts = AVDEF.Engine.getOptions();
        if(optVolume && typeof opts.volume === 'number'){
          optVolume.value = String(opts.volume);
        }
        if(optParticles){
          optParticles.checked = !!opts.particles;
        }
      }
      // Hide pause overlay and show options overlay while staying paused
      if(pauseOverlay) pauseOverlay.classList.remove('visible');
      if(optionsOverlay) optionsOverlay.classList.add('visible');
    });
  }

  if(btnPauseQuit){
    btnPauseQuit.addEventListener('click', ()=>{
      if(pauseOverlay) pauseOverlay.classList.remove('visible');
    });
  }

  if(btnPauseTouch){
    const handlePauseTap = (e)=>{
      e.preventDefault();
      togglePause();
    };
    btnPauseTouch.addEventListener('click', handlePauseTap);
    btnPauseTouch.addEventListener('touchstart', handlePauseTap, {passive:false});
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
    if(window.AVDEF && AVDEF.Render && AVDEF.Render.draw){
      AVDEF.Render.draw();
    }else{
      draw();
    }

    requestAnimationFrame(loop);
  }
// --- Public engine API for title.js / menus ---
  window.AVDEF = window.AVDEF || {};
  AVDEF.Engine = AVDEF.Engine || {};

  // Current options (volume + particles) for the Options menu
  AVDEF.Engine.getOptions = function(){
    return {
      volume: typeof masterVolume === 'number' ? masterVolume : 0.5,
      particles: !!enableParticles
    };
  };

  AVDEF.Engine.setOptions = function(opts){
    if(opts && typeof opts.volume === 'number'){
      masterVolume = opts.volume;
      if(masterGain){
        masterGain.gain.value = masterVolume;
      }
    }
    if(opts && typeof opts.particles === 'boolean'){
      enableParticles = opts.particles;
    }
  };

  // Hero selection
  AVDEF.Engine.setHero = function(heroId){
    selectedHeroId = heroId;
    dlog('Engine.setHero(' + heroId + ')', 'info');
  };

  AVDEF.Engine.getHero = function(){
    return selectedHeroId;
  };

  // Stage selection
  AVDEF.Engine.setStage = function(stageId){
    selectedStageId = stageId;
    dlog('Engine.setStage(' + stageId + ')', 'info');
  };

  AVDEF.Engine.getStage = function(){
    return selectedStageId;
  };

  // Game mode selection (plugin-based)
  AVDEF.Engine.setGameMode = function(modeId){
    currentMode = modeId;
    dlog('Engine.setGameMode(' + modeId + ')', 'info');
  };

  AVDEF.Engine.getGameMode = function(){
    return currentMode;
  };

  AVDEF.Engine.getGameModeConfig = function(){
    if(window.AVDEF && AVDEF.GameModes){
      return AVDEF.GameModes[currentMode] || null;
    }
    return null;
  };

  // Start a new run using the currently selected hero + stage
  AVDEF.Engine.startRun = function(){
    const hero = (window.AVDEF && AVDEF.Heroes && AVDEF.Heroes.get)
      ? AVDEF.Heroes.get(selectedHeroId)
      : null;

    if(!hero){
      dlog('Engine.startRun: hero not found ' + selectedHeroId, 'error');
      return;
    }

    currentHeroId = hero.id;
    applyHeroStats(currentHeroId);

    const stage = (window.AVDEF && AVDEF.Stages && AVDEF.Stages.get)
      ? AVDEF.Stages.get(selectedStageId)
      : null;

    if(stage && stage.unlocked){
      currentStageId = stage.id;
    }

    resetGame();
    gameState = 'playing';
    planWave();

    // Notify current game mode plugin
    if(window.AVDEF && AVDEF.GameModes && AVDEF.GameModes[currentMode] && typeof AVDEF.GameModes[currentMode].onStartRun === 'function'){
      AVDEF.GameModes[currentMode].onStartRun();
    }

    dlog('Engine.startRun(): hero=' + currentHeroId + ', stage=' + currentStageId, 'info');
  };

  
  // Start main loop
  requestAnimationFrame(loop);

  // Hook canvas resize to window size
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', resizeGameCanvas);
    window.addEventListener('orientationchange', resizeGameCanvas);
  }
  // Initial sizing once DOM + script are ready
  resizeGameCanvas();


// Let title.js tell the engine "we're in the title state now"

})();
