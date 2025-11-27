// Hero definitions module placeholder.
// Move HEROES data and hero-related helpers here.
// ===== HEROES MODULE =====
// Exports hero stats and simple helper functions.

window.AVDEF = window.AVDEF || {};

AVDEF.Heroes = (() => {

  const HEROES = {
    defender:{
      id:'defender',
      name:'Windows Defender',
      role:'Balanced Shield Toss',
      desc:'Young and eager, ready to save Windows with shield tosses.',
      speed:230,
      baseDamage:12,
      fireDelay:0.7,
      initial:'WD',
      color:'#1d4ed8',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Windows-defender.svg/240px-Windows-defender.svg.png"
    },

    avg:{
      id:'avg',
      name:'AVG',
      role:'Slow + Confuse',
      desc:'Slows and confuses enemies while maintaining steady fire rate.',
      speed:210,
      baseDamage:10,
      fireDelay:0.75,
      initial:'A',
      color:'#f97316',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/AVG_Similar_Icon.svg/960px-AVG_Similar_Icon.svg.png?20200830015222"
    },

    avast:{
      id:'avast',
      name:'Avast',
      role:'AOE & scanning',
      desc:'Free Trial with scans and knockback pulses. Paid upgrades get wild.',
      speed:220,
      baseDamage:11,
      fireDelay:0.65,
      initial:'AV',
      color:'#f97316',
      logoUrl:"https://upload.wikimedia.org/wikipedia/commons/4/4e/Avast_Software_white_logo.png?20190728134047"
    },

    norton:{
      id:'norton',
      name:'Norton',
      role:'Beam & emergency shield',
      desc:'Shoots piercing beams and can deploy an emergency shield.',
      speed:215,
      baseDamage:13,
      fireDelay:0.85,
      initial:'N',
      color:'#fbbf24',
      logoUrl:"https://cdn.brandfetch.io/idooDSluCu/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },

    total:{
      id:'total',
      name:'360 Total Security',
      role:'Orbit Shields',
      desc:'Summons orbiting shields to bodyguard your CPU.',
      speed:225,
      baseDamage:10,
      fireDelay:0.75,
      initial:'TS',
      color:'#22c55e',
      logoUrl:"https://packagestore.com/wp-content/uploads/2023/07/0D56757242667073F5E9610001F2E43A.png"
    }
  };

  return {
    getAll: () => Object.values(HEROES),
    get: (id) => HEROES[id] || HEROES.defender
  };

})();

