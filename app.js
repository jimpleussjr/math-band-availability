const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_START = 16;
const WEEKEND_START = 12;
const END = 21;

const CATEGORIES = {
  preferred: "Preferred",
  maybe: "Can make it work",
  no: "Can't do"
};
const CYCLE = ["no", "preferred", "maybe"];

function hourLabel(h) {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "AM" : "PM";
  return hour12 + "-" + ((h + 1) % 12 === 0 ? 12 : (h + 1) % 12) + " " + suffix;
}

function buildSchedule() {
  const rows = [];
  for (const day of DAY_KEYS) {
    const start = (day === "Sat" || day === "Sun") ? WEEKEND_START : WEEKDAY_START;
    const slots = [];
    for (let h = start; h < END; h++) {
      slots.push({ key: day + "|" + h, label: hourLabel(h) });
    }
    rows.push({ day, slots });
  }
  return rows;
}

const schedule = buildSchedule();
const allKeys = schedule.flatMap((r) => r.slots.map((s) => s.key));

const STORAGE_KEY = "math-band-availability-v1";
let state = {};
let memberName = "";

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft && typeof draft === "object") {
      memberName = draft.name || "";
      if (draft.state && typeof draft.state === "object") state = draft.state;
    }
  } catch (e) {
    state = {};
  }
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: memberName, state }));
  } catch (e) {
  }
}

function render() {
  const grid = document.getElementById("schedule");
  grid.innerHTML = "";

  for (const row of schedule) {
    const rowEl = document.createElement("div");
    rowEl.className = "day-row";

    const dayEl = document.createElement("div");
    dayEl.className = "day-label";
    dayEl.textContent = row.day;
    rowEl.appendChild(dayEl);

    const slotsEl = document.createElement("div");
    slotsEl.className = "slots";

    for (const slot of row.slots) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot " + (state[slot.key] || "no");
      btn.textContent = slot.label;
      btn.title = CATEGORIES[state[slot.key] || "no"];
      btn.dataset.key = slot.key;
      btn.addEventListener("click", () => {
        const cur = state[slot.key] || "no";
        const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
        state[slot.key] = next;
        btn.className = "slot " + next;
        btn.title = CATEGORIES[next];
        saveDraft();
        updateTally();
      });
      slotsEl.appendChild(btn);
    }

    rowEl.appendChild(slotsEl);
    grid.appendChild(rowEl);
  }
}

function updateTally() {
  let preferred = 0;
  let maybe = 0;
  let no = 0;
  for (const key of allKeys) {
    const cat = state[key] || "no";
    if (cat === "preferred") preferred++;
    else if (cat === "maybe") maybe++;
    else no++;
  }
  document.getElementById("tally").textContent =
    "Preferred: " + preferred + "  ·  Can make it work: " + maybe + "  ·  Can't do: " + no;
}

function setStatus(text, kind) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.className = kind ? "status " + kind : "status";
}

const nameInput = document.getElementById("member-name");
const form = document.getElementById("entry-form");
const submitBtn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  memberName = nameInput.value.trim();
  if (!memberName) {
    setStatus("Please enter your name before submitting.", "error");
    return;
  }
  if (!window.APPS_SCRIPT_URL) {
    setStatus("Not configured yet: put your Apps Script web app URL in config.js.", "error");
    return;
  }

  saveDraft();
  submitBtn.disabled = true;
  const original = submitBtn.textContent;
  submitBtn.textContent = "Submitting…";
  setStatus("");

  const payload = {
    name: memberName,
    submittedAt: new Date().toISOString(),
    availability: allKeys.map((key) => {
      const slot = schedule.flatMap((r) => r.slots).find((s) => s.key === key);
      return {
        slot: key,
        slotLabel: slot ? key.split("|")[0] + " " + slot.label : key,
        category: CATEGORIES[state[key] || "no"]
      };
    })
  };

  try {
    await fetch(window.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    setStatus("Submitted. The director can now see your availability.", "success");
  } catch (err) {
    setStatus("Submission failed. Please check your connection and try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
});

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("Clear your draft? This does not remove anything already submitted.")) return;
  state = {};
  memberName = "";
  nameInput.value = "";
  localStorage.removeItem(STORAGE_KEY);
  render();
  updateTally();
  setStatus("Draft cleared.");
});

nameInput.addEventListener("input", () => {
  memberName = nameInput.value.trim();
  saveDraft();
});

loadDraft();
nameInput.value = memberName;
render();
updateTally();