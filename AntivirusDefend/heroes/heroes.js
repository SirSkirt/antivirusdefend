// ===== HEROES MODULE =====
// Hero definitions module.
// Extracted from engine.js

window.AVDEF = window.AVDEF || {};

AVDEF.Heroes = (function() {
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
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['defender']) || "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Windows-defender.svg/240px-Windows-defender.svg.png"
    },
    avg:{
      id:'avg',
      name:'AVG',
      role:'Slow but strong',
      desc:'Older antivirus. Slower, harder-hitting shots that debuff threats.',
      speed:200,
      baseDamage:16,
      fireDelay:0.8,
      initial:'A',
      color:'#f97316',
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['avg']) || "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/AVG_Similar_Icon.svg/960px-AVG_Similar_Icon.svg.png?20200830015222"
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
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['avast']) || "https://upload.wikimedia.org/wikipedia/commons/4/4e/Avast_Software_white_logo.png?20190728134047"
    },
    norton:{
      id:'norton',
      name:'Norton',
      role:'Beam DPS & shields',
      desc:'Grandfather AV. Rolling turret with beam combos and emergency shields.',
      speed:195,
      baseDamage:18,
      fireDelay:0.85,
      initial:'N',
      color:'#facc15',
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['norton']) || "https://cdn.brandfetch.io/idooDSluCu/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"
    },
    mcafee:{
      id:'mcafee',
      name:'McAfee',
      role:'Tag Team',
      desc:'Best when paired with Defender. Can call in a Defender ally.',
      speed:215,
      baseDamage:14,
      fireDelay:0.7,
      initial:'M',
      color:'#b91c1c',
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['mcafee']) || "https://companieslogo.com/img/orig/MCFE-d6ec69dd.png?t=1720244492"
    },
    q360:{
      id:'q360',
      name:'360 Total Security',
      role:'Agile',
      desc:'Fast, rounded stats for aggressive play.',
      speed:245,
      baseDamage:11,
      fireDelay:0.6,
      initial:'360',
      color:'#16a34a',
            logoUrl:(window.AVDEF && AVDEF.Textures && AVDEF.Textures.heroLogos['q360']) || "https://packagestore.com/wp-content/uploads/2023/07/0D56757242667073F5E9610001F2E43A.png"
    }
  };

  return {
    getAll: () => Object.values(HEROES),
    get: (id) => HEROES[id] || HEROES.defender
  };
})();

