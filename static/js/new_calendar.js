const sidebar      = document.getElementById('sidebar');
const toggleButton = document.getElementById('toggleSidebar');

toggleButton.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

/* ===== LOCAL STORAGE ===== */
const STORAGE_EVENTS = 'calendarEvents';
const STORAGE_VIEW   = 'calendarLastView';
let events = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]'); // { id, title, start, end }
let currentView = localStorage.getItem(STORAGE_VIEW) || 'month';

/* ===== GLOBAL STATE ===== */
let viewDate    = new Date();        // first visible day in main view
let selectedDay = new Date(viewDate);// highlighted in mini calendar

/*  Mini Calendar Component  */
(function () {
  const container = document.getElementById('miniCalendar');

  let cursor      = new Date();         // first day of the visible month
  let selected    = new Date();         // currently selected day

  const header    = document.createElement('div');
  const label     = document.createElement('span');
  const prevBtn   = document.createElement('button');
  const nextBtn   = document.createElement('button');
  const grid      = document.createElement('div');

  header.className = 'mc-header';
  grid.className   = 'mc-grid';
  prevBtn.innerHTML = '&lsaquo;';
  nextBtn.innerHTML = '&rsaquo;';
  header.append(prevBtn, label, nextBtn);
  container.append(header, grid);

  const dayNames = ['S','M','T','W','T','F','S'];
  dayNames.forEach(d => {
    const e = document.createElement('div');
    e.className = 'mc-dow';
    e.textContent = d;
    grid.appendChild(e);
  });

  prevBtn.onclick = () => { cursor.setMonth(cursor.getMonth() - 1); build(); };
  nextBtn.onclick = () => { cursor.setMonth(cursor.getMonth() + 1); build(); };

  function iso(d) { return d.toISOString().split('T')[0]; }
  function isToday(d) {
    const t = new Date();
    return d.getDate() === t.getDate() &&
           d.getMonth() === t.getMonth() &&
           d.getFullYear() === t.getFullYear();
  }

  function build() {
    /* header label */
    label.textContent = cursor.toLocaleDateString(undefined, {
      month: 'long',
      year : 'numeric'
    });

    /* clear previous date cells */
    grid.querySelectorAll('.mc-cell').forEach(n => n.remove());

    /* compute month range */
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first  = new Date(y, m, 1);
    const offset = first.getDay();
    const days   = new Date(y, m + 1, 0).getDate();
    const total  = Math.ceil((offset + days) / 7) * 7; // full weeks grid

    for (let i = 0; i < total; i++) {
      const dayNum = i - offset + 1;
      const date   = new Date(y, m, dayNum);

      const cell = document.createElement('div');
      cell.className = 'mc-cell';
      cell.textContent = date.getDate();

      if (i < offset || dayNum > days)     cell.classList.add('other');
      if (isToday(date))                    cell.classList.add('today');
      if (iso(date) === iso(selected))      cell.classList.add('selected');

      cell.onclick = () => {
        selected = new Date(date);
        build();
        onDateSelect(iso(selected));
      };

      grid.appendChild(cell);
    }
  }

  /* initial build */
  build();

  /* public callback */
  function onDateSelect(isoDate) {
    console.log('Selected:', isoDate);
    // Replace with your own handler, e.g. update parent view
  }
})();

