// Monkeytype-inspired Zetamac - JavaScript
class ZetamacApp {
  constructor() {
    this.currentPage = 'test';
    this.settings = {
      operations: ['add', 'sub', 'mul', 'div'],
      time: 60,
      range: 'basic',
      theme: 'dark',
      sound: false,
      quickRestart: 'tab',
      ranges: {
        basic: { min: 2, max: 12 },
        medium: { min: 2, max: 100 },
        hard: { min: 2, max: 999 }
      }
    };
    
    this.gameState = {
      isRunning: false,
      timeLeft: 0,
      problemsSolved: 0,
      totalProblems: 0,
      correctAnswers: 0,
      currentProblem: null,
      startTime: null,
      problems: []
    };
    
    this.stats = this.loadStats();
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.updateDisplay();
    this.showPage('test');
  }

  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        this.showPage(page);
      });
    });

    // Configuration buttons
    document.querySelectorAll('.config-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parent = e.target.parentElement;
        const type = parent.parentElement.querySelector('.config-title').textContent;
        
        // Remove active from siblings
        parent.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
        // Add active to clicked button
        e.target.classList.add('active');
        
        // Update settings
        if (type === 'operations') {
          // Handle multiple selection for operations
          this.updateOperations();
        } else if (type === 'time') {
          this.settings.time = parseInt(e.target.dataset.time);
        } else if (type === 'range') {
          this.settings.range = e.target.dataset.range;
        }
      });
    });

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startTest();
    });

    // Answer input
    const answerInput = document.getElementById('answer-input');
    answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submitAnswer();
      }
    });

    // Test control buttons
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.restartTest();
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
      this.endTest();
    });

    // Results buttons
    document.getElementById('try-again-btn').addEventListener('click', () => {
      this.resetToStart();
    });

    // Settings buttons
    document.querySelectorAll('.setting-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parent = e.target.parentElement;
        const setting = parent.previousElementSibling.textContent;
        
        // Remove active from siblings
        parent.querySelectorAll('.setting-btn').forEach(b => b.classList.remove('active'));
        // Add active to clicked button
        e.target.classList.add('active');
        
        // Update settings
        if (setting === 'theme') {
          this.settings.theme = e.target.dataset.theme;
        } else if (setting === 'sound') {
          this.settings.sound = e.target.dataset.sound === 'on';
        } else if (setting === 'quick restart') {
          this.settings.quickRestart = e.target.dataset.restart;
        }
        
        this.saveSettings();
      });
    });

    // Global keyboard events
    document.addEventListener('keydown', (e) => {
      if (!this.gameState.isRunning && this.currentPage === 'test' && 
          document.getElementById('test-config').style.display !== 'none') {
        // Start test on any key when on start screen
        if (e.key !== 'Tab' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Control') {
          this.startTest();
        }
      }
      
      // Quick restart
      if (e.key === 'Tab' && e.shiftKey && this.settings.quickRestart === 'tab') {
        e.preventDefault();
        if (this.gameState.isRunning) {
          this.restartTest();
        }
      }
      
      if (e.key === 'Escape' && this.settings.quickRestart === 'esc') {
        if (this.gameState.isRunning) {
          this.endTest();
        }
      }
    });
  }

  updateOperations() {
    const activeOps = document.querySelectorAll('.config-btn[data-op].active');
    this.settings.operations = Array.from(activeOps).map(btn => btn.dataset.op);
    
    // Ensure at least one operation is selected
    if (this.settings.operations.length === 0) {
      document.querySelector('.config-btn[data-op="add"]').classList.add('active');
      this.settings.operations = ['add'];
    }
  }

  showPage(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `${page}-page`);
    });

    this.currentPage = page;
  }

  generateProblem() {
    const op = this.settings.operations[Math.floor(Math.random() * this.settings.operations.length)];
    const range = this.settings.ranges[this.settings.range];
    
    let a, b, answer, operator;
    
    switch (op) {
      case 'add':
        a = this.randomInt(range.min, range.max);
        b = this.randomInt(range.min, range.max);
        answer = a + b;
        operator = '+';
        break;
      case 'sub':
        a = this.randomInt(range.min, range.max);
        b = this.randomInt(range.min, Math.min(a, range.max));
        answer = a - b;
        operator = '−';
        break;
      case 'mul':
        a = this.randomInt(range.min, Math.min(range.max, 12));
        b = this.randomInt(range.min, Math.min(range.max, 12));
        answer = a * b;
        operator = '×';
        break;
      case 'div':
        b = this.randomInt(range.min, Math.min(range.max, 12));
        answer = this.randomInt(range.min, Math.min(range.max, 12));
        a = b * answer;
        operator = '÷';
        break;
    }
    
    return { a, b, answer, operator, operation: op };
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  startTest() {
    this.gameState = {
      isRunning: true,
      timeLeft: this.settings.time,
      problemsSolved: 0,
      totalProblems: 0,
      correctAnswers: 0,
      currentProblem: null,
      startTime: Date.now(),
      problems: []
    };

    this.hideElement('test-config');
    this.hideElement('start-test');
    this.showElement('test-interface');
    
    this.generateNewProblem();
    this.startTimer();
    
    // Focus the input
    setTimeout(() => {
      document.getElementById('answer-input').focus();
    }, 100);
  }

  generateNewProblem() {
    this.gameState.currentProblem = this.generateProblem();
    this.gameState.totalProblems++;
    
    document.getElementById('left-operand').textContent = this.gameState.currentProblem.a;
    document.getElementById('operator').textContent = this.gameState.currentProblem.operator;
    document.getElementById('right-operand').textContent = this.gameState.currentProblem.b;
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();
  }

  submitAnswer() {
    const input = document.getElementById('answer-input');
    const userAnswer = parseInt(input.value);
    
    if (isNaN(userAnswer)) return;
    
    const isCorrect = userAnswer === this.gameState.currentProblem.answer;
    
    this.gameState.problems.push({
      ...this.gameState.currentProblem,
      userAnswer,
      isCorrect,
      timeSpent: Date.now() - this.gameState.startTime
    });
    
    if (isCorrect) {
      this.gameState.correctAnswers++;
      this.gameState.problemsSolved++;
    }
    
    this.updateTestStats();
    
    if (this.gameState.isRunning) {
      this.generateNewProblem();
    }
  }

  updateTestStats() {
    document.getElementById('problems-solved').textContent = this.gameState.problemsSolved;
  }

  startTimer() {
    const timerInterval = setInterval(() => {
      this.gameState.timeLeft--;
      document.getElementById('timer').textContent = this.gameState.timeLeft;
      
      if (this.gameState.timeLeft <= 0) {
        clearInterval(timerInterval);
        this.endTest();
      }
    }, 1000);
    
    this.gameState.timerInterval = timerInterval;
  }

  restartTest() {
    this.endTest();
    setTimeout(() => this.startTest(), 100);
  }

  endTest() {
    this.gameState.isRunning = false;
    
    if (this.gameState.timerInterval) {
      clearInterval(this.gameState.timerInterval);
    }
    
    this.hideElement('test-interface');
    this.showResults();
    this.saveStats();
  }

  showResults() {
    const duration = this.settings.time - this.gameState.timeLeft;
    const ppm = duration > 0 ? Math.round((this.gameState.problemsSolved / duration) * 60) : 0;
    const accuracy = this.gameState.totalProblems > 0 ? 
      Math.round((this.gameState.correctAnswers / this.gameState.totalProblems) * 100) : 0;
    
    document.getElementById('final-score').textContent = ppm;
    document.getElementById('total-problems').textContent = this.gameState.problemsSolved;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('test-duration').textContent = duration + 's';
    
    this.showElement('test-results');
  }

  resetToStart() {
    this.hideElement('test-results');
    this.showElement('test-config');
    this.showElement('start-test');
  }

  saveStats() {
    const sessionData = {
      score: this.gameState.problemsSolved,
      duration: this.settings.time - this.gameState.timeLeft,
      accuracy: this.gameState.totalProblems > 0 ? 
        Math.round((this.gameState.correctAnswers / this.gameState.totalProblems) * 100) : 0,
      operations: [...this.settings.operations],
      range: this.settings.range,
      timestamp: Date.now()
    };
    
    this.stats.sessions.push(sessionData);
    this.stats.totalTests++;
    this.stats.totalTime += sessionData.duration;
    
    if (sessionData.score > this.stats.bestScore) {
      this.stats.bestScore = sessionData.score;
    }
    
    // Calculate average
    const validSessions = this.stats.sessions.filter(s => s.score > 0);
    this.stats.avgScore = validSessions.length > 0 ? 
      Math.round(validSessions.reduce((sum, s) => sum + s.score, 0) / validSessions.length) : 0;
    
    localStorage.setItem('zetamac-stats', JSON.stringify(this.stats));
    this.updateDisplay();
  }

  loadStats() {
    const stored = localStorage.getItem('zetamac-stats');
    return stored ? JSON.parse(stored) : {
      bestScore: 0,
      avgScore: 0,
      totalTests: 0,
      totalTime: 0,
      sessions: []
    };
  }

  saveSettings() {
    localStorage.setItem('zetamac-settings', JSON.stringify(this.settings));
  }

  loadSettings() {
    const stored = localStorage.getItem('zetamac-settings');
    if (stored) {
      this.settings = { ...this.settings, ...JSON.parse(stored) };
    }
  }

  updateDisplay() {
    document.getElementById('bestScore').textContent = this.stats.bestScore;
    document.getElementById('avgScore').textContent = this.stats.avgScore;
    document.getElementById('total-tests').textContent = this.stats.totalTests;
    document.getElementById('total-time').textContent = Math.round(this.stats.totalTime / 60) + 'm';
  }

  showElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('hidden');
    }
  }

  hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add('hidden');
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.zetamacApp = new ZetamacApp();
});

  function activateTab(tabEl){
    [dom.tabHome, dom.tabTest, dom.tabStats].forEach(btn=>{
      btn.classList.toggle('active', btn===tabEl);
      btn.setAttribute('aria-selected', btn===tabEl? 'true':'false');
    });
    // Enhanced animated slider indicator
    const bar = document.querySelector('.tabbar-enhanced');
    if(bar){
      let slider = bar.querySelector('.tab-slider-enhanced');
      if(!slider){
        slider = document.createElement('div');
        slider.className='tab-slider-enhanced';
        bar.appendChild(slider);
      }
      const rect = tabEl.getBoundingClientRect();
      const parentRect = bar.getBoundingClientRect();
      const left = rect.left - parentRect.left - 6; // Account for container padding
      slider.style.width = rect.width + 'px';
      slider.style.transform = `translateX(${left}px)`;
    }
  }

  function navigateTab(target){
    switch(target){
      case 'homeView': 
        switchView('home'); 
        activateTab(dom.tabHome); 
        break;
      case 'sessionView': 
        if(dom.tabTest.disabled) return; 
        switchView('session'); 
        activateTab(dom.tabTest); 
        break;
      case 'statsView': 
        renderAggregates(); 
        renderCharts(); 
        switchView('stats'); 
        activateTab(dom.tabStats); 
        break;
    }
  }

  function startSession(){
    const ops = Array.from(dom.settingsForm.querySelectorAll('input[name="ops"]:checked')).map(c=>c.value);
    if(ops.length===0){ alert('Select at least one operation'); return; }
    const ranges = getRanges();
    const err = validateRanges(ops,ranges); if(err){ alert(err); return; }
    const duration = parseInt(dom.duration.value,10)||120;
    state = {
      started: Date.now(),
      duration,
      endTime: Date.now()+duration*1000,
      score:0, streak:0, maxStreak:0,
      totalAnswered:0, correct:0, incorrect:0,
      problems:[], ops, ranges, current:null,
      // Enhanced analytics
      operationStats: {}, // per-operation statistics
      velocityHistory: [], // problems per second over time
      currentVelocity: 0,
      difficultyDistribution: {},
      restartCount: 0, // track how many times user restarted
      sessionType: 'completed' // 'completed', 'quit', 'restarted', 'timeout'
    };
  dom.tabTest.disabled = false; dom.tabTest.classList.remove('locked');
  navigateTab('sessionView');
    const wrap = document.querySelector('.problem-wrap');
    if(wrap) wrap.classList.remove('inactive');
    dom.answerInput.removeAttribute('disabled');
    dom.feedback.textContent='';
    dom.feedback.className='feedback';
    nextProblem();
    dom.answerInput.value='';
    dom.answerInput.focus();
    if(timer) clearInterval(timer);
    updateTime();
    timer = setInterval(updateTime,100);
  }

  function updateTime(){
    if(!state) return;
    const remMs = state.endTime - Date.now();
    const rem = Math.max(0, remMs/1000);
    dom.timeRemaining.textContent = rem.toFixed(1);
    if(remMs<=0) endSession('timeout');
  }

  function nextProblem(){
    state.current = generateProblem();
    dom.leftOperand.textContent = state.current.l;
    dom.rightOperand.textContent = state.current.r;
    dom.operator.textContent = opSymbol(state.current.op);
    dom.answerInput.value='';
  }

  function onAnswerInput(){
    if(!state || !state.current) return;
    const val = dom.answerInput.value.trim();
    if(!/^[-]?\d+$/.test(val)) return;
    if(parseInt(val,10) === state.current.answer){
      registerAnswer(true, state.current.answer);
    }
  }
  function forceSubmit(){
    if(!state || !state.current) return;
    const val = dom.answerInput.value.trim();
    if(!/^[-]?\d+$/.test(val)) return;
    const num = parseInt(val,10);
    registerAnswer(num===state.current.answer, num);
  }

  function registerAnswer(isCorrect, given){
    const p = state.current;
    const problemTime = Date.now()-state.started;
    const timeSinceLast = state.problems.length > 0 ? problemTime - state.problems[state.problems.length-1].totalTime : problemTime;
    const difficulty = calculateDifficulty(p.l, p.r, p.op);
    
    const rec = { 
      l:p.l, r:p.r, op:p.op, answer:p.answer, given, correct:isCorrect, 
      t:timeSinceLast, // time for this specific problem
      totalTime:problemTime, // cumulative time since session start
      difficulty: difficulty,
      timestamp: Date.now()
    };
    
    state.problems.push(rec); 
    state.totalAnswered++;
    
    // Track per-operation stats
    if(!state.operationStats[p.op]) {
      state.operationStats[p.op] = {correct:0, incorrect:0, totalTime:0, count:0, avgTime:0, minTime:Infinity, maxTime:0};
    }
    const opStats = state.operationStats[p.op];
    opStats.count++;
    opStats.totalTime += timeSinceLast;
    opStats.avgTime = opStats.totalTime / opStats.count;
    opStats.minTime = Math.min(opStats.minTime, timeSinceLast);
    opStats.maxTime = Math.max(opStats.maxTime, timeSinceLast);
    
    // Track difficulty distribution
    state.difficultyDistribution[difficulty] = (state.difficultyDistribution[difficulty] || 0) + 1;
    
    if(isCorrect){ 
      state.correct++; state.score++; state.streak++; 
      opStats.correct++;
      if(state.streak>state.maxStreak) state.maxStreak=state.streak; 
      dom.feedback.textContent='Correct'; 
      dom.feedback.className='feedback ok'; 
    } else { 
      state.incorrect++; state.streak=0; 
      opStats.incorrect++;
      dom.feedback.textContent='Incorrect • '+p.answer; 
      dom.feedback.className='feedback err'; 
    }
    
    // Update velocity metrics (problems per second)
    const sessionTimeSeconds = problemTime / 1000;
    state.currentVelocity = state.totalAnswered / sessionTimeSeconds;
    state.velocityHistory.push({time: sessionTimeSeconds, velocity: state.currentVelocity});
    
    dom.score.textContent = state.score;
    dom.streak.textContent = state.streak;
    if(state.totalAnswered>0){ dom.accuracyLive.textContent = (state.correct/state.totalAnswered*100).toFixed(0)+'%'; }
    nextProblem();
  }

  // Calculate problem difficulty based on numbers and operation
  function calculateDifficulty(l, r, op) {
    let base = 1;
    switch(op) {
      case '+': base = Math.max(l, r) / 10; break;
      case '-': base = Math.max(l, r) / 10; break;
      case '*': base = (l * r) / 50; break;
      case '/': base = (l / r) / 5; break;
    }
    return Math.min(10, Math.max(1, Math.round(base)));
  }

  function endSession(sessionType = 'completed'){
    if(!state) return;
    if(timer){ clearInterval(timer); timer=null; }
    state.sessionType = sessionType;
    buildSummary();
    persistSession();
    loadHistory();
    renderAggregates();
    switchView('results');
  }

  function buildSummary(){
    const acc = state.totalAnswered? (state.correct/state.totalAnswered*100).toFixed(1)+'%':'0%';
    const durActual = ((Date.now()-state.started)/1000).toFixed(1)+'s';
    const avgTimePerProblem = state.totalAnswered ? ((Date.now()-state.started)/1000/state.totalAnswered).toFixed(2) : 0;
    
    // Operation breakdown for this session
    const opBreakdown = Object.entries(state.operationStats).map(([op, stats]) => {
      const acc = stats.count ? (stats.correct/stats.count*100).toFixed(0) : 0;
      return `<div class="session-op-stat">
        <span class="op">${op}</span>: ${stats.correct}/${stats.count} (${acc}%) • ${(stats.avgTime/1000).toFixed(2)}s avg
      </div>`;
    }).join('');
    
    const sessionTypeText = {
      'completed': '✅ Completed',
      'timeout': '⏰ Time Up', 
      'quit': '🚪 Quit',
      'restarted': '🔄 Restarted'
    }[state.sessionType] || 'Finished';
    
    dom.summary.innerHTML = `
      <div class="summary-header">
        <h3>${sessionTypeText}</h3>
        ${state.restartCount > 0 ? `<span class="restart-count">Restarts: ${state.restartCount}</span>` : ''}
      </div>
      <div class="summary-main">
        ${[
          statCard('Score', state.score),
          statCard('Answered', state.totalAnswered),
          statCard('Correct', state.correct),
          statCard('Incorrect', state.incorrect),
          statCard('Accuracy', acc),
          statCard('Max Streak', state.maxStreak),
          statCard('Duration', durActual+' / '+state.duration+'s'),
          statCard('Avg/Problem', avgTimePerProblem+'s'),
          statCard('Final Velocity', state.currentVelocity.toFixed(2)+' pps')
        ].join('')}
      </div>
      ${opBreakdown ? `<div class="summary-operations">
        <h4>Operation Performance</h4>
        ${opBreakdown}
      </div>` : ''}
    `;
  }
  function statCard(label,val){ return '<div class="stat"><h4>'+label+'</h4><div class="val">'+val+'</div></div>'; }

  function persistSession(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const list = raw? JSON.parse(raw):[];
      
      // Calculate advanced metrics before saving
      const sessionDuration = (Date.now() - state.started) / 1000;
      const avgTimePerProblem = state.totalAnswered > 0 ? sessionDuration / state.totalAnswered : 0;
      
      list.push({ 
        started:state.started,
        duration:state.duration,
        score:state.score,
        correct:state.correct,
        incorrect:state.incorrect,
        totalAnswered:state.totalAnswered,
        maxStreak:state.maxStreak,
        ops:state.ops,
        ranges:state.ranges,
        // Enhanced analytics
        operationStats: state.operationStats,
        velocityHistory: state.velocityHistory,
        currentVelocity: state.currentVelocity,
        difficultyDistribution: state.difficultyDistribution,
        restartCount: state.restartCount,
        sessionType: state.sessionType,
        actualDuration: sessionDuration,
        avgTimePerProblem: avgTimePerProblem,
        problems: state.problems // Store individual problem data for calculus
      });
      
      localStorage.setItem(LS_KEY, JSON.stringify(list));
      updateCookieAggregates(list);
    }catch(e){ console.warn('Persist failed', e); }
  }

  function loadHistory(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw){ dom.statsList.textContent='No sessions yet.'; return; }
      const list = JSON.parse(raw);
      if(!Array.isArray(list)||!list.length){ dom.statsList.textContent='No sessions yet.'; return; }
      const items = list.slice().reverse().slice(0,30).map(s=>{
        const acc = s.totalAnswered? (s.correct/s.totalAnswered*100).toFixed(0):'0';
        const date = new Date(s.started).toLocaleString();
        const sessionIcon = {
          'completed': '✅',
          'timeout': '⏰', 
          'quit': '🚪',
          'restarted': '🔄'
        }[s.sessionType] || '';
        const restartBadge = s.restartCount > 0 ? `<span class="restart-badge">R:${s.restartCount}</span>` : '';
        const avgTime = s.avgTimePerProblem ? `${s.avgTimePerProblem.toFixed(1)}s/q` : '';
        return `<div class="session-item enhanced">
          <div class="session-main">
            <strong>${sessionIcon} ${s.score}</strong>
            <span class="accuracy">${acc}%</span>
            <span class="questions">${s.totalAnswered}q</span>
            ${avgTime ? `<span class="avg-time">${avgTime}</span>` : ''}
          </div>
          <div class="session-meta">
            <span class="date">${date}</span>
            ${restartBadge}
          </div>
        </div>`;
      });
      dom.statsList.innerHTML = items.join('');
      // Hero quick stats
      const qsBest = document.getElementById('qsBest');
      if(qsBest){
        const qsAvg = document.getElementById('qsAvg');
        const qsCount = document.getElementById('qsCount');
        const best = Math.max(...list.map(s=>s.score));
        const avg = list.reduce((a,s)=>a+s.score,0)/list.length;
        qsBest.textContent = best.toString();
        if(qsAvg) qsAvg.textContent = Math.round(avg).toString();
        if(qsCount) qsCount.textContent = list.length.toString();
      }
    }catch(e){ console.warn('History load failed', e); }
  }

  /* Aggregates & Charts */
  function computeAggregates(list){
    const totalTests = list.length;
    let totalTimeSec = 0, totalCorrect = 0, totalAnswered = 0;
    const scoreHistory = [];
    const bins = {}; // dynamic '0-10'
    const testsPerDay = {};
    const timePerDay = {};
    
    // Enhanced analytics
    let totalRestarts = 0, completedTests = 0, quitTests = 0, timeoutTests = 0;
    const operationTotals = {'add': {correct:0, count:0, totalTime:0}, 'sub': {correct:0, count:0, totalTime:0}, 
                            'mul': {correct:0, count:0, totalTime:0}, 'div': {correct:0, count:0, totalTime:0}};
    const difficultyTotals = {};
    const velocityData = [];
    let allProblems = [];
    
    list.forEach(s=>{
      totalTimeSec += s.actualDuration || s.duration;
      totalCorrect += s.correct;
      totalAnswered += s.totalAnswered;
      
      // Session type tracking
      totalRestarts += s.restartCount || 0;
      switch(s.sessionType) {
        case 'completed': completedTests++; break;
        case 'quit': quitTests++; break;
        case 'timeout': timeoutTests++; break;
        case 'restarted': /* counted in restarts */ break;
      }
      
      // Aggregate operation stats
      if(s.operationStats) {
        Object.entries(s.operationStats).forEach(([op, stats]) => {
          if(operationTotals[op]) {
            operationTotals[op].correct += stats.correct;
            operationTotals[op].count += stats.count;
            operationTotals[op].totalTime += stats.totalTime;
          }
        });
      }
      
      // Aggregate difficulty distribution
      if(s.difficultyDistribution) {
        Object.entries(s.difficultyDistribution).forEach(([diff, count]) => {
          difficultyTotals[diff] = (difficultyTotals[diff] || 0) + count;
        });
      }
      
      // Collect velocity data
      if(s.velocityHistory && s.velocityHistory.length > 0) {
        velocityData.push(...s.velocityHistory.map(v => ({...v, sessionStart: s.started})));
      }
      
      // Collect all problems for calculus
      if(s.problems) {
        allProblems.push(...s.problems.map(p => ({...p, sessionStart: s.started})));
      }
      
      const norm = s.score * (120 / s.duration);
      scoreHistory.push({ ts: s.started, norm: +norm.toFixed(2), raw: s.score });
      const binFloor = Math.floor(norm/10)*10;
      const key = binFloor+ '-' + (binFloor+10);
      bins[key] = (bins[key]||0)+1;
      const day = new Date(s.started).toISOString().slice(0,10);
      testsPerDay[day] = (testsPerDay[day]||0)+1;
      timePerDay[day] = (timePerDay[day]||0)+ (s.actualDuration || s.duration);
    });
    
    scoreHistory.sort((a,b)=>a.ts-b.ts);
    const avgPps = totalTimeSec? (totalCorrect/totalTimeSec).toFixed(2):'0.00';
    
    // Calculate calculus-based metrics
    const calculus = calculateAdvancedMetrics(allProblems, scoreHistory, velocityData);
    
    return { 
      totalTests, totalTimeSec, totalCorrect, totalAnswered, avgPps, scoreHistory, bins, testsPerDay, timePerDay,
      // Enhanced metrics
      totalRestarts, completedTests, quitTests, timeoutTests, operationTotals, difficultyTotals, velocityData, calculus
    };
  }

  // Advanced calculus-based metrics
  function calculateAdvancedMetrics(problems, scoreHistory, velocityData) {
    if(problems.length < 2) return {improvementRate: 0, velocityTrend: 0, difficultyTrend: 0, learningCurve: 0};
    
    // Calculate improvement rate (derivative of performance over time)
    const improvementRate = calculateDerivative(scoreHistory.map(p => p.norm), scoreHistory.map(p => p.ts));
    
    // Calculate velocity trend (how speed changes over time)
    const velocityTrend = velocityData.length > 1 ? 
      calculateDerivative(velocityData.map(v => v.velocity), velocityData.map(v => v.time)) : 0;
    
    // Learning curve analysis (accuracy improvement over problem count)
    const accuracyOverTime = calculateMovingAverage(problems.map(p => p.correct ? 1 : 0), 10);
    const learningCurve = accuracyOverTime.length > 1 ? 
      (accuracyOverTime[accuracyOverTime.length-1] - accuracyOverTime[0]) / accuracyOverTime.length : 0;
    
    // Response time trend (how speed improves per problem type)
    const timesByDifficulty = {};
    problems.forEach(p => {
      if(!timesByDifficulty[p.difficulty]) timesByDifficulty[p.difficulty] = [];
      timesByDifficulty[p.difficulty].push(p.t);
    });
    
    return {
      improvementRate: improvementRate * 86400000, // per day
      velocityTrend: velocityTrend * 3600000, // per hour  
      learningCurve: learningCurve * 100, // percentage
      difficultyTrend: Object.keys(timesByDifficulty).length
    };
  }

  // Calculate derivative (rate of change)
  function calculateDerivative(yValues, xValues) {
    if(yValues.length < 2) return 0;
    let sum = 0;
    for(let i = 1; i < yValues.length; i++) {
      const dy = yValues[i] - yValues[i-1];
      const dx = xValues[i] - xValues[i-1];
      sum += dx !== 0 ? dy / dx : 0;
    }
    return sum / (yValues.length - 1);
  }

  // Calculate moving average
  function calculateMovingAverage(data, windowSize) {
    const result = [];
    for(let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      result.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    return result;
  }

  function renderAggregates(){
    try{
      const raw = localStorage.getItem(LS_KEY); 
      if(!raw){ 
        dom.aggregateMetrics.innerHTML = '<div class="no-data"><h3>🎯 No sessions yet</h3><p>Complete some tests to see your analytics!</p></div>'; 
        return; 
      }
      const list = JSON.parse(raw); 
      if(!Array.isArray(list)||!list.length){ 
        dom.aggregateMetrics.innerHTML = '<div class="no-data"><h3>🎯 No sessions yet</h3><p>Complete some tests to see your analytics!</p></div>'; 
        return; 
      }
      
      const ag = computeAggregates(list);
      const totalMinutes = (ag.totalTimeSec/60).toFixed(1);
      const avgScore = ag.scoreHistory && ag.scoreHistory.length > 0 ? 
        (ag.scoreHistory.reduce((a,c)=>a+c.raw,0)/ag.scoreHistory.length).toFixed(1) : '0';
      
      // Calculate operation-specific metrics
      const opMetrics = Object.entries(ag.operationTotals || {}).map(([op, stats]) => {
        const acc = stats.count ? (stats.correct/stats.count*100).toFixed(1) : 0;
        const avgTime = stats.count ? (stats.totalTime/stats.count/1000).toFixed(2) : 0;
        const symbol = opSymbol(op); // Convert 'add' -> '+', etc.
        return `<div class="operation-metric">
          <span class="op-symbol">${symbol}</span>
          <span class="op-accuracy">${acc}%</span>
          <span class="op-time">${avgTime}s avg</span>
        </div>`;
      }).join('');
      
      // Main metrics grid
      const mainMetrics = [
        metricTile('Total Tests', ag.totalTests || 0),
        metricTile('Completed', ag.completedTests || 0),
        metricTile('Restarts', ag.totalRestarts || 0),
        metricTile('Total Time (m)', totalMinutes),
        metricTile('Avg Score', avgScore),
        metricTile('Avg PPS', ag.avgPps || '0.00'),
        metricTile('Total Correct', ag.totalCorrect || 0),
        metricTile('Total Answered', ag.totalAnswered || 0),
        metricTile('Improvement Rate', (ag.calculus?.improvementRate || 0).toFixed(2) + '/day'),
        metricTile('Speed Trend', (ag.calculus?.velocityTrend || 0).toFixed(3) + '/hr'),
        metricTile('Learning Curve', (ag.calculus?.learningCurve || 0).toFixed(1) + '%'),
        metricTile('Quit Rate', ag.totalTests ? (ag.quitTests/ag.totalTests*100).toFixed(1)+'%' : '0%')
      ].join('');
      
      dom.aggregateMetrics.innerHTML = `
        <div class="metrics-section">
          <h3>📊 Performance Analytics</h3>
          <div class="metrics-grid">${mainMetrics}</div>
        </div>
        ${opMetrics ? `<div class="metrics-section">
          <h3>⚡ Operation Breakdown</h3>
          <div class="operation-metrics">${opMetrics}</div>
        </div>` : ''}
      `;
    }catch(e){ 
      console.warn('Agg render failed', e); 
      dom.aggregateMetrics.innerHTML = '<div class="error-state"><h3>⚠️ Error loading stats</h3><p>Please try refreshing the page.</p></div>';
    }
  }
  function metricTile(label,val){ return '<div class="metric-tile"><h4>'+label+'</h4><div class="val">'+val+'</div></div>'; }

  function renderCharts(){
    const raw = localStorage.getItem(LS_KEY); if(!raw) return;
    let list = JSON.parse(raw); if(!Array.isArray(list)||!list.length) return;
    const ag = computeAggregates(list);
    drawProgressChart(dom.progressChart, ag.scoreHistory);
    drawDistributionChart(dom.distributionChart, ag.bins);
    drawBars(dom.testsPerDayChart, ag.testsPerDay, 'count');
    drawBars(dom.timePerDayChart, ag.timePerDay, 'minutes');
  }

  function prepCanvas(canvas){
    if(!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const logicalH = rect.height || canvas.height || 200;
    canvas.width = rect.width * dpr;
    canvas.height = logicalH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.font='11px "Inter", system-ui';
    return { ctx, w: rect.width, h: logicalH };
  }

  function drawProgressChart(canvas, points){ if(!canvas || !points.length) return; const cv = prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const margin=36; const xs = points.map(p=>p.ts); const ys = points.map(p=>p.norm); const minY = 0; const rawMax = Math.max(...ys); const headroom = rawMax * 0.15 + 5; const maxY = Math.max(10, Math.ceil((rawMax+headroom)/10)*10); const minX = Math.min(...xs); const maxX = Math.max(...xs); const scaleX = x=> margin + ( (x-minX)/(maxX-minX||1) )*(w-2*margin); const scaleY = y=> h - margin - ( (y-minY)/(maxY-minY||1) )*(h-2*margin);
    const bgGrad = ctx.createLinearGradient(0,0,0,h); bgGrad.addColorStop(0,'rgba(79,156,255,0.12)'); bgGrad.addColorStop(1,'rgba(79,156,255,0.02)'); ctx.fillStyle=bgGrad; ctx.fillRect(0,0,w,h);
    ctx.textAlign='right'; ctx.textBaseline='middle'; const step = Math.max(10, Math.round(maxY/6/10)*10);
    for(let y=0;y<=maxY;y+=step){ const py = scaleY(y); ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(margin,py+0.5); ctx.lineTo(w-margin,py+0.5); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillText(y, margin-8, py); }
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(margin+0.5, margin); ctx.lineTo(margin+0.5, h-margin); ctx.lineTo(w-margin, h-margin+0.5); ctx.stroke();
  // build smoothed path (Catmull-Rom to Bezier approximation)
  function smoothPath(pts){ if(pts.length<3) return pts.map((p,i)=> (i?'L':'M')+scaleX(p.ts)+','+scaleY(p.norm)).join(''); const res=[]; for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i]; const p1=pts[i]; const p2=pts[i+1]; const p3=pts[i+2]||p2; const x1=scaleX(p1.ts), y1=scaleY(p1.norm); const x2=scaleX(p2.ts), y2=scaleY(p2.norm); const cp1x = x1 + (x2 - scaleX(p0.ts))/6; const cp1y = y1 + (y2 - scaleY(p0.norm))/6; const cp2x = x2 - (scaleX(p3.ts) - x1)/6; const cp2y = y2 - (scaleY(p3.norm) - y1)/6; if(i===0) res.push('M'+x1+','+y1); res.push('C'+cp1x+','+cp1y+','+cp2x+','+cp2y+','+x2+','+y2); } return res.join(''); }
  const pathData = smoothPath(points);
  const p = new Path2D(pathData);
  ctx.lineWidth=2.6; ctx.strokeStyle='rgba(79,156,255,0.3)'; ctx.stroke(p);
  ctx.lineWidth=2.1; const grad = ctx.createLinearGradient(0,0,w,0); grad.addColorStop(0,'#4f9cff'); grad.addColorStop(1,'#256dff'); ctx.strokeStyle=grad; ctx.stroke(p);
  const fillGrad = ctx.createLinearGradient(0,margin,0,h-margin); fillGrad.addColorStop(0,'rgba(79,156,255,0.16)'); fillGrad.addColorStop(1,'rgba(79,156,255,0)'); ctx.fillStyle=fillGrad; const areaPath = new Path2D(pathData + 'L'+scaleX(points.at(-1).ts)+','+scaleY(0)+'L'+scaleX(points[0].ts)+','+scaleY(0)+'Z'); ctx.fill(areaPath);
    ctx.fillStyle='#fff'; points.forEach(p=>{ const x=scaleX(p.ts), y=scaleY(p.norm); ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#256dff'; ctx.beginPath(); ctx.arc(x,y,2.1,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; });
  }

  function drawDistributionChart(canvas, bins){ if(!canvas) return; const cv=prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const entries = Object.entries(bins).sort((a,b)=> parseInt(a[0]) - parseInt(b[0])); if(!entries.length) return; const max = Math.max(...entries.map(e=>e[1])); const barW = (w-90)/entries.length; const leftPad=46; const bottomPad=34; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px "Inter", system-ui'; ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(leftPad+0.5,10); ctx.lineTo(leftPad+0.5,h-bottomPad); ctx.lineTo(w-20,h-bottomPad); ctx.stroke(); entries.forEach((e,i)=>{ const [range,count]=e; const x=leftPad + 8 + i*barW; const barH = (count/max)*(h- (bottomPad+40)); const y = (h-bottomPad)-barH; const grad = ctx.createLinearGradient(0,y,0,y+barH); grad.addColorStop(0,'#4f9cff'); grad.addColorStop(1,'rgba(79,156,255,0.12)'); ctx.fillStyle=grad; ctx.beginPath(); const bw = Math.max(18, barW*0.58); const r = 6; ctx.moveTo(x, y+r); ctx.lineTo(x, y+barH-r); ctx.quadraticCurveTo(x, y+barH, x+r, y+barH); ctx.lineTo(x+bw-r, y+barH); ctx.quadraticCurveTo(x+bw, y+barH, x+bw, y+barH-r); ctx.lineTo(x+bw, y+r); ctx.quadraticCurveTo(x+bw, y, x+bw-r, y); ctx.lineTo(x+r, y); ctx.quadraticCurveTo(x, y, x, y+r); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.fillText(count, x+bw/2, y-14); ctx.save(); ctx.translate(x+bw/2, h-16); ctx.rotate(-Math.PI/4.2); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillText(range,0,0); ctx.restore(); }); }

  function drawBars(canvas, obj, mode){ if(!canvas) return; const cv=prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const entries = Object.entries(obj).sort((a,b)=> a[0]<b[0]?-1:1).slice(-30); if(!entries.length) return; const max = Math.max(...entries.map(e=> mode==='minutes'? e[1]/60 : e[1])); const barW=(w-90)/entries.length; const leftPad=46; const bottomPad=34; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px "Inter", system-ui'; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(leftPad+0.5,10); ctx.lineTo(leftPad+0.5,h-bottomPad); ctx.lineTo(w-20,h-bottomPad); ctx.stroke(); entries.forEach((e,i)=>{ let val = mode==='minutes'? e[1]/60 : e[1]; const x=leftPad + 8 + i*barW; const bh = (val/max)*(h-(bottomPad+40)); const y=h-bottomPad-bh; const bw=Math.max(18, barW*0.5); const grad=ctx.createLinearGradient(0,y,0,y+bh); grad.addColorStop(0,'rgba(79,156,255,.85)'); grad.addColorStop(1,'rgba(79,156,255,.25)'); ctx.fillStyle=grad; ctx.beginPath(); const r=6; ctx.moveTo(x,y+r); ctx.lineTo(x,y+bh-r); ctx.quadraticCurveTo(x,y+bh,x+r,y+bh); ctx.lineTo(x+bw-r,y+bh); ctx.quadraticCurveTo(x+bw,y+bh,x+bw,y+bh-r); ctx.lineTo(x+bw,y+r); ctx.quadraticCurveTo(x+bw,y,x+bw-r,y); ctx.lineTo(x+r,y); ctx.quadraticCurveTo(x,y,x,y+r); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.78)'; ctx.fillText(mode==='minutes'? val.toFixed(1):val, x+bw/2, y-12); ctx.save(); ctx.translate(x+bw/2, h-16); ctx.rotate(-Math.PI/4.2); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillText(e[0].slice(5),0,0); ctx.restore(); }); }

  let resizeTO=null; window.addEventListener('resize', ()=>{ if(resizeTO) clearTimeout(resizeTO); resizeTO = setTimeout(()=>{ renderCharts(); }, 180); });

  function updateCookieAggregates(list){ try { const ag = computeAggregates(list); const cookieObj = { totalTests:ag.totalTests, totalTimeSec:ag.totalTimeSec, avgPps:ag.avgPps, lastScore: ag.scoreHistory.at(-1)?.raw || 0, lastUpdated: Date.now() }; const val = encodeURIComponent(JSON.stringify(cookieObj)); document.cookie = 'dbz_stats='+val+';max-age=31536000;path=/;SameSite=Lax'; } catch(e){ /* ignore */ } }

  function resetToSettings(){ 
    switchView('home'); 
    activateTab(dom.tabHome);
    state=null; 
    // Reset test tab to locked state
    dom.tabTest.disabled = true; 
    dom.tabTest.classList.add('locked');
    // Clear any existing timers
    if(timer){ clearInterval(timer); timer=null; }
  }

  function toggleTheme(){ document.body.classList.toggle('light'); localStorage.setItem('dbz_theme', document.body.classList.contains('light')?'light':'dark'); }
  function loadTheme(){ const t = localStorage.getItem('dbz_theme'); if(t==='light') document.body.classList.add('light'); }

  function loadUsername(){
    const cookies = document.cookie.split(';');
    const usernameCookie = cookies.find(c => c.trim().startsWith('dbz_username='));
    if(usernameCookie){
      const username = decodeURIComponent(usernameCookie.split('=')[1]);
      const usernameDisplay = document.getElementById('usernameDisplay');
      if(usernameDisplay && username && username !== 'Guest'){
        usernameDisplay.textContent = username;
      }
    }
  }

  function attachEvents(){
    dom.startBtn.addEventListener('click', startSession);
    dom.restartBtn.addEventListener('click', ()=>{ resetToSettings(); });
    dom.backHome.addEventListener('click', resetToSettings);
    dom.quitBtn.addEventListener('click', ()=>{ endSession('quit'); });
    dom.answerInput.addEventListener('input', onAnswerInput);
    dom.answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') forceSubmit(); });
    document.addEventListener('keydown', e=>{
      // Space to focus answer input during session
      if(e.code==='Space' && state && !dom.sessionView.classList.contains('hidden')){ 
        e.preventDefault(); 
        dom.answerInput.focus(); 
      }
      // Shift+R to restart session
      if(e.shiftKey && e.code==='KeyR' && state){
        e.preventDefault();
        if(confirm('Restart the current session? This will count as a restart in your stats.')){
          state.restartCount++;
          state.sessionType = 'restarted';
          endSession('restarted');
          startSession();
        }
      }
    });
  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.tabHome.addEventListener('click', ()=>navigateTab('homeView'));
  dom.tabTest.addEventListener('click', ()=>navigateTab('sessionView'));
  dom.tabStats.addEventListener('click', ()=>navigateTab('statsView'));
  
  // Username functionality
  const usernameDisplay = document.getElementById('usernameDisplay');
  const usernameInput = document.getElementById('usernameInput');
  const userProfile = document.getElementById('userProfile');
  
  if(usernameDisplay && usernameInput && userProfile){
    // Click to edit username
    usernameDisplay.addEventListener('click', ()=>{
      usernameDisplay.classList.add('hidden');
      usernameInput.classList.remove('hidden');
      usernameInput.value = usernameDisplay.textContent;
      usernameInput.focus();
      usernameInput.select();
    });
    
    // Save username on blur or enter
    const saveUsername = ()=>{
      const newName = usernameInput.value.trim() || 'Guest';
      usernameDisplay.textContent = newName;
      usernameDisplay.classList.remove('hidden');
      usernameInput.classList.add('hidden');
      // Save to cookie
      document.cookie = `dbz_username=${encodeURIComponent(newName)};max-age=31536000;path=/;SameSite=Lax`;
    };
    
    usernameInput.addEventListener('blur', saveUsername);
    usernameInput.addEventListener('keydown', e=>{
      if(e.key === 'Enter') saveUsername();
      if(e.key === 'Escape'){
        usernameInput.classList.add('hidden');
        usernameDisplay.classList.remove('hidden');
      }
    });
  }
  }

  function init(){ 
    // Verify all DOM elements exist
    const missing = Object.entries(dom).filter(([key, el]) => !el).map(([key]) => key);
    if(missing.length > 0) {
      console.warn('Missing DOM elements:', missing);
    }
    
    loadTheme(); 
    loadUsername(); 
    loadHistory(); 
    renderAggregates(); 
    attachEvents(); 
    // Ensure we start on home view
    switchView('home');
    activateTab(dom.tabHome);
  }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // Run on next tick to allow remaining synchronous parsing to finish
    setTimeout(init,0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
