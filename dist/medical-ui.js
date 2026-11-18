/* Medical panel uses the planner's existing state, statuses and export controls. */
(function (root) {
  const M = root.ReadyMedical;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const byId = id => document.getElementById(id);
  const link = (url, text) => '<a href="' + escape(url) + '" target="_blank" rel="noopener">' + escape(text) + ' ↗</a>';
  const settings = ['medicalSave', 'medicalInclude', 'medicalDental', 'medicalPets', 'medicalBleeding', 'medicalChest'];
  let getState, updateState;

  function renderInventory() {
    const state = getState();
    byId('medical-inventory').innerHTML = state.medicalInventory.map((item, index) => {
      const field = (key, label, max, type = 'text') => '<label>' + label + '<input type="' + type +
        '" data-med-row="' + index + '" data-med-field="' + key + '" value="' + escape(item[key]) +
        '" maxlength="' + max + '"></label>';
      return '<fieldset class="medical-inventory-card"><legend>Item ' + (index + 1) + '</legend><div class="inputs two">' +
        field('member', 'Household alias (optional)', 30) +
        '<label>Type<select data-med-row="' + index + '" data-med-field="kind">' +
        Object.entries({ rx: 'Prescription', otc: 'OTC', supply: 'Supply or equipment', pet: 'Veterinary' }).map(([key, name]) =>
          '<option value="' + key + '"' + (item.kind === key ? ' selected' : '') + '>' + name + '</option>').join('') + '</select></label>' +
        field('name', 'Medicine or supply name', 100) + field('strength', 'Strength / formulation', 60) +
        field('quantity', 'Quantity + units (e.g., 28 tablets)', 60) + field('expires', 'Expiration date', 10, 'date') +
        field('refill', 'Next refill / review', 10, 'date') + field('storage', 'Labeled storage limits / requirements', 180) +
        '</div><button type="button" data-med-remove="' + index + '">Remove item ' + (index + 1) + '</button></fieldset>';
    }).join('') || '<p class="help">Start a private inventory here or print the blank template to fill in by hand.</p>';
  }

  function render() {
    const state = getState();
    const level = M.LEVELS[state.experience];
    byId('medical-level').textContent = level + ' medical plan for ' +
      (state.adults + state.children + state.infants) + ' people. ' +
      (state.experience === 'beginner' ? 'Start with essential first aid, suitable OTC supplies, regular prescriptions and training.' :
        state.experience === 'intermediate' ? 'Your Intermediate experience setting adds Advanced medical planning, bleeding-control training and optional monitoring equipment.' :
          'Your Advanced experience setting adds Expert medical planning, redundancy and supplies matched to documented training.');
    for (const key of settings) byId(key).checked = state[key];
    for (const key of ['medicalTrainingDate', 'medicalReview']) byId(key).value = state[key];
    byId('medical-pets-option').hidden = !state.pets;
    byId('medical-training-options').hidden = state.experience === 'beginner';
    byId('medical-chest-option').hidden = state.experience !== 'advanced' || !state.medicalBleeding;
    const container = byId('medical-guides');
    const open = new Set([...container.querySelectorAll('details[open]')].map(el => el.dataset.medicalTopic));
    container.innerHTML = M.worksheets(state).filter(sheet => sheet.banner !== 'PRESCRIPTION SERVICES').map(sheet =>
      '<details data-medical-topic="' + sheet.banner + '"' + (open.has(sheet.banner) ? ' open' : '') + '><summary>' +
      escape(sheet.title) + '</summary><p>' + escape(sheet.lead) + '</p><ul class="buying-items">' +
      sheet.rows.map(item => {
        const status = state.notNeeded[item.id] ? 'skip' : state.checked[item.id] ? 'done' : 'open';
        return '<li class="medical-item ' + status + '"><div><strong id="medical-title-' + item.id + '">' + escape(item.item) +
          '</strong><span class="buying-quantity">' + escape(item.target) + '</span><p>' +
          (item.optional ? '<strong>Optional. </strong>' : '') + escape(item.detail) +
          '</p>' + (item.cost ? '<p class="help">' + escape(item.cost) + '</p>' : '') +
          (item.url ? link(item.url, 'Source / shopping example') : '') + '</div><select data-med-status="' +
          item.id + '" aria-labelledby="medical-title-' + item.id + '">' +
          Object.entries({ open: 'To do', done: 'Done', skip: 'Not needed' }).map(([key, label]) =>
            '<option value="' + key + '"' + (key === status ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></li>';
      }).join('') + '</ul><dl class="buying-tips">' + sheet.tips.map(tip =>
        '<dt>' + escape(tip.label) + '</dt><dd>' + escape(tip.detail) + '</dd>').join('') +
      '</dl><div class="buying-sources">' + sheet.references.map(source => link(source.url, source.label)).join('') + '</div></details>'
    ).join('');
    const provider = M.worksheets(state).find(sheet => sheet.banner === 'PRESCRIPTION SERVICES');
    byId('medical-providers').innerHTML = '<p>' + escape(provider.lead) + '</p><ul class="buying-items">' +
      M.PROVIDERS.map(item => '<li><strong>' + link(item.url, item.name) + '</strong><p><strong>' + escape(item.price) +
        '</strong></p><p>' + escape(item.detail) + '</p><p>' + escape(item.check) + '</p></li>').join('') +
      '</ul><dl class="buying-tips">' + provider.tips.map(item => '<dt>' + escape(item.label) + '</dt><dd>' +
        escape(item.detail) + '</dd>').join('') + '</dl>' + link(M.SOURCES.pharmacy.url, 'Verify the dispensing pharmacy') +
      '<p class="help">Provider descriptions reflect their published offerings, with individual clinician approval required.</p>';
    const alerts = M.reminders(state);
    byId('medical-reminders').innerHTML = alerts.length ? '<h3>Review these dates</h3><ul>' +
      alerts.map(alert => '<li><strong>' + escape(alert.label) + '</strong> · ' + escape(alert.detail) + '</li>').join('') + '</ul>' :
      '<p class="help">No entered refill, expiration or stock-review dates are due within 30 days. Check quantities and storage separately.</p>';
    byId('medical-filled').disabled = !state.medicalInclude || !state.medicalInventory.length;
    byId('medical-add').disabled = state.medicalInventory.length >= 40;
  }

  async function downloadInventory(filled) {
    const state = getState();
    if (filled && !state.medicalInclude) return;
    byId('medical-pdf-status').textContent = 'Preparing inventory PDF…';
    try {
      await root.ReadyPlanPdf.download({
        report: 'medical', meta: 'Private medication and supply inventory', household: 'Household copy', date: new Date().toLocaleDateString('en-US'),
        sections: [], shopping: null, inventory: filled ? state.medicalInventory : [],
        inventoryReview: state.medicalReview, inventoryBlank: !filled
      });
      byId('medical-pdf-status').textContent = 'PDF sent to Downloads. Open it from Files or Downloads before you need it offline.';
    } catch {
      byId('medical-pdf-status').textContent = 'Inventory PDF could not be downloaded. Try again.';
    }
  }

  function init(read, update) {
    getState = read;
    updateState = update;
    for (const key of [...settings, 'medicalTrainingDate', 'medicalReview']) {
      byId(key).addEventListener('change', event => {
        updateState({ [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
      });
    }
    byId('medical-add').addEventListener('click', () => {
      const state = getState();
      if (state.medicalInventory.length >= 40) return;
      updateState({ medicalInventory: [...state.medicalInventory, {}] });
      renderInventory();
      byId('medical-inventory').querySelector('fieldset:last-child input').focus();
    });
    byId('medical-inventory').addEventListener('input', event => {
      const { medRow, medField } = event.target.dataset;
      if (medRow === undefined || !medField || !event.target.validity.valid) return;
      const inventory = getState().medicalInventory.map((item, index) => Number(medRow) === index ? { ...item, [medField]: event.target.value } : item);
      updateState({ medicalInventory: inventory });
    });
    byId('medical-inventory').addEventListener('click', event => {
      if (event.target.dataset.medRemove === undefined) return;
      updateState({ medicalInventory: getState().medicalInventory.filter((_, index) => index !== Number(event.target.dataset.medRemove)) });
      renderInventory();
      byId('medical-add').focus();
    });
    byId('medical-guides').addEventListener('change', event => {
      const id = event.target.dataset.medStatus;
      if (!id) return;
      const state = getState();
      const checked = { ...state.checked }, notNeeded = { ...state.notNeeded };
      delete checked[id];
      delete notNeeded[id];
      if (event.target.value === 'done') checked[id] = true;
      if (event.target.value === 'skip') notNeeded[id] = true;
      updateState({ checked, notNeeded });
      byId('medical-guides').querySelector('[data-med-status="' + id + '"]')?.focus();
    });
    byId('medical-template').addEventListener('click', () => downloadInventory(false));
    byId('medical-filled').addEventListener('click', () => downloadInventory(true));
  }
  root.ReadyMedicalUI = { init, render, renderInventory };
})(globalThis);
