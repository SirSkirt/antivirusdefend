// input.js
(function(){
  window.AVDEF = window.AVDEF || {};

  const canvas = document.getElementById('gameCanvas');
  const touchJoystickBase = document.getElementById('touchJoystickBase');
  const touchJoystickStick = document.getElementById('touchJoystickStick');

  // Keyboard state
  const keys = {
    ArrowUp:false,
    ArrowDown:false,
    ArrowLeft:false,
    ArrowRight:false,
    KeyW:false,
    KeyA:false,
    KeyS:false,
    KeyD:false,
    Space:false,
    KeyP:false,
    Escape:false
  };

  // Pointer + firing state
  let pointerX = null;
  let pointerY = null;
  let mouseDown = false;

  // Touch joystick state
  let joystickActive = false;
  let joystickTouchId = null;
  let joystickCenter = { x:0, y:0 };
  let joystickVec = { x:0, y:0 };

  // Gamepad state
  let usingGamepad = false;
  let gamepadIndex = 0;

  function screenToCanvas(x,y){
    if(!canvas) return { x:0, y:0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (x - rect.left) * (canvas.width/rect.width),
      y: (y - rect.top) * (canvas.height/rect.height)
    };
  }

  // --- Keyboard handlers ---

  function onKeyDown(e){
    if(e.repeat) return;
    if(e.code in keys){
      keys[e.code] = true;
    }
  }

  function onKeyUp(e){
    if(e.code in keys){
      keys[e.code] = false;
    }
  }

  // --- Mouse handlers ---

  function onMouseMove(e){
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) * (canvas.width/rect.width);
    pointerY = (e.clientY - rect.top) * (canvas.height/rect.height);
  }

  function onMouseDown(e){
    if(e.button === 0){
      mouseDown = true;
    }
  }

  function onMouseUp(e){
    if(e.button === 0){
      mouseDown = false;
    }
  }

  // --- Touch handlers ---

  function onTouchStart(e){
    if(!canvas) return;
    e.preventDefault();
    for(const touch of e.changedTouches){
      const pos = screenToCanvas(touch.clientX,touch.clientY);
      // Left side = movement joystick
      if(pos.x < canvas.width*0.4){
        if(!joystickActive && touchJoystickBase && touchJoystickStick){
          joystickActive = true;
          joystickTouchId = touch.identifier;
          joystickCenter = { x:pos.x, y:pos.y };
          joystickVec = { x:0, y:0 };
          touchJoystickBase.style.left = `${pos.x-40}px`;
          touchJoystickBase.style.top = `${pos.y-40}px`;
          touchJoystickBase.classList.add('visible');
          touchJoystickStick.style.left = `${pos.x-20}px`;
          touchJoystickStick.style.top = `${pos.y-20}px`;
        }
      }else{
        // Right side = firing
        mouseDown = true;
        pointerX = pos.x;
        pointerY = pos.y;
      }
    }
  }

  function onTouchMove(e){
    if(!canvas) return;
    e.preventDefault();
    for(const touch of e.changedTouches){
      const pos = screenToCanvas(touch.clientX,touch.clientY);
      if(joystickActive && touch.identifier === joystickTouchId && touchJoystickBase && touchJoystickStick){
        const dx = pos.x - joystickCenter.x;
        const dy = pos.y - joystickCenter.y;
        const dist = Math.hypot(dx,dy);
        const maxDist = 36;
        let vx = dx;
        let vy = dy;
        if(dist > maxDist){
          const k = maxDist/(dist||1);
          vx *= k;
          vy *= k;
        }
        touchJoystickStick.style.left = `${joystickCenter.x + vx - 20}px`;
        touchJoystickStick.style.top = `${joystickCenter.y + vy - 20}px`;
        joystickVec = {
          x: dx/(dist||1),
          y: dy/(dist||1)
        };
      }else{
        // Touch on right side: update pointer (for aiming feel)
        pointerX = pos.x;
        pointerY = pos.y;
      }
    }
  }

  function onTouchEnd(e){
    if(!canvas) return;
    e.preventDefault();
    for(const touch of e.changedTouches){
      const pos = screenToCanvas(touch.clientX,touch.clientY);
      if(joystickActive && touch.identifier === joystickTouchId && touchJoystickBase && touchJoystickStick){
        joystickActive = false;
        joystickTouchId = null;
        joystickVec = { x:0, y:0 };
        touchJoystickBase.classList.remove('visible');
      }else{
        // End firing touch
        mouseDown = false;
      }
    }
  }

  // --- Gamepad helpers ---

  window.addEventListener('gamepadconnected', (e)=>{
    gamepadIndex = e.gamepad.index;
    usingGamepad = true;
  });

  function sampleGamepad(){
    const result = {
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      firing: false,
      pause: false,
      ability: false
    };

    if(!navigator.getGamepads) return result;
    const pads = navigator.getGamepads();
    const gp = pads[gamepadIndex];
    if(!gp) return result;

    const dead = 0.2;
    const ax = gp.axes[0] || 0;
    const ay = gp.axes[1] || 0;
    if(Math.abs(ax) > dead || Math.abs(ay) > dead){
      result.moveX = ax;
      result.moveY = ay;
    }

    const dead2 = 0.25;
    const ax2 = gp.axes[2] || 0;
    const ay2 = gp.axes[3] || 0;
    if(Math.abs(ax2) > dead2 || Math.abs(ay2) > dead2){
      result.aimX = ax2;
      result.aimY = ay2;
    }

    // Right trigger = fire
    if(gp.buttons[7] && gp.buttons[7].pressed){
      result.firing = true;
    }
    // Start = pause
    if(gp.buttons[9] && gp.buttons[9].pressed){
      result.pause = true;
    }
    // A = ability
    if(gp.buttons[0] && gp.buttons[0].pressed){
      result.ability = true;
    }

    return result;
  }

  // --- Public input state API ---

  AVDEF.Input = {
    getState(){
      // Keyboard movement
      let mx = 0;
      let my = 0;
      if(keys.KeyW || keys.ArrowUp) my -= 1;
      if(keys.KeyS || keys.ArrowDown) my += 1;
      if(keys.KeyA || keys.ArrowLeft) mx -= 1;
      if(keys.KeyD || keys.ArrowRight) mx += 1;

      // Touch joystick movement
      if(joystickActive){
        mx += joystickVec.x;
        my += joystickVec.y;
      }

      // Gamepad
      const gp = sampleGamepad();
      mx += gp.moveX;
      my += gp.moveY;

      // Normalise if needed (engine also normalises, but this keeps it tidy)
      const len = Math.hypot(mx,my);
      if(len > 1){
        mx /= len;
        my /= len;
      }

      const firing = mouseDown || gp.firing;
      const pausePressed = keys.KeyP || keys.Escape || gp.pause;
      const abilityPressed = keys.Space || gp.ability;

      return {
        moveX: mx,
        moveY: my,
        pointerX,
        pointerY,
        firing,
        pausePressed,
        abilityPressed,
        aimStickX: gp.aimX,
        aimStickY: gp.aimY
      };
    }
  };

  // --- Attach listeners ---

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  if(canvas){
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive:false });
    canvas.addEventListener('touchmove', onTouchMove, { passive:false });
    canvas.addEventListener('touchend', onTouchEnd, { passive:false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive:false });
  }
})();
