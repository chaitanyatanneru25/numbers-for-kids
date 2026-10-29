/**
 * Maths for Kid - Main Application Engine
 * Interactive Quest, 200-Paper Mode, Dashboard Analytics, Scratchpad, & Confetti
 */

let currentPaper = null;
let currentIndex = 0;
let userAnswers = {}; // { [qid]: "12" }
let flaggedQuestions = new Set();
let streak = 0;
let startTime = null;
let timerInterval = null;
let currentEvaluation = null;
let isSoundEnabled = true;

// Active tab
let activeTab = 'quest';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initScratchpad();
    initConfetti();
    fetchNewPaper(200, ['basic', 'medium', 'advance'], ['addition', 'subtraction', 'multiplication', 'division'], 'progressive');
    loadPracticeHistory();
});

// --- Tab Switching ---
function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('main > section').forEach(sec => sec.style.display = 'none');

    const tabBtn = document.getElementById(`tab-btn-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');

    const section = document.getElementById(`section-${tab}`);
    if (section) {
        section.style.display = (tab === 'exam') ? 'grid' : (tab === 'dashboard' ? 'flex' : 'flex');
    }

    if (tab === 'quest') {
        renderQuestQuestion();
    } else if (tab === 'exam') {
        renderExamQuestion();
        renderQuestionGrid();
    } else if (tab === 'dashboard') {
        if (!currentEvaluation) {
            // Auto evaluate if not done yet
            finishAndEvaluatePaper();
        }
    }
}

// --- Fetch New Paper ---
async function fetchNewPaper(count = 200, levels = [], operations = [], mode = 'progressive') {
    try {
        const params = new URLSearchParams();
        params.set('count', count);
        if (levels.length > 0) params.set('levels', levels.join(','));
        if (operations.length > 0) params.set('operations', operations.join(','));
        params.set('mode', mode);

        const res = await fetch(`/api/paper/new?${params.toString()}`);
        const data = await res.json();

        if (data.status === 'success') {
            currentPaper = data.paper;
            currentIndex = 0;
            userAnswers = {};
            flaggedQuestions.clear();
            streak = 0;
            updateStreakUI();
            currentEvaluation = null;

            // Start timer
            startTimer();

            // Update UI elements
            document.getElementById('totalQDisplay').textContent = currentPaper.questions.length;
            document.getElementById('examPaperTitle').textContent = currentPaper.title || 'Maths for Kid Challenge';

            renderQuestQuestion();
            renderExamQuestion();
            renderQuestionGrid();
            switchTab('quest');
        }
    } catch (err) {
        console.error('Error fetching paper:', err);
    }
}

// --- Timer ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    const timerDisplay = document.getElementById('timerDisplay');

    timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        if (timerDisplay) timerDisplay.textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);
}

// --- Render Quest Mode Question ---
function renderQuestQuestion() {
    if (!currentPaper || !currentPaper.questions.length) return;
    const q = currentPaper.questions[currentIndex];

    document.getElementById('currentQIndexDisplay').textContent = q.id;
    document.getElementById('questNum1').textContent = q.num1;
    document.getElementById('questOpSymbol').textContent = q.symbol;
    document.getElementById('questNum2').textContent = q.num2;

    const lvlTag = document.getElementById('questLevelTag');
    lvlTag.textContent = q.level_label;
    lvlTag.className = `level-tag ${q.level}`;

    document.getElementById('questOpTag').textContent = q.operation.toUpperCase();

    // Flag button state
    const flagBtn = document.getElementById('questFlagBtn');
    if (flaggedQuestions.has(q.id)) {
        flagBtn.textContent = '🚩 Flagged';
        flagBtn.style.color = '#c2410c';
    } else {
        flagBtn.textContent = '🏳️ Flag';
        flagBtn.style.color = '';
    }

    // Input state
    const input = document.getElementById('questAnswerInput');
    input.value = userAnswers[q.id] || '';
    input.focus();

    // Reset feedback and hint
    const feedback = document.getElementById('questFeedbackBox');
    feedback.style.display = 'none';
    feedback.className = 'feedback-box';

    const hintBox = document.getElementById('questHintBox');
    hintBox.style.display = 'none';
    hintBox.textContent = `💡 Hint: ${q.hint}`;
}

// --- Handle Quest Answer Submit ---
function handleQuestSubmit(e) {
    if (e) e.preventDefault();
    if (!currentPaper) return;

    const q = currentPaper.questions[currentIndex];
    const input = document.getElementById('questAnswerInput');
    const val = input.value.trim();

    if (val === '') {
        input.focus();
        return;
    }

    userAnswers[q.id] = val;
    const isCorrect = (parseInt(val, 10) === q.answer);
    const feedback = document.getElementById('questFeedbackBox');

    feedback.style.display = 'flex';

    if (isCorrect) {
        streak++;
        updateStreakUI();
        window.soundEngine.playCorrect();

        feedback.className = 'feedback-box correct';
        feedback.textContent = `🎉 Brilliant! ${q.question_text.replace('?', val)} is Correct!`;

        if (streak > 0 && streak % 5 === 0) {
            triggerConfetti();
            window.soundEngine.playStreak();
        }

        setTimeout(() => {
            if (currentIndex < currentPaper.questions.length - 1) {
                nextQuestion();
            } else {
                feedback.textContent = `🏆 Paper Completed! Great job!`;
                finishAndEvaluatePaper();
            }
        }, 850);
    } else {
        streak = 0;
        updateStreakUI();
        window.soundEngine.playWrong();

        feedback.className = 'feedback-box wrong';
        feedback.textContent = `❌ Not quite! Correct answer is ${q.answer}. Review the hint below:`;
        document.getElementById('questHintBox').style.display = 'block';
    }

    renderQuestionGrid();
}

function toggleHint() {
    const hintBox = document.getElementById('questHintBox');
    hintBox.style.display = (hintBox.style.display === 'none') ? 'block' : 'none';
    window.soundEngine.playTap();
}

function updateStreakUI() {
    const streakCount = document.getElementById('streakCount');
    if (streakCount) streakCount.textContent = streak;
}

// --- Navigation ---
function nextQuestion() {
    if (!currentPaper) return;
    if (currentIndex < currentPaper.questions.length - 1) {
        currentIndex++;
        if (activeTab === 'quest') renderQuestQuestion();
        else if (activeTab === 'exam') renderExamQuestion();
        renderQuestionGrid();
    }
}

function prevQuestion() {
    if (!currentPaper) return;
    if (currentIndex > 0) {
        currentIndex--;
        if (activeTab === 'quest') renderQuestQuestion();
        else if (activeTab === 'exam') renderExamQuestion();
        renderQuestionGrid();
    }
}

function jumpToQuestion(idx) {
    if (!currentPaper || idx < 0 || idx >= currentPaper.questions.length) return;
    currentIndex = idx;
    if (activeTab === 'quest') renderQuestQuestion();
    else if (activeTab === 'exam') renderExamQuestion();
    renderQuestionGrid();
    window.soundEngine.playTap();
}

function toggleFlagCurrentQuestion() {
    if (!currentPaper) return;
    const q = currentPaper.questions[currentIndex];
    if (flaggedQuestions.has(q.id)) {
        flaggedQuestions.delete(q.id);
    } else {
        flaggedQuestions.add(q.id);
    }
    if (activeTab === 'quest') renderQuestQuestion();
    else if (activeTab === 'exam') renderExamQuestion();
    renderQuestionGrid();
    window.soundEngine.playTap();
}

// --- Render Exam Mode ---
function renderExamQuestion() {
    if (!currentPaper || !currentPaper.questions.length) return;
    const q = currentPaper.questions[currentIndex];

    document.getElementById('examQProgress').textContent = `Question ${q.id} of ${currentPaper.questions.length}`;
    document.getElementById('examNum1').textContent = q.num1;
    document.getElementById('examOpSymbol').textContent = q.symbol;
    document.getElementById('examNum2').textContent = q.num2;

    const lvlTag = document.getElementById('examLevelTag');
    lvlTag.textContent = q.level_label;
    lvlTag.className = `level-tag ${q.level}`;

    const flagBtn = document.getElementById('examFlagBtn');
    if (flaggedQuestions.has(q.id)) {
        flagBtn.textContent = '🚩 Flagged';
        flagBtn.style.color = '#c2410c';
    } else {
        flagBtn.textContent = '🏳️ Flag for Review';
        flagBtn.style.color = '';
    }

    const input = document.getElementById('examAnswerInput');
    input.value = userAnswers[q.id] || '';
    input.focus();
}

function handleExamAnswerInput(val) {
    if (!currentPaper) return;
    const q = currentPaper.questions[currentIndex];
    userAnswers[q.id] = val;
    renderQuestionGrid();
}

// --- Question Navigator Grid ---
let activeGridFilter = 'all';

function filterGrid(lvl, btnElem) {
    activeGridFilter = lvl;
    document.querySelectorAll('.grid-filter-tabs .filter-chip').forEach(c => c.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    renderQuestionGrid();
    window.soundEngine.playTap();
}

function renderQuestionGrid() {
    if (!currentPaper) return;
    const grid = document.getElementById('questionGridContainer');
    if (!grid) return;

    let answeredCount = 0;
    grid.innerHTML = '';

    currentPaper.questions.forEach((q, idx) => {
        const isAnswered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
        if (isAnswered) answeredCount++;

        // Filter check
        if (activeGridFilter !== 'all' && q.level !== activeGridFilter) {
            return;
        }

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = q.id;

        if (idx === currentIndex) {
            cell.classList.add('current');
        }

        if (flaggedQuestions.has(q.id)) {
            cell.style.borderColor = '#f59e0b';
            cell.style.background = '#fef3c7';
            cell.style.color = '#92400e';
        } else if (isAnswered) {
            cell.classList.add('answered');
        }

        cell.onclick = () => jumpToQuestion(idx);
        grid.appendChild(cell);
    });

    const counter = document.getElementById('answeredCounterText');
    if (counter) {
        counter.textContent = `${answeredCount}/${currentPaper.questions.length}`;
    }
}

// --- Finish & Evaluate Paper (Dashboard) ---
async function finishAndEvaluatePaper() {
    if (!currentPaper) return;

    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
        const res = await fetch('/api/paper/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paper_id: currentPaper.paper_id,
                user_answers: userAnswers,
                time_spent_seconds: timeSpent,
                paper_data: currentPaper
            })
        });

        const data = await res.json();
        if (data.status === 'success') {
            currentEvaluation = data.evaluation;
            renderDashboard(data.evaluation);
            switchTab('dashboard');

            if (data.evaluation.accuracy >= 60) {
                triggerConfetti();
                window.soundEngine.playVictory();
            } else {
                window.soundEngine.playCorrect();
            }

            loadPracticeHistory();
        }
    } catch (err) {
        console.error('Error evaluating paper:', err);
    }
}

// --- Render Dashboard Analytics ---
function renderDashboard(ev) {
    document.getElementById('dashBadgeTitle').textContent = ev.badge;
    document.getElementById('dashFeedbackText').textContent = ev.feedback;

    document.getElementById('statTotalQ').textContent = ev.total_questions;
    document.getElementById('statRights').textContent = ev.rights;
    document.getElementById('statWrongs').textContent = ev.wrongs;
    document.getElementById('statAccuracy').textContent = `${ev.accuracy}%`;

    // Operations Breakdown
    const opStats = ev.operation_breakdown;
    if (opStats) {
        const ops = [
            { key: 'addition', bar: 'barOpAdd', label: 'labelOpAdd', sub: 'subOpAdd', name: 'Addition' },
            { key: 'subtraction', bar: 'barOpSub', label: 'labelOpSub', sub: 'subOpSub', name: 'Subtraction' },
            { key: 'multiplication', bar: 'barOpMul', label: 'labelOpMul', sub: 'subOpMul', name: 'Multiplication' },
            { key: 'division', bar: 'barOpDiv', label: 'labelOpDiv', sub: 'subOpDiv', name: 'Division' }
        ];

        ops.forEach(op => {
            const data = opStats[op.key] || { rights: 0, total: 0, wrongs: 0, accuracy: 0 };
            document.getElementById(op.label).textContent = `${data.rights}/${data.total} (${data.accuracy}%)`;
            document.getElementById(op.bar).style.width = `${data.accuracy}%`;
            document.getElementById(op.sub).textContent = `✅ Rights: ${data.rights} | ❌ Wrongs: ${data.wrongs}`;
        });
    }

    // Level Breakdown
    const lvlStats = ev.level_breakdown;
    if (lvlStats) {
        const lvls = [
            { key: 'basic', bar: 'barLvlBasic', label: 'labelLvlBasic', sub: 'subLvlBasic' },
            { key: 'medium', bar: 'barLvlMed', label: 'labelLvlMed', sub: 'subLvlMed' },
            { key: 'advance', bar: 'barLvlAdv', label: 'labelLvlAdv', sub: 'subLvlAdv' }
        ];

        lvls.forEach(l => {
            const data = lvlStats[l.key] || { rights: 0, total: 0, wrongs: 0, accuracy: 0 };
            document.getElementById(l.label).textContent = `${data.rights}/${data.total} (${data.accuracy}%)`;
            document.getElementById(l.bar).style.width = `${data.accuracy}%`;
            document.getElementById(l.sub).textContent = `✅ Rights: ${data.rights} | ❌ Wrongs: ${data.wrongs}`;
        });
    }

    // Render Wrongs Details List
    renderWrongsList(ev.wrong_details);

    // Toggle "Retry Wrongs" button visibility
    const retryBtn = document.getElementById('btnRetryWrongs');
    if (retryBtn) {
        retryBtn.style.display = (ev.wrong_details && ev.wrong_details.length > 0) ? 'inline-flex' : 'none';
    }
}

// --- Render Wrongs Detail List ---
let activeWrongFilter = 'all';

function filterWrongs(op, btnElem) {
    activeWrongFilter = op;
    document.querySelectorAll('#wrongFilterButtons .filter-chip').forEach(c => c.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');

    if (currentEvaluation) {
        renderWrongsList(currentEvaluation.wrong_details);
    }
}

function renderWrongsList(wrongs) {
    const container = document.getElementById('wrongsGridContainer');
    const emptyState = document.getElementById('wrongsEmptyState');
    container.innerHTML = '';

    if (!wrongs || wrongs.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const filtered = (activeWrongFilter === 'all') 
        ? wrongs 
        : wrongs.filter(w => w.operation === activeWrongFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); padding: 1.5rem; text-align: center; grid-column: 1/-1;">No mistakes found for this operation! 🎉</p>`;
        return;
    }

    filtered.forEach(w => {
        const card = document.createElement('div');
        card.className = 'wrong-item-card';

        card.innerHTML = `
            <div class="wrong-item-top">
                <span class="wrong-q-num">Q #${w.id} • ${w.level_label}</span>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${w.operation.toUpperCase()}</span>
            </div>
            <div class="wrong-equation">${w.question_text}</div>
            <div class="answers-comparison">
                <div>Your Answer: <span class="ans-kid">${w.kid_answer !== undefined && w.kid_answer !== '' ? w.kid_answer : '(Empty)'}</span></div>
                <div>Correct: <span class="ans-correct">${w.correct_answer}</span></div>
            </div>
            <div style="font-size: 0.82rem; color: #78350f; background: #fffbeb; border-radius: 6px; padding: 0.4rem 0.6rem; margin-top: 0.3rem;">
                💡 ${w.hint}
            </div>
        `;

        container.appendChild(card);
    });
}

