// Simple SPA tabs
document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// ---------- Escape game ----------
const escapeStatements = [
    { s: 'Jedna čtvrtina z jedné čtvrtiny je 1/16.', a: true },
    { s: 'Jedna polovina z jedné třetiny je více než jedna třetina z jedné poloviny.', a: false },
    { s: 'Dvě kila peří jsou těžší než kilo železa.', a: true },
    { s: 'Když půlka chleba stojí 25 Kč, dva takové chleby stojí 100 Kč.', a: true },
    { s: 'Nejmenší prvočíslo je 1.', a: false },
    { s: 'Číslo je dělitelné třemi, když je součet jeho cifer dělitelný třemi.', a: true },
    { s: 'Osm pavouků má dohromady 32 nohou.', a: false },
    { s: 'Nejvyšší hora Čech je vyšší než nejvyšší hora Moravy.', a: true },
    { s: 'V místnosti je přesně 12 nohou (počítáme pouze nohy nábytku).', a: true },
    { s: 'Pro libovolné nenulové a platí a^0 = 1.', a: true },
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
    'na císřském dvoře mne začali oblékat do mouky, strouhanky a vejce',
    'nejraději kamarádím s bramborovým salátem',
    'jsem velmi oblíbený. Už víš, kdo jsem?',
];

const FINAL_ANSWER = ['vídeňský řízek', 'vidensky rizek', 'wiener schnitzel', 'řízek', 'rizek'];

// Escape game state
let idx = 0;
let revealedHints = 0;

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
const btnTrue = document.getElementById('btn-true');
const btnFalse = document.getElementById('btn-false');

function renderQuestion() {
    qTotalEl.textContent = escapeStatements.length;
    qNumberEl.textContent = Math.min(idx + 1, escapeStatements.length);
    questionTextEl.textContent = escapeStatements[idx].s;
    feedbackEl.textContent = '';
}

function renderHints() {
    hintsList.innerHTML = '';
    escapeHints.forEach((h, i) => {
        const li = document.createElement('li');
        li.textContent = h;
        li.className = i < revealedHints ? 'revealed' : 'hidden';
        hintsList.appendChild(li);
    });
}

function handleTFAnswer(userAnswer) {
    const ok = escapeStatements[idx].a === userAnswer;
    if (ok) {
        feedbackEl.textContent = 'Správně! Získáváš nápovědu.';
        feedbackEl.className = 'feedback ok';
        if (revealedHints < escapeHints.length) {
            revealedHints++;
            renderHints();
        }
        idx = (idx + 1) % escapeStatements.length;
        renderQuestion();
    } else {
        feedbackEl.textContent = 'Ne, zkus to znovu.';
        feedbackEl.className = 'feedback err';
    }
}

btnTrue.addEventListener('click', () => handleTFAnswer(true));
btnFalse.addEventListener('click', () => handleTFAnswer(false));

skipBtn.addEventListener('click', () => {
    idx = (idx + 1) % escapeStatements.length;
    renderQuestion();
});

resetEscapeBtn.addEventListener('click', () => {
    idx = 0;
    revealedHints = 0;
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
        finalFeedback.textContent = 'Bravo! Správná odpověď: Vídeňský řízek.';
        finalFeedback.className = 'feedback ok';
    } else {
        finalFeedback.textContent = 'Zatím ne. Pokračuj v získávání nápověd.';
        finalFeedback.className = 'feedback err';
    }
});

// Initialize escape
renderQuestion();
renderHints();

// Keyboard helpers (N = next; T/F answer)
document.addEventListener('keydown', (e) => {
    const activeEscape = document.getElementById('escape').classList.contains('active');
    if (e.key.toLowerCase() === 'n') {
        if (activeEscape) {
            idx = (idx + 1) % escapeStatements.length;
            renderQuestion();
        } else if (document.getElementById('duel').classList.contains('active')) {
            newProblem();
        }
    }
    if (activeEscape) {
        if (e.key.toLowerCase() === 't') handleTFAnswer(true);
        if (e.key.toLowerCase() === 'f') handleTFAnswer(false);
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
