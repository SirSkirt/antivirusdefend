// ===== ENEMIES MODULE =====
// Enemy definitions module.
// Extracted type-specific logic from engine.js

window.AVDEF = window.AVDEF || {};

AVDEF.Enemies = (function(){
  function getStats(type, wave){
    // Defaults match the base enemy object from engine.js
    let speed = 60;
    let hp = 1;
    let xpValue = 6;
    let disguised = false;

    if(type === 'adware'){
      speed = 75;
      hp = 20 + wave*3;
      xpValue = 7;
    }else if(type === 'spyware'){
      speed = 70;
      hp = 25 + wave*4;
      xpValue = 8;
    }else if(type === 'virus'){
      speed = 80;
      hp = 35 + wave*5;
      disguised = true;
      xpValue = 10;
    }else if(type === 'ransomware'){
      speed = 60;
      hp = 80 + wave*10;
      xpValue = 18;
    }

    return { speed, hp, xpValue, disguised };
  }

  return {
    getStats
  };
})();
