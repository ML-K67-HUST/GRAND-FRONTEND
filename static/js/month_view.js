// Global variables for tracking the current month view
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function renderCurrentMonth() {
  renderCalendar(currentYear, currentMonth);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCurrentMonth();
  updateMonthYearDisplay();
}

function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCurrentMonth();
  updateMonthYearDisplay();
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function getPreviousMonthLastDate(year, month) {
  return daysInMonth(year, month - 1);
}

// Helper to check if dates fall on the same day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function addTasksToDaySlot(dayDiv, currentDate) {
  // Filter tasks that occur on the currentDate using global tasksData
  const dayTasks = tasksData.filter((task) => {
    const taskStart = new Date(task.startTime);
    return isSameDay(taskStart, currentDate);
  });

  dayTasks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  if (dayTasks.length > 0) {
    const tasksContainer = document.createElement("div");
    tasksContainer.className = "day-tasks";

    // Determine which tasks to show immediately
    let tasksToShow = dayTasks;
    let remainingTasks = [];
    if (dayTasks.length > 5) {
      tasksToShow = dayTasks.slice(0, 4);
      remainingTasks = dayTasks.slice(4);
    }

    // Create elements for tasksToShow
    tasksToShow.forEach((task) => {
      const taskStart = new Date(task.startTime);
      const startTimeStr = taskStart.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const taskTimeDiv = document.createElement("div");
      taskTimeDiv.className = "task-time";
      taskTimeDiv.innerHTML = `<span class="task-start">${startTimeStr}</span> - ${task.taskName}`;

      // Attach event to show task info (delete/edit logic from your week view)
      taskTimeDiv.addEventListener("click", function () {
        document.getElementById("displayTaskName").textContent =
          task.taskName || "No name";
        document.getElementById("displayTaskDescription").textContent =
          task.taskDescription || "No description";

        const sTime = new Date(task.startTime);
        const eTime = new Date(task.endTime);
        document.getElementById("displayFromDate").textContent =
          sTime.toLocaleDateString();
        document.getElementById("displayToDate").textContent =
          eTime.toLocaleDateString();
        const startHour = sTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endHour = eTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        document.getElementById(
          "displayDuration"
        ).textContent = `${startHour} - ${endHour}`;

        document.getElementById("statusSelect").value = task.status;
        const infoContainer = document.getElementById("taskInfo");
        infoContainer.style.opacity = 1;
        infoContainer.style.visibility = "visible";

        document.getElementById("deleteButton").onclick = function () {
          deleteTask(task);
          tasksContainer.removeChild(taskTimeDiv);
          infoContainer.style.opacity = 0;
          infoContainer.style.visibility = "hidden";
        };

        document.getElementById("editButton").onclick = function () {
          infoContainer.style.opacity = 0;
          infoContainer.style.visibility = "hidden";
          document.getElementById("taskName").value = task.taskName;
          document.getElementById("taskDescription").value =
            task.taskDescription;
          document.getElementById("startTime").value = task.startTime;
          document.getElementById("endTime").value = task.endTime;
          document.getElementById("taskColor").value = task.taskColor;
          openCreateTaskModal();
          document.getElementById("createTaskForm").onsubmit = function (e) {
            e.preventDefault();
            const updatedTaskData = getTaskDataFromForm();
            deleteTask(task);
            tasksContainer.removeChild(taskTimeDiv);
            addTaskToCalendar(updatedTaskData);
            closeModal();
            this.reset();
          };
        };
      });

      tasksContainer.appendChild(taskTimeDiv);
    });

    // Inside addTasksToDaySlot in month_view.js (after creating moreDiv)
    if (remainingTasks.length > 0) {
      const moreDiv = document.createElement("div");
      moreDiv.className = "task-time more-tasks";
      moreDiv.textContent = `+ ${remainingTasks.length} more`;
      moreDiv.style.fontWeight = "bold";

      // Function to collapse the expanded container
      function collapseTasks() {
        tasksContainer.classList.remove("expanded");
        // Show back the moreDiv
        moreDiv.style.display = "block";
        // Remove all hidden tasks
        Array.from(tasksContainer.querySelectorAll(".hidden-task")).forEach(
          (el) => el.remove()
        );
        // Remove the collapse button if present
        const collapseBtn = tasksContainer.querySelector(".collapse-btn");
        if (collapseBtn) {
          collapseBtn.remove();
        }
        // Remove the outside click listener
        document.removeEventListener("click", onClickOutside, true);
      }

      // This function runs when a click is detected outside the tasksContainer
      function onClickOutside(e) {
        const taskInfoModal = document.getElementById("taskInfo");
        // Only collapse if click is outside tasksContainer AND outside the task info modal
        if (
          !tasksContainer.contains(e.target) &&
          !taskInfoModal.contains(e.target)
        ) {
          collapseTasks();
        }
      }

      moreDiv.addEventListener("click", function (e) {
        e.stopPropagation();
        // Expand the container
        tasksContainer.classList.add("expanded");
        // Append hidden tasks
        remainingTasks.forEach((task) => {
          const hiddenTask = document.createElement("div");
          hiddenTask.className = "task-time hidden-task";
          const taskStart = new Date(task.startTime);
          const startTimeStr = taskStart.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          hiddenTask.innerHTML = `<span class="task-start">${startTimeStr}</span> - ${task.taskName}`;

          // (Optional) Attach click event to show task info (similar to other tasks)
          hiddenTask.addEventListener("click", function (e) {
            e.stopPropagation();
            document.getElementById("displayTaskName").textContent =
              task.taskName || "No name";
            document.getElementById("displayTaskDescription").textContent =
              task.taskDescription || "No description";

            const sTime = new Date(task.startTime);
            const eTime = new Date(task.endTime);
            document.getElementById("displayFromDate").textContent =
              sTime.toLocaleDateString();
            document.getElementById("displayToDate").textContent =
              eTime.toLocaleDateString();
            const startHour = sTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const endHour = eTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            document.getElementById(
              "displayDuration"
            ).textContent = `${startHour} - ${endHour}`;

            document.getElementById("statusSelect").value = task.status;
            const infoContainer = document.getElementById("taskInfo");
            infoContainer.style.opacity = 1;
            infoContainer.style.visibility = "visible";

            document.getElementById("deleteButton").onclick = function () {
              deleteTask(task);
              tasksContainer.removeChild(taskTimeDiv);
              infoContainer.style.opacity = 0;
              infoContainer.style.visibility = "hidden";
            };

            document.getElementById("editButton").onclick = function () {
              infoContainer.style.opacity = 0;
              infoContainer.style.visibility = "hidden";
              document.getElementById("taskName").value = task.taskName;
              document.getElementById("taskDescription").value =
                task.taskDescription;
              document.getElementById("startTime").value = task.startTime;
              document.getElementById("endTime").value = task.endTime;
              document.getElementById("taskColor").value = task.taskColor;
              openCreateTaskModal();
              document.getElementById("createTaskForm").onsubmit = function (
                e
              ) {
                e.preventDefault();
                const updatedTaskData = getTaskDataFromForm();
                deleteTask(task);
                tasksContainer.removeChild(taskTimeDiv);
                addTaskToCalendar(updatedTaskData);
                closeModal();
                this.reset();
              };
            };
          });
          tasksContainer.insertBefore(hiddenTask, moreDiv);
        });
        // Hide the moreDiv since we are expanded
        moreDiv.style.display = "none";

        // Append a collapse button if not already added
        let collapseBtn = tasksContainer.querySelector(".collapse-btn");
        if (!collapseBtn) {
          collapseBtn = document.createElement("button");
          collapseBtn.className = "collapse-btn";
          collapseBtn.innerHTML = "&times;";
          collapseBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            collapseTasks();
          });
          tasksContainer.appendChild(collapseBtn);
        }
        // Attach a document-level click handler to collapse when clicking outside
        document.addEventListener("click", onClickOutside, true);
      });

      tasksContainer.appendChild(moreDiv);
    }

    dayDiv.appendChild(tasksContainer);
  }
}

