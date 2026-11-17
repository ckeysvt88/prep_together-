/* Walk through the live planner without changing any plan settings. */
(() => {
  const byId = id => document.getElementById(id);
  const tour = byId('planner-tour');
  const start = byId('start-tour');
  const title = byId('tour-title');
  const description = byId('tour-description');
  const progress = byId('tour-progress');
  const back = byId('tour-back');
  const next = byId('tour-next');
  const mobile = window.matchMedia('(max-width: 760px)');
  const steps = [
    {
      target: 'tour-experience',
      title: 'Choose how much guidance you want',
      description: 'New to prepping? Start with Beginner for plain-language buying advice. Intermediate and Advanced add more detail. This choice sets the guidance, and you’ll pick the number of days separately.'
    },
    {
      target: 'tour-household',
      title: 'Tell us who you’re preparing for',
      description: 'Pick one adult, two adults, or a family to set your starting counts. Adjust the numbers below, add infants or pets, and check the hazards that apply where you live.'
    },
    {
      target: 'tiers',
      title: 'Pick a supply goal',
      description: 'Choose how long you want your supplies to last. Core covers 3 days, Advanced covers 14, and Super prep covers 30. Start with Core if you’re building your first kit.'
    },
    {
      target: 'tour-inventory',
      title: 'Count what you already have',
      description: 'Enter the safe water and food already on hand. The planner shows what you still need. In Beginner, count complete days of meals for everyone in your household.'
    },
    {
      target: 'buying-heading',
      title: 'Find out what to buy',
      description: 'Open a topic to see examples, quantities, what to check on the package, and how to set things up. Start with the three-day grocery basket or another topic you need.'
    },
    {
      target: 'tour-download',
      title: 'Download your final plan',
      description: 'Save your personalized PDF here, even with tasks still open. Use the report choice in Your starting point if you’d like just the shopping checklist, just the action plan, or both.'
    }
  ];

  let index = -1;
  let target;
  let frame = 0;
  let anchorTop = 0;
  const gap = 16;
  const inset = 12;
  const viewport = window.visualViewport;

  function position() {
    frame = 0;
    if (!target) return;

    const viewLeft = viewport?.offsetLeft ?? 0;
    const viewTop = viewport?.offsetTop ?? 0;
    const viewWidth = viewport?.width ?? document.documentElement.clientWidth;
    const viewHeight = viewport?.height ?? window.innerHeight;
    const viewRight = viewLeft + viewWidth;
    const viewBottom = viewTop + viewHeight;
    tour.style.setProperty('--tour-viewport-height', `${viewHeight}px`);
    tour.style.setProperty('--tour-viewport-width', `${viewWidth}px`);

    const { width, height } = tour.getBoundingClientRect();
    const anchor = target.getBoundingClientRect();
    anchorTop = anchor.top;
    let left = viewRight - width - inset;
    let top = viewBottom - height - inset;
    let side = '';
    if (!mobile.matches && anchor.bottom > viewTop && anchor.top < viewBottom) {
      if (viewRight - anchor.right >= width + gap + inset) {
        left = anchor.right + gap;
        top = anchor.top - 10;
        side = 'right';
      } else if (anchor.left - viewLeft >= width + gap + inset) {
        left = anchor.left - width - gap;
        top = anchor.top - 10;
        side = 'left';
      } else if (viewBottom - anchor.bottom >= height + gap + inset) {
        left = anchor.left;
        top = anchor.bottom + gap;
        side = 'below';
      } else if (anchor.top - viewTop >= height + gap + inset) {
        left = anchor.left;
        top = anchor.top - height - gap;
        side = 'above';
      }
    }

    left = Math.max(viewLeft + inset, Math.min(left, viewRight - width - inset));
    top = Math.max(viewTop + inset, Math.min(top, viewBottom - height - inset));
    tour.style.left = `${left}px`;
    tour.style.top = `${top}px`;
    tour.dataset.side = tour.scrollHeight > tour.clientHeight ? '' : side;
    tour.removeAttribute('data-detached');
    const horizontal = side === 'above' || side === 'below';
    const arrow = horizontal
      ? (anchor.left + anchor.right) / 2 - left
      : (anchor.top + anchor.bottom) / 2 - top;
    const edgeLength = horizontal ? width : height;
    tour.style.setProperty('--tour-arrow', `${Math.max(18, Math.min(arrow, edgeLength - 18))}px`);
  }

  function queuePosition() {
    if (target && !frame) frame = requestAnimationFrame(position);
  }

  function showStep(stepIndex) {
    const step = steps[stepIndex];
    const element = byId(step.target);
    if (!element) return;

    target?.classList.remove('tour-highlight');
    index = stepIndex;
    target = element;
    // Place the help before the active section in reading and keyboard order.
    target.before(tour);
    target.classList.add('tour-highlight');
    progress.textContent = `Step ${index + 1} of ${steps.length}`;
    title.textContent = step.title;
    description.textContent = step.description;
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? 'Finish tour' : 'Next';
    tour.hidden = false;
    tour.scrollTop = 0;
    target.scrollIntoView({ block: mobile.matches ? 'start' : 'center', behavior: 'instant' });
    position();
    title.focus({ preventScroll: true });
  }

  function endTour(focus) {
    const section = target;
    if (!section) return;
    section.classList.remove('tour-highlight');
    target = undefined;
    index = -1;
    tour.hidden = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const control = focus || section.querySelector('select, input, button, a') ||
      (section.id === 'buying-heading' ? byId('buying-topics').querySelector('summary') : null);
    (control || start).focus({ preventScroll: Boolean(control) });
  }

  start.addEventListener('click', () => showStep(0));
  byId('skip-tour').addEventListener('click', () => endTour());
  back.addEventListener('click', () => showStep(index - 1));
  next.addEventListener('click', () => {
    if (index === steps.length - 1) endTour(byId('download-pdf'));
    else showStep(index + 1);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && target && !event.defaultPrevented && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      const active = document.activeElement;
      endTour(target.contains(active) ? active : null);
    }
  });
  window.addEventListener('scroll', () => {
    // Keep the buttons steady while the user scrolls or edits a highlighted field.
    if (target && tour.dataset.side) {
      tour.toggleAttribute('data-detached', Math.abs(target.getBoundingClientRect().top - anchorTop) > gap);
    }
  }, { passive: true });
  window.addEventListener('resize', queuePosition);
  viewport?.addEventListener('resize', queuePosition);
  viewport?.addEventListener('scroll', queuePosition, { passive: true });
  start.hidden = false;
})();
