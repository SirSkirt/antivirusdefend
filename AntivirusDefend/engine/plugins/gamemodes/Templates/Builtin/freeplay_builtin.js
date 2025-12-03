// Freeplay game mode plugin
// All Freeplay-specific configuration can live here so the core engine
// just executes generic hooks.

(function(){
  window.AVDEF = window.AVDEF || {};
  AVDEF.GameModes = AVDEF.GameModes || {};

  const Freeplay = {
    id: 'freeplay',
    label: 'Freeplay',
    description: 'Endless survival mode with ramsticks, waves, and upgrades.',

    // Called once when the engine wants this mode to prepare any static data.
    init: function initFreeplay(){
      // For now, most rules still live in engine.js.
      // As we refactor, wave tables, enemy mixes, and hero rules
      // can be moved into this object.
    },

    // Called whenever a new run starts in this mode.
    onStartRun: function onStartRun(){
      // Placeholder hook: the engine already resets state internally.
      // Later we can move Freeplay-specific counters or modifiers here.
      if(window.AVDEF && AVDEF.Debug && AVDEF.Debug.log){
        AVDEF.Debug.log('[Freeplay] onStartRun()', 'info');
      }
    },

    // Called every frame while the engine is updating gameplay.
    onUpdate: function onUpdate(dt){
      // For now this mode just piggybacks on the engine's built-in rules.
      // You can add extra timers, dynamic difficulty, or special events here.
    }
  };

  AVDEF.GameModes.freeplay = Freeplay;
})();
