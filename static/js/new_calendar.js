const sidebar      = document.getElementById('sidebar');
const toggleButton = document.getElementById('toggleSidebar');

// Global variable to store the calendar instance
let calendarInstance;

toggleButton.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
  
  // Force FullCalendar to recalculate dimensions after sidebar toggle
  // Add small delay to allow CSS transitions to complete
  setTimeout(() => {
    if (calendarInstance) {
      calendarInstance.updateSize();
    } else {
      // If calendarInstance is not set yet, try to get it from window
      const calendar = document.querySelector('.fc');
      if (calendar && calendar.fcApi) {
        calendar.fcApi.updateSize();
      }
    }
  }, 300);
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
        navigateToDate(selected);
      };

      grid.appendChild(cell);
    }
  }

  // Function to navigate the main calendar to the selected date
  function navigateToDate(date) {
    // Check if we have access to the main calendar instance
    if (window.calendarInstance) {
      // Get the current view
      const currentView = window.calendarInstance.view.type;
      
      // Navigate to the date in the current view
      window.calendarInstance.gotoDate(date);
      
      // Optionally, you can force a specific view when a date is selected
      // window.calendarInstance.changeView('timeGridDay', date);
      
      console.log(`Navigated to ${date.toDateString()} in ${currentView} view`);
    } else {
      console.warn('Main calendar instance not found');
    }
  }

  // Listen for changes in the main calendar to sync with mini calendar
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for the main calendar to be available
    const checkCalendar = setInterval(() => {
      if (window.calendarInstance) {
        clearInterval(checkCalendar);
        
        // Get initial date from main calendar
        const mainDate = window.calendarInstance.getDate();
        if (mainDate) {
          selected = mainDate;
          
          // Update mini calendar if needed
          if (selected.getMonth() !== cursor.getMonth() || 
              selected.getFullYear() !== cursor.getFullYear()) {
            cursor = new Date(selected);
          }
          build();
        }
        
        // Listen for date changes in main calendar
        window.calendarInstance.on('datesSet', function(info) {
          // Instead of using the view's start date, use the exact date from the calendar
          // This prevents highlighting the start of week/month instead of the actual date
          const newDate = window.calendarInstance.getDate();
          selected = newDate;
          
          // Only rebuild if month/year changed
          if (selected.getMonth() !== cursor.getMonth() || 
              selected.getFullYear() !== cursor.getFullYear()) {
            cursor = new Date(selected);
            build();
          } else {
            // Just update selection
            build();
          }
        });
      }
    }, 200);
  });

  /* initial build */
  build();

})();