// --- Practice Only Wrongs ---
function retryWrongQuestions() {
    if (!currentEvaluation || !currentEvaluation.wrong_details || currentEvaluation.wrong_details.length === 0) return;

    const missed = currentEvaluation.wrong_details;
    const retryQuestions = missed.map((m, idx) => {
        // find original problem or reconstruct
        return {
            id: idx + 1,
            level: m.level,
            level_label: m.level_label,
            operation: m.operation,
            symbol: m.symbol,
            num1: m.question_text.split(' ')[0],
            num2: m.question_text.split(' ')[2],
            question_text: m.question_text,
            answer: m.correct_answer,
            hint: m.hint
        };
    });

    currentPaper = {
        paper_id: `RETRY-${Date.now()}`,
        title: `Mistake Mastery Drill (${retryQuestions.length} Questions)`,
        total_questions: retryQuestions.length,
        questions: retryQuestions
    };

    currentIndex = 0;
    userAnswers = {};
    flaggedQuestions.clear();
    streak = 0;
    updateStreakUI();
    currentEvaluation = null;

    document.getElementById('totalQDisplay').textContent = retryQuestions.length;
    document.getElementById('examPaperTitle').textContent = currentPaper.title;

    startTimer();
    renderQuestQuestion();
    renderExamQuestion();
    renderQuestionGrid();
    switchTab('quest');

    window.soundEngine.playTap();
}

