const STORE_KEY = "lifeCorrectionMobileState";
const DATE_OPTIONS = {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

const defaultState = {
  tasks: [],
  dailySnoozes: {},
  planningSkips: {},
  lastVisibleAt: null,
  events: [],
};

let selectedDue = minutesFromNow(15);
let selectedGateDue = minutesFromNow(15);
let emergency = null;

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function addEvent(state, kind, detail) {
  state.events.push({ at: new Date().toISOString(), kind, detail });
  state.events = state.events.slice(-200);
  saveState(state);
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function tonight() {
  const due = new Date();
  due.setHours(23, 0, 0, 0);
  if (due <= new Date()) return minutesFromNow(60);
  return due;
}

function tomorrowMorning() {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  due.setHours(8, 0, 0, 0);
  return due;
}

function sameDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", DATE_OPTIONS).format(new Date(value));
}

function openTasks(state) {
  return state.tasks.filter((task) => !task.done);
}

function overdueTasks(state) {
  const current = Date.now();
  return openTasks(state)
    .filter((task) => new Date(task.dueAt).getTime() <= current)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

function nextTask(state) {
  return openTasks(state).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0] || null;
}

function createTask(title, dueAt) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title: title.trim(),
    dueAt: dueAt.toISOString(),
    done: false,
    createdAt: new Date().toISOString(),
  };
}

function render() {
  const state = loadState();
  const task = nextTask(state);
  $("headline").textContent = task ? "次の一手" : "まず1個";
  $("focusTitle").textContent = task ? task.title : "未登録";
  $("focusMeta").textContent = task
    ? `締切 ${formatDate(task.dueAt)}`
    : "スマホを開いた今、1個だけ捕まえます。";
  $("doneButton").disabled = !task;
  $("snoozeButton").disabled = !task;

  const list = $("taskList");
  list.replaceChildren();
  openTasks(state)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .forEach((item) => {
      const li = document.createElement("li");
      li.className = `taskItem ${new Date(item.dueAt) <= new Date() ? "overdue" : ""}`;
      const text = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const meta = document.createElement("span");
      meta.textContent = `締切 ${formatDate(item.dueAt)}`;
      text.append(title, meta);
      const button = document.createElement("button");
      button.textContent = "完了";
      button.addEventListener("click", () => markDone(item.id));
      li.append(text, button);
      list.append(li);
    });

  enforceGate(state);
  enforceBlocker(state);
}

function enforceGate(state) {
  const gate = $("gate");
  const skipped = state.planningSkips[sameDayKey()];
  if (openTasks(state).length === 0 && !skipped) {
    gate.hidden = false;
    setTimeout(() => $("gateInput").focus(), 60);
  } else {
    gate.hidden = true;
  }
}

