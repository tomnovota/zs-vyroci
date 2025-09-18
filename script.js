// Simple SPA tabs
document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// --------- Utils used across escape + duel ---------
function norm(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}
function asNumber(s) {
    if (s == null) return NaN;
    const t = String(s).replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/);
    return t ? Number(t[0]) : NaN;
}

// ---------- Escape game ----------
// Per-question types: text | compare (lt/eq/gt) | tf
const escapeItems = [
    // 1) open text: 1/16
    {
        type: 'text',
        q: 'Kolik je jedna čtvrtina z jedné čtvrtiny? Odpověď zapište jako zlomek (např. 3/4 nebo 3:4) nebo desetinné číslo (např. 0.527)',
        validate: (val) => {
            const n = norm(val);
            if (n === '1/16' || n === '1:16' || n === '1 : 16') return true;
            const num = asNumber(val);
            return Math.abs(num - 0.0625) < 1e-9; // 0.0625 or 0,0625
        },
    },
    // 2) compare: 1/2 of 1/3 vs 1/3 of 1/2 -> equal
    {
        type: 'compare',
        q: 'Porovnejte: (1/2) z (1/3) vs (1/3) z (1/2)',
        answer: 'eq', // lt/eq/gt means first vs second
    },
    // 3) compare: 2 kg feathers vs 1 kg iron -> greater
    {
        type: 'compare',
        q: 'Porovnejte: 2 kg peří vs 1 kg železa',
        answer: 'gt',
    },
    // 4) text: cost of 2 breads
    {
        type: 'text',
        q: 'Půl chleba stojí 25 Kč, kolik stojí dva takové chleby?',
        validate: (val) => asNumber(val) === 100,
    },
    // 5) text: smallest prime
    {
        type: 'text',
        q: 'Jaké je nejmenší prvočíslo?',
        validate: (val) => asNumber(val) === 2,
    },
    // 6) TF: divisibility by 3 rule
    {
        type: 'tf',
        q: 'Platí: číslo je dělitelné třemi, když je součet jeho cifer dělitelný třemi.',
        answer: true,
    },
    // 7) text: spider legs
    {
        type: 'text',
        q: 'Kolik nohou má osm pavouků?',
        validate: (val) => asNumber(val) === 64,
    },
    // 8) TF: mountain comparison
    {
        type: 'tf',
        q: 'Platí: Nejvyšší hora Čech je vyšší než nejvyšší hora Moravy.',
        answer: true,
    },
    // 9) text: room legs (accept several common interpretations)
    {
        type: 'text',
        q: 'V místnosti stojí stůl a dvě židle. Na posteli leží dvě kočky, na stole jsou 3 živé slepice a 2 kohouti. Kolik nohou je v místnosti?',
        validate: (val) => [12, 22, 30].includes(asNumber(val)),
    },
    // 10) text: a^0
    {
        type: 'text',
        q: 'Kolik je jakékoli číslo umocněné na 0?',
        validate: (val) => asNumber(String(val).replace(',', '.')) === 1,
    },
];

// Keep original hints and final answer configuration

const escapeHints = [
    'říká se, že mne znali již ve starověkém Řecku',
    'do životopisu mohu napsat, že pocházím z Milána',
    'v rodném listu bych mohl mít napsáno „cotoletta milanese“',
    'v dětství jsem se nejraději oblékal do parmazánu a strouhanky',
    'v srpnu 1848 mne osobně poznal maršál rakouské armády Jan Josef Václav Radecký z Radče',
    's tímto pánem jsem se dostal až do Vídně',
    'zde jsem se stal oblíbencem císaře Františka Josefa II.',
    'na císařském dvoře mne začali oblékat do mouky, strouhanky a vejce',
    'nejraději kamarádím s bramborovým salátem',
    'jsem velmi oblíbený. Už víš, kdo jsem?',
];

const FINAL_ANSWER = ['vídeňský řízek', 'vidensky rizek', 'wiener schnitzel', 'řízek', 'rizek'];

// Escape game state
let idx = 0;
let revealedSet = new Set(); // which hint indices are revealed (by question index)
let questionStageFinished = false; // when true, hide questions and prompt final answer

// Cache DOM
const qTotalEl = document.getElementById('q-total');
const qNumberEl = document.getElementById('q-number');
const questionTextEl = document.getElementById('question-text');
const feedbackEl = document.getElementById('feedback');
const hintsList = document.getElementById('hints-list');
const skipBtn = document.getElementById('skip-btn');
const resetEscapeBtn = document.getElementById('reset-escape');
const finalForm = document.getElementById('final-form');
const finalInput = document.getElementById('final-input');
const finalFeedback = document.getElementById('final-feedback');
const finishedCard = document.getElementById('finished-card');
const escapeCard = document.getElementById('escape-card');
const congratsCard = document.getElementById('congrats');
const restartAllBtn = document.getElementById('restart-all');
const finishedTitleEl = finishedCard.querySelector('h3');
const finishedTextEl = finishedCard.querySelector('p');
// Controls
const textForm = document.getElementById('text-form');
const textInput = document.getElementById('text-input');
const compareControls = document.getElementById('compare-controls');
const cmpButtons = document.querySelectorAll('.cmp');
const tfControls = document.getElementById('tf-controls');
const btnTrue = document.getElementById('btn-true');
const btnFalse = document.getElementById('btn-false');

