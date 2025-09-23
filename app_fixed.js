// Monkeytype-inspired Zetamac - JavaScript
class ZetamacApp {
  constructor() {
    this.currentPage = 'test';
    this.settings = {
      operations: ['add', 'sub', 'mul', 'div'],
      time: 120,
      preset: 'default',
      customRanges: {
        add: { min: 2, max: 100, bMin: 2, bMax: 100 },
        mul: { min: 2, max: 12, bMin: 2, bMax: 12 }
      },
      ranges: {
        default: {
          add: { min: 2, max: 100, bMin: 2, bMax: 100 },
          mul: { min: 2, max: 12, bMin: 2, bMax: 12 }
        },
        easier: {
          add: { min: 1, max: 9, bMin: 1, bMax: 9 },
          mul: { min: 1, max: 9, bMin: 1, bMax: 9 }
        },
        harder: {
          add: { min: 10, max: 999, bMin: 10, bMax: 999 },
          mul: { min: 5, max: 25, bMin: 5, bMax: 25 }
        }
      },
      duration: 120,
      theme: 'dark',
      sound: false,
      quickRestart: 'tab'
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
    this.updateRangeDisplay();
    this.updateConfigVisibility();
    this.updateStatsDisplay(); // Initialize stats display
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

    // Start test button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startTest();
      });
    }

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
          // Update operations
          this.updateOperations();
        } else if (type === 'difficulty preset') {
          this.settings.preset = e.target.dataset.preset;
          this.updateRangeDisplay();
          this.updateConfigVisibility();
        } else if (type === 'time') {
          this.settings.time = parseInt(e.target.dataset.time);
          this.settings.duration = this.settings.time;
        }
        
        this.saveSettings();
      });
    });

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.settings.preset = e.target.dataset.preset;
        this.updateRangeDisplay();
        this.updateConfigVisibility();
        this.saveSettings();
      });
    });

    // Custom range inputs
    document.querySelectorAll('#add-min, #add-max, #add-b-min, #add-b-max, #mul-min, #mul-max, #mul-b-min, #mul-b-max').forEach(input => {
      input.addEventListener('change', () => {
        this.updateCustomRanges();
      });
    });

    // Answer input
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
      answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitAnswer();
        }
      });
      
      // Auto-advance on correct answer
      answerInput.addEventListener('input', (e) => {
        if (this.gameState.isRunning && this.gameState.currentProblem) {
          const userAnswer = parseInt(e.target.value);
          const correctAnswer = this.gameState.currentProblem.answer;
          
          // Check if the answer is correct and complete
          if (!isNaN(userAnswer) && userAnswer === correctAnswer) {
            // Add visual feedback
            e.target.style.backgroundColor = '#e2b714';
            e.target.style.color = '#323437';
            
            // Small delay to show the answer briefly
            setTimeout(() => {
              // Reset input styling
              e.target.style.backgroundColor = '';
              e.target.style.color = '';
              this.submitAnswer();
            }, 150);
          } else {
            // Reset styling for incorrect answers
            e.target.style.backgroundColor = '';
            e.target.style.color = '';
          }
        }
      });
    }

    // Restart and quit buttons
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.restartTest();
      });
    }

    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        this.endTest();
      });
    }

    // Try again button
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        this.resetToStart();
        this.startTest();
      });
    }

    // View stats button
    const viewStatsBtn = document.getElementById('view-stats-btn');
    if (viewStatsBtn) {
      viewStatsBtn.addEventListener('click', () => {
        this.showPage('stats');
      });
    }

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
          (document.getElementById('test-config').style.display !== 'none' || 
           document.getElementById('start-test').style.display !== 'none')) {
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

  getCurrentRanges() {
    if (this.settings.preset === 'custom') {
      return this.settings.customRanges;
    }
    return this.settings.ranges[this.settings.preset];
  }

  updateRangeDisplay() {
    const ranges = this.getCurrentRanges();
    
    // Update the display text
    if (document.getElementById('add-min-display')) {
      document.getElementById('add-min-display').textContent = ranges.add.min;
      document.getElementById('add-max-display').textContent = ranges.add.max;
      document.getElementById('add-b-min-display').textContent = ranges.add.bMin;
      document.getElementById('add-b-max-display').textContent = ranges.add.bMax;
    }
    
    if (document.getElementById('mul-min-display')) {
      document.getElementById('mul-min-display').textContent = ranges.mul.min;
      document.getElementById('mul-max-display').textContent = ranges.mul.max;
      document.getElementById('mul-b-min-display').textContent = ranges.mul.bMin;
      document.getElementById('mul-b-max-display').textContent = ranges.mul.bMax;
    }
    
    // Update active preset button
    document.querySelectorAll('[data-preset]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-preset="${this.settings.preset}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Update custom inputs if in custom mode
    if (this.settings.preset === 'custom') {
      if (document.getElementById('add-min')) {
        document.getElementById('add-min').value = ranges.add.min;
        document.getElementById('add-max').value = ranges.add.max;
        document.getElementById('add-b-min').value = ranges.add.bMin;
        document.getElementById('add-b-max').value = ranges.add.bMax;
        document.getElementById('mul-min').value = ranges.mul.min;
        document.getElementById('mul-max').value = ranges.mul.max;
        document.getElementById('mul-b-min').value = ranges.mul.bMin;
        document.getElementById('mul-b-max').value = ranges.mul.bMax;
      }
    }
  }

  updateConfigVisibility() {
    const rangeDetails = document.getElementById('range-details');
    const operationsSection = document.querySelector('.config-section .config-title');
    let operationsSectionParent = null;
    
    // Find the operations section
    document.querySelectorAll('.config-section .config-title').forEach(title => {
      if (title.textContent === 'operations') {
        operationsSectionParent = title.parentElement;
      }
    });
    
    // Remove all preset classes from body
    document.body.classList.remove('preset-default', 'preset-easier', 'preset-harder', 'preset-custom');
    // Add current preset class
    document.body.classList.add(`preset-${this.settings.preset}`);
    
    if (this.settings.preset === 'custom') {
      // Show all configuration options
      if (rangeDetails) rangeDetails.style.display = 'block';
      if (operationsSectionParent) operationsSectionParent.style.display = 'block';
      document.querySelectorAll('.range-inputs').forEach(inputs => {
        inputs.classList.remove('hidden');
      });
    } else {
      // Hide detailed configuration for non-custom presets
      if (rangeDetails) rangeDetails.style.display = 'none';
      if (operationsSectionParent) operationsSectionParent.style.display = 'none';
      document.querySelectorAll('.range-inputs').forEach(inputs => {
        inputs.classList.add('hidden');
      });
    }
  }

  updateCustomRanges() {
    if (this.settings.preset !== 'custom') return;
    
    this.settings.customRanges = {
      add: {
        min: parseInt(document.getElementById('add-min').value) || 1,
        max: parseInt(document.getElementById('add-max').value) || 10,
        bMin: parseInt(document.getElementById('add-b-min').value) || 1,
        bMax: parseInt(document.getElementById('add-b-max').value) || 10
      },
      mul: {
        min: parseInt(document.getElementById('mul-min').value) || 1,
        max: parseInt(document.getElementById('mul-max').value) || 12,
        bMin: parseInt(document.getElementById('mul-b-min').value) || 1,
        bMax: parseInt(document.getElementById('mul-b-max').value) || 12
      }
    };
    
    this.updateRangeDisplay();
    this.saveSettings();
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
      item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(`${page}-page`).style.display = 'block';
    
    // Show test elements for test page
    if (page === 'test') {
      document.getElementById('test-config').style.display = 'block';
      document.getElementById('start-test').style.display = 'block';
      document.getElementById('test-interface').style.display = 'none';
      document.getElementById('test-interface').classList.add('hidden');
      document.getElementById('test-results').style.display = 'none';
      document.getElementById('test-results').classList.add('hidden');
    }
    
    // Update stats when visiting stats page
    if (page === 'stats') {
      this.updateStatsDisplay();
    }
    
    this.currentPage = page;
  }

  generateProblem() {
    const op = this.settings.operations[Math.floor(Math.random() * this.settings.operations.length)];
    const ranges = this.getCurrentRanges();
    
    let a, b, answer, operator;
    
    switch (op) {
      case 'add':
        a = this.randomInt(ranges.add.min, ranges.add.max);
        b = this.randomInt(ranges.add.bMin, ranges.add.bMax);
        answer = a + b;
        operator = '+';
        break;
      case 'sub':
        a = this.randomInt(ranges.add.min, ranges.add.max);
        b = this.randomInt(ranges.add.bMin, Math.min(a, ranges.add.bMax));
        // Ensure non-negative result
        if (b > a) {
          [a, b] = [b, a];
        }
        answer = a - b;
        operator = '−';
        break;
      case 'mul':
        a = this.randomInt(ranges.mul.min, ranges.mul.max);
        b = this.randomInt(ranges.mul.bMin, ranges.mul.bMax);
        answer = a * b;
        operator = '×';
        break;
      case 'div':
        b = this.randomInt(ranges.mul.bMin, ranges.mul.bMax);
        answer = this.randomInt(ranges.mul.min, ranges.mul.max);
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
    
    // Hide config and start sections, show test interface
    document.getElementById('test-config').style.display = 'none';
    document.getElementById('start-test').style.display = 'none';
    document.getElementById('test-interface').style.display = 'block';
    document.getElementById('test-interface').classList.remove('hidden');
    
    this.generateNewProblem();
    this.startTimer();
    this.updateTestStats();
    
    // Focus on input
    const input = document.getElementById('answer-input');
    if (input) {
      input.focus();
    }
  }

  generateNewProblem() {
    this.gameState.currentProblem = this.generateProblem();
    this.gameState.totalProblems++;
    
    // Update display elements
    document.getElementById('left-operand').textContent = this.gameState.currentProblem.a;
    document.getElementById('operator').textContent = this.gameState.currentProblem.operator;
    document.getElementById('right-operand').textContent = this.gameState.currentProblem.b;
    
    // Clear input
    const input = document.getElementById('answer-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  submitAnswer() {
    const input = document.getElementById('answer-input');
    const userAnswer = parseInt(input.value);
    const correctAnswer = this.gameState.currentProblem.answer;
    
    this.gameState.problems.push({
      ...this.gameState.currentProblem,
      userAnswer,
      correct: userAnswer === correctAnswer,
      time: Date.now() - this.gameState.startTime
    });
    
    if (userAnswer === correctAnswer) {
      this.gameState.correctAnswers++;
      this.gameState.problemsSolved++;
    }
    
    this.updateTestStats();
    
    if (this.gameState.timeLeft > 0) {
      this.generateNewProblem();
    }
  }

  updateTestStats() {
    document.getElementById('problems-solved').textContent = this.gameState.problemsSolved;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.gameState.timeLeft--;
      document.getElementById('timer').textContent = this.gameState.timeLeft;
      
      if (this.gameState.timeLeft <= 0) {
        this.endTest();
      }
    }, 1000);
    
    // Initial display
    document.getElementById('timer').textContent = this.gameState.timeLeft;
  }

  restartTest() {
    this.endTest();
    this.startTest();
  }

  endTest() {
    this.gameState.isRunning = false;
    clearInterval(this.timer);
    
    // Update stats
    this.updateStats();
    this.showResults();
  }

  showResults() {
    document.getElementById('test-interface').style.display = 'none';
    document.getElementById('test-interface').classList.add('hidden');
    document.getElementById('test-results').style.display = 'block';
    document.getElementById('test-results').classList.remove('hidden');
    
    const accuracy = this.gameState.totalProblems > 0 ? 
      (this.gameState.correctAnswers / this.gameState.totalProblems * 100).toFixed(1) : 0;
    
    // Calculate problems per minute
    const problemsPerMinute = Math.round(this.gameState.problemsSolved / (this.settings.time / 60));
    
    document.getElementById('final-score').textContent = problemsPerMinute;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('total-problems').textContent = this.gameState.totalProblems;
    document.getElementById('test-duration').textContent = `${this.settings.time}s`;
  }

  resetToStart() {
    document.getElementById('test-results').style.display = 'none';
    document.getElementById('test-results').classList.add('hidden');
    document.getElementById('test-interface').style.display = 'none';
    document.getElementById('test-interface').classList.add('hidden');
    document.getElementById('test-config').style.display = 'block';
    document.getElementById('start-test').style.display = 'block';
    this.gameState.isRunning = false;
  }

  updateDisplay() {
    // Update active states based on current settings
    document.querySelectorAll('.config-btn[data-op]').forEach(btn => {
      btn.classList.toggle('active', this.settings.operations.includes(btn.dataset.op));
    });
    
    document.querySelectorAll('.config-btn[data-time]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.time) === this.settings.time);
    });
    
    document.querySelectorAll('.setting-btn[data-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
    });
    
    document.querySelectorAll('.setting-btn[data-sound]').forEach(btn => {
      btn.classList.toggle('active', 
        (btn.dataset.sound === 'on') === this.settings.sound);
    });
    
    document.querySelectorAll('.setting-btn[data-restart]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.restart === this.settings.quickRestart);
    });
  }

  loadSettings() {
    const saved = localStorage.getItem('zetamac-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.settings = { ...this.settings, ...parsed };
    }
  }

  saveSettings() {
    localStorage.setItem('zetamac-settings', JSON.stringify(this.settings));
  }

  loadStats() {
    const saved = localStorage.getItem('zetamac-stats');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      gamesPlayed: 0,
      totalProblems: 0,
      totalCorrect: 0,
      bestScores: {}, // duration -> best score (e.g., "30": 25, "60": 45, "120": 85)
      averageProblemsPerMinute: 0,
      testHistory: [], // Array of test results
      dailyTests: {}, // Date -> number of tests
      totalTimeSpent: 0 // in seconds
    };
  }

  updateStats() {
    const accuracy = this.gameState.totalProblems > 0 ? 
      (this.gameState.correctAnswers / this.gameState.totalProblems) : 0;
    
    const testDuration = this.settings.time;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const problemsPerMinute = (this.gameState.problemsSolved / (testDuration / 60));
    
    // Create test result object
    const testResult = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: this.gameState.problemsSolved,
      accuracy: accuracy,
      totalProblems: this.gameState.totalProblems,
      correctAnswers: this.gameState.correctAnswers,
      duration: testDuration,
      preset: this.settings.preset,
      operations: [...this.settings.operations],
      timeSpent: testDuration,
      problemsPerMinute: problemsPerMinute
    };
    
    this.stats.gamesPlayed++;
    this.stats.totalProblems += this.gameState.totalProblems;
    this.stats.totalCorrect += this.gameState.correctAnswers;
    
    // Update best score for this duration
    const durationKey = testDuration.toString();
    if (!this.stats.bestScores[durationKey] || this.gameState.problemsSolved > this.stats.bestScores[durationKey]) {
      this.stats.bestScores[durationKey] = this.gameState.problemsSolved;
    }
    
    // Calculate average problems per minute across all tests
    this.stats.totalTimeSpent += testDuration;
    this.stats.averageProblemsPerMinute = this.stats.totalTimeSpent > 0 ? 
      (this.stats.totalProblems / (this.stats.totalTimeSpent / 60)) : 0;
    
    // Add to test history (keep last 100 tests)
    this.stats.testHistory.unshift(testResult);
    if (this.stats.testHistory.length > 100) {
      this.stats.testHistory = this.stats.testHistory.slice(0, 100);
    }
    
    // Update daily test count
    if (!this.stats.dailyTests[today]) {
      this.stats.dailyTests[today] = 0;
    }
    this.stats.dailyTests[today]++;
    
    localStorage.setItem('zetamac-stats', JSON.stringify(this.stats));
    
    // Update display elements
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    // Update basic stats
    const totalTestsEl = document.getElementById('total-tests');
    const avgProblemsPerMinEl = document.getElementById('avg-problems-per-min');
    const totalTimeEl = document.getElementById('total-time');
    
    if (totalTestsEl) totalTestsEl.textContent = this.stats.gamesPlayed;
    if (avgProblemsPerMinEl) avgProblemsPerMinEl.textContent = Math.round(this.stats.averageProblemsPerMinute);
    if (totalTimeEl) {
      const hours = Math.floor(this.stats.totalTimeSpent / 3600);
      const minutes = Math.floor((this.stats.totalTimeSpent % 3600) / 60);
      totalTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    // Update best scores for different durations
    this.updateBestScores();
    
    // Update contribution graph
    this.updateContributionGraph();
    
    // Update test log
    this.updateTestLog();
  }

  updateBestScores() {
    const bestScoresContainer = document.getElementById('best-scores');
    if (!bestScoresContainer) return;
    
    bestScoresContainer.innerHTML = '';
    
    // Common test durations
    const durations = [15, 30, 60, 120, 300];
    const durationLabels = {
      15: '15s',
      30: '30s', 
      60: '1m',
      120: '2m',
      300: '5m'
    };
    
    durations.forEach(duration => {
      const score = this.stats.bestScores[duration.toString()] || 0;
      const scoreItem = document.createElement('div');
      scoreItem.className = 'best-score-item';
      
      scoreItem.innerHTML = `
        <div class="score-duration">${durationLabels[duration]}</div>
        <div class="score-value">${score}</div>
      `;
      
      bestScoresContainer.appendChild(scoreItem);
    });
  }

  updateContributionGraph() {
    const graphContainer = document.getElementById('contribution-graph');
    if (!graphContainer) return;
    
    // Clear existing graph
    graphContainer.innerHTML = '';
    
    // Create graph for last 365 days
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    // Create months header
    const monthsHeader = document.createElement('div');
    monthsHeader.className = 'graph-months';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const month = document.createElement('span');
      month.className = 'graph-month';
      month.textContent = months[(oneYearAgo.getMonth() + i) % 12];
      monthsHeader.appendChild(month);
    }
    graphContainer.appendChild(monthsHeader);
    
    // Create days container
    const daysContainer = document.createElement('div');
    daysContainer.className = 'graph-days';
    
    // Create 52 weeks (7 days each)
    for (let week = 0; week < 52; week++) {
      const weekColumn = document.createElement('div');
      weekColumn.className = 'graph-week';
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(oneYearAgo.getTime() + ((week * 7 + day) * 24 * 60 * 60 * 1000));
        const dateString = currentDate.toISOString().split('T')[0];
        
        const daySquare = document.createElement('div');
        daySquare.className = 'graph-day';
        
        const testCount = this.stats.dailyTests[dateString] || 0;
        daySquare.setAttribute('data-count', testCount);
        daySquare.setAttribute('data-date', dateString);
        daySquare.title = `${testCount} tests on ${currentDate.toLocaleDateString()}`;
        
        // Set intensity based on test count
        if (testCount === 0) {
          daySquare.classList.add('level-0');
        } else if (testCount <= 2) {
          daySquare.classList.add('level-1');
        } else if (testCount <= 5) {
          daySquare.classList.add('level-2');
        } else if (testCount <= 10) {
          daySquare.classList.add('level-3');
        } else {
          daySquare.classList.add('level-4');
        }
        
        weekColumn.appendChild(daySquare);
      }
      
      daysContainer.appendChild(weekColumn);
    }
    
    graphContainer.appendChild(daysContainer);
  }

  updateTestLog() {
    const logContainer = document.getElementById('test-log');
    if (!logContainer) return;
    
    // Clear existing log
    logContainer.innerHTML = '';
    
    if (this.stats.testHistory.length === 0) {
      logContainer.innerHTML = '<div class="log-empty">No tests completed yet</div>';
      return;
    }
    
    // Show last 10 tests
    const recentTests = this.stats.testHistory.slice(0, 10);
    
    recentTests.forEach(test => {
      const logItem = document.createElement('div');
      logItem.className = 'log-item';
      
      const date = new Date(test.date);
      const timeAgo = this.getTimeAgo(date);
      
      logItem.innerHTML = `
        <div class="log-header">
          <span class="log-score">${test.score}</span>
          <span class="log-accuracy">${(test.accuracy * 100).toFixed(1)}%</span>
          <span class="log-time">${timeAgo}</span>
        </div>
        <div class="log-details">
          <span class="log-preset">${test.preset}</span>
          <span class="log-operations">${test.operations.join(' ')}</span>
          <span class="log-duration">${test.duration}s</span>
        </div>
      `;
      
      logContainer.appendChild(logItem);
    });
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  // Debug method to add sample data (remove in production)
  generateSampleData() {
    const today = new Date();
    for (let i = 0; i < 100; i++) {
      const date = new Date(today.getTime() - (Math.random() * 365 * 24 * 60 * 60 * 1000));
      const dateString = date.toISOString().split('T')[0];
      const testCount = Math.floor(Math.random() * 10);
      
      if (testCount > 0) {
        this.stats.dailyTests[dateString] = testCount;
        
        // Add test history entries
        for (let j = 0; j < testCount; j++) {
          this.stats.testHistory.push({
            id: Date.now() + i * 1000 + j,
            date: date.toISOString(),
            score: Math.floor(Math.random() * 50) + 10,
            accuracy: 0.6 + Math.random() * 0.4,
            totalProblems: Math.floor(Math.random() * 80) + 20,
            correctAnswers: Math.floor(Math.random() * 60) + 15,
            duration: [30, 60, 120, 300][Math.floor(Math.random() * 4)],
            preset: ['default', 'easier', 'harder'][Math.floor(Math.random() * 3)],
            operations: ['add', 'sub', 'mul', 'div'].slice(0, Math.floor(Math.random() * 4) + 1),
            timeSpent: [30, 60, 120, 300][Math.floor(Math.random() * 4)]
          });
        }
      }
    }
    
    // Sort test history by date (newest first)
    this.stats.testHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.stats.testHistory = this.stats.testHistory.slice(0, 100);
    
    localStorage.setItem('zetamac-stats', JSON.stringify(this.stats));
  }

  // Method to clear all stats (for testing)
  clearStats() {
    this.stats = {
      gamesPlayed: 0,
      totalProblems: 0,
      totalCorrect: 0,
      bestScore: 0,
      averageAccuracy: 0,
      testHistory: [],
      dailyTests: {},
      totalTimeSpent: 0
    };
    localStorage.setItem('zetamac-stats', JSON.stringify(this.stats));
    this.updateStatsDisplay();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.zetamacApp = new ZetamacApp();
});
