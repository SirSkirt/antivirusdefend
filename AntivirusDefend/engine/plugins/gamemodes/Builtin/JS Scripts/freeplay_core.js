// Freeplay game mode plugin
// This file defines the Freeplay gamemode as a plugin so the core engine
// can treat it the same way as Tower Defense and any future modes.

(function(global){
  const AVDEF = global.AVDEF || (global.AVDEF = {});
  AVDEF.GameModes = AVDEF.GameModes || {};

  const Freeplay = {
    // Unique ID used by menus and the plugin loader
    id: "freeplay",

    // Human-readable name
    label: "Freeplay",

    // Short description for menus / manifests
    description: "Endless survival mode with ramsticks, waves, and upgrades.",

    // Layout hint for the renderer: this mode uses the full game canvas.
    canvasLayout: "Windows",

    // Internal state owned by the plugin (can be expanded later when
    // Freeplay gameplay is fully extracted from engine.js).
    _initialized: false,
    _running: false,
    _ctx: null,

    // Called once when the engine wants this mode to prepare.
    onInit(ctx){
      this._ctx = ctx || this._ctx || null;
      this._initialized = true;
    },

    // Called when a new run of this mode starts.
    onStartRun(){
      this._running = true;

      if (typeof console !== "undefined") {
        console.log("[Freeplay] onStartRun()");
      }
    },

    // Called every frame while this mode is active and gameState === "minigame".
    onUpdate(dt){
      if (!this._running) return;

      // For now, delegate to the legacy Defender / Freeplay loop via AVDEF.Freeplay,
      // so the plugin owns the control flow but the actual logic still lives in engine.js.
      if (global.AVDEF && AVDEF.Freeplay && typeof AVDEF.Freeplay.update === "function") {
        try { AVDEF.Freeplay.update(dt); } catch (e) {
          if (typeof console !== "undefined") {
            console.error("[Freeplay] update error", e);
          }
        }
      }
    },

    // Optional render hook for plugin-specific drawing.
    // The renderer will pass a small context object with canvas / ctx info.
    onRender(ctxObj){
      // Delegate rendering to the legacy Freeplay draw() via AVDEF.Freeplay.draw,
      // so control flow is owned by the plugin while the pixels still come from engine.js.
      if (global.AVDEF && AVDEF.Freeplay && typeof AVDEF.Freeplay.draw === "function") {
        try { AVDEF.Freeplay.draw(ctxObj); } catch (e) {
          if (typeof console !== "undefined") {
            console.error("[Freeplay] render error", e);
          }
        }
      }
    }
  };

  AVDEF.GameModes.freeplay = Freeplay;
})(typeof window !== "undefined" ? window : globalThis);
