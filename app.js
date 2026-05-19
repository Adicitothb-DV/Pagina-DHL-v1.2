/* ===================================================
   VerbMaster — app.js
   Complete game logic, Web Speech API, DOM updates
   =================================================== */

// ───── Verb Database (150 verbs) ─────
const VERBS = [
    ["answer","contestar"],["apply","solicitar"],["argue","discutir"],["arrest","arrestar"],
    ["apologize","disculparse"],["arrive","llegar"],["attack","atacar"],["ask","preguntar"],
    ["bath","bañar"],["brush","cepillar"],["chat","chatear"],["call","llamar"],
    ["celebrate","celebrar"],["clean","limpiar"],["complain","quejarse"],["cry","llorar"],
    ["cheat","engañar"],["close","cerrar"],["comb","peinar"],["carry","cargar"],
    ["cook","cocinar"],["copy","copiar"],["climb","escalar"],["complete","completar"],
    ["correct","corregir"],["decide","decidir"],["deliver","entregar"],["delete","eliminar"],
    ["die","morir"],["discover","descubrir"],["dance","bailar"],["erase","borrar"],
    ["encourage","animar"],["enjoy","disfrutar"],["explain","explicar"],["fail","reprobar"],
    ["finish","terminar"],["foster","fomentar"],["hate","odiar"],["hope","esperar"],
    ["heat","calentar"],["help","ayudar"],["imagine","imaginar"],["increase","aumentar"],
    ["introduce","presentar"],["identify","identificar"],["inform","informar"],
    ["invite","invitar"],["jump","saltar"],["kill","matar"],["laugh","reír"],
    ["like","gustar"],["listen","escuchar"],["lie","mentir"],["live","vivir"],
    ["love","amar"],["look","mirar"],["miss","extrañar"],["move","mudarse"],
    ["mop","trapear"],["need","necesitar"],["open","abrir"],["paint","pintar"],
    ["pray","orar"],["prefer","preferir"],["protect","proteger"],
    ["participate","participar"],["plan","planear"],["play","jugar"],
    ["practice","practicar"],["push","presionar"],["promise","prometer"],
    ["punish","castigar"],["rent","rentar"],["rain","llover"],
    ["recommend","recomendar"],["remember","recordar"],["rob","robar"],
    ["repeat","repetir"],["rest","descansar"],["save","ahorrar"],["smile","sonreír"],
    ["smoke","fumar"],["snow","nevar"],["stay","quedarse"],["survive","sobrevivir"],
    ["start","empezar"],["stop","parar"],["study","estudiar"],["support","apoyar"],
    ["talk","hablar"],["text","mensajear"],["train","entrenar"],["travel","viajar"],
    ["visit","visitar"],["wait","esperar"],["want","querer"],["work","trabajar"],
    ["watch","ver"],["wash","lavar"],["be","ser/estar"],["bite","morder"],
    ["break","romper"],["build","construir"],["buy","comprar"],["bring","traer"],
    ["catch","atrapar"],["cut","cortar"],["do","hacer"],["drink","beber"],
    ["drive","manejar"],["eat","comer"],["feed","alimentar"],["feel","sentir"],
    ["fight","pelear"],["find","encontrar"],["fly","volar"],["forget","olvidar"],
    ["forgive","perdonar"],["get","conseguir"],["get up","despertar"],["give","dar"],
    ["have","tener"],["keep","mantener"],["know","saber"],["leave","partir"],
    ["let","permitir"],["make","hacer"],["meet","conocer"],["pay","pagar"],
    ["swim","nadar"],["read","leer"],["run","correr"],["see","ver"],["sell","vender"],
    ["send","enviar"],["shoot","disparar"],["sleep","dormir"],["speak","hablar"],
    ["spend","gastar"],["steal","robar"],["sing","cantar"],["swear","jurar"],
    ["take","tomar"],["teach","enseñar"],["tell","decir"],["think","pensar"],
    ["wake up","despertar"],["write","escribir"],["win","ganar"]
];

// ───── Game State ─────
const STATE = {
    lives: 30,
    score: 0,
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    timer: null,
    timeLeft: 8,
    history: [],
    verbOrder: [],
    isListening: false,
    micAvailable: false,
    useKeyboard: false,
    feedbackTimeout: null,
    gameActive: false,
    waitingForAnswer: false
};

