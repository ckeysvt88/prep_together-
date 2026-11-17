/* Printable shopping worksheets. Targets are planning examples, not treatment instructions. */
(function (root) {
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
      title: '01  Food to buy',
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
        { label: 'Build each day', detail: 'Breakfast: cereal and milk. Lunch: crackers, protein and fruit. Dinner: a main and vegetables. Add snacks and adjust quantities to what everyone normally eats.' },
        { label: 'Read labels before you buy', detail: `Count usable portions per package, then round up to whole packages. Example: ${starter} portions with 3 usable portions per package means ${perDay} packages. Check which products are ready to eat and use small packs you can finish after opening.` },
        { label: remainingDays > 0 ? 'Build the rest of your pantry' : 'Keep it safe', detail: `Keep a manual can opener. Skip leaking, swollen or badly dented cans. Use safely stored water for any food that needs it.${longerTip}${infantNote}` }
      ],
      references: [
        { label: 'USDA emergency foods', url: 'https://ask.fsis.usda.gov/article/What-foods-should-I-keep-in-my-house-for-emergencies' },
        { label: 'USDA damaged cans', url: 'https://ask.fsis.usda.gov/article/Is-food-in-damaged-cans-dangerous' },
        ...(state.infants ? [{ label: 'CDC infant feeding', url: 'https://www.cdc.gov/infant-feeding-emergencies-toolkit/php/faqs.html' }] : [])
      ]
    };
  }

  function firstAidPage() {
    return {
      banner: 'FIRST AID',
      title: '02  Check your first aid kit',
      lead: 'Start with one household kit. Open it and count the useful items before buying refills. The quantities below use the Red Cross family-of-four list as a starting point.',
      tableTitle: 'Items to count in the kit',
      rows: [
        row('Adhesive bandages', '25 assorted', 'Small, medium and larger sizes for assorted cuts and scrapes.'),
        row('Sterile gauze pads', '5 each', 'Five 3 × 3 in. pads and five 4 × 4 in. pads. Keep them individually wrapped.'),
        row('Absorbent dressings', '2 dressings', 'Look for large absorbent pads, about 5 × 9 in.'),
        row('Cloth medical tape and gauze rolls', '1 tape + 2 rolls', 'One roll of medical tape and one gauze roll in each width, 3 in. and 4 in.'),
        row('Nonlatex disposable gloves', '2 pairs', 'Choose a size that fits the people likely to use them.'),
        row('Triangular bandages', '2 bandages', 'Look for individually packaged triangular cloth bandages.'),
        row('Antiseptic wipes', '5 packets', 'Check the seal and expiration. Use products according to their labels.'),
        row('Cold pack, emergency blanket, CPR barrier', '1 of each', 'Choose an instant cold pack and a breathing barrier with a one-way valve.'),
        row('Tools and instructions', '1 of each', 'Digital thermometer, tweezers, blunt-tip scissors and a printed first aid guide.')
      ],
      tips: [
        { label: 'At the store', detail: 'Compare the contents list on the box with these rows. Count the dressings and gloves separately. Kits can reach a high piece count with mostly small bandages.' },
        { label: 'Set it up at home', detail: 'Keep the kit where an adult can reach it quickly. Check seals and expiration dates, replace used supplies, and practice basic first aid with a reputable course.' }
      ],
      references: [
        { label: 'American Red Cross first aid kit', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/anatomy-of-a-first-aid-kit.html' },
        { label: 'CDC personal needs', url: 'https://www.cdc.gov/prepare-your-health/take-action/personal-needs.html' }
      ]
    };
  }

  function medicinePage(state) {
    return {
      banner: 'MEDICINES AND CARE',
      title: '03  Medicines and care supplies',
      lead: 'Start with what your household already uses. Check refill dates and product labels. Take this page to the pharmacy and ask what is safe and appropriate for your household.',
      tableTitle: 'What to check or ask for',
      rows: [
        row('Daily prescriptions', 'Confirm supply', 'Bring a list of the names, strengths, schedules and allergies. Ask the pharmacist how to arrange a permitted reserve.'),
        row('Prescribed rescue medicines', 'If prescribed', 'Check the expiration and supply of items you already rely on, such as an inhaler or epinephrine auto-injector.'),
        row('Pain or fever medicine', 'If appropriate', 'Ask which single-ingredient option suits each person, such as acetaminophen or ibuprofen. Check the Drug Facts label.'),
        row('Allergy medicine', 'If appropriate', 'Ask about the antihistamine you normally use, its age limits and interactions. Follow your prescribed allergy action plan.'),
        ...(state.children || state.infants ? [
          row('Child medicine and measuring tool', 'If appropriate', 'Ask for the correct product and strength for the child. Keep the syringe or cup supplied with it.'),
        ] : []),
        row('Device supplies and spares', 'If used', 'Check exact sizes or models for meter strips, hearing-aid batteries, tubing, chargers or other regular consumables.'),
        row('Storage and transport', 'Check labels', 'Use original labeled containers. Ask how to protect any refrigerated medicine during a power outage.')
      ],
      tips: [
        { label: 'Ask at the pharmacy', detail: 'What can I refill before it runs out? Which nonprescription products fit our ages, conditions and current medicines? Are any active ingredients duplicated?' },
        { label: 'Write down the outage plan', detail: 'Keep pharmacy and care-team numbers with your private medication list. For cold storage or powered equipment, confirm the product limits, supplies and a backup location with your care team.' }
      ],
      references: [
        { label: 'FDA safe drug use after disasters', url: 'https://www.fda.gov/drugs/emergency-preparedness-drugs/safe-drug-use-after-natural-disaster' },
        { label: 'CDC prescription preparedness', url: 'https://www.cdc.gov/prepare-your-health/take-action/prescriptions.html' }
      ]
    };
  }

  function worksheets(state, supplies) {
    return [foodPage(state, supplies), firstAidPage(), medicinePage(state)];
  }

  const api = { worksheets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyShoppingDetails = api;
})(globalThis);
