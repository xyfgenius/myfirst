const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const taskInput = document.getElementById('taskInput');
const deadlineInput = document.getElementById('deadlineInput');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');

const STORAGE_KEY = 'todo-tasks';

let tasks = [];

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        tasks = JSON.parse(saved);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateRemainingDays(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getFilteredTasks() {
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) {
        return tasks;
    }
    return tasks.filter(task => task.text.toLowerCase().includes(keyword));
}

function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        const keyword = searchInput.value.trim();
        const message = keyword ? '未找到匹配的事项' : '暂无待办事项，点击添加按钮创建';
        taskList.innerHTML = `<div class="empty-message">${message}</div>`;
        return;
    }

    filteredTasks.forEach((task, index) => {
        const remainingDays = calculateRemainingDays(task.deadline);
        const isUrgent = remainingDays <= 2 && !task.completed;

        const row = document.createElement('div');
        row.className = 'task-row';
        if (task.completed) {
            row.classList.add('done');
        } else if (isUrgent) {
            row.classList.add('urgent');
        }

        const indexSpan = document.createElement('span');
        indexSpan.className = 'col-index';
        indexSpan.textContent = index + 1;

        const taskSpan = document.createElement('span');
        taskSpan.className = 'col-task';
        taskSpan.textContent = task.text;

        const deadlineSpan = document.createElement('span');
        deadlineSpan.className = 'col-deadline';
        deadlineSpan.textContent = formatDate(task.deadline);

        const remainingSpan = document.createElement('span');
        remainingSpan.className = 'col-remaining';
        if (remainingDays < 0) {
            remainingSpan.textContent = '已过期';
        } else if (remainingDays === 0) {
            remainingSpan.textContent = '今天';
        } else {
            remainingSpan.textContent = remainingDays + '天';
        }

        const statusSpan = document.createElement('span');
        statusSpan.className = 'col-status';
        const statusBtn = document.createElement('button');
        statusBtn.className = 'status-btn ' + (task.completed ? 'completed' : 'pending');
        statusBtn.textContent = task.completed ? '已办' : '待办';
        statusBtn.addEventListener('click', () => toggleTask(task.id));
        statusSpan.appendChild(statusBtn);

        const deleteSpan = document.createElement('span');
        deleteSpan.className = 'col-delete';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        deleteSpan.appendChild(deleteBtn);

        row.appendChild(indexSpan);
        row.appendChild(taskSpan);
        row.appendChild(deadlineSpan);
        row.appendChild(remainingSpan);
        row.appendChild(statusSpan);
        row.appendChild(deleteSpan);

        taskList.appendChild(row);
    });
}

function openModal() {
    taskInput.value = '';
    const today = new Date();
    deadlineInput.value = today.toISOString().split('T')[0];
    modal.classList.add('show');
    taskInput.focus();
}

function closeModal() {
    modal.classList.remove('show');
}

function addTask() {
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;

    if (!text) {
        alert('请输入任务内容');
        taskInput.focus();
        return;
    }

    if (!deadline) {
        alert('请选择截止日期');
        deadlineInput.focus();
        return;
    }

    const newTask = {
        id: generateId(),
        text: text,
        deadline: deadline,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    closeModal();
}

function deleteTask(id) {
    if (confirm('确定要删除这个待办事项吗？')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

function toggleTask(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    task.completed = !task.completed;

    tasks.splice(taskIndex, 1);

    if (task.completed) {
        tasks.push(task);
    } else {
        tasks.unshift(task);
    }

    saveTasks();
    renderTasks();
}

function exportToCSV() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        alert('没有可导出的数据');
        return;
    }

    const headers = ['序号', '要做的事', '截止日期', '剩余天数', '状态'];
    const rows = filteredTasks.map((task, index) => {
        const remainingDays = calculateRemainingDays(task.deadline);
        let remainingText;
        if (remainingDays < 0) {
            remainingText = '已过期';
        } else if (remainingDays === 0) {
            remainingText = '今天';
        } else {
            remainingText = remainingDays + '天';
        }
        return [
            index + 1,
            `"${task.text.replace(/"/g, '""')}"`,
            formatDate(task.deadline),
            remainingText,
            task.completed ? '已办' : '待办'
        ];
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', '待办事项_' + formatDate(new Date().toISOString()) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', addTask);
exportBtn.addEventListener('click', exportToCSV);

searchInput.addEventListener('input', renderTasks);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
    }
    if (e.key === 'Enter' && modal.classList.contains('show')) {
        addTask();
    }
});

loadTasks();
renderTasks();
