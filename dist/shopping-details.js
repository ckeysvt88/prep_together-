/* Printable shopping worksheets. Targets are planning examples, not treatment instructions. */
(function (root) {
  const G = typeof module !== 'undefined' && module.exports ? require('./buying-guide.js') : root.ReadyBuyingGuide;
  const M = typeof module !== 'undefined' && module.exports ? require('./medical.js') : root.ReadyMedical;
  const number = amount => Number(amount).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const row = (item, target, detail) => ({ item, target, detail, have: null, need: null });

  function foodPage(state, supplies) {
    const eaters = state.adults + state.children;
    const starter = number(eaters * 3);
    const perDay = number(eaters);
    const beginner = state.experience === 'beginner';
    const gap = beginner ? `${number(supplies.simpleFoodGapDays)} household meal-days` : `${number(supplies.foodGap)} kcal`;
    const belowTarget = beginner ? supplies.simpleFoodGapDays > 0 : supplies.foodGap > 0;
    const remainingDays = supplies.days - 3;
    const infantNote = state.infants
      ? ' For formula-fed infants, CDC recommends ready-to-feed formula in an emergency. Follow their usual feeding plan and the package instructions.'
      : '';
    const longerTip = remainingDays > 0
      ? ` Stock ${remainingDays} more household-days for the full ${supplies.days}-day target. Add a rotation of foods you already use. Add dry rice, pasta or oats for meals only when you have safe water and a safe cooking setup.`
      : '';
    return {
      banner: 'FOOD SHOPPING',
      title: 'Your three-day grocery basket',
      lead: `Start with this 3-day no-cook basket for ${eaters} ${eaters === 1 ? 'person eating' : 'people eating'} solid food. Choose normal portions and familiar foods that fit your household's allergies and dietary needs.`,
      highlight: belowTarget ? `Your ${supplies.days}-day plan still needs ${gap}. Use the basket as an example and subtract what you already have.` : `Your reported food covers the ${supplies.days}-day target. Use the basket to check variety and find no-cook meals.`,
      tableTitle: 'Three-day grocery basket',
      rows: [
        row('Cereal + shelf-stable milk', `${starter} each`, 'Dry cereal and milk cartons marked shelf-stable or a suitable shelf-stable alternative.'),
        row('Crackers or crispbread', `${starter} portions`, 'Choose a familiar, safe option to serve with the lunch protein.'),
        row('Ready-to-eat lunch protein', `${starter} portions`, `Try ${perDay} portions each of canned chicken, a safe nut or seed butter, and ready-to-eat beans or fish.`),
        row('Ready-to-eat dinner main', `${starter} portions`, 'Choose canned chili, bean stew or another ready-to-eat meal with protein.'),
        row('Fruit cups or canned fruit', `${starter} portions`, 'One side with each lunch. Try applesauce, peaches or pears.'),
        row('Canned vegetables', `${starter} portions`, 'One side with each dinner. Try peas, carrots or green beans.'),
        row('Shelf-stable snacks', `${starter} to start`, 'One planned snack per person per day. Try bars or age-appropriate dried fruit.')
      ],
      tips: [
        { label: 'Read labels before you buy', detail: `Count usable portions per package, then round up to whole packages. Example: ${starter} portions with 3 usable portions per package means ${perDay} packages. Check which products are ready to eat and use small packs you can finish after opening.` },
        ...(state.experience !== 'beginner' ? [{ label: 'Check the full menu', detail: 'Compare the package calories for a complete day against your plan. Keep a second ready-to-eat main and a protein swap that work for your dietary needs.' }] : []),
        ...(state.experience === 'advanced' ? [{ label: 'Test one pantry day', detail: 'Eat a day from the pantry and log portions, water used, cooking time and leftovers. For longer plans, keep a stock list with servings per package, open-by dates and a substitute for each staple.' }] : []),
        { label: remainingDays > 0 ? 'Build the rest of your pantry' : 'Keep it safe', detail: `Keep a manual can opener. Skip leaking, swollen or badly dented cans. Use safely stored water for any food that needs it.${longerTip}${infantNote}` }
      ],
      references: [
        { label: 'USDA emergency foods', url: 'https://ask.fsis.usda.gov/article/What-foods-should-I-keep-in-my-house-for-emergencies' },
        { label: 'USDA damaged cans', url: 'https://ask.fsis.usda.gov/article/Is-food-in-damaged-cans-dangerous' },
        ...(state.infants ? [{ label: 'CDC infant feeding', url: 'https://www.cdc.gov/infant-feeding-emergencies-toolkit/php/faqs.html' }] : [])
      ]
    };
  }

  function worksheets(state, supplies, power, seasons) {
    return [
      G.foodBasics(), foodPage(state, supplies), G.waterPage(state, supplies),
      ...M.printableSheets(state), G.powerPage(state, supplies, power), G.communicationPage(state),
      G.evacuationPage(state), G.hazardPage(state, seasons), G.householdPage(state, supplies), G.vehiclePage(state, seasons)
    ].filter(Boolean);
  }

  const api = { worksheets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyShoppingDetails = api;
})(globalThis);
