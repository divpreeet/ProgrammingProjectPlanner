let projects = JSON.parse(localStorage.getItem('projects')) || [];
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
const projectList = document.getElementById('projectList');
const newProjectBtn = document.getElementById('newProjectBtn');
const newProjectModal = document.getElementById('newProjectModal');
const newProjectForm = document.getElementById('newProjectForm');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const projectBoard = document.getElementById('projectBoard');
const newTaskForm = document.getElementById('newTaskForm');
const darkModeToggle = document.getElementById('darkModeToggle');
const shortcutsBtn = document.getElementById('shortcutsBtn');
const shortcutsModal = document.getElementById('shortcutsModal');
const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
const welcomeModal = document.getElementById('welcomeModal');
const startOnboardingBtn = document.getElementById('startOnboardingBtn');

function renderProjects() {
    projectList.innerHTML = '';
    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.className = 'flex items-center justify-between p-2 rounded hover:bg-linear-gray-700 cursor-pointer';
        projectItem.innerHTML = `
            <span class="text-linear-gray-300">${project.title}</span>
            <button class="delete-project text-linear-gray-400 hover:text-linear-gray-200" data-index="${index}">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;
        projectList.appendChild(projectItem);
    });
    updateUserProgressDisplay();
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

newProjectBtn.addEventListener('click', () => {
    newProjectModal.classList.remove('hidden');
});

cancelProjectBtn.addEventListener('click', () => {
    newProjectModal.classList.add('hidden');
});

newProjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const initialTodo = document.getElementById('initialTodo').value;
    const tasks = initialTodo ? [{ description: initialTodo, status: 'todo' }] : [];
    projects.push({ title, description, tasks });
    saveProjects();
    renderProjects();
    newProjectModal.classList.add('hidden');
    newProjectForm.reset();
    updateUserProgress(1); // Award points for creating a new project
});

projectList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-project') || e.target.closest('.delete-project')) {
        const index = e.target.getAttribute('data-index') || e.target.closest('.delete-project').getAttribute('data-index');
        projects.splice(index, 1);
        saveProjects();
        renderProjects();
    } else {
        const index = e.target.closest('div').querySelector('.delete-project').getAttribute('data-index');
        showProjectBoard(index);
    }
});

function showProjectBoard(index) {
    const project = projects[index];
    document.getElementById('projectBoardTitle').textContent = project.title;
    document.getElementById('projectBoardDescription').textContent = project.description;
    renderTasks(project);
    updateProgress(project);
    projectBoard.classList.remove('hidden');
    projectBoard.setAttribute('data-project-index', index);

    // Initialize Sortable for each list
    ['todoList', 'inProgressList', 'doneList'].forEach(listId => {
        new Sortable(document.getElementById(listId), {
            group: 'shared',
            animation: 150,
            onEnd: function (evt) {
                updateTaskStatus(evt.item, evt.to.id);
            }
        });
    });
}

function renderTasks(project) {
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    project.tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        switch (task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'inProgress':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });

    updateProgress(project);
}

function createTaskElement(task, index) {
    const taskElement = document.createElement('div');
    taskElement.className = 'bg-linear-gray-700 p-3 mb-2 rounded shadow-sm';
    taskElement.setAttribute('data-task-index', index);
    taskElement.innerHTML = `
        <p class="text-sm text-linear-gray-200">${task.description}</p>
        <button class="delete-task text-linear-gray-400 hover:text-linear-gray-200 text-sm mt-2">Delete</button>
    `;
    taskElement.querySelector('.delete-task').addEventListener('click', () => deleteTask(index));
    return taskElement;
}

function updateProgress(project) {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% Complete`;
}

function updateTaskStatus(taskElement, newStatus) {
    const projectIndex = projectBoard.getAttribute('data-project-index');
    const taskIndex = taskElement.getAttribute('data-task-index');
    const oldStatus = projects[projectIndex].tasks[taskIndex].status;
    projects[projectIndex].tasks[taskIndex].status = newStatus.replace('List', '');
    saveProjects();
    updateProgress(projects[projectIndex]);

    // Update user points when a task is moved to 'done'
    if (newStatus === 'doneList' && oldStatus !== 'done') {
        updateUserProgress(1);
    } else if (oldStatus === 'done' && newStatus !== 'doneList') {
        updateUserProgress(-1);
    }
}

function deleteTask(taskIndex) {
    const projectIndex = projectBoard.getAttribute('data-project-index');
    projects[projectIndex].tasks.splice(taskIndex, 1);
    saveProjects();
    renderTasks(projects[projectIndex]);
    updateProgress(projects[projectIndex]);
}

newTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectIndex = projectBoard.getAttribute('data-project-index');
    const newTaskInput = document.getElementById('newTaskInput');
    const taskDescription = newTaskInput.value.trim();
    if (taskDescription) {
        projects[projectIndex].tasks.push({ description: taskDescription, status: 'todo' });
        saveProjects();
        renderTasks(projects[projectIndex]);
        updateProgress(projects[projectIndex]);
        newTaskInput.value = '';
        updateUserProgress(1); // Award points for adding a new task
    }
});

function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark);
}

darkModeToggle.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    setTheme(isDark);
});

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true' || 
    (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
} else {
    setTheme(false);
}

function updateUserProgress(points) {
    userPoints += points;
    userLevel = Math.floor(userPoints / 100) + 1;
    localStorage.setItem('userPoints', userPoints);
    localStorage.setItem('userLevel', userLevel);
    updateUserProgressDisplay();
}

function updateUserProgressDisplay() {
    const userProgressElement = document.getElementById('userProgress');
    userProgressElement.textContent = `Level ${userLevel} (${userPoints} points)`;
}

shortcutsBtn.addEventListener('click', () => {
    shortcutsModal.classList.remove('hidden');
});

closeShortcutsBtn.addEventListener('click', () => {
    shortcutsModal.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        newProjectBtn.click();
    } else if (e.altKey && e.key === 'd') {
        e.preventDefault();
        darkModeToggle.click();
    } else if (e.key === 'Escape') {
        newProjectModal.classList.add('hidden');
        shortcutsModal.classList.add('hidden');
        welcomeModal.classList.add('hidden');
    }
});

startOnboardingBtn.addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    newProjectBtn.click();
});

// Check if it's the user's first visit
if (!localStorage.getItem('hasVisited')) {
    welcomeModal.classList.remove('hidden');
    localStorage.setItem('hasVisited', 'true');
}

renderProjects();