function addTaskToCalendar(taskData) {
  const task = createTaskElement(taskData);
  positionTask(task, new Date(taskData.startTime), new Date(taskData.endTime));
  document.querySelector(".time-slots").appendChild(task);
  addTask(taskData);
}

function addTaskToCalendarFromDB(taskData) {
  const task = createTaskElement(taskData);
  if (
    currentWeek <= new Date(taskData.startTime) &&
    new Date(taskData.endTime) <= endWeek
  )
    positionTask(
      task,
      new Date(taskData.startTime),
      new Date(taskData.endTime)
    );
  document.querySelector(".time-slots").appendChild(task);
}

function taskOccursInCurrentWeek(taskData) {
  const taskStart = new Date(taskData.startTime);
  // currentWeek is assumed to be set to the Sunday of the week (at midnight)
  // and endWeek is the Saturday of this week (at midnight)
  return (
    taskStart >= currentWeek &&
    taskStart < new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  );
}

function createTaskElement(taskData) {
  const task = document.createElement("button");
  task.classList.add("task");

  const taskName = document.createElement("p");
  taskName.classList.add("taskName");
  taskName.textContent = taskData.taskName;

  const taskDescript = document.createElement("p");
  taskDescript.classList.add("taskDescription");
  taskDescript.textContent = taskData.taskDescription;
  const startTime = new Date(taskData.startTime);
  const endTime = new Date(taskData.endTime);

  const taskTime = document.createElement("p");
  taskTime.classList.add("taskTime");
  taskTime.textContent = `${startTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  task.appendChild(taskName);
  task.appendChild(taskTime);
  task.appendChild(taskDescript);
  task.style.backgroundColor = taskData.taskColor;

  task.dataset.status = "In progress";
  task.dataset.startTime = new Date(taskData.startTime).toISOString();
  task.dataset.endTime = new Date(taskData.endTime).toISOString();

  // Lấy các giá trị từ các trường input khi click vào button
  task.addEventListener("click", function (event) {
    // If task was dragged, do not show task info.
    if (wasDragged) {
      // Reset the flag for future clicks and ignore this click.
      wasDragged = false;
      return;
    }
    // Kiểm tra nếu taskName và taskDescription trống
    const taskName = taskData.taskName ? taskData.taskName : "No name";
    const taskDescription = taskData.taskDescription
      ? taskData.taskDescription
      : "No description";

    // Hiển thị thông tin task
    document.getElementById("displayTaskName").textContent = taskName;
    document.getElementById("displayTaskDescription").textContent =
      taskDescription;

    // Xử lý thời gian bắt đầu và kết thúc
    const startTime = new Date(taskData.startTime);
    const endTime = new Date(taskData.endTime);

    const fromDate = startTime.toLocaleDateString();
    const toDate = endTime.toLocaleDateString();
    const startHour = formatTimeForDisplay(
      startTime.getHours(),
      startTime.getMinutes()
    );
    const endHour = formatTimeForDisplay(
      endTime.getHours(),
      endTime.getMinutes()
    );
    const duration = `${startHour} - ${endHour}`;

    // Hiển thị thời gian
    document.getElementById("displayFromDate").textContent = fromDate;
    document.getElementById("displayToDate").textContent = toDate;
    document.getElementById("displayDuration").textContent = duration;

    // Kiểm tra trạng thái của task và cập nhật dropdown
    const statusSelect = document.getElementById("statusSelect");
    statusSelect.value = taskData.status; // Gán giá trị status hiện tại

    //Nút xóa

    // Hiển thị khung task info (giữ nguyên màu)
    const showtask = document.getElementById("taskInfo");
    showtask.style.opacity = 1;
    showtask.style.visibility = "visible";

    document.getElementById("deleteButton").onclick = function () {
      deleteTask(taskData);
      document.querySelector(".time-slots").removeChild(task);
      showtask.style.opacity = 0;
      showtask.style.visibility = "hidden";
    };

    //Nút chỉnh sửa
    document.getElementById("editButton").onclick = function () {
      showtask.style.opacity = 0;
      showtask.style.visibility = "hidden";
      // Show the modal

      // Set the values in the modal
      document.getElementById("taskName").value = taskData.taskName;
      document.getElementById("taskDescription").value =
        taskData.taskDescription;
      document.getElementById("startTime").value = taskData.startTime; // Format for datetime-local
      document.getElementById("endTime").value = taskData.endTime; // Format for datetime-local
      document.getElementById("taskColor").value = taskData.taskColor;
      console.log(document.getElementById("startTime").value);
      openCreateTaskModal();
      // Modify the submit handler for the form
      document.getElementById("createTaskForm").onsubmit = function (e) {
        e.preventDefault();
        const updatedTaskData = getTaskDataFromForm();
        deleteTask(taskData);
        document.querySelector(".time-slots").removeChild(task);
        addTaskToCalendar(updatedTaskData);
        closeModal();
        this.reset();
      };
    };
  });

  let hoverTimer = null;

  // Hiệu ứng khi rê chuột vào task
  task.addEventListener("mouseover", function (event) {
    hoverTimer = setTimeout(() => {
      // Only apply the effect if we're not dragging
      if (!dragTask) {
        const origWidth = parseFloat(task.dataset.originalWidth);
        const origLeft = parseFloat(task.dataset.originalLeft);
        task.style.overflow = "visible";
        task.style.height = "auto";
        // Increase width by 1.5 times and adjust left so that the effect is centered.
        task.style.left = `${origLeft - origWidth * 0.25}px`;
        task.style.width = `${origWidth * 1.5}px`;
        task.style.zIndex = 2;
      }
    }, 500); // Delay set to 2000 milliseconds (2 seconds)
  });
  // Hiệu ứng khi rời chuột khỏi task
  task.addEventListener("mouseout", function (event) {
    // Cancel the timer if the mouse leaves before 2 seconds
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    // Restore original dimensions and z-index immediately on mouseout
    task.style.overflow = "hidden";
    task.style.width = task.dataset.originalWidth;
    task.style.height = task.dataset.originalHeight;
    task.style.left = task.dataset.originalLeft;
    task.style.zIndex = 1;
  });

  let dragTask = null;
  let wasDragged = false;
  let offsetX = 0;
  let offsetY = 0;

  document.addEventListener("mousedown", function (event) {
    // Check if a task was clicked (or one of its children)
    const taskElement = event.target.closest(".task");
    if (taskElement) {
      dragTask = taskElement;
      // Prevent default to avoid text selection during drag
      wasDragged = false;
      event.preventDefault();
      // Compute the offset of the mouse inside the task element
      const rect = dragTask.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      // Raise the z-index during drag
      dragTask.style.zIndex = 100;
    }
  });

  document.addEventListener("mousemove", function (event) {
    if (dragTask) {
      wasDragged = true;
      // Get container relative positioning (assuming .time-slots container)
      const container = document.querySelector(".time-slots");
      const containerRect = container.getBoundingClientRect();
      // Compute new left and top relative to container
      let newLeft = event.clientX - containerRect.left - offsetX;
      let newTop = event.clientY - containerRect.top - offsetY;
      // Optionally add boundaries here so task stays within container
      dragTask.style.left = `${newLeft}px`;
      dragTask.style.top = `${newTop}px`;
    }
  });

  document.addEventListener("mouseup", function (event) {
    if (dragTask) {
      // Get container dimensions
      const container = document.querySelector(".time-slots");
      const containerRect = container.getBoundingClientRect();
      const cellWidth = containerRect.width / 7; // width for one day column
      const cellHeight = 20; // as used in positionTask
      const blankOffset = 30; // same offset used when positioning

      // --- Horizontal snapping ---
      let currentLeft = parseFloat(dragTask.style.left);
      let dayIndex = Math.round(currentLeft / cellWidth);
      dayIndex = Math.max(0, Math.min(dayIndex, 6));
      const snappedLeft = dayIndex * cellWidth;
      dragTask.style.left = `${snappedLeft}px`;
      // Update dataset with the new left position for future drags
      dragTask.dataset.originalLeft = `${snappedLeft}px`;

      // --- Vertical snapping ---
      let currentTop = parseFloat(dragTask.style.top);
      // Remove the blankOffset then round to nearest cell height
      let rowIndex = Math.round((currentTop - blankOffset) / cellHeight);
      rowIndex = Math.max(0, rowIndex);
      const snappedTop = blankOffset + rowIndex * cellHeight;
      dragTask.style.top = `${snappedTop}px`;

      // --- Update task time based on the new vertical position ---
      const taskTimeElement = dragTask.querySelector(".taskTime");
      if (
        taskTimeElement &&
        dragTask.dataset.startTime &&
        dragTask.dataset.endTime
      ) {
        // Get the original start and end time as Date objects
        let originalStartTime = new Date(dragTask.dataset.startTime);
        let originalEndTime = new Date(dragTask.dataset.endTime);

        // Calculate the duration (in minutes) so we can preserve it
        const durationMinutes =
          (originalEndTime - originalStartTime) / (1000 * 60);

        // Calculate the new hour and minute based on rowIndex (assuming 4 slots per hour)
        const newHour = Math.floor(rowIndex / 4);
        const newMinute = (rowIndex % 4) * 15;

        // Update the start time with the new hour and minute
        originalStartTime.setHours(newHour, newMinute);

        // Compute the new end time based on the preserved duration
        let newEndTime = new Date(
          originalStartTime.getTime() + durationMinutes * 60000
        );

        // Update the displayed time text
        taskTimeElement.textContent =
          `${originalStartTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ` +
          `${newEndTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;

        // Update dataset with the new times
        dragTask.dataset.startTime = originalStartTime.toISOString();
        dragTask.dataset.endTime = newEndTime.toISOString();
      }

      // Restore the task's z-index and clear the dragTask variable
      dragTask.style.zIndex = 1;
      dragTask = null;
    }
  });

  // Cập nhật trạng thái khi người dùng thay đổi
  document
    .getElementById("statusSelect")
    .addEventListener("change", function (event) {
      const newStatus = event.target.value;
      taskData.status = newStatus; // Cập nhật trạng thái mới của task
      updateTaskColor(task, newStatus); // Cập nhật màu của task trong lịch
    });

  // Thêm sự kiện cho nút đóng
  document.getElementById("closeButton").addEventListener("click", function () {
    const showtask = document.getElementById("taskInfo");
    showtask.style.opacity = 0;
    showtask.style.visibility = "hidden";
  });

  return task;
}

