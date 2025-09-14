// Plain JS version of DataBack Zetamac modern UI
(function(){
  const LS_KEY = 'dbz_sessions_v3';
  const $ = sel => document.querySelector(sel);
  const dom = {
    settingsView: $('#settingsView'),
    sessionView: $('#sessionView'),
    resultsView: $('#resultsView'),
    statsView: $('#statsView'),
    startBtn: $('#startBtn'),
    restartBtn: $('#restartBtn'),
    backHome: $('#backHome'),
    quitBtn: $('#quitBtn'),
    answerInput: $('#answerInput'),
    timeRemaining: $('#timeRemaining'),
    score: $('#score'),
    streak: $('#streak'),
    accuracyLive: $('#accuracyLive'),
    leftOperand: $('#leftOperand'),
    rightOperand: $('#rightOperand'),
    operator: $('#operator'),
    feedback: $('#feedback'),
    summary: $('#summary'),
  statsList: $('#statsList'),
  aggregateMetrics: $('#aggregateMetrics'),
    duration: $('#duration'),
    themeToggle: $('#themeToggle'),
  settingsForm: $('#settingsForm'),
  tabHome: $('#tabHome'),
  tabTest: $('#tabTest'),
  tabStats: $('#tabStats'),
  progressChart: $('#progressChart'),
  distributionChart: $('#distributionChart'),
  testsPerDayChart: $('#testsPerDayChart'),
  timePerDayChart: $('#timePerDayChart')
  };

  let state = null; // session state object
  let timer = null;

  function getRanges(){
    const v = id => parseInt(document.getElementById(id).value,10);
    return {
      add:{aMin:v('add_aMin'),aMax:v('add_aMax'),bMin:v('add_bMin'),bMax:v('add_bMax')},
      sub:{aMin:v('add_aMin'),aMax:v('add_aMax'),bMin:v('add_bMin'),bMax:v('add_bMax')},
      mul:{aMin:v('mul_aMin'),aMax:v('mul_aMax'),bMin:v('mul_bMin'),bMax:v('mul_bMax')},
      div:{divisorMin:v('div_divisorMin'),divisorMax:v('div_divisorMax'),quotientMin:v('div_quotientMin'),quotientMax:v('div_quotientMax')}
    };
  }
  function validateRanges(ops,ranges){
    for(const op of ops){
      if(op==='add'||op==='sub'||op==='mul'){
        const r = ranges[op];
        if([r.aMin,r.aMax,r.bMin,r.bMax].some(x=>isNaN(x))||r.aMin>r.aMax||r.bMin>r.bMax){
          return 'Invalid range for '+op;
        }
      } else if(op==='div'){
        const r = ranges.div;
        if([r.divisorMin,r.divisorMax,r.quotientMin,r.quotientMax].some(x=>isNaN(x))||r.divisorMin>r.divisorMax||r.quotientMin>r.quotientMax){
          return 'Invalid range for division';
        }
      }
    }
    return null;
  }
  const randInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const opSymbol=op=>op==='add'?'+':op==='sub'?'−':op==='mul'?'×':'÷';

  function generateProblem(){
    const op = state.ops[randInt(0,state.ops.length-1)];
    const R = state.ranges; let l,r,answer;
    switch(op){
      case 'add': l=randInt(R.add.aMin,R.add.aMax); r=randInt(R.add.bMin,R.add.bMax); answer=l+r; break;
      case 'sub': l=randInt(R.sub.aMin,R.sub.aMax); r=randInt(R.sub.bMin,R.sub.bMax); if(l<r)[l,r]=[r,l]; answer=l-r; break;
      case 'mul': l=randInt(R.mul.aMin,R.mul.aMax); r=randInt(R.mul.bMin,R.mul.bMax); answer=l*r; break;
      case 'div': r=randInt(R.div.divisorMin,R.div.divisorMax); answer=randInt(R.div.quotientMin,R.div.quotientMax); l=r*answer; break;
    }
    return { l, r, op, answer };
  }

  function switchView(target){
    dom.settingsView.classList.toggle('hidden', target!=='settings');
    dom.sessionView.classList.toggle('hidden', target!=='session');
    dom.resultsView.classList.toggle('hidden', target!=='results');
    dom.statsView.classList.toggle('hidden', target!=='stats');
  }

  function activateTab(tabEl){
    [dom.tabHome, dom.tabTest, dom.tabStats].forEach(btn=>{
      btn.classList.toggle('active', btn===tabEl);
      btn.setAttribute('aria-selected', btn===tabEl? 'true':'false');
    });
    // Animated slider indicator (if present)
    const bar = document.querySelector('.tabbar');
    if(bar){
      let slider = bar.querySelector('.tab-slider');
      if(!slider){
        slider = document.createElement('div');
        slider.className='tab-slider';
        bar.appendChild(slider);
      }
      const rect = tabEl.getBoundingClientRect();
      const parentRect = bar.getBoundingClientRect();
      const left = rect.left - parentRect.left;
      slider.style.width = rect.width + 'px';
      slider.style.transform = `translateX(${left}px)`;
    }
  }

  function navigateTab(target){
    switch(target){
      case 'homeView': switchView('settings'); activateTab(dom.tabHome); break;
      case 'sessionView': if(dom.tabTest.disabled) return; switchView('session'); activateTab(dom.tabTest); break;
      case 'statsView': renderAggregates(); renderCharts(); switchView('stats'); activateTab(dom.tabStats); break;
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
      problems:[], ops, ranges, current:null
    };
  dom.tabTest.disabled = false; dom.tabTest.classList.remove('locked');
  navigateTab('sessionView');
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
    if(remMs<=0) endSession();
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
    const rec = { l:p.l,r:p.r,op:p.op,answer:p.answer,given,correct:isCorrect,t:Date.now()-state.started };
    state.problems.push(rec); state.totalAnswered++;
    if(isCorrect){ state.correct++; state.score++; state.streak++; if(state.streak>state.maxStreak) state.maxStreak=state.streak; dom.feedback.textContent='Correct'; dom.feedback.className='feedback ok'; }
    else { state.incorrect++; state.streak=0; dom.feedback.textContent='Incorrect • '+p.answer; dom.feedback.className='feedback err'; }
    dom.score.textContent = state.score;
    dom.streak.textContent = state.streak;
    if(state.totalAnswered>0){ dom.accuracyLive.textContent = (state.correct/state.totalAnswered*100).toFixed(0)+'%'; }
    nextProblem();
  }

  function endSession(){
    if(!state) return;
    if(timer){ clearInterval(timer); timer=null; }
  buildSummary();
  persistSession();
  loadHistory();
  renderAggregates();
  switchView('results');
  }

  function buildSummary(){
    const acc = state.totalAnswered? (state.correct/state.totalAnswered*100).toFixed(1)+'%':'0%';
    const durActual = ((Date.now()-state.started)/1000).toFixed(1)+'s';
    dom.summary.innerHTML = [
      statCard('Score', state.score),
      statCard('Answered', state.totalAnswered),
      statCard('Correct', state.correct),
      statCard('Incorrect', state.incorrect),
      statCard('Accuracy', acc),
      statCard('Max Streak', state.maxStreak),
      statCard('Duration', durActual+' / '+state.duration+'s')
    ].join('');
  }
  function statCard(label,val){ return '<div class="stat"><h4>'+label+'</h4><div class="val">'+val+'</div></div>'; }

  function persistSession(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const list = raw? JSON.parse(raw):[];
      list.push({ started:state.started,duration:state.duration,score:state.score,correct:state.correct,incorrect:state.incorrect,totalAnswered:state.totalAnswered,maxStreak:state.maxStreak,ops:state.ops,ranges:state.ranges });
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
        return '<div class="session-item"><strong>'+s.score+'</strong><span>'+acc+'%</span><span>'+s.totalAnswered+'q</span><span class="badge">'+date+'</span></div>';
      });
      dom.statsList.innerHTML = items.join('');
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
    list.forEach(s=>{
      totalTimeSec += s.duration;
      totalCorrect += s.correct;
      totalAnswered += s.totalAnswered;
      const norm = s.score * (120 / s.duration);
      scoreHistory.push({ ts: s.started, norm: +norm.toFixed(2), raw: s.score });
      const binFloor = Math.floor(norm/10)*10;
      const key = binFloor+ '-' + (binFloor+10);
      bins[key] = (bins[key]||0)+1;
      const day = new Date(s.started).toISOString().slice(0,10);
      testsPerDay[day] = (testsPerDay[day]||0)+1;
      timePerDay[day] = (timePerDay[day]||0)+ s.duration;
    });
    scoreHistory.sort((a,b)=>a.ts-b.ts);
    const avgPps = totalTimeSec? (totalCorrect/totalTimeSec).toFixed(2):'0.00';
    return { totalTests, totalTimeSec, totalCorrect, totalAnswered, avgPps, scoreHistory, bins, testsPerDay, timePerDay };
  }

  function renderAggregates(){
    try{
      const raw = localStorage.getItem(LS_KEY); if(!raw){ dom.aggregateMetrics.innerHTML=''; return; }
      const list = JSON.parse(raw); if(!Array.isArray(list)||!list.length){ dom.aggregateMetrics.innerHTML=''; return; }
      const ag = computeAggregates(list);
      const totalMinutes = (ag.totalTimeSec/60).toFixed(1);
      const avgScore = (ag.scoreHistory.reduce((a,c)=>a+c.raw,0)/ag.scoreHistory.length).toFixed(1);
      dom.aggregateMetrics.innerHTML = [
        metricTile('Total Tests', ag.totalTests),
        metricTile('Total Time (m)', totalMinutes),
        metricTile('Avg Score', avgScore),
        metricTile('Avg PPS', ag.avgPps),
        metricTile('Total Correct', ag.totalCorrect),
        metricTile('Total Answered', ag.totalAnswered)
      ].join('');
    }catch(e){ console.warn('Agg render failed', e); }
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

  function drawProgressChart(canvas, points){ if(!canvas || !points.length) return; const cv = prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const margin=34; const xs = points.map(p=>p.ts); const ys = points.map(p=>p.norm); const minY = 0; const maxY = Math.max(10, Math.ceil(Math.max(...ys)/10)*10); const minX = Math.min(...xs); const maxX = Math.max(...xs); const scaleX = x=> margin + ( (x-minX)/(maxX-minX||1) )*(w-2*margin); const scaleY = y=> h - margin - ( (y-minY)/(maxY-minY||1) )*(h-2*margin);
    const bgGrad = ctx.createLinearGradient(0,0,0,h); bgGrad.addColorStop(0,'rgba(79,156,255,0.12)'); bgGrad.addColorStop(1,'rgba(79,156,255,0.02)'); ctx.fillStyle=bgGrad; ctx.fillRect(0,0,w,h);
    ctx.textAlign='right'; ctx.textBaseline='middle'; const step = Math.max(10, Math.round(maxY/6/10)*10);
    for(let y=0;y<=maxY;y+=step){ const py = scaleY(y); ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(margin,py+0.5); ctx.lineTo(w-margin,py+0.5); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillText(y, margin-8, py); }
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(margin+0.5, margin); ctx.lineTo(margin+0.5, h-margin); ctx.lineTo(w-margin, h-margin+0.5); ctx.stroke();
    ctx.lineWidth=2.4; ctx.strokeStyle='rgba(79,156,255,0.3)'; ctx.beginPath(); points.forEach((p,i)=>{ const x=scaleX(p.ts), y=scaleY(p.norm); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
    ctx.lineWidth=2; const grad = ctx.createLinearGradient(0,0,w,0); grad.addColorStop(0,'#4f9cff'); grad.addColorStop(1,'#256dff'); ctx.strokeStyle=grad; ctx.beginPath(); points.forEach((p,i)=>{ const x=scaleX(p.ts), y=scaleY(p.norm); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
    const fillGrad = ctx.createLinearGradient(0,margin,0,h-margin); fillGrad.addColorStop(0,'rgba(79,156,255,0.20)'); fillGrad.addColorStop(1,'rgba(79,156,255,0)'); ctx.fillStyle=fillGrad; ctx.beginPath(); points.forEach((p,i)=>{ const x=scaleX(p.ts), y=scaleY(p.norm); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.lineTo(scaleX(points.at(-1).ts), h-margin); ctx.lineTo(scaleX(points[0].ts), h-margin); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; points.forEach(p=>{ const x=scaleX(p.ts), y=scaleY(p.norm); ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#256dff'; ctx.beginPath(); ctx.arc(x,y,2.1,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; });
  }

  function drawDistributionChart(canvas, bins){ if(!canvas) return; const cv=prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const entries = Object.entries(bins).sort((a,b)=> parseInt(a[0]) - parseInt(b[0])); if(!entries.length) return; const max = Math.max(...entries.map(e=>e[1])); const barW = (w-70)/entries.length; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px "Inter", system-ui'; ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(40.5,10); ctx.lineTo(40.5,h-28.5); ctx.lineTo(w-20,h-28.5); ctx.stroke(); entries.forEach((e,i)=>{ const [range,count]=e; const x=48 + i*barW; const barH = (count/max)*(h-70); const y = (h-30)-barH; const grad = ctx.createLinearGradient(0,y,0,y+barH); grad.addColorStop(0,'#4f9cff'); grad.addColorStop(1,'rgba(79,156,255,0.15)'); ctx.fillStyle=grad; ctx.beginPath(); const bw = barW*0.62; const r = 6; ctx.moveTo(x, y+r); ctx.lineTo(x, y+barH-r); ctx.quadraticCurveTo(x, y+barH, x+r, y+barH); ctx.lineTo(x+bw-r, y+barH); ctx.quadraticCurveTo(x+bw, y+barH, x+bw, y+barH-r); ctx.lineTo(x+bw, y+r); ctx.quadraticCurveTo(x+bw, y, x+bw-r, y); ctx.lineTo(x+r, y); ctx.quadraticCurveTo(x, y, x, y+r); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.fillText(count, x+bw/2, y-14); ctx.save(); ctx.translate(x+bw/2, h-18); ctx.rotate(-Math.PI/3.6); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillText(range,0,0); ctx.restore(); }); }

  function drawBars(canvas, obj, mode){ if(!canvas) return; const cv=prepCanvas(canvas); if(!cv) return; const {ctx,w,h}=cv; ctx.clearRect(0,0,w,h); const entries = Object.entries(obj).sort((a,b)=> a[0]<b[0]?-1:1).slice(-30); if(!entries.length) return; const max = Math.max(...entries.map(e=> mode==='minutes'? e[1]/60 : e[1])); const barW=(w-70)/entries.length; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px "Inter", system-ui'; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(40.5,10); ctx.lineTo(40.5,h-28.5); ctx.lineTo(w-20,h-28.5); ctx.stroke(); entries.forEach((e,i)=>{ let val = mode==='minutes'? e[1]/60 : e[1]; const x=48 + i*barW; const bh = (val/max)*(h-70); const y=h-30-bh; const bw=barW*0.58; const grad=ctx.createLinearGradient(0,y,0,y+bh); grad.addColorStop(0,'rgba(79,156,255,.9)'); grad.addColorStop(1,'rgba(79,156,255,.25)'); ctx.fillStyle=grad; ctx.beginPath(); const r=6; ctx.moveTo(x,y+r); ctx.lineTo(x,y+bh-r); ctx.quadraticCurveTo(x,y+bh,x+r,y+bh); ctx.lineTo(x+bw-r,y+bh); ctx.quadraticCurveTo(x+bw,y+bh,x+bw,y+bh-r); ctx.lineTo(x+bw,y+r); ctx.quadraticCurveTo(x+bw,y,x+bw-r,y); ctx.lineTo(x+r,y); ctx.quadraticCurveTo(x,y,x,y+r); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.fillText(mode==='minutes'? val.toFixed(1):val, x+bw/2, y-13); ctx.save(); ctx.translate(x+bw/2, h-18); ctx.rotate(-Math.PI/3.4); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillText(e[0].slice(5),0,0); ctx.restore(); }); }

  let resizeTO=null; window.addEventListener('resize', ()=>{ if(resizeTO) clearTimeout(resizeTO); resizeTO = setTimeout(()=>{ renderCharts(); }, 180); });

  function updateCookieAggregates(list){ try { const ag = computeAggregates(list); const cookieObj = { totalTests:ag.totalTests, totalTimeSec:ag.totalTimeSec, avgPps:ag.avgPps, lastScore: ag.scoreHistory.at(-1)?.raw || 0, lastUpdated: Date.now() }; const val = encodeURIComponent(JSON.stringify(cookieObj)); document.cookie = 'dbz_stats='+val+';max-age=31536000;path=/;SameSite=Lax'; } catch(e){ /* ignore */ } }

  function resetToSettings(){ switchView('settings'); state=null; }

  function toggleTheme(){ document.body.classList.toggle('light'); localStorage.setItem('dbz_theme', document.body.classList.contains('light')?'light':'dark'); }
  function loadTheme(){ const t = localStorage.getItem('dbz_theme'); if(t==='light') document.body.classList.add('light'); }

  function attachEvents(){
    dom.startBtn.addEventListener('click', startSession);
    dom.restartBtn.addEventListener('click', ()=>{ resetToSettings(); });
    dom.backHome.addEventListener('click', resetToSettings);
    dom.quitBtn.addEventListener('click', endSession);
    dom.answerInput.addEventListener('input', onAnswerInput);
    dom.answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') forceSubmit(); });
    document.addEventListener('keydown', e=>{ if(e.code==='Space' && state && !dom.sessionView.classList.contains('hidden')){ e.preventDefault(); dom.answerInput.focus(); } });
  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.tabHome.addEventListener('click', ()=>navigateTab('homeView'));
  dom.tabTest.addEventListener('click', ()=>navigateTab('sessionView'));
  dom.tabStats.addEventListener('click', ()=>navigateTab('statsView'));
  }

  function init(){ loadTheme(); loadHistory(); renderAggregates(); attachEvents(); }
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // Run on next tick to allow remaining synchronous parsing to finish
    setTimeout(init,0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