function updateMonthYearDisplay() {
  const headerElement = document.querySelector(".day p");

  headerElement.textContent = `Tháng ${(currentMonth + 1)
    .toString()
    .padStart(2, "0")}, ${currentYear}`;
}

function renderCalendar(year, month) {
  const monthDaysDiv = document.getElementById("month-days");
  monthDaysDiv.innerHTML = "";

  const totalSlots = 35; // For example, a 5-week grid
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInCurrentMonth = daysInMonth(year, month);
  const daysInPrevMonth = getPreviousMonthLastDate(year, month);

  let daySlot = 1;
  let prevMonthDay = daysInPrevMonth - firstDay + 1;

  for (let i = 0; i < totalSlots; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day-slot");

    const day = document.createElement("p");
    day.classList.add("day-in-month");
    dayDiv.appendChild(day);

    let currentDate;
    if (i < firstDay) {
      // Day from previous month
      day.textContent = prevMonthDay;
      day.classList.add("prev-month");
      currentDate = new Date(year, month - 1, prevMonthDay);
      currentDate.setHours(0, 0, 0, 0);
      prevMonthDay++;
    } else if (daySlot <= daysInCurrentMonth) {
      // Day from current month
      day.textContent = daySlot;
      day.classList.add("current-month");
      currentDate = new Date(year, month, daySlot);
      currentDate.setHours(0, 0, 0, 0);
      daySlot++;
    } else {
      // Day from next month
      day.textContent = daySlot - daysInCurrentMonth;
      day.classList.add("next-month");
      currentDate = new Date(year, month + 1, daySlot - daysInCurrentMonth);
      currentDate.setHours(0, 0, 0, 0);
      daySlot++;
    }

    // In your renderCalendar function, after computing currentDate for each day:
    if (isSameDay(currentDate, new Date())) {
      day.classList.add("current-day");
    }

    // Inside your renderCalendar loop, after computing currentDate:
    dayDiv.addEventListener("dblclick", function (e) {
      // Only react if the click is on the day-slot itself and not one of the inner task elements
      if (e.target === dayDiv || e.target.classList.contains("day-in-month")) {
        // Format the date as "YYYY-MM-DD"
        const formattedDate = `${currentDate.getFullYear()}-${(
          currentDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${currentDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;
        dayDiv.dataset.date = formattedDate;
        // Pre-fill the modal input fields with the selected date plus a default time.
        // For example, set start time to 09:00 and end time to 10:00.
        document.getElementById("startTime").value = formattedDate + "T09:00";
        document.getElementById("endTime").value = formattedDate + "T10:00";
        openCreateTaskModal();
      }
    });

    // Insert tasks for this day (if any)
    addTasksToDaySlot(dayDiv, currentDate);

    monthDaysDiv.appendChild(dayDiv);
  }
}

function addTaskToMonthCalendar(taskData) {
  // Add the new task to the global tasksData array if not already present.
  // (Use this if your tasksData source is mutable.)
  tasksData.push(taskData);

  // Get the task's date (normalized to midnight).
  const taskDate = new Date(taskData.startTime);
  taskDate.setHours(0, 0, 0, 0);

  // Format the date as YYYY-MM-DD using local values.
  const formattedTaskDate = `${taskDate.getFullYear()}-${(
    taskDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${taskDate.getDate().toString().padStart(2, "0")}`;

  // Find the matching day-slot using the data-date attribute (which is set in renderCalendar)
  const daySlot = document.querySelector(
    `.day-slot[data-date="${formattedTaskDate}"]`
  );
  if (!daySlot) {
    console.error("No day slot found for date: " + formattedTaskDate);
    return;
  }

  // Remove the old tasks container (if it exists) from the day slot.
  const existingTasksContainer = daySlot.querySelector(".day-tasks");
  if (existingTasksContainer) {
    existingTasksContainer.remove();
  }

  // Re-populate the day slot with tasks for this date.
  addTasksToDaySlot(daySlot, taskDate);
}
