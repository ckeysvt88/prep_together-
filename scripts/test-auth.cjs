/* Public RFC fixtures only; no real enrollment keys are written to disk. */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const T=require('../dist/trusted-contact.js');
const QR=require('../dist/vendor/qr-encoder.js');
const E=require('../dist/engine.js'), P=require('../dist/planning.js'), M=require('../dist/medical.js');
const D=require('../dist/shopping-details.js');
const tests=[]; const test=(name,fn)=>tests.push([name,fn]);
const seed='12345678901234567890', secret=T.encode(Buffer.from(seed));
function independent(secret,time){
 const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(Math.floor(time/30000)));
 const h=crypto.createHmac('sha1',Buffer.from(T.decode(secret))).update(b).digest(), o=h[19]&15;
 return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');
}
test('all six RFC 6238 SHA-1 vectors, 8-digit and 6-digit truncation',async()=>{
 const k=await T.key(secret);assert.equal(k.extractable,false);
 for(const [s,expected] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']]){
  assert.equal(await T.code(k,s*1000,8),expected);
  assert.equal(await T.code(k,s*1000),expected.slice(-6));
 }
});
test('independent HMAC synchronization at boundaries, leading zeros and future clocks',async()=>{
 const k=await T.key(secret);
 for(const time of [0,1,29999,30000,59999,60000,1111111109000,Date.UTC(2026,10,18),20000000000000])assert.equal(await T.code(k,time),independent(secret,time));
 assert.equal(await T.code(k,1111111109000),'081804');
 assert.equal(T.remaining(0),30);assert.equal(T.remaining(29999),1);assert.equal(T.remaining(30000),30);
 await assert.rejects(()=>T.code(k,-1));await assert.rejects(()=>T.code(k,Infinity));
});
test('secure random secrets are unique 160-bit canonical Base32',()=>{
 const keys=new Set(Array.from({length:128},()=>T.generate()));assert.equal(keys.size,128);
 for(const s of keys){assert.match(s,/^[A-Z2-7]{32}$/);assert.equal(T.decode(s).length,20);assert.equal(T.encode(T.decode(s)),s);}
});
test('manual keys reject invalid lengths, alphabet, noncanonical trailing bits and codes',()=>{
 for(let bytes=16;bytes<=64;bytes++) {const raw=crypto.randomBytes(bytes);assert.deepEqual(Buffer.from(T.decode(T.encode(raw))),raw);}
 assert.equal(T.encode(T.decode(secret.toLowerCase().replace(/(.{4})/g,'$1 '))),secret);
 for(const value of ['123456','0'.repeat(32),'A'.repeat(25),'A'.repeat(104),'A'.repeat(27),'A'.repeat(25)+'B','<script>','otpauth://totp/test?secret='+secret])assert.throws(()=>T.decode(value));
});
test('enrollment URI uses fixed interoperable parameters with safely encoded labels',()=>{
 const u=new URL(T.uri(secret,'Alex & Sam / 家庭 🏡 : test'));
 assert.equal(u.protocol,'otpauth:');assert.equal(u.host,'totp');
 assert.equal(u.searchParams.get('secret'),secret);assert.equal(u.searchParams.get('issuer'),'Ready Together');
 assert.equal(u.searchParams.get('algorithm'),'SHA1');assert.equal(u.searchParams.get('digits'),'6');assert.equal(u.searchParams.get('period'),'30');
 assert(decodeURIComponent(u.pathname).includes('家庭 🏡'));assert.equal((decodeURIComponent(u.pathname).match(/:/g)||[]).length,1);
 assert.equal(Array.from(T.label('🏡'.repeat(60))).length,40);
});
test('QR matrices generate for ordinary and maximal UTF-8 labels with quiet-zone rendering',()=>{
 for(const label of ['Family demo','家庭 🏡 / Alex & Sam','🏡'.repeat(40)]){
  const qr=new QR.QRCode(0,QR.ECL.M);qr.addData(T.uri(secret,label));qr.make();
  assert(qr.getModuleCount()>=21);assert(qr.isDark(0,0));assert(!qr.isDark(1,1));assert(qr.isDark(3,3));
 }
 assert(fs.readFileSync(path.join(__dirname,'../dist/trusted-contact-ui.js'),'utf8').includes('const n = qr.getModuleCount()'));
});
test('trusted-contact action and worksheet appear for every experience and household',()=>{
 for(const experience of ['beginner','intermediate','advanced'])for(const adults of [1,2,10]){
  const s=E.normalize({experience,adults,children:adults===1?0:2});
  assert(E.tasks(s).some(t=>t.id==='trusted-auth'));
  const pages=D.worksheets(s,E.calculate(s),P.portablePower(s),[]);const page=pages.find(p=>p.banner==='TRUSTED CONTACTS');
  assert(page);assert(page.tips.some(t=>/replay/i.test(t.detail)));assert(page.tips.some(t=>/previously trusted number/i.test(t.detail)));
  assert.equal(page.rows.length,2);
 }
 const state=E.normalize({notNeeded:{'trusted-auth':true}});
 assert.equal(P.orderTasks(state,E.tasks(state)).find(t=>t.id==='trusted-auth').status,'skip');
});
test('private authentication fields cannot enter normalized saved state or backups',()=>{
 const s=E.normalize({authSecret:secret,trustedContacts:[{secret}],trustedLabel:'PRIVATE TEST LABEL',secret,uri:T.uri(secret,'PRIVATE TEST LABEL')});
 for(const value of [s,M.forStorage(s),M.forBackup(s)]){const json=JSON.stringify(value);assert(!json.includes(secret));assert(!json.includes('PRIVATE TEST LABEL'));assert(!json.includes('otpauth:'));}
 const ui=fs.readFileSync(path.join(__dirname,'../dist/trusted-contact-ui.js'),'utf8');
 assert(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|postMessage/.test(ui));
 assert(ui.includes("window.addEventListener('pagehide',clearAll)"));assert(ui.includes("window.addEventListener('beforeprint',hidePrivate)"));
 assert(fs.readFileSync(path.join(__dirname,'../dist/styles.css'),'utf8').includes('@media print{#trusted-workspace'));
});
function worker(){
 const currentCache=fs.readFileSync(path.join(__dirname,'../dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const handlers={}, entries=new Map(),removed=[],requests=[];let fail=false;
 const fakecache={addAll:async input=>{requests.push(...input);if(fail)throw Error('offline');for(const r of input)entries.set(r.url,new Response('public asset'));},put:async(url,res)=>entries.set(String(url),res),match:async url=>entries.get(String(url))};
 const sandbox={URL,Request,Response,Set,console,self:{location:{href:'https://example.test/prep/sw.js'},clients:{claim:async()=>{}},addEventListener:(n,cb)=>handlers[n]=cb},caches:{open:async()=>fakecache,keys:async()=>['unrelated','ready-together-public-old',currentCache],delete:async n=>removed.push(n)},fetch:async()=>{throw Error('offline')}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/sw.js'),'utf8'),sandbox);
 return{handlers,entries,removed,requests,setFail:v=>fail=v};
}
function waitEvent(handler){let promise;handler({waitUntil:p=>promise=p});return promise;}
test('offline install caches complete allowlisted assets and supports subdirectory paths',async()=>{
 const w=worker();await waitEvent(w.handlers.install);
 assert(w.entries.has('https://example.test/prep/offline-ready'));assert(w.requests.length>20);
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
 for(const src of [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]).filter(src=>!src.startsWith('https://')))assert(w.entries.has('https://example.test/prep/'+src),'missing '+src);
 for(const href of [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m=>m[1]))assert(w.entries.has('https://example.test/prep/'+href),'missing '+href);
 for(const r of w.requests){assert.equal(r.credentials,'omit');const u=new URL(r.url);assert.equal(u.origin,'https://example.test');assert(!u.searchParams.has('secret'));const rel=decodeURIComponent(u.pathname.slice('/prep/'.length));assert(fs.existsSync(path.join(__dirname,'../dist',rel||'index.html')),'missing file '+rel);}
 await waitEvent(w.handlers.activate);assert.deepEqual(w.removed,['ready-together-public-old']);
});
test('failed offline installation never claims readiness',async()=>{
 const w=worker();w.setFail(true);await assert.rejects(()=>waitEvent(w.handlers.install));assert(!w.entries.has('https://example.test/prep/offline-ready'));
});
test('offline navigation fallback works; unknown URLs, POST, external and secret queries bypass cache',async()=>{
 const w=worker();await waitEvent(w.handlers.install);
 let response;w.handlers.fetch({request:{url:'https://example.test/prep/',mode:'navigate',method:'GET'},respondWith:p=>response=p});assert.equal(await (await response).text(),'public asset');
 for(const r of [{url:'https://example.test/prep/?secret=private',mode:'navigate',method:'GET'},{url:'https://example.test/prep/trusted-contact.js?secret=private',method:'GET'},{url:'https://example.test/prep/unknown',mode:'navigate',method:'GET'},{url:'https://elsewhere.test/prep/',method:'GET'},{url:'https://example.test/prep/',method:'POST'}]){let captured=false;w.handlers.fetch({request:r,respondWith:()=>captured=true});assert.equal(captured,false);}
});
(async()=>{let passed=0;for(const[name,fn]of tests){try{await fn();passed++;console.log('PASS '+name);}catch(e){console.error('FAIL '+name);console.error(e);process.exitCode=1;}}console.log(passed+'/'+tests.length+' authentication checks passed.');})();
