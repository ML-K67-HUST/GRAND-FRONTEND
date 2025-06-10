import axios from 'axios';

const TOGETHER_API_KEY = '3d089f4c75bff2222e0f7de2ca26ef1ad8640566579c46b8b5674bb9a18e5638a';
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';

const TASK_TYPES = ["Growth", "Wellness", "Social", "Family", "Career"];

const SYSTEM_PROMPT = `
You are a helpful assistant that classifies user tasks into one of the following categories:
${TASK_TYPES.join(', ')}.

Use task name and description. Respond with only the category name.
`;

// Classifier
export async function classifyTaskType(task) {
  const userPrompt = `Task: "${task.task_name}". Description: "${task.task_description}". What category does this task fall into?`;

  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      },
      {
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content.trim().toLowerCase();
    const matched = TASK_TYPES.find(t => t.toLowerCase() === content);
    return matched || 'Growth';
  } catch (err) {
    console.error('LLM classification error:', err?.response?.data || err.message);
    return 'Growth'; // fallback
  }
}

export async function addTaskTypes(tasks) {
  return await Promise.all(
    tasks.map(async (task) => {
      const task_type = await classifyTaskType(task);
      return { ...task, task_type };
    })
  );
}

// Week utils
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor((date - firstDayOfYear) / 86400000);
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getHours(start, end) {
  return (end - start) / 3600;
}

export function calculateTaskAnalytics(enrichedTasks) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentWeek = getWeekNumber(now);

  let weekAssigned = 0;
  let weekCompleted = 0;
  let monthAssigned = 0;
  let monthCompleted = 0;

  const categoryStats = {};
  let totalTimeSpent = 0;

  for (const task of enrichedTasks) {
    const taskDate = new Date(task.start_time * 1000);
    const taskYear = taskDate.getFullYear();
    const taskMonth = taskDate.getMonth();
    const taskWeek = getWeekNumber(taskDate);
    const taskType = task.task_type;

    const isCurrentMonth = taskYear === currentYear && taskMonth === currentMonth;
    const isCurrentWeek = taskYear === currentYear && taskWeek === currentWeek;

    const status = task.status.toLowerCase();
    const hours = getHours(task.start_time, task.end_time);

    // Task completion summary
    if (isCurrentWeek) {
      weekAssigned++;
      if (status === 'done') weekCompleted++;
    }
    if (isCurrentMonth) {
      monthAssigned++;
      if (status === 'done') monthCompleted++;
    }

    // Category tracking
    if (!categoryStats[taskType]) {
      categoryStats[taskType] = {
        timeSpent: 0,
        completed: 0,
        assigned: 0,
      };
    }

    categoryStats[taskType].timeSpent += hours;
    categoryStats[taskType].assigned++;
    if (status === 'done') categoryStats[taskType].completed++;
    totalTimeSpent += hours;
  }

  // Build category data
  const categories = TASK_TYPES.map(type => {
    const data = categoryStats[type] || { timeSpent: 0, completed: 0, assigned: 0 };
    const percentTime = totalTimeSpent > 0 ? Math.round((data.timeSpent / totalTimeSpent) * 100) : 0;
    const completionRate = data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0;
    const randomPriority = +(Math.random() * 2 + 1).toFixed(1); // Between 1.0 and 3.0
    return [type, percentTime, Math.round(data.timeSpent), completionRate, randomPriority];
  });

  return {
    task_completion: [
      {
        time_period: 'week',
        tasks_assigned: weekAssigned,
        tasks_completed: weekCompleted
      },
      {
        time_period: 'month',
        tasks_assigned: monthAssigned,
        tasks_completed: monthCompleted
      }
    ],
    categories
  };
}

// Optional full pipeline
export async function enrichTasksAndAnalyze(fetchedTasks) {
  const enrichedTasks = await addTaskTypes(fetchedTasks);
  return calculateTaskAnalytics(enrichedTasks);
}