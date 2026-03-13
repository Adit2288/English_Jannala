// =====================
// API ENDPOINTS
// =====================
const API_LEVELS_ALL = "https://openapi.programming-hero.com/api/levels/all";
const API_LEVEL_WORDS = (id) => `https://openapi.programming-hero.com/api/level/${id}`;
const API_WORD_DETAIL = (id) => `https://openapi.programming-hero.com/api/word/${id}`;
const API_WORDS_ALL = "https://openapi.programming-hero.com/api/words/all";

// =====================
// ELEMENTS
// =====================
const navbar = document.getElementById("navbar");
const navSpacer = document.getElementById("navSpacer");

const banner = document.getElementById("banner");
const vocabulary = document.getElementById("vocabulary");
const faq = document.getElementById("faq");

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");

const nameInput = document.getElementById("nameInput");
const passInput = document.getElementById("passInput");

const lessonButtons = document.getElementById("lessonButtons");
const vocabDefault = document.getElementById("vocabDefault");
const spinner = document.getElementById("spinner");

const wordsPanel = document.getElementById("wordsPanel");
const wordsGrid = document.getElementById("wordsGrid");
const noWordState = document.getElementById("noWordState");

const bannerLessonsCount = document.getElementById("bannerLessonsCount");
const bannerWordsCount = document.getElementById("bannerWordsCount");

// Modal
const wordModal = document.getElementById("wordModal");
const modalWord = document.getElementById("modalWord");
const modalPron = document.getElementById("modalPron");
const modalMeaning = document.getElementById("modalMeaning");
const modalExample = document.getElementById("modalExample");
const modalSynonyms = document.getElementById("modalSynonyms");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalCloseX = document.getElementById("modalCloseX");

// =====================
// STATE
// =====================
let activeLevelId = null;

// =====================
// UTIL
// =====================
function safeText(value, fallback = "N/A") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

function showSpinner(show) {
  spinner.classList.toggle("hidden", !show);
  spinner.classList.toggle("flex", show);
}

function clearWordsUI() {
  wordsGrid.innerHTML = "";
  wordsPanel.classList.add("hidden");
  noWordState.classList.add("hidden");
}

function setActiveLessonButton(levelId) {
  activeLevelId = String(levelId);

  [...lessonButtons.querySelectorAll("button[data-level]")].forEach((btn) => {
    const isActive = btn.getAttribute("data-level") === activeLevelId;

    btn.className = isActive
      ? "btn btn-sm rounded-md border-2 border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
      : "btn btn-sm rounded-md border-2 border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white";
  });
}

function swalError(message) {
  Swal.fire({ icon: "error", title: "Oops!", text: message });
}

function swalSuccess(message) {
  Swal.fire({ icon: "success", title: "Success!", text: message });
}

function pronounceWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// =====================
// VISIBILITY LOGIC
// =====================
function showLandingOnly() {
  navbar.classList.add("hidden");
  navSpacer.classList.add("hidden");

  vocabulary.classList.add("hidden");
  faq.classList.add("hidden");

  banner.classList.remove("hidden");

  activeLevelId = null;
  lessonButtons.innerHTML = "";
  vocabDefault.classList.remove("hidden");
  clearWordsUI();
  showSpinner(false);
}

function showAppAfterLogin() {
  navbar.classList.remove("hidden");
  navSpacer.classList.remove("hidden");

  vocabulary.classList.remove("hidden");
  faq.classList.remove("hidden");

  banner.classList.add("hidden");
  vocabDefault.classList.remove("hidden");
  clearWordsUI();
}

// =====================
// FETCH
// =====================
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// =====================
// LOAD LEVELS
// =====================
async function loadLevels() {
  lessonButtons.innerHTML = "";

  try {
    const data = await fetchJSON(API_LEVELS_ALL);
    const levels = Array.isArray(data?.data) ? data.data : [];

    bannerLessonsCount.textContent = String(levels.length || 0);

    if (!levels.length) {
      lessonButtons.innerHTML = `
        <div class="alert alert-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>No lessons found.</span>
        </div>
      `;
      return;
    }

    levels.forEach((lvl) => {
      const levelId = String(lvl?.level_no ?? lvl?.id ?? lvl?.lesson_no ?? "");
      if (!levelId) return;

      const btn = document.createElement("button");
      btn.className =
        "btn btn-sm rounded-md border-2 border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white";
      btn.setAttribute("data-level", levelId);
      btn.innerHTML = `<i class="fa-solid fa-book-open"></i> Lesson-${levelId}`;

      btn.addEventListener("click", () => {
        setActiveLessonButton(levelId);
        loadWordsByLevel(levelId);
      });

      lessonButtons.appendChild(btn);
    });
  } catch (err) {
    lessonButtons.innerHTML = `
      <div class="alert alert-error">
        <i class="fa-solid fa-bug"></i>
        <span>Failed to load lessons.</span>
      </div>
    `;
  }
}

