(function () {
  "use strict";

  const data = window.CLF_DATA;
  const app = document.getElementById("app");
  const storageKey = "clf-c02-study-hub-progress-v1";
  const examKey = "clf-c02-exam-v1";
  const flashKey = "clf-c02-flash-v1";
  const themeKey = "clf-c02-theme";
  let activeQuiz = null;
  let examTimerId = null;
  let activeDeck = null;

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(themeKey, theme); } catch (_) { /* Ignore storage errors. */ }
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "dark" ? "☀️ Claro" : "🌙 Oscuro";
  }
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function byId(id) {
    return data.questions.find(question => question.id === id);
  }

  function isMulti(question) {
    return Array.isArray(question.correct);
  }
  function setEqual(a, b) {
    if (a.length !== b.length) return false;
    const s = new Set(b);
    return a.every(x => s.has(x));
  }

  function quizLabel(focus) {
    if (focus === "mixed") return "DIAGNÓSTICO MIXTO";
    if (/^dom[1-4]$/.test(focus)) return domainName(Number(focus.slice(3))).toUpperCase();
    const area = data.focusAreas.find(item => item.id === focus);
    return area ? area.title.toUpperCase() : "PRÁCTICA";
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && Array.isArray(saved.answers)) return saved;
    } catch (_) { /* Use a clean record when local data is invalid. */ }
    return { answers: [], lastFocus: null, lastStudyDate: null };
  }

  function saveProgress(progress) {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function progressSummary() {
    const progress = loadProgress();
    const answers = progress.answers;
    const correct = answers.filter(answer => answer.correct).length;
    const percent = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    return { progress, answers, correct, percent };
  }

  function daysToExam() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(data.exam.date + "T00:00:00");
    return Math.max(0, Math.ceil((exam - today) / 86400000));
  }

  function shuffle(items) {
    return items.map(value => ({ value, key: Math.random() })).sort((a, b) => a.key - b.key).map(item => item.value);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function domainName(id) {
    const domain = data.domains.find(item => item.id === id);
    return domain ? domain.title : "Dominio " + id;
  }

  function linkActive(route) {
    document.querySelectorAll(".topbar nav a").forEach(link => {
      const href = link.getAttribute("href");
      const prefix = href.replace("#/", "");
      link.classList.toggle("active", route === href || (prefix !== "inicio" && route.startsWith(href + "/")));
    });
  }

  function renderHome() {
    const { answers, correct, percent } = progressSummary();
    const days = daysToExam();
    const next = data.schedule[Math.min(data.schedule.length - 1, Math.max(0, 16 - days))];
    app.innerHTML = `
      <section class="hero panel">
        <div class="hero-copy">
          <p class="kicker">PLAN PERSONAL · ${data.exam.code}</p>
          <h1>Estudia con intención.<br><em>Aprueba con calma.</em></h1>
          <p class="lead">Tu hub para convertir las diferencias que se mezclan en respuestas automáticas: con escenarios, descarte y retroalimentación al instante.</p>
          <div class="hero-actions">
            <a class="button primary" href="#/practicar/observability">Empezar foco crítico <span>→</span></a>
            <a class="button secondary" href="#/chuleta">Ver chuleta rápida</a>
          </div>
        </div>
        <div class="exam-card">
          <p>Tu examen</p>
          <strong>01<br><span>SEP</span></strong>
          <div class="exam-detail"><b>${days}</b> días restantes</div>
          <div class="exam-detail"><b>65</b> preguntas totales</div>
          <div class="exam-detail"><b>700</b> puntaje mínimo</div>
        </div>
      </section>

      <section class="stats-grid" aria-label="Tu progreso">
        <article><span>Preguntas respondidas</span><strong>${answers.length}</strong><small>el progreso queda guardado aquí</small></article>
        <article><span>Respuestas correctas</span><strong>${correct}</strong><small>${answers.length ? "de " + answers.length + " intentos" : "comienza con una sesión"}</small></article>
        <article><span>Precisión acumulada</span><strong>${answers.length ? percent + "%" : "—"}</strong><small>meta de práctica: 75% o más</small></article>
      </section>

      <section class="export-row">
        <div><strong>¿Quieres feedback personalizado?</strong><span>Descarga tus resultados y las preguntas que fallaste, y envíaselos a tu tutor para saber qué reforzar.</span></div>
        <button class="button secondary" type="button" data-action="export-report">⬇ Descargar resultados (.md)</button>
      </section>

      <section class="section-heading">
        <div><p class="kicker">MODOS DE ESTUDIO</p><h2>Elige cómo estudiar hoy</h2><p>Teoría clara, tarjetas rápidas o un examen completo cronometrado.</p></div>
      </section>
      <section class="focus-grid">
        <a class="focus-card" href="#/aprender"><div><span class="pill important">Teoría</span></div><h3>Aprender</h3><p>Los 4 dominios explicados en simple, con un truco de examen en cada tema.</p><span class="card-cta">Ir a Aprender →</span></a>
        <a class="focus-card" href="#/tarjetas"><div><span class="pill important">Memoria</span></div><h3>Tarjetas</h3><p>Servicio → qué hace y su palabra gatillo. Voltea la tarjeta y comprueba.</p><span class="card-cta">Ir a Tarjetas →</span></a>
        <a class="focus-card" href="#/examen"><div><span class="pill critical">Simulacro</span></div><h3>Examen</h3><p>65 preguntas cronometradas con la distribución real del examen.</p><span class="card-cta">Ir a Examen →</span></a>
      </section>

      <section class="section-heading">
        <div><p class="kicker">HOY</p><h2>${escapeHtml(next[1])}</h2><p>${escapeHtml(next[2])}</p></div>
        <a href="#/practicar" class="inline-link">Ver todas las prácticas →</a>
      </section>
      <section class="focus-grid">
        ${data.focusAreas.slice(0, 3).map(area => focusCard(area)).join("")}
      </section>

      <section class="section-heading split-heading">
        <div><p class="kicker">GUÍA OFICIAL</p><h2>El examen, en cuatro dominios</h2></div>
        <p>Practica más donde pesa más: Tecnología y servicios (34%) y Seguridad (30%) concentran el 64% del contenido puntuado.</p>
      </section>
      <section class="domain-grid">
        ${data.domains.map(domain => `<article class="domain-card ${domain.color}"><div><span>DOMINIO ${domain.id}</span><b>${domain.weight}%</b></div><h3>${escapeHtml(domain.title)}</h3><p>${escapeHtml(domain.detail)}</p></article>`).join("")}
      </section>

      <section class="plan panel">
        <div class="plan-heading"><p class="kicker">RUTA HASTA EL EXAMEN</p><h2>16 días, sin intentar abarcar todo a la vez.</h2></div>
        <ol class="schedule">
          ${data.schedule.map((day, index) => `<li class="${index === Math.max(0, 16 - days) ? "today" : ""}"><span>${escapeHtml(day[0])}</span><strong>${escapeHtml(day[1])}</strong><small>${escapeHtml(day[2])}</small></li>`).join("")}
        </ol>
      </section>`;
  }

  function focusCard(area) {
    return `<article class="focus-card"><div><span class="pill ${area.status === "Crítico" ? "critical" : "important"}">${area.status}</span><span class="focus-goal">${escapeHtml(area.goal)}</span></div><h3>${escapeHtml(area.title)}</h3><p>${escapeHtml(area.description)}</p><a href="#/practicar/${area.id}">Practicar ahora <span>→</span></a></article>`;
  }

  function renderPractice(route) {
    const selectedFocus = route.split("/")[2];
    if (selectedFocus && (selectedFocus === "mixed" || /^dom[1-4]$/.test(selectedFocus) || data.focusAreas.some(area => area.id === selectedFocus))) {
      if (!activeQuiz || activeQuiz.focus !== selectedFocus || activeQuiz.index >= activeQuiz.questions.length) startQuiz(selectedFocus);
      renderQuiz();
      return;
    }
    activeQuiz = null;
    app.innerHTML = `
      <section class="page-intro"><p class="kicker">PRÁCTICA ACTIVA</p><h1>Elige un frente.<br><em>Luego razona cada descarte.</em></h1><p>Las preguntas muestran la corrección al instante y explican por qué las otras opciones no encajan. Si fallas un área, vuelve a ella hasta alcanzar 8/10.</p></section>
      <section class="section-heading"><div><p class="kicker">POR DOMINIO</p><h2>Practica un dominio completo</h2><p>Hasta 20 preguntas mezcladas del dominio que elijas. Ideal para medir cómo andas en cada bloque del examen.</p></div></section>
      <section class="domain-grid practice-domains">
        ${data.domains.map(domain => `<a class="domain-card ${domain.color}" href="#/practicar/dom${domain.id}"><div><span>DOMINIO ${domain.id}</span><b>${domain.weight}%</b></div><h3>${escapeHtml(domain.title)}</h3><p>${escapeHtml(domain.detail)}</p><span class="card-cta">Practicar dominio →</span></a>`).join("")}
      </section>
      <section class="section-heading"><div><p class="kicker">POR TEMA</p><h2>Refuerza un punto específico</h2><p>Frentes enfocados en las diferencias que más se confunden.</p></div></section>
      <section class="focus-grid full-grid">${data.focusAreas.map(focusCard).join("")}</section>
      <section class="mixed-card panel"><div><p class="kicker">MODO MIXTO</p><h2>Diagnóstico de 10 preguntas</h2><p>Mezcla todos los frentes para detectar qué debes reforzar hoy.</p></div><button class="button primary" type="button" data-action="start-mixed">Iniciar diagnóstico →</button></section>`;
  }

  function startQuiz(focus) {
    let pool;
    let cap = 10;
    if (focus === "mixed") pool = data.questions;
    else if (/^dom[1-4]$/.test(focus)) { const d = Number(focus.slice(3)); pool = data.questions.filter(question => question.domain === d); cap = 20; }
    else pool = data.questions.filter(question => question.focus === focus);
    const progress = loadProgress();
    const lastSeen = {};
    progress.answers.forEach(answer => { lastSeen[answer.id] = answer.date; });
    const ranked = shuffle(pool).sort((a, b) => {
      const dateA = lastSeen[a.id] || "";
      const dateB = lastSeen[b.id] || "";
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
    const quantity = Math.min(cap, pool.length);
    const questions = shuffle(ranked.slice(0, quantity));
    const orders = questions.map(question => shuffle(question.options.map((_, i) => i)));
    activeQuiz = { focus, questions, orders, index: 0, selections: [], pending: [] };
  }

  function renderQuiz() {
    const quiz = activeQuiz;
    if (quiz.index >= quiz.questions.length) return renderResults();
    const question = quiz.questions[quiz.index];
    const answered = quiz.selections[quiz.index];
    const order = quiz.orders[quiz.index] || question.options.map((_, i) => i);
    const multi = isMulti(question);
    const pending = quiz.pending[quiz.index] || [];
    const metaRight = multi ? "Elige " + question.correct.length + " respuestas" : "Escenario tipo examen";
    const footer = answered
      ? feedback(question, answered, order)
      : (multi
        ? `<div class="multi-actions"><p class="answer-hint">Selecciona ${question.correct.length} opciones y pulsa Comprobar.</p><button type="button" class="button primary" data-action="check-multi" ${pending.length === question.correct.length ? "" : "disabled"}>Comprobar respuesta</button></div>`
        : "<p class=\"answer-hint\">Elige una opción. Recibirás la explicación y el descarte completo de inmediato.</p>");
    app.innerHTML = `
      <section class="quiz-top"><a href="#/practicar" class="back-link">← Cambiar práctica</a><div><p class="kicker">${escapeHtml(quizLabel(quiz.focus))}</p><span>Pregunta ${quiz.index + 1} de ${quiz.questions.length}</span></div><div class="progress-track" aria-label="Progreso"><i style="width:${((quiz.index + (answered ? 1 : 0)) / quiz.questions.length) * 100}%"></i></div></section>
      <section class="quiz-shell panel">
        <div class="question-meta"><span>Dominio ${question.domain} · ${escapeHtml(domainName(question.domain))}</span><span>${escapeHtml(metaRight)}</span></div>
        <h1>${escapeHtml(question.prompt)}</h1>
        <div class="answers" role="group" aria-label="Opciones de respuesta">
          ${order.map((origIdx, pos) => multi ? multiButton(question.options[origIdx], origIdx, pos, question, answered, pending) : answerButton(question.options[origIdx], origIdx, pos, question, answered)).join("")}
        </div>
        ${footer}
      </section>`;
  }

  function answerButton(option, origIdx, pos, question, answered) {
    const letter = String.fromCharCode(65 + pos);
    let className = "answer";
    if (answered) {
      if (origIdx === question.correct) className += " correct";
      else if (origIdx === answered.choice) className += " wrong";
    }
    return `<button type="button" class="${className}" data-action="answer" data-choice="${origIdx}" ${answered ? "disabled" : ""}><b>${letter}</b><span>${escapeHtml(option)}</span>${answered && origIdx === question.correct ? "<i>✓</i>" : ""}</button>`;
  }

  function multiButton(option, origIdx, pos, question, answered, pending) {
    const letter = String.fromCharCode(65 + pos);
    let className = "answer multi";
    let box = pending.includes(origIdx) ? "☑" : "☐";
    if (answered) {
      if (question.correct.includes(origIdx)) { className += " correct"; box = "☑"; }
      else if (answered.choices.includes(origIdx)) { className += " wrong"; box = "☒"; }
      else { box = "☐"; }
    } else if (pending.includes(origIdx)) {
      className += " selected";
    }
    return `<button type="button" class="${className}" data-action="toggle-multi" data-choice="${origIdx}" ${answered ? "disabled" : ""}><b>${letter}</b><span>${escapeHtml(option)}</span><i class="chk">${box}</i></button>`;
  }

  function feedback(question, answered, order) {
    const multi = isMulti(question);
    const isCorrect = multi ? answered.correct : (answered.choice === question.correct);
    const correctLetters = [];
    order.forEach((origIdx, pos) => { const ok = multi ? question.correct.includes(origIdx) : origIdx === question.correct; if (ok) correctLetters.push(String.fromCharCode(65 + pos)); });
    const heading = isCorrect ? "Buen razonamiento." : ("Respuesta" + (correctLetters.length > 1 ? "s" : "") + " correcta" + (correctLetters.length > 1 ? "s" : "") + ": " + correctLetters.join(", ") + ".");
    const reasonsHtml = order.map((origIdx, pos) => { const ok = multi ? question.correct.includes(origIdx) : origIdx === question.correct; return `<li class="${ok ? "right-reason" : ""}"><b>${String.fromCharCode(65 + pos)}</b>${escapeHtml(question.reasons[origIdx])}</li>`; }).join("");
    return `<aside class="feedback ${isCorrect ? "good" : "needs-work"}"><p class="feedback-label">${isCorrect ? "✓ Correcta" : "↗ Para reforzar"}</p><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(question.explanation)}</p><details open><summary>Ver descarte de todas las opciones</summary><ol class="reasons">${reasonsHtml}</ol></details><button type="button" class="button primary" data-action="next">${activeQuiz.index + 1 === activeQuiz.questions.length ? "Ver resultado" : "Siguiente pregunta →"}</button></aside>`;
  }

  function toggleMulti(origIdx) {
    const i = activeQuiz.index;
    const arr = (activeQuiz.pending[i] || []).slice();
    const at = arr.indexOf(origIdx);
    if (at >= 0) arr.splice(at, 1); else arr.push(origIdx);
    activeQuiz.pending[i] = arr;
    renderQuiz();
  }
  function checkMulti() {
    const i = activeQuiz.index;
    const question = activeQuiz.questions[i];
    const chosen = (activeQuiz.pending[i] || []).slice();
    if (chosen.length !== question.correct.length) return;
    const correct = setEqual(chosen, question.correct);
    activeQuiz.selections[i] = { choices: chosen, correct };
    const summary = progressSummary();
    summary.progress.answers.push({ id: question.id, focus: question.focus, domain: question.domain, correct, choices: chosen, date: new Date().toISOString() });
    summary.progress.lastFocus = question.focus;
    summary.progress.lastStudyDate = new Date().toISOString();
    saveProgress(summary.progress);
    renderQuiz();
  }

  function recordAnswer(choice) {
    const question = activeQuiz.questions[activeQuiz.index];
    const correct = choice === question.correct;
    activeQuiz.selections[activeQuiz.index] = { choice, correct };
    const summary = progressSummary();
    summary.progress.answers.push({ id: question.id, focus: question.focus, domain: question.domain, correct, choice, date: new Date().toISOString() });
    summary.progress.lastFocus = question.focus;
    summary.progress.lastStudyDate = new Date().toISOString();
    saveProgress(summary.progress);
    renderQuiz();
  }

  function renderResults() {
    const total = activeQuiz.selections.length;
    const correct = activeQuiz.selections.filter(item => item.correct).length;
    const percent = Math.round((correct / total) * 100);
    const wrongQuestions = activeQuiz.questions.filter((_, index) => !activeQuiz.selections[index].correct);
    const wrongAreas = [...new Set(wrongQuestions.map(question => question.focus))].map(id => data.focusAreas.find(area => area.id === id));
    app.innerHTML = `<section class="results panel"><p class="kicker">SESIÓN COMPLETADA</p><div class="score-ring"><strong>${correct}<small>/${total}</small></strong><span>${percent}%</span></div><h1>${percent >= 80 ? "Este bloque está sólido." : "Ya sabes exactamente dónde insistir."}</h1><p>${percent >= 80 ? "Cumpliste la meta de 8/10. Mantén una sesión mixta más adelante para comprobar que la diferencia sigue automática." : "No memorices solo la respuesta: vuelve a mirar el descarte, luego repite este frente hasta obtener 8/10."}</p>${wrongAreas.length ? `<div class="reinforce"><h2>Reforzar ahora</h2>${wrongAreas.map(area => `<a href="#/practicar/${area.id}">${escapeHtml(area.title)} <span>→</span></a>`).join("")}</div>` : ""}<div class="result-actions"><button type="button" class="button primary" data-action="restart">Repetir bloque</button><a class="button secondary" href="#/practicar">Elegir otro frente</a></div></section>`;
  }

  function renderCheatSheet() {
    app.innerHTML = `<section class="page-intro compact"><p class="kicker">REPASO RÁPIDO</p><h1>Lo que no quieres<br><em>confundir en el examen.</em></h1><p>Lee estas comparaciones antes de practicar o el día previo. Para consolidarlas, vuelve a los escenarios.</p></section><section class="section-heading drill-heading no-top"><div><p class="kicker">NO CONFUNDIR</p><h2>Las que más fallas, lado a lado</h2><p>Reconoce la palabra gatillo y salta al servicio correcto. Estas son tus confusiones frecuentes.</p></div></section>${(data.confusionSets || []).map(set => `<section class="drill panel"><h3>${escapeHtml(set.title)}</h3>${set.note ? `<p class="vs-note">${escapeHtml(set.note)}</p>` : ""}<div class="drill-scroll"><table class="drill-table vs-table"><thead><tr>${set.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${set.rows.map(r => `<tr><td class="vs-key"><b>${escapeHtml(r[0])}</b></td><td>${escapeHtml(r[1])}</td><td>${escapeHtml(r[2])}</td></tr>`).join("")}</tbody></table></div></section>`).join("")}<section class="section-heading drill-heading"><div><p class="kicker">COMPARACIONES CLAVE</p><h2>Otras que suelen caer</h2></div></section><section class="cheat-grid">${data.cheatSheets.map(card => `<article><span>${escapeHtml(card.tag)}</span><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.body)}</p></article>`).join("")}</section><section class="section-heading drill-heading"><div><p class="kicker">PALABRAS GATILLO</p><h2>Si el enunciado dice… piensa en…</h2><p>La técnica que más puntos da: reconoce la pista y salta al servicio. Tablas de la guía maestra de Camila, adaptadas al español.</p></div></section>${data.triggerDrills.map(d => `<section class="drill panel"><h3>${escapeHtml(d.title)}</h3><div class="drill-scroll"><table class="drill-table"><thead><tr><th>Si el enunciado dice…</th><th>Piensa en…</th></tr></thead><tbody>${d.pairs.map(p => `<tr><td>${escapeHtml(p[0])}</td><td><b>${escapeHtml(p[1])}</b></td></tr>`).join("")}</tbody></table></div></section>`).join("")}<section class="section-heading drill-heading"><div><p class="kicker">OJO CON ESTO</p><h2>Trampas típicas del examen</h2></div></section><section class="traps-list">${(data.examTraps || []).map(t => `<div class="trap-row"><span>!</span><p>${escapeHtml(t)}</p></div>`).join("")}</section><section class="exam-facts panel"><div><p class="kicker">FORMATO REAL</p><h2>Qué esperar en CLF-C02</h2></div><ul><li><b>65</b> preguntas totales; 50 puntuadas y 15 no puntuadas.</li><li><b>700/1000</b> es el puntaje mínimo de aprobación.</li><li><b>Sin penalización</b> por adivinar: responde todas.</li></ul><a class="button primary" href="#/practicar/mixed">Hacer diagnóstico →</a></section>`;
  }

  function renderLearnHome() {
    app.innerHTML = `
      <section class="page-intro"><p class="kicker">APRENDER</p><h1>Entiende primero,<br><em>luego practica.</em></h1><p>La teoría dividida en los 4 dominios del examen, explicada en simple. Empieza por Tecnología (34%) y Seguridad (30%): juntos son el 64% del examen.</p></section>
      <section class="learn-grid">
        ${data.studyGuide.map(dom => `<a class="learn-card ${dom.color}" href="#/aprender/${dom.id}"><div class="learn-card-top"><span>DOMINIO ${dom.id}</span><b>${dom.weight}%</b></div><h2>${escapeHtml(dom.title)}</h2><p>${escapeHtml(dom.intro)}</p><span class="card-cta">${dom.sections.length} temas →</span></a>`).join("")}
      </section>`;
  }

  function renderLearnDomain(id) {
    const dom = data.studyGuide.find(item => item.id === id);
    if (!dom) { location.hash = "#/aprender"; return; }
    const prev = data.studyGuide.find(item => item.id === id - 1);
    const next = data.studyGuide.find(item => item.id === id + 1);
    app.innerHTML = `
      <section class="learn-head panel ${dom.color}"><a href="#/aprender" class="back-link">← Todos los dominios</a><p class="kicker">DOMINIO ${dom.id} · ${dom.weight}% DEL EXAMEN</p><h1>${escapeHtml(dom.title)}</h1><p>${escapeHtml(dom.intro)}</p></section>
      <section class="learn-sections">
        ${dom.sections.map((s, i) => `<article class="learn-section"><div class="learn-num">${i + 1}</div><div class="learn-body"><h2>${escapeHtml(s.h)}</h2><p>${escapeHtml(s.p)}</p><ul>${s.points.map(pt => `<li>${escapeHtml(pt)}</li>`).join("")}</ul><p class="learn-tip"><b>💡 Truco de examen:</b> ${escapeHtml(s.tip)}</p></div></article>`).join("")}
      </section>
      <section class="learn-nav">
        ${prev ? `<a class="button secondary" href="#/aprender/${prev.id}">← ${escapeHtml(prev.title)}</a>` : "<span></span>"}
        <a class="button primary" href="#/practicar/dom${dom.id}">Practicar este dominio →</a>
        ${next ? `<a class="button secondary" href="#/aprender/${next.id}">${escapeHtml(next.title)} →</a>` : "<span></span>"}
      </section>`;
  }

  function loadExam() {
    try { const saved = JSON.parse(localStorage.getItem(examKey)); if (saved && Array.isArray(saved.history)) return saved; } catch (_) { /* Clean slate on invalid data. */ }
    return { active: null, history: [] };
  }
  function saveExam(state) { localStorage.setItem(examKey, JSON.stringify(state)); }
  function stopExamTimer() { if (examTimerId) { clearInterval(examTimerId); examTimerId = null; } }
  function startExamTimer() { stopExamTimer(); examTimerId = setInterval(examTick, 1000); }

  function formatClock(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = n => String(n).padStart(2, "0");
    return (h > 0 ? h + ":" : "") + pad(m) + ":" + pad(s);
  }
  function examRemaining(attempt) { return attempt.startedAt + attempt.durationMin * 60000 - Date.now(); }

  function examTick() {
    const state = loadExam();
    const a = state.active;
    if (!a || a.submittedAt) { stopExamTimer(); return; }
    const rem = examRemaining(a);
    const el = document.getElementById("examTimer");
    if (el) { el.textContent = formatClock(rem); if (rem < 300000) el.parentElement.classList.add("urgent"); }
    if (rem <= 0) { stopExamTimer(); submitExam(true); }
  }

  function selectExamQuestions(seen) {
    const total = data.exam.questionCount || 65;
    const weights = { 1: 0.24, 2: 0.30, 3: 0.34, 4: 0.12 };
    const byDomain = { 1: [], 2: [], 3: [], 4: [] };
    data.questions.forEach(qn => { if (byDomain[qn.domain]) byDomain[qn.domain].push(qn.id); });
    // Baraja primero y luego ordena por "visto hace más tiempo" para rotar las preguntas entre intentos.
    const rank = ids => shuffle(ids).sort((a, b) => (seen[a] || 0) - (seen[b] || 0));
    let picked = [];
    [1, 2, 3, 4].forEach(d => {
      const target = Math.round(total * weights[d]);
      picked = picked.concat(rank(byDomain[d]).slice(0, Math.min(target, byDomain[d].length)));
    });
    const chosen = new Set(picked);
    const remaining = rank(data.questions.map(qn => qn.id).filter(id => !chosen.has(id)));
    while (picked.length < total && remaining.length) picked.push(remaining.shift());
    return shuffle(picked).slice(0, total);
  }

  function startExam() {
    const state = loadExam();
    if (!state.seen) state.seen = {};
    const ids = selectExamQuestions(state.seen);
    const now = Date.now();
    const optOrder = {};
    ids.forEach(id => { state.seen[id] = now; const qn = byId(id); optOrder[id] = shuffle(qn.options.map((_, i) => i)); });
    state.active = { ids, optOrder, answers: {}, flags: {}, index: 0, startedAt: now, durationMin: data.exam.durationMinutes || 90, submittedAt: null };
    saveExam(state);
    renderExam();
  }

  function examScore(a) {
    let correct = 0;
    const perDomain = { 1: { c: 0, t: 0 }, 2: { c: 0, t: 0 }, 3: { c: 0, t: 0 }, 4: { c: 0, t: 0 } };
    a.ids.forEach(id => {
      const qn = byId(id); if (!qn) return;
      perDomain[qn.domain].t++;
      const v = a.answers[id];
      const ok = isMulti(qn) ? (Array.isArray(v) && setEqual(v, qn.correct)) : (v === qn.correct);
      if (ok) { correct++; perDomain[qn.domain].c++; }
    });
    const total = a.ids.length;
    const scaled = Math.round(100 + (correct / total) * 900);
    return { correct, total, scaled, passed: scaled >= (data.exam.passingScore || 700), perDomain, percent: Math.round((correct / total) * 100) };
  }

  function submitExam(auto) {
    const state = loadExam();
    const a = state.active;
    if (!a || a.submittedAt) return;
    if (!auto) {
      const unanswered = a.ids.filter(id => a.answers[id] === undefined).length;
      const msg = unanswered ? ("Te faltan " + unanswered + " preguntas sin responder. ¿Finalizar de todos modos?") : "¿Finalizar el examen y ver tu resultado?";
      if (!confirm(msg)) return;
    }
    a.submittedAt = Date.now();
    const result = examScore(a);
    state.history.unshift({ date: new Date().toISOString(), correct: result.correct, total: result.total, scaled: result.scaled, passed: result.passed });
    state.history = state.history.slice(0, 8);
    saveExam(state);
    stopExamTimer();
    window.scrollTo(0, 0);
    renderExam();
  }

  function renderExam() {
    const state = loadExam();
    const a = state.active;
    if (a && a.submittedAt) { stopExamTimer(); return renderExamReport(a); }
    if (a) { startExamTimer(); return renderExamRuntime(a); }
    stopExamTimer();
    return renderExamIntro(state);
  }

  function renderExamIntro(state) {
    const dur = data.exam.durationMinutes || 90;
    const history = state.history.length ? `<section class="exam-history panel"><h2>Tus intentos recientes</h2><ul>${state.history.map(h => `<li class="${h.passed ? "pass" : "fail"}"><span>${new Date(h.date).toLocaleDateString("es")}</span><strong>${h.correct}/${h.total}</strong><span>${h.scaled}/1000</span><span class="tag">${h.passed ? "Aprobado" : "No aprobado"}</span></li>`).join("")}</ul></section>` : "";
    app.innerHTML = `
      <section class="page-intro"><p class="kicker">EXAMEN REAL</p><h1>Simulacro completo<br><em>en condiciones reales.</em></h1><p>65 preguntas con la distribución oficial por dominio y ${dur} minutos de reloj. Sin respuestas hasta el final, igual que el examen verdadero.</p></section>
      <section class="exam-brief panel">
        <div class="exam-brief-grid">
          <article><span>Preguntas</span><strong>65</strong><small>D1 ~16 · D2 ~20 · D3 ~22 · D4 ~8</small></article>
          <article><span>Tiempo</span><strong>${dur} min</strong><small>reloj en cuenta regresiva</small></article>
          <article><span>Aprobación</span><strong>700</strong><small>de 1000 (escala aprox.)</small></article>
          <article><span>Formato</span><strong>Sin feedback</strong><small>revisas todo al finalizar</small></article>
        </div>
        <ul class="exam-rules">
          <li>Puedes marcar preguntas con 🚩 y volver a ellas antes de finalizar.</li>
          <li>No hay penalización por adivinar: responde todas.</li>
          <li>Si cierras la app, el examen y el reloj continúan donde los dejaste.</li>
          <li>Al agotarse el tiempo se entrega automáticamente.</li>
        </ul>
        <button class="button primary large" type="button" data-action="exam-start">Comenzar examen de 65 →</button>
      </section>
      ${history}`;
  }

  function renderExamRuntime(a) {
    const idx = a.index;
    const id = a.ids[idx];
    const question = byId(id);
    const isAnswered = v => Array.isArray(v) ? v.length > 0 : v !== undefined;
    const answeredCount = a.ids.filter(x => isAnswered(a.answers[x])).length;
    const chosen = a.answers[id];
    const multi = isMulti(question);
    const flagged = !!a.flags[id];
    const rem = examRemaining(a);
    const order = a.optOrder && a.optOrder[id] ? a.optOrder[id] : question.options.map((_, i) => i);
    app.innerHTML = `
      <section class="exam-bar">
        <div class="exam-clock ${rem < 300000 ? "urgent" : ""}"><span>Tiempo</span><strong id="examTimer">${formatClock(rem)}</strong></div>
        <div class="exam-count"><span>Respondidas</span><strong>${answeredCount}/${a.ids.length}</strong></div>
        <button class="button primary" type="button" data-action="exam-submit">Finalizar</button>
      </section>
      <section class="exam-main">
        <div class="exam-question panel">
          <div class="question-meta"><span>Pregunta ${idx + 1} de ${a.ids.length} · Dominio ${question.domain}${multi ? " · Elige " + question.correct.length : ""}</span><button type="button" class="flag-btn ${flagged ? "on" : ""}" data-action="exam-flag">${flagged ? "🚩 Marcada" : "⚐ Marcar"}</button></div>
          <h1>${escapeHtml(question.prompt)}</h1>
          <div class="answers" role="group" aria-label="Opciones">
            ${order.map((origIdx, pos) => { const sel = multi ? (Array.isArray(chosen) && chosen.includes(origIdx)) : chosen === origIdx; return `<button type="button" class="answer${multi ? " multi" : ""} ${sel ? "selected" : ""}" data-action="exam-answer" data-choice="${origIdx}"><b>${String.fromCharCode(65 + pos)}</b><span>${escapeHtml(question.options[origIdx])}</span>${multi ? `<i class="chk">${sel ? "☑" : "☐"}</i>` : ""}</button>`; }).join("")}
          </div>
          <div class="exam-move">
            <button class="button secondary" type="button" data-action="exam-prev" ${idx === 0 ? "disabled" : ""}>← Anterior</button>
            <button class="button primary" type="button" data-action="exam-next" ${idx === a.ids.length - 1 ? "disabled" : ""}>Siguiente →</button>
          </div>
        </div>
        <aside class="exam-palette">
          <p>Navegación</p>
          <div class="palette-grid">
            ${a.ids.map((qid, i) => { let cls = "pal"; if (i === idx) cls += " current"; if (isAnswered(a.answers[qid])) cls += " done"; if (a.flags[qid]) cls += " flag"; return `<button type="button" class="${cls}" data-action="exam-goto" data-idx="${i}">${i + 1}</button>`; }).join("")}
          </div>
          <div class="palette-legend"><span class="k done"></span>Respondida <span class="k flag"></span>Marcada <span class="k"></span>Sin responder</div>
        </aside>
      </section>`;
  }

  function renderExamReport(a) {
    const r = examScore(a);
    const usedMs = a.submittedAt - a.startedAt;
    const domNames = { 1: "Conceptos", 2: "Seguridad", 3: "Tecnología", 4: "Facturación" };
    const weakDomains = [1, 2, 3, 4].filter(d => r.perDomain[d].t && (r.perDomain[d].c / r.perDomain[d].t) < 0.7);
    app.innerHTML = `
      <section class="results panel ${r.passed ? "pass" : "fail"}">
        <p class="kicker">RESULTADO DEL SIMULACRO</p>
        <div class="score-ring"><strong>${r.scaled}<small>/1000</small></strong><span>${r.percent}% · ${r.correct}/${r.total}</span></div>
        <h1>${r.passed ? "¡Aprobado! 🎉" : "Aún no, pero vas en camino."}</h1>
        <p>${r.passed ? "Superaste el umbral de 700. Repite otro simulacro más adelante para confirmar que el nivel se mantiene." : "Necesitas 700/1000 (≈70%). Revisa abajo cada error y refuerza los dominios más flojos."}</p>
        <p class="exam-time-used">Tiempo usado: ${formatClock(usedMs)} de ${a.durationMin} min.</p>
      </section>
      <section class="domain-score panel">
        <h2>Desempeño por dominio</h2>
        ${[1, 2, 3, 4].map(d => { const pd = r.perDomain[d]; const pct = pd.t ? Math.round((pd.c / pd.t) * 100) : 0; return `<div class="dscore"><span>D${d} · ${domNames[d]}</span><div class="dbar"><i class="${pct >= 70 ? "ok" : "low"}" style="width:${pct}%"></i></div><b>${pd.c}/${pd.t}</b></div>`; }).join("")}
      </section>
      <section class="exam-actions-row">
        <button class="button primary" type="button" data-action="exam-new">Hacer otro examen</button>
        <button class="button secondary" type="button" data-action="export-report">⬇ Descargar resultados</button>
        ${weakDomains.length ? weakDomains.map(d => `<a class="button secondary" href="#/practicar/dom${d}">Reforzar D${d} →</a>`).join("") : `<a class="button secondary" href="#/practicar">Ir a practicar →</a>`}
      </section>
      <section class="review">
        <h2>Revisión de las ${a.ids.length} preguntas</h2>
        ${a.ids.map((id, i) => {
          const qn = byId(id); const your = a.answers[id]; const multi = isMulti(qn);
          const answeredQ = multi ? (Array.isArray(your) && your.length > 0) : (your !== undefined);
          const ok = multi ? (Array.isArray(your) && setEqual(your, qn.correct)) : (your === qn.correct);
          const isRight = oi => multi ? qn.correct.includes(oi) : oi === qn.correct;
          const isYours = oi => multi ? (Array.isArray(your) && your.includes(oi)) : oi === your;
          // Mostrar las opciones en el mismo orden barajado que se usó durante el examen, para que las letras coincidan.
          const reviewOrder = (a.optOrder && a.optOrder[id]) || qn.options.map((_, oi) => oi);
          return `<article class="review-item ${ok ? "ok" : "bad"}"><div class="review-head"><span>#${i + 1} · Dominio ${qn.domain}${multi ? " · múltiple" : ""}</span><span class="review-flag">${ok ? "✓ Correcta" : (answeredQ ? "✗ Incorrecta" : "— Sin responder")}</span></div><p class="review-q">${escapeHtml(qn.prompt)}</p><ul class="review-opts">${reviewOrder.map((oi, pos) => { let c = ""; if (isRight(oi)) c = "right"; else if (isYours(oi)) c = "yours"; return `<li class="${c}"><b>${String.fromCharCode(65 + pos)}</b>${escapeHtml(qn.options[oi])}${isRight(oi) ? " ✓" : (isYours(oi) ? " ← tu respuesta" : "")}</li>`; }).join("")}</ul><p class="review-exp">${escapeHtml(qn.explanation)}</p></article>`;
        }).join("")}
      </section>`;
  }

  function loadFlash() {
    try { const saved = JSON.parse(localStorage.getItem(flashKey)); if (saved && saved.known) return saved; } catch (_) { /* Clean slate on invalid data. */ }
    return { known: {} };
  }
  function saveFlash(state) { localStorage.setItem(flashKey, JSON.stringify(state)); }

  function startDeck(cat) {
    let pool = data.flashcards.slice();
    if (cat === "repasar") { const known = loadFlash().known; pool = pool.filter(card => !known[card.front]); }
    else if (cat && cat !== "todas") pool = pool.filter(card => card.cat === cat);
    activeDeck = { cat: cat || "todas", cards: shuffle(pool), index: 0, flipped: false };
  }

  function renderFlash(route) {
    const parts = route.split("/");
    const cat = parts[2] ? decodeURIComponent(parts[2]) : "todas";
    if (!activeDeck || activeDeck.cat !== cat) startDeck(cat);
    const deck = activeDeck;
    const flash = loadFlash();
    const cats = [...new Set(data.flashcards.map(card => card.cat))];
    const knownCount = data.flashcards.filter(card => flash.known[card.front]).length;
    const filters = `
      <div class="flash-filters">
        <a class="chip ${cat === "todas" ? "on" : ""}" href="#/tarjetas">Todas</a>
        <a class="chip ${cat === "repasar" ? "on" : ""}" href="#/tarjetas/repasar">Por repasar</a>
        ${cats.map(c => `<a class="chip ${cat === c ? "on" : ""}" href="#/tarjetas/${encodeURIComponent(c)}">${escapeHtml(c)}</a>`).join("")}
      </div>`;
    if (!deck.cards.length) {
      app.innerHTML = `
        <section class="page-intro compact"><p class="kicker">TARJETAS</p><h1>¡Todo dominado aquí!</h1><p>No quedan tarjetas por repasar en este filtro. Cambia de categoría o reinicia el repaso.</p></section>
        <section class="flash-top"><span class="flash-progress">${knownCount}/${data.flashcards.length} dominadas</span>${filters}</section>
        <section class="flash-done panel" style="padding:34px"><button class="button primary" type="button" data-action="flash-reset">Reiniciar tarjetas dominadas</button></section>`;
      return;
    }
    const card = deck.cards[deck.index];
    const isKnown = !!flash.known[card.front];
    app.innerHTML = `
      <section class="page-intro compact"><p class="kicker">TARJETAS</p><h1>Memoriza los servicios<br><em>y sus palabras gatillo.</em></h1><p>Mira el servicio, intenta recordar qué hace y qué pista lo delata, y voltea la tarjeta para comprobar.</p></section>
      <section class="flash-top"><span class="flash-progress">Tarjeta ${deck.index + 1} / ${deck.cards.length} · ${knownCount}/${data.flashcards.length} dominadas</span>${filters}</section>
      <section class="flash-stage">
        <div class="flashcard ${deck.flipped ? "flipped" : ""}" data-action="flash-flip" role="button" tabindex="0" aria-label="Voltear tarjeta">
          <div class="fc-inner">
            <div class="fc-face fc-front"><p class="fc-cat">${escapeHtml(card.cat)}</p><h2>${escapeHtml(card.front)}</h2><p class="fc-hint">Toca para ver la respuesta ↻</p></div>
            <div class="fc-face fc-back"><p class="fc-label">QUÉ ES / CUÁNDO USARLO</p><p>${escapeHtml(card.back)}</p>${card.trigger ? `<p class="fc-trigger"><b>💡 Gatillo:</b> ${escapeHtml(card.trigger)}</p>` : ""}</div>
          </div>
        </div>
      </section>
      <section class="flash-actions">
        <button class="button secondary" type="button" data-action="flash-prev">← Anterior</button>
        <button class="button primary" type="button" data-action="flash-flip">Voltear ↻</button>
        <button class="button secondary" type="button" data-action="flash-next">Siguiente →</button>
      </section>
      <section class="flash-known">
        <button class="icon-btn" type="button" data-action="flash-review" title="Marcar para repasar" aria-label="Marcar para repasar">↺</button>
        <button class="chip ${isKnown ? "on" : ""}" type="button" data-action="flash-known">${isKnown ? "✓ Ya la sé" : "Marcar como sabida"}</button>
      </section>`;
  }

  function focusTitle(id) {
    const area = data.focusAreas.find(item => item.id === id);
    return area ? area.title : id;
  }

  function buildReport() {
    const progress = loadProgress();
    const answers = progress.answers || [];
    const exam = loadExam();
    const L = [];
    L.push("# Reporte de estudio · AWS CLF-C02");
    L.push("");
    L.push("Generado: " + new Date().toLocaleString("es") + "  ·  Examen objetivo: 1 de septiembre de 2026 (" + daysToExam() + " días restantes)");
    L.push("");
    const total = answers.length;
    const correct = answers.filter(a => a.correct).length;
    L.push("## Resumen de práctica");
    L.push("- Preguntas respondidas: " + total);
    L.push("- Aciertos: " + correct + (total ? " (" + Math.round(correct / total * 100) + "%)" : ""));
    L.push("");
    L.push("### Precisión por dominio");
    [1, 2, 3, 4].forEach(d => {
      const dom = answers.filter(a => a.domain === d);
      if (dom.length) { const c = dom.filter(a => a.correct).length; L.push("- D" + d + " " + domainName(d) + ": " + c + "/" + dom.length + " (" + Math.round(c / dom.length * 100) + "%)"); }
    });
    L.push("");
    L.push("### Precisión por tema");
    data.focusAreas.forEach(f => {
      const fa = answers.filter(a => a.focus === f.id);
      if (fa.length) { const c = fa.filter(a => a.correct).length; L.push("- " + f.title + ": " + c + "/" + fa.length + " (" + Math.round(c / fa.length * 100) + "%)"); }
    });
    L.push("");
    if (exam.history && exam.history.length) {
      L.push("## Historial de exámenes");
      exam.history.forEach(h => { L.push("- " + new Date(h.date).toLocaleDateString("es") + ": " + h.correct + "/" + h.total + " (" + h.scaled + "/1000) — " + (h.passed ? "Aprobado" : "No aprobado")); });
      L.push("");
    }
    const optLabel = (q, idx) => String.fromCharCode(65 + idx) + ") " + q.options[idx];
    const wrong = {};
    const latest = {};
    answers.forEach(a => { latest[a.id] = a; });
    Object.keys(latest).forEach(id => { const rec = latest[id]; if (!rec.correct) { const q = byId(id); wrong[id] = { your: q && isMulti(q) ? rec.choices : rec.choice }; } });
    if (exam.active && exam.active.submittedAt) {
      exam.active.ids.forEach(id => { const q = byId(id); if (!q) return; const v = exam.active.answers[id]; const ok = isMulti(q) ? (Array.isArray(v) && setEqual(v, q.correct)) : (v === q.correct); if (!ok) wrong[id] = { your: v }; });
    }
    const wrongIds = Object.keys(wrong);
    L.push("## Preguntas que fallé (" + wrongIds.length + ")");
    L.push("");
    if (!wrongIds.length) L.push("_No hay preguntas falladas registradas. ¡Bien!_");
    wrongIds.forEach((id, i) => {
      const q = byId(id); if (!q) return;
      const multi = isMulti(q);
      const your = wrong[id].your;
      L.push((i + 1) + ". **[D" + q.domain + " · " + focusTitle(q.focus) + "]** " + q.prompt);
      let yourText = "";
      if (multi) yourText = Array.isArray(your) && your.length ? your.map(c => optLabel(q, c)).join("; ") : "(sin responder)";
      else if (your !== undefined && your !== null) yourText = optLabel(q, your);
      if (yourText) L.push("   - Tu respuesta: " + yourText);
      L.push("   - Correcta: " + (multi ? q.correct.map(c => optLabel(q, c)).join("; ") : optLabel(q, q.correct)));
      L.push("   - Por qué: " + q.explanation);
      L.push("");
    });
    L.push("---");
    L.push("Enviarle este archivo a mi tutor y pedir: \"¿qué me falta y cómo lo refuerzo?\".");
    return L.join("\n");
  }

  function downloadReport() {
    const progress = loadProgress();
    const exam = loadExam();
    if ((!progress.answers || !progress.answers.length) && (!exam.history || !exam.history.length)) {
      alert("Aún no hay resultados guardados. Responde algunas preguntas o haz un examen y vuelve a exportar.");
      return;
    }
    const md = buildReport();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resultados-clf-c02-" + new Date().toISOString().slice(0, 10) + ".md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let ttsState = { id: null, paused: false };
  function pickSpanishVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return voices.find(v => /^es(-|_)/i.test(v.lang)) || voices.find(v => /spanish|español/i.test(v.name)) || null;
  }
  function speakEpisode(ep) {
    if (!("speechSynthesis" in window)) { alert("Tu navegador no soporta lectura por voz. Prueba en Chrome o Safari."); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ep.script);
    u.lang = "es-ES";
    const v = pickSpanishVoice();
    if (v) u.voice = v;
    u.rate = 1; u.pitch = 1;
    u.onend = () => { ttsState = { id: null, paused: false }; if (location.hash.startsWith("#/escuchar")) renderListen(); };
    u.onerror = () => { ttsState = { id: null, paused: false }; if (location.hash.startsWith("#/escuchar")) renderListen(); };
    ttsState = { id: ep.id, paused: false };
    window.speechSynthesis.speak(u);
    renderListen();
  }
  function togglePauseTTS() {
    const s = window.speechSynthesis;
    if (!s) return;
    if (s.paused) { s.resume(); ttsState.paused = false; }
    else if (s.speaking) { s.pause(); ttsState.paused = true; }
    renderListen();
  }
  function stopTTS() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    ttsState = { id: null, paused: false };
    renderListen();
  }
  function renderListen() {
    const eps = data.podcast || [];
    app.innerHTML = `
      <section class="page-intro compact"><p class="kicker">ESCUCHAR</p><h1>Repasa sin mirar<br><em>la pantalla.</em></h1><p>Lecciones cortas que tu teléfono lee en voz alta. Perfecto para el metro: una vez cargada la app funciona sin internet. Toca Reproducir en cualquier lección.</p></section>
      <section class="listen-grid">
        ${eps.map((ep, i) => {
          const active = ttsState.id === ep.id;
          return `<article class="listen-card ${active ? "playing" : ""}"><div class="listen-top"><span class="listen-num">${i + 1}</span><span class="listen-mins">${escapeHtml(ep.mins || "")}</span></div><h2>${escapeHtml(ep.title)}</h2><div class="listen-actions">${active ? `<button class="button primary" type="button" data-action="tts-pause">${ttsState.paused ? "▶ Reanudar" : "⏸ Pausar"}</button><button class="button secondary" type="button" data-action="tts-stop">■ Detener</button>` : `<button class="button primary" type="button" data-action="tts-play" data-ep="${ep.id}">▶ Reproducir</button>`}</div></article>`;
        }).join("")}
      </section>
      <p class="listen-note">🔊 Usa la voz del propio teléfono o navegador; sube el volumen para escucharla. Si no suena, prueba en Chrome o Safari y verifica que el dispositivo tenga una voz en español instalada.</p>`;
  }

  function render() {
    const route = location.hash || "#/inicio";
    linkActive(route);
    stopExamTimer();
    if (route.startsWith("#/practicar")) renderPractice(route);
    else if (route.startsWith("#/tarjetas")) renderFlash(route);
    else if (route.startsWith("#/escuchar")) renderListen();
    else if (route.startsWith("#/aprender/")) renderLearnDomain(Number(route.split("/")[2]));
    else if (route === "#/aprender") renderLearnHome();
    else if (route === "#/examen") renderExam();
    else if (route === "#/chuleta") renderCheatSheet();
    else renderHome();
    app.focus({ preventScroll: true });
  }

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    if (target.dataset.action === "answer") recordAnswer(Number(target.dataset.choice));
    if (target.dataset.action === "toggle-multi") toggleMulti(Number(target.dataset.choice));
    if (target.dataset.action === "check-multi") checkMulti();
    if (target.dataset.action === "next") { activeQuiz.index += 1; renderQuiz(); }
    if (target.dataset.action === "start-mixed") { startQuiz("mixed"); renderQuiz(); }
    if (target.dataset.action === "restart") { startQuiz(activeQuiz.focus); renderQuiz(); }
    if (target.dataset.action === "exam-start") startExam();
    if (target.dataset.action === "exam-answer") { const s = loadExam(); const a = s.active; if (a && !a.submittedAt) { const id = a.ids[a.index]; const q = byId(id); const ch = Number(target.dataset.choice); if (isMulti(q)) { const arr = Array.isArray(a.answers[id]) ? a.answers[id].slice() : []; const at = arr.indexOf(ch); if (at >= 0) arr.splice(at, 1); else arr.push(ch); a.answers[id] = arr; } else { a.answers[id] = ch; } saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-flag") { const s = loadExam(); const a = s.active; if (a) { const id = a.ids[a.index]; if (a.flags[id]) delete a.flags[id]; else a.flags[id] = true; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-prev") { const s = loadExam(); const a = s.active; if (a && a.index > 0) { a.index -= 1; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-next") { const s = loadExam(); const a = s.active; if (a && a.index < a.ids.length - 1) { a.index += 1; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-goto") { const s = loadExam(); const a = s.active; if (a) { a.index = Number(target.dataset.idx); saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-submit") submitExam(false);
    if (target.dataset.action === "exam-new") { const s = loadExam(); s.active = null; saveExam(s); window.scrollTo(0, 0); renderExam(); }
    if (target.dataset.action === "flash-flip") { if (activeDeck) { activeDeck.flipped = !activeDeck.flipped; renderFlash(location.hash); } }
    if (target.dataset.action === "flash-next") { if (activeDeck) { activeDeck.index = (activeDeck.index + 1) % activeDeck.cards.length; activeDeck.flipped = false; renderFlash(location.hash); } }
    if (target.dataset.action === "flash-prev") { if (activeDeck) { activeDeck.index = (activeDeck.index - 1 + activeDeck.cards.length) % activeDeck.cards.length; activeDeck.flipped = false; renderFlash(location.hash); } }
    if (target.dataset.action === "flash-known") { if (activeDeck) { const card = activeDeck.cards[activeDeck.index]; const f = loadFlash(); if (f.known[card.front]) delete f.known[card.front]; else f.known[card.front] = true; saveFlash(f); renderFlash(location.hash); } }
    if (target.dataset.action === "flash-review") { if (activeDeck) { const card = activeDeck.cards[activeDeck.index]; const f = loadFlash(); delete f.known[card.front]; saveFlash(f); activeDeck.index = (activeDeck.index + 1) % activeDeck.cards.length; activeDeck.flipped = false; renderFlash(location.hash); } }
    if (target.dataset.action === "flash-reset") { const f = loadFlash(); f.known = {}; saveFlash(f); activeDeck = null; renderFlash(location.hash); }
    if (target.dataset.action === "export-report") downloadReport();
    if (target.dataset.action === "tts-play") { const ep = (data.podcast || []).find(e => e.id === target.dataset.ep); if (ep) speakEpisode(ep); }
    if (target.dataset.action === "tts-pause") togglePauseTTS();
    if (target.dataset.action === "tts-stop") stopTTS();
  });

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));

  document.getElementById("resetProgress").addEventListener("click", () => {
    if (confirm("¿Quieres borrar todas las respuestas, estadísticas, exámenes y tarjetas guardadas en este navegador?")) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(examKey);
      localStorage.removeItem(flashKey);
      activeQuiz = null;
      activeDeck = null;
      stopExamTimer();
      render();
    }
  });

  applyTheme(currentTheme());
  if ("speechSynthesis" in window) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = function () { /* Voices ready. */ }; }
  window.addEventListener("hashchange", render);
  render();
}());
