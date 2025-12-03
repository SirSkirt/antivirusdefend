// AntivirusDefend/engine/plugins/gamemodes/TowerDefense/towerdef_core.js
// Minimal Tower Defense core stub wired into Defender Engine plugin system.
// This does NOT implement full gameplay yet; it just proves the mode plumbing works.

(function(global){
  const AVDEF = global.AVDEF || (global.AVDEF = {});
  AVDEF.GameModes = AVDEF.GameModes || {};

  // Logical coordinate system from the original standalone TD
  const LOGICAL_W = 960;
  const LOGICAL_H = 640;

  // Path from the original Tower Defense prototype (in logical pixels)
  const TD_PATH = [
    {x:40,y:360},{x:220,y:360},{x:220,y:200},
    {x:460,y:200},{x:460,y:460},{x:760,y:460},
    {x:760,y:220},{x:920,y:220}
  ];

  function buildPathSegments(path){
    const segs = [];
    let acc = 0;
    for (let i=0;i<path.length-1;i++){
      const a = path[i];
      const b = path[i+1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 0.0001;
      const seg = { a, b, len, start: acc, end: acc + len };
      segs.push(seg);
      acc += len;
    }
    return { segments: segs, total: acc };
  }

  const td = {
    id: "towerdef",
    label: "Tower Defense",
    description: "Prototype tower defense mode (stub).",

    // Called once when the engine first needs this mode
    onInit(ctx){
      // ctx: { canvas, ctx, width, height, ui?, input? }
      this.ctx = ctx.ctx;
      this.canvas = ctx.canvas;
      this.engineCtx = ctx;

      // Time & wave state
      this.time = 0;
      this.wave = 1;
      this.running = false;

      // Build path geometry once using the original TD path
      const built = buildPathSegments(TD_PATH);
      this.pathSegments = built.segments;
      this.pathLength = built.total;

      // Simple enemy list for now
      this.enemies = [];
      this.spawnTimer = 0;
    },

    // Called when a new run starts (after hero + stage selection)
    onStartRun(){
      this.time = 0;
      this.wave = 1;
      this.running = true;

      // Reset enemy state
      this.enemies = [];
      this.spawnTimer = 0;

      if (this.engineCtx && this.engineCtx.ui && this.engineCtx.ui.setWave) {
        this.engineCtx.ui.setWave(this.wave);
      }

      console.log("[TowerDefense] onStartRun()");
    },

    // Per-frame update from engine loop
    onUpdate(dt){
      if (!this.running) return;
      this.time += dt;

      // Basic wave progression: bump wave every 15 seconds for now
      if (this.time > 15){
        this.time = 0;
        this.wave++;
        if (this.engineCtx && this.engineCtx.ui && this.engineCtx.ui.setWave) {
          this.engineCtx.ui.setWave(this.wave);
        }
      }

      // --- Very simple enemy spawning & movement preview ---
      if (!this.pathSegments || !this.pathSegments.length) return;

      // Spawn one enemy every 1.5 seconds, capped to a small number for now
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.5 && this.enemies.length < 12){
        this.spawnTimer = 0;
        this.enemies.push({
          dist: 0,
          speed: 80 + Math.random() * 40  // logical units / second
        });
      }

      const maxDist = this.pathLength + 40;
      // Advance enemies along the path
      for (let i=this.enemies.length-1; i>=0; i--){
        const e = this.enemies[i];
        e.dist += e.speed * dt;
        if (e.dist > maxDist){
          this.enemies.splice(i,1);
        }
      }
    },

    // Sample a logical (x,y) position along the TD path by traveled distance
    samplePath(dist){
      if (!this.pathSegments || !this.pathSegments.length){
        return {x:0,y:0};
      }
      const maxD = this.pathLength || 0;
      if (maxD <= 0){
        const first = this.pathSegments[0].a;
        return {x:first.x, y:first.y};
      }
      let d = dist;
      if (d < 0) d = 0;
      if (d > maxD) d = maxD;
      for (let i=0;i<this.pathSegments.length;i++){
        const seg = this.pathSegments[i];
        if (d <= seg.end || i === this.pathSegments.length-1){
          const span = seg.len || 0.0001;
          const t = span > 0 ? (d - seg.start) / span : 0;
          return {
            x: seg.a.x + (seg.b.x - seg.a.x) * t,
            y: seg.a.y + (seg.b.y - seg.a.y) * t
          };
        }
      }
      const lastSeg = this.pathSegments[this.pathSegments.length-1];
      return {x:lastSeg.b.x, y:lastSeg.b.y};
    },

    // Called by render loop AFTER the base world has rendered
    onRender(ctxObj){
      if (!this.canvas) return;
      const w = this.canvas.width;
      const h = this.canvas.height;

      const gfx = (ctxObj && ctxObj.ctx) ? ctxObj.ctx : this.ctx;
      if (!gfx) return;

      gfx.save();

      // Clear previous world so TD owns the frame
      gfx.clearRect(0, 0, w, h);

      // Draw a subtle grid board in the center as placeholder
      const cols = 6;
      const rows = 4;
      const marginX = w * 0.12;
      const marginY = h * 0.18;
      const boardW = w * 0.76;
      const boardH = h * 0.64;
      const cellW = boardW / cols;
      const cellH = boardH / rows;

      // Base grid
      gfx.strokeStyle = "rgba(148,163,184,0.35)";
      gfx.lineWidth = 2;

      for(let r=0; r<=rows; r++){
        const y = marginY + r * cellH;
        gfx.beginPath();
        gfx.moveTo(marginX, y);
        gfx.lineTo(marginX + boardW, y);
        gfx.stroke();
      }
      for(let c=0; c<=cols; c++){
        const x = marginX + c * cellW;
        gfx.beginPath();
        gfx.moveTo(x, marginY);
        gfx.lineTo(x, marginY + boardH);
        gfx.stroke();
      }

      // Project logical TD path into this board rectangle
      const scale = Math.min(boardW / LOGICAL_W, boardH / LOGICAL_H);
      const offsetX = marginX + (boardW - LOGICAL_W * scale) * 0.5;
      const offsetY = marginY + (boardH - LOGICAL_H * scale) * 0.5;

      if (this.pathSegments && this.pathSegments.length){
        gfx.strokeStyle = "rgba(56,189,248,0.7)";
        gfx.lineWidth = 3;
        gfx.beginPath();
        for (let i=0;i<TD_PATH.length;i++){
          const p = TD_PATH[i];
          const px = offsetX + p.x * scale;
          const py = offsetY + p.y * scale;
          if (i===0) gfx.moveTo(px, py);
          else gfx.lineTo(px, py);
        }
        gfx.stroke();
      }

      // Draw simple enemies as cyan circles moving along the path
      if (this.enemies && this.enemies.length){
        gfx.fillStyle = "rgba(56,189,248,0.95)";
        for (let i=0;i<this.enemies.length;i++){
          const e = this.enemies[i];
          const p = this.samplePath(e.dist);
          const px = offsetX + p.x * scale;
          const py = offsetY + p.y * scale;
          gfx.beginPath();
          gfx.arc(px, py, 8, 0, Math.PI*2);
          gfx.fill();
        }
      }

      gfx.restore();
    },

    // Optional pointer hooks for when we wire up interaction
    onPointerDown(x, y){
      console.log("[TowerDefense] pointerDown at", x, y);
    },
    onPointerMove(x, y){},
    onPointerUp(x, y){}
  };

  AVDEF.GameModes.towerdef = td;
  console.log("[TowerDefense] core registered");
})(window);