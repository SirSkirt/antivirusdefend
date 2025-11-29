// AntivirusDefend/engine/plugins/gamemodes/TowerDefense/towerdef_core.js
// Minimal Tower Defense core stub wired into Defender Engine plugin system.
// This does NOT implement full gameplay yet; it just proves the mode plumbing works.

(function(global){
  const AVDEF = global.AVDEF || (global.AVDEF = {});
  AVDEF.GameModes = AVDEF.GameModes || {};

  if (AVDEF.GameModes.towerdef) {
    // Don't re-register if already present
    return;
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

      this.time = 0;
      this.wave = 1;
      this.running = false;
    },

    // Called when a new run starts (after hero + stage selection)
    onStartRun(){
      this.time = 0;
      this.wave = 1;
      this.running = true;

      if (this.engineCtx && this.engineCtx.ui && this.engineCtx.ui.setWave) {
        this.engineCtx.ui.setWave(this.wave);
      }

      console.log("[TowerDefense] onStartRun()");
    },

    // Per-frame update from engine loop
    onUpdate(dt){
      if (!this.running) return;
      this.time += dt;

      // Simple heartbeat: increment a fake wave every 10 seconds
      if (this.time > 10){
        this.time = 0;
        this.wave++;
        if (this.engineCtx && this.engineCtx.ui && this.engineCtx.ui.setWave) {
          this.engineCtx.ui.setWave(this.wave);
        }
      }
    },

    // Called by render loop AFTER the base world has rendered
    onRender(ctx){
      if (!this.canvas) return;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.save();

      // Draw a subtle grid board in the center as placeholder
      const cols = 6;
      const rows = 4;
      const marginX = w * 0.12;
      const marginY = h * 0.18;
      const boardW = w * 0.76;
      const boardH = h * 0.64;
      const cellW = boardW / cols;
      const cellH = boardH / rows;

      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 2;

      for(let r=0; r<=rows; r++){
        const y = marginY + r * cellH;
        ctx.beginPath();
        ctx.moveTo(marginX, y);
        ctx.lineTo(marginX + boardW, y);
        ctx.stroke();
      }
      for(let c=0; c<=cols; c++){
        const x = marginX + c * cellW;
        ctx.beginPath();
        ctx.moveTo(x, marginY);
        ctx.lineTo(x, marginY + boardH);
        ctx.stroke();
      }

      ctx.restore();
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
