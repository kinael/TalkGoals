const STORAGE_KEY = "goals_v1";

function loadGoals() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function saveGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

let goals = loadGoals();
if (!goals) {
  goals = [
    {
      id: crypto.randomUUID(),
      title: "Estudar",
      category: "Estudos",
      rewards: ["Jogar 2 horas"],
      steps: [
        { id: crypto.randomUUID(), text: "Pegar livro", done: true },
        { id: crypto.randomUUID(), text: "Pesquisar assunto X", done: false },
        { id: crypto.randomUUID(), text: "Resolver 5 exercícios", done: false }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "Caminhar 30 min",
      category: "Saúde",
      rewards: ["Ver 1 episódio"],
      steps: [
        { id: crypto.randomUUID(), text: "Colocar tênis", done: false },
        { id: crypto.randomUUID(), text: "Alongar", done: false }
      ]
    }
  ];
  saveGoals(goals);
}

let filterMode = "all";   
let filterCategory = "all"; 

const goalForm = document.getElementById("goalForm");
const goalTitleInput = document.getElementById("goalTitle");
const goalCategoryInput = document.getElementById("goalCategory");
const goalRewardsInput = document.getElementById("goalRewards");

const groupedListsEl = document.getElementById("groupedLists");
const singleListHeaderEl = document.getElementById("singleListHeader");
const singleListTitleEl = document.getElementById("singleListTitle");
const singleListEl = document.getElementById("singleList");

const goalsListPendingEl = document.getElementById("goalsListPending");
const goalsListCompletedEl = document.getElementById("goalsListCompleted");

const countPendingEl = document.getElementById("countPending");
const countCompletedEl = document.getElementById("countCompleted");

const categoryFilterSelect = document.getElementById("categoryFilter");

function calcProgress(goal) {
  const total = goal.steps.length;
  const done = goal.steps.filter(s => s.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}
function goalCompleted(goal) {
  const { total, done } = calcProgress(goal);
  return total > 0 && done === total;
}
function splitByStatus(list) {
  const pending = [];
  const completed = [];
  list.forEach(g => (goalCompleted(g) ? completed : pending).push(g));
  return { pending, completed };
}


function catColors(category) {
  const name = (category || "").toLowerCase().trim();
  if (!name) return { bg: "#f5f7ff", border: "#cfd3e1", text: "#374151" };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  const bg = `hsl(${hue}, 90%, 95%)`;
  const border = `hsl(${hue}, 60%, 75%)`;
  const text = `hsl(${hue}, 35%, 30%)`;
  return { bg, border, text };
}

function makeNoteFinished() {
  const note = document.createElement("div");
  note.className = "note-finished";
  note.textContent = "Meta já concluída.";
  return note;
}

function rebuildCategoryFilter() {
  const seen = new Map(); 
  goals.forEach(g => {
    const raw = (g.category || "").trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    if (!seen.has(lower)) seen.set(lower, raw);
  });

  const current = filterCategory;
  categoryFilterSelect.innerHTML = `<option value="all">Todas as categorias</option>`;
  [...seen.entries()].sort((a,b)=>a[1].localeCompare(b[1], 'pt-BR')).forEach(([lower, display]) => {
    const opt = document.createElement("option");
    opt.value = lower;
    opt.textContent = display;
    categoryFilterSelect.appendChild(opt);
  });

  const exists = [...seen.keys()].includes(current);
  categoryFilterSelect.value = exists ? current : "all";
  filterCategory = categoryFilterSelect.value;
}

function renderGoals() {
  rebuildCategoryFilter();

  const byCategory = goals.filter(g => {
    if (filterCategory === "all") return true;
    return (g.category || "").trim().toLowerCase() === filterCategory;
  });

  const { pending, completed } = splitByStatus(byCategory);

  countPendingEl.textContent = pending.length;
  countCompletedEl.textContent = completed.length;

  goalsListPendingEl.innerHTML = "";
  goalsListCompletedEl.innerHTML = "";
  singleListEl.innerHTML = "";
  singleListTitleEl.textContent = "";

  if (filterMode === "all") {
    groupedListsEl.style.display = "grid";
    singleListHeaderEl.style.display = "none";
    singleListEl.style.display = "none";

    if (pending.length === 0) {
      goalsListPendingEl.innerHTML = `<p>Nenhuma meta pendente.</p>`;
    } else {
      pending.forEach(g => goalsListPendingEl.appendChild(goalCard(g)));
    }

    if (completed.length === 0) {
      goalsListCompletedEl.innerHTML = `<p>Nenhuma meta concluída ainda.</p>`;
    } else {
      completed.forEach(g => goalsListCompletedEl.appendChild(goalCard(g)));
    }
  } else {
    groupedListsEl.style.display = "none";
    singleListHeaderEl.style.display = "block";
    singleListEl.style.display = "block";

    if (filterMode === "pending") {
      singleListTitleEl.innerHTML = `<span class="dot dot-pending"></span> Metas pendentes`;
      if (pending.length === 0) {
        singleListEl.innerHTML = `<p>Nenhuma meta para este filtro.</p>`;
      } else {
        pending.forEach(g => singleListEl.appendChild(goalCard(g)));
      }
    } else {
      singleListTitleEl.innerHTML = `<span class="dot dot-done"></span> Metas concluídas`;
      if (completed.length === 0) {
        singleListEl.innerHTML = `<p>Nenhuma meta para este filtro.</p>`;
      } else {
        completed.forEach(g => singleListEl.appendChild(goalCard(g)));
      }
    }
  }
}

function goalCard(goal) {
  const { pct } = calcProgress(goal);
  const completed = goalCompleted(goal);

  const card = document.createElement("div");
  card.className = "goal-card";
  card.dataset.id = goal.id;

  const header = document.createElement("div");
  header.className = "goal-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "title-badge-wrap";

  const title = document.createElement("p");
  title.className = "goal-title" + (completed ? " completed" : "");
  title.textContent = goal.title;

  titleWrap.appendChild(title);

  const category = (goal.category || "").trim();
  if (category) {
    const cat = document.createElement("span");
    cat.className = "cat-badge";
    const { bg, border, text } = catColors(category);
    cat.style.backgroundColor = bg;
    cat.style.borderColor = border;
    cat.style.color = text;
    cat.textContent = `#${category}`;
    titleWrap.appendChild(cat);
  }

  const headerActions = document.createElement("div");
  headerActions.className = "actions";
  const editBtn = button("Editar", "edit-goal");
  const delBtn = button("Remover", "delete-goal");
  headerActions.append(editBtn, delBtn);

  header.append(titleWrap, headerActions);

  const rewardsBox = document.createElement("div");
  rewardsBox.className = "rewards";
  const rh4 = document.createElement("h4");
  rh4.textContent = "Recompensas";
  const rewardsUl = document.createElement("ul");
  rewardsUl.className = "reward-list";
  goal.rewards.forEach((r, idx) => {
    const li = document.createElement("li");
    const badge = document.createElement("span");
    badge.className = "badge" + (completed ? " completed" : "");
    badge.textContent = r;
    const removeR = button("x", "remove-reward small-btn");
    removeR.dataset.rewardIndex = idx;
    li.append(badge, removeR);
    rewardsUl.appendChild(li);
  });

  const rewardForm = document.createElement("div");
  rewardForm.className = "inline-form";
  const rewardInput = document.createElement("input");
  rewardInput.placeholder = "Adicionar nova recompensa…";
  rewardInput.maxLength = 100;
  const addRewardBtn = button("Adicionar", "add-reward");
  rewardForm.append(rewardInput, addRewardBtn);

  if (completed) {
    rewardInput.disabled = true;               
    rewardForm.classList.add("section-disabled");
    rewardForm.appendChild(makeNoteFinished());
  }

  rewardsBox.append(rh4, rewardsUl, rewardForm);

  const stepsBox = document.createElement("div");
  stepsBox.className = "steps";
  const sh4 = document.createElement("h4");
  sh4.textContent = "Etapas";
  const stepsUl = document.createElement("ul");
  stepsUl.className = "step-list";
  goal.steps.forEach(step => {
    stepsUl.appendChild(stepItem(goal.id, step));
  });

  const stepForm = document.createElement("div");
  stepForm.className = "inline-form";
  const stepInput = document.createElement("input");
  stepInput.placeholder = "Nova etapa…";
  stepInput.maxLength = 120;
  const addStepBtn = button("Adicionar", "add-step");
  stepForm.append(stepInput, addStepBtn);

  if (completed) {
    stepInput.disabled = true;                
    stepForm.classList.add("section-disabled");
    stepForm.appendChild(makeNoteFinished());
  }

  stepsBox.append(sh4, stepsUl, stepForm);

  const progressBox = document.createElement("div");
  progressBox.className = "progress";

  const bar = document.createElement("div");
  bar.className = "progress-bar";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = pct + "%";
  bar.appendChild(fill);

  const info = document.createElement("div");
  info.className = "progress-info";
  const percent = document.createElement("span");
  percent.textContent = `Progresso: ${pct}%`;
  const party = document.createElement("span");
  party.className = "party";
  party.textContent = completed ? "🎉" : "";
  info.append(percent, party);

  progressBox.append(bar, info);

  if (goal.steps.length === 0) {
    progressBox.style.display = "none";
  }

  card.append(header, rewardsBox, stepsBox, progressBox);

  card.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-goal")) {
      const g = goals.find(x => x.id === goal.id);
      if (!g) return;
      const novo = prompt("Editar meta:", g.title);
      if (novo !== null) editGoal(goal.id, (novo.trim() || g.title));
    }
    if (e.target.classList.contains("delete-goal")) {
      if (confirm("Remover esta meta?")) deleteGoal(goal.id);
    }

    if (e.target.classList.contains("add-reward")) {
      if (goalCompleted(goal)) return; // segurança extra
      const input = card.querySelector(".rewards .inline-form input");
      const val = (input.value || "").trim();
      if (val) addReward(goal.id, val);
    }
    if (e.target.classList.contains("remove-reward")) {
      const idx = parseInt(e.target.dataset.rewardIndex, 10);
      removeReward(goal.id, idx);
    }

    if (e.target.classList.contains("add-step")) {
      if (goalCompleted(goal)) return; // segurança extra
      const input = card.querySelector(".steps .inline-form input");
      const val = (input.value || "").trim();
      if (val) addStep(goal.id, val);
    }

    if (e.target.classList.contains("edit-step")) {
      const li = e.target.closest("li");
      const stepId = li.dataset.stepId;
      const currentText = li.querySelector("span").textContent;
      const novo = prompt("Editar etapa:", currentText);
      if (novo !== null) editStep(goal.id, stepId, novo.trim() || currentText);
    }
    if (e.target.classList.contains("delete-step")) {
      const li = e.target.closest("li");
      const stepId = li.dataset.stepId;
      if (confirm("Remover esta etapa?")) deleteStep(goal.id, stepId);
    }
  });

  card.addEventListener("change", (e) => {
    if (e.target.classList.contains("step-checkbox")) {
      const li = e.target.closest("li");
      const stepId = li.dataset.stepId;
      toggleStep(goal.id, stepId, e.target.checked);
    }
  });

  return card;
}

