(() => {
  const state = {
    data: null, issues: [], warnings: [],
    filteredConcepts: [], flashcards: [], flashIndex: 0,
    activeChapter: "all", activeView: "concepts", activeExamTab: "mcq",
    query: "", category: "all", priority: "all"
  };

  const REQUIRED_SECTIONS = ["bigPicture","textbookPerspective","professorExpectation","studentExplanation","managerPov","consumerPov","indianContext","globalContext","frameworks","examples","caseConnections","quantitative","examToolkit","quickRevision","advancedInsight","connections"];

  const dom = {};
  function $(id) { return document.getElementById(id); }

  function initDom() {
    ["fatal","fatalMessage","appTitle","courseLabel","appSubtitle","sourcePolicy",
     "statConcepts","statSources","statFlashcards","searchInput","searchClear",
     "categoryFilter","priorityFilter","expandAll","collapseAll","revisionMode",
     "largeText","focusMode",
     "chapterNav","chapterHeader","resultLine","conceptCards",
     "flashcard","flashTerm","flashAnswer","flashCounter",
     "prevFlashcard","nextFlashcard","shuffleFlashcard","toggleFlashcard",
     "examTabBar","examBank","sourceMapTable","checklist","progress"
    ].forEach(id => { dom[id] = $(id); });
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }
  function escapeRx(v) { return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function highlight(v) {
    const s = escapeHtml(v);
    if (!state.query) return s;
    return s.replace(new RegExp("(" + escapeRx(state.query) + ")", "gi"), "<mark>$1</mark>");
  }
  function toArr(v) { return Array.isArray(v) ? v : []; }
  function ul(items) { const a = toArr(items).filter(Boolean); return a.length ? "<ul>" + a.map(i => "<li>" + highlight(i) + "</li>").join("") + "</ul>" : ""; }
  function ol(items) { const a = toArr(items).filter(Boolean); return a.length ? "<ol>" + a.map(i => "<li>" + highlight(i) + "</li>").join("") + "</ol>" : ""; }
  function pill(text, mod) { return '<span class="pill' + (mod ? " pill--" + mod : "") + '">' + escapeHtml(text) + "</span>"; }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────
  function validateData(data) {
    state.issues = []; state.warnings = [];
    function err(path, msg) { state.issues.push({path, msg}); }
    function warn(path, msg) { state.warnings.push({path, msg}); }
    if (!data || typeof data !== "object") { err("NOTES_DATA", "NOTES_DATA missing."); return; }
    ["sourceMap","syllabusChecklist","concepts"].forEach(k => { if (!Array.isArray(data[k])) err(k, k + " must be an array."); });
    const sourceIds = new Set(toArr(data.sourceMap).map(s => s.id).filter(Boolean));
    const conceptIds = new Set();
    toArr(data.sourceMap).forEach((s, i) => {
      if (!s.id) err("sourceMap[" + i + "].id", "Source needs an id.");
      if (!s.fileName) warn("sourceMap[" + i + "].fileName", "fileName missing.");
    });
    toArr(data.syllabusChecklist).forEach((item, i) => {
      if (!["covered","partial","missing","supplementary"].includes(item.status))
        warn("checklist[" + i + "].status", "Invalid status: " + item.status);
    });
    toArr(data.concepts).forEach((c, i) => {
      ["id","title","category","contentType","examPriority"].forEach(k => { if (!c[k]) err("concepts[" + i + "]." + k, k + " required."); });
      if (c.id && conceptIds.has(c.id)) err("concepts[" + i + "].id", "Duplicate: " + c.id);
      if (c.id) conceptIds.add(c.id);
      if (!c.conceptSnapshot) err("concepts[" + i + "].conceptSnapshot", "conceptSnapshot required.");
      if (!c.sections) err("concepts[" + i + "].sections", "sections required.");
      toArr(c.sourceIds).forEach(sid => { if (!sourceIds.has(sid)) warn("concepts[" + i + "].sourceIds", "Unknown: " + sid); });
      REQUIRED_SECTIONS.forEach(sec => { if (c.sections && c.sections[sec] === undefined) warn("concepts[" + i + "].sections." + sec, "Section missing."); });
    });
  }

  // ─── VIEW SWITCHING ──────────────────────────────────────────────────────────
  function showView(viewId) {
    state.activeView = viewId;
    document.querySelectorAll(".view").forEach(v => { v.classList.remove("active"); v.classList.add("hidden"); });
    const el = $("view-" + viewId);
    if (el) { el.classList.remove("hidden"); el.classList.add("active"); }
    document.querySelectorAll(".tool-item").forEach(btn => btn.classList.toggle("active", btn.dataset.section === viewId));
    if (viewId === "exam-bank") renderExamBank();
  }

  // ─── CHAPTER NAV ────────────────────────────────────────────────────────────
  function renderChapterNav() {
    const chapters = toArr(state.data.chapters);
    let html = '<button class="chapter-item active" data-chapter="all"><span class="chapter-dot" style="background:#888"></span>All Modules</button>';
    chapters.forEach(ch => {
      html += '<button class="chapter-item" data-chapter="' + escapeHtml(ch.category) + '" title="' + escapeHtml(ch.description || "") + '">'
        + '<span class="chapter-dot" style="background:' + escapeHtml(ch.color || "#888") + '"></span>'
        + escapeHtml(ch.label) + '</button>';
    });
    dom.chapterNav.innerHTML = html;
    dom.chapterNav.querySelectorAll(".chapter-item").forEach(btn => {
      btn.addEventListener("click", () => selectChapter(btn.dataset.chapter));
    });
  }

  function selectChapter(cat) {
    state.activeChapter = cat;
    dom.chapterNav.querySelectorAll(".chapter-item").forEach(btn => btn.classList.toggle("active", btn.dataset.chapter === cat));
    if (cat === "all") {
      dom.chapterHeader.hidden = true;
    } else {
      const ch = toArr(state.data.chapters).find(c => c.category === cat);
      if (ch) {
        dom.chapterHeader.hidden = false;
        dom.chapterHeader.style.background = ch.color || "var(--navy)";
        dom.chapterHeader.innerHTML = "<h2>" + escapeHtml(ch.label) + "</h2><p>" + escapeHtml(ch.description || "") + "</p>";
      }
    }
    applyFilters();
    showView("concepts");
  }

  // ─── FILTERS ────────────────────────────────────────────────────────────────
  function applyFilters() {
    state.query = dom.searchInput.value.trim();
    state.category = dom.categoryFilter.value;
    state.priority = dom.priorityFilter.value;
    const q = state.query.toLowerCase();
    state.filteredConcepts = toArr(state.data.concepts).filter(c => {
      const chMatch = state.activeChapter === "all" || c.category === state.activeChapter;
      const catMatch = state.category === "all" || c.category === state.category;
      const priMatch = state.priority === "all" || c.examPriority === state.priority;
      const qMatch = !q || JSON.stringify(c).toLowerCase().includes(q);
      return chMatch && catMatch && priMatch && qMatch;
    });
    renderConceptCards();
    const total = toArr(state.data.concepts).length;
    dom.resultLine.textContent = "Showing " + state.filteredConcepts.length + " of " + total + " concepts" + (state.query ? ' for "' + state.query + '"' : "") + ".";
  }

  function renderCategoryFilter() {
    const cats = [...new Set(toArr(state.data.concepts).map(c => c.category).filter(Boolean))].sort();
    dom.categoryFilter.innerHTML = '<option value="all">All categories</option>' + cats.map(c => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + "</option>").join("");
  }

  // ─── CONCEPT CARD RENDERERS ──────────────────────────────────────────────────
  function snapshotHtml(snap) {
    if (!snap) return "";
    const rows = [["One-line meaning", snap.oneLine],["Formal definition", snap.definition],["Why it matters", snap.whyItMatters],["Where it fits", snap.fitsIn],["Exam importance", snap.examImportance],["Related", toArr(snap.related).join(", ")]].filter(([,v]) => v);
    return '<div class="noteBlock noteBlock--wide"><h4>Concept Snapshot</h4><table style="min-width:0;width:100%"><tbody>' + rows.map(([l,v]) => '<tr><th style="width:150px;background:#f0f4f8;font-size:.74rem;font-weight:700">' + escapeHtml(l) + "</th><td>" + highlight(v) + "</td></tr>").join("") + "</tbody></table></div>";
  }

  function textbookHtml(val) {
    if (!val || (!val.label && !toArr(val.points).length)) return "";
    return '<div class="noteBlock"><h4>Textbook / Kotler POV</h4>' + (val.label ? "<p><strong>" + highlight(val.label) + "</strong></p>" : "") + ul(val.points) + "</div>";
  }

  function diagramHtml(fw) {
    if (fw.diagramHtml) return '<div class="diagram-block">' + fw.diagramHtml + "</div>";
    if (fw.diagram) return "<p><strong>Diagram:</strong> " + highlight(fw.diagram) + "</p>";
    return "";
  }

  function frameworksHtml(items) {
    const list = toArr(items);
    if (!list.length) return "";
    return '<div class="noteBlock noteBlock--wide"><h4>Frameworks &amp; Models</h4>' + list.map(fw =>
      '<div class="examTip" style="margin-bottom:10px"><strong>' + highlight(fw.name || "Framework") + "</strong>"
      + diagramHtml(fw)
      + (fw.examUse ? "<p><strong>How to use in exam:</strong> " + highlight(fw.examUse) + "</p>" : "")
      + (fw.parts ? "<p><strong>Parts:</strong> " + highlight(toArr(fw.parts).join(" → ")) + "</p>" : "")
      + (fw.example ? "<p><strong>Example:</strong> " + highlight(fw.example) + "</p>" : "")
      + (fw.limitations ? "<p><strong>Limitations:</strong> " + highlight(fw.limitations) + "</p>" : "")
      + "</div>"
    ).join("") + "</div>";
  }

  function examplesHtml(items) {
    const list = toArr(items);
    if (!list.length) return "";
    return '<div class="noteBlock noteBlock--wide"><h4>Examples</h4><table style="min-width:0;width:100%"><thead><tr><th>Type</th><th>Example</th><th>Explanation</th><th>Lesson</th></tr></thead><tbody>'
      + list.map(e => "<tr><td>" + highlight(e.type || "") + "</td><td><strong>" + highlight(e.title || "") + "</strong></td><td>" + highlight(e.explanation || "") + "</td><td>" + highlight(e.lesson || "") + "</td></tr>").join("")
      + "</tbody></table></div>";
  }

  function casesHtml(items) {
    const list = toArr(items);
    if (!list.length) return "";
    return '<div class="noteBlock noteBlock--wide"><h4>Case Connections</h4>' + list.map(c =>
      '<div class="caseLink"><strong>' + highlight(c.caseName || "Case") + "</strong>"
      + (c.context ? "<p><strong>Background:</strong> " + highlight(c.context) + "</p>" : "")
      + "<p><strong>Key issue:</strong> " + highlight(c.keyIssue || "") + "</p>"
      + "<p><strong>Concept link:</strong> " + highlight(c.conceptLink || "") + "</p>"
      + "<p><strong>Consumer angle:</strong> " + highlight(c.consumerAngle || "") + "</p>"
      + "<p><strong>Recommendation:</strong> " + highlight(c.recommendation || "") + "</p>"
      + "<p><strong>Risk:</strong> " + highlight(c.risk || "") + "</p></div>"
    ).join("") + "</div>";
  }

  function quantHtml(val) {
    if (!val || !toArr(val.items).length) return "";
    return '<div class="noteBlock"><h4>Quantitative Angle</h4>' + (val.statement ? "<p>" + highlight(val.statement) + "</p>" : "") + ul(val.items) + "</div>";
  }

  function examToolkitHtml(val) {
    if (!val) return "";
    return '<div class="noteBlock noteBlock--wide examToolkit-block"><h4>Exam Answer Toolkit</h4>'
      + (val.definition ? '<div class="examTip"><strong>Definition to write</strong><p>' + highlight(val.definition) + "</p></div>" : "")
      + (val.keywords ? "<p><strong>Keywords:</strong> " + highlight(toArr(val.keywords).join(", ")) + "</p>" : "")
      + (val.openingLine ? "<p><strong>Opening line:</strong> <em>" + highlight(val.openingLine) + "</em></p>" : "")
      + (val.conclusionLine ? "<p><strong>Conclusion:</strong> <em>" + highlight(val.conclusionLine) + "</em></p>" : "")
      + (toArr(val.shortQuestions).length ? "<h4>Short-answer questions</h4>" + ol(val.shortQuestions) : "")
      + (toArr(val.longQuestions).length ? "<h4>Long-answer questions</h4>" + ol(val.longQuestions) : "")
      + (toArr(val.caseQuestions).length ? "<h4>Case-based questions</h4>" + ol(val.caseQuestions) : "")
      + (toArr(val.commonMistakes).length ? '<div class="commonMistake"><strong>Common mistakes</strong>' + ul(val.commonMistakes) + "</div>" : "")
      + (val.iimLevel ? "<p><strong>IIM-level tip:</strong> " + highlight(val.iimLevel) + "</p>" : "")
      + "</div>";
  }

  function quickRevisionHtml(val) {
    if (!val) return "";
    return '<div class="noteBlock noteBlock--wide quickRevision"><h4>Quick Revision</h4><div class="quickRevision-body">'
      + (val.summary ? "<strong>5-line summary</strong>" + ul(val.summary) : "")
      + (val.keywords ? "<p><strong>Keywords:</strong> " + highlight(toArr(val.keywords).join(", ")) + "</p>" : "")
      + (val.examples ? "<p><strong>Examples:</strong> " + highlight(toArr(val.examples).join(", ")) + "</p>" : "")
      + (val.diagram ? "<p><strong>Diagram:</strong> " + highlight(val.diagram) + "</p>" : "")
      + (val.likelyQuestion ? "<p><strong>Likely question:</strong> " + highlight(val.likelyQuestion) + "</p>" : "")
      + (val.commonTrap ? "<p><strong>Common trap:</strong> " + highlight(val.commonTrap) + "</p>" : "")
      + "</div></div>";
  }

  function renderConceptCards() {
    if (!state.filteredConcepts.length) { dom.conceptCards.innerHTML = '<p class="muted" style="padding:20px">No matching concepts found.</p>'; return; }
    dom.conceptCards.innerHTML = state.filteredConcepts.map(c => {
      const s = c.sections || {};
      return '<details class="conceptCard" id="' + escapeHtml(c.id) + '">'
        + '<summary class="conceptCard__summary">'
        + '<div class="cardMeta">' + pill(c.contentType || "core", c.contentType || "core") + " " + pill(c.examPriority || "?", "exam") + " " + pill(c.category || "?", "default") + "</div>"
        + '<div class="card-title">' + highlight(c.title || "Untitled") + "</div>"
        + '<div class="card-oneliner">' + highlight((c.conceptSnapshot && (c.conceptSnapshot.oneLine || c.conceptSnapshot.definition)) || "") + "</div>"
        + "</summary>"
        + '<div class="conceptBody"><div class="blockGrid">'
        + snapshotHtml(c.conceptSnapshot)
        + '<div class="noteBlock noteBlock--wide"><h4>Big Picture</h4>' + ul(s.bigPicture) + "</div>"
        + textbookHtml(s.textbookPerspective)
        + '<div class="noteBlock"><h4>Professor / Examiner Expectation</h4>' + ul(s.professorExpectation) + "</div>"
        + '<div class="noteBlock"><h4>Student-Friendly Explanation</h4>' + ul(s.studentExplanation) + "</div>"
        + '<div class="noteBlock managerPov"><h4>Marketer / Manager POV</h4>' + ul(s.managerPov) + "</div>"
        + '<div class="noteBlock consumerPov"><h4>Consumer POV</h4>' + ul(s.consumerPov) + "</div>"
        + '<div class="noteBlock"><h4>Indian Market Context</h4>' + ul(s.indianContext) + "</div>"
        + '<div class="noteBlock"><h4>Global Context</h4>' + ul(s.globalContext) + "</div>"
        + frameworksHtml(s.frameworks)
        + examplesHtml(s.examples)
        + casesHtml(s.caseConnections)
        + quantHtml(s.quantitative)
        + examToolkitHtml(s.examToolkit)
        + quickRevisionHtml(s.quickRevision)
        + (s.advancedInsight ? '<div class="noteBlock noteBlock--wide advancedInsight"><h4>Advanced Insight</h4><p>' + highlight(s.advancedInsight) + "</p></div>" : "")
        + (toArr(s.connections).length ? '<div class="noteBlock noteBlock--wide"><h4>Connections to Other Concepts</h4>' + ul(s.connections) + "</div>" : "")
        + "</div></div></details>";
    }).join("");
  }

  // ─── FLASHCARDS ──────────────────────────────────────────────────────────────
  function buildFlashcards() {
    state.flashcards = [];
    toArr(state.data.concepts).forEach(c => {
      const s = c.sections || {}; const snap = c.conceptSnapshot || {};
      if (snap.definition) state.flashcards.push({term: c.title, answer: snap.definition, tag: "Definition"});
      if (snap.whyItMatters) state.flashcards.push({term: "Why does " + c.title + " matter?", answer: snap.whyItMatters, tag: "Significance"});
      if (s.quickRevision && s.quickRevision.commonTrap) state.flashcards.push({term: "Common trap: " + c.title, answer: s.quickRevision.commonTrap, tag: "Trap"});
      if (s.quickRevision && s.quickRevision.likelyQuestion) state.flashcards.push({term: "Likely exam Q", answer: s.quickRevision.likelyQuestion, tag: c.title});
      if (s.examToolkit && s.examToolkit.iimLevel) state.flashcards.push({term: "IIM-level tip: " + c.title, answer: s.examToolkit.iimLevel, tag: "Exam Tip"});
      if (s.examToolkit && s.examToolkit.openingLine) state.flashcards.push({term: "Opening line for: " + c.title, answer: s.examToolkit.openingLine, tag: "Writing"});
      toArr(s.frameworks).slice(0,2).forEach(fw => {
        if (fw.name && fw.parts) state.flashcards.push({term: "Framework: " + fw.name, answer: toArr(fw.parts).join(" → "), tag: "Framework"});
      });
      if (s.advancedInsight) state.flashcards.push({term: "Advanced: " + c.title, answer: String(s.advancedInsight).slice(0,220), tag: "Insight"});
    });
  }

  function renderFlashcard() {
    if (!state.flashcards.length) {
      dom.flashTerm.textContent = "No flashcards yet"; dom.flashAnswer.textContent = "Add concept data."; dom.flashCounter.textContent = "0 / 0"; return;
    }
    const card = state.flashcards[state.flashIndex];
    dom.flashcard.classList.remove("showAnswer");
    dom.flashTerm.textContent = card.term;
    dom.flashAnswer.textContent = card.answer;
    dom.flashCounter.textContent = (state.flashIndex + 1) + " / " + state.flashcards.length + (card.tag ? " · " + card.tag : "");
    dom.statFlashcards.textContent = state.flashcards.length;
  }

  // ─── EXAM BANK ───────────────────────────────────────────────────────────────
  function renderExamBank() {
    const tab = state.activeExamTab;
    dom.examTabBar.querySelectorAll(".exam-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
    if (tab === "mcq") renderMcqs();
    else if (tab === "short") renderQList("shortQuestions", "Short Answer", "2–3 sentences. Open with a crisp definition using precise keywords. Give one concrete real-world example. Close with a one-sentence managerial or consumer implication.");
    else if (tab === "long") renderQList("longQuestions", "Long Answer", "8–12 marks. Structure: (1) Define using keywords, (2) Classify or explain dimensions with a sub-heading each, (3) Apply one framework with a diagram name, (4) Give a real case example with a specific data point, (5) Conclude with a managerial implication or strategic trade-off.");
    else if (tab === "verylong") renderQList("veryLongQuestions", "Very Long / Essay", "20 marks. Full structured essay: (1) Opening paragraph — define and situate the concept, (2) Elaborate 3–4 dimensions or stages with headings, (3) Draw and explain a diagram, (4) Apply to two case examples with data, (5) Connect to related concepts (pricing, segmentation, IMC), (6) Consumer and managerial perspective, (7) Indian and global contrast, (8) Concluding strategic insight.");
    else if (tab === "case") renderQList("caseQuestions", "Case-Based", "Identify the marketing concept at play from the case facts. Apply the concept directly using case data, not generic theory. Recommend a specific action with a rationale. Anticipate one risk or trade-off. Conclude with how a competitor might respond.");
  }

  function renderQList(key, label, guide) {
    const questions = [];
    toArr(state.data.concepts).forEach(c => {
      toArr((c.sections && c.sections.examToolkit && c.sections.examToolkit[key]) || []).forEach(q => questions.push({q, concept: c.title}));
    });
    if (!questions.length) { dom.examBank.innerHTML = '<p class="muted">No ' + label.toLowerCase() + ' questions yet. Add to examToolkit.' + key + ' in notes-data.js.</p>'; return; }
    dom.examBank.innerHTML = questions.map((item, i) =>
      '<div class="q-card">'
      + '<div class="q-card__meta">' + escapeHtml(label) + " &middot; " + escapeHtml(item.concept) + "</div>"
      + '<div class="q-card__question">Q' + (i + 1) + ". " + highlight(item.q) + "</div>"
      + '<div class="answer-guide"><strong>Answer guide:</strong><p>' + escapeHtml(guide) + "</p></div>"
      + "</div>"
    ).join("");
  }

  function renderMcqs() {
    const allMcqs = [];
    toArr(state.data.concepts).forEach(c => {
      toArr((c.sections && c.sections.examToolkit && c.sections.examToolkit.mcqs) || []).forEach(mcq => allMcqs.push({...mcq, concept: c.title}));
    });
    if (!allMcqs.length) { dom.examBank.innerHTML = '<p class="muted">No MCQs yet. Add examToolkit.mcqs to concepts in notes-data.js.</p>'; return; }
    dom.examBank.innerHTML = allMcqs.map((mcq, i) => {
      const qid = "mcq_" + i;
      return '<div class="q-card" id="' + qid + '">'
        + '<div class="q-card__meta">MCQ &middot; ' + escapeHtml(mcq.concept) + "</div>"
        + '<div class="q-card__question">Q' + (i + 1) + ". " + highlight(mcq.q) + "</div>"
        + '<div class="mcq-options">'
        + toArr(mcq.options).map((opt, oi) =>
          '<label class="mcq-opt" id="' + qid + "_opt" + oi + '">'
          + '<input type="radio" name="' + qid + '" value="' + oi + '" />'
          + "<span>" + highlight(opt) + "</span></label>"
        ).join("")
        + "</div>"
        + '<button class="mcq-check" onclick="window._mcqCheck(\'' + qid + "'," + mcq.correct + ",'" + escapeHtml(String(mcq.explanation || "")).replace(/'/g, "\\'") + "')\">" + "Check answer</button>"
        + '<div class="mcq-feedback" id="' + qid + '_fb" style="display:none"></div>'
        + "</div>";
    }).join("");
  }

  window._mcqCheck = function(qid, correct, explanation) {
    const card = $(qid); if (!card) return;
    const sel = card.querySelector('input[name="' + qid + '"]:checked');
    if (!sel) { alert("Select an answer first."); return; }
    const selIdx = parseInt(sel.value, 10);
    card.querySelectorAll(".mcq-opt").forEach((opt, i) => {
      opt.classList.add("revealed");
      if (i === correct) opt.classList.add("correct-ans");
      else if (i === selIdx && selIdx !== correct) opt.classList.add("wrong-ans");
    });
    const checkBtn = card.querySelector(".mcq-check"); if (checkBtn) checkBtn.style.display = "none";
    const fb = $(qid + "_fb");
    if (fb) { fb.style.display = "block"; fb.innerHTML = "<strong>" + (selIdx === correct ? "Correct!" : "Incorrect.") + "</strong> " + escapeHtml(explanation); }
  };

  // ─── SOURCE MAP & CHECKLIST ──────────────────────────────────────────────────
  function renderSourceMap() {
    const rows = toArr(state.data.sourceMap).map(s =>
      "<tr><td><strong>" + highlight(s.fileName || s.id) + "</strong></td><td>" + highlight(s.type || "") + "</td>"
      + "<td><ul style='margin:0;padding-left:16px;font-size:.8rem'>" + toArr(s.topicsCovered).map(t => "<li>" + highlight(t) + "</li>").join("") + "</ul></td>"
      + "<td>" + highlight(s.relevance || "") + "</td><td>" + highlight(s.casesIncluded || "") + "</td><td>" + highlight(s.examHints || "") + "</td></tr>"
    ).join("");
    dom.sourceMapTable.innerHTML = "<table><thead><tr><th>File</th><th>Type</th><th>Topics</th><th>Relevance</th><th>Cases</th><th>Exam hints</th></tr></thead><tbody>" + rows + "</tbody></table>";
  }

  function renderChecklist() {
    dom.checklist.innerHTML = toArr(state.data.syllabusChecklist).map(item =>
      '<div class="checkItem"><strong>' + highlight(item.item || "") + "</strong>"
      + '<span class="status status--' + escapeHtml(item.status || "missing") + '">' + escapeHtml(item.status || "missing") + "</span>"
      + '<p class="muted" style="margin-top:5px;font-size:.8rem">' + highlight(item.note || "") + "</p></div>"
    ).join("") || '<p class="muted">No checklist items.</p>';
  }


  // ─── HEADER ──────────────────────────────────────────────────────────────────
  function renderHeader() {
    const meta = state.data.meta || {};
    if (meta.title) dom.appTitle.textContent = meta.title;
    if (meta.courseLabel) dom.courseLabel.textContent = meta.courseLabel;
    if (meta.subtitle && dom.appSubtitle) dom.appSubtitle.textContent = meta.subtitle;
    if (meta.sourcePolicy && dom.sourcePolicy) dom.sourcePolicy.textContent = meta.sourcePolicy;
    dom.statConcepts.textContent = toArr(state.data.concepts).length;
    dom.statSources.textContent = toArr(state.data.sourceMap).length;
  }

  // ─── RENDER ALL ──────────────────────────────────────────────────────────────
  function renderAll() {
    renderHeader();
    renderChapterNav();
    renderCategoryFilter();
    buildFlashcards();
    renderFlashcard();
    state.filteredConcepts = toArr(state.data.concepts);
    renderConceptCards();
    dom.resultLine.textContent = "Showing " + state.filteredConcepts.length + " of " + state.filteredConcepts.length + " concepts.";
    renderSourceMap();
    renderChecklist();
    renderMcqs();
    showView("concepts");
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────────────────────
  function bindEvents() {
    // ── Search (Google-style: real-time, clear button, auto-expand hits) ──
    dom.searchInput.addEventListener("input", () => {
      const q = dom.searchInput.value;
      dom.searchClear.hidden = !q;
      applyFilters();
      showView("concepts");
      if (q.trim()) {
        // Auto-open every matching card so the highlighted text is visible
        document.querySelectorAll(".conceptCard").forEach(c => { c.open = true; });
      }
    });
    dom.searchInput.addEventListener("keydown", e => {
      if (e.key === "Escape") { dom.searchInput.value = ""; dom.searchClear.hidden = true; applyFilters(); showView("concepts"); }
    });
    dom.searchClear.addEventListener("click", () => {
      dom.searchInput.value = ""; dom.searchClear.hidden = true;
      applyFilters(); showView("concepts"); dom.searchInput.focus();
    });

    dom.categoryFilter.addEventListener("change", applyFilters);
    dom.priorityFilter.addEventListener("change", applyFilters);
    dom.expandAll.addEventListener("click", () => document.querySelectorAll(".conceptCard").forEach(c => { c.open = true; }));
    dom.collapseAll.addEventListener("click", () => document.querySelectorAll(".conceptCard").forEach(c => { c.open = false; }));

    // ── Revision mode: collapse to only Quick Revision + Exam Toolkit, expand all ──
    dom.revisionMode.addEventListener("click", () => {
      const on = document.body.classList.toggle("revisionMode");
      dom.revisionMode.classList.toggle("isActive", on);
      dom.revisionMode.textContent = on ? "Exit revision" : "Revision mode";
      document.querySelectorAll(".conceptCard").forEach(c => { c.open = on; });
    });

    dom.largeText.addEventListener("click", () => { document.body.classList.toggle("largeText"); dom.largeText.classList.toggle("isActive"); });
    dom.focusMode.addEventListener("click", () => { document.body.classList.toggle("focusMode"); dom.focusMode.classList.toggle("isActive"); });
    dom.prevFlashcard.addEventListener("click", () => { state.flashIndex = (state.flashIndex - 1 + state.flashcards.length) % state.flashcards.length; renderFlashcard(); });
    dom.nextFlashcard.addEventListener("click", () => { state.flashIndex = (state.flashIndex + 1) % state.flashcards.length; renderFlashcard(); });
    dom.shuffleFlashcard.addEventListener("click", () => { state.flashIndex = Math.floor(Math.random() * Math.max(state.flashcards.length, 1)); renderFlashcard(); });
    dom.toggleFlashcard.addEventListener("click", () => dom.flashcard.classList.toggle("showAnswer"));
    dom.flashcard.addEventListener("click", () => dom.flashcard.classList.toggle("showAnswer"));
    dom.flashcard.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dom.flashcard.classList.toggle("showAnswer"); } });
    document.querySelectorAll(".tool-item").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.section)));
    dom.examTabBar.querySelectorAll(".exam-tab").forEach(btn => btn.addEventListener("click", () => { state.activeExamTab = btn.dataset.tab; renderExamBank(); }));
    window.addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      dom.progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }, {passive: true});
  }

  function fail(err) {
    console.error(err);
    if (dom.fatal) { dom.fatal.hidden = false; dom.fatalMessage.textContent = err.message || String(err); }
  }
  window.addEventListener("error", e => fail(e.error || new Error(e.message)));

  document.addEventListener("DOMContentLoaded", () => {
    try {
      initDom();
      state.data = window.NOTES_DATA;
      validateData(state.data);
      if (!state.data) throw new Error("NOTES_DATA missing. Check notes-data.js loads before app.js.");
      renderAll();
      bindEvents();
      console.info("Module 3 notes loaded", {errors: state.issues.length, warnings: state.warnings.length});
    } catch (err) { fail(err); }
  });
})();
