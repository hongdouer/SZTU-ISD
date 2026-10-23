const reader = document.querySelector('.pdf-reader');
if (reader) {
  const viewport = document.querySelector('#pdf-viewport');
  const paper = document.querySelector('#pdf-paper');
  const status = document.querySelector('#pdf-status');
  const previous = document.querySelector('#pdf-prev');
  const next = document.querySelector('#pdf-next');
  const pageSelect = document.querySelector('#pdf-page-select');
  const zoom = document.querySelector('#pdf-zoom');
  let documentPDF, pdfjs, pageNumber = 1, generation = 0, canvasTask, textTask, busy = true;

  function updateControls() {
    previous.disabled = busy || !documentPDF || pageNumber <= 1;
    next.disabled = busy || !documentPDF || pageNumber >= documentPDF.numPages;
    pageSelect.disabled = zoom.disabled = busy || !documentPDF;
    pageSelect.value = String(pageNumber);
  }

  async function renderPage(resetScroll = true) {
    if (!documentPDF) return;
    const ticket = ++generation;
    canvasTask?.cancel();
    textTask?.cancel();
    busy = true;
    updateControls();
    paper.setAttribute('aria-busy', 'true');
    status.classList.remove('sr-only');
    status.textContent = `正在加载第 ${pageNumber} 页…`;
    try {
      const page = await documentPDF.getPage(pageNumber);
      if (ticket !== generation) return;
      const natural = page.getViewport({ scale: 1 });
      const padding = getComputedStyle(viewport);
      const available = viewport.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
      const scale = zoom.value === 'fit' ? Math.max(0.25, available / natural.width) : Number(zoom.value);
      const view = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(view.width * ratio);
      canvas.height = Math.ceil(view.height * ratio);
      canvas.style.width = `${view.width}px`;
      canvas.style.height = `${view.height}px`;
      canvas.setAttribute('aria-hidden', 'true');
      const text = document.createElement('div');
      text.className = 'textLayer';
      paper.style.width = `${view.width}px`;
      paper.style.height = `${view.height}px`;
      paper.style.setProperty('--total-scale-factor', String(scale * page.userUnit));
      paper.style.setProperty('--scale-factor', String(scale));
      paper.style.setProperty('--user-unit', String(page.userUnit));
      paper.setAttribute('role', 'group');
      paper.setAttribute('aria-label', `PDF第 ${pageNumber} 页`);
      paper.replaceChildren(canvas, text);
      canvasTask = page.render({ canvas, viewport: view, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] });
      await canvasTask.promise;
      if (ticket !== generation) return;
      textTask = new pdfjs.TextLayer({ textContentSource: await page.getTextContent(), container: text, viewport: view });
      await textTask.render();
      if (ticket !== generation) return;
      paper.dataset.renderedPage = String(pageNumber);
      status.textContent = `第 ${pageNumber} 页，共 ${documentPDF.numPages} 页`;
      status.classList.add('sr-only');
      if (resetScroll) viewport.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (error) {
      if (ticket !== generation || error.name === 'RenderingCancelledException' || error.name === 'AbortException') return;
      status.textContent = '本页暂时无法显示，请使用“打开原文件”或“下载PDF”阅读。';
    } finally {
      if (ticket === generation) {
        busy = false;
        paper.setAttribute('aria-busy', 'false');
        updateControls();
      }
    }
  }

  function turnTo(number) {
    if (busy || !documentPDF || number < 1 || number > documentPDF.numPages) return;
    pageNumber = number;
    renderPage();
  }
  previous.addEventListener('click', () => turnTo(pageNumber - 1));
  next.addEventListener('click', () => turnTo(pageNumber + 1));
  pageSelect.addEventListener('change', () => turnTo(Number(pageSelect.value)));
  zoom.addEventListener('change', () => renderPage(false));
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    turnTo(pageNumber + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let resizeTimer, lastWidth = viewport.clientWidth;
  new ResizeObserver(() => {
    const width = viewport.clientWidth;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (documentPDF && zoom.value === 'fit') renderPage(false); }, 150);
  }).observe(viewport);

  (async () => {
    try {
      pdfjs = await import('./vendor/pdfjs/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      documentPDF = await pdfjs.getDocument({
        url: reader.dataset.pdf,
        cMapUrl: new URL('./vendor/pdfjs/cmaps/', import.meta.url).href,
        cMapPacked: true,
        standardFontDataUrl: new URL('./vendor/pdfjs/standard_fonts/', import.meta.url).href,
        wasmUrl: new URL('./vendor/pdfjs/wasm/', import.meta.url).href,
        iccUrl: new URL('./vendor/pdfjs/iccs/', import.meta.url).href
      }).promise;
      pageSelect.replaceChildren(...Array.from({ length: documentPDF.numPages }, (_, index) => new Option(`第 ${index + 1} 页`, String(index + 1))));
      document.querySelector('#pdf-page-total').textContent = `/ ${documentPDF.numPages} 页`;
      await renderPage();
    } catch (error) {
      status.classList.remove('sr-only');
      status.textContent = 'PDF暂时无法加载，请使用“打开原文件”或“下载PDF”阅读。';
      paper.setAttribute('aria-busy', 'false');
    }
  })();
}