// --- Load History ---
async function loadPracticeHistory() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const container = document.getElementById('historyTableContainer');
        if (!container) return;

        if (!data.history || data.history.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No saved practice sessions yet. Complete your first paper!</p>`;
            return;
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 0.5rem;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left; color: var(--text-muted);">
                        <th style="padding: 0.5rem;">Date & Time</th>
                        <th style="padding: 0.5rem;">Questions</th>
                        <th style="padding: 0.5rem;">Score</th>
                        <th style="padding: 0.5rem;">Accuracy</th>
                        <th style="padding: 0.5rem;">Badge</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.history.forEach(h => {
            html += `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.6rem 0.5rem;">${h.timestamp}</td>
                    <td style="padding: 0.6rem 0.5rem;">${h.total_questions} Qs</td>
                    <td style="padding: 0.6rem 0.5rem;"><span style="color:#15803d; font-weight:700;">${h.rights} ✅</span> / <span style="color:#b91c1c; font-weight:700;">${h.wrongs} ❌</span></td>
                    <td style="padding: 0.6rem 0.5rem; font-weight: 700;">${h.accuracy}%</td>
                    <td style="padding: 0.6rem 0.5rem;">${h.badge}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (e) {
        console.error('Error loading history:', e);
    }
}

async function clearHistory() {
    if (confirm('Are you sure you want to clear practice history?')) {
        await fetch('/api/history/clear', { method: 'POST' });
        loadPracticeHistory();
    }
}

