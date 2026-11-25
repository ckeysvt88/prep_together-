/* Build household play and learning guidance for both the planner and print. */
(function(root) {
  const stockKeys = ['books','toy','paper','crayons','pencils','folder'];
  function normalize(input, count) {
    const childAges = Array.from({length:count}, (_, i) => {
      const n = input.childAges?.[i];
      return Number.isInteger(n) && n >= 0 && n <= 17 ? n : null;
    });
    const childStock = {};
    for (const key of stockKeys) {
      const n = input.childStock?.[key];
      if (Number.isInteger(n) && n >= 0 && n <= 100) childStock[key] = n;
    }
    return {childAges, childStock};
  }
  function plan(s) {
    const total = s.children + s.infants;
    if (!total) return null;
    const ages = s.childAges ?? Array(s.children).fill(null);
    const rows = [], activities = [];
    function supply(key,item,target,detail) {
      if (!target) return;
      const have=s.childStock?.[key] ?? 0, id='play-'+key;
      rows.push({key,id,item,detail,target:String(target),have:String(have),need:String(Math.max(0,target-have)),status:s.notNeeded?.[id]?'Not needed':s.checked?.[id]?'Done':'To do'});
    }
    supply('books','Books to read together',total,'One familiar book per child. Use board books for babies and let older readers choose.');
    supply('toy','Familiar toy or game',total,'Choose one portable favorite per child that fits their age and abilities.');
    const artists=ages.filter(age=>age!==null && age>=3).length;
    supply('paper','Drawing pad or notebook',artists,'One per child who draws or writes. Stapled scrap paper works too.');
    supply('crayons','Washable crayons',Number(ages.some(a=>a!==null && a>=3 && a<=9)),'One shared box. Chunky crayons are easier for younger hands to hold.');
    supply('pencils','Writing pencils',artists,'One per child who draws or writes. Pack a shared sharpener.');
    if(s.tier!=='core') supply('folder','Printed reading and math folder',ages.filter(a=>a!==null && a>=5).length,'Prepare at home using familiar schoolwork and a book at the child’s reading level.');
    function idea(label,detail){activities.push({label,detail});}
    if(s.infants || ages.includes(0)) idea('Babies | Share a board book','Point to a picture, name it, and pause for a look, a sound or a gesture.');
    if(ages.some(a=>a===1||a===2)) idea('Ages 1–2 | Nest and sort','Stack two large nesting cups, hide one inside the other and let your toddler find it.');
    if(ages.some(a=>a>=3&&a<=5)) idea('Ages 3–5 | Draw and sing','Draw a character. Ask what it sounds like. Sing one line in its voice and let your child invent the next.');
    if(ages.some(a=>a>=6&&a<=9)) idea('Ages 6–9 | Pretend shop','Write price tags of 1, 2 and 3 on paper. Use five drawn coins to buy two toys and count the change.');
    if(ages.some(a=>a>=10&&a<=12)) idea('Ages 10–12 | Design a bridge','Sketch two bridge designs. Fold each from paper, span the same gap and compare which holds more pencils.');
    if(ages.some(a=>a>=13)) idea('Ages 13–17 | Choose a project','Use a notebook for a song, short story or game design. Let your teen choose whether to share the result.');
    if(artists>1) idea('Together | Four-panel comic','Fold paper in half twice and open it. Take turns filling the boxes. One child can draw while another narrates or adds captions.');
    idea('Any age | Music without equipment','Sing a familiar song together or tap a simple rhythm and take turns changing it.');
    const routine=[{label:'Pack first',detail:'Put one book and each child’s familiar item together in the family bag. Try an activity with the supplies you already own.'}];
    if(s.tier!=='core') routine.push({label:'Weeks one and two',detail:'Share a book after breakfast. Offer a choice of music, drawing or a game later. In week two, revisit a favorite and change the ending or add a rule.'});
    if(s.tier==='super') routine.push({label:'Weeks three and four',detail:'Rotate books and projects weekly. Refill used paper and review school materials at each child’s current level.'});
    if(s.experience!=='beginner') routine.push({label:'Review your kit',detail:'Try one activity without power. Keep large-print, picture-based or quiet alternatives where needed and replace materials as children grow.'});
    return {rows,activities,routine};
  }
  const api={normalize,plan};root.ReadyChildren=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})(globalThis);