const TIMER_DURATION = 8;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 45; // ~283

// ───── DOM References ─────
const $ = (id) => document.getElementById(id);
const screens = {
    welcome: $('screen-welcome'),
    game: $('screen-game'),
    results: $('screen-results')
};

const dom = {
    btnStart: $('btn-start'),
    progressFill: $('progress-fill'),
    progressText: $('progress-text'),
    livesDisplay: $('lives-display'),
    livesCount: $('lives-count'),
    scoreCount: $('score-count'),
    timerRing: $('timer-ring'),
    timerText: $('timer-text'),
    verbDisplay: $('verb-display'),
    btnHear: $('btn-hear'),
    micStatus: $('mic-status'),
    userAnswer: $('user-answer'),
    feedbackOverlay: $('feedback-overlay'),
    feedbackIcon: $('feedback-icon'),
    feedbackText: $('feedback-text'),
    feedbackCorrect: $('feedback-correct'),
    btnSkip: $('btn-skip'),
    btnMicToggle: $('btn-mic-toggle'),
    btnTypeToggle: $('btn-type-toggle'),
    keyboardInput: $('keyboard-input'),
    textAnswer: $('text-answer'),
    btnSubmitText: $('btn-submit-text'),
    historyList: $('history-list'),
    statCorrect: $('stat-correct'),
    statWrong: $('stat-wrong'),
    resultCorrect: $('result-correct'),
    resultWrong: $('result-wrong'),
    resultAccuracy: $('result-accuracy'),
    resultLives: $('result-lives'),
    resultsBadge: $('results-badge'),
    resultsTitle: $('results-title'),
    resultsSubtitle: $('results-subtitle'),
    levelBadge: $('level-badge'),
    levelIcon: $('level-icon'),
    levelName: $('level-name'),
    levelDescription: $('level-description'),
    resultsLevelCard: $('results-level-card'),
    btnRestart: $('btn-restart'),
    btnReview: $('btn-review'),
    reviewPanel: $('review-panel'),
    reviewList: $('review-list'),
    modalMic: $('modal-mic'),
    btnModalClose: $('btn-modal-close'),
    toast: $('toast'),
    toastIcon: $('toast-icon'),
    toastMessage: $('toast-message')
};

// ───── Speech API Setup ─────
let synth = window.speechSynthesis;
let SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function initSpeechRecognition() {
    if (!SpeechRecognitionAPI) {
        STATE.micAvailable = false;
        return;
    }
    try {
        recognition = new SpeechRecognitionAPI();
        recognition.lang = 'es-MX';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;

        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        recognition.onend = () => {
            STATE.isListening = false;
            dom.btnMicToggle.classList.remove('active');
            dom.micStatus.classList.remove('listening');
        };
        STATE.micAvailable = true;
    } catch (e) {
        STATE.micAvailable = false;
    }
}

// ───── Utility: normalize strings ─────
function normalize(str) {
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // remove accents
        .replace(/[^a-z0-9\s\/]/g, '')     // keep letters, numbers, spaces, slash
        .replace(/\s+/g, ' ');
}

function checkAnswer(userInput, expected) {
    const normInput = normalize(userInput);
    // expected may contain "/" for alternatives like "ser/estar"
    const alternatives = expected.split('/').map(a => normalize(a.trim()));
    // Also check the full normalized expected
    const fullNorm = normalize(expected);

    if (normInput === fullNorm) return true;
    for (const alt of alternatives) {
        if (normInput === alt) return true;
        // Partial match: if user says one of the alternatives
        if (alt.length > 2 && normInput.includes(alt)) return true;
        if (normInput.length > 2 && alt.includes(normInput)) return true;
    }
    return false;
}

// ───── Text-to-Speech ─────
let cachedEnglishVoice = null;

