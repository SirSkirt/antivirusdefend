
// Antivirus Defend – input.js
// Handles ALL low-level input (keyboard, mouse, touch joystick) and exposes a clean state
// for the engine to read. No game logic lives here – just "what is the player trying to do?".

(function(global){
  "use strict";

  const AVDEF = global.AVDEF = global.AVDEF || {};

  // Public snapshot of current input intent
  const state = {
    // Movement intent (-1..1)
    moveX: 0,
    moveY: 0,

    // Fire primary attack?
    firePrimary: false,

    // Has any pointer position we can aim at?
    hasPointer: false,
    pointerWorldX: 0,
    pointerWorldY: 0,

    // Internal: last raw pointer (screen) pos in case engine wants it
    pointerScreenX: 0,
    pointerScreenY: 0,

    // Whether virtual joystick is currently active
    usingJoystick: false,
  };

  // Callbacks into the engine – these are provided at init time.
  let onPauseToggle = null;
  let onHeroAbility = null;
  let screenToWorld = null;
  let canvas = null;

  // Internal keyboard state (by lowercased key string: 'w','arrowup', etc.)
  const keys = Object.create(null);

  // Virtual joystick DOM and state
  let joyWrap = null;
  let joyKnob = null;
  let joyActive = false;
  const joyCenter = { x: 0, y: 0 };
  const joyVector = { x: 0, y: 0 };

  function init(options){
    options = options || {};
    canvas = options.canvas || global.document && document.getElementById("gameCanvas");
    screenToWorld = options.screenToWorld || null;
    onPauseToggle = typeof options.onPauseToggle === "function" ? options.onPauseToggle : null;
    onHeroAbility = typeof options.onHeroAbility === "function" ? options.onHeroAbility : null;

    if(!canvas){
      console.warn("[Input] No canvas provided; input will be very limited.");
    }

    // Keyboard
    global.addEventListener("keydown", handleKeyDown);
    global.addEventListener("keyup", handleKeyUp);

    // Mouse
    if(canvas){
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mousedown", handleMouseDown);
      global.addEventListener("mouseup", handleMouseUp);
    }

    // Virtual joystick (for touch / gamepad-style movement)
    joyWrap = document.getElementById("joystick") || null;
    joyKnob = document.getElementById("joyKnob") || null;
    if(joyWrap && joyKnob && global.PointerEvent){
      joyWrap.addEventListener("pointerdown", joyPointerDown);
      global.addEventListener("pointermove", joyPointerMove);
      global.addEventListener("pointerup", joyPointerUp);
      global.addEventListener("pointercancel", joyPointerUp);
    }

    console.log("[Input] input.js initialized");
  }

  // --- Keyboard handlers ---------------------------------------------------

  function handleKeyDown(e){
    const k = (e.key || "").toLowerCase();
    keys[k] = true;

    // Pause toggle – Escape or P
    if(k === "escape" || k === "p"){
      if(onPauseToggle){
        e.preventDefault();
        onPauseToggle();
      }
    }

    // Hero special ability – Space
    if(k === " " || k === "spacebar"){
      if(onHeroAbility){
        e.preventDefault();
        onHeroAbility();
      }
    }

    // Primary fire – keep simple: space or enter can also be mapped
    if(k === " " || k === "spacebar" || k === "enter"){
      state.firePrimary = true;
    }
  }

  function handleKeyUp(e){
    const k = (e.key || "").toLowerCase();
    keys[k] = false;

    if(k === " " || k === "spacebar" || k === "enter"){
      state.firePrimary = false;
    }
  }

  // --- Mouse handlers ------------------------------------------------------

  function handleMouseMove(e){
    state.pointerScreenX = e.clientX;
    state.pointerScreenY = e.clientY;
    if(typeof screenToWorld === "function"){
      const w = screenToWorld(e.clientX, e.clientY);
      state.pointerWorldX = w.x;
      state.pointerWorldY = w.y;
      state.hasPointer = true;
    }
  }

  function handleMouseDown(e){
    if(e.button === 0){
      state.firePrimary = true;
    }
  }

  function handleMouseUp(e){
    if(e.button === 0){
      state.firePrimary = false;
    }
  }

  // --- Virtual joystick for touch -----------------------------------------

  function joyPointerDown(e){
    if(!joyWrap || !joyKnob) return;
    e.preventDefault();
    joyActive = true;
    const rect = joyWrap.getBoundingClientRect();
    joyCenter.x = rect.left + rect.width / 2;
    joyCenter.y = rect.top + rect.height / 2;
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
    state.usingJoystick = false;
    joyKnob.style.transform = "translate(-50%,-50%)";
  }

  function getPointFromEvent(e){
    if(e.touches && e.touches.length > 0){
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if(e.changedTouches && e.changedTouches.length > 0){
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function updateJoy(e){
    const pt = getPointFromEvent(e);
    const dx = pt.x - joyCenter.x;
    const dy = pt.y - joyCenter.y;
    const maxR = 50;
    const dist = Math.hypot(dx, dy) || 1;
    let ux = dx;
    let uy = dy;
    if(dist > maxR){
      ux = dx / dist * maxR;
      uy = dy / dist * maxR;
    }
    joyVector.x = (dist > 8) ? ux / maxR : 0;
    joyVector.y = (dist > 8) ? uy / maxR : 0;
    state.usingJoystick = Math.abs(joyVector.x) > 0.01 || Math.abs(joyVector.y) > 0.01;

    joyKnob.style.transform =
      "translate(calc(-50% + " + ux + "px), calc(-50% + " + uy + "px))";
  }

  // --- Public API ----------------------------------------------------------

  function computeState(){
    // Reset intent
    let mx = 0;
    let my = 0;

    // Virtual joystick wins if active
    if(state.usingJoystick){
      mx = joyVector.x;
      my = joyVector.y;
    }else{
      if(keys["w"] || keys["arrowup"]) my -= 1;
      if(keys["s"] || keys["arrowdown"]) my += 1;
      if(keys["a"] || keys["arrowleft"]) mx -= 1;
      if(keys["d"] || keys["arrowright"]) mx += 1;
    }

    const len = Math.hypot(mx, my);
    if(len > 0.0001){
      state.moveX = mx / len;
      state.moveY = my / len;
    }else{
      state.moveX = 0;
      state.moveY = 0;
    }
  }

  function getState(){
    // Recompute each time engine asks, so keys / joystick are up to date
    computeState();
    // Return a shallow copy so engine doesn't accidentally mutate internal state
    return {
      moveX: state.moveX,
      moveY: state.moveY,
      firePrimary: state.firePrimary,
      hasPointer: state.hasPointer,
      pointerWorldX: state.pointerWorldX,
      pointerWorldY: state.pointerWorldY,
      pointerScreenX: state.pointerScreenX,
      pointerScreenY: state.pointerScreenY,
      usingJoystick: state.usingJoystick,
    };
  }

  AVDEF.Input = {
    init,
    getState,
  };

})(window);