function updateTaskColor(taskElement, status) {
  if (status === "Completed") {
    taskElement.style.backgroundColor = "green"; // Completed: Xanh lá cây
  } else if (status === "Pass due") {
    taskElement.style.backgroundColor = "red"; // Pass due: Đỏ
  } else {
    taskElement.style.backgroundColor = "blue"; // In progress: Xanh dương
  }
}

// Chỉnh màu dựa trên status
const colors = ["#0000FF", "#FF0000", "#008000"];

// function positionTask(taskElement, startTime, endTime) {
//   const timeSlots = document.querySelectorAll('.time-slot');

//   const startSlotElement = timeSlots[getIndexFromTime(startTime) + 7];
//   const endSlotElement = timeSlots[getIndexFromTime(endTime) + 7];

//   const startRect = startSlotElement.getBoundingClientRect();
//   const endRect = endSlotElement.getBoundingClientRect();
//   const timeSlotRect = timeSlots[0].getBoundingClientRect();

//   taskElement.style.position = 'absolute';
//   taskElement.style.left = `${
//     Math.min(startRect.left, endRect.left) - timeSlotRect.left
//   }px`;
//   taskElement.style.top = `${
//     Math.min(startRect.top, endRect.top) - timeSlotRect.top + 10
//   }px`;
//   taskElement.style.width = `${
//     Math.max(startRect.right, endRect.right) -
//     Math.min(startRect.left, endRect.left)
//   }px`;
//   taskElement.style.height = `${
//     Math.max(startRect.bottom, endRect.bottom) -
//     Math.min(startRect.top, endRect.top) -
//     20
//   }px`;
// }

