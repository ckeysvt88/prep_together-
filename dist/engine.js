/* Pure planning calculations. US gallons; calorie values are editable assumptions. */
(function(root){
const TIERS={core:{name:'Core',days:3,label:'72 hours',rank:1},advanced:{name:'Advanced',days:14,label:'14 days',rank:2},super:{name:'Super prep',days:30,label:'30 days',rank:3}};
const REGIONS={
 southeast:{name:'Southeast / Gulf & Atlantic',hazards:['storm','flood','heat','hurricane']},
 northeast:{name:'Northeast / Mid-Atlantic',hazards:['winter','storm','flood','heat']},
 midwest:{name:'Midwest / Great Plains',hazards:['storm','winter','flood','heat']},
 southwest:{name:'Southwest / desert',hazards:['heat','fire','flood']},
 west:{name:'Pacific coast',hazards:['quake','fire','heat','flood']},
 mountain:{name:'Mountain / interior west',hazards:['winter','fire','flood']},
 alaska:{name:'Alaska',hazards:['winter','quake']},
 islands:{name:'Hawaii / US tropical islands',hazards:['hurricane','quake','heat','flood']},
 custom:{name:'Custom / select hazards',hazards:[]}
};
const HAZARDS={
 storm:{name:'Severe storms / tornado',action:'Choose a suitable shelter and a nighttime alert method. In a warning, use an interior protected area away from windows; mobile homes need a sturdy shelter plan.',source:'https://www.weather.gov/safety/tornado-during'},
 flood:{name:'Flood / flash flood',action:'Check official property and route exposure. Prepare an early exit route; never walk or drive into floodwater or past barricades.',source:'https://www.weather.gov/safety/flood-during'},
 heat:{name:'Extreme heat',action:'Confirm a reliably cooled destination and a ride. Consider a higher water allowance; do not depend on a fan alone during extreme indoor heat.',source:'https://www.cdc.gov/extreme-heat/prevention/'},
 hurricane:{name:'Hurricane / coastal storm',action:'Know local evacuation zones, routes and departure instructions. Inland rain and flooding also matter. Choose lodging outside the affected area.',source:'https://www.ncdps.gov/our-organization/emergency-management/emergency-preparedness/know-your-zone/frequently-asked-questions-about-know-your-zone'},
 winter:{name:'Winter / ice',action:'Prepare layers, bedding and a safe warming destination before roads worsen. Never use an outdoor stove, grill or oven for indoor heating.',source:'https://www.cdc.gov/winter-weather/safety/stay-safe-during-after-a-winter-storm-safety.html'},
 fire:{name:'Wildfire / smoke',action:'Plan early departure routes and a cleaner-air room with suitable filtration. Air cleaners or respirators do not make staying in an evacuation zone safe.',source:'https://www.epa.gov/wildfires/how-create-cleaner-air-room-home'},
 quake:{name:'Earthquake',action:'Secure heavy items, keep shoes and a light accessible, and practice Drop, Cover and Hold On. Check local tsunami guidance on exposed coasts.',source:'https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html'}
};
const EXPERIENCES={beginner:{name:'Beginner',description:'Tell me what to get and what to do. No usage calculations.'},intermediate:{name:'Intermediate',description:'Help me expand my kit, with explanations and optional calculations.'},advanced:{name:'Advanced',description:'Show detailed assumptions, load sizing and communication design.'}};
const defaults={experience:'beginner',phones:2,simpleFoodDays:0,commsGoal:'alerts',extraWater:false,tier:'core',adults:2,children:2,infants:0,pets:0,petWater:0.25,adultKcal:2000,childKcal:1600,waterRate:1,region:'southeast',hazards:[...REGIONS.southeast.hazards],place:'',housing:'house',well:false,medical:false,access:false,allergy:false,noCar:false,storedWater:0,storedFood:0,weeklyBudget:25,dailyWh:90,capacityWh:0,usable:80,checked:{},notes:''};
const finite=(v,f,min,max)=>{let n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):f};
function normalize(x={}){
 const s={...defaults};
 for(const [k,min,max,int] of [['phones',0,30,1],['simpleFoodDays',0,365,0],['adults',1,20,1],['children',0,20,1],['infants',0,10,1],['pets',0,20,1],['petWater',0,20,0],['adultKcal',1000,6000,1],['childKcal',500,6000,1],['waterRate',1,5,0],['storedWater',0,100000,0],['storedFood',0,100000000,0],['weeklyBudget',0,10000,0],['dailyWh',0,100000,0],['capacityWh',0,1000000,0],['usable',10,100,0]]) {s[k]=finite(x[k]??s[k],s[k],min,max);if(int)s[k]=Math.floor(s[k]);}
 s.experience=EXPERIENCES[x.experience]?x.experience:'beginner';s.commsGoal=['alerts','nearby','town','remote'].includes(x.commsGoal)?x.commsGoal:'alerts';
 s.tier=TIERS[x.tier]?x.tier:defaults.tier;s.region=REGIONS[x.region]?x.region:defaults.region;
 s.hazards=Array.isArray(x.hazards)?[...new Set(x.hazards.filter(k=>HAZARDS[k]))]:[...REGIONS[s.region].hazards];
 s.housing=['house','apartment','mobile'].includes(x.housing)?x.housing:'house';
 for(const k of ['well','medical','access','allergy','noCar','extraWater'])s[k]=x[k]===true;
 for(const k of ['place','notes'])s[k]=typeof x[k]==='string'?x[k].slice(0,k==='notes'?3000:100):'';
 s.checked={};if(x.checked&&typeof x.checked==='object')for(const [k,v]of Object.entries(x.checked))if(/^[a-z0-9-]{1,80}$/.test(k)&&v===true)s.checked[k]=true;
 return s;
}
function calculate(input){
 const s=normalize(input),days=TIERS[s.tier].days,people=s.adults+s.children+s.infants;
 const waterRate=s.experience==='beginner'?(s.extraWater||s.hazards.includes('heat')?1.5:1):s.waterRate;
 const dailyWater=people*waterRate+s.pets*s.petWater,dailyFood=s.adults*s.adultKcal+s.children*s.childKcal;
 const water=dailyWater*days,food=dailyFood*days;
 return {days,people,waterRate,baselineWater:people*days,bufferWater:people*(waterRate-1)*days,waterJugs:Math.ceil(water),simpleFoodGapDays:Math.max(0,days-s.simpleFoodDays),dailyWater,dailyFood,water,food,waterGap:Math.max(0,water-s.storedWater),foodGap:Math.max(0,food-s.storedFood),waterDays:s.storedWater/dailyWater,foodDays:s.storedFood/dailyFood,waterWeight:water*8.34,meals:(s.adults+s.children)*3*days,petDays:s.pets*days,powerNeed:s.dailyWh*days/(s.usable/100),powerDays:s.dailyWh?s.capacityWh*s.usable/100/s.dailyWh:null};
}
function tasks(input){
 const s=normalize(input),m=calculate(s),rank=TIERS[s.tier].rank,beginner=s.experience==='beginner';
 const a=[];const add=(id,cat,title,detail)=>a.push({id,cat,title,detail});
 add('water','Supplies',beginner?`Set aside ${m.waterJugs} one-gallon jugs of water`:'Store accessible safe water',beginner?`This covers the ${m.days}-day planning target, including the displayed heat/extra-needs buffer and entered pet water. Use smaller bottles if easier to lift. Keep them cool and accessible.`:`${m.water.toFixed(1)} gallons for the selected tier. Include every person; pet allowance is editable. Do not count a filter as stored water.`);
 add('food','Supplies',beginner?`Plan ${m.days} days of familiar meals`:'Build a menu and count food labels',beginner?`For each day, put aside breakfast, lunch, dinner and snacks for everyone. Choose food that does not need a refrigerator; start with no-cook meals. Count complete days of food below, not package servings. Infant feeding is separate.`:`${Math.round(m.food).toLocaleString('en-US')} planned calories across ${m.meals} person-meal slots, plus infant feeding supplies. Match dietary needs; start with no-cook meals.`);
 add('lights','Supplies','Check lights and charging',`${m.people} personal lights or adult-managed equivalents; spare batteries, phone cables and tested power banks. Stock by actual runtime.`);
 add('care','Care','Review first aid and medication continuity','Locate the first-aid kit; record prescriptions and allergies; ask the pharmacist about a permitted reserve. Follow each medicine’s storage instructions.');
 add('hygiene','Care','Prepare handwashing and sanitation','Safe water, soap, toilet paper, waste bags and personal supplies. Know what to do if toilets cannot be used; follow local waste-disposal instructions.');
 add('alerts','Plan','Enable alerts and test alarms','Local emergency alerts, working smoke/CO alarms, battery radio and written contacts. Make sure alerts can wake sleeping occupants.');
 add('evacuate','Plan','Choose destinations and transport','Confirm two destinations, safe routes, transport capacity, dependent care and pet arrangements. Follow evacuation orders promptly.');
 add('grab','Plan','Pack and carry-test evacuation essentials','Pack manageable bags, personal care, documents, chargers and weather layers. Stage extra vehicle water separately. Assign a backup for each adult task.');
 add('records','Plan','Protect records and emergency funds','Keep paper contacts, essential records, spare keys and affordable small-bill cash. Never publish completed household plans.');
 add('practice','Practice','Run a calm practice evening','Serve a planned meal, find the lights and contact sheet, and rehearse check-in. Keep medical equipment powered and alarms active.');
 if(s.adults===1)add('solo','Plan','Name a check-in partner and backup helper','A trusted person should know when to check on you and how to help. If children or dependents are present, arrange a second caregiver.');
 if(s.adults>1)add('cross-train','Practice','Cross-train another adult','Both adults should know kit locations, care responsibilities and the departure plan. Avoid keeping essential instructions with only one person.');
 if(s.children)add('children','Care','Add child-specific supplies and pickup plans',beginner?'Familiar safe foods in normal portions, fitting clothing, comfort activities and school pickup permissions.':'Familiar safe foods, fitting clothing, comfort activities and school pickup permissions. Adjust calorie assumptions for actual ages and needs.');
 if(s.infants)add('infants','Care','Make a separate infant feeding plan','Stock the actual feeding supply, diapers and safe sleep/transport needs. Ready-to-feed formula is preferred during emergencies for formula-fed infants. Do not dilute formula. Infant food is excluded from calorie totals.');
 if(s.pets)add('pets','Care','Measure animal needs and confirm lodging',`${m.petDays} pet-days of usual food, plus animal-specific medicines, carriers and waste supplies. ${s.petWater} gal per pet per day is your current entry: verify it for each animal, climate and species.`);
 if(s.medical)add('medical','Care','Confirm a care-team backup and relocation threshold','Document medical-device compatibility, measured runtime, consumables and refrigerated medication limits. Arrange a supported destination before backup power or safe storage runs out.');
 if(s.access)add('access','Plan','Confirm accessible assistance and transport','Practice needed assistance with a backup helper. Confirm transport, destination access, communication aids and mobility-device power/parts.');
 if(s.allergy)add('allergy','Care','Audit the menu for restrictions','Check ingredient labels and cross-contact risks. Maintain familiar alternatives and any prescribed emergency treatment. A calorie total cannot check nutritional suitability.');
 if(s.noCar)add('ride','Plan','Arrange two transport options','Confirm people who can provide rides and local evacuation assistance. Account for child seats, mobility aids and animals; do not presume rideshares will operate.');
 if(s.well)add('well','Supplies','Plan for well-pump or water-system power loss','Store water independently of the pump. Verify electrical compatibility and professional backup options. Flooded wells need local health-department guidance before use.');
 if(s.housing==='apartment')add('apartment','Plan','Check building and storage constraints','Plan for stairs, elevator outages and building water loss. Keep exits clear. If compliant outdoor generator placement is unavailable, use batteries and a relocation plan.');
 if(s.housing==='mobile')add('mobile','Plan','Identify a nearby sturdy storm shelter','Know how to reach it before dangerous weather. A mobile home is not suitable tornado shelter.');
 if(rank>=2){
 add('rotate','Supplies','Establish a rotating pantry and water schedule','Mark dates and locations; replace self-filled water every six months. Test the menu and measure cooking water/fuel. Maintain a no-cook fallback.');
 add('backup','Supplies','Test an independent backup for critical functions','Measure lights, phones and other priority loads. Check output watts, surge, watt-hours and connectors; battery capacity does not guarantee device compatibility.');
 add('toilet','Care','Assemble a temporary sanitation system','Use a suitable toilet/waste system and manufacturer supplies. Identify permitted disposal; relocate if waste cannot be handled safely.');
 add('skills','Practice','Complete practical training and a load-out drill','First aid/CPR, safe equipment use and evacuation loading. Do not interrupt medical equipment to simulate a failure.');
 }
 if(rank>=3){
 add('resupply','Supplies','Document a realistic resupply plan','Identify safe water sources, transport, food replenishment and necessary care access. State remaining gaps; do not assume distribution, gardens or an untested water source will meet them.');
 add('service','Practice','Write maintenance and backup operating instructions','Record service intervals, spare consumables and equipment limits. Train a second capable operator or helper.');
 add('network','Plan','Build a trusted support and recovery network','Agree on check-ins, rides, caregiving and mutual help. Maintain transport/lodging funds and protected records. Keep sensitive inventory private.');
 }
 for(const h of s.hazards)add('hazard-'+h,'Local risks',HAZARDS[h].name,HAZARDS[h].action);
 add('radio-listen','Communications','Get one battery-powered AM/FM + NOAA alert radio','Choose AM/FM for local broadcasts AND NOAA weather reception with an actual automatic alert feature. Weather-band tuning alone does not mean it wakes you. SAME county alerts and battery backup are useful at home; use separate receivers if one unit lacks these functions.');
 add('radio-test','Communications','Write down stations, contacts and check-in times','Tune a local AM/FM station and a clear NOAA transmitter; program county alerts if supported. Check reception and backup batteries. Write a meeting point and a missed-check-in action on paper.');
 if(s.commsGoal==='nearby')add('radio-frs','Communications','Start with two matching FRS walkie-talkies','Use compliant FRS radios for nearby groups; no individual US license is required. Set the same channel/tone and practice at the actual locations. Privacy codes do not encrypt conversations. More radios are needed for more separated groups.');
 if(s.commsGoal==='town')add('radio-town','Communications','Arrange a real across-town communication test',beginner?'A pair of walkie-talkies may not reach across town. Ask an experienced helper to evaluate GMRS or a compatible mesh system. Keep the AM/FM/NOAA receiver and paper meeting plan regardless of the result.':'Evaluate licensed GMRS with a usable repeater or compatible mesh text radios. Confirm both endpoints, permissions, terrain, relays and backup power. No range guarantee; test with internet gateways disabled before calling a mesh link off-grid.');
 if(s.commsGoal==='remote')add('radio-satellite','Communications','Verify a satellite messaging option before remote travel','Check the exact device or phone’s supported features, coverage, activation and service requirements. Many dedicated messengers require a paid plan, including for SOS. Practice using its test mode with a clear sky view; never send a real SOS as a drill.');
 if(s.experience==='advanced'&&s.commsGoal==='town')add('mesh-proof','Communications','Document an off-grid mesh acceptance test','Use compatible firmware, region/frequency, radio preset and channel/key settings. Disable MQTT/internet bridges on the nodes involved, keep local Bluetooth as needed, and exchange acknowledged messages both directions. Record failed locations and relay power dependencies.');
 if(beginner){const plain={lights:`Set out ${m.people} lights (adults manage young children’s lights), spare batteries and ${s.phones} phone charging cables. Start with ${s.phones} USB power banks and test each phone from one.`,rotate:'Put new groceries behind older usable ones. Write a review date on water containers; replace water you fill yourself every six months.',backup:'Practice charging phones from your banks. For longer outages, identify a safe place to recharge or relocate; one bank per phone is only a starter, not a multiweek power supply.',skills:'Practice carrying the bags and loading your ride. Take first-aid training. Keep medical equipment and safety alarms operating during practice.'};for(const t of a)if(plain[t.id])t.detail=plain[t.id];}
 return a;
}
const api={EXPERIENCES,TIERS,REGIONS,HAZARDS,defaults,normalize,calculate,tasks};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ReadyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
