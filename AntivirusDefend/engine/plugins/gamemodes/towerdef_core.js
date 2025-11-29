// AntivirusDefend/engine/plugins/gamemodes/TowerDefense/towerdef_core.js
// Tower Defense game-mode core (no menus, no DOM UI)

window.AVDEF = window.AVDEF || {};
AVDEF.GameModes = AVDEF.GameModes || {};

(function registerTowerDefense() {
  const td = {
    id: "towerdef",
    title: "Tower Defense",
    description: "Prototype tower defense mode plugin (WIP).",

    // called once when engine boots or when plugin is first needed
    init(engineCtx) {
      // engineCtx is whatever the Defender Engine wants to pass in:
      // {
      //   canvas, ctx,
      //   width, height,
      //   input,
      //   ui: { setWave, setHP, setChips, showToast, ... }
      // }
      this.ctx = engineCtx.ctx;
      this.canvas = engineCtx.canvas;
      this.engineCtx = engineCtx;

      // ---- TD STATE GOES HERE ----
      this.resetState();
    },

    // called each time player starts this mode from Minigames menu
    start() {
      this.resetState();
      this.running = true;
    },

    // main update loop for this mode
    update(dt) {
      if (!this.running) return;

      // TODO: update towers, enemies, bullets, waves, chips, etc.
      // For now: very simple placeholder “heartbeat”
      this.time += dt;
      if (this.time > 1) {
        this.time = 0;
        // example of talking back to Defender Engine HUD:
        if (this.engineCtx?.ui?.setWave) {
          this.engineCtx.ui.setWave(this.wave);
        }
      }
    },

    // draw Tower Defense world inside the existing main canvas
    draw() {
      const ctx = this.ctx;
      if (!ctx) return;

      const w = this.canvas.width;
      const h = this.canvas.height;

      // clear playfield only; Defender Engine can draw background first
      ctx.save();

      // Example placeholder board: 5×3 grid in the center
      const cols = 5;
      const rows = 3;
      const marginX = w * 0.1;
      const marginY = h * 0.15;
      const boardW = w * 0.8;
      const boardH = h * 0.7;
      const cellW = boardW / cols;
      const cellH = boardH / rows;

      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 2;

      for (let r = 0; r <= rows; r++) {
        const y = marginY + r * cellH;
        ctx.beginPath();
        ctx.moveTo(marginX, y);
        ctx.lineTo(marginX + boardW, y);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        const x = marginX + c * cellW;
        ctx.beginPath();
        ctx.moveTo(x, marginY);
        ctx.lineTo(x, marginY + boardH);
        ctx.stroke();
      }

      ctx.restore();
    },

    // pointer / mouse events from Defender Engine (optional but handy)
    onPointerDown(x, y) {
      // x, y are in canvas coordinates
      // TODO: pick tile, start placing tower, etc.
    },
    onPointerMove(x, y) {
      // TODO: dragging ghost tower, highlight valid tiles
    },
    onPointerUp(x, y) {
      // TODO: drop tower, cancel placement
    },

    // internal helper
    resetState() {
      this.running = false;
      this.time = 0;
      this.wave = 1;

      // Here is where we’ll move all the TD stuff:
      // towers = [], enemies = [], bullets = []
      // path definition, tower / enemy type tables, etc.
    }
  };

  AVDEF.GameModes[td.id] = td;
})();