function loadEnglishVoice() {
    const voices = synth.getVoices();
    if (!voices.length) return;

    // Priority list: prefer high-quality English voices on Windows
    const preferred = [
        'Microsoft Zira',
        'Microsoft David',
        'Microsoft Mark',
        'Google US English',
        'Google UK English Female',
        'Google UK English Male',
        'Samantha',
        'Alex',
        'Daniel'
    ];

    // 1) Try to find a preferred voice
    for (const name of preferred) {
        const match = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
        if (match) { cachedEnglishVoice = match; return; }
    }

    // 2) Prefer any en-US voice
    const enUS = voices.find(v => v.lang === 'en-US');
    if (enUS) { cachedEnglishVoice = enUS; return; }

    // 3) Prefer any en-GB voice
    const enGB = voices.find(v => v.lang === 'en-GB');
    if (enGB) { cachedEnglishVoice = enGB; return; }

    // 4) Any English voice
    const anyEn = voices.find(v => v.lang.startsWith('en'));
    if (anyEn) { cachedEnglishVoice = anyEn; return; }
}

function speakVerb(verb) {
    if (!synth) return;
    synth.cancel();

    // Ensure voice is loaded
    if (!cachedEnglishVoice) loadEnglishVoice();

    const utter = new SpeechSynthesisUtterance(verb);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    utter.pitch = 1.05;

    if (cachedEnglishVoice) {
        utter.voice = cachedEnglishVoice;
        utter.lang = cachedEnglishVoice.lang;
    }

    synth.speak(utter);
}

// Ensure voices are loaded before game starts
if (synth) {
    synth.getVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {
            loadEnglishVoice();
        };
    }
    // Also try immediately in case voices are already available
    setTimeout(() => loadEnglishVoice(), 100);
}

// ───── Speech Recognition Handlers ─────
function handleSpeechResult(event) {
    if (!STATE.gameActive || !STATE.waitingForAnswer) return;
    // Get the latest result
    const resultIndex = event.results.length - 1;
    const results = event.results[resultIndex];
    if (!results.isFinal) return;

    let bestMatch = '';
    const currentVerb = VERBS[STATE.verbOrder[STATE.currentIndex]];
    const expected = currentVerb[1];

    // Check all alternatives from speech recognition
    for (let i = 0; i < results.length; i++) {
        const transcript = results[i].transcript;
        if (checkAnswer(transcript, expected)) {
            bestMatch = transcript;
            break;
        }
        if (!bestMatch) bestMatch = transcript;
    }

    STATE.waitingForAnswer = false;
    processAnswer(bestMatch, expected);
}

function handleSpeechError(event) {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    if (event.error === 'not-allowed') {
        STATE.micAvailable = false;
        STATE.useKeyboard = true;
        dom.keyboardInput.classList.remove('hidden');
        dom.btnMicToggle.classList.add('hidden');
        showToast('Micrófono no disponible. Usa el teclado.', 'warning');
    }
}

function startListening() {
    if (!recognition || !STATE.micAvailable) return;
    STATE.waitingForAnswer = true;
    if (!STATE.isListening) {
        try {
            recognition.start();
            STATE.isListening = true;
        } catch (e) {
            // recognition may already be started
        }
    }
    dom.btnMicToggle.classList.add('active');
    dom.micStatus.classList.add('listening');
    dom.micStatus.innerHTML = '<i class="ph-bold ph-microphone"></i><span>Escuchando...</span>';
}

function stopListening() {
    STATE.waitingForAnswer = false;
    dom.btnMicToggle.classList.remove('active');
    dom.micStatus.classList.remove('listening');
}

function stopListeningFully() {
    STATE.waitingForAnswer = false;
    if (!recognition) return;
    try {
        recognition.stop();
    } catch (e) {}
    STATE.isListening = false;
    dom.btnMicToggle.classList.remove('active');
    dom.micStatus.classList.remove('listening');
}

