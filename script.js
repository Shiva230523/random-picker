console.log("✅ Upgraded Random Picker loaded");

// Elements
const modeNumber = document.getElementById("modeNumber");
const modeName = document.getElementById("modeName");

const numberSection = document.getElementById("numberSection");
const nameSection = document.getElementById("nameSection");

const fromRange = document.getElementById("fromRange");
const toRange = document.getElementById("toRange");
const namesInput = document.getElementById("namesInput");

const noRepeatToggle = document.getElementById("noRepeatToggle");
const noRepeatNumberToggle = document.getElementById("noRepeatNumberToggle");

const pickNumberBtn = document.getElementById("pickNumberBtn");
const pickNameBtn = document.getElementById("pickNameBtn");

const resultValue = document.getElementById("resultValue");
const resultSub = document.getElementById("resultSub");

const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

const historyList = document.getElementById("historyList");
const exportBtn = document.getElementById("exportBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const resetNamesBtn = document.getElementById("resetNamesBtn");

// Data
let history = [];
const HISTORY_LIMIT = 10;

// ✅ No-repeat number pool
let numberPool = [];
let poolRangeKey = "";

// Helpers
function showAlert(msg) {
  alert(msg);
}

function setResult(value, metaText = "") {
  resultValue.textContent = value;
  resultSub.textContent = metaText;
}

function updateModeUI() {
  if (modeNumber.checked) {
    numberSection.classList.remove("hidden");
    nameSection.classList.add("hidden");
    setResult("---", "");
  } else {
    nameSection.classList.remove("hidden");
    numberSection.classList.add("hidden");
    setResult("---", "");
  }
}

function addToHistory(type, value) {
  const timestamp = new Date().toLocaleString();
  history.unshift({ type, value, timestamp });

  history = history.slice(0, HISTORY_LIMIT);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = "No history yet.";
    historyList.appendChild(li);
    return;
  }

  history.forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";

    li.innerHTML = `
      <div>
        <strong>${item.value}</strong>
        <div style="font-size:12px;opacity:.75;margin-top:4px;">
          ${item.timestamp}
        </div>
      </div>
      <span class="badge">${item.type}</span>
    `;

    historyList.appendChild(li);
  });
}

function exportCSV() {
  if (history.length === 0) {
    showAlert("No history to export.");
    return;
  }

  const header = ["Type", "Value", "Timestamp"];
  const rows = history.map(h => [h.type, `"${h.value}"`, `"${h.timestamp}"`]);

  const csv = [header, ...rows].map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "random_picker_history.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Name Helpers
function getNamesArray() {
  const raw = namesInput.value.trim();
  if (!raw) return [];

  let names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0);

  return [...new Set(names)];
}

function updateNamesTextarea(arr) {
  namesInput.value = arr.join("\n");
}

// ✅ Number Pool Helpers
function makeRangeKey(from, to) {
  return `${from}-${to}`;
}

function buildNumberPool(from, to) {
  numberPool = [];
  for (let i = from; i <= to; i++) numberPool.push(i);
}

function ensurePool(from, to) {
  const key = makeRangeKey(from, to);

  // if range changed, rebuild
  if (poolRangeKey !== key) {
    poolRangeKey = key;
    buildNumberPool(from, to);
  }

  // if pool empty, rebuild
  if (numberPool.length === 0) {
    buildNumberPool(from, to);
  }
}

// Events
modeNumber.addEventListener("change", updateModeUI);
modeName.addEventListener("change", updateModeUI);

// If user changes range, rebuild pool
[fromRange, toRange].forEach(inp => {
  inp.addEventListener("input", () => {
    numberPool = [];
    poolRangeKey = "";
  });
});

// If toggle changed, reset pool
noRepeatNumberToggle.addEventListener("change", () => {
  numberPool = [];
  poolRangeKey = "";
});

// Pick Number
pickNumberBtn.addEventListener("click", () => {
  const from = parseInt(fromRange.value);
  const to = parseInt(toRange.value);

  if (isNaN(from) || isNaN(to)) {
    showAlert("Please enter both From and To values.");
    return;
  }

  if (from >= to) {
    showAlert("From should be less than To.");
    return;
  }

  // ✅ No Repeat enabled
  if (noRepeatNumberToggle.checked) {
    ensurePool(from, to);

    if (numberPool.length === 0) {
      showAlert("All numbers already picked! Change range or reset.");
      return;
    }

    const idx = Math.floor(Math.random() * numberPool.length);
    const picked = numberPool[idx];
    numberPool.splice(idx, 1);

    setResult(picked, `No Repeat ON | Remaining: ${numberPool.length}`);
    addToHistory("Number", String(picked));
    return;
  }

  // Normal random (repeat allowed)
  const randomNum = Math.floor(Math.random() * (to - from + 1)) + from;
  setResult(randomNum, `No Repeat OFF | Range: ${from} to ${to}`);
  addToHistory("Number", String(randomNum));
});

// Pick Name
pickNameBtn.addEventListener("click", () => {
  let names = getNamesArray();

  if (names.length < 2) {
    showAlert("Please enter at least 2 unique names.");
    return;
  }

  const winnerIndex = Math.floor(Math.random() * names.length);
  const winner = names[winnerIndex];

  setResult(winner, `Picked from ${names.length} names`);
  addToHistory("Name", winner);

  if (noRepeatToggle.checked) {
    names.splice(winnerIndex, 1);
    updateNamesTextarea(names);

    if (names.length === 0) {
      showAlert("All names have been picked! Enter new names to continue.");
    }
  }
});

// Reset result + number range
resetBtn.addEventListener("click", () => {
  fromRange.value = "";
  toRange.value = "";
  numberPool = [];
  poolRangeKey = "";
  setResult("---", "");
});

// Clear names
resetNamesBtn.addEventListener("click", () => {
  namesInput.value = "";
  setResult("---", "");
});

// Copy result
copyBtn.addEventListener("click", async () => {
  const text = resultValue.textContent;

  if (text === "---") {
    showAlert("Nothing to copy!");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showAlert("Copied: " + text);
  } catch {
    showAlert("Copy failed. Please copy manually.");
  }
});

// Export history
exportBtn.addEventListener("click", exportCSV);

// Clear history
clearHistoryBtn.addEventListener("click", () => {
  const ok = confirm("Clear all history?");
  if (!ok) return;

  history = [];
  renderHistory();
});

// Start
updateModeUI();
renderHistory();
