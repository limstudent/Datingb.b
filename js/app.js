"use strict";

/* =========================================================
   Datingb.b by industryb.b
   - JavaScript handles the form and the screens.
   - Ajax (fetch) loads the proposals from data/proposals.json:
     photos, languages, lifestyle choices, hobbies and prompts.
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);

const screens = {
  splash: $("#screen-splash"),
  profile: $("#screen-profile"),
  match: $("#screen-match"),
};

const form = $("#profile-form");
const matchBtn = $("#match-btn");
const progressFill = $("#progress-fill");
const progressText = $("#progress-text");
const loadError = $("#load-error");

let profile = null; // filled when the Match button is clicked

/* ---------- Screens ---------- */
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
  window.scrollTo(0, 0);
}

/* ---------- Ajax: load the proposals ---------- */
async function loadProposals() {
  const response = await fetch("data/proposals.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return response.json();
}

/* ---------- Rendering helpers ---------- */
function renderChips(containerId, name, options, type) {
  const container = $("#" + containerId);
  container.textContent = "";
  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "chip";

    const input = document.createElement("input");
    input.type = type; // "radio" or "checkbox"
    input.name = name;
    input.value = option;

    const text = document.createElement("span");
    text.textContent = option;

    label.append(input, text);
    container.append(label);
  });

  // A selected radio chip can be clicked again to unselect it.
  if (type === "radio") {
    container.addEventListener("click", (event) => {
      const input = event.target.closest("input[type='radio']");
      if (!input) return;
      if (input.dataset.was === "1") {
        input.checked = false;
        input.dataset.was = "0";
      } else {
        container.querySelectorAll("input").forEach((i) => (i.dataset.was = "0"));
        input.dataset.was = "1";
      }
      updateState();
    });
  }
}

function renderPhotos(photos) {
  const container = $("#photo-choices");
  container.textContent = "";
  photos.forEach((photo) => {
    const label = document.createElement("label");
    label.className = "photo";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "photo";
    input.value = photo.src;

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt || "Profile photo";

    const check = document.createElement("span");
    check.className = "photo-check";
    check.setAttribute("aria-hidden", "true");
    check.textContent = "✓";

    label.append(input, img, check);
    container.append(label);
  });
}

function renderSelect(selectId, options) {
  const select = $("#" + selectId);
  select.textContent = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Choose";
  select.append(empty);
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option;
    el.textContent = option;
    select.append(el);
  });
}

function renderPrompts(prompts) {
  const container = $("#prompts");
  container.textContent = "";
  prompts.forEach((prompt, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "prompt";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = prompt;

    const area = document.createElement("textarea");
    area.name = "prompt" + index;
    area.dataset.prompt = prompt;
    area.maxLength = 140;
    area.rows = 3;

    wrapper.append(label, area);
    container.append(wrapper);
  });
}

function renderProposals(data) {
  renderPhotos(data.photos);
  renderChips("languages", "languages", data.languages, "checkbox");
  renderChips("lookingFor", "lookingFor", data.lookingFor, "radio");
  renderChips("kids", "kids", data.kids, "radio");
  renderChips("tobacco", "tobacco", data.tobacco, "radio");
  renderChips("alcohol", "alcohol", data.alcohol, "radio");
  renderChips("drugs", "drugs", data.drugs, "radio");
  renderChips("pets", "pets", data.pets, "radio");
  renderSelect("zodiac", data.zodiac);
  renderChips("hobbies", "hobbies", data.hobbies, "checkbox");
  renderPrompts(data.prompts);
}

/* ---------- Validation ---------- */
const value = (id) => $("#" + id).value.trim();
const checkedCount = (name) => form.querySelectorAll(`input[name="${name}"]:checked`).length;
const filledPrompts = () =>
  [...form.querySelectorAll("textarea[data-prompt]")].filter((t) => t.value.trim() !== "").length;

const REQUIRED = [
  { label: "Photo", ok: () => checkedCount("photo") === 1 },
  { label: "First name", ok: () => value("firstName") !== "" },
  { label: "Age", ok: () => { const a = Number(value("age")); return a >= 18 && a <= 99; } },
  { label: "City", ok: () => value("city") !== "" },
  { label: "Job or studies", ok: () => value("job") !== "" },
  { label: "Looking for", ok: () => checkedCount("lookingFor") === 1 },
  { label: "Children", ok: () => checkedCount("kids") === 1 },
  { label: "Tobacco", ok: () => checkedCount("tobacco") === 1 },
  { label: "3 hobbies", ok: () => checkedCount("hobbies") >= 3 },
  { label: "3 prompts", ok: () => filledPrompts() >= 3 },
];

function updateState() {
  const missing = REQUIRED.filter((rule) => !rule.ok());
  const done = REQUIRED.length - missing.length;

  progressFill.style.width = (done / REQUIRED.length) * 100 + "%";
  matchBtn.disabled = missing.length > 0;

  if (missing.length === 0) {
    progressText.textContent = "All required fields are done.";
  } else {
    const names = missing.slice(0, 3).map((rule) => rule.label).join(", ");
    const more = missing.length > 3 ? "..." : "";
    progressText.textContent = `${done}/${REQUIRED.length} required. Missing: ${names}${more}`;
  }
}

/* ---------- Collect the profile ---------- */
function collectProfile() {
  const getRadio = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
  const getAll = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);

  return {
    photo: getRadio("photo"),
    firstName: value("firstName"),
    age: Number(value("age")),
    pronouns: value("pronouns"),
    height: value("height"),
    city: value("city"),
    maxDistance: Number($("#distance").value),
    job: value("job"),
    origin: value("origin"),
    languages: getAll("languages"),
    lookingFor: getRadio("lookingFor"),
    kids: getRadio("kids"),
    tobacco: getRadio("tobacco"),
    alcohol: getRadio("alcohol"),
    drugs: getRadio("drugs"),
    pets: getRadio("pets"),
    religion: value("religion"),
    politics: value("politics"),
    zodiac: $("#zodiac").value,
    hobbies: getAll("hobbies"),
    music: value("music"),
    shows: value("shows"),
    books: value("books"),
    prompts: [...form.querySelectorAll("textarea[data-prompt]")]
      .filter((t) => t.value.trim() !== "")
      .map((t) => ({ question: t.dataset.prompt, answer: t.value.trim() })),
  };
}

/* ---------- Events ---------- */
$("#app-name").addEventListener("click", () => showScreen("profile"));

$("#distance").addEventListener("input", (event) => {
  $("#distance-value").textContent = event.target.value;
});

form.addEventListener("input", updateState);
form.addEventListener("change", updateState);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (REQUIRED.some((rule) => !rule.ok())) return;
  profile = collectProfile();
  showScreen("match");
});

$("#edit-btn").addEventListener("click", () => showScreen("profile"));

// Cross button: clear the profile and start over
$("#clear-btn").addEventListener("click", () => {
  if (!window.confirm("Clear the profile and start over?")) return;
  form.reset();
  form.querySelectorAll("input").forEach((input) => delete input.dataset.was);
  $("#distance-value").textContent = $("#distance").value;
  profile = null;
  updateState();
  window.scrollTo(0, 0);
});

/* ---------- Start ---------- */
showScreen("splash");
updateState();

loadProposals()
  .then((data) => {
    renderProposals(data);
    updateState();
  })
  .catch(() => {
    loadError.hidden = false;
    loadError.textContent =
      "The proposals could not be loaded. Open the app through a local server (for example WampServer or Live Server), not by double clicking index.html.";
  });
