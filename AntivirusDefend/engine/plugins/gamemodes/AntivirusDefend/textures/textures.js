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


  // Drawing functions for enemies, stage background, and HUD.
  function drawStageBackground(ctx, world, gameTime){
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
    const pad = 42;
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

  function drawEnemiesTex(ctx, enemies, player, heroImages, gameTime){
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

  function drawHUDTex(ctx, world, player, chips, currentWave, gameTime){
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
    ctx.fillText('Chips',startX + barWidth + 50, startY + barHeight + 6);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(String(currentWave), startX + 40, startY - 14);
    ctx.fillText(String(player.level), startX + barWidth + 82, startY - 14);
    ctx.fillStyle = '#facc15';
    ctx.fillText(String(chips.count), startX + barWidth + 96, startY + barHeight + 6);

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

  return {
    heroLogos: HERO_LOGOS,
    projectilePalettes: PROJECTILE_PALETTES,
    stageStyles: STAGE_STYLES,
    drawStageBackground: drawStageBackground,
    drawEnemies: drawEnemiesTex,
    drawHUD: drawHUDTex
  };
})();
