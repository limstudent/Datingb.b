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
let customPhoto = null; // photo chosen from the phone: { blob, previewUrl, path }

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

function renderPhotos() {
  const container = $("#photo-choices");
  container.textContent = "";
  container.append(createUploadTile());
}

/* ---------- Photo chosen from the phone ---------- */
function createUploadTile() {
  const tile = document.createElement("div");
  tile.className = "photo-upload";
  tile.id = "photo-upload";

  const input = document.createElement("input");
  input.type = "file";
  input.id = "photo-file";
  input.className = "file-input";
  input.accept = "image/*";
  input.setAttribute("aria-label", "Add my photo");

  const img = document.createElement("img");
  img.id = "upload-preview";
  img.alt = "Your photo";
  img.hidden = true;

  const plus = document.createElement("span");
  plus.className = "upload-plus";
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = "+";

  const text = document.createElement("span");
  text.className = "upload-text";
  text.id = "upload-text";
  text.textContent = "Add my photo";

  const check = document.createElement("span");
  check.className = "photo-check";
  check.setAttribute("aria-hidden", "true");
  check.textContent = "\u2713";

  tile.append(input, img, plus, text, check);
  input.addEventListener("change", onPhotoChosen);
  return tile;
}

function photoMessage(message) {
  const el = $("#photo-message");
  el.textContent = message;
  el.hidden = message === "";
}

function showCustomPhoto() {
  const tile = $("#photo-upload");
  if (!tile) return;
  tile.classList.toggle("selected", customPhoto !== null);
  const img = $("#upload-preview");
  img.hidden = customPhoto === null;
  img.src = customPhoto ? customPhoto.previewUrl : "";
  $("#upload-text").textContent = customPhoto ? "Change photo" : "Add my photo";
}

function clearCustomPhoto() {
  if (customPhoto) URL.revokeObjectURL(customPhoto.previewUrl);
  customPhoto = null;
  showCustomPhoto();
}

function randomId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

// Resize to 1080 px max and convert to JPEG: lighter to send, same format for everyone
function resizeImage(file, maxSize = 1080) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Conversion failed"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be read"));
    };
    img.src = url;
  });
}

async function onPhotoChosen(event) {
  const file = event.target.files[0];
  if (!file) return;
  photoMessage("");
  try {
    const blob = await resizeImage(file);
    clearCustomPhoto();
    customPhoto = { blob, previewUrl: URL.createObjectURL(blob), path: randomId() + ".jpg" };
    showCustomPhoto();
  } catch (error) {
    photoMessage("This image could not be read. Please use a JPG or PNG photo.");
  }
  event.target.value = ""; // lets the same file be chosen again
  updateState();
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
  renderPhotos();
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
  { label: "Photo", ok: () => customPhoto !== null },
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
    photo: "photos/" + customPhoto.path,
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

/* ---------- Send the profile to Supabase (Ajax) ---------- */
function supabaseIsConfigured() {
  const c = window.DATINGBB_CONFIG || {};
  return Boolean(c.supabaseUrl && c.supabaseKey) &&
    !c.supabaseUrl.includes("YOUR-PROJECT") && !c.supabaseKey.startsWith("YOUR-");
}

async function sendProfile(data) {
  const c = window.DATINGBB_CONFIG;
  const response = await fetch(`${c.supabaseUrl}/rest/v1/${c.table || "profiles"}`, {
    method: "POST",
    headers: {
      // Publishable keys go in the apikey header only
      apikey: c.supabaseKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      first_name: data.firstName,
      age: data.age,
      city: data.city,
      job: data.job,
      photo: data.photo,
      data: data,
    }),
  });
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
}

async function uploadPhoto(photo) {
  const c = window.DATINGBB_CONFIG;
  const response = await fetch(`${c.supabaseUrl}/storage/v1/object/${c.photoBucket || "photos"}/${photo.path}`, {
    method: "POST",
    headers: {
      apikey: c.supabaseKey,
      "Content-Type": "image/jpeg",
    },
    body: photo.blob,
  });
  if (!response.ok) {
    throw new Error("Photo upload HTTP " + response.status);
  }
}

let sending = false;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending || REQUIRED.some((rule) => !rule.ok())) return;
  profile = collectProfile();

  // Without Supabase settings, the app still works (demo mode)
  if (!supabaseIsConfigured()) {
    console.warn("Supabase is not configured: the profile and the photo were not sent (see js/config.js).");
    showScreen("match");
    return;
  }

  sending = true;
  matchBtn.disabled = true;
  progressText.textContent = "Sending...";
  try {
    await uploadPhoto(customPhoto); // photo first, then the profile
    await sendProfile(profile);
    showScreen("match");
  } catch (error) {
    progressText.textContent = "The profile could not be sent. Check the connection and try again.";
  } finally {
    sending = false;
    matchBtn.disabled = REQUIRED.some((rule) => !rule.ok());
  }
});

$("#edit-btn").addEventListener("click", () => showScreen("profile"));

// Cross button: clear the profile and start over
$("#clear-btn").addEventListener("click", () => {
  if (!window.confirm("Clear the profile and start over?")) return;
  form.reset();
  form.querySelectorAll("input").forEach((input) => delete input.dataset.was);
  $("#distance-value").textContent = $("#distance").value;
  profile = null;
  clearCustomPhoto();
  photoMessage("");
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