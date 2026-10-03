// Progressive enhancement: native details and calendar links work without JavaScript.
const rows = [...document.querySelectorAll('.event-row')];
const expand = document.querySelector('#expand-events');
function syncExpand() {
  const allOpen = rows.every(row => row.open);
  expand.setAttribute('aria-pressed', String(allOpen));
  expand.textContent = allOpen ? 'Collapse event details −' : 'Expand all events +';
}
if (expand) {
  expand.hidden = false;
  expand.addEventListener('click', () => {
    const open = !rows.every(row => row.open);
    rows.forEach(row => { row.open = open; });
    syncExpand();
  });
  rows.forEach(row => row.addEventListener('toggle', syncExpand));
}
function revealHash() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
  requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
}
window.addEventListener('hashchange', revealHash);
revealHash();
const links = [...document.querySelectorAll('.jump-nav a')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, {rootMargin: '-12% 0px -62% 0px', threshold: 0});
links.forEach(link => { const target = document.querySelector(link.hash); if(target) observer.observe(target); });
