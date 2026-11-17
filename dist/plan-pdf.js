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
    const { PDFDocument, PDFString, StandardFonts, rgb } = lib;
    const doc = await PDFDocument.create();
    doc.setTitle(plan.report === 'shopping' ? 'Ready Together | Shopping checklist' : 'Ready Together | My preparedness plan');
    doc.setSubject('Household preparedness supplies and priorities');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const display = await doc.embedFont(StandardFonts.TimesRomanBold);
    const green = rgb(.10, .23, .19);
    const muted = rgb(.31, .37, .33);
    const pale = rgb(.91, .94, .89);
    const grid = rgb(.77, .82, .78);
    const stripe = rgb(.97, .98, .96);
    const left = 48, right = 564, width = right - left, bottom = 56;
    let page, y, currentSection = 'PERSONAL PLAN';
    function pageStart(section = currentSection) {
      currentSection = section;
      page = doc.addPage([612, 792]);
      page.drawRectangle({ x: 0, y: 741, width: 612, height: 51, color: green });
      page.drawText('READY TOGETHER  /  ' + section, { x: left, y: 761, font: bold, size: 11, color: rgb(1, 1, 1) });
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
    function introduction(title) {
      lines(title, display, 26, green, 35);
      lines(plan.meta, bold, 11);
      lines(plan.household, regular, 10, muted);
      lines('Prepared ' + plan.date, regular, 10, muted);
      y -= 12;
    }

    const columns = [
      { x: left + 25, label: 'Item / what to look for', width: 222 },
      { x: left + 257, label: 'Target', width: 81 },
      { x: left + 348, label: 'On hand', width: 68 },
      { x: left + 430, label: 'Still need', width: 75 }
    ];

    function tableHeader(title) {
      lines(title, bold, 13, green, 19);
      page.drawRectangle({ x: left, y: y - 22, width, height: 22, color: pale });
      for (const column of columns) {
        page.drawText(column.label, { x: column.x, y: y - 14, font: bold, size: 9, color: green });
      }
      y -= 22;
    }
    function rowLayout(item) {
      const name = wrap(item.item, bold, 10, columns[0].width);
      const detail = wrap(item.detail, regular, 9, columns[0].width);
      const values = [item.target, item.have, item.need].map((value, index) => {
        const font = index === 2 ? bold : regular;
        return value === null ? [] : wrap(value, font, 10, columns[index + 1].width);
      });
      const height = Math.max(34, 8 + name.length * 12 + detail.length * 11, 15 + Math.max(...values.map(cell => cell.length)) * 12);
      return { name, detail, values, height };
    }
    function drawRow(layout, index) {
      const { name, detail, values, height } = layout;
      if (index % 2 === 1) page.drawRectangle({ x: left, y: y - height, width, height, color: stripe });
      page.drawRectangle({ x: left + 5, y: y - 19, width: 11, height: 11, borderColor: green, borderWidth: .9 });
      name.forEach((line, i) => page.drawText(line, { x: columns[0].x, y: y - 14 - i * 12, font: bold, size: 10, color: green }));
      detail.forEach((line, i) => page.drawText(line, { x: columns[0].x, y: y - 14 - name.length * 12 - i * 11, font: regular, size: 9, color: muted }));
      values.forEach((cell, i) => {
        const column = columns[i + 1];
        if (!cell.length) {
          page.drawLine({ start: { x: column.x, y: y - 22 }, end: { x: column.x + column.width - 5, y: y - 22 }, color: grid, thickness: .8 });
        }
        cell.forEach((line, j) => page.drawText(line, { x: column.x, y: y - 14 - j * 12, font: i === 2 ? bold : regular, size: 10, color: green }));
      });
      y -= height;
      page.drawLine({ start: { x: left, y }, end: { x: right, y }, color: grid, thickness: .5 });
    }
    function shoppingTable(title, rows, newPage) {
      const layouts = rows.map(rowLayout);
      if (y - 41 - layouts[0].height < bottom) newPage();
      tableHeader(title);
      layouts.forEach((layout, index) => {
        if (y - layout.height < bottom) {
          newPage();
          tableHeader(title);
        }
        drawRow(layout, index);
      });
      y -= 17;
    }

    function shoppingPages(shopping) {
      function continueList() {
        pageStart('SHOPPING CHECKLIST');
        lines('Shopping checklist continued', display, 22, green, 30);
      }
      pageStart('SHOPPING CHECKLIST');
      introduction('Your shopping checklist');
      lines('Check boxes as you cover each target. Water and food use your entries. See the Food, First Aid, and Medicines pages for specific items and quantities.');
      y -= 11;
      shoppingTable('Get the essentials first', shopping.essentials, continueList);
      if (shopping.addOns.length) shoppingTable('Add for your household and risks', shopping.addOns, continueList);
      if (y > bottom + 53) {
        lines('Other items to pick up', bold);
        for (let offset = 8; offset <= 88 && y - offset > bottom; offset += 20) {
          page.drawLine({ start: { x: left, y: y - offset }, end: { x: right, y: y - offset }, color: grid, thickness: .8 });
        }
      }
    }

    function shoppingWorksheet(worksheet) {
      pageStart(worksheet.banner);
      lines(worksheet.title, display, 26, green, 34);
      lines(worksheet.lead, regular, 11, muted, 15);
      y -= 10;
      if (worksheet.highlight) {
        const lineCount = wrap(worksheet.highlight, bold, 10, width).length;
        ensure(lineCount * 14 + 8);
        lines(worksheet.highlight, bold);
        y -= 9;
      }
      shoppingTable(worksheet.tableTitle, worksheet.rows, () => {
        pageStart(worksheet.banner);
        lines(worksheet.title + ' (continued)', display, 21, green, 31);
      });
      for (const tip of worksheet.tips) {
        ensure(itemHeight(tip) + 7);
        lines(tip.label, bold);
        lines(tip.detail, regular, 10, muted);
        y -= 7;
      }
      const sourceY = 53;
      const prefix = 'Sources: ';
      page.drawText(prefix, { x: left, y: sourceY, font: regular, size: 9, color: muted });
      let x = left + regular.widthOfTextAtSize(prefix, 9) + 3;
      for (const source of worksheet.references) {
        const linkWidth = regular.widthOfTextAtSize(source.label, 9);
        page.drawText(source.label, { x, y: sourceY, font: regular, size: 9, color: green });
        page.drawLine({ start: { x, y: sourceY - 2 }, end: { x: x + linkWidth, y: sourceY - 2 }, color: grid, thickness: .6 });
        page.node.addAnnot(doc.context.register(doc.context.obj({
          Type: 'Annot', Subtype: 'Link', Rect: [x, sourceY - 3, x + linkWidth, sourceY + 9], Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(source.url) }
        })));
        x += linkWidth + 15;
      }
    }

    if (plan.shopping) {
      shoppingPages(plan.shopping);
      for (const worksheet of plan.worksheets ?? []) shoppingWorksheet(worksheet);
    }
    if (plan.sections.length) {
      pageStart('PERSONAL PLAN');
      introduction('My household preparedness plan');
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
    const fileNames = {
      shopping: 'Ready-Together-Shopping-Checklist.pdf',
      action: 'Ready-Together-Action-Plan.pdf',
      both: 'Ready-Together-My-Plan.pdf'
    };
    link.download = fileNames[plan.report] || fileNames.both;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const api = { download, makePdf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyPlanPdf = api;
})(globalThis);
