/* Medical planning data shared by the planner, shopping lists and PDF. */
(function (root) {
  const REVIEWED = 'November 18, 2026';
  const LEVELS = { beginner: 'Beginner', intermediate: 'Advanced', advanced: 'Expert' };
  const SOURCES = {
    cdc: { label: 'CDC prescriptions', url: 'https://www.cdc.gov/prepare-your-health/take-action/prescriptions.html' },
    fda: { label: 'FDA disaster medicines', url: 'https://www.fda.gov/drugs/emergency-preparedness-drugs/safe-drug-use-after-natural-disaster' },
    antibiotics: { label: 'CDC antibiotics', url: 'https://www.cdc.gov/antibiotic-use/about/' },
    pharmacy: { label: 'FDA pharmacy checks', url: 'https://www.fda.gov/drugs/besaferx-your-source-online-pharmacy-information/locate-state-licensed-online-pharmacy' },
    otc: { label: 'NIH OTC medicines', url: 'https://medlineplus.gov/ency/article/002208.htm' },
    diarrhea: { label: 'NIH diarrhea care', url: 'https://medlineplus.gov/diarrhea.html' },
    redcross: { label: 'Red Cross first aid', url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps' },
    bleed: { label: 'ACS Stop the Bleed', url: 'https://www.stopthebleed.org/get-trained/' },
    bleedShop: { label: 'ACS kit contents', url: 'https://www.stopthebleed.org/shop/' },
    children: { label: 'FDA children’s medicines', url: 'https://www.fda.gov/consumers/consumer-updates/should-you-give-kids-medicine-coughs-and-colds' },
    baby: { label: 'AAP infant fever', url: 'https://www.healthychildren.org/english/health-issues/conditions/fever/Pages/Fever-and-Your-Baby.aspx' },
    pulse: { label: 'FDA pulse oximeters', url: 'https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters' },
    bp: { label: 'AHA home monitoring', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home' },
    dental: { label: 'ADA dental emergencies', url: 'https://www.mouthhealthy.org/all-topics-a-z/dental-emergencies' },
    pets: { label: 'AVMA pet first aid', url: 'https://www.avma.org/resources/pet-owners/emergencycare/pet-first-aid-basic-procedures' }
  };
  const PROVIDERS = [
    {
      name: 'JaseCase', price: 'From $289.95 USD', url: 'https://jase.com/products/jase-case',
      detail: 'Lists five antibiotics plus nausea, diarrhea, pain and skin/inflammation medicines, subject to prescription review. Includes medication reference cards. A separate KidCase is offered.',
      check: 'Confirm eligibility, follow-up access, final contents and bag availability. Routine medication reserves use a separate JaseDaily service.'
    },
    {
      name: 'Prepare Medical (US)', price: '$279.99 / $419.99 / $599.99 USD', url: 'https://www.preparemedical.com/en-us',
      detail: 'Essential, Essential Plus and All Inclusive list 8, 13 and 20 medicines. US site describes US doctor review, US pharmacy dispensing, a printed guide and 12 months of support.',
      check: 'Use the US offering. The entry kit lists antibiotics, antiviral medicines and symptom relief. Extra medicines and eligibility vary after review; confirm the final quote.'
    },
    {
      name: 'Contingency Medical Ready Pack Plus', price: '$299.99 USD', url: 'https://contingencymedical.com/product/ready-pack-plus/',
      detail: 'Lists five antibiotics, ondansetron and loperamide, physician review, US pharmacy dispensing and one year of prescribing-physician access.',
      check: 'Listed contents may change with medical history. Refills cost extra. Confirm eligibility, support renewal and replacement costs.'
    }
  ];

  const clean = (value, max = 100) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const parsed = new Date(value + 'T12:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : '';
  }
  function normalize(input) {
    return {
      medicalSave: input.medicalSave === true,
      medicalInclude: input.medicalInclude === true,
      medicalDental: input.medicalDental === true,
      medicalPets: input.medicalPets === true,
      medicalBleeding: input.medicalBleeding === true,
      medicalChest: input.medicalChest === true,
      medicalTrainingDate: date(input.medicalTrainingDate),
      medicalReview: date(input.medicalReview),
      medicalInventory: Array.isArray(input.medicalInventory) ? input.medicalInventory.slice(0, 40).map(item => ({
        member: clean(item?.member, 30),
        name: clean(item?.name, 100),
        kind: ['rx', 'otc', 'supply', 'pet'].includes(item?.kind) ? item.kind : 'rx',
        strength: clean(item?.strength, 60),
        quantity: clean(item?.quantity, 60),
        expires: date(item?.expires),
        refill: date(item?.refill),
        storage: clean(item?.storage, 180)
      })) : []
    };
  }
  function forStorage(state) {
    return { ...state, medicalInventory: state.medicalSave ? state.medicalInventory : [] };
  }
  function forBackup(state) {
    return { ...state, medicalInventory: state.medicalInclude ? state.medicalInventory : [] };
  }
  function reminders(state, today = new Date()) {
    const local = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const due = value => {
      if (!value) return null;
      const [year, month, day] = value.split('-').map(Number);
      return Math.round((new Date(year, month - 1, day) - local) / 86400000);
    };
    const alerts = [];
    for (const [index, item] of state.medicalInventory.entries()) {
      const label = item.name || 'Inventory row ' + (index + 1);
      for (const [field, event] of [['refill', 'Refill/review'], ['expires', 'Expiration']]) {
        const remaining = due(item[field]);
        if (remaining !== null && remaining <= 30) alerts.push({
          label, detail: remaining < 0 ? event + ' date has passed (' + item[field] + ').' :
            remaining === 0 ? event + ' is today.' : event + ' in ' + remaining + ' days (' + item[field] + ').'
        });
      }
    }
    const review = due(state.medicalReview);
    if (review !== null && review <= 30) alerts.push({ label: 'Household stock review', detail: review < 0 ? 'Your review date has passed.' : 'Review by ' + state.medicalReview + '.' });
    return alerts;
  }
  const row = (id, item, target, detail, cost = '', url = '', optional = false) => ({
    id, item, target, detail, cost, url, optional, have: null, need: null
  });
  const tip = (label, detail) => ({ label, detail });
  const page = (banner, title, lead, rows, tips, references) => ({ banner, title, lead, tableTitle: 'What to have or arrange', rows, tips, references });

  function firstAidPage(state) {
    const kits = Math.ceil((state.adults + state.children + state.infants) / 4);
    const aidRow = (item, target, detail) => row('med-aid-' + item.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50), item, target, detail);
    const sheet = {
      banner: 'FIRST AID',
      title: 'Check your first aid kit',
      lead: 'Count your supplies before buying. These quantities use one Red Cross family-of-four starter kit per four people, rounded up. Compare dressings and gloves individually against a packaged kit’s contents.',
      tableTitle: 'Items to count in the kit',
      rows: [
        aidRow('Adhesive bandages', '25 assorted', 'Small, medium and larger sizes for assorted cuts and scrapes.'),
        aidRow('Sterile gauze pads', '5 each', 'Choose individually wrapped sterile pads in both 3 × 3 in. and 4 × 4 in. sizes.'),
        aidRow('Absorbent dressings', '2 dressings', 'Look for large absorbent pads, about 5 × 9 in.'),
        aidRow('Cloth medical tape and gauze rolls', '1 tape + 2 rolls', 'Use cloth medical tape and gauze rolls in 3 in. and 4 in. widths.'),
        aidRow('Nonlatex disposable gloves', '2 pairs', 'Choose a size that fits the people likely to use them.'),
        aidRow('Triangular bandages', '2 bandages', 'Look for individually packaged triangular cloth bandages.'),
        aidRow('Wound irrigation supplies', '1 setup', 'Sealed wound-wash saline or safe clean water, mild soap and a needle-free irrigation syringe if trained. Use product instructions. Deep, dirty or gaping wounds need clinical assessment.'),
        aidRow('Antiseptic wipes', '5 packets', 'Check the seal and expiration. Use products according to their labels.'),
        aidRow('Cold pack, emergency blanket, CPR barrier', '1 of each', 'Choose an instant cold pack and a breathing barrier with a one-way valve.'),
        aidRow('Tools and instructions', '1 of each', 'Digital thermometer, tweezers, blunt-tip scissors and a printed first aid guide.')
      ],
      tips: [
        { label: 'Shopping budget', detail: 'Allow roughly $35–60 per starter kit. Add nonstick pads, saline and refills as needed. This range is a planning allowance.' },
        { label: 'Keep it ready', detail: 'Store where adults can reach it. Replace used or expired supplies and take first aid training.' +
          (state.experience !== 'beginner' ? ' Keep a contents/expiry list and dressing refills.' : '') +
          (state.experience === 'advanced' ? ' Stage compact kits at work or in vehicles as appropriate, checking storage temperatures.' : '') }
      ],
      references: [
        { label: 'American Red Cross first aid kit', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/anatomy-of-a-first-aid-kit.html' },
        { label: 'NIH wound care', url: 'https://medlineplus.gov/ency/patientinstructions/000741.htm' }
      ]
    };
    const quantities = {
      'Adhesive bandages': (25 * kits) + ' assorted',
      'Sterile gauze pads': (5 * kits) + ' each size',
      'Absorbent dressings': (2 * kits) + ' dressings',
      'Cloth medical tape and gauze rolls': kits + ' tape + ' + (2 * kits) + ' rolls',
      'Nonlatex disposable gloves': (2 * kits) + ' pairs minimum',
      'Triangular bandages': (2 * kits) + ' bandages',
      'Antiseptic wipes': (5 * kits) + ' packets',
      'Cold pack, emergency blanket, CPR barrier': kits + ' of each'
    };
    sheet.rows = sheet.rows.map(item => ({ ...item, target: quantities[item.item] || item.target }));
    sheet.highlight = kits + ' starter kit' + (kits === 1 ? '' : 's') + ' for this household. Add consumables for longer plans and known use.';
    return sheet;
  }

  function worksheets(state) {
    const expert = state.experience === 'advanced';
    const expanded = state.experience !== 'beginner';
    const people = state.adults + state.children + state.infants;
    const kits = Math.ceil(people / 4);
    const reserve = expert ? '30 days where feasible' : '14–30 days where feasible';
    const result = [
      firstAidPage(state),
      page('MEDICAL ESSENTIALS', 'Everyday medicines and hydration',
        'Choose one suitable product per need after a pharmacist checks your household’s medicines, conditions and allergies. Adult examples below are for adults. One small original pack per chosen product is a starter purchase, never a daily-use target.',
        [
          row('med-pain', 'Adult pain and fever relief', '1 suitable original pack', 'Examples are single-ingredient acetaminophen or ibuprofen. Ask which is safe with liver or kidney disease, ulcers, blood thinners, pregnancy or dehydration. Check duplicate ingredients.', '$4–12 planning allowance'),
          row('med-allergy', 'Adult allergy relief', '1 suitable original pack', 'Ask about a familiar option such as cetirizine or loratadine. Check sedation and interactions. Prescribed epinephrine is the severe-allergy rescue plan.', '$5–15 planning allowance'),
          row('med-hydration', 'Oral rehydration solution (ORS)', kits + ' small packs to start', 'Choose pharmacy oral rehydration salts or ready-to-drink solution, such as Pedialyte or an equivalent. Mix with exactly the water quantity on the packet. Discuss fluid restrictions with the care team.', '$5–15 per pack allowance'),
          row('med-nausea', 'Adult nausea plan', 'Ask before buying', 'For motion sickness, a pharmacist may suggest dimenhydrinate or meclizine. These may cause drowsiness and are not a general treatment for unexplained vomiting. Ondansetron needs a prescription.', '$5–15 allowance if suitable'),
          row('med-diarrhea', 'Adult diarrhea option', '1 pack if approved', 'Loperamide is an example for a pharmacist to review. Fever, blood in stool, severe pain or dehydration need medical advice. Never exceed the label or use adult products for a child.', '$4–12 planning allowance'),
          row('med-constipation', 'Adult constipation option', '1 pack if approved', 'A pharmacist may suggest polyethylene glycol 3350. Check label duration and interactions. Severe pain, vomiting or persistent symptoms need assessment.', '$8–20 planning allowance')
        ],
        [tip('Choose a small, usable stock', 'Read Drug Facts, use the supplied measuring tool, and keep products in original labeled packaging out of children’s reach. A longer supply goal does not mean taking these medicines daily. Refill what you use.')],
        [SOURCES.otc, SOURCES.diarrhea, SOURCES.children]),
      page('PRESCRIPTION CONTINUITY', 'Keep regular care available',
        'Start with your existing prescriptions and prescribed rescue medicines. Ask your prescriber and pharmacist about an authorized reserve and early refills. Aim for ' + reserve + ', with the care team’s approval and within dispensing rules.',
        [
          row('med-rx', 'Regular prescription reserve', 'Per person and prescription', 'Write the medicine, strength, quantity and refill date from the label. Ask what reserve is feasible and how to rotate it through normal prescribed use. Never skip doses to create a reserve.', 'Pharmacy quote'),
          row('med-rescue', 'Prescribed rescue medicines', 'As prescribed for each person', 'Examples include an epinephrine auto-injector, inhaler with an appropriate spacer, seizure rescue medicine or prescribed glucagon. Check expiration and keep the written action plan with them.', 'Prescription-dependent'),
          row('med-inventory', 'Medication list and refill plan', '1 private list + carry copy', 'Use the inventory below or download a blank template. Keep pharmacy and care-team contacts with your private records. A caregiver should know where the medicines and instructions are.'),
          ...(state.medical ? [row('med-cold', 'Medication and device backup', 'Device/product-specific', 'Ask about a temperature monitor, insulated carrier, cold packs, spare batteries and consumables. Record manufacturer storage limits and an early relocation threshold. Prevent freezing and ask a pharmacist after a temperature excursion.', '$20–60 carrier/monitor allowance')] : []),
          ...(expanded ? [row('med-rx-kit', 'Optional emergency prescription review', 'Per eligible patient', 'Ask a licensed clinician whether a standby kit fits your health, likely delays and travel. Obtain patient-specific written directions and a way to reach care. Review again when medicines or conditions change.', 'About $280–600+ per kit', 'https://jase.com/products/jase-case', true)] : [])
        ],
        [
          tip('Prescription safety', 'Only use prescription medicines under licensed medical guidance. Never self-prescribe antibiotics, share a kit or use leftover antibiotics. A clinician must assess when a medicine is appropriate; antibiotics do not treat viral colds or flu.'),
          ...(expert ? [tip('Plan continuity across locations', 'Arrange separate labeled carry supplies where legally and clinically appropriate, verify a second pharmacy and backup caregiver, and document transport and temperature limits. Keep a printed copy of the prescriber’s instructions.')] : [])
        ], [SOURCES.cdc, SOURCES.fda, SOURCES.antibiotics]),
      page('MEDICAL TRAINING', 'Skills, equipment and escalation',
        'Build skills before buying specialized equipment. Optional monitoring tools belong in a care plan with an appropriate device, fit, and instructions on when to seek help.',
        [
          row('med-training', 'First aid / CPR / AED training', 'Adults and backup caregivers', 'Book a reputable course, including pediatric care if children are present. Keep the course reference and a printed local emergency contact list.', 'Local course quote', 'https://www.redcross.org/take-a-class'),
          row('med-offline', 'Offline medical reference', '1 accessible printed copy', 'Keep a first aid booklet, medication leaflets and individual rescue instructions. Download relevant guides before an outage and test opening them in airplane mode.'),
          ...(expanded ? [
            row('med-bleed-training', 'ACS Stop the Bleed training', 'At least 1 adult', 'Learn bleeding recognition, pressure, packing and tourniquet use with hands-on practice. Record the training date below. Add gear you have practiced with.', 'Local course quote', SOURCES.bleed.url),
            row('med-bp', 'Upper-arm blood-pressure monitor', '1 if care plan calls for it', 'Choose a validated device with a cuff that fits. OMRON 3 Series BP7150 is a $59.99 MSRP example with an adult cuff. Children need a separately validated device and cuff.', 'Example MSRP $59.99', 'https://omronhealthcare.com/products/3-series-upper-arm-blood-pressure-monitor-bp7150', true),
            row('med-pulse', 'Pulse oximeter', 'Only if useful for your care', 'Ask for a medical-use device suitable for the person. Skin pigmentation, poor circulation, cold fingers and nail polish can affect readings. Symptoms require attention even with a reassuring number.', 'Supplier quote', SOURCES.pulse.url, true),
            row('med-device', 'Condition-specific monitoring supplies', 'Actual routine use + reserve', 'If already used, count glucose strips, sensors, lancets, batteries, charging cables or other supplies for the selected duration. Ask the care team about a compatible backup.', 'Model-specific quote', '', true)
          ] : []),
          ...(expert ? [row('med-redundancy', 'Redundant critical care equipment', 'Match documented care needs', 'Keep spare compatible batteries and consumables where care occurs. Train a second helper, test actual runtime and record what failure triggers relocation.', 'Care-team / supplier quote', '', true)] : [])
        ],
        [tip('When to get help', 'Call 911 for severe breathing difficulty, suspected stroke, chest pain suggestive of a heart attack, unresponsiveness or life-threatening bleeding. Seek urgent care for major trauma, spreading infection, severe dehydration, persistent vomiting or worsening symptoms. A kit or monitor must not delay care.')],
        [SOURCES.redcross, SOURCES.bleed, SOURCES.pulse, SOURCES.bp])
    ];
    if (expanded && state.medicalBleeding) result.push(page('BLEEDING CONTROL', 'Gear matched to your training',
      'You marked bleeding-control training as completed.' + (state.medicalTrainingDate ? ' Reported training date: ' + state.medicalTrainingDate + '.' : '') + ' Confirm that your instruction covered the gear you select. Quantities below are a starter kit per trained responder, with a separate practice device.',
      [
        row('med-tourniquet', 'Genuine C-A-T Gen 7 or equivalent proven tourniquet', (expert ? '2' : '1') + ' per trained responder', 'Buy from the manufacturer or an authorized distributor. C-A-T is an example. Keep a separate training unit; inspect and store operational gear according to its maker.', '$34.99 each listed', 'https://www.narescue.com/combat-application-tourniquet-c-a-t.html'),
        row('med-pressure', 'Pressure dressing and compressed gauze', '1–2 of each per kit', 'Choose sealed trauma dressings and packing gauze covered in your course, with spare nitrile gloves and a marker. Check seals and expiry.', '$15–30 kit allowance', SOURCES.bleedShop.url),
        row('med-hemostatic', 'Hemostatic gauze', '1 per trained responder', 'Choose a recognized product such as QuikClot or Celox from a trusted source and practice with a trainer. Follow the product-specific instructions.', 'From $24.99 listed', 'https://www.narescue.com/quikclot-bleeding-control-dressings.html'),
        row('med-shears', 'Trauma shears', '1 per kit', 'Choose blunt-tip shears that cut clothing; keep them with the bleeding supplies.', '$5–15 planning allowance'),
        ...(expert && state.medicalChest ? [row('med-chest', 'Vented chest seals', '1 twin pack if trained', 'Requires specific chest-injury training and ongoing reassessment. Call emergency services. General first aid or bleeding-control completion alone does not establish this skill.', '$17.99 listed', 'https://www.narescue.com/hyfin-vent-chest-seal-twin-pack.html', true)] : [])
      ], [tip('Practise and restock', 'Document course date and scope, rehearse with training supplies, and replace used or damaged gear. Carry the supplies where the trained responder will be.')],
      [SOURCES.bleedShop, SOURCES.bleed, SOURCES.redcross]));
    if (state.children || state.infants) result.push(page('PEDIATRIC MEDICAL', 'A separate plan for children',
      'Confirm age, current weight, formulation and concentration with the pediatrician or pharmacist for each child. Adult medicines and adult emergency kits are never automatically assigned to children.',
      [
        row('med-child-fever', 'Pediatric pain/fever formulation', 'Per child’s approved plan', 'Ask which product, concentration and label instructions apply. Buy the specifically approved pediatric formulation and its supplied measuring device. Do not calculate a child dose from the adult list.', '$5–12 per suitable bottle allowance'),
        row('med-child-measure', 'Oral syringe and child-appropriate thermometer', '1 compatible set per care location', 'Use a marked mL oral syringe that matches the product; avoid household spoons. Ask which thermometer and method suit the child’s age.', '$8–20 set allowance'),
        row('med-child-ors', 'Pediatric oral rehydration plan', 'Clinician-approved product', 'Ask about ready-to-drink pediatric ORS and how to recognize dehydration. Fewer wet diapers, unusual drowsiness or inability to retain fluids require prompt medical advice.', '$5–15 pack allowance'),
        row('med-child-rescue', 'Child’s prescribed rescue supplies', 'As individually prescribed', 'Keep the exact rescue medicine, spacer or other delivery device and written action plan with the child. Confirm a second caregiver knows the plan.', 'Prescription-dependent')
      ],
      [tip('Get help early', 'For a baby aged 3 months or younger with a rectal temperature of 100.4°F (38°C) or higher, call the pediatrician immediately. For breathing difficulty, unresponsiveness or severe illness, call 911. Ask before giving children nausea, diarrhea, constipation or allergy products.')],
      [SOURCES.children, SOURCES.baby, SOURCES.diarrhea]));
    if (state.medicalDental) result.push(page('OPTIONAL DENTAL', 'Dental supplies and a dentist plan',
      'Optional supplies may help while arranging dental care. Severe swelling, trouble swallowing or breathing, or facial trauma needs urgent evaluation.',
      [row('med-dental', 'Dental travel supplies', '1 small household kit', 'Pack toothbrushes, toothpaste, floss, gauze and a cold pack. Ask the dentist whether a tooth-preservation kit or temporary filling product is appropriate, and follow its instructions.', '$10–30 planning allowance', SOURCES.dental.url, true)],
      [tip('Contact the dentist promptly', 'Save the dentist’s emergency number. A knocked-out permanent tooth needs immediate dental attention. Keep the ADA instructions offline. Never apply aspirin directly to gums or perform home extractions.')], [SOURCES.dental]));
    if (state.pets && state.medicalPets) result.push(page('OPTIONAL PET MEDICAL', 'A veterinary plan for each animal',
      'Ask your veterinarian to match supplies to each animal and species. Human medicines can harm animals; use veterinary instructions.',
      [row('med-pets', 'Veterinary first aid and prescription reserve', 'Per animal’s plan', 'Pack gauze, nonstick pads, bandage material, gloves, a suitable carrier/restraint, usual prescribed medicines and vet contacts. Confirm any thermometer, temperature-sensitive medicine or enclosure-power backup with the vet.', '$20–50 supplies allowance', SOURCES.pets.url, true)],
      [tip('Keep veterinary instructions separate', 'Record the emergency veterinary location and usual vet’s number on paper. A pet reserve is prescribed for that animal. Do not substitute a household antibiotic or painkiller.')], [SOURCES.pets]));
    result.push(page('PRESCRIPTION SERVICES', 'Compare optional prescription services',
      'These services arrange advance prescriptions after a health review, with dispensing through pharmacy partners. The benefit is having approved medicines and instructions before access is disrupted. Stock requires review, rotation and replacement.',
      PROVIDERS.map((provider, index) => row('provider-' + index, provider.name, provider.price, provider.detail + ' ' + provider.check, '', provider.url, true)),
      [
        tip('Before paying', 'Confirm state availability, patient age, clinician and dispensing-pharmacy licensing, allergies/interactions, exact contents, shipping, follow-up and refill costs. One patient’s kit does not cover the household. Listed prices are examples checked ' + REVIEWED + '; taxes, add-ons and availability vary.'),
        tip('Agree on how to use it', 'Get a licensed clinician’s patient-specific written plan and contact route. Stocking medicine does not authorize self-diagnosis or self-prescribing. A kit does not provide emergency transport or replace regular prescriptions or emergency care.')
      ], [...PROVIDERS.map(provider => ({ label: provider.name.replace(' (US)', '').replace(' Ready Pack Plus', ''), url: provider.url })), SOURCES.pharmacy]));
    return result;
  }
  function tasks(state) {
    const result = worksheets(state).filter(sheet => sheet.banner !== 'PRESCRIPTION SERVICES')
      .flatMap(sheet => sheet.rows).map(item => ({ id: item.id, cat: 'Medical', title: item.item, detail: item.target + '. ' + item.detail }));
    return result;
  }
  function printableSheets(state) {
    return worksheets(state).map(sheet => ({
      ...sheet,
      rows: sheet.rows.map(item => {
        const skipped = state.notNeeded[item.id] === true;
        return {
          ...item,
          target: skipped ? 'Not needed' : item.target,
          detail: (skipped ? 'Marked Not needed. ' : state.checked[item.id] ? 'Marked Done. ' : '') +
            (item.optional ? 'Optional. ' : '') + item.detail + (item.cost ? ' Budget: ' + item.cost + '.' : '')
        };
      })
    }));
  }
  const api = { REVIEWED, LEVELS, SOURCES, PROVIDERS, date, normalize, forStorage, forBackup, reminders, worksheets, tasks, printableSheets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyMedical = api;
})(globalThis);
