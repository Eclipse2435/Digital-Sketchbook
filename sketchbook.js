const pageContainer = document.getElementById('pageContainer');
const canvasContainer = document.getElementById('canvasContainer');
const colorPicker = document.getElementById('colorPicker');
const brushSizeInput = document.getElementById('brushSize');
const brushPreview = document.getElementById('brushPreview');
const brushSizeValue = document.getElementById('brushSizeValue');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const addPageBtn = document.getElementById('addPage');
const clearPageBtn = document.getElementById('clearPage');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const clearAllBtn = document.getElementById('clearAll');

let pages = [];
let currentPageIndex = 0;
let drawing = false;
let currentColor = '#000000';
let brushSize = 5;
let undoStack = [];
let redoStack = [];

// Function to create a new page
function createPage() {
    const page = document.createElement('div');
    page.className = 'page';
    if (pages.length === 0) page.classList.add('active');
    const canvas = document.createElement('canvas');
    canvas.className = 'pageCanvas';
    canvas.width = pageContainer.clientWidth;
    canvas.height = pageContainer.clientHeight;
    page.appendChild(canvas);
    canvasContainer.appendChild(page);
    pages.push({
        canvas,
        ctx: canvas.getContext('2d'),
        history: [],
        redoHistory: []
    });
}

// Initialize with 3 pages
for (let i = 0; i < 3; i++) {
    createPage();
}

// Drawing functions
function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
    pages[currentPageIndex].ctx.beginPath();
    saveState();
}

function draw(e) {
    if (!drawing) return;

    const rect = pages[currentPageIndex].canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = pages[currentPageIndex].ctx;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
}

function saveState() {
    const page = pages[currentPageIndex];
    undoStack.push(page.canvas.toDataURL());
    page.redoHistory = [];
}

function undo() {
    const page = pages[currentPageIndex];
    if (undoStack.length > 0) {
        page.redoHistory.push(page.canvas.toDataURL());
        const lastState = undoStack.pop();
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            page.ctx.clearRect(0, 0, page.canvas.width, page.canvas.height);
            page.ctx.drawImage(img, 0, 0);
        };
    }
}

function redo() {
    const page = pages[currentPageIndex];
    if (page.redoHistory.length > 0) {
        const nextState = page.redoHistory.pop();
        undoStack.push(page.canvas.toDataURL());
        const img = new Image();
        img.src = nextState;
        img.onload = () => {
            page.ctx.clearRect(0, 0, page.canvas.width, page.canvas.height);
            page.ctx.drawImage(img, 0, 0);
        };
    }
}

function navigatePages(offset) {
    pages[currentPageIndex].canvas.parentElement.classList.remove('active');
    currentPageIndex = (currentPageIndex + offset + pages.length) % pages.length;
    pages[currentPageIndex].canvas.parentElement.classList.add('active');
}

function addPage() {
    createPage();
    navigatePages(0); // Show the new page
}

function clearPage() {
    const ctx = pages[currentPageIndex].ctx;
    ctx.clearRect(0, 0, pages[currentPageIndex].canvas.width, pages[currentPageIndex].canvas.height);
    saveState();
}

function clearAllPages() {
    pages.forEach(page => {
        const ctx = page.ctx;
        ctx.clearRect(0, 0, page.canvas.width, page.canvas.height);
        saveState();
    });
}

// Event listeners
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    brushPreview.style.background = currentColor;
});

brushSizeInput.addEventListener('input', (e) => {
    brushSize = e.target.value;
    brushSizeValue.textContent = brushSize;
});

document.getElementById('save').addEventListener('click', () => {
    const dataUrl = pages[currentPageIndex].canvas.toDataURL();
    localStorage.setItem(`sketchPage${currentPageIndex}`, dataUrl);
    alert('Page saved!');
});

document.getElementById('download').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `sketchPage${currentPageIndex}.png`;
    link.href = pages[currentPageIndex].canvas.toDataURL();
    link.click();
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
prevPageBtn.addEventListener('click', () => navigatePages(-1));
nextPageBtn.addEventListener('click', () => navigatePages(1));
addPageBtn.addEventListener('click', () => addPage());
clearPageBtn.addEventListener('click', () => clearPage());
clearAllBtn.addEventListener('click', () => clearAllPages());

// Initialize event listeners for drawing
pages.forEach(page => {
    page.canvas.addEventListener('mousedown', startDrawing);
    page.canvas.addEventListener('mouseup', stopDrawing);
    page.canvas.addEventListener('mousemove', draw);
    page.canvas.addEventListener('mouseleave', stopDrawing);
});

// Update canvas size on window resize
window.addEventListener('resize', () => {
    pages.forEach(page => {
        page.canvas.width = pageContainer.clientWidth;
        page.canvas.height = pageContainer.clientHeight;
    });
});
