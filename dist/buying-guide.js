/* Practical buying and setup guidance shared by the website and PDF. */
(function (root) {
  const fmt = (value, places = 0) => Number(value).toLocaleString('en-US', { maximumFractionDigits: places });
  const row = (item, target, detail) => ({ item, target, detail, have: null, need: null });
  const tip = (label, detail) => ({ label, detail });
  const source = (label, url) => ({ label, url });
  const redCross = source('Red Cross survival kit', 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html');
  const cdcNeeds = source('CDC personal needs', 'https://www.cdc.gov/prepare-your-health/take-action/personal-needs.html');

  function foodBasics() {
    return {
      banner: 'FOOD BASICS', title: 'How to choose emergency food',
      lead: 'Shelf-stable means the unopened package can sit in a normal kitchen cupboard as directed. For the first three days, choose foods you can also eat without a stove, microwave or refrigerator.',
      highlight: 'Check the package twice: Can I store it unopened at room temperature? Can I eat it as-is without adding water or cooking?',
      tips: [
        tip('Start in the canned food aisle', 'Look for canned chicken or fish, cooked beans, ready-to-eat chili or stew, canned vegetables, and fruit cups or canned fruit. Choose products you already like. A pull tab is handy, and a manual can opener covers cans without one.'),
        tip('Add grains, spreads and snacks', 'Pick dry cereal, crackers or crispbread, a familiar nut or seed spread if safe for your household, and age-appropriate snacks. For milk, look for cartons that say shelf-stable before opening, usually sold outside the refrigerated case.'),
        tip('Read the storage line', '“Keep refrigerated” means it needs cold storage even when sealed. “Refrigerate after opening” means the sealed food may go in the pantry if the label allows it. Buy smaller containers you can finish at one meal if the leftovers would need a fridge.'),
        tip('Recognize foods that still need preparation', 'Dry pasta, uncooked rice, dried beans, instant noodles and many freeze-dried meals can sit in the pantry. Save them for meals where you have safe water and a safe way to cook or rehydrate as directed. Check pouches for “ready to eat” or directions that make heating optional.'),
        tip('Build an actual meal', 'Pair a protein or main dish with a grain, fruit or vegetables, and add food to match normal portions. Try chicken and crackers with a fruit cup, or canned bean chili and green beans. Choose textures and ingredients that are safe for the people eating them.'),
        tip('Put the groceries away', 'Store sealed packages in a cool, dry place. Rotate older items into normal meals and replace them. Leave leaking, bulging or badly dented cans on the shelf. If the power is out, use the federal cold-food chart to decide what to discard and never taste food to test it.')
      ],
      menu: [
        { day: 'Day 1', lunch: 'Canned chicken, crackers and applesauce', dinner: 'Ready-to-eat canned chili and green beans' },
        { day: 'Day 2', lunch: 'Safe seed or nut spread, crackers and pears', dinner: 'Ready-to-eat beef or bean stew and carrots' },
        { day: 'Day 3', lunch: 'Cooked bean or fish pouch, crackers and peaches', dinner: 'Ready-to-eat lentil soup and peas' }
      ],
      references: [
        source('USDA shelf-stable foods', 'https://ask.fsis.usda.gov/article/What-does-shelf-stable-mean'),
        source('USDA emergency groceries', 'https://ask.fsis.usda.gov/article/What-foods-should-I-keep-in-my-house-for-emergencies'),
        source('Federal outage food chart', 'https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage')
      ]
    };
  }

  function waterPage(state, supplies) {
    const detailed = state.experience !== 'beginner';
    const gap = fmt(supplies.waterGap, 2);
    const jugs = Math.ceil(Number(supplies.waterGap.toFixed(8)));
    return {
      banner: 'WATER AND HYGIENE', title: 'Water and cleanup supplies',
      lead: 'Put safe water on a low shelf where you can lift it. Use sealed bottles from the grocery aisle or containers designed to store drinking water.',
      highlight: `Your ${supplies.days}-day target is ${fmt(supplies.water, 2)} gallons. You reported ${fmt(state.storedWater, 2)} gallons on hand.`,
      tableTitle: 'What to get',
      rows: [
        row('Bottled drinking water', jugs ? `${jugs} one-gallon jugs` : 'Target covered', jugs ? `You still need ${gap} gallons. Smaller sealed bottles are easier to lift. Any combination that adds up to the target works.` : 'Check that the containers are sealed and stored safely.'),
        row('Food-grade water container', 'Optional alternative', 'If filling your own, look for a tightly closing container sold for drinking water. Use the CDC cleaning and filling steps.'),
        row('Handwashing supplies', '1 household setup', 'Get soap, paper towels and a way to pour safe water. Set them together where everyone can reach them.'),
        row('Bathroom supplies', `${supplies.days} days`, 'Count normal use of toilet paper, personal wipes, menstrual products or incontinence supplies. Use a normal day multiplied by your goal.'),
        row('Trash bags and ties', '1 pack to start', 'Choose sturdy liners that fit your household bin. Keep your local waste disposal instructions nearby.'),
        row('Cleanup supplies', '1 kit', 'Set aside dish soap, towels, and a household cleaner you know how to use. Follow its label.'),
        ...(detailed ? [row('Water transfer and storage', '1 pour setup', 'Split the supply into liftable containers. Use a clean spout or a dedicated pour container, and label the fill dates.')] : []),
        ...(state.experience === 'advanced' && supplies.days >= 14 ? [row('Backup drinking-water source', 'Verify a second source', 'Before buying treatment gear, identify the likely contamination and follow local guidance. Plan where to obtain safe water when treatment is unsuitable.')] : [])
      ],
      tips: [
        tip('Use your safe supply first', 'Set aside safe water for drinking, food preparation and brushing teeth. Store it away from heat, fuel and chemicals. For water you fill yourself, write the fill date and replace it every six months.'),
        tip('If tap water is unsafe', 'Follow the local notice. Boiling and ordinary filters do not make chemically contaminated water safe. Use bottled water or another source your local health department says is safe. A filter does not count toward gallons stored.')
      ],
      references: [
        source('CDC store emergency water', 'https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html'),
        source('CDC make water safe', 'https://www.cdc.gov/water-emergency/about/'),
        redCross
      ]
    };
  }

  function powerPage(state, supplies, power) {
    return {
      banner: 'LIGHTS AND BACKUP POWER', title: 'Lights and power that work',
      lead: 'Start with the things you can test today. Put lights where you sleep and make sure your phone can plug into the charger you buy.',
      tableTitle: 'What to get and test',
      rows: [
        row('LED flashlights or headlamps', `${supplies.people} lights`, 'One per person, with adults managing children’s lights. A headlamp keeps both hands free.'),
        row('Fresh matching batteries', '2 sets per light', 'Read the battery compartment for AA, AAA or another size and how many it uses. Check the weather radio separately.'),
        ...(state.phones ? [
          row('USB power bank', `${state.phones} ${state.phones === 1 ? 'bank' : 'banks'}`, 'Start with one per phone. Test the number of usable charges on your actual phone and plan where to recharge the bank.'),
          row('Charging cables', `${state.phones} ${state.phones === 1 ? 'cable' : 'cables'}`, 'Match the power bank output and phone port. Bring the cable you already use to compare USB-C or Lightning ends.')
        ] : []),
        ...(state.experience !== 'beginner' ? [
          row('Plug-in energy meter', '1 meter if needed', 'Check that it is rated for your devices. Measure watt-hours over a typical day. Repeat under hot or cold conditions when loads change.')
        ] : []),
        ...(state.customPower ? [
          row('Portable power station', power.target == null ? 'Measure first' : `${fmt(power.target)} Wh`, 'Use the load calculator for the devices you selected. Confirm AC output and startup watts, cable compatibility, and actual runtime before buying.'),
          ...(state.solarWatts > 0 ? [
            row('Compatible solar panels', `${fmt(state.solarWatts)} W entered`, 'Check your station manual for panel voltage, current and connectors. Test recharge in the weather and season you are preparing for.')
          ] : [])
        ] : []),
        ...(state.experience === 'advanced' && state.customPower ? [
          row('Second charging path', '1 tested fallback', 'Check the station’s wall or vehicle charging cable and input limits. Write down how long a refill takes and where you can recharge during an outage.')
        ] : [])
      ],
      tips: [
        tip('Run a five-minute test', 'Install batteries, then check every light. Charge your bank, unplug it from the wall and confirm the phone starts charging. Store the working cable with the charged bank.'),
        ...(state.experience === 'advanced' ? [tip('Check the station before relying on it', 'Compare continuous AC watts, startup surge, usable watt-hours and charging limits. Test for low-load shutoff, restart and recharging while a critical load is running.')] : []),
        tip('Use the right kind of backup', 'A phone bank is for small electronics. For heaters, refrigerators or powered care devices, check the appliance, battery system and backup location separately. Keep fuel-powered generators outdoors at least 20 feet from doors, windows and vents.')
      ],
      references: [
        source('CDC emergency power supplies', 'https://www.cdc.gov/prepare-your-health/take-action/power-sources.html'),
        source('CDC outage safety', 'https://www.cdc.gov/natural-disasters/response/what-to-do-protect-yourself-during-a-power-outage.html')
      ]
    };
  }

  function communicationPage(state) {
    const extras = [];
    if (state.commsGoal === 'nearby') {
      extras.push(row('Matching FRS walkie-talkies', '2 to start', 'For nearby two-way voice. Start with one per group. Match the channel and test the actual places you will be.'));
    }
    if (state.commsGoal === 'town') {
      if (state.experience === 'beginner') {
        extras.push(row('Across-town backup', 'Test before buying', 'Ask a local radio group about available options. Make a test call from the actual locations before buying hardware. Range varies with buildings and terrain.'));
      } else {
        extras.push(row('FCC-certified GMRS handhelds', '2 if GMRS fits', 'Choose matching radios, included chargers, and repeater capability where available. Confirm licensing, who may operate, and repeater access before buying.'));
      }
      if (state.experience === 'advanced') {
        extras.push(row('Compatible LoRa text nodes', '2 if mesh fits', 'Get one node per endpoint, compatible antennas and power. For US Meshtastic, check for US-region 902–928 MHz hardware. Set the same region and channel, pair each phone, and test with internet bridges off.'));
      }
    }
    if (state.commsGoal === 'remote') {
      extras.push(row('Remote check-in option', state.experience === 'advanced' ? '1 per separated group' : 'Verify coverage', state.experience === 'beginner'
        ? 'Check whether your phone or messenger supports your location, then confirm activation and how to test it.'
        : 'Compare a dedicated satellite messenger with a compatible phone. Verify two-way messaging, coverage, active plan, test mode, and power needs before travel.'));
    }
    if (state.experience !== 'beginner' && state.commsGoal !== 'alerts') {
      extras.push(row('Spare communication power', state.experience === 'advanced' ? '1 spare per device' : '1 backup per group', 'Match the batteries, charging cradle or USB cable to the exact device. Test at least one charging path away from home.'));
    }
    if (state.experience === 'advanced' && state.commsGoal === 'alerts') {
      extras.push(row('Second alert receiver', '1 independent backup', 'Keep a battery-operated receiver or other tested warning path in a separate location. Check any needed strobe, shaker or headphone output.'));
    }
    return {
      banner: 'COMMUNICATIONS', title: 'Get alerts and reach your people',
      lead: 'Start with two jobs: hear official warnings and know how to check in with your household. A weather receiver listens. A separate two-way device is needed to talk.',
      tableTitle: 'What to look for',
      rows: [
        row('Weather alert receiver', '1 per home', 'Look for “NOAA Weather Radio,” automatic alerts, and battery backup. SAME lets you select the counties to alert for.'),
        row('AM/FM news receiver', '1 per home', 'Check whether the weather receiver already has AM/FM. Otherwise use a separate battery-powered radio for local news stations.'),
        row('Batteries and paper contacts', '1 spare set + copies', 'Read the radio’s battery size and count. Print your out-of-town contact and two meeting places for the bags.'),
        ...extras
      ],
      tips: [
        tip('Set up the radio now', 'Find a strong local NOAA station on the National Weather Service list. Follow your radio manual to set your county if supported, and test reception on battery power where you will keep the radio.'),
        tip('Try a check-in', 'Pick an out-of-town contact and practice sending a short message with your status and location. Tell each person what to do and where to meet if no one replies.'),
        ...(state.experience === 'advanced' && state.commsGoal !== 'alerts' ? [tip('Make a printed channel or device card', 'Record the channel or contact, expected check-in time, tested coverage and fallback. Leave passwords and private keys out of the printed card.')] : [])
      ],
      references: [
        source('NWS receiver buying guide', 'https://www.weather.gov/nwr/nwr_receivers'),
        source('FEMA family communication plan', 'https://www.ready.gov/sites/default/files/2020-03/ready_family-communications-plan_kids.pdf'),
        ...(state.experience !== 'beginner' && state.commsGoal === 'town' ? [
          source('FCC radio rules', 'https://docs.fcc.gov/public/attachments/DA-22-1085A1.pdf')
        ] : []),
        ...(state.experience === 'advanced' && state.commsGoal === 'town' ? [
          source('Meshtastic setup', 'https://meshtastic.org/docs/getting-started/'),
          source('Mesh radio regions', 'https://meshtastic.org/docs/configuration/radio/lora/')
        ] : [])
      ]
    };
  }

  function evacuationPage(state) {
    return {
      banner: 'GRAB AND GO', title: 'Pack a bag you can carry',
      lead: 'Use a backpack you already own if it fits. Keep home supplies on the shelf and pack the items you can carry out quickly. Reuse the same lights, chargers and care supplies from the other lists.',
      tableTitle: 'Pack and check',
      rows: [
        row('Backpack or easy-carry bag', '1 per carrier', 'Put the heavier shared items in an adult bag. Check that anyone carrying a bag can lift it and move with it safely.'),
        row('Portable food and bottled water', 'Pack what you can carry', 'Choose sealed small bottles, ready-to-eat foods, and a can opener when needed. Confirm safe water and supplies at your destination.'),
        row('Shoes, clothing and a layer', '1 set per person', 'Start with sturdy closed shoes, socks, a spare change and a weather-appropriate outer layer, such as a rain jacket or warm coat.'),
        row('Contacts, maps and key records', '1 protected set', 'Use a zip bag or document pouch for copies of contacts, routes, key records and the medicine list. Keep documents private.'),
        row('Money and keys', 'As practical', 'Set aside small bills and a spare key if you can. Keep them somewhere secure and easy to access.'),
        row('Smoke and carbon monoxide alarms', 'Check coverage at home', 'Follow local rules and the maker’s instructions for placement, battery backup and replacement. Press the test button and confirm everyone can hear or see the alert.'),
        ...(state.experience === 'advanced' ? [row('Separate work or travel kit', '1 per regular location', 'Stage a compact set of water, food, a headlamp, charging cable and map where you regularly spend time. Check what the site permits.')] : [])
      ],
      tips: [
        tip('Set the route before packing more', `Write a nearby meeting place, a second place outside the area, and two routes. ${state.noCar ? 'Confirm a ride and a backup ride now.' : 'Check how you will get everyone there.'} ${state.children ? 'Write down the school pickup plan and who can pick up each child.' : ''}`.trim()),
        tip('Put it by the exit and practice', 'Walk with the bag, adjust the load, and tell everyone where it is. Keep needed medication and devices accessible. Follow evacuation instructions and leave when directed.')
      ],
      references: [
        redCross,
        source('FEMA emergency supply checklist', 'https://www.ready.gov/sites/default/files/2024-05/ready_supply-kit-checklist.pdf'),
        source('U.S. Fire Administration alarms', 'https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/smoke-alarms/')
      ]
    };
  }

  function householdPage(state, supplies) {
    const rows = [];
    if (state.infants) {
      rows.push(
        row('Usual infant feeding supplies', `${supplies.days} days`, 'Count actual feeds and the supplies you use. If formula-fed, ready-to-feed single-use containers avoid mixing with water. Follow your usual care plan.'),
        row('Diapers and wipes', `${supplies.days} days`, 'Count a typical day, multiply by your goal, and use the infant’s current diaper size. Include waste bags and spare clothing.')
      );
    }
    if (state.pets) {
      rows.push(
        row('Regular pet food', `${supplies.days} days per pet`, 'Measure a normal day for each animal. Pack the usual food, a scoop and bowls. Keep prescribed supplies with the pet’s records.'),
        row('Carrier, leash or safe enclosure', '1 per animal as needed', 'Check the fit and condition. Add ID, waste supplies and a copy of veterinary information. Confirm your destination can take the animal.')
      );
    }
    if (state.access) rows.push(row('Daily access supplies and spares', 'For your equipment', 'List the sizes and models you use: glasses, hearing aid batteries, mobility device parts, chargers or communication aids.'));
    if (!rows.length) return null;
    return {
      banner: 'HOUSEHOLD ADD-ONS', title: 'Shop for the people and pets you care for',
      lead: 'Use these items when they apply to your household. Keep familiar foods, supplies and devices together so another caregiver can find them.',
      tableTitle: 'Count what you actually use', rows,
      tips: [tip('Confirm the backup', 'Write down who can help, which items they need to bring, and where you can go if your regular setup stops working. Review sizes and supplies as needs change.')],
      references: [
        cdcNeeds,
        ...(state.infants ? [source('CDC infant feeding', 'https://www.cdc.gov/infant-feeding-emergencies-toolkit/php/faqs.html')] : []),
        ...(state.pets ? [source('FEMA pet preparedness', 'https://www.ready.gov/pets')] : [])
      ]
    };
  }

  function vehiclePage(state, seasons) {
    if (state.noCar || state.experience === 'beginner') return null;
    const advanced = state.experience === 'advanced';
    const remote = advanced && ['remote', 'trail'].includes(state.vehicleRoute);
    const trail = advanced && state.vehicleRoute === 'trail';
    const cold = state.hazards.includes('winter') || seasons.includes('winter');
    return {
      banner: 'VEHICLE KIT', title: 'Stock a roadside kit',
      lead: advanced ? 'Match gear to your vehicle manual and where you drive. Start with roadside readiness, then add the remote or trail equipment that fits your route.' : 'Keep a small kit for ordinary breakdowns. Check what came with the vehicle before buying a replacement.',
      tableTitle: 'What to carry',
      rows: [
        row('Car charger and light', '1 of each', 'Match a 12 V or USB charger to your outlet and phone. Keep a headlamp and fresh batteries where you can reach them.'),
        row('Visibility and weather gear', '1 kit', 'Pack a high-visibility vest or reflective markers, work gloves, a rain layer and sturdy shoes. Get to a safe location before using roadside gear.'),
        row('Food, water and basic care', 'For usual passengers', 'Pack ready-to-eat snacks, portable bottled water and a small first aid kit. Refresh them and follow storage limits for heat or freezing.'),
        row('Spare tire or maker’s repair kit', '1 working setup', 'Find the spare, included jack and lug wrench, or the original repair kit. Check condition, spare pressure and the manual for safe locations and limits.'),
        row('Tire pressure gauge', '1 gauge', 'Compare the cold pressure with the sticker inside the driver’s door. Check the spare too.'),
        ...(advanced ? [
          row('Portable tire inflator', '1 compatible unit', 'Check outlet current limits, hose reach and pressure rating for your tires. Test it before a long trip.'),
          row('Jump pack or jumper cables', '1 compatible set', 'Confirm the vehicle voltage, engine type and maker’s approved jump points. Check the pack’s permitted storage temperatures and recharge schedule.')
        ] : []),
        ...(cold ? [row('Winter roadside gear', '1 kit', 'Add an ice scraper, small shovel, warm blanket and boots. Check seasonal gear before a trip.')] : []),
        ...(remote ? [row('Offline maps and check-in plan', '1 per route', 'Download maps, pack a paper backup, and give someone your route and return time. Verify any satellite device before getting out of cell range.')] : []),
        ...(trail ? [row('Off-road recovery gear', 'Match vehicle and training', 'For trail travel, ask a qualified instructor about a rated recovery strap and compatible hardware. Verify manufacturer-approved recovery points and equipment ratings for your vehicle.')] : [])
      ],
      tips: [
        tip('Check before departure', 'Know how to call roadside assistance. Secure gear so it cannot shift in a stop. If the roadside is unsafe or the vehicle is beyond your equipment or experience, call for help.')
      ],
      references: [
        source('NHTSA roadside supplies', 'https://www.nhtsa.gov/summer-driving-tips'),
        source('NHTSA tires and pressure', 'https://www.nhtsa.gov/vehicle-safety/tires'),
        ...(trail ? [source('Ford off-road equipment', 'https://www.ford.com/experiences/off-road-adventures/moab-telluride')] : [])
      ]
    };
  }

  const riskGear = {
    wind: ['High wind and power outages', 'Charged lights and phone power banks', 'Keep lights and charging gear accessible. Choose a sturdy shelter away from windows and stay clear of downed lines.', 'https://www.weather.gov/safety/wind-during'],
    tsunami: ['Tsunami evacuation', 'Printed evacuation map and sturdy shoes', 'Mark a walking route out of the mapped zone. After strong or long coastal shaking stops, leave immediately for high ground or inland along the signed route.', 'https://www.oregon.gov/oem/hazardsprep/Pages/Tsunami.aspx'],
    lahar: ['Volcanic mudflow evacuation', 'Printed lahar zone and route maps', 'Check whether your usual locations are in mapped valleys. Practice the signed route to high ground and follow local evacuation instructions.', 'https://dnr.wa.gov/washington-geological-survey/frequently-asked-questions'],
    storm: ['Severe storms or tornadoes', 'Alert receiver and sturdy shoes', 'Place your battery-backed receiver where it can wake you. Put shoes and a light by your shelter. If you live in a mobile home, choose a sturdy shelter you can reach in time.', 'https://www.weather.gov/safety/tornado-during'],
    flood: ['Flood or flash flood', 'Route map and document pouch', 'Mark an exit to higher ground. Keep keys and records in a water-resistant pouch. Leave early when directed. Never drive or walk through floodwater.', 'https://www.weather.gov/safety/flood-during'],
    heat: ['Extreme heat', 'Drinking water and cooling plan', 'Put safe water where everyone can reach it. Write down a cooling location, its hours and a ride there. Arrange a regular check-in for anyone who needs help.', 'https://www.cdc.gov/extreme-heat/prevention/'],
    hurricane: ['Hurricane or coastal storm', 'Evacuation map and grab bag', 'Look up your local evacuation zone and write down two destinations. Keep a paper route map, chargers, medicines and a bag ready to leave when directed.', 'https://www.ready.gov/hurricanes'],
    winter: ['Winter weather', 'Warm layer, boots and bedding', 'Set aside layers and a warm blanket or sleeping bag per person. Identify a warm destination and how you will get there if heat fails.', 'https://www.cdc.gov/winter-weather/safety/stay-safe-during-after-a-winter-storm-safety.html'],
    fire: ['Wildfire or smoke', 'Go bag and cleaner-air plan', 'Put keys and bags by the exit. For smoke when you can stay safely, choose a cleaner-air room. If buying a portable air cleaner, size it for that room and keep a matching spare filter.', 'https://www.epa.gov/wildfires/how-create-cleaner-air-room-home'],
    quake: ['Earthquake', 'Furniture anchors, shoes and light', 'Follow furniture or building guidance to secure heavy items. Keep sturdy shoes and a light by the bed. Practice Drop, Cover and Hold On.', 'https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html']
  };

  function hazardPage(state, seasons) {
    const risks = [...new Set([...state.hazards, ...seasons.filter(season => season === 'winter' || season === 'summer').map(season => season === 'summer' ? 'heat' : 'winter')])];
    if (!risks.length) return null;
    return {
      banner: 'LOCAL RISKS', title: 'Prepare for your local risks',
      lead: 'Start with the rows that match your home and routes. Reuse supplies you already have in your home or grab bag.',
      tableTitle: 'Supplies and the action that goes with them',
      rows: risks.map(key => {
        const [label, gear, detail] = riskGear[key];
        return row(label, gear, detail);
      }),
      tips: [...(state.region === 'pnw' ? [tip('Check local exposure', 'Use Washington or Oregon emergency maps. Select Tsunami for coastal inundation zones and Lahar for mapped volcanic mudflow zones, including places you travel to.')] : []), ...(state.experience === 'beginner' ? [] : [
        tip('Try your plan under realistic conditions', 'Check which alerts you can hear at night. Walk the route to shelter and time how long it takes to get everyone out with the supplies they need.'),
        ...(state.experience === 'advanced' ? [tip('Choose when to switch to your backup', 'Write down the conditions that would send you to your backup destination. Test a second route and confirm that it meets the household’s access, medical and pet needs.')] : [])
      ])],
      references: risks.map(key => source(riskGear[key][0], riskGear[key][3]))
    };
  }

  const api = { foodBasics, waterPage, powerPage, communicationPage, evacuationPage, householdPage, vehiclePage, hazardPage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyBuyingGuide = api;
})(globalThis);