function enforceBlocker(state) {
  const blocker = $("blocker");
  const overdue = overdueTasks(state)[0];
  if (!overdue) {
    blocker.hidden = true;
    return;
  }
  blocker.hidden = false;
  $("blockerTitle").textContent = overdue.title;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(overdue.dueAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  $("blockerTime").textContent = `${minutes}分超過`;
}

function addTaskFromMain() {
  const title = $("taskTitle").value.trim();
  if (!title) return vibrate();
  const state = loadState();
  state.tasks.push(createTask(title, selectedDue));
  addEvent(state, "add", title);
  $("taskTitle").value = "";
  render();
}

function addTaskFromGate() {
  const title = $("gateInput").value.trim();
  if (!title) return vibrate();
  const state = loadState();
  state.tasks.push(createTask(title, selectedGateDue));
  addEvent(state, "gate_add", title);
  $("gateInput").value = "";
  render();
}

function markDone(id) {
  const state = loadState();
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = true;
  addEvent(state, "done", task.title);
  render();
}

function doneNext() {
  const task = nextTask(loadState());
  if (task) markDone(task.id);
}

function snoozeNext() {
  const state = loadState();
  const task = overdueTasks(state)[0] || nextTask(state);
  if (!task) return;
  const key = sameDayKey();
  const used = state.dailySnoozes[key] || 0;
  if (used >= 2) {
    alert("今日の延期枠は使い切りました。");
    return;
  }
  const a = 13 + Math.floor(Math.random() * 37);
  const b = 13 + Math.floor(Math.random() * 37);
  const answer = prompt(`延期するには ${a} + ${b} を入力`);
  if (answer !== String(a + b)) return vibrate();
  task.dueAt = minutesFromNow(10).toISOString();
  state.dailySnoozes[key] = used + 1;
  addEvent(state, "snooze", task.title);
  render();
}

function clearDone() {
  const state = loadState();
  state.tasks = state.tasks.filter((task) => !task.done);
  addEvent(state, "clear_done", "");
  render();
}

function skipGate() {
  const phrase = "今日は本当に何もない";
  if (prompt(`スキップするには「${phrase}」と入力`) !== phrase) return vibrate();
  const state = loadState();
  state.planningSkips[sameDayKey()] = true;
  addEvent(state, "gate_skip", sameDayKey());
  render();
}

function beginEmergency() {
  const phrases = ["逃げ道を記録する", "これは例外", "未来の自分に残す"];
  emergency = {
    phrase: phrases.sort(() => Math.random() - 0.5).join(" / "),
    readyAt: Date.now() + 60 * 1000,
  };
  $("emergencyBox").hidden = false;
  updateEmergency();
}

function updateEmergency() {
  if (!emergency) return;
  const remain = Math.max(0, Math.ceil((emergency.readyAt - Date.now()) / 1000));
  $("emergencyText").textContent = remain
    ? `待機中 ${remain}秒。その後に入力: ${emergency.phrase}`
    : `入力: ${emergency.phrase}`;
  if (remain) setTimeout(updateEmergency, 1000);
}

function tryEmergency() {
  if (!emergency || Date.now() < emergency.readyAt) return vibrate();
  if ($("emergencyInput").value.trim() !== emergency.phrase) return vibrate();
  const state = loadState();
  const task = overdueTasks(state)[0];
  if (task) {
    task.dueAt = minutesFromNow(15).toISOString();
    addEvent(state, "emergency", task.title);
  }
  emergency = null;
  $("emergencyInput").value = "";
  $("emergencyBox").hidden = true;
  render();
}

function requestNotifications() {
  if (!("Notification" in window)) {
    alert("このブラウザでは通知が使えません。");
    return;
  }
  Notification.requestPermission().then(() => render());
}

function notifyOverdue() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const overdue = overdueTasks(loadState())[0];
  if (!overdue) return;
  navigator.serviceWorker?.ready.then((registration) => {
    registration.showNotification("期限超過", {
      body: overdue.title,
      tag: "life-correction-overdue",
      icon: "./icon.svg",
    });
  });
}

function vibrate() {
  navigator.vibrate?.([80, 50, 80]);
}

document.querySelectorAll("[data-minutes]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedDue = minutesFromNow(Number(button.dataset.minutes));
  });
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedDue = button.dataset.preset === "tonight" ? tonight() : tomorrowMorning();
  });
});

document.querySelectorAll("[data-gate-minutes]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedGateDue = minutesFromNow(Number(button.dataset.gateMinutes));
  });
});

document.querySelectorAll("[data-gate-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedGateDue = button.dataset.gatePreset === "tonight" ? tonight() : tomorrowMorning();
  });
});

$("addButton").addEventListener("click", addTaskFromMain);
$("gateAddButton").addEventListener("click", addTaskFromGate);
$("gateSkipButton").addEventListener("click", skipGate);
$("doneButton").addEventListener("click", doneNext);
$("snoozeButton").addEventListener("click", snoozeNext);
$("blockerDone").addEventListener("click", doneNext);
$("blockerSnooze").addEventListener("click", snoozeNext);
$("blockerEmergency").addEventListener("click", beginEmergency);
$("emergencyTry").addEventListener("click", tryEmergency);
$("clearDoneButton").addEventListener("click", clearDone);
$("notifyButton").addEventListener("click", requestNotifications);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const state = loadState();
  state.lastVisibleAt = new Date().toISOString();
  saveState(state);
  render();
  notifyOverdue();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

setInterval(() => {
  render();
  notifyOverdue();
}, 30 * 1000);

render();
