// Simple SPA tabs
document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// ---------- Escape game ----------
const escapeQuestions = [
    {
        q: 'Kolik je jedna čtvrtina z jedné čtvrtiny?',
        validate: (v) => ['1/16', '1/ 16', '1 : 16', '1:16', '0.0625', '0,0625', '1/16.'].includes(norm(v)) || norm(v) === '0,0625' || norm(v) === '0.0625' || norm(v) === '1/16' || norm(v) === '1/16.',
    },
    {
        q: 'Je víc jedna polovina z jedné třetiny nebo jedna třetina z jedné poloviny?',
        validate: (v) => {
            const n = norm(v);
            return (
                n.includes('jedna tretina z jedne poloviny') ||
                n.includes('tretina z poloviny') ||
                n.includes('1/3 z 1/2') ||
                n.includes('1/6') ||
                n.includes('stejne')
            );
        },
    },
    {
        q: 'Je těžší kilo železa nebo 2 kila peří ?',
        validate: (v) => {
            const n = norm(v);
            return n.includes('2') || n.includes('dve') || n.includes('peri');
        },
    },
    {
        q: 'Půl chleba stojí 25 Kč, kolik stojí dva takové chleby?',
        validate: (v) => asNumber(v) === 100,
    },
    {
        q: 'Jaké je nejmenší prvočíslo?',
        validate: (v) => asNumber(v) === 2,
    },
    {
        q: 'Jak se pozná, že je celé číslo dělitelné třemi?',
        validate: (v) => {
            const n = norm(v);
            return (
                n.includes('soucet') && n.includes('cif') && (n.includes('deliteln') || n.includes('del'))
            );
        },
    },
    {
        q: 'Kolik nohou má osm pavouků?',
        validate: (v) => asNumber(v) === 64,
    },
    {
        q: 'Je vyšší nejvyšší hora Moravy nebo nejvyšší hora Čech?',
        validate: (v) => {
            const n = norm(v);
            // Nejvyšší hora Čech (Sněžka 1603 m) > Nejvyšší hora Moravy (Praděd 1491 m)
            return n.includes('cech') || n.includes('snezka');
        },
    },
    {
        q: 'V místnosti stojí stůl a dvě židle. Na posteli leží dvě kočky, na stole jsou 3 živé slepice a 2 kohouti. Kolik nohou je v místnosti?',
        // Akceptuj několik běžných výkladů: 12 (jen nábytek), 22 (nábytek + drůbež), 30 (nábytek + drůbež + kočky)
        validate: (v) => [12, 22, 30].includes(asNumber(v)),
    },
    {
        q: 'Kolik je a^0?',
        validate: (v) => {
            const n = norm(v);
            return asNumber(n.replace(',', '.')) === 1 || n === '1';
        },
    },
];

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

const qTotalEl = document.getElementById('q-total');
const qNumberEl = document.getElementById('q-number');
const questionTextEl = document.getElementById('question-text');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const feedbackEl = document.getElementById('feedback');
const hintsList = document.getElementById('hints-list');
const skipBtn = document.getElementById('skip-btn');
const resetEscapeBtn = document.getElementById('reset-escape');
const finalForm = document.getElementById('final-form');
const finalInput = document.getElementById('final-input');
const finalFeedback = document.getElementById('final-feedback');

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

function renderQuestion() {
    qTotalEl.textContent = escapeQuestions.length;
    qNumberEl.textContent = Math.min(idx + 1, escapeQuestions.length);
    questionTextEl.textContent = escapeQuestions[idx].q;
    answerInput.value = '';
    feedbackEl.textContent = '';
    answerInput.focus();
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

answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = answerInput.value;
    const ok = escapeQuestions[idx].validate(val);
    if (ok) {
        feedbackEl.textContent = 'Správně! Získáváš nápovědu.';
        feedbackEl.className = 'feedback ok';
        if (revealedHints < escapeHints.length) {
            revealedHints++;
            renderHints();
        }
        // Postup na další otázku (cirkulárně)
        idx = (idx + 1) % escapeQuestions.length;
        renderQuestion();
    } else {
        feedbackEl.textContent = 'Zkus to ještě jednou.';
        feedbackEl.className = 'feedback err';
    }
});

skipBtn.addEventListener('click', () => {
    idx = (idx + 1) % escapeQuestions.length;
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

// Keyboard helpers
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n') {
        // next
        if (document.getElementById('escape').classList.contains('active')) {
            idx = (idx + 1) % escapeQuestions.length;
            renderQuestion();
        } else if (document.getElementById('duel').classList.contains('active')) {
            newProblem();
        }
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