// --- Paper Generator Modal ---
function openGeneratorModal() {
    document.getElementById('generatorModal').classList.add('open');
    window.soundEngine.playTap();
}

function closeGeneratorModal() {
    document.getElementById('generatorModal').classList.remove('open');
}

function applyNewPaper() {
    const count = parseInt(document.getElementById('genCountSelect').value, 10);
    const mode = document.getElementById('genModeSelect').value;

    const levels = [];
    if (document.getElementById('chkLvlBasic').checked) levels.push('basic');
    if (document.getElementById('chkLvlMedium').checked) levels.push('medium');
    if (document.getElementById('chkLvlAdvance').checked) levels.push('advance');

    const ops = [];
    if (document.getElementById('chkOpAdd').checked) ops.push('addition');
    if (document.getElementById('chkOpSub').checked) ops.push('subtraction');
    if (document.getElementById('chkOpMul').checked) ops.push('multiplication');
    if (document.getElementById('chkOpDiv').checked) ops.push('division');

    if (levels.length === 0 || ops.length === 0) {
        alert('Please select at least one level and one operation!');
        return;
    }

    closeGeneratorModal();
    fetchNewPaper(count, levels, ops, mode);
}

function openPrintView() {
    const count = document.getElementById('genCountSelect').value;
    window.open(`/print-paper?count=${count}&show_answers=0`, '_blank');
}