// ───── Timer ─────
function startTimer() {
    STATE.timeLeft = TIMER_DURATION;
    updateTimerDisplay();
    dom.timerRing.style.strokeDasharray = TIMER_CIRCUMFERENCE;
    dom.timerRing.style.strokeDashoffset = 0;
    dom.timerRing.classList.remove('warning', 'danger');

    clearInterval(STATE.timer);
    STATE.timer = setInterval(() => {
        STATE.timeLeft--;
        updateTimerDisplay();

        if (STATE.timeLeft <= 3) {
            dom.timerRing.classList.add('danger');
            dom.timerRing.classList.remove('warning');
        } else if (STATE.timeLeft <= 5) {
            dom.timerRing.classList.add('warning');
        }

        if (STATE.timeLeft <= 0) {
            clearInterval(STATE.timer);
            stopListening();
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    dom.timerText.textContent = STATE.timeLeft;
    const offset = TIMER_CIRCUMFERENCE * (1 - STATE.timeLeft / TIMER_DURATION);
    dom.timerRing.style.strokeDashoffset = offset;
}

function stopTimer() {
    clearInterval(STATE.timer);
}

// ───── Game Flow ─────
function shuffleArray(arr) {
    const shuffled = [...arr.keys()];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function startGame() {
    // Reset state
    STATE.lives = 30;
    STATE.score = 0;
    STATE.currentIndex = 0;
    STATE.correct = 0;
    STATE.wrong = 0;
    STATE.history = [];
    STATE.gameActive = true;
    STATE.verbOrder = shuffleArray(VERBS);

    // Reset UI
    dom.livesCount.textContent = '30';
    dom.scoreCount.textContent = '0';
    dom.historyList.innerHTML = '<li class="history-empty"><i class="ph-bold ph-note-blank"></i><span>Los resultados apareceran aqui</span></li>';
    dom.statCorrect.innerHTML = '<i class="ph-bold ph-check-circle"></i> 0';
    dom.statWrong.innerHTML = '<i class="ph-bold ph-x-circle"></i> 0';
    dom.reviewPanel.classList.add('hidden');
    updateProgress();

    showScreen('game');

    // Check microphone support — SpeechRecognition handles its own permissions
    initSpeechRecognition();
    if (!STATE.micAvailable) {
        STATE.useKeyboard = true;
        dom.keyboardInput.classList.remove('hidden');
        dom.btnMicToggle.classList.add('hidden');
    } else {
        STATE.useKeyboard = false;
        dom.keyboardInput.classList.add('hidden');
        dom.btnMicToggle.classList.remove('hidden');
        // Start recognition ONCE for the entire game session
        try {
            recognition.start();
            STATE.isListening = true;
        } catch (e) {}
    }

    setTimeout(() => showVerb(), 400);
}

function showVerb() {
    if (!STATE.gameActive) return;
    if (STATE.currentIndex >= VERBS.length || STATE.lives <= 0) {
        endGame();
        return;
    }

    const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];
    dom.verbDisplay.textContent = verb[0];
    dom.feedbackOverlay.classList.add('hidden');
    dom.userAnswer.classList.add('hidden');
    dom.textAnswer.value = '';
    dom.micStatus.innerHTML = '<i class="ph-bold ph-microphone"></i><span>Esperando tu respuesta...</span>';

    // Speak the verb
    speakVerb(verb[0]);

    // Start timer
    startTimer();

    // Enable answer listening (recognition is already running)
    if (STATE.micAvailable && !STATE.useKeyboard) {
        STATE.waitingForAnswer = true;
        dom.btnMicToggle.classList.add('active');
        dom.micStatus.classList.add('listening');
        dom.micStatus.innerHTML = '<i class="ph-bold ph-microphone"></i><span>Escuchando...</span>';
    }

    // Focus text input if using keyboard
    if (STATE.useKeyboard) {
        setTimeout(() => dom.textAnswer.focus(), 300);
    }
}

function processAnswer(userInput, expected) {
    if (!STATE.gameActive) return;
    stopTimer();
    stopListening();

    const isCorrect = checkAnswer(userInput, expected);
    const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];

    // Show user's answer
    dom.userAnswer.textContent = userInput || '(sin respuesta)';
    dom.userAnswer.classList.remove('hidden');

    if (isCorrect) {
        STATE.correct++;
        STATE.score += 10;
        showFeedback('correct', 'Correcto', '');
    } else {
        STATE.wrong++;
        STATE.lives--;
        showFeedback('wrong', 'Incorrecto', `Respuesta: ${verb[1]}`);
        updateLives();
    }

    addHistoryItem(verb[0], verb[1], isCorrect);
    updateProgress();
    dom.scoreCount.textContent = STATE.score;

    // Check game over
    if (STATE.lives <= 0) {
        clearTimeout(STATE.feedbackTimeout);
        STATE.feedbackTimeout = setTimeout(() => endGame(), 1500);
        return;
    }

    // Next verb after feedback
    clearTimeout(STATE.feedbackTimeout);
    STATE.feedbackTimeout = setTimeout(() => {
        STATE.currentIndex++;
        showVerb();
    }, 1400);
}

function handleTimeout() {
    if (!STATE.gameActive) return;
    const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];
    STATE.wrong++;
    STATE.lives--;

    showFeedback('timeout', 'Tiempo agotado', `Respuesta: ${verb[1]}`);
    addHistoryItem(verb[0], verb[1], false);
    updateLives();
    updateProgress();

    if (STATE.lives <= 0) {
        clearTimeout(STATE.feedbackTimeout);
        STATE.feedbackTimeout = setTimeout(() => endGame(), 1500);
        return;
    }

    clearTimeout(STATE.feedbackTimeout);
    STATE.feedbackTimeout = setTimeout(() => {
        STATE.currentIndex++;
        showVerb();
    }, 1400);
}

function showFeedback(type, text, correctText) {
    dom.feedbackOverlay.classList.remove('hidden');
    dom.feedbackIcon.className = 'feedback-icon ' + type;

    if (type === 'correct') {
        dom.feedbackIcon.innerHTML = '<i class="ph-bold ph-check"></i>';
    } else if (type === 'wrong') {
        dom.feedbackIcon.innerHTML = '<i class="ph-bold ph-x"></i>';
    } else {
        dom.feedbackIcon.innerHTML = '<i class="ph-bold ph-clock"></i>';
    }

    dom.feedbackText.textContent = text;
    dom.feedbackCorrect.textContent = correctText;
}

// ───── UI Updates ─────
function updateLives() {
    dom.livesCount.textContent = STATE.lives;
    dom.livesDisplay.classList.add('pulse');
    setTimeout(() => dom.livesDisplay.classList.remove('pulse'), 400);
}

function updateProgress() {
    const pct = (STATE.currentIndex / VERBS.length) * 100;
    dom.progressFill.style.width = pct + '%';
    dom.progressText.textContent = `${STATE.currentIndex} / ${VERBS.length}`;
}

function addHistoryItem(verb, meaning, isCorrect) {
    // Remove empty state
    const emptyEl = dom.historyList.querySelector('.history-empty');
    if (emptyEl) emptyEl.remove();

    const li = document.createElement('li');
    li.className = `history-item ${isCorrect ? 'correct' : 'wrong'}`;
    li.innerHTML = `
        <span class="hi-icon"><i class="ph-bold ${isCorrect ? 'ph-check' : 'ph-x'}"></i></span>
        <span class="hi-verb">${verb}</span>
        <span class="hi-sep">→</span>
        <span class="hi-meaning">${meaning}</span>
    `;

    dom.historyList.prepend(li);

    // Update stats
    dom.statCorrect.innerHTML = `<i class="ph-bold ph-check-circle"></i> ${STATE.correct}`;
    dom.statWrong.innerHTML = `<i class="ph-bold ph-x-circle"></i> ${STATE.wrong}`;

    // Record in state
    STATE.history.push({ verb, meaning, correct: isCorrect });
}

// ───── Screen Management ─────
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ───── End Game ─────
function endGame() {
    STATE.gameActive = false;
    stopTimer();
    stopListeningFully();
    clearTimeout(STATE.feedbackTimeout);

    const total = STATE.correct + STATE.wrong;
    const accuracy = total > 0 ? Math.round((STATE.correct / total) * 100) : 0;

    // Populate results
    dom.resultCorrect.textContent = STATE.correct;
    dom.resultWrong.textContent = STATE.wrong;
    dom.resultAccuracy.textContent = accuracy + '%';
    dom.resultLives.textContent = STATE.lives;

    // Determine level
    const level = getLevel(accuracy);
    dom.resultsBadge.className = 'results-badge ' + level.css;
    dom.resultsBadge.innerHTML = `<i class="ph-bold ${level.icon}"></i>`;
    dom.resultsTitle.textContent = STATE.lives <= 0 ? 'Juego Terminado' : 'Partida Completada';
    dom.resultsSubtitle.textContent = STATE.lives <= 0
        ? 'Te quedaste sin vidas'
        : `Completaste ${STATE.currentIndex} de ${VERBS.length} verbos`;

    dom.levelName.textContent = level.name;
    dom.levelDescription.textContent = level.desc;
    dom.levelIcon.className = `ph-bold ${level.icon}`;

    // Populate review list with errors
    const errors = STATE.history.filter(h => !h.correct);
    dom.reviewList.innerHTML = '';
    errors.forEach(e => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rv-eng">${e.verb}</span><span class="hi-sep">→</span><span class="rv-esp">${e.meaning}</span>`;
        dom.reviewList.appendChild(li);
    });

    dom.reviewPanel.classList.add('hidden');
    showScreen('results');
}

