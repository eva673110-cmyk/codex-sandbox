"use strict";

// Можно дополнять: text — ответ, type — yes / no / maybe.
const answers = [
  { text: "Это база. Да.", type: "yes" },
  { text: "100% да (источник: мне приснилось)", type: "yes" },
  { text: "Да. Даже ретроградный Меркурий одобряет.", type: "yes" },
  { text: "Зелёный свет. Газуй, легенда!", type: "yes" },
  { text: "Да, и это твоя сюжетная арка.", type: "yes" },
  { text: "Вселенная поставила лайк.", type: "yes" },
  { text: "Однозначно да. Шар плохого не посоветует. Наверное.", type: "yes" },
  { text: "Да! Звёзды уже создали чат поддержки.", type: "yes" },
  { text: "Подтверждаю. Печать, подпись, звёздная пыль.", type: "yes" },
  { text: "Да. Сегодня ты главный герой.", type: "yes" },
  { text: "Будет. Скринь, потом проверишь.", type: "yes" },
  { text: "Да, без регистрации и СМС.", type: "yes" },
  { text: "Вероятность — да из десяти.", type: "yes" },
  { text: "Да. Таков путь. И маршрут уже построен.", type: "yes" },
  { text: "Всё получится. Шар держит за тебя невидимые кулачки.", type: "yes" },
  { text: "Нет. Следующий вопрос.", type: "no" },
  { text: "Звёзды сказали: ну такое.", type: "no" },
  { text: "Нет. Этот квест пока закрыт.", type: "no" },
  { text: "Вселенная нажала «Пропустить».", type: "no" },
  { text: "Не-а. Даже мой хрустальный Wi-Fi это понял.", type: "no" },
  { text: "Ответ отрицательный. Зато вайб положительный.", type: "no" },
  { text: "Нет. У судьбы на это лапки.", type: "no" },
  { text: "Шар проверил: идея не прошла модерацию.", type: "no" },
  { text: "Нет. Сохрани силы для другого эпизода.", type: "no" },
  { text: "Компьютер говорит «нет». Я тоже.", type: "no" },
  { text: "Не сегодня, звёздный путешественник.", type: "no" },
  { text: "Нет. Поворот сюжета отменили.", type: "no" },
  { text: "Звёзды вышли из чата. Это нет.", type: "no" },
  { text: "Нет, даже с промокодом.", type: "no" },
  { text: "Мой внутренний оракул покачал головой.", type: "no" },
  { text: "Да, но есть нюанс.", type: "maybe" },
  { text: "Вселенная прочитала и не ответила.", type: "maybe" },
  { text: "Судьба печатает… уже третий день.", type: "maybe" },
  { text: "Пятьдесят на пятьдесят. Либо да, либо чай.", type: "maybe" },
  { text: "Зависит от настроения кота. Какого? Да.", type: "maybe" },
  { text: "Есть два стула… но я шар, мне неудобно.", type: "maybe" },
  { text: "Ответ в разработке. Следи за обновлениями.", type: "maybe" },
  { text: "Меркурий взял паузу на подумать.", type: "maybe" },
  { text: "Всё сложно. Мы со звёздами это обсуждаем.", type: "maybe" },
  { text: "Сначала перекус. Потом великие решения.", type: "maybe" },
  { text: "Возможно. Но это информация из параллельного чата.", type: "maybe" },
  { text: "Спойлеры запрещены. Досмотри серию.", type: "maybe" },
  { text: "Туманно. Кто-то включил увлажнитель судьбы.", type: "maybe" },
  { text: "Как карта ляжет. У меня пока только карта лояльности.", type: "maybe" },
  { text: "Потенциал есть. Осталось договориться с реальностью.", type: "maybe" }
];

const loadingTexts = ["Загружаю судьбу…", "Советуюсь со вселенной…", "Ловлю звёздный Wi-Fi…", "Меркурий, возьми трубку…", "Перемешиваю вероятности…"];
const moodLabels = { yes: "ВСЕЛЕННАЯ ЗА", no: "У СУДЬБЫ ДРУГИЕ ПЛАНЫ", maybe: "КОСМИЧЕСКИ НЕОДНОЗНАЧНО" };
const form = document.querySelector("#question-form");
const input = document.querySelector("#question");
const shakeButton = document.querySelector("#shake-button");
const ball = document.querySelector("#ball");
const waiting = document.querySelector("#waiting");
const result = document.querySelector("#result");
const resultArea = document.querySelector("#result-area");
const actions = document.querySelector("#result-actions");
const copyButton = document.querySelector("#copy-button");
const toast = document.querySelector("#toast");
let busy = false;
let previousText = null;
let currentPrediction = null;
let toastTimer;

// Состояние формы и случайный выбор без повтора подряд.
function updateButton() {
  shakeButton.disabled = busy || input.value.trim().length === 0;
}
function pickAnswer() {
  const available = answers.filter(answer => answer.text !== previousText);
  return available[Math.floor(Math.random() * available.length)];
}
input.addEventListener("input", updateButton);
form.addEventListener("submit", async event => {
  event.preventDefault();
  const question = input.value.trim();
  if (busy || !question) return;
  busy = true;
  currentPrediction = null;
  updateButton();
  input.readOnly = true;
  result.hidden = true;
  actions.hidden = true;
  waiting.hidden = false;
  waiting.classList.add("loading");
  waiting.textContent = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
  resultArea.setAttribute("aria-busy", "true");
  ball.dataset.mood = "thinking";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 350 : 1350));
  const prediction = pickAnswer();
  previousText = prediction.text;
  currentPrediction = { question, answer: prediction.text };
  document.querySelector("#asked-question").textContent = question;
  document.querySelector("#answer").textContent = prediction.text;
  document.querySelector("#result-label").textContent = moodLabels[prediction.type];
  ball.dataset.mood = prediction.type;
  waiting.hidden = true;
  waiting.classList.remove("loading");
  result.hidden = false;
  actions.hidden = false;
  resultArea.setAttribute("aria-busy", "false");
  busy = false;
  input.readOnly = false;
  updateButton();
});

document.querySelector("#again-button").addEventListener("click", () => {
  if (busy) return;
  input.value = "";
  currentPrediction = null;
  result.hidden = true;
  actions.hidden = true;
  waiting.textContent = "Новый вопрос — новая порция космической мудрости";
  waiting.hidden = false;
  ball.dataset.mood = "idle";
  updateButton();
  input.focus();
});

// Clipboard API + резервный способ для локального index.html.
function fallbackCopy(text) {
  const previousFocus = document.activeElement;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(textarea);
  textarea.select();
  let success = false;
  try { success = document.execCommand("copy"); }
  finally { textarea.remove(); previousFocus?.focus(); }
  if (!success) throw new Error("Копирование недоступно");
}
function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
    toast.textContent = "";
  }, 2500);
}
copyButton.addEventListener("click", async () => {
  if (!currentPrediction) return;
  const text = `Вопрос: ${currentPrediction.question} / Ответ шара: ${currentPrediction.answer}`;
  copyButton.disabled = true;
  try {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Используем резервное копирование");
      await navigator.clipboard.writeText(text);
    } catch {
      fallbackCopy(text);
    }
    showToast("Скопировано!");
  } catch {
    showToast("Не удалось скопировать. Выдели ответ и нажми Ctrl+C.");
  } finally {
    copyButton.disabled = false;
  }
});
updateButton();
