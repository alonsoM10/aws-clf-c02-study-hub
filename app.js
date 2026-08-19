(function () {
  "use strict";

  const data = window.CLF_DATA;
  const app = document.getElementById("app");
  const storageKey = "clf-c02-study-hub-progress-v1";
  const examKey = "clf-c02-exam-v1";
  let activeQuiz = null;
  let examTimerId = null;

  function byId(id) {
    return data.questions.find(question => question.id === id);
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
    activeQuiz = { focus, questions: shuffle(ranked.slice(0, quantity)), index: 0, selections: [] };
  }

  function renderQuiz() {
    const quiz = activeQuiz;
    if (quiz.index >= quiz.questions.length) return renderResults();
    const question = quiz.questions[quiz.index];
    const answered = quiz.selections[quiz.index];
    app.innerHTML = `
      <section class="quiz-top"><a href="#/practicar" class="back-link">← Cambiar práctica</a><div><p class="kicker">${escapeHtml(quizLabel(quiz.focus))}</p><span>Pregunta ${quiz.index + 1} de ${quiz.questions.length}</span></div><div class="progress-track" aria-label="Progreso"><i style="width:${((quiz.index + (answered ? 1 : 0)) / quiz.questions.length) * 100}%"></i></div></section>
      <section class="quiz-shell panel">
        <div class="question-meta"><span>Dominio ${question.domain} · ${escapeHtml(domainName(question.domain))}</span><span>Escenario tipo examen</span></div>
        <h1>${escapeHtml(question.prompt)}</h1>
        <div class="answers" role="group" aria-label="Opciones de respuesta">
          ${question.options.map((option, index) => answerButton(option, index, question, answered)).join("")}
        </div>
        ${answered ? feedback(question, answered) : "<p class=\"answer-hint\">Elige una opción. Recibirás la explicación y el descarte completo de inmediato.</p>"}
      </section>`;
  }

  function answerButton(option, index, question, answered) {
    const letter = String.fromCharCode(65 + index);
    let className = "answer";
    if (answered) {
      if (index === question.correct) className += " correct";
      else if (index === answered.choice) className += " wrong";
    }
    return `<button type="button" class="${className}" data-action="answer" data-choice="${index}" ${answered ? "disabled" : ""}><b>${letter}</b><span>${escapeHtml(option)}</span>${answered && index === question.correct ? "<i>✓</i>" : ""}</button>`;
  }

  function feedback(question, answered) {
    const isCorrect = answered.choice === question.correct;
    return `<aside class="feedback ${isCorrect ? "good" : "needs-work"}"><p class="feedback-label">${isCorrect ? "✓ Correcta" : "↗ Para reforzar"}</p><h2>${isCorrect ? "Buen razonamiento." : "La respuesta correcta es " + String.fromCharCode(65 + question.correct) + "."}</h2><p>${escapeHtml(question.explanation)}</p><details open><summary>Ver descarte de todas las opciones</summary><ol class="reasons">${question.reasons.map((reason, index) => `<li class="${index === question.correct ? "right-reason" : ""}"><b>${String.fromCharCode(65 + index)}</b>${escapeHtml(reason)}</li>`).join("")}</ol></details><button type="button" class="button primary" data-action="next">${activeQuiz.index + 1 === activeQuiz.questions.length ? "Ver resultado" : "Siguiente pregunta →"}</button></aside>`;
  }

  function recordAnswer(choice) {
    const question = activeQuiz.questions[activeQuiz.index];
    const correct = choice === question.correct;
    activeQuiz.selections[activeQuiz.index] = { choice, correct };
    const summary = progressSummary();
    summary.progress.answers.push({ id: question.id, focus: question.focus, domain: question.domain, correct, date: new Date().toISOString() });
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
    app.innerHTML = `<section class="page-intro compact"><p class="kicker">REPASO RÁPIDO</p><h1>Lo que no quieres<br><em>confundir en el examen.</em></h1><p>Lee estas comparaciones antes de practicar o el día previo. Para consolidarlas, vuelve a los escenarios.</p></section><section class="cheat-grid">${data.cheatSheets.map(card => `<article><span>${escapeHtml(card.tag)}</span><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.body)}</p></article>`).join("")}</section><section class="exam-facts panel"><div><p class="kicker">FORMATO REAL</p><h2>Qué esperar en CLF-C02</h2></div><ul><li><b>65</b> preguntas totales; 50 puntuadas y 15 no puntuadas.</li><li><b>700/1000</b> es el puntaje mínimo de aprobación.</li><li><b>Sin penalización</b> por adivinar: responde todas.</li></ul><a class="button primary" href="#/practicar/mixed">Hacer diagnóstico →</a></section>`;
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
      if (a.answers[id] === qn.correct) { correct++; perDomain[qn.domain].c++; }
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
    const answeredCount = a.ids.filter(x => a.answers[x] !== undefined).length;
    const chosen = a.answers[id];
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
          <div class="question-meta"><span>Pregunta ${idx + 1} de ${a.ids.length} · Dominio ${question.domain}</span><button type="button" class="flag-btn ${flagged ? "on" : ""}" data-action="exam-flag">${flagged ? "🚩 Marcada" : "⚐ Marcar"}</button></div>
          <h1>${escapeHtml(question.prompt)}</h1>
          <div class="answers" role="group" aria-label="Opciones">
            ${order.map((origIdx, pos) => `<button type="button" class="answer ${chosen === origIdx ? "selected" : ""}" data-action="exam-answer" data-choice="${origIdx}"><b>${String.fromCharCode(65 + pos)}</b><span>${escapeHtml(question.options[origIdx])}</span></button>`).join("")}
          </div>
          <div class="exam-move">
            <button class="button secondary" type="button" data-action="exam-prev" ${idx === 0 ? "disabled" : ""}>← Anterior</button>
            <button class="button primary" type="button" data-action="exam-next" ${idx === a.ids.length - 1 ? "disabled" : ""}>Siguiente →</button>
          </div>
        </div>
        <aside class="exam-palette">
          <p>Navegación</p>
          <div class="palette-grid">
            ${a.ids.map((qid, i) => { let cls = "pal"; if (i === idx) cls += " current"; if (a.answers[qid] !== undefined) cls += " done"; if (a.flags[qid]) cls += " flag"; return `<button type="button" class="${cls}" data-action="exam-goto" data-idx="${i}">${i + 1}</button>`; }).join("")}
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
        ${weakDomains.length ? weakDomains.map(d => `<a class="button secondary" href="#/practicar/dom${d}">Reforzar D${d} →</a>`).join("") : `<a class="button secondary" href="#/practicar">Ir a practicar →</a>`}
      </section>
      <section class="review">
        <h2>Revisión de las ${a.ids.length} preguntas</h2>
        ${a.ids.map((id, i) => { const qn = byId(id); const your = a.answers[id]; const ok = your === qn.correct; return `<article class="review-item ${ok ? "ok" : "bad"}"><div class="review-head"><span>#${i + 1} · Dominio ${qn.domain}</span><span class="review-flag">${ok ? "✓ Correcta" : (your === undefined ? "— Sin responder" : "✗ Incorrecta")}</span></div><p class="review-q">${escapeHtml(qn.prompt)}</p><ul class="review-opts">${qn.options.map((opt, oi) => { let c = ""; if (oi === qn.correct) c = "right"; else if (oi === your) c = "yours"; return `<li class="${c}"><b>${String.fromCharCode(65 + oi)}</b>${escapeHtml(opt)}${oi === qn.correct ? " ✓" : (oi === your ? " ← tu respuesta" : "")}</li>`; }).join("")}</ul><p class="review-exp">${escapeHtml(qn.explanation)}</p></article>`; }).join("")}
      </section>`;
  }

  function render() {
    const route = location.hash || "#/inicio";
    linkActive(route);
    stopExamTimer();
    if (route.startsWith("#/practicar")) renderPractice(route);
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
    if (target.dataset.action === "next") { activeQuiz.index += 1; renderQuiz(); }
    if (target.dataset.action === "start-mixed") { startQuiz("mixed"); renderQuiz(); }
    if (target.dataset.action === "restart") { startQuiz(activeQuiz.focus); renderQuiz(); }
    if (target.dataset.action === "exam-start") startExam();
    if (target.dataset.action === "exam-answer") { const s = loadExam(); const a = s.active; if (a && !a.submittedAt) { a.answers[a.ids[a.index]] = Number(target.dataset.choice); saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-flag") { const s = loadExam(); const a = s.active; if (a) { const id = a.ids[a.index]; if (a.flags[id]) delete a.flags[id]; else a.flags[id] = true; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-prev") { const s = loadExam(); const a = s.active; if (a && a.index > 0) { a.index -= 1; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-next") { const s = loadExam(); const a = s.active; if (a && a.index < a.ids.length - 1) { a.index += 1; saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-goto") { const s = loadExam(); const a = s.active; if (a) { a.index = Number(target.dataset.idx); saveExam(s); renderExam(); } }
    if (target.dataset.action === "exam-submit") submitExam(false);
    if (target.dataset.action === "exam-new") { const s = loadExam(); s.active = null; saveExam(s); window.scrollTo(0, 0); renderExam(); }
  });

  document.getElementById("resetProgress").addEventListener("click", () => {
    if (confirm("¿Quieres borrar todas las respuestas, estadísticas y exámenes guardados en este navegador?")) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(examKey);
      activeQuiz = null;
      stopExamTimer();
      render();
    }
  });

  window.addEventListener("hashchange", render);
  render();
}());