// --- Avatar Selection ---
function openAvatarModal() {
    document.getElementById('avatarModal').classList.add('open');
    window.soundEngine.playTap();
}

function closeAvatarModal() {
    document.getElementById('avatarModal').classList.remove('open');
}

function setAvatar(emoji, name, color) {
    document.getElementById('currentAvatarEmoji').textContent = emoji;
    document.getElementById('currentAvatarName').textContent = name;
    closeAvatarModal();
    window.soundEngine.playStreak();
}

// --- Sound Toggle ---
function toggleSound() {
    isSoundEnabled = window.soundEngine.toggle();
    const btn = document.getElementById('btn-sound-toggle');
    btn.textContent = isSoundEnabled ? '🔊' : '🔇';
}

// --- Scratchpad Canvas Logic ---
let scratchCtx = null;
let isDrawing = false;
let scratchTool = 'pencil';

function initScratchpad() {
    const canvas = document.getElementById('scratchCanvas');
    if (!canvas) return;

    scratchCtx = canvas.getContext('2d');

    // Resize canvas resolution
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth || 360;
        canvas.height = canvas.parentElement.clientHeight - 80 || 400;
        scratchCtx.lineCap = 'round';
        scratchCtx.lineJoin = 'round';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    // Touch events for touchscreens/tablets
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        startDraw({ clientX: touch.clientX, clientY: touch.clientY, rect });
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        draw({ clientX: touch.clientX, clientY: touch.clientY, rect });
    }, { passive: false });

    window.addEventListener('touchend', stopDraw);
}