function getLevel(accuracy) {
    if (accuracy >= 95) return { name: 'Maestro', css: 'master', icon: 'ph-crown', desc: 'Dominio absoluto del vocabulario. Increible.' };
    if (accuracy >= 80) return { name: 'Experto', css: 'expert', icon: 'ph-trophy', desc: 'Excelente manejo de los verbos. Sigue asi.' };
    if (accuracy >= 60) return { name: 'Avanzado', css: 'advanced', icon: 'ph-medal', desc: 'Buen nivel. Practica los verbos que fallaste.' };
    if (accuracy >= 40) return { name: 'Intermedio', css: 'intermediate', icon: 'ph-star', desc: 'Vas por buen camino. Sigue practicando.' };
    return { name: 'Principiante', css: 'beginner', icon: 'ph-book-open', desc: 'No te rindas. La practica hace al maestro.' };
}

// ───── Toast ─────
function showToast(message, type = 'info') {
    dom.toastMessage.textContent = message;
    dom.toastIcon.className = `ph-bold ${type === 'warning' ? 'ph-warning' : 'ph-info'}`;
    dom.toast.classList.remove('hidden');
    setTimeout(() => dom.toast.classList.add('show'), 10);
    setTimeout(() => {
        dom.toast.classList.remove('show');
        setTimeout(() => dom.toast.classList.add('hidden'), 300);
    }, 3500);
}

