function convertToTimestamp(isoString) {
  const date = new Date(isoString);
  return Math.floor(date.getTime() / 1000); 
}

function convertTimestampToDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
function addTask(taskData) {
  taskData.startTime = convertToTimestamp(taskData.startTime)
  taskData.endTime = convertToTimestamp(taskData.endTime)
  taskData.userID = USERID

  console.log("data add task: ")
  console.log(taskData)
  return fetch(window.BACKEND_URL + '/sqldb/tasks/', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userid: String(taskData.userID), 
      task_name: taskData.taskName,
      task_description: taskData.taskDescription,
      start_time: taskData.startTime, 
      end_time: taskData.endTime,    
      color: taskData.taskColor,
      status: taskData.status || 'In Progress',
      priority: taskData.priority || 0
    })
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log('✅ Task created:', data);
      // getUserTasks(); 
    })
    .catch((error) => {
      console.error('❌ Error adding task:', error);
    });
}


function deleteTask(taskData) {
  const userid = taskData.userid;
  const taskid = taskData.taskid;
  console.log("task to delete")
  return fetch(`${window.BACKEND_URL}/sqldb/tasks/${userid}/${taskid}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json'
    }
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Delete success:', data);
      
      // Remove task from global tasksData
      if (typeof tasksData !== 'undefined') {
        tasksData = tasksData.filter(task => task.taskid !== taskid);
      }
      
      getUserTasks();
    })
    .catch((error) => {
      console.error('Delete error:', error);
    });
}

function getUserTasks() {
  userid = USERID
  return fetch(`${window.BACKEND_URL}/sqldb/tasks/${userid}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  })
  .then((response) => response.json())
  .then((data) => {
    console.log('Fetched tasks:', data.tasks);
    const tasks = data.tasks || [];
    
    // Update global tasksData if it exists
    if (typeof tasksData !== 'undefined') {
      tasksData = tasks.map(task => ({
        ...task,
        startTime: convertTimestampToDateTime ? convertTimestampToDateTime(task.start_time) : task.start_time,
        endTime: convertTimestampToDateTime ? convertTimestampToDateTime(task.end_time) : task.end_time,
        taskName: task.task_name,
        taskDescription: task.task_description
      }));
    }
    
    return tasks;
  })
  .catch((error) => {
    console.error('Error fetching tasks:', error);
    return [];
  });
}

function updateTaskStatus(taskid, newStatus) {
  return fetch(`${window.BACKEND_URL}/sqldb/tasks/${USERID}/${taskid}`, {
    method: 'PUT',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: newStatus })
  })
  .then((res) => {
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  })
  .then((data) => {
    console.log('Task status updated:', data);
  })
  .catch((err) => {
    console.error('Failed to update status:', err);
  });
}
