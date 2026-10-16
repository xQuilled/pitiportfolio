const pdfUrl = "Portfolio.pdf";
const pdfWorkerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const book = document.querySelector(".book");
const currentPage = document.querySelector(".current");
const underneathPage = document.querySelector(".underneath");
const previousButton = document.querySelector(".previous");
const nextButton = document.querySelector(".next");
const currentNumber = document.querySelector(".current-number");

let pageIndex = 0;
let isTurning = false;
let pdf;
let pageRatio = 1224 / 792;

function sizeBook() {
  book.style.aspectRatio = pageRatio;
}

async function renderPage(pageNumber, canvas) {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  pageRatio = baseViewport.width / baseViewport.height;
  sizeBook();

  const displayWidth = book.clientWidth;
  const displayScale = displayWidth / baseViewport.width;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  const viewport = page.getViewport({ scale: displayScale * pixelRatio });
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayWidth / pageRatio}px`;
  await page.render({ canvasContext: context, viewport }).promise;
}

function updateControls() {
  currentNumber.textContent = String(pageIndex + 1).padStart(2, "0");
  currentPage.alt = `Portfolio page ${pageIndex + 1} of ${totalPages}`;
  previousButton.disabled = pageIndex === 0;
  nextButton.disabled = pageIndex === totalPages - 1;
}

function turn(direction) {
  if (isTurning) return;
  const nextIndex = pageIndex + direction;
  if (nextIndex < 0 || nextIndex >= totalPages) return;

  isTurning = true;
  renderPage(nextIndex + 1, underneathPage);
  currentPage.classList.add(direction > 0 ? "turn-next" : "turn-previous");

  currentPage.addEventListener("animationend", () => {
    pageIndex = nextIndex;
    renderPage(pageIndex + 1, currentPage);
    currentPage.classList.remove("turn-next", "turn-previous");
    updateControls();
    isTurning = false;
  }, { once: true });
}

async function initialize() {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
  await renderPage(1, currentPage);
  await renderPage(2, underneathPage);
  updateControls();
}

initialize().catch((error) => {
  book.textContent = "Unable to load the portfolio PDF.";
  console.error(error);
});

previousButton.addEventListener("click", () => turn(-1));
nextButton.addEventListener("click", () => turn(1));
book.addEventListener("click", (event) => {
  const bounds = book.getBoundingClientRect();
  turn(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") turn(-1);
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    turn(1);
  }
});
