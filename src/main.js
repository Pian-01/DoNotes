
/* =========================
   DONOTE - APPLICATION
========================= */
import { initDatabase } from "./database.js";
await initDatabase();
const $ = (selector) => document.querySelector(selector);

const initialNotes = [
  {
    id: 1,
    title: "Project DoNote",
    content: "Build a lightweight desktop productivity application with Tauri.",
    color: "purple",
    date: "Today"
  },
  {
    id: 2,
    title: "Ideas",
    content: "Create a clean workspace for managing daily thoughts and tasks.",
    color: "blue",
    date: "Today"
  },
  {
    id: 3,
    title: "Learning",
    content: "Continue learning JavaScript, Rust, and desktop application development.",
    color: "yellow",
    date: "Yesterday"
  }
];

const initialTasks = [
  { id: 1, title: "Design DoNote dashboard", status: "todo" },
  { id: 2, title: "Create notes interface", status: "todo" },
  { id: 3, title: "Implement navigation", status: "working" },
  { id: 4, title: "Prepare project structure", status: "working" },
  { id: 5, title: "Install Tauri dependencies", status: "done" },
  { id: 6, title: "Initialize project", status: "done" }
];

let notes = [...initialNotes];
let tasks = [...initialTasks];
let currentPage = "dashboard";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "working", title: "Working" },
  { id: "done", title: "Done" }
];

/* =========================
   HELPERS
========================= */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getDate() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function getNextStatus(status) {
  const index = columns.findIndex(column => column.id === status);
  return columns[(index + 1) % columns.length].id;
}

function getPreviousStatus(status) {
  const index = columns.findIndex(column => column.id === status);
  return columns[(index - 1 + columns.length) % columns.length].id;
}

/* =========================
   NAVIGATION
========================= */

function navigate(page) {
  const target = $(`#page-${page}`);

  if (!target) return;

  currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("#page-title").textContent = {
    dashboard: "Dashboard",
    notes: "My Notes",
    tasks: "Task Board",
    settings: "Settings"
  }[page];

  $("#search-input").placeholder =
    page === "notes" ? "Search notes..." : "Search notes...";

  $("#search-input").value = "";

  renderNotes();
  renderTasks();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");

  if (button) {
    navigate(button.dataset.page);
  }
});

/* =========================
   STATISTICS
========================= */

function renderStatistics() {
  const completed = tasks.filter(task => task.status === "done").length;
  const active = tasks.filter(task => task.status !== "done").length;

  const productivity = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  $("#stat-notes").textContent = notes.length;
  $("#stat-active").textContent = active;
  $("#stat-completed").textContent = completed;
  $("#stat-productivity").textContent = `${productivity}%`;
  $("#notes-count").textContent = notes.length;
}

/* =========================
   NOTES
========================= */

function createNoteCard(note) {
  return `
    <article class="note-card">
      <button class="note-delete" data-delete-note="${note.id}"
        title="Delete note">✕</button>

      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.content)}</p>
      <div class="note-meta">${escapeHTML(note.date)}</div>
    </article>
  `;
}

function renderNotes() {
  const query = $("#search-input").value.trim().toLowerCase();

  const filtered = notes.filter(note =>
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query)
  );

  const dashboardNotes = filtered.slice(0, 3);

  $("#dashboard-notes").innerHTML = dashboardNotes.length
    ? dashboardNotes.map(createNoteCard).join("")
    : `<div class="empty-state">No notes found.</div>`;

  $("#all-notes").innerHTML = filtered.length
    ? filtered.map(createNoteCard).join("")
    : `<div class="empty-state">No notes found. Create your first note!</div>`;

  renderStatistics();
}

function openNoteDialog() {
  $("#note-form").reset();
  $("#note-dialog").showModal();
  $("#note-title").focus();
}

$("#add-note").addEventListener("click", openNoteDialog);

$("#note-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("#note-title").value.trim();
  const content = $("#note-content").value.trim();

  if (!title || !content) return;

  notes.unshift({
    id: Date.now(),
    title,
    content,
    color: "purple",
    date: "Just now"
  });

  $("#note-dialog").close();
  navigate("notes");
});

