// Upgrades module.
// Provides base upgrades and hero-specific upgrades.
// Engine calls: AVDEF.Upgrades.getPool(currentHeroId, player)

window.AVDEF = window.AVDEF || {};

AVDEF.Upgrades = (function () {
  // ----- Base upgrades (available to all heroes) -----
  const BASE_UPGRADES_DEF = [
    {
      id: 'fireRate',
      name: 'Software Update',
      desc: 'Increases attack speed by 15%.',
      apply(player) {
        player.fireDelayMult *= 0.85; // faster firing
      }
    },
    {
      id: 'damage',
      name: 'Virus Definitions Update',
      desc: 'Increases damage by 20%.',
      apply(player) {
        player.damageMult *= 1.2;
      }
    },
    {
      id: 'maxHP',
      name: 'System Restore Point',
      desc: 'Max HP +20 and heal 20.',
      apply(player) {
        player.maxHp += 20;
        player.hp = Math.min(player.hp + 20, player.maxHp);
      }
    },
    {
      id: 'speed',
      name: 'CPU Optimization',
      desc: 'Movement speed increased by 10%.',
      apply(player) {
        player.speed *= 1.1;
      }
    },
    {
      id: 'magnet',
      name: 'Disk Defrag',
      desc: 'Increases XP pickup radius.',
      apply(player) {
        player.chipMagnetRadius += 20;
      }
    }
  ];

  function createBaseUpgrades(player) {
    // Wrap definitions so apply() doesn’t need arguments later
    return BASE_UPGRADES_DEF.map(def => ({
      id: def.id,
      name: def.name,
      desc: def.desc,
      apply() {
        def.apply(player);
      }
    }));
  }

  // ----- Hero-specific upgrades -----

  function heroSpecificUpgrades(heroId, player) {
    const list = [];

    // Windows Defender
    if (heroId === 'defender') {
      list.push({
        id: 'wd_shield',
        name: 'Defender Shield Upgrade',
        desc: 'Shield toss hits harder and slightly faster.',
        apply() {
          player.shieldLevel++;
          player.damageMult *= 1.10;
          player.fireDelayMult *= 0.95;
        }
      });
      list.push({
        id: 'wd_barrier',
        name: 'Real-time Protection',
        desc: 'Slight damage reduction from hits.',
        apply() {
          // Implement as a soft buff: extra max HP and heal
          player.maxHp += 10;
          player.hp = Math.min(player.hp + 10, player.maxHp);
        }
      });
    }

    // AVG
    if (heroId === 'avg') {
      list.push({
        id: 'avg_slow',
        name: 'Sticky Antibodies',
        desc: 'Shots slow enemies for longer.',
        apply() {
          player.slowLevel++;
        }
      });
      list.push({
        id: 'avg_confuse',
        name: 'Confusing Payload',
        desc: 'Occasionally confuses enemies hit.',
        apply() {
          player.confuseLevel++;
        }
      });
    }

    // Avast
    if (heroId === 'avast') {
      list.push({
        id: 'avast_aoe_unlock',
        name: player.aoeModePaid
          ? 'Pulse Tuning'
          : 'Upgrade to Paid Version',
        desc: player.aoeModePaid
          ? 'Stronger pulses and larger knockback radius.'
          : 'Unlock powerful knockback pulses and move faster.',
        apply() {
          if (!player.aoeModePaid) {
            player.aoeModePaid = true;
            player.aoeLevel++;
            player.speed += 25;
          } else {
            player.aoeLevel++;
          }
        }
      });
      list.push({
        id: 'avast_radius',
        name: 'Pulse Amplifier',
        desc: 'Increases AOE radius.',
        apply() {
          player.aoeRadius += 20;
        }
      });
    }

    // Norton
    if (heroId === 'norton') {
      list.push({
        id: 'norton_beam',
        name: 'Laser Calibration',
        desc: 'Increases beam power and duration.',
        apply() {
          player.beamLevel++;
        }
      });
      list.push({
        id: 'norton_shield',
        name: 'Firewall Shield',
        desc: 'Occasional automatic protective shield.',
        apply() {
          // Represented in engine via nortonShieldStage/duration
          // Here we just give more "budget" via max HP/regen feel.
          player.maxHp += 10;
          player.hp = Math.min(player.hp + 15, player.maxHp);
        }
      });
    }

    // McAfee
    if (heroId === 'mcafee') {
      list.push({
        id: 'mcafee_tag',
        name: 'Threat Tagging',
        desc: 'Tagged enemies take extra damage from all hits.',
        apply() {
          player.antivirusTag = 'mcafee';
          player.damageMult *= 1.05;
        }
      });
      list.push({
        id: 'mcafee_profit',
        name: 'Monetized Protection',
        desc: 'Slightly increases XP gain per enemy.',
        apply() {
          // Represent simple bonus as more pickup radius and a bit of damage
          player.chipMagnetRadius += 10;
          player.damageMult *= 1.05;
        }
      });
    }

    // 360 Total Security
    if (heroId === 'total') {
      list.push({
        id: 'total_phase',
        name: 'Phase Shift Upgrade',
        desc: 'Longer phase shift invulnerability.',
        apply() {
          player.phaseShiftLevel++;
          player.phaseShiftDuration += 0.1;
        }
      });
      list.push({
        id: 'total_cooldown',
        name: 'Quantum Cooldown',
        desc: 'Phase shift cooldown reduced.',
        apply() {
          player.phaseShiftCooldown = Math.max(4, player.phaseShiftCooldown - 1);
        }
      });
    }

    return list;
  }

  // ----- Public API -----

  function getPool(heroId, player) {
    const base = createBaseUpgrades(player);
    const heroUp = heroSpecificUpgrades(heroId, player);
    return base.concat(heroUp);
  }

  return {
    getPool
  };
})();
