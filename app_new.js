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
