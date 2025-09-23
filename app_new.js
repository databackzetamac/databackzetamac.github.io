// Monkeytype-inspired Zetamac - JavaScript
class ZetamacApp {
  constructor() {
    this.currentPage = 'test';
    this.settings = {
      operations: ['add', 'sub', 'mul', 'div'],
      time: 60,
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
        harder: {
          add: { min: 10, max: 999, bMin: 10, bMax: 999 },
          mul: { min: 5, max: 25, bMin: 5, bMax: 25 }
        },
        easier: {
          add: { min: 1, max: 9, bMin: 1, bMax: 9 },
          mul: { min: 1, max: 9, bMin: 1, bMax: 9 }
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
        
        // Update settings based on button type
        if (type === 'operations') {
          // Handle multiple selection for operations
          this.updateOperations();
        } else if (type === 'difficulty preset') {
          // Handle preset selection
          parent.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.settings.preset = e.target.dataset.preset;
          this.updateRangeDisplay();
          this.toggleCustomInputs();
        } else if (type === 'time') {
          // Handle time selection
          parent.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.settings.time = parseInt(e.target.dataset.time);
          this.updateRangeDisplay();
        }
      });
    });

    // Range input changes
    ['add-min', 'add-max', 'add-b-min', 'add-b-max', 'mul-min', 'mul-max', 'mul-b-min', 'mul-b-max'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => {
          this.updateCustomRanges();
          this.updateRangeDisplay();
        });
      }
    });

    // Range header clicks for custom mode
    document.querySelectorAll('.range-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (this.settings.preset === 'custom') {
          const section = header.parentElement;
          const inputs = section.querySelector('.range-inputs');
          if (inputs) {
            inputs.classList.toggle('hidden');
          }
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

      getCurrentRanges() {
        if (this.settings.preset === 'custom') {
          return this.settings.customRanges;
        }
        return this.settings.ranges[this.settings.preset];
      }

      updateRangeDisplay() {
        const ranges = this.getCurrentRanges();
    
    // Update the display text
    document.getElementById('add-range-display').textContent = 
      `${ranges.add.min}-${ranges.add.max} + ${ranges.add.bMin}-${ranges.add.bMax}`;
    document.getElementById('sub-range-display').textContent = 
      `${ranges.add.min}-${ranges.add.max} - ${ranges.add.bMin}-${ranges.add.bMax}`;
    document.getElementById('mul-range-display').textContent = 
      `${ranges.mul.min}-${ranges.mul.max} × ${ranges.mul.bMin}-${ranges.mul.bMax}`;
    document.getElementById('div-range-display').textContent = 
      `${ranges.mul.min}-${ranges.mul.max} ÷ ${ranges.mul.bMin}-${ranges.mul.bMax}`;
    
    document.getElementById('duration-display').textContent = 
      `${this.settings.duration} seconds`;
    
    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-preset="${this.settings.preset}"]`).classList.add('active');
    
    // Update custom inputs if in custom mode
    if (this.settings.preset === 'custom') {
      document.getElementById('add-min').value = ranges.add.min;
      document.getElementById('add-max').value = ranges.add.max;
      document.getElementById('add-b-min').value = ranges.add.bMin;
      document.getElementById('add-b-max').value = ranges.add.bMax;
      document.getElementById('mul-min').value = ranges.mul.min;
      document.getElementById('mul-max').value = ranges.mul.max;
      document.getElementById('mul-b-min').value = ranges.mul.bMin;
      document.getElementById('mul-b-max').value = ranges.mul.bMax;
      document.getElementById('duration-input').value = this.settings.duration;
    }
  }

  toggleCustomInputs() {
    const customInputs = document.getElementById('custom-inputs');
    const isCustom = this.settings.preset === 'custom';
    customInputs.style.display = isCustom ? 'block' : 'none';
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
    
    this.settings.duration = parseInt(document.getElementById('duration-input').value) || 60;
    this.updateRangeDisplay();
    this.saveSettings();
  }

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