function stepItem(goalId, step) {
  const li = document.createElement("li");
  li.dataset.stepId = step.id;
  if (step.done) li.classList.add("completed");

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "step-checkbox";
  cb.checked = step.done;

  const span = document.createElement("span");
  span.textContent = step.text;

  const edit = button("Editar", "edit-step small-btn");
  const del = button("Remover", "delete-step small-btn");

  li.append(cb, span, edit, del);
  return li;
}

function button(text, className) {
  const b = document.createElement("button");
  b.textContent = text;
  b.className = className;
  return b;
}

function addGoal(title, rewardsArray, category) {
  goals.push({
    id: crypto.randomUUID(),
    title,
    category: category || "",
    rewards: rewardsArray,
    steps: []
  });
  saveGoals(goals);
  renderGoals();
}
function editGoal(id, newTitle) {
  const g = goals.find(x => x.id === id);
  if (!g) return;
  g.title = newTitle;
  saveGoals(goals);
  renderGoals();
}
function deleteGoal(id) {
  goals = goals.filter(x => x.id !== id);
  saveGoals(goals);
  renderGoals();
}

function addReward(goalId, rewardText) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  g.rewards.push(rewardText);
  saveGoals(goals);
  renderGoals();
}
function removeReward(goalId, rewardIndex) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  g.rewards.splice(rewardIndex, 1);
  saveGoals(goals);
  renderGoals();
}