document.addEventListener('DOMContentLoaded', function() {
  // grab elements
  const calendarEl = document.getElementById('calendar');
  const formModal  = document.getElementById('task-form');
  const formTitle  = document.getElementById('form-title');
  const inputTitle = document.getElementById('task-title');
  const inputDesc  = document.getElementById('task-desc');
  const inputStart = document.getElementById('task-start');
  const inputEnd   = document.getElementById('task-end');
  const taskGroupOptions = document.querySelectorAll('.task-group-option');
  const taskGroupValue = document.getElementById('task-group-value');
  const btnSave    = document.getElementById('task-save');
  const btnCancel  = document.getElementById('task-cancel');
  const sidebar    = document.getElementById('sidebar');
  const toggleBtn  = document.getElementById('toggleSidebar');

  let selectedRange = null;
  let isEditing     = false;
  let editingEvent  = null;

  // Task group color mapping
  const taskGroupColors = {
    growth: '#a0e7e5',
    wellness: '#b4f8c8',
    social: '#ffaebc',
    family: '#fbe7c6',
    career: '#b4c8ff',
    other: '#e7e7e7'
  };

  // Handle task group selection
  taskGroupOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      taskGroupOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');
      // Store the selected value
      taskGroupValue.value = option.dataset.group;
    });
  });

  // Format date for datetime-local input
  function formatDateForInput(date) {
    const d = new Date(date);
    // Format to YYYY-MM-DDThh:mm
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0') + 'T' + 
           String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }

  // init calendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView:  'timeGridWeek',
    headerToolbar: {
      left:  'createButton prev today next',
      center:'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    customButtons: {
      createButton: {
        text: '+',
        click: function() {
          // Show the task form modal for creating a new event
          isEditing = false;
          editingEvent = null;
          
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
          
          selectedRange = {
            start: now,
            end: oneHourLater,
            allDay: false
          };
          
          formTitle.textContent = 'Create Task';
          inputTitle.value = '';
          inputDesc.value = '';
          inputStart.value = formatDateForInput(now);
          inputEnd.value = formatDateForInput(oneHourLater);
          
          // Reset task group selection to 'other'
          taskGroupOptions.forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.group === 'other') {
              opt.classList.add('selected');
            }
          });
          taskGroupValue.value = 'other';
          
          formModal.style.display = 'flex';
        },
        className: 'fc-create-button'
      }
    },
    nowIndicator:  true,
    selectable:    true,
    selectMirror:  true,
    height: '100%', // Use 100% height to fill container
    
    // on new slot → show for create
    select(info) {
      isEditing      = false;
      editingEvent   = null;
      selectedRange  = info;
      
      formTitle.textContent = 'Create Task';
      inputTitle.value = '';
      inputDesc.value = '';
      
      // Set the date/time inputs
      inputStart.value = formatDateForInput(info.start);
      inputEnd.value = formatDateForInput(info.end);
      
      // Reset task group selection to 'other'
      taskGroupOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.group === 'other') {
          opt.classList.add('selected');
        }
      });
      taskGroupValue.value = 'other';
      
      formModal.style.display = 'flex';
    },

    // on click event → show for edit
    eventClick(info) {
      isEditing     = true;
      editingEvent  = info.event;
      selectedRange = {
        start: editingEvent.start,
        end:   editingEvent.end,
        allDay: editingEvent.allDay
      };
      
      formTitle.textContent = 'Edit Task';
      inputTitle.value = editingEvent.title;
      inputDesc.value = editingEvent.extendedProps.description || '';
      
      // Set the date/time inputs
      inputStart.value = formatDateForInput(editingEvent.start);
      inputEnd.value = formatDateForInput(editingEvent.end);
      
      // Set task group if available
      const taskGroup = editingEvent.extendedProps.group || 'other';
      taskGroupOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.group === taskGroup) {
          opt.classList.add('selected');
        }
      });
      taskGroupValue.value = taskGroup;
      
      formModal.style.display = 'flex';
    },

    eventDidMount(info) {
      // Apply background color based on task group
      const group = info.event.extendedProps.group || 'other';
      const color = taskGroupColors[group] || taskGroupColors.other;
      info.el.style.backgroundColor = color;
      info.el.style.borderColor = color;
    },

    editable:     true,
    slotMinTime:  '03:00:00',
    slotMaxTime:  '23:00:00',
    slotDuration: '00:30:00'
  });

  calendar.render();
  
  // Store calendar instance globally for the mini calendar to access
  window.calendarInstance = calendar;
  
  // Override the toggle sidebar action to force calendar resize
  toggleBtn.addEventListener('click', function() {
    // Let the original toggle happen (the class will be added by the event in new_calendar.js)
    
    // Force resize after toggle with a delay to let transitions complete
    setTimeout(function() {
      // Dispatch a window resize event to force calendar to recalculate
      window.dispatchEvent(new Event('resize'));
      
      // Also directly call the updateSize method
      calendar.updateSize();
    }, 300);
  });

  // Save handler
  btnSave.addEventListener('click', () => {
    const title = inputTitle.value.trim();
    const desc  = inputDesc.value.trim();
    const startTime = inputStart.value ? new Date(inputStart.value) : selectedRange.start;
    const endTime = inputEnd.value ? new Date(inputEnd.value) : selectedRange.end;
    const taskGroup = taskGroupValue.value;
    
    if (!title) {
      alert('Please enter a task name.');
      return;
    }

    if (isEditing && editingEvent) {
      // update existing
      editingEvent.setProp('title', title);
      editingEvent.setDates(startTime, endTime, { maintainDuration: false });
      editingEvent.setExtendedProp('description', desc);
      editingEvent.setExtendedProp('group', taskGroup);
    } else {
      // create new
      calendar.addEvent({
        title,
        start: startTime,
        end: endTime,
        allDay: selectedRange.allDay,
        backgroundColor: taskGroupColors[taskGroup],
        borderColor: taskGroupColors[taskGroup],
        extendedProps: { 
          description: desc,
          group: taskGroup
        }
      });
    }

    // hide & reset
    formModal.style.display = 'none';
    calendar.unselect();
    isEditing = false;
    editingEvent = null;
  });

  // Cancel handler
  btnCancel.addEventListener('click', () => {
    formModal.style.display = 'none';
    calendar.unselect();
  });
});