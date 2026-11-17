(()=>{'use strict';
const E=ReadyEngine,P=ReadyPlanning,$=id=>document.getElementById(id),KEY='ready-together-v1';let state=E.normalize(),filter='all',storageOK=true;
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{const raw=localStorage.getItem(KEY);if(raw){const payload=JSON.parse(raw);if(payload.version===1&&payload.plan)state=E.normalize({...payload.plan,experience:payload.plan.experience||'advanced'});else throw Error('Unsupported stored plan');}}catch(e){storageOK=false;$('storage-status').textContent='Saved data could not be loaded. Export a backup before closing; you can import an earlier backup.';}
const numberKeys=['phones','simpleFoodDays','adults','children','infants','pets','petWater','adultKcal','childKcal','waterRate','storedWater','storedFood','weeklyBudget','dailyWh','powerHours','solarWatts','solarInput','solarHours','solarYield'];
const boolKeys=['well','medical','access','allergy','noCar','extraWater','customPower'];
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,plan:state}));storageOK=true;$('storage-status').textContent='Saved in this browser. Save an editable backup to move your plan to another browser.';}catch(e){storageOK=false;$('storage-status').textContent='Browser storage is unavailable. Export a backup to keep this plan.';}}
function presetValue(){if(state.adults===1&&!state.children&&!state.infants)return 'solo';if(state.adults===2&&!state.children&&!state.infants)return 'duo';if(state.adults===2&&state.children===2&&!state.infants)return 'family';return 'custom';}
$('region').innerHTML=Object.entries(E.REGIONS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
$('hazards').innerHTML=Object.entries(E.HAZARDS).map(([k,v])=>`<label class="chip"><input type="checkbox" data-hazard="${k}">${v.name}</label>`).join('');
$('seasons').innerHTML = Object.entries(P.SEASONS).map(([key, season]) =>
  `<label class="chip"><input type="checkbox" data-season="${key}">${season.label}</label>`
).join('');
function sync() {
  for (const key of [...numberKeys, 'capacityWh', 'usable']) $(key).value = state[key];
  for (const key of boolKeys) $(key).checked = state[key];
  for (const key of ['horizon', 'experience', 'commsGoal', 'region', 'place', 'housing', 'notes']) $(key).value = state[key];
  $('preset').value = presetValue();
  document.querySelectorAll('[data-hazard]').forEach(el => el.checked = state.hazards.includes(el.dataset.hazard));
  document.querySelectorAll('[data-season]').forEach(el => el.checked = state.seasons.includes(el.dataset.season));
  $('stationWh').value = state.capacityWh || '';
  $('stationUsable').value = state.usable;
  renderLoadRows();
}
function render() {
  const beginner = state.experience === 'beginner';
  document.body.dataset.experience = state.experience;
  const m = E.calculate(state);
  const tasks = P.orderTasks(state, E.tasks(state));
  const done = tasks.filter(task => task.status === 'done').length;
  const skipped = tasks.filter(task => task.status === 'skip').length;
  const applicable = tasks.length - skipped;
  $('horizon-help').textContent = P.HORIZONS[state.horizon].detail;
 $('season-options').hidden = state.horizon === 'long';
 $('experience-help').textContent=E.EXPERIENCES[state.experience].description;
 $('tiers').innerHTML=Object.entries(E.TIERS).map(([k,v],i)=>`<button class="tier" data-tier="${k}" aria-pressed="${state.tier===k}"><span class="number">0${i+1} / ${i===0?'START HERE':i===1?'BUILD CONFIDENCE':'BUILD RESILIENCE'}</span><strong>${v.name}</strong><span class="duration">${v.label}</span></button>`).join('');
 $('plan-title').textContent=`${m.days} days, thoughtfully covered.`;
 $('household-summary').textContent=`${m.people} ${m.people===1?'person':'people'}${state.pets?' + '+state.pets+' '+(state.pets===1?'pet':'pets'):''}${state.place?' · '+state.place:''}`;
 $('water-target').innerHTML=`${fmt(m.water,1)} <small>gallons</small>`;
 $('water-detail').textContent=beginner?`Buy or set aside ${m.waterJugs} one-gallon jugs. Smaller bottles adding up to this amount also work.`:`${fmt(m.dailyWater,2)} gal / day · about ${fmt(m.waterWeight)} lb of water before containers.`;
 $('food-target').innerHTML=beginner?`${m.days} <small>days of meals</small>`:`${fmt(m.food)} <small>kcal</small>`;
 $('food-detail').textContent=beginner?`Breakfast, lunch, dinner and snacks for ${state.adults+state.children} people each day. Use normal portions; infant feeding is separate.`:`${fmt(m.dailyFood)} kcal / day · ${fmt(m.meals)} person-meal slots. Infant feeding is separate.`;
 $('water-bar').style.width=Math.min(100,state.storedWater/m.water*100)+'%';$('food-bar').style.width=Math.min(100,beginner?state.simpleFoodDays/m.days*100:state.storedFood/m.food*100)+'%';
 $('water-gap').textContent=m.waterGap?`${fmt(m.waterGap,1)} gal to add · ${fmt(m.waterDays,1)} days stored`:`Target quantity met · ${fmt(m.waterDays,1)} days stored`;
 $('food-gap').textContent=beginner?(m.simpleFoodGapDays?`${fmt(m.simpleFoodGapDays,1)} more days of complete meals to add`:'Selected meal-day target reported on hand'):m.foodGap?`${fmt(m.foodGap)} kcal to add · ${fmt(m.foodDays,1)} days stored`:`Target quantity met · ${fmt(m.foodDays,1)} days stored`;
 let notes=[beginner?`<p><strong>We’ve done the water math:</strong> ${m.baselineWater} gallons for people at the basic 1 gallon/person/day${m.bufferWater?` + ${fmt(m.bufferWater,1)} gallons of extra water for heat/higher needs`:''}${state.pets?` + ${fmt(state.pets*state.petWater*m.days,1)} gallons using your pet entry`:''}. The optional buffer uses an extra half-gallon/person/day, an editorial starting point, not a medical rule. This is not normal household water usage or a drinking limit.</p>`:`<p><strong>Planning basis:</strong> ${state.waterRate} gal per person/day + entered pet water; ${fmt(state.adultKcal)} kcal/adult and ${fmt(state.childKcal)} kcal/child. Adjust to actual needs. Water does not cover normal showers, laundry or toilet flushing.</p>`];
 if(state.infants)notes.push('<p class="attention">Infant water is included in the baseline; formula, breastmilk handling and feeding supplies need a separate plan. Infant food is excluded from calorie totals.</p>');
 if(!beginner&&state.hazards.includes('heat')&&state.waterRate===1)notes.push('<p>Heat selected: consider raising the water allowance under “Adjust planning assumptions.” The calculator does not add a hidden heat multiplier.</p>');
 if(state.medical)notes.push('<p class="attention">Care priority: arrange provider-approved backup and relocation before power or safe medication storage runs out.</p>');
 if(state.pets)notes.push(`<p>Pet food: ${m.petDays} pet-days at each animal’s usual daily ration. Water entry: ${state.petWater} gal/pet/day; confirm actual needs.</p>`);
 $('context-note').innerHTML=notes.join('');
 const next = tasks.find(task => task.status === 'open');
 $('next-title').textContent = next ? next.title : 'Review and download your plan.';
 $('next-detail').textContent = next ? next.detail : 'You can save your PDF and revisit it as conditions change.';
 $('progress-number').textContent = `${done} / ${applicable}`;
 $('progress-label').textContent = `applicable tasks done${skipped ? ` · ${skipped} not needed` : ''}`;
 $('progress-bar').style.width = (applicable ? 100 * done / applicable : 0) + '%';
 const visible = tasks.filter(task => filter === 'all' || task.status === filter);
 const phases = [...new Set(visible.map(task => task.phase))];
 $('task-list').innerHTML = phases.map(phase => {
   const rows = visible.filter(task => task.phase === phase).map(task => {
     const options = Object.entries(P.STATUS).map(([value, label]) =>
       `<option value="${value}" ${task.status === value ? 'selected' : ''}>${label}</option>`
     ).join('');
     return `<article class="task-row ${task.status}"><div><span class="task-title" id="title-${task.id}">${escape(task.title)}</span><span class="task-detail">${escape(task.detail)}</span></div><select class="task-status" data-task="${task.id}" aria-labelledby="title-${task.id}">${options}</select></article>`;
   }).join('');
   return `<h3 class="task-group">${phase}</h3>${rows}`;
 }).join('') || '<p class="empty">No tasks in this view.</p>';
 const power = P.portablePower(state);
 renderPortable(power);
 renderPlan(m, tasks, power);
 renderExperience(m);
 $('power-result').innerHTML=m.powerDays===null?'No daily load entered. Add measured watt-hours to estimate runtime.':`<strong>${fmt(m.powerNeed)} Wh</strong> nominal battery capacity for ${m.days} days without recharging.<br>Your entered battery supports about <strong>${fmt(m.powerDays,1)} days</strong> at this load.`;
 if(state.dailyWh===0)$('power-result').textContent='No daily load entered. Add measured watt-hours to estimate runtime.';
}

function renderLoadRows() {
  $('load-rows').innerHTML = state.powerLoads.map((row, index) => {
    const numberField = (key, label, max) => `<label>${label}<input data-load="${index}" data-field="${key}" type="number" min="0" max="${max}" step="any" value="${row[key] ?? ''}"></label>`;
    return `<fieldset class="load-card"><legend>Device ${index + 1}</legend>
      <label>Device name<input data-load="${index}" data-field="name" type="text" maxlength="80" value="${escape(row.name)}" placeholder="e.g., Enclosure heater"></label>
      <div class="inputs three">${numberField('watts', 'Rated watts', 25000)}${numberField('hours', 'Full-power hours / day', 24)}${numberField('measured', 'Measured Wh / day', 600000)}</div>
      <button type="button" class="text-button remove-load" data-remove="${index}" aria-label="Remove device ${index + 1}">Remove device</button>
    </fieldset>`;
  }).join('');
  $('add-load').disabled = state.powerLoads.length + P.LOAD_PRESETS[$('load-preset').value].length > 12;
}
function describePower(power) {
  if (!power.rows.length) return ['Add a device to start.', 'You can leave estimates blank until you have a label or a meter reading.'];
  const parts = [power.missingEnergy ? `${power.missingEnergy} device(s) still need energy data. Known subtotal: ${fmt(power.daily, 1)} Wh/day.` : `Daily energy: ${fmt(power.daily, 1)} Wh/day.`];
  if (power.target !== null) parts.push(`Battery target for ${fmt(state.powerHours, 1)} hours without sun: ${fmt(power.target)} Wh at ${state.usable}% usable capacity.`);
  if (power.complete && power.daily === 0) parts.push('Add nonzero energy for any device that will run to get a runtime estimate.');
  if (power.runtime !== null) parts.push(`The ${fmt(state.capacityWh)} Wh station gives about ${fmt(power.runtime, 1)} hours on this average load.`);
  if (power.missingWatts) parts.push(`Known running watts: ${fmt(power.knownWatts, 1)} W. ${power.missingWatts} device(s) still need rated watts.`);
  else parts.push(`Simultaneous rated load: ${fmt(power.knownWatts, 1)} W. Check startup surge separately.`);
  if (power.solar !== null) {
    const cap = state.solarInput ? `station limit ${fmt(state.solarInput)} W` : 'station input limit still to verify';
    parts.push(`Solar estimate: ${fmt(power.solar, 1)} Wh/day with ${fmt(state.solarWatts)} W of panels, ${cap}, ${fmt(state.solarHours, 1)} peak sun hours and ${state.solarYield}% estimated yield.`);
    if (power.complete) {
      const balance = power.solar - power.daily;
      parts.push(balance < 0 ? `Estimated daily shortfall: ${fmt(-balance, 1)} Wh. Plan a second way to recharge.` : `Estimated daily margin: ${fmt(balance, 1)} Wh in those conditions. Confirm output and plan for low-sun days.`);
    }
  }
  return parts;
}
function renderPortable(power) {
  $('power-toggle').checked = state.customPower;
  $('customPower').checked = state.customPower;
  $('power-setup').hidden = !state.customPower;
  $('portable-result').innerHTML = describePower(power).map((line, index) =>
    index === 0 ? `<p><strong>${escape(line)}</strong></p>` : `<p>${escape(line)}</p>`
  ).join('');
}
function planSnapshot(m, tasks, power) {
  const beginner = state.experience === 'beginner';
  const seasons = P.activeSeasons(state);
  const sections = [
    { title: 'Supply targets and gaps', items: [
      { label: 'Water', detail: `${fmt(m.water, 2)} gal target; ${fmt(state.storedWater, 2)} gal on hand; ${fmt(m.waterGap, 2)} gal to add.${beginner ? ` About ${m.waterJugs} one-gallon jugs for the full target.` : ''}` },
      { label: 'Food', detail: beginner ? `${m.days} days of family meals; ${fmt(state.simpleFoodDays, 1)} days on hand; ${fmt(m.simpleFoodGapDays, 1)} days to add.` : `${fmt(m.food)} kcal target; ${fmt(state.storedFood)} kcal on hand; ${fmt(m.foodGap)} kcal to add.` }
    ] },
    { title: seasons.length ? 'Location and seasonal priorities' : 'Location and hazards', items: [
      { label: 'Region and hazards', detail: E.REGIONS[state.region].name + ' | ' + (state.hazards.map(key => E.HAZARDS[key].name).join(', ') || 'No hazards selected') }
    ] }
  ];
  if (seasons.length) {
    sections[1].items.push({
      label: seasons.map(key => P.SEASONS[key].label).join(', '),
      detail: seasons.map(key => P.SEASONS[key].title).join('. ') + '.'
    });
  }
  if (state.infants) sections[0].items.push({ label: 'Infant feeding', detail: 'Track infant feeding requirements separately from the family food totals.' });
  if (state.pets) sections[0].items.push({ label: 'Pets', detail: `${m.petDays} pet-days of food at usual daily rations. Water uses ${fmt(state.petWater, 2)} gal/pet/day.` });
  if (state.customPower) {
    const items = [{ label: 'Battery and recharge estimate', detail: describePower(power).join('\n') }];
    power.rows.forEach((row, index) => items.push({
      label: row.name || `Device ${index + 1}`,
      detail: `${row.watts === null ? 'Rated watts unknown' : `${fmt(row.watts, 1)} W rated`} | ${row.daily === null ? 'Daily energy unknown' : `${fmt(row.daily, 1)} Wh/day (${row.measured === null ? `estimated from ${fmt(row.hours, 1)} full-power hours` : 'measured'})`}`
    }));
    items.push({ label: 'What to verify', detail: 'Test runtime, startup surge, inverter standby draw, auto-shutoff, restart behavior and charging compatibility. Keep a recharge or relocation fallback.' });
    sections.push({ title: 'Portable power', items });
  } else if (!beginner && state.dailyWh > 0) {
    sections.push({ title: 'Backup power', items: [{ label: 'Quick estimate', detail: `At ${fmt(state.dailyWh)} Wh/day and ${state.usable}% usable capacity, ${m.days} days without recharge need approximately ${fmt(Math.ceil(m.powerNeed))} Wh nominal.${state.capacityWh > 0 ? ` The ${fmt(state.capacityWh)} Wh station gives an estimated ${fmt(m.powerDays, 1)} days.` : ''}` }] });
  } else {
    sections.push({ title: 'Backup power', items: [{ label: 'Lights and charging', detail: `Set aside ${m.people} personal lights and test ${state.phones} phone charging setups with matching cables and banks.` }] });
  }
  for (const phase of [...new Set(tasks.map(task => task.phase))]) {
    sections.push({ title: phase, items: tasks.filter(task => task.phase === phase).map(task => ({
      label: P.STATUS[task.status] + ' | ' + task.title, detail: task.status === 'open' ? task.detail : ''
    })) });
  }
  if (state.notes.trim()) sections.push({ title: 'Household notes', items: [{ label: 'Destinations, responsibilities and reminders', detail: state.notes }] });
  return {
    meta: `${P.HORIZONS[state.horizon].label} | ${E.TIERS[state.tier].name} (${m.days} days) | ${E.EXPERIENCES[state.experience].name}`,
    household: [
      `${state.adults} ${state.adults === 1 ? 'adult' : 'adults'}`,
      state.children && `${state.children} ${state.children === 1 ? 'child' : 'children'}`,
      state.infants && `${state.infants} ${state.infants === 1 ? 'infant' : 'infants'}`,
      state.pets && `${state.pets} ${state.pets === 1 ? 'pet' : 'pets'}`
    ].filter(Boolean).join(', ') + (state.place ? ' | ' + state.place : ''),
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    sections
  };
}
function renderPlan(m, tasks, power) {
  const plan = planSnapshot(m, tasks, power);
  const open = tasks.filter(task => task.status === 'open');
  const skipped = tasks.filter(task => task.status === 'skip').length;
  const priority = open.length ? `<ul>${open.slice(0, 3).map(task => `<li>${escape(task.title)}</li>`).join('')}</ul>` : '<p>There are no open checklist actions.</p>';
  const seasonPreview = P.activeSeasons(state).length
    ? `<p>Seasonal focus: ${escape(plan.sections[1].items[1].label)}.</p>` : '';
  const powerPreview = state.customPower ? `<p>${escape(describePower(power).slice(0, 2).join(' '))}</p>` : '';
  $('plan-preview').innerHTML = `<div class="plan-review"><strong>${escape(plan.meta)}</strong><p>${escape(plan.household)}</p><p>${escape(plan.sections[0].items.map(item => item.label + ': ' + item.detail).join(' '))}</p>${seasonPreview}${powerPreview}<h3>Next actions</h3>${priority}<p class="help">${open.length} to do · ${tasks.length - open.length - skipped} done · ${skipped} not needed. The PDF includes every task and your saved notes.</p></div>`;
}

function renderExperience(m){
 const beginner=state.experience==='beginner';
 $('starter-power-content').innerHTML=`<ol><li><strong>${m.people} LED light${m.people===1?'':'s'}</strong>, with adults managing young children’s lights. Include two spare battery sets per battery light.</li><li><strong>${state.phones} USB power bank${state.phones===1?'':'s'}, around 20,000 mAh each</strong> — one per phone — and the right cables. This is a starter purchase suggestion, not a promise of ${m.days} days of power.</li><li>Fully charge them, then practice charging each phone. Write down how many charges you actually get.</li><li>${m.days>3?'For this longer goal, arrange a safe recurring recharge option or a place to relocate. Adding days of food does not automatically extend your batteries.':'Keep phones in low-power mode and use them for essential check-ins.'}</li></ol>${state.medical?'<p class="attention">Medical equipment or refrigerated medicine selected: these phone banks are not your medical backup. Arrange a compatible, provider-approved supply and an early relocation plan.</p>':''}<p class="help">No generator or whole-house electrical usage estimate is needed to start. These items do not power heaters, air conditioning or a refrigerator.</p>`;
 let html=`<article class="comms-card"><h3>1. Hear news and warnings</h3><p>Start with <strong>one battery-powered AM/FM radio plus NOAA weather alerts</strong>. A single unit can do both only if its features say so. Look for automatic alerts, battery backup and, for a home warning receiver, SAME county selection. A simple “weather band” label may mean listening only.</p><p class="help">Tune a local station and a clear NOAA transmitter. Set county alerts, then confirm reception and backup power. Hand-crank/solar are supplemental features, not a substitute for stored batteries.</p></article><article class="comms-card"><h3>2. Reach your people</h3><p>Keep phones charged, write down contacts, and agree on check-in times and a meeting point. A broadcast radio receives information; it cannot send a message to your family or 911.</p></article>`;
 if(state.commsGoal==='nearby')html+=`<article class="comms-card"><h3>For your nearby group: FRS walkie-talkies</h3><p>Start with <strong>two matching FRS radios</strong>, one per separated group. Compliant FRS use needs no individual US license. Set the same channel and tone, then test from the actual locations. “Privacy codes” filter what you hear; they do not encrypt your voice.</p></article>`;
 if(state.commsGoal==='town')html+=`<article class="comms-card"><h3>Across town: test before relying on it</h3><p>Handheld range varies sharply with terrain and buildings. ${beginner?'Ask an experienced helper to evaluate licensed GMRS radios or a compatible mesh system with you. Start with a pair and a real test, not a tower or a promise on a box.':'Compare licensed GMRS with an available repeater against mesh text radios with a working radio path. Repeaters and mesh relays need power and permission; a map dot is not evidence of reliable coverage.'}</p></article>`;
 if(state.commsGoal==='remote')html+=`<article class="comms-card"><h3>Outside cell coverage: satellite messaging</h3><p>Check the exact phone or dedicated messenger, supported area, activation and any subscription. Garmin inReach, for example, requires an active plan for messaging and SOS. Learn its test mode and use a clear sky view. Never trigger a real SOS to practice.</p></article>`;
 if(!beginner)html+=`<div class="comms-table-wrap"><table><thead><tr><th>Tool</th><th>Best use</th><th>Important limit</th></tr></thead><tbody><tr><td>AM/FM + NOAA</td><td>Receive broadcasts and weather alerts</td><td>No two-way conversation; verify alert capability and reception.</td></tr><tr><td>FRS</td><td>Simple nearby voice</td><td>Short-range, shared channels; privacy tones are not encryption.</td></tr><tr><td>GMRS</td><td>Family voice; compatible repeaters where available</td><td>US license required; it can cover defined immediate family, not all friends.</td></tr><tr><td>Meshtastic / MeshCore</td><td>Short off-grid text via compatible radios</td><td>Choose one compatible system; no guaranteed path, voice calling or 911 dispatch.</td></tr><tr><td>Amateur radio</td><td>Trained local/regional communications</td><td>Licensing, practice, suitable gear and someone listening are needed.</td></tr><tr><td>Satellite messenger</td><td>Remote check-ins / supported SOS</td><td>Device, sky view, service and activation requirements vary.</td></tr></tbody></table></div>`;
 if(state.experience==='advanced')html+=`<details open><summary>Mesh deployment and test checklist</summary><ol><li>Start with two compatible nodes, correct regional hardware/settings, charged batteries and matching radio/channel settings. Use phones with local Bluetooth or supported standalone interfaces.</li><li>Keep default/public channels out of the private-message plan. Configure and protect private keys; review location sharing and internet upload settings.</li><li>Test both directions from home, work and the intended routes. Disable MQTT/internet bridges on participating nodes and phone internet for the off-grid test; re-enable Bluetooth locally if needed.</li><li>Record missed messages, acknowledgement timing and relay dependencies. Add safely placed, powered relay infrastructure only where testing justifies it.</li><li>Write a fallback: missed-check-in time, other channel/method, meeting point. Mesh has no universal emergency dispatcher.</li></ol><p class="help">MQTT uses internet to connect meshes; online reception is not proof of a working radio path. Meshtastic and MeshCore are different ecosystems: do not assume they exchange messages directly. Neither supplies cellular-style calls or broadband internet.</p></details>`;
 if(beginner)html+=`<p class="help">Curious about mesh, GMRS or ham radio? The full guide compares them. You can complete a useful starter kit without learning them first.</p>`;
 html+=`<p class="help"><a href="sources.html" target="_blank" rel="noopener">Radio sources and setup references ↗</a></p>`;
 $('comms-content').innerHTML=html;
}

for(const k of numberKeys){$(k).addEventListener('input',()=>{if($(k).value===''||!$(k).validity.valid)return;state=E.normalize({...state,[k]:$(k).value});$('preset').value=presetValue();save();render();});$(k).addEventListener('change',()=>{state=E.normalize({...state,[k]:$(k).value});sync();save();render();});}
for(const k of boolKeys)$(k).addEventListener('change',()=>{state[k]=$(k).checked;save();render();});
for(const k of ['place','notes'])$(k).addEventListener('input',()=>{state[k]=$(k).value;save();if(k==='place')render();else renderPlan(E.calculate(state),P.orderTasks(state,E.tasks(state)),P.portablePower(state));});
for(const k of ['horizon','experience','commsGoal'])$(k).addEventListener('change',()=>{state[k]=$(k).value;save();render();});
$('housing').addEventListener('change',()=>{state.housing=$('housing').value;save();render();});
$('region').addEventListener('change',()=>{state.region=$('region').value;state.hazards=[...E.REGIONS[state.region].hazards];sync();save();render();});
$('hazards').addEventListener('change',()=>{state.hazards=[...document.querySelectorAll('[data-hazard]:checked')].map(el=>el.dataset.hazard);save();render();});
$('preset').addEventListener('change',()=>{const v=$('preset').value;if(v==='custom'){$('adults').focus();return;}Object.assign(state,v==='solo'?{adults:1,children:0,infants:0,phones:1}:v==='duo'?{adults:2,children:0,infants:0,phones:2}:{adults:2,children:2,infants:0,phones:2});sync();save();render();});
$('tiers').addEventListener('click',ev=>{const b=ev.target.closest('[data-tier]');if(!b)return;state.tier=b.dataset.tier;save();render();$('tiers').querySelector(`[data-tier="${state.tier}"]`).focus();});
$('task-list').addEventListener('change', event => {
  const id = event.target.dataset.task;
  if (!id) return;
  delete state.checked[id];
  delete state.notNeeded[id];
  if (event.target.value === 'done') state.checked[id] = true;
  if (event.target.value === 'skip') state.notNeeded[id] = true;
  save();
  render();
  const same = $('task-list').querySelector(`[data-task="${id}"]`);
  (same || document.querySelector(`[data-filter="${filter}"]`))?.focus();
});
$('seasons').addEventListener('change', () => {
  state.seasons = [...$('seasons').querySelectorAll('input:checked')].map(el => el.dataset.season);
  save();
  render();
});
$('power-toggle').addEventListener('change', () => {
  state.customPower = $('power-toggle').checked;
  save();
  render();
});
$('load-preset').addEventListener('change', renderLoadRows);
$('add-load').addEventListener('click', () => {
  const first = state.powerLoads.length;
  const rows = P.LOAD_PRESETS[$('load-preset').value];
  state = E.normalize({ ...state, powerLoads: [...state.powerLoads, ...rows] });
  renderLoadRows();
  save();
  render();
  $('load-rows').querySelector(`[data-load="${first}"]`)?.focus();
});
$('load-rows').addEventListener('input', event => {
  const { load, field } = event.target.dataset;
  if (load === undefined || !event.target.validity.valid) return;
  state.powerLoads[Number(load)][field] = event.target.value;
  state = E.normalize(state);
  save();
  render();
});
$('load-rows').addEventListener('click', event => {
  if (event.target.dataset.remove === undefined) return;
  state.powerLoads.splice(Number(event.target.dataset.remove), 1);
  renderLoadRows();
  save();
  render();
  $('add-load').focus();
});
for (const [id, key] of [['stationWh', 'capacityWh'], ['stationUsable', 'usable'], ['capacityWh', 'capacityWh'], ['usable', 'usable']]) {
  $(id).addEventListener('input', event => {
    if (!event.target.validity.valid || (key === 'usable' && event.target.value === '')) return;
    state = E.normalize({ ...state, [key]: event.target.value });
    for (const linked of key === 'capacityWh' ? ['stationWh', 'capacityWh'] : ['stationUsable', 'usable']) {
      if (linked !== id) $(linked).value = state[key];
    }
    save();
    render();
  });
}
$('download-pdf').addEventListener('click', async () => {
  const button = $('download-pdf');
  button.disabled = true;
  $('pdf-status').textContent = 'Preparing your PDF…';
  try {
    const tasks = P.orderTasks(state, E.tasks(state));
    await ReadyPlanPdf.download(planSnapshot(E.calculate(state), tasks, P.portablePower(state)));
    $('pdf-status').textContent = 'PDF sent to your browser. Look in Downloads or Files.';
  } catch {
    $('pdf-status').textContent = 'The PDF could not be downloaded. Try again or use Print this page to save a copy.';
  } finally {
    button.disabled = false;
  }
});
for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),plan:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ready-together-private-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import-button').addEventListener('click',()=>$('import').click());
$('import').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;try{if(f.size>200000)throw Error('File too large.');const parsed=JSON.parse(await f.text());if(parsed.version!==1||!parsed.plan||typeof parsed.plan!=='object'||Array.isArray(parsed.plan))throw Error('Choose a version 1 Ready Together backup.');state=E.normalize({...parsed.plan,experience:parsed.plan.experience||'advanced'});sync();save();render();$('storage-status').textContent='Backup imported and saved in this browser.';}catch(e){$('storage-status').textContent='Import failed: '+e.message;}ev.target.value='';});
$('reset').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());$('confirm-reset').addEventListener('click',()=>{state=E.normalize();filter='all';document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));sync();save();render();$('reset-dialog').close();});
let previousFilter,openDetails=[];
window.addEventListener('beforeprint',()=>{previousFilter=filter;filter='all';render();openDetails=[...document.querySelectorAll('details')].map(d=>[d,d.open]);openDetails.forEach(([d])=>d.open=true);});
window.addEventListener('afterprint',()=>{filter=previousFilter||'all';openDetails.forEach(([d,v])=>d.open=v);render();});
$('print').addEventListener('click',()=>window.print());
sync();render();if(storageOK)$('storage-status').textContent='This plan stays in this browser. Export a backup to keep a separate copy.';
})();
