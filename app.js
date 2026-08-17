(function () {
  "use strict";

  const data = window.CLF_DATA;
  const app = document.getElementById("app");
  const storageKey = "clf-c02-study-hub-progress-v1";
  let activeQuiz = null;

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
      link.classList.toggle("active", route === href || (href === "#/practicar" && route.startsWith("#/practicar/")));
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
    if (selectedFocus && (selectedFocus === "mixed" || data.focusAreas.some(area => area.id === selectedFocus))) {
      if (!activeQuiz || activeQuiz.focus !== selectedFocus || activeQuiz.index >= activeQuiz.questions.length) startQuiz(selectedFocus);
      renderQuiz();
      return;
    }
    activeQuiz = null;
    app.innerHTML = `
      <section class="page-intro"><p class="kicker">PRÁCTICA ACTIVA</p><h1>Elige un frente.<br><em>Luego razona cada descarte.</em></h1><p>Las preguntas muestran la corrección al instante y explican por qué las otras opciones no encajan. Si fallas un área, vuelve a ella hasta alcanzar 8/10.</p></section>
      <section class="focus-grid full-grid">${data.focusAreas.map(focusCard).join("")}</section>
      <section class="mixed-card panel"><div><p class="kicker">MODO MIXTO</p><h2>Diagnóstico de 10 preguntas</h2><p>Mezcla los nueve frentes para detectar qué debes reforzar hoy.</p></div><button class="button primary" type="button" data-action="start-mixed">Iniciar diagnóstico →</button></section>`;
  }

  function startQuiz(focus) {
    const pool = focus === "mixed" ? data.questions : data.questions.filter(question => question.focus === focus);
    const progress = loadProgress();
    const lastSeen = {};
    progress.answers.forEach(answer => { lastSeen[answer.id] = answer.date; });
    const ranked = shuffle(pool).sort((a, b) => {
      const dateA = lastSeen[a.id] || "";
      const dateB = lastSeen[b.id] || "";
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
    const quantity = Math.min(10, pool.length);
    activeQuiz = { focus, questions: shuffle(ranked.slice(0, quantity)), index: 0, selections: [] };
  }

  function renderQuiz() {
    const quiz = activeQuiz;
    if (quiz.index >= quiz.questions.length) return renderResults();
    const question = quiz.questions[quiz.index];
    const answered = quiz.selections[quiz.index];
    const focus = data.focusAreas.find(area => area.id === quiz.focus);
    app.innerHTML = `
      <section class="quiz-top"><a href="#/practicar" class="back-link">← Cambiar práctica</a><div><p class="kicker">${quiz.focus === "mixed" ? "DIAGNÓSTICO MIXTO" : escapeHtml(focus.title.toUpperCase())}</p><span>Pregunta ${quiz.index + 1} de ${quiz.questions.length}</span></div><div class="progress-track" aria-label="Progreso"><i style="width:${((quiz.index + (answered ? 1 : 0)) / quiz.questions.length) * 100}%"></i></div></section>
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

  function render() {
    const route = location.hash || "#/inicio";
    linkActive(route);
    if (route.startsWith("#/practicar")) renderPractice(route);
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
  });

  document.getElementById("resetProgress").addEventListener("click", () => {
    if (confirm("¿Quieres borrar todas las respuestas y estadísticas guardadas en este navegador?")) {
      localStorage.removeItem(storageKey);
      activeQuiz = null;
      render();
    }
  });

  window.addEventListener("hashchange", render);
  render();
}());
