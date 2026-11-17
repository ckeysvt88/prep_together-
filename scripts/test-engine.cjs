const assert=require('node:assert/strict');const E=require('../dist/engine.js');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name)}
const core={...E.defaults,experience:'advanced',adults:1,children:0,infants:0,pets:0};
test('1 adult, all tiers',()=>{for(const [tier,days]of [['core',3],['advanced',14],['super',30]]){const m=E.calculate({...core,tier});assert.equal(m.water,days);assert.equal(m.food,2000*days);assert.equal(m.meals,3*days);}});
test('2 adults, all tiers',()=>{for(const [tier,days]of [['core',3],['advanced',14],['super',30]]){const m=E.calculate({...core,adults:2,tier});assert.equal(m.water,2*days);assert.equal(m.food,4000*days);}});
test('family tables',()=>{for(const [tier,days]of [['core',3],['advanced',14],['super',30]]){const m=E.calculate({...E.defaults,experience:'advanced',tier});assert.equal(m.water,4*days);assert.equal(m.food,7200*days);assert.equal(m.meals,12*days);}});
test('infants add water, not standard food',()=>{const m=E.calculate({...core,infants:1});assert.equal(m.water,6);assert.equal(m.food,6000);assert.equal(m.meals,9);});
test('pets, water override and no hidden heat multiplier',()=>{const m=E.calculate({...core,pets:2,petWater:.5,waterRate:1.5});assert.equal(m.water,7.5);assert.equal(m.petDays,6);assert.equal(E.calculate({...core,hazards:['heat']}).water,3);});
test('inventory gap clamps to zero',()=>{const m=E.calculate({...core,storedWater:999,storedFood:999999});assert.equal(m.waterGap,0);assert.equal(m.foodGap,0);});
test('power capacity and runtime',()=>{const m=E.calculate({...core,dailyWh:100,capacityWh:1000,usable:80});assert.equal(m.powerNeed,375);assert.equal(m.powerDays,8);assert.equal(E.calculate({...core,dailyWh:0}).powerDays,null);});
test('invalid imports normalized safely',()=>{const n=E.normalize({adults:-10,children:NaN,tier:'fake',hazards:['fake','flood','flood'],checked:{'<bad>':true,water:true},notes:'x'.repeat(4000)});assert.equal(n.adults,1);assert.equal(n.children,2);assert.equal(n.tier,'core');assert.deepEqual(n.hazards,['flood']);assert.equal(n.checked.water,true);assert.equal(n.checked['<bad>'],undefined);assert.equal(n.notes.length,3000);});
test('tier tasks cumulative with unique ids',()=>{let prev=[];for(const tier of ['core','advanced','super']){const ids=E.tasks({...E.defaults,tier}).map(t=>t.id);assert.equal(new Set(ids).size,ids.length);prev.forEach(id=>assert(ids.includes(id)));prev=ids;}});
test('personal conditions actually change tasks',()=>{const ids=E.tasks({...core,infants:1,pets:1,medical:true,well:true,noCar:true,access:true,allergy:true,housing:'mobile'}).map(t=>t.id);for(const id of ['solo','infants','pets','medical','well','ride','access','allergy','mobile'])assert(ids.includes(id));});
test('backup JSON round trip',()=>{const s=E.normalize({...E.defaults,notes:'private note',checked:{water:true}});assert.deepEqual(E.normalize(JSON.parse(JSON.stringify(s))),s);});
test('beginner heat buffer and whole-jug rounding',()=>{const m=E.calculate({...core,experience:'beginner'});assert.equal(m.water,4.5);assert.equal(m.waterJugs,5);assert.equal(m.baselineWater,3);assert.equal(m.bufferWater,1.5);assert.equal(E.calculate({...core,experience:'beginner',hazards:[]}).water,3);assert.equal(E.calculate({...core,experience:'beginner',hazards:[],extraWater:true}).water,4.5);});
test('beginner ignores technical overrides but preserves them',()=>{const s=E.normalize({...core,experience:'beginner',waterRate:2});assert.equal(E.calculate(s).water,4.5);assert.equal(s.waterRate,2);assert.equal(E.calculate({...s,experience:'advanced'}).water,6);});
test('simple food inventory is independent of calories',()=>{assert.equal(E.calculate({...core,simpleFoodDays:2,storedFood:999999}).simpleFoodGapDays,1);assert.equal(E.calculate({...core,simpleFoodDays:30}).simpleFoodGapDays,0);});
test('experience does not change supply duration',()=>{for(const experience of Object.keys(E.EXPERIENCES))for(const [tier,days] of [['core',3],['advanced',14],['super',30]])assert.equal(E.calculate({...core,experience,tier}).days,days);});
test('communication tasks adapt to goal and experience',()=>{const ids=s=>E.tasks({...core,...s}).map(t=>t.id);for(const id of ['radio-listen','radio-test'])assert(ids({}).includes(id));assert(ids({commsGoal:'nearby'}).includes('radio-frs'));assert(ids({commsGoal:'remote'}).includes('radio-satellite'));assert(ids({commsGoal:'town'}).includes('mesh-proof'));assert(!ids({experience:'beginner',commsGoal:'town'}).includes('mesh-proof'));});
test('new fields validate and round trip',()=>{const n=E.normalize({experience:'unknown',commsGoal:'unknown',phones:99,simpleFoodDays:-1});assert.equal(n.experience,'beginner');assert.equal(n.commsGoal,'alerts');assert.equal(n.phones,30);assert.equal(n.simpleFoodDays,0);});
const P = require('../dist/planning.js');
test('older checked tasks and new Not needed selections are distinct', () => {
  const state = E.normalize({ checked: { alerts: true, hygiene: true }, notNeeded: { hygiene: true } });
  const tasks = P.orderTasks(state, E.tasks(state));
  assert.equal(tasks.find(task => task.id === 'alerts').status, 'done');
  assert.equal(tasks.find(task => task.id === 'hygiene').status, 'skip');
  assert.equal(tasks.find(task => task.id === 'water').status, 'open');
  assert.equal(state.checked.hygiene, undefined);
  assert.equal(E.normalize(JSON.parse(JSON.stringify(state))).notNeeded.hygiene, true);
});
test('seasons apply to immediate prep and stay saved when switching to long-term prep', () => {
  const immediate = E.normalize({ tier: 'super', seasons: ['winter', 'winter', 'invalid'] });
  const longTerm = E.normalize({ ...immediate, horizon: 'long' });
  const nowTasks = P.orderTasks(immediate, E.tasks(immediate));
  const laterTasks = P.orderTasks(longTerm, E.tasks(longTerm));
  assert.equal(nowTasks[0].id, 'alerts');
  assert.equal(nowTasks.find(task => task.id === 'season-winter').phase, 'Before the selected season');
  assert(!laterTasks.some(task => task.cat === 'Seasonal'));
  assert.deepEqual(longTerm.seasons, ['winter']);
  assert.deepEqual(P.activeSeasons({ ...longTerm, horizon: 'now' }), ['winter']);
  assert.equal(E.calculate(longTerm).days, 30);
});
test('device estimates honor measured usage, incomplete data and station solar limits', () => {
  const state = E.normalize({
    powerLoads: [{ name: 'Primary', watts: 80, hours: 12 }, { name: 'Secondary', watts: 40, hours: 24, measured: 480 }],
    powerHours: 24, capacityWh: 2000, usable: 80, solarWatts: 400, solarInput: 300, solarHours: 3, solarYield: 70
  });
  const model = P.portablePower(state);
  assert.equal(model.daily, 1440);
  assert.equal(model.knownWatts, 120);
  assert.equal(model.target, 1800);
  assert(Math.abs(model.runtime - 26.6667) < 0.001);
  assert.equal(model.solar, 630);
  const incomplete = P.portablePower(E.normalize({ ...state, powerLoads: [...state.powerLoads, { name: 'Unknown load' }] }));
  assert.equal(incomplete.target, null);
  assert.equal(incomplete.runtime, null);
  assert.equal(incomplete.missingEnergy, 1);
});
test('shopping list uses reported gaps and leaves untracked equipment blank', () => {
  const S = require('../dist/shopping.js');
  const state = E.normalize({ adults: 2, children: 2, storedWater: 5, simpleFoodDays: 1.5, pets: 1, petWater: 0.5 });
  const totals = E.calculate(state);
  const list = S.makeList(state, totals, P.portablePower(state), P.activeSeasons(state));
  assert.deepEqual(list.essentials.slice(0, 2).map(({ target, have, need }) => [target, have, need]), [
    ['19.5 gal', '5 gal', '14.5 gal'], ['3 days', '1.5 days', '1.5 days']
  ]);
  assert.match(list.essentials[0].detail, /15 more/);
  assert(list.essentials.slice(2).every(row => row.have === null && row.need === null));
  assert(list.addOns.some(row => row.item.startsWith('Pet food') && row.target === '3 days per pet'));
});
test('shopping order has backward-compatible defaults and uses active seasons only', () => {
  const S = require('../dist/shopping.js');
  assert.equal(E.normalize({}).report, 'both');
  assert.equal(E.normalize({ report: 'shopping' }).report, 'shopping');
  assert.equal(E.normalize({ report: 'action' }).report, 'action');
  assert.equal(E.normalize({ report: '__proto__' }).report, 'both');
  for (const horizon of ['now', 'long']) {
    const state = E.normalize({ horizon, hazards: [], seasons: ['winter'], phones: 0 });
    const list = S.makeList(state, E.calculate(state), P.portablePower(state), P.activeSeasons(state));
    assert.equal(list.addOns.some(row => row.item.includes('cold-weather')), horizon === 'now');
    assert(!list.essentials.some(row => row.item.includes('power banks')));
  }
});
console.log(`${checks} tests passed.`);
