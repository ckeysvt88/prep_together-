/* Timing, seasonal actions and portable power planning. */
(function (root) {
  const HORIZONS = {
    now: { label: 'Immediate prep', detail: 'Prioritize what you can do today with supplies, alerts, safe shelter and backup power.' },
    long: { label: 'Long-term prep', detail: 'Build in stages. Handle essentials first, then test, expand and maintain your setup.' }
  };
  const SEASONS = {
    spring: { label: 'Spring', title: 'Review spring storms and flooding', detail: 'Test weather alerts and review the safest room and routes around flooded roads. Check the local spring hazards that apply to your home.' },
    summer: { label: 'Summer', title: 'Plan for heat and summer outages', detail: 'Choose a cooled destination and transportation. Check water, pets, and battery operating temperatures. Review storm, wildfire or hurricane preparations where relevant.' },
    fall: { label: 'Fall', title: 'Rotate supplies and prepare for colder nights', detail: 'Rotate food and batteries, inspect weather gear, and test backup power. Keep storm or wildfire plans active where the local season continues.' },
    winter: { label: 'Winter', title: 'Prepare for cold, ice and shorter solar days', detail: 'Stage warm layers, blankets, a ride and a heated destination. Measure colder-weather loads and plan for shorter solar charging windows and blocked roads.' }
  };
  const LOAD_PRESETS = {
    reptile: [{ name: 'Reptile primary heater', watts: 80 }, { name: 'Reptile secondary heater', watts: 40 }],
    charging: [{ name: 'USB device / PlayStation Portal charging' }],
    fridge: [{ name: 'Refrigerator / freezer' }],
    connectivity: [{ name: 'Router / modem / communications' }],
    other: [{ name: '' }]
  };
  const STATUS = { open: 'To do', done: 'Done', skip: 'Not needed' };
  const has = (dictionary, key) => Object.hasOwn(dictionary, key);
  const number = (value, min, max, fallback) => {
    if (value === '' || value == null || !Number.isFinite(Number(value))) return fallback;
    return Math.min(max, Math.max(min, Number(value)));
  };
  function normalizeProfile(input) {
    return {
      horizon: has(HORIZONS, input.horizon) ? input.horizon : 'now',
      seasons: Array.isArray(input.seasons) ? Object.keys(SEASONS).filter(key => input.seasons.includes(key)) : [],
      notNeeded: Object.fromEntries(Object.entries(input.notNeeded ?? {}).filter(([key, value]) => /^[a-z0-9-]{1,80}$/.test(key) && value === true)),
      customPower: input.customPower === true,
      powerHours: number(input.powerHours, 1, 720, 24),
      powerLoads: Array.isArray(input.powerLoads) ? input.powerLoads.slice(0, 12).map(row => ({
        name: typeof row?.name === 'string' ? row.name.trim().slice(0, 80) : '',
        watts: number(row?.watts, 0, 25000, null),
        hours: number(row?.hours, 0, 24, null),
        measured: number(row?.measured, 0, 600000, null)
      })) : [],
      solarWatts: number(input.solarWatts, 0, 10000, 0),
      solarInput: number(input.solarInput, 0, 10000, 0),
      solarHours: number(input.solarHours, 0, 12, 0),
      solarYield: number(input.solarYield, 10, 100, 70)
    };
  }
  function activeSeasons(state) {
    return state.horizon === 'now' ? state.seasons : [];
  }
  function status(state, id) {
    if (state.notNeeded[id]) return 'skip';
    return state.checked[id] ? 'done' : 'open';
  }
  function phase(state, task) {
    if (task.cat === 'Seasonal') return 'Before the selected season';
    if (['rotate', 'backup', 'toilet', 'skills', 'resupply', 'service', 'network'].includes(task.id)) {
      return state.horizon === 'long' ? 'Build and maintain' : 'After the essentials';
    }
    if (task.cat === 'Practice') return 'Test and rehearse';
    return state.horizon === 'long' ? 'Start with the essentials' : 'Do first';
  }
  function orderTasks(state, tasks) {
    const groups = [
      state.horizon === 'long' ? 'Start with the essentials' : 'Do first',
      'Before the selected season',
      'Test and rehearse',
      state.horizon === 'long' ? 'Build and maintain' : 'After the essentials'
    ];
    const immediate = ['alerts', 'evacuate', 'medical', 'ride', 'power-reptile', 'power-devices', 'water', 'food'];
    return groups.flatMap(group => tasks.filter(task => phase(state, task) === group)
      .map(task => ({ ...task, phase: group, status: status(state, task.id) }))
      .sort((a, b) => {
        if (state.horizon !== 'now') return 0;
        const rank = task => immediate.includes(task.id) ? immediate.indexOf(task.id) : immediate.length;
        return rank(a) - rank(b);
      }));
  }
  function portablePower(state) {
    const rows = state.powerLoads.map(row => {
      let daily = row.measured;
      if (daily === null && row.watts !== null && row.hours !== null) daily = row.watts * row.hours;
      return { ...row, daily };
    });
    const missingEnergy = rows.filter(row => row.daily === null).length;
    const missingWatts = rows.filter(row => row.watts === null).length;
    const daily = rows.reduce((total, row) => total + (row.daily ?? 0), 0);
    const knownWatts = rows.reduce((total, row) => total + (row.watts ?? 0), 0);
    const usable = state.usable / 100;
    const complete = rows.length > 0 && missingEnergy === 0;
    const target = complete && daily > 0 ? Math.ceil(daily * state.powerHours / 24 / usable) : null;
    const runtime = complete && daily > 0 && state.capacityWh > 0 ? state.capacityWh * usable * 24 / daily : null;
    const solar = state.solarWatts > 0 && state.solarHours > 0
      ? Math.min(state.solarWatts, state.solarInput || state.solarWatts) * state.solarHours * state.solarYield / 100
      : null;
    return { rows, missingEnergy, missingWatts, daily, knownWatts, target, runtime, solar, complete };
  }
  const api = { HORIZONS, SEASONS, LOAD_PRESETS, STATUS, normalizeProfile, activeSeasons, status, orderTasks, portablePower };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyPlanning = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