// function positionTask(taskElement, startTime, endTime) {
//   // Get container dimensions
//   const container = document.querySelector('.time-slots');
//   const containerRect = container.getBoundingClientRect();
//   // Our grid uses 7 columns
//   const cellWidth = containerRect.width / 7;
//   const cellHeight = 20; // as defined in week_view.css grid-template-rows

//   // blankOffset accounts for the extra blank cells (here assumed 30px)
//   const blankOffset = 30;

//   // Calculate the day offset from the currentWeek (currentWeek is a Date set to the Sunday)
//   // We assume each task is within the same week (or spans full days)
//   const msPerDay = 1000 * 60 * 60 * 24;
//   const startDayIndex = Math.floor((startTime - currentWeek) / msPerDay);
//   const endDayIndex = Math.floor((endTime - currentWeek) / msPerDay);

//   // Calculate the row index. There are 4 slots per hour.
//   const startRow = startTime.getHours() * 4 + Math.floor(startTime.getMinutes() / 15);
//   const endRow = endTime.getHours() * 4 + Math.floor(endTime.getMinutes() / 15);

//   // For a task that starts and ends on the same day:
//   // left = (day index * cellWidth)
//   // top = (row index * cellHeight) + blankOffset
//   // width = cellWidth (if spanning one day) or ((number of days spanned) * cellWidth)
//   // height = (difference in row indices) * cellHeight
//   taskElement.style.position = 'absolute';
//   taskElement.style.left = `${startDayIndex * cellWidth}px`;
//   taskElement.style.top = `${startRow * cellHeight + blankOffset}px`;
//   taskElement.style.width = `${(endDayIndex - startDayIndex + 1) * cellWidth}px`;
//   taskElement.style.height = `${(endRow - startRow) * cellHeight}px`;
// }

