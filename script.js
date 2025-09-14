// DataBack Zetamac core functionality (Alpha)
// Pure client-side implementation; uses localStorage for session history.

(function(){
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const settingsForm = document.getElementById('settingsForm');
  const sessionSection = document.getElementById('session');
  const settingsSection = document.getElementById('settings');
  const resultsSection = document.getElementById('results');
  const localStatsSection = document.getElementById('localStats');
  const answerInput = document.getElementById('answerInput');
  const timeRemainingEl = document.getElementById('timeRemaining');
  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const leftOpEl = document.getElementById('leftOperand');
  const rightOpEl = document.getElementById('rightOperand');
  const operatorEl = document.getElementById('operator');
  const feedbackEl = document.getElementById('feedback');
  const summaryEl = document.getElementById('summary');
  const statsListEl = document.getElementById('statsList');
  const durationSelect = document.getElementById('duration');
  const rangeMinInput = document.getElementById('rangeMin');
  const rangeMaxInput = document.getElementById('rangeMax');

  let state = null;
  let tickTimer = null;

  function init(){
    loadLocalSessions();
    startBtn.addEventListener('click', startSession);
    restartBtn.addEventListener('click', resetToSettings);
    answerInput.addEventListener('input', onAnswerInput);
    answerInput.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        // force evaluation if user presses enter (for multi-digit or slow typing)
        checkAnswer();
      }
    });
  }

  function startSession(){
    const ops = [...settingsForm.querySelectorAll('input[name="ops"]:checked')].map(cb=>cb.value);
    if(ops.length === 0){
      alert('Select at least one operation');
      return;
    }
    const min = parseInt(rangeMinInput.value, 10);
    const max = parseInt(rangeMaxInput.value, 10);
    if(isNaN(min)||isNaN(max)||min>max){
      alert('Invalid range');
      return;
    }
    const duration = parseInt(durationSelect.value,10) || 120;

    state = {
      started: Date.now(),
      duration,
      endTime: Date.now() + duration*1000,
      score: 0,
      streak: 0,
      maxStreak: 0,
      totalAnswered: 0,
      correct: 0,
      incorrect: 0,
      problems: [], // {l, r, op, answer, correct, time}
      ops,
      min,
      max,
      current: null
    };

    settingsSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    sessionSection.classList.remove('hidden');
    feedbackEl.textContent = '';
    scoreEl.textContent = '0';
    streakEl.textContent = '0';

    nextProblem();
    answerInput.value='';
    answerInput.focus();

    if(tickTimer) clearInterval(tickTimer);
    updateTime();
    tickTimer = setInterval(()=>{
      updateTime();
    },100);
  }

  function updateTime(){
    if(!state) return;
    const now = Date.now();
    const remainingMs = state.endTime - now;
    const remaining = Math.max(0, remainingMs/1000);
    timeRemainingEl.textContent = remaining.toFixed(1);
    if(remainingMs <=0){
      endSession();
    }
  }

  function randInt(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
  }

  function generateProblem(){
    const op = state.ops[randInt(0,state.ops.length-1)];
    let l, r, answer;
    switch(op){
      case 'add':
        l = randInt(state.min, state.max);
        r = randInt(state.min, state.max);
        answer = l + r;
        break;
      case 'sub':
        l = randInt(state.min, state.max);
        r = randInt(state.min, state.max);
        // to avoid negatives if you want typical Zetamac style choose ordering
        if(l < r){ [l, r] = [r, l]; }
        answer = l - r;
        break;
      case 'mul':
        l = randInt(state.min, state.max);
        r = randInt(state.min, state.max);
        answer = l * r;
        break;
      case 'div':
        // ensure integer division: pick answer & divisor then multiply
        r = randInt(Math.max(1,state.min), Math.max(1,state.max));
        answer = randInt(state.min, state.max);
        l = r * answer;
        if(l < state.min) l = state.min; // fallback though unlikely
        break;
      default:
        l = 0; r = 0; answer = 0;
    }
    return { l, r, op, answer };
  }

  function opSymbol(op){
    switch(op){
      case 'add': return '+';
      case 'sub': return '−';
      case 'mul': return '×';
      case 'div': return '÷';
      default: return '?';
    }
  }

  function nextProblem(){
    state.current = generateProblem();
    leftOpEl.textContent = state.current.l;
    rightOpEl.textContent = state.current.r;
    operatorEl.textContent = opSymbol(state.current.op);
    answerInput.value='';
  }

  function onAnswerInput(){
    // For speed, if the typed value equals answer, advance automatically
    const val = answerInput.value.trim();
    if(val === '') return; // wait for digits
    if(/^-?\d+$/.test(val)){
      if(parseInt(val,10) === state.current.answer){
        registerAnswer(true);
      }
    }
  }

  function checkAnswer(){
    const val = answerInput.value.trim();
    if(!/^-?\d+$/.test(val)) return; // ignore non-number
    const isCorrect = parseInt(val,10) === state.current.answer;
    registerAnswer(isCorrect);
  }

  function registerAnswer(isCorrect){
    const p = state.current;
    const record = {
      l: p.l, r: p.r, op: p.op, answer: p.answer,
      given: isCorrect ? p.answer : parseInt(answerInput.value.trim(),10),
      correct: isCorrect,
      t: Date.now() - state.started
    };
    state.problems.push(record);
    state.totalAnswered++;
    if(isCorrect){
      state.correct++;
      state.score++;
      state.streak++;
      if(state.streak>state.maxStreak) state.maxStreak = state.streak;
      feedbackEl.textContent = 'Correct';
      feedbackEl.className='ok';
    } else {
      state.incorrect++;
      state.streak = 0;
      feedbackEl.textContent = 'Incorrect (Ans: '+p.answer+')';
      feedbackEl.className='err';
    }
    scoreEl.textContent = state.score;
    streakEl.textContent = state.streak;
    nextProblem();
  }

  function endSession(){
    if(tickTimer){
      clearInterval(tickTimer);
      tickTimer = null;
    }
    sessionSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    const accuracy = state.totalAnswered ? (state.correct/state.totalAnswered*100).toFixed(1) : '0.0';
    const durationActual = ( (Date.now()-state.started)/1000 ).toFixed(1);
    summaryEl.innerHTML = `
      <p><strong>Score:</strong> ${state.score}</p>
      <p><strong>Duration:</strong> ${durationActual}s (target ${state.duration}s)</p>
      <p><strong>Answered:</strong> ${state.totalAnswered}</p>
      <p><strong>Correct:</strong> ${state.correct}</p>
      <p><strong>Incorrect:</strong> ${state.incorrect}</p>
      <p><strong>Accuracy:</strong> ${accuracy}%</p>
      <p><strong>Max Streak:</strong> ${state.maxStreak}</p>
    `;
    persistSession();
    loadLocalSessions();
  }

  function resetToSettings(){
    resultsSection.classList.add('hidden');
    settingsSection.classList.remove('hidden');
    state = null;
  }

  // Local storage
  const LS_KEY = 'dbz_sessions_v1';
  function loadLocalSessions(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw){
        statsListEl.textContent = 'No sessions yet.';
        return;
      }
      const list = JSON.parse(raw);
      if(!Array.isArray(list) || list.length===0){
        statsListEl.textContent = 'No sessions yet.';
        return;
      }
      // newest first
      const items = list.slice().reverse().slice(0,25).map(s => {
        const acc = s.totalAnswered ? (s.correct/s.totalAnswered*100).toFixed(0) : '0';
        const date = new Date(s.started).toLocaleString();
        return `<div class="session-item"><strong>${s.score}</strong>score • ${acc}% acc • ${s.totalAnswered} q • ${s.duration}s • <span>${date}</span></div>`;
      });
      statsListEl.innerHTML = items.join('');
    }catch(e){
      console.warn('Failed to load sessions', e);
    }
  }

  function persistSession(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        started: state.started,
        duration: state.duration,
        score: state.score,
        correct: state.correct,
        incorrect: state.incorrect,
        totalAnswered: state.totalAnswered,
        maxStreak: state.maxStreak,
        ops: state.ops,
        min: state.min,
        max: state.max
      });
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    }catch(e){
      console.warn('Failed to persist session', e);
    }
  }

  // Allow space to focus answer quickly
  document.addEventListener('keydown', e => {
    // Space focuses answer only during an active session (results hidden & session visible)
    if(e.code === 'Space' && state && !sessionSection.classList.contains('hidden')){
      e.preventDefault();
      answerInput.focus();
    }
  });

  init();
})();
