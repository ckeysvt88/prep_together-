/* Secrets belong only to this closure. Never attach them to the planner state or storage. */
(() => {
  'use strict';
  const T = ReadyTrusted, $ = id => document.getElementById(id);
  for (const step of T.steps) {
    const li=document.createElement('li'), title=document.createElement('strong'), detail=document.createElement('p');
    title.textContent=step.label; detail.textContent=step.detail; li.append(title,detail); $('trusted-steps').append(li);
  }
  for (const item of T.safeguards) {
    const title=document.createElement('h4'), detail=document.createElement('p');
    title.textContent=item.label; detail.textContent=item.detail; $('trusted-safeguards').append(title,detail);
  }
  for (const ref of T.references) {
    const link=document.createElement('a'); link.textContent=ref.label+' ↗'; link.href=ref.url; link.target='_blank'; link.rel='noopener noreferrer';
    $('trusted-sources').append(link,document.createTextNode(' · '));
  }
  const contacts = []; let active = -1, revision = 0, lastPeriod = -1, hidden = false, busy = false;
  const area = $('trusted-workspace'), status = $('trusted-status');
  const note = text => { status.textContent = text; };
  function clearDisplay() {
    revision++; lastPeriod = -1;
    $('trusted-qr').replaceChildren(); $('trusted-key').value = ''; $('trusted-key').type = 'password';
    $('trusted-reveal').textContent = 'Reveal setup key'; $('trusted-code').textContent = '••• •••';
    $('trusted-countdown').textContent = ''; $('trusted-progress').value = 0;
    $('trusted-announcement').textContent = '';
  }
  function hidePrivate() {
    hidden = true; clearDisplay(); $('trusted-private').hidden = true;
    $('trusted-resume').hidden = active < 0;
  }
  function qrSVG(text) {
    const qr = new ReadyQR.QRCode(0, ReadyQR.ECL.M); qr.addData(text); qr.make();
    const n = qr.getModuleCount(); let path = '';
    for (let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) path += `M${c+4},${r+4}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+8} ${n+8}" role="img" aria-label="Private enrollment QR code. Share only with this trusted contact." shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
  }
  function selectContact() {
    clearDisplay(); const item = contacts[active];
    $('trusted-session').hidden = !item;
    $('trusted-private').hidden = !item || hidden;
    $('trusted-resume').hidden = !item || !hidden;
    $('trusted-clear').hidden = !contacts.length;
    if (!item || hidden) return;
    $('trusted-active-name').textContent = item.name;
    $('trusted-key').value = item.secret;
    $('trusted-qr').innerHTML = qrSVG(T.uri(item.secret,item.name));
    $('trusted-enrollment').open = item.newlyCreated;
    tick();
  }
  function choices() {
    $('trusted-select').replaceChildren(...contacts.map((item,index)=>new Option(item.name,String(index))));
    $('trusted-select').value = String(active); selectContact();
  }
  async function add(secret) {
    if (busy) return;
    if (contacts.length >= 12) { note('This session supports 12 entries. Clear an entry before adding another.'); return; }
    busy = true; $('trusted-generate').disabled = true; $('trusted-import').disabled = true;
    note('Preparing the private key on this device…');
    const version = revision;
    try {
      const signingKey = await T.key(secret);
      if (version !== revision) return;
      const item = { name:T.label($('trusted-label').value), secret:T.encode(T.decode(secret)), signingKey, newlyCreated:true };
      contacts.push(item); active = contacts.length-1; hidden = false;
      $('trusted-import-key').value = ''; $('trusted-label').value = '';
      choices(); note('Private key ready. Enroll both phones with this same QR and compare the codes before clearing this session.');
      $('trusted-active-name').focus();
    } catch { note('The key could not be opened. Use a valid Base32 setup key and a current HTTPS browser.'); }
    finally { busy = false; $('trusted-generate').disabled = false; $('trusted-import').disabled = false; }
  }
  async function tick() {
    const item = contacts[active];
    if (!item || hidden || document.hidden || area.hidden) return;
    const now = Date.now(), period = Math.floor(now/30000), seconds = T.remaining(now);
    $('trusted-countdown').textContent = seconds <= 5 ? `Changes in ${seconds}s — wait for the next code before comparing.` : `Changes in ${seconds} seconds`;
    $('trusted-progress').value = seconds;
    if (period === lastPeriod) return;
    const version = revision; $('trusted-code').textContent = '••• •••';
    try {
      const code = await T.code(item.signingKey,now);
      if (version !== revision || item !== contacts[active] || hidden || document.hidden) return;
      if (Math.floor(Date.now()/30000) !== period) { lastPeriod = -1; return; }
      $('trusted-code').textContent = code.slice(0,3)+' '+code.slice(3); lastPeriod = period;
    } catch { hidePrivate(); note('The code could not be calculated. Use your enrolled authenticator and verify the device clock.'); }
  }
  function clearAll() {
    for (const item of contacts) { item.secret = ''; item.signingKey = null; }
    contacts.length = 0; active = -1; hidden = false;
    $('trusted-import-key').value = ''; $('trusted-label').value = ''; $('trusted-announcement').textContent = '';
    choices(); note('Browser session cleared. Enrolled authenticator entries still work; clearing here does not revoke them.');
  }
  $('trusted-launch').addEventListener('click',()=>{
    const opening = area.hidden; area.hidden = !opening; $('trusted-launch').setAttribute('aria-expanded',String(opening));
    $('trusted-launch').textContent = opening ? 'Close authentication setup' : 'Open authentication setup';
    if (opening) { $('trusted-label').focus(); if(contacts.length) hidePrivate(); }
    else hidePrivate();
  });
  $('trusted-generate').addEventListener('click',()=>{ try { add(T.generate()); } catch { note('Secure cryptography is unavailable. Open Ready Together over HTTPS in a current browser.'); } });
  $('trusted-import').addEventListener('click',()=>{
    try { const value = T.encode(T.decode($('trusted-import-key').value)); add(value); }
    catch(error) { note(error.message); $('trusted-import-key').focus(); }
  });
  $('trusted-select').addEventListener('change',()=>{ active=Number($('trusted-select').value); hidden=false; selectContact(); });
  $('trusted-reveal').addEventListener('click',()=>{
    const show = $('trusted-key').type === 'password'; $('trusted-key').type = show ? 'text' : 'password';
    $('trusted-reveal').textContent = show ? 'Hide setup key' : 'Reveal setup key';
  });
  $('trusted-hide').addEventListener('click',hidePrivate);
  $('trusted-resume').addEventListener('click',()=>{ hidden=false; selectContact(); });
  $('trusted-clear').addEventListener('click',clearAll);
  $('trusted-forget').addEventListener('click',()=>{
    const item = contacts[active]; if(!item)return;
    item.secret=''; item.signingKey=null; contacts.splice(active,1); active=contacts.length-1;
    choices(); note('Entry removed from this browser session. Its enrolled app copies still work.');
  });
  $('trusted-announce').addEventListener('click',()=>{ $('trusted-announcement').textContent = 'Current shared code: '+$('trusted-code').textContent+'. '+$('trusted-countdown').textContent; });
  $('trusted-enrolled').addEventListener('click',()=>{ const item=contacts[active]; if(item)item.newlyCreated=false; $('trusted-enrollment').open=false; $('trusted-key').type='password'; $('trusted-reveal').textContent='Reveal setup key'; note('Keep this entry in your authenticator. Test both phones in airplane mode before relying on it.'); });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) { hidePrivate(); $('trusted-import-key').value=''; $('trusted-announcement').textContent=''; } });
  window.addEventListener('pagehide',clearAll);
  window.addEventListener('beforeprint',hidePrivate);
  $('reset').addEventListener('click',hidePrivate);
  $('confirm-reset').addEventListener('click',clearAll);
  setInterval(tick,250);
})();