function positionTask(taskElement, startTime, endTime) {
  // Get container dimensions and compute cell dimensions
  const container = document.querySelector(".time-slots");
  const containerRect = container.getBoundingClientRect();
  const cellWidth = containerRect.width / 7; // 7 days in the week
  const cellHeight = 20; // our grid rows are 20px tall
  const blankOffset = 30; // height of the initial blank row

  // Calculate which day column the task is on
  // (assume tasks are within the same week)
  const dayIndex = Math.floor(
    (startTime - currentWeek) / (1000 * 60 * 60 * 24)
  );

  // Calculate the row index (0 to 95) based on time
  const startRow =
    startTime.getHours() * 4 + Math.floor(startTime.getMinutes() / 15);
  const endRow = endTime.getHours() * 4 + Math.floor(endTime.getMinutes() / 15);

  // For tasks on the same day, set:
  const left = dayIndex * cellWidth;
  const top = blankOffset + startRow * cellHeight;
  const width = cellWidth; // if a task spans one day
  const height = (endRow - startRow) * cellHeight;

  taskElement.style.position = "absolute";
  taskElement.style.left = `${left}px`;
  taskElement.style.top = `${top}px`;
  taskElement.style.width = `${width}px`;
  taskElement.style.height = `${height}px`;

  // Store the computed height and width for later use (e.g., hover restoration)
  taskElement.dataset.originalWidth = `${width}px`;
  taskElement.dataset.originalHeight = `${height}px`;
  taskElement.dataset.originalLeft = `${left}px`;
}