function renderQuestion() {
    const item = escapeItems[idx];
    qTotalEl.textContent = escapeItems.length;
    qNumberEl.textContent = Math.min(idx + 1, escapeItems.length);
    questionTextEl.textContent = item.q;
    feedbackEl.textContent = '';
    showControls(item.type);
}

function showControls(type) {
    textForm.style.display = type === 'text' ? 'flex' : 'none';
    compareControls.style.display = type === 'compare' ? 'flex' : 'none';
    tfControls.style.display = type === 'tf' ? 'flex' : 'none';
    if (type === 'text') {
        textInput.value = '';
        textInput.focus();
    }
}

function renderHints() {
    hintsList.innerHTML = '';
    escapeHints.forEach((h, i) => {
        const li = document.createElement('li');
        li.textContent = h;
        li.className = revealedSet.has(i) ? 'revealed' : 'hidden';
        hintsList.appendChild(li);
    });
    // Hide question card when all hints earned or stage finished, show finished notice
    const allHints = revealedSet.size >= escapeHints.length;
    const hide = allHints || questionStageFinished;
    escapeCard.style.display = hide ? 'none' : 'block';
    finishedCard.style.display = hide ? 'block' : 'none';
    if (hide) {
        if (allHints) {
            finishedTitleEl.textContent = 'Máte všechny nápovědy!';
            finishedTextEl.textContent = 'Zkuste nyní uhodnout finální odpověď níže.';
        } else {
            finishedTitleEl.textContent = 'Konec otázek';
            finishedTextEl.textContent = 'Teď tipni finální odpověď níže.';
        }
    }
}

function finishQuestions() {
    questionStageFinished = true;
    renderHints();
    // Focus final answer input for convenience
    setTimeout(() => finalInput.focus(), 0);
}

function awardAndNext() {
    feedbackEl.textContent = 'Správně! Získáváš nápovědu.';
    feedbackEl.className = 'feedback ok';
    if (!revealedSet.has(idx)) revealedSet.add(idx);
    renderHints();
    // Clear any residual typing before advancing
    textInput.value = '';
    const lastIdx = escapeItems.length - 1;
    if (revealedSet.size >= escapeHints.length) {
        // All hints done -> finish immediately
        finishQuestions();
        return;
    }
    if (idx < lastIdx) {
        idx += 1;
        renderQuestion();
    } else {
        // answered the last (10th) question -> finish stage
        finishQuestions();
    }
}

function skipToNextQuestion() {
    // Do not reveal a hint, just advance
    textInput.value = '';
    feedbackEl.textContent = '';
    const lastIdx = escapeItems.length - 1;
    if (idx < lastIdx) {
        idx += 1;
        renderQuestion();
    } else {
        finishQuestions();
    }
}

function wrongAndSkip() {
    // Show a brief message, then skip
    feedbackEl.textContent = 'Špatně, přeskakuji na další otázku.';
    feedbackEl.className = 'feedback err';
    setTimeout(() => {
        skipToNextQuestion();
    }, 600);
}

// Handlers by type
textForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (escapeItems[idx].type !== 'text') return;
    const ok = escapeItems[idx].validate(textInput.value);
    if (ok) {
        awardAndNext();
    } else {
        wrongAndSkip();
    }
});

cmpButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        if (escapeItems[idx].type !== 'compare') return;
        const ans = btn.dataset.cmp; // lt/eq/gt
        if (ans === escapeItems[idx].answer) {
            awardAndNext();
        } else {
            wrongAndSkip();
        }
    });
});

function handleTFAnswer(userAnswer) {
    if (escapeItems[idx].type !== 'tf') return;
    const ok = escapeItems[idx].answer === userAnswer;
    if (ok) awardAndNext(); else wrongAndSkip();
}

btnTrue.addEventListener('click', () => handleTFAnswer(true));
btnFalse.addEventListener('click', () => handleTFAnswer(false));

skipBtn.addEventListener('click', () => {
    skipToNextQuestion();
});

resetEscapeBtn.addEventListener('click', () => {
    idx = 0;
    revealedSet = new Set();
    questionStageFinished = false;
    renderQuestion();
    renderHints();
    finalInput.value = '';
    finalFeedback.textContent = '';
});

finalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = norm(finalInput.value);
    const ok = FINAL_ANSWER.some((x) => n === norm(x));
    if (ok) {
        // Show congratulations screen, hide input card
        finalFeedback.textContent = '';
        congratsCard.style.display = 'block';
        // Also hide finished card (if visible)
        finishedCard.style.display = 'none';
    } else {
        finalFeedback.textContent = 'Zatím ne. Pokračuj v získávání nápověd.';
        finalFeedback.className = 'feedback err';
    }
});

restartAllBtn.addEventListener('click', () => {
    // Reset entire escape game state
    idx = 0;
    revealedSet = new Set();
    questionStageFinished = false;
    congratsCard.style.display = 'none';
    finishedCard.style.display = 'none';
    escapeCard.style.display = 'block';
    finalInput.value = '';
    finalFeedback.textContent = '';
    renderHints();
    renderQuestion();
});

// Initialize escape
renderQuestion();
renderHints();

// Keyboard helpers:
//  - P/N for True/False (Pravda/Nepravda)
//  - 1/2/3 for compare (Menší/Rovno/Větší)
//  - N for next ONLY when not typing in an input
document.addEventListener('keydown', (e) => {
    const activeEscape = document.getElementById('escape').classList.contains('active');
    const k = e.key.toLowerCase();
    const ae = document.activeElement;
    const isTyping = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');

    if (!activeEscape) {
        if (k === 'n') { e.preventDefault(); newProblem(); }
        return;
    }

    const t = escapeItems[idx].type;

    // True/False answers first to avoid conflict with Next
    if (t === 'tf') {
        if (k === 'p') { e.preventDefault(); handleTFAnswer(true); return; }
        if (k === 'n') { e.preventDefault(); handleTFAnswer(false); return; }
    } else if (t === 'compare') {
        if (k === '1') { e.preventDefault(); document.querySelector('.cmp[data-cmp="lt"]').click(); return; }
        if (k === '2') { e.preventDefault(); document.querySelector('.cmp[data-cmp="eq"]').click(); return; }
        if (k === '3') { e.preventDefault(); document.querySelector('.cmp[data-cmp="gt"]').click(); return; }
    }

    // Next: only when not typing in an input
    if (k === 'n' && !isTyping) {
        e.preventDefault();
        skipToNextQuestion();
    }
});

// ---------- Math duel ----------
const opSelect = document.getElementById('op-select');
const digitsSelect = document.getElementById('digits-select');
const nextProblemBtn = document.getElementById('next-problem');
const resetDuelBtn = document.getElementById('reset-duel');
const problemEl = document.getElementById('problem');
const duelFeedback = document.getElementById('duel-feedback');

const score = { A: 0, B: 0 };
let currentAnswer = null;
let answeredBy = null;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickDigits() {
    const v = digitsSelect.value;
    if (v === '2') return 2;
    if (v === '3') return 3;
    return Math.random() < 0.5 ? 2 : 3;
}

function randNum(d) {
    if (d === 2) return randInt(10, 99);
    return randInt(100, 999);
}

function newProblem() {
    const d = pickDigits();
    const opChoice = opSelect.value === 'mix' ? (Math.random() < 0.5 ? 'add' : 'mul') : opSelect.value;
    const a = randNum(d);
    const b = randNum(d);
    const op = opChoice === 'add' ? '+' : '×';
    currentAnswer = opChoice === 'add' ? a + b : a * b;
    answeredBy = null;
    problemEl.textContent = `${a} ${op} ${b} = ?`;
    duelFeedback.textContent = '';
    document.getElementById('ans-A').value = '';
    document.getElementById('ans-B').value = '';
    // Focus alternate players each round
    const target = Math.random() < 0.5 ? 'ans-A' : 'ans-B';
    document.getElementById(target).focus();
}

function submitDuelAnswer(player, value) {
    if (currentAnswer == null) return;
    if (answeredBy) return; // Already won this round
    const num = asNumber(value);
    if (num === currentAnswer) {
        answeredBy = player;
        score[player]++;
        document.getElementById(`score-${player}`).textContent = String(score[player]);
        duelFeedback.textContent = `Bod pro hráče ${player}!`;
        duelFeedback.className = 'feedback ok';
        // Prepare next after short delay
        setTimeout(() => newProblem(), 900);
    } else {
        // small hint or do nothing
        duelFeedback.textContent = `Špatně, hráči ${player}. Zkus dál!`;
        duelFeedback.className = 'feedback err';
    }
}

document.querySelectorAll('.answer-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const player = form.dataset.player;
        const input = form.querySelector('input');
        submitDuelAnswer(player, input.value);
        input.select();
    });
});

nextProblemBtn.addEventListener('click', newProblem);
resetDuelBtn.addEventListener('click', () => {
    score.A = 0; score.B = 0;
    document.getElementById('score-A').textContent = '0';
    document.getElementById('score-B').textContent = '0';
    duelFeedback.textContent = '';
    newProblem();
});

// Initialize duel
newProblem();
