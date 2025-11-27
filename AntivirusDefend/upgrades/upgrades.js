// Upgrades module.
// Extracted BASE_UPGRADES and heroSpecificUpgrades from engine.js

window.AVDEF = window.AVDEF || {};

AVDEF.Upgrades = (function(){
  const BASE_UPGRADES_DEF = [
    {
      id:'fireRate',
      name:'Software Update',
      desc:'Increases attack speed by 15%.',
      apply(player){
        player.fireDelayMult *= 0.85;
      }
    },
    {
      id:'damage',
      name:'Virus Definitions Update',
      desc:'Increases damage by 20%.',
      apply(player){
        player.damageMult *= 1.20;
      }
    },
    {
      id:'defenderOrbit',
      name:'Defender Shield',
      desc:'Adds or strengthens orbiting Defender shields.',
      apply(player){
        player.orbitLevel++;
        if(!player.abilities.includes('orbit')){
          player.abilities.push('orbit');
        }
      }
    }
  ];

  function createBaseUpgrades(player){
    return BASE_UPGRADES_DEF.map(def => {
      return {
        id: def.id,
        name: def.name,
        desc: def.desc,
        apply(){
          def.apply(player);
        }
      };
    });
  }

  function heroSpecificUpgrades(heroId, player){
    const list = [];
    if(heroId === 'defender'){
      list.push({
        id:'wd_shield',
        name:'Shield Toss Upgrade',
        desc:'Your Defender shield toss hits harder and slightly faster.',
        apply(){
          player.shieldLevel++;
          player.damageMult *= 1.10;
          player.fireDelayMult *= 0.95;
        }
      });
    }else if(heroId === 'avg'){
      list.push({
        id:'avg_slow',
        name:'Digital Antibodies',
        desc:'Antibody shots slow and confuse enemies for longer.',
        apply(){
          player.slowLevel++;
        }
      });
    }else if(heroId === 'avast'){
      list.push({
        id:'avast_aoe',
        name: player.aoeModePaid ? 'Paid Subscription Boost' : 'Upgrade to Paid Version',
        desc: player.aoeModePaid
          ? 'Stronger knockback pulses and more chaos between enemies.'
          : 'Unlock the paid version: stronger pulses, faster speed, and chaos.',
        apply(){
          if(!player.aoeModePaid){
            player.aoeModePaid = true;
            player.aoeLevel++;
            player.speed += 25;
          }else{
            player.aoeLevel++;
          }
        }
      });
    }else if(heroId === 'norton'){
      list.push({
        id:'norton_beam',
        name:'Beam Optimisation',
        desc:'Beam combos hit harder and ramp damage faster.',
        apply(){
          player.beamLevel++;
        }
      });
    }else if(heroId === 'mcafee'){
      list.push({
        id:'mcafee_tag',
        name:'Tag Team Training',
        desc:'Defender ally lasts longer and hits harder.',
        apply(){
          player.tagLevel++;
        }
      });
    }
    return list;
  

  function getPool(heroId, player){
    return createBaseUpgrades(player).concat(heroSpecificUpgrades(heroId, player));
  }

  return {
    getPool
  };
})();