// ───── Event Listeners ─────
dom.btnStart.addEventListener('click', startGame);
dom.btnRestart.addEventListener('click', startGame);

dom.btnHear.addEventListener('click', () => {
    if (STATE.gameActive) {
        const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];
        speakVerb(verb[0]);
    }
});

dom.btnSkip.addEventListener('click', () => {
    if (!STATE.gameActive) return;
    stopTimer();
    stopListening();
    const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];
    STATE.wrong++;
    STATE.lives--;
    showFeedback('wrong', 'Saltado', `Respuesta: ${verb[1]}`);
    addHistoryItem(verb[0], verb[1], false);
    updateLives();

    if (STATE.lives <= 0) {
        clearTimeout(STATE.feedbackTimeout);
        STATE.feedbackTimeout = setTimeout(() => endGame(), 1500);
        return;
    }

    clearTimeout(STATE.feedbackTimeout);
    STATE.feedbackTimeout = setTimeout(() => {
        STATE.currentIndex++;
        showVerb();
    }, 1400);
});

dom.btnMicToggle.addEventListener('click', () => {
    if (STATE.waitingForAnswer) {
        stopListening();
    } else {
        startListening();
    }
});

dom.btnTypeToggle.addEventListener('click', () => {
    STATE.useKeyboard = !STATE.useKeyboard;
    dom.keyboardInput.classList.toggle('hidden', !STATE.useKeyboard);
    if (STATE.useKeyboard) {
        stopListening();
        dom.textAnswer.focus();
    }
});

dom.btnSubmitText.addEventListener('click', submitTextAnswer);

dom.textAnswer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitTextAnswer();
});

function submitTextAnswer() {
    if (!STATE.gameActive) return;
    const val = dom.textAnswer.value.trim();
    if (!val) return;
    stopTimer();
    stopListening();
    const verb = VERBS[STATE.verbOrder[STATE.currentIndex]];
    processAnswer(val, verb[1]);
}

dom.btnReview.addEventListener('click', () => {
    dom.reviewPanel.classList.toggle('hidden');
});

dom.btnModalClose.addEventListener('click', () => {
    dom.modalMic.classList.add('hidden');
});

// ───── Init ─────
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    if (!SpeechRecognitionAPI) {
        showToast('Tu navegador no soporta reconocimiento de voz. Usa el teclado.', 'warning');
    }
});
