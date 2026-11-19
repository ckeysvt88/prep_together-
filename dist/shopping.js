/* Personal shopping checklist. Only water and food have recorded inventories. */
(function (root) {
  const M = typeof module !== 'undefined' && module.exports ? require('./medical.js') : root.ReadyMedical;
  const fmt = (amount, decimals = 0) => Number(amount).toLocaleString('en-US', { maximumFractionDigits: decimals });

  function makeList(state, supplies, power, seasons) {
    const { days, people } = supplies;
    const beginner = state.experience === 'beginner';
    const gal = amount => fmt(amount, 2) + ' gal';
    const foodUnit = beginner ? ' days' : ' kcal';
    const foodTarget = beginner ? days : supplies.food;
    const foodOnHand = beginner ? state.simpleFoodDays : state.storedFood;
    const foodGap = beginner ? supplies.simpleFoodGapDays : supplies.foodGap;
    const eaters = state.adults + state.children;
    const row = (item, target, detail, have = null, need = null) => ({ item, target, detail, have, need });
    const waterDetail = supplies.waterGap > 0
      ? `If buying one-gallon jugs, get ${fmt(Math.ceil(Number(supplies.waterGap.toFixed(8))))} more. ${state.pets ? 'Includes the pet-water allowance you entered.' : 'Use any mix of sealed sizes.'}`
      : 'Your reported supply covers this target. Check dates and storage.';
    const mealDetail = `${fmt(days * eaters)} portions each for breakfast, lunch and dinner, plus snacks. Try oats, canned beans and crackers.${state.infants ? ' Infant feeds are separate.' : ''}`;
    const essentials = [
      row('Drinking water', gal(supplies.water), waterDetail, gal(state.storedWater), gal(supplies.waterGap)),
      row('Shelf-stable food', fmt(foodTarget, 1) + foodUnit, mealDetail, fmt(foodOnHand, 1) + foodUnit, fmt(foodGap, 1) + foodUnit),
      row('Manual can opener', '1 if needed', 'Set one aside if your food includes cans that need an opener.'),
      row('Flashlights or headlamps', `${people} lights`, 'One per person. Adults manage children’s lights. Add spare batteries or charging cables.'),
      row('Battery-powered radio', '1 setup', 'Receive NOAA alerts and AM/FM on one or two radios. Include matching spare batteries.'),
      row('First aid kit', Math.ceil(people / 4) + ' starter kit(s)', 'Check bandages, dressings, tape, gloves and the first aid instructions.'),
      row('Medicines and care supplies', 'Household needs', 'Use the medical worksheets for separate adult OTC, prescriptions, and pediatric plans. Costs and shopping references appear with relevant items.'),
      row('Hygiene and cleanup supplies', '1 household kit', 'Soap, toilet paper, wipes, trash bags and any personal hygiene items.'),
      row('Grab-and-go basics', 'For each person', 'A carryable bag, sturdy shoes, clothing and a copy of your emergency contacts.')
    ];
    if (state.phones > 0) {
      essentials.splice(4, 0, row('USB power banks and cables', `${state.phones} banks\n${state.phones} cables`, 'One bank and cable per phone. Charge and test them. Plan how to recharge.'));
    }

    const addOns = [];
    const medicalSheets = M.printableSheets(state);
    for (const sheet of medicalSheets.filter(sheet => sheet.banner !== 'PRESCRIPTION SERVICES')) {
      for (const item of sheet.rows) {
        if (state.notNeeded[item.id] || state.checked[item.id]) continue;
        const target = (item.optional ? 'Optional: ' : '') + item.target;
        const itemRow = row(item.item, target, item.detail);
        (item.optional ? addOns : essentials).push(itemRow);
      }
    }
    if (state.infants > 0) {
      addOns.push(row('Infant feeding and diaper supplies', `${days} days`, `Cover ${state.infants} ${state.infants === 1 ? 'infant' : 'infants'} using their usual feeding plan and daily diaper count. Set aside feeding equipment and cleaning supplies.`));
    }
    if (state.pets > 0) {
      addOns.push(row('Pet food and travel supplies', `${days} days per pet`, `Pack regular food for ${state.pets} ${state.pets === 1 ? 'pet' : 'pets'}, a carrier or leash, and waste supplies. Pet water is included above.`));
    }
    if (state.medical || state.access) {
      addOns.push(row('Care and accessibility equipment', 'As required', 'List your specific equipment, batteries and storage supplies. Confirm backups with your care team.'));
    }
    if (state.hazards.includes('winter') || seasons.includes('winter')) {
      addOns.push(row('Warmth and cold-weather gear', 'For each person', 'Warm layers, blankets or sleeping bags, and suitable footwear.'));
    }
    if (state.hazards.some(hazard => ['flood', 'hurricane'].includes(hazard))) {
      addOns.push(row('Water-resistant pouch', '1 pouch', 'Keep paper contacts, key documents and medication information together.'));
    }
    if (state.hazards.includes('heat') || seasons.includes('summer')) {
      addOns.push(row('Portable water bottles', 'For each person', 'Use for travel or while getting to a cooled location. Count filled bottles toward the water target.'));
    }
    if (['tsunami', 'lahar'].some(hazard => state.hazards.includes(hazard) && !state.notNeeded['hazard-' + hazard])) {
      addOns.push(row('Printed local evacuation maps', '1 copy per grab bag', 'Mark the routes to high ground or out of the mapped hazard zone for the coastal or volcanic risks you selected.'));
    }
    if (state.hazards.includes('fire')) {
      addOns.push(row('Smoke preparation supplies', 'As applicable', 'Check your portable air cleaner filter size and stock a replacement if you use one.'));
    }
    if (state.commsGoal === 'nearby') {
      addOns.push(row('Matching FRS walkie-talkies', '2 to start', 'One per separated group. Choose compatible models and check batteries or charging cables.'));
    }
    if (state.commsGoal === 'town' || state.commsGoal === 'remote') {
      addOns.push(row('Two-way communication backup', 'Verify first', 'Use the planned communication setup to check range or service and compatibility before buying equipment.'));
    }
    if (days >= 14) {
      addOns.push(row('Backup sanitation supplies', '1 setup', 'Set aside suitable toilet or waste supplies for a plumbing outage. Check safe disposal options.'));
    }
    if (days >= 30) {
      addOns.push(row('Replacement supplies', 'For your gear', 'List the batteries, filters and other consumables your equipment actually uses. Store extras according to the product instructions.'));
    }
    if (state.customPower) {
      const target = power.target === null ? 'Measure first' : `${fmt(power.target)} Wh`;
      const detail = power.target === null
        ? 'Enter the daily energy for each critical device before comparing stations.'
        : `Nominal capacity estimate for ${fmt(state.powerHours, 1)} hours without solar. Check continuous watts, startup surge, connectors and tested runtime before buying.`;
      addOns.push(row('Portable power station', target, detail));
      if (state.solarWatts > 0) addOns.push(row('Compatible solar panels', `${fmt(state.solarWatts)} W entered`, 'This is the panel size you entered for comparison. Confirm the station input limits and the expected daily recharge.'));
    }
    return { essentials, addOns };
  }

  const api = { makeList };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyShopping = api;
})(globalThis);
