// Stage definitions module.
// Extracted STAGES data from engine.js

window.AVDEF = window.AVDEF || {};

AVDEF.Stages = (function () {
  const STAGES = [
    {
      id: 'computer',
      name: 'Computer',
      desc: 'Standard desktop case interior – the current battlefield.',
      difficulty: 'Normal',
      unlocked: true
    },
    {
      id: 'laptop',
      name: 'Laptop',
      desc: 'Compact thermal chaos.',
      difficulty: 'Locked',
      unlocked: false
    },
    {
      id: 'datacenter',
      name: 'Datacenter',
      desc: 'Racks, cables, and lag.',
      difficulty: 'Locked',
      unlocked: false
    },
    {
      id: 'smartphone',
      name: 'Smartphone',
      desc: 'Touchscreen territory.',
      difficulty: 'Locked',
      unlocked: false
    },
    {
      id: 'router',
      name: 'Router',
      desc: 'Packets, ports, and pings.',
      difficulty: 'Locked',
      unlocked: false
    },
    {
      id: 'bios',
      name: 'BIOS',
      desc: 'Low-level panic zone.',
      difficulty: 'Locked',
      unlocked: false
    }
  ];

  function list() {
    // Return a shallow copy so engine can’t accidentally mutate the source array
    return STAGES.slice();
  }

  function get(id) {
    return STAGES.find(s => s.id === id) || null;
  }

  return {
    list,
    get
  };
})();
