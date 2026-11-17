/* Generate a downloadable PDF locally from the planner snapshot. */
(function (root) {
  let libraryRequest;
  function loadLibrary() {
    if (root.PDFLib) return Promise.resolve(root.PDFLib);
    if (!libraryRequest) {
      libraryRequest = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/pdf-lib.min.js';
        script.onload = () => root.PDFLib ? resolve(root.PDFLib) : reject(new Error('The PDF library could not be loaded.'));
        script.onerror = () => reject(new Error('The PDF library could not be loaded.'));
        document.head.appendChild(script);
      }).catch(error => {
        libraryRequest = null;
        throw error;
      });
    }
    return libraryRequest;
  }

  function safeText(text, font) {
    return Array.from(String(text).normalize('NFC'), char => {
      if (char === '\t' || char === '\r') return ' ';
      if (char === '\n') return char;
      try {
        font.encodeText(char);
        return char;
      } catch {
        return '?';
      }
    }).join('');
  }

  function wrap(text, font, size, width) {
    const lines = [];
    for (const paragraph of safeText(text, font).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        line = '';
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) {
            lines.push(line);
            line = '';
          }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  async function makePdf(plan, lib) {
    const { PDFDocument, StandardFonts, rgb } = lib;
    const doc = await PDFDocument.create();
    doc.setTitle('Ready Together | My preparedness plan');
    doc.setSubject('Household supplies, priority actions and backup power');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const display = await doc.embedFont(StandardFonts.TimesRomanBold);
    const green = rgb(.10, .23, .19);
    const muted = rgb(.31, .37, .33);
    const pale = rgb(.91, .94, .89);
    const left = 48, right = 564, width = right - left, bottom = 56;
    let page, y;
    function pageStart() {
      page = doc.addPage([612, 792]);
      page.drawRectangle({ x: 0, y: 741, width: 612, height: 51, color: green });
      page.drawText('READY TOGETHER  /  PERSONAL PLAN', { x: left, y: 761, font: bold, size: 11, color: rgb(1, 1, 1) });
      y = 710;
    }
    function ensure(height) {
      if (y - height < bottom) pageStart();
    }
    function lines(text, font = regular, size = 10, color = green, leading = 14) {
      for (const line of wrap(text, font, size, width)) {
        ensure(leading);
        if (line) page.drawText(line, { x: left, y, font, size, color });
        y -= leading;
      }
    }
    function heading(text) {
      page.drawRectangle({ x: left, y: y - 7, width, height: 24, color: pale });
      page.drawText(safeText(text, bold), { x: left + 8, y, font: bold, size: 12, color: green });
      y -= 28;
    }
    function itemHeight(item) {
      const labelRows = wrap(item.label, bold, 10, width).length;
      const detailRows = item.detail ? wrap(item.detail, regular, 10, width).length : 0;
      return (labelRows + detailRows) * 14;
    }
    pageStart();
    lines('My household preparedness plan', display, 26, green, 35);
    lines(plan.meta, bold, 11);
    lines(plan.household, regular, 10, muted);
    lines('Prepared ' + plan.date, regular, 10, muted);
    y -= 12;

    for (const section of plan.sections) {
      const firstHeight = itemHeight(section.items[0]);
      ensure(28 + (firstHeight < 625 ? firstHeight : 42));
      heading(section.title);
      for (const item of section.items) {
        const height = itemHeight(item);
        ensure(height < 625 ? height : 28);
        lines(item.label, bold);
        if (item.detail) lines(item.detail, regular, 10, muted);
        y -= 6;
      }
      y -= 8;
    }
    const total = doc.getPageCount();
    doc.getPages().forEach((p, index) => {
      p.drawLine({ start: { x: left, y: 44 }, end: { x: right, y: 44 }, color: pale, thickness: 1 });
      p.drawText('Keep your household copy somewhere accessible.', { x: left, y: 29, font: regular, size: 9, color: muted });
      p.drawText(`${index + 1} / ${total}`, { x: right - 28, y: 29, font: regular, size: 9, color: muted });
    });
    return doc.save();
  }

  async function download(plan) {
    const bytes = await makePdf(plan, await loadLibrary());
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Ready-Together-My-Plan.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const api = { download, makePdf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyPlanPdf = api;
})(globalThis);