function closeNoteDialog() {
  $("#note-dialog").close();
}

$("#close-note").addEventListener("click", closeNoteDialog);
$("#cancel-note").addEventListener("click", closeNoteDialog);

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-note]");

  if (!button) return;

  const id = Number(button.dataset.deleteNote);

  notes = notes.filter(note => note.id !== id);

  renderNotes();
});

/* =========================
   TASKS
========================= */

function createTaskCard(task) {
  return `
    <article class="kanban-task">
      <strong>${escapeHTML(task.title)}</strong>

      <div class="task-actions">
        <button data-prev-task="${task.id}" title="Move backward">←</button>
        <button data-next-task="${task.id}" title="Move forward">→</button>
        <button data-delete-task="${task.id}" title="Delete task">✕</button>
      </div>
    </article>
  `;
}

function renderTasks() {
  const board = $("#kanban-board");
  const preview = $("#dashboard-tasks");

  board.innerHTML = columns.map(column => {
    const columnTasks = tasks.filter(task => task.status === column.id);

    return `
      <section class="kanban-column">
        <h3>
          ${column.title}
          <span>${columnTasks.length}</span>
        </h3>
        ${columnTasks.map(createTaskCard).join("")}
      </section>
    `;
  }).join("");

  preview.innerHTML = columns.map(column => {
    const columnTasks = tasks.filter(task => task.status === column.id);

    return `
      <div class="preview-column">
        <h3>${column.title} (${columnTasks.length})</h3>
        ${columnTasks.slice(0, 2).map(task => `
          <div class="preview-task">${escapeHTML(task.title)}</div>
        `).join("")}
      </div>
    `;
  }).join("");

  renderStatistics();
}

$("#add-task").addEventListener("click", () => {
  $("#task-form").reset();
  $("#task-dialog").showModal();
  $("#task-title").focus();
});

$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("#task-title").value.trim();
  const status = $("#task-status").value;

  if (!title) return;

  tasks.push({
    id: Date.now(),
    title,
    status
  });

  $("#task-dialog").close();
  renderTasks();
});

$("#close-task").addEventListener("click", () => {
  $("#task-dialog").close();
});

$("#cancel-task").addEventListener("click", () => {
  $("#task-dialog").close();
});

document.addEventListener("click", (event) => {
  const next = event.target.closest("[data-next-task]");
  const previous = event.target.closest("[data-prev-task]");
  const remove = event.target.closest("[data-delete-task]");

  if (next) {
    const task = tasks.find(item =>
      item.id === Number(next.dataset.nextTask)
    );

    if (task) task.status = getNextStatus(task.status);
  }

  if (previous) {
    const task = tasks.find(item =>
      item.id === Number(previous.dataset.prevTask)
    );

    if (task) task.status = getPreviousStatus(task.status);
  }

  if (remove) {
    tasks = tasks.filter(item =>
      item.id !== Number(remove.dataset.deleteTask)
    );
  }

  if (next || previous || remove) {
    renderTasks();
  }
});

/* =========================
   SEARCH
========================= */

$("#search-input").addEventListener("input", () => {
  if (currentPage !== "notes") {
    navigate("notes");
  } else {
    renderNotes();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#search-input").focus();
  }

  if (event.key === "Escape") {
    $("#search-input").blur();
  }
});

/* =========================
   HYBRID LAYOUT
========================= */

$("#compact-toggle").addEventListener("click", () => {
  document.body.classList.toggle("compact-mode");
});

/* =========================
   SYSTEM THEME
========================= */

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function updateThemeIndicator() {
  $("#theme-indicator").textContent = systemTheme.matches ? "☾" : "☀";
}

systemTheme.addEventListener("change", updateThemeIndicator);

/* =========================
   INITIALIZATION
========================= */

function init() {
  $("#current-date").textContent = getDate();

  updateThemeIndicator();
  renderNotes();
  renderTasks();
}

init();