function getCanvasPos(e) {
    const canvas = document.getElementById('scratchCanvas');
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDraw(e) {
    isDrawing = true;
    const pos = getCanvasPos(e);
    scratchCtx.beginPath();
    scratchCtx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);

    if (scratchTool === 'pencil') {
        scratchCtx.globalCompositeOperation = 'source-over';
        scratchCtx.strokeStyle = '#1e293b';
        scratchCtx.lineWidth = 2.5;
    } else if (scratchTool === 'highlighter') {
        scratchCtx.globalCompositeOperation = 'multiply';
        scratchCtx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        scratchCtx.lineWidth = 14;
    } else if (scratchTool === 'eraser') {
        scratchCtx.globalCompositeOperation = 'destination-out';
        scratchCtx.lineWidth = 22;
    }

    scratchCtx.lineTo(pos.x, pos.y);
    scratchCtx.stroke();
}

function stopDraw() {
    isDrawing = false;
}

function setScratchTool(tool) {
    scratchTool = tool;
    document.querySelectorAll('.scratch-tool-btn').forEach(b => b.classList.remove('active'));
    if (tool === 'pencil') document.getElementById('toolPencil').classList.add('active');
    if (tool === 'highlighter') document.getElementById('toolHighlighter').classList.add('active');
    if (tool === 'eraser') document.getElementById('toolEraser').classList.add('active');
}

function clearScratchpad() {
    const canvas = document.getElementById('scratchCanvas');
    if (scratchCtx && canvas) {
        scratchCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function toggleScratchpad() {
    const drawer = document.getElementById('scratchpadDrawer');
    drawer.classList.toggle('hidden');
    window.soundEngine.playTap();
}

// --- Confetti Celebration Engine ---
let confettiParticles = [];
let confettiAnimId = null;

function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
    confettiParticles = [];

    for (let i = 0; i < 90; i++) {
        confettiParticles.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
            y: window.innerHeight / 2 - 100,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.9) * 18,
            size: Math.random() * 8 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 12,
            opacity: 1
        });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = 0;

        confettiParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            p.rotation += p.vRot;
            p.opacity -= 0.012;

            if (p.opacity > 0) {
                active++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (active > 0) {
            confettiAnimId = requestAnimationFrame(animateConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    animateConfetti();
}