function addStep(goalId, text) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  g.steps.push({ id: crypto.randomUUID(), text, done: false });
  saveGoals(goals);
  renderGoals();
}
function editStep(goalId, stepId, newText) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  const s = g.steps.find(st => st.id === stepId);
  if (!s) return;
  s.text = newText;
  saveGoals(goals);
  renderGoals();
}
function deleteStep(goalId, stepId) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  g.steps = g.steps.filter(st => st.id !== stepId);
  saveGoals(goals);
  renderGoals();
}
function toggleStep(goalId, stepId, done) {
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  const s = g.steps.find(st => st.id === stepId);
  if (!s) return;
  s.done = done;
  saveGoals(goals);
  renderGoals();
}

goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = goalTitleInput.value.trim();
  const category = (goalCategoryInput.value || "").trim();
  const rewards = goalRewardsInput.value
    .split(",")
    .map(r => r.trim())
    .filter(r => r.length > 0);

  if (!title) return;
  addGoal(title, rewards, category);

  goalTitleInput.value = "";
  goalCategoryInput.value = "";
  goalRewardsInput.value = "";
});

document.querySelectorAll('input[name="filter"]').forEach(r => {
  r.addEventListener("change", () => {
    filterMode = r.value;
    renderGoals();
  });
});

categoryFilterSelect.addEventListener("change", () => {
  filterCategory = categoryFilterSelect.value; 
  renderGoals();
});

renderGoals();