// =====================
// LOAD WORDS BY LEVEL
// =====================
async function loadWordsByLevel(levelId) {
  vocabDefault.classList.add("hidden");
  clearWordsUI();
  showSpinner(true);

  try {
    const data = await fetchJSON(API_LEVEL_WORDS(levelId));
    const words = Array.isArray(data?.data) ? data.data : [];

    if (!words.length) {
      noWordState.classList.remove("hidden");
      return;
    }

    wordsPanel.classList.remove("hidden");

    words.forEach((w) => {
      const wordId = safeText(w?.id ?? w?.word_id ?? w?._id, "");
      const word = safeText(w?.word, "Unknown");
      const meaning = safeText(w?.meaning, "অর্থ পাওয়া যায়নি");
      const pronunciation = safeText(w?.pronunciation, "উচ্চারণ পাওয়া যায়নি");

      const card = document.createElement("div");
      card.className =
        "bg-base-100 rounded-2xl shadow border border-base-200 p-8 flex flex-col justify-between text-center min-h-[250px]";

      card.innerHTML = `
        <div>
          <h3 class="font-extrabold text-4xl">${word}</h3>
          <p class="mt-3 text-lg font-medium">Meaning /Pronunciation</p>
          <p class="mt-4 text-3xl bn">"${meaning} / ${pronunciation}"</p>
        </div>

        <div class="flex items-center justify-between mt-8">
          <button
            class="btn btn-square btn-sm bg-slate-200 hover:bg-slate-300 border-0"
            data-details="1"
            title="Details"
            type="button"
          >
            <i class="fa-solid fa-circle-info text-slate-700"></i>
          </button>

          <button
            class="btn btn-square btn-sm bg-slate-200 hover:bg-slate-300 border-0"
            data-sound="1"
            title="Sound"
            type="button"
          >
            <i class="fa-solid fa-volume-high text-slate-700"></i>
          </button>
        </div>
      `;

      card.querySelector('[data-details="1"]').addEventListener("click", () => {
        if (!wordId) {
          Swal.fire({
            icon: "info",
            title: "No Details",
            text: "Word ID missing from API response."
          });
          return;
        }
        openWordModal(wordId);
      });

      card.querySelector('[data-sound="1"]').addEventListener("click", () => {
        pronounceWord(word);
      });

      wordsGrid.appendChild(card);
    });
  } catch (err) {
    noWordState.classList.remove("hidden");
  } finally {
    showSpinner(false);
  }
}

// =====================
// WORD DETAILS MODAL
// =====================
async function openWordModal(wordId) {
  try {
    modalWord.textContent = "Loading...";
    modalPron.textContent = "";
    modalMeaning.textContent = "";
    modalExample.textContent = "";
    modalSynonyms.innerHTML = "";

    wordModal.showModal();

    const data = await fetchJSON(API_WORD_DETAIL(wordId));
    const d = data?.data ?? {};

    const word = safeText(d?.word, "Unknown word");
    const pronunciation = safeText(d?.pronunciation, "উচ্চারণ নেই");
    const meaning = safeText(d?.meaning, "অর্থ পাওয়া যায়নি");
    const example = safeText(d?.sentence ?? d?.example, "Example not available.");
    const synonymsArr = Array.isArray(d?.synonyms) ? d.synonyms : [];

    modalWord.textContent = `${word} (${pronunciation})`;
    modalPron.textContent = "";
    modalMeaning.textContent = meaning;
    modalExample.textContent = example;

    if (synonymsArr.length) {
      synonymsArr.slice(0, 10).forEach((item) => {
        const chip = document.createElement("span");
        chip.className = "badge bg-slate-100 border border-slate-200 px-4 py-3";
        chip.textContent = item;
        modalSynonyms.appendChild(chip);
      });
    } else {
      const span = document.createElement("span");
      span.className = "text-sm text-base-content/70";
      span.textContent = "No synonyms found.";
      modalSynonyms.appendChild(span);
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not load word details."
    });
    wordModal.close();
  }
}

// =====================
// MODAL CLOSE
// =====================
modalCloseBtn.addEventListener("click", () => wordModal.close());
modalCloseX.addEventListener("click", () => wordModal.close());

// =====================
// BANNER COUNTS
// =====================
async function loadAllWordsCount() {
  try {
    const data = await fetchJSON(API_WORDS_ALL);
    const words = Array.isArray(data?.data) ? data.data : [];
    bannerWordsCount.textContent = String(words.length || 0);
  } catch {
    bannerWordsCount.textContent = "--";
  }
}

// =====================
// LOGIN / LOGOUT
// =====================
btnLogin.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const pass = passInput.value;

  if (!name) {
    swalError("Please enter your name.");
    return;
  }

  if (pass !== "123456") {
    swalError('Wrong password. Use "123456".');
    return;
  }

  swalSuccess(`Welcome, ${name}! Login successful.`);
  showAppAfterLogin();
  await loadLevels();
});

btnLogout.addEventListener("click", () => {
  Swal.fire({
    icon: "question",
    title: "Logout?",
    text: "You will be returned to the landing page.",
    showCancelButton: true,
    confirmButtonText: "Logout",
  }).then((result) => {
    if (!result.isConfirmed) return;

    showLandingOnly();
    nameInput.value = "";
    passInput.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });

    Swal.fire({
      icon: "success",
      title: "Logged out",
      text: "You are back on the landing page."
    });
  });
});

// =====================
// SMOOTH ANCHOR SCROLL
// =====================
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute("href");
  if (!id || id === "#") return;

  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();

  const navHeight = navbar.classList.contains("hidden") ? 0 : 80;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

  window.scrollTo({ top, behavior: "smooth" });
});

// =====================
// INITIAL
// =====================
showLandingOnly();
loadAllWordsCount();

fetchJSON(API_LEVELS_ALL)
  .then((data) => {
    const levels = Array.isArray(data?.data) ? data.data : [];
    bannerLessonsCount.textContent = String(levels.length || 0);
  })
  .catch(() => {
    bannerLessonsCount.textContent = "--";
  });