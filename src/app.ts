/* DataBack Zetamac modern TS version */
interface ProblemRecord { l:number; r:number; op:Op; answer:number; given:number; correct:boolean; t:number; }
interface Ranges {
  add:{aMin:number;aMax:number;bMin:number;bMax:number};
  sub:{aMin:number;aMax:number;bMin:number;bMax:number};
  mul:{aMin:number;aMax:number;bMin:number;bMax:number};
  div:{divisorMin:number;divisorMax:number;quotientMin:number;quotientMax:number};
}

type Op = 'add'|'sub'|'mul'|'div';

interface SessionState {
  started:number;
  duration:number;
  endTime:number;
  score:number;
  streak:number;
  maxStreak:number;
  totalAnswered:number;
  correct:number;
  incorrect:number;
  problems:ProblemRecord[];
  ops:Op[];
  ranges:Ranges;
  current: { l:number;r:number;op:Op;answer:number } | null;
}

const LS_KEY = 'dbz_sessions_v2';

const $ = <T extends HTMLElement = HTMLElement>(sel:string) => document.querySelector(sel) as T;

const dom = {
  settingsView: $('#settingsView'),
  sessionView: $('#sessionView'),
  resultsView: $('#resultsView'),
  historyView: $('#historyView'),
  startBtn: $('#startBtn') as HTMLButtonElement,
  restartBtn: $('#restartBtn') as HTMLButtonElement,
  backHome: $('#backHome') as HTMLButtonElement,
  quitBtn: $('#quitBtn') as HTMLButtonElement,
  answerInput: $('#answerInput') as HTMLInputElement,
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
  duration: $('#duration') as HTMLSelectElement,
  themeToggle: $('#themeToggle') as HTMLButtonElement,
  settingsForm: $('#settingsForm') as HTMLFormElement
};

let state: SessionState | null = null;
let timer: number | null = null;

function getRanges():Ranges {
  const v = (id:string) => parseInt((document.getElementById(id) as HTMLInputElement).value,10);
  return {
    add:{aMin:v('add_aMin'),aMax:v('add_aMax'),bMin:v('add_bMin'),bMax:v('add_bMax')},
    sub:{aMin:v('add_aMin'),aMax:v('add_aMax'),bMin:v('add_bMin'),bMax:v('add_bMax')},
    mul:{aMin:v('mul_aMin'),aMax:v('mul_aMax'),bMin:v('mul_bMin'),bMax:v('mul_bMax')},
    div:{divisorMin:v('div_divisorMin'),divisorMax:v('div_divisorMax'),quotientMin:v('div_quotientMin'),quotientMax:v('div_quotientMax')}
  };
}

function randInt(min:number,max:number){ return Math.floor(Math.random()*(max-min+1))+min; }
function opSymbol(op:Op){ return op==='add'?'+':op==='sub'?'−':op==='mul'?'×':'÷'; }

function validateRanges(ops:Op[], ranges:Ranges): string | null {
  for(const op of ops){
    if(op==='add'||op==='sub'||op==='mul'){
      const r = ranges[op];
      if([r.aMin,r.aMax,r.bMin,r.bMax].some(x=>Number.isNaN(x))||r.aMin>r.aMax||r.bMin>r.bMax){
        return `Invalid range for ${op}`;
      }
    } else if(op==='div'){
      const r = ranges.div;
      if([r.divisorMin,r.divisorMax,r.quotientMin,r.quotientMax].some(x=>Number.isNaN(x))||r.divisorMin>r.divisorMax||r.quotientMin>r.quotientMax){
        return 'Invalid range for division';
      }
    }
  }
  return null;
}

function generateProblem(): { l:number;r:number;op:Op;answer:number } {
  if(!state) throw new Error('No state');
  const op = state.ops[randInt(0,state.ops.length-1)];
  const R = state.ranges;
  let l:number, r:number, answer:number;
  switch(op){
    case 'add':
      l = randInt(R.add.aMin,R.add.aMax); r = randInt(R.add.bMin,R.add.bMax); answer = l + r; break;
    case 'sub':
      l = randInt(R.sub.aMin,R.sub.aMax); r = randInt(R.sub.bMin,R.sub.bMax); if(l<r) [l,r]=[r,l]; answer = l - r; break;
    case 'mul':
      l = randInt(R.mul.aMin,R.mul.aMax); r = randInt(R.mul.bMin,R.mul.bMax); answer = l * r; break;
    case 'div':
      r = randInt(R.div.divisorMin,R.div.divisorMax); // divisor
      answer = randInt(R.div.quotientMin,R.div.quotientMax); // quotient
      l = r * answer; break;
  }
  return { l, r, op, answer };
}

function switchView(target:'settings'|'session'|'results'){
  dom.settingsView.classList.toggle('hidden', target!=='settings');
  dom.sessionView.classList.toggle('hidden', target!=='session');
  dom.resultsView.classList.toggle('hidden', target!=='results');
}

function startSession(){
  const ops = Array.from(dom.settingsForm.querySelectorAll<HTMLInputElement>('input[name="ops"]:checked')).map(c=>c.value as Op);
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
  switchView('session');
  dom.feedback.textContent=''; dom.feedback.className='feedback';
  nextProblem();
  dom.answerInput.value=''; dom.answerInput.focus();
  if(timer) window.clearInterval(timer);
  updateTime();
  timer = window.setInterval(updateTime,100);
}

function updateTime(){ if(!state) return; const remMs = state.endTime - Date.now(); const rem = Math.max(0, remMs/1000); dom.timeRemaining.textContent = rem.toFixed(1); if(remMs<=0) endSession(); }

function nextProblem(){ if(!state) return; state.current = generateProblem(); dom.leftOperand.textContent=String(state.current.l); dom.rightOperand.textContent=String(state.current.r); dom.operator.textContent=opSymbol(state.current.op); dom.answerInput.value=''; }

function registerAnswer(isCorrect:boolean, given:number){
  if(!state || !state.current) return;
  const p = state.current;
  const rec:ProblemRecord = { l:p.l,r:p.r,op:p.op,answer:p.answer,given,correct:isCorrect,t:Date.now()-state.started };
  state.problems.push(rec); state.totalAnswered++;
  if(isCorrect){ state.correct++; state.score++; state.streak++; if(state.streak>state.maxStreak) state.maxStreak = state.streak; dom.feedback.textContent='Correct'; dom.feedback.className='feedback ok'; }
  else { state.incorrect++; state.streak=0; dom.feedback.textContent=`Incorrect • ${p.answer}`; dom.feedback.className='feedback err'; }
  dom.score.textContent=String(state.score); dom.streak.textContent=String(state.streak);
  if(state.totalAnswered>0){ const acc = (state.correct/state.totalAnswered*100).toFixed(0)+'%'; dom.accuracyLive.textContent=acc; }
  nextProblem();
}

function onAnswerInput(){ if(!state || !state.current) return; const val = dom.answerInput.value.trim(); if(!/^[-]?\d+$/.test(val)) return; if(parseInt(val,10) === state.current.answer){ registerAnswer(true, state.current.answer); } }
function forceSubmit(){ if(!state || !state.current) return; const val = dom.answerInput.value.trim(); if(!/^[-]?\d+$/.test(val)) return; const num = parseInt(val,10); registerAnswer(num===state.current.answer, num); }

function endSession(){ if(!state) return; if(timer){ window.clearInterval(timer); timer=null; } buildSummary(); persistSession(); loadHistory(); switchView('results'); }

function buildSummary(){ if(!state) return; const acc = state.totalAnswered? (state.correct/state.totalAnswered*100).toFixed(1)+'%':'0%'; const durActual = ((Date.now()-state.started)/1000).toFixed(1)+'s';
  dom.summary.innerHTML = [
    statCard('Score', state.score),
    statCard('Answered', state.totalAnswered),
    statCard('Correct', state.correct),
    statCard('Incorrect', state.incorrect),
    statCard('Accuracy', acc),
    statCard('Max Streak', state.maxStreak),
    statCard('Duration', durActual + ' / ' + state.duration + 's')
  ].join('');
}
function statCard(label:string,val:unknown){ return `<div class="stat"><h4>${label}</h4><div class="val">${val}</div></div>`; }

interface StoredSession { started:number; duration:number; score:number; correct:number; incorrect:number; totalAnswered:number; maxStreak:number; ops:Op[]; ranges:Ranges; }
function persistSession(){ if(!state) return; try{ const raw = localStorage.getItem(LS_KEY); const list:StoredSession[] = raw?JSON.parse(raw):[]; list.push({ started:state.started,duration:state.duration,score:state.score,correct:state.correct,incorrect:state.incorrect,totalAnswered:state.totalAnswered,maxStreak:state.maxStreak,ops:state.ops,ranges:state.ranges }); localStorage.setItem(LS_KEY, JSON.stringify(list)); }catch(e){ console.warn('Persist failed', e); } }
function loadHistory(){ try{ const raw = localStorage.getItem(LS_KEY); if(!raw){ dom.statsList.textContent='No sessions yet.'; return; } const list:StoredSession[] = JSON.parse(raw); if(!Array.isArray(list)||!list.length){ dom.statsList.textContent='No sessions yet.'; return; } const items = list.slice().reverse().slice(0,30).map(s=>{ const acc = s.totalAnswered? (s.correct/s.totalAnswered*100).toFixed(0):'0'; const date = new Date(s.started).toLocaleString(); return `<div class="session-item"><strong>${s.score}</strong><span>${acc}%</span><span>${s.totalAnswered}q</span><span class="badge">${date}</span></div>`; }); dom.statsList.innerHTML = items.join(''); }catch(e){ console.warn('Load history failed', e); } }

function resetToSettings(){ switchView('settings'); state=null; }

function attachEvents(){
  dom.startBtn.addEventListener('click', startSession);
  dom.restartBtn.addEventListener('click', ()=>{ resetToSettings(); });
  dom.backHome.addEventListener('click', resetToSettings);
  dom.quitBtn.addEventListener('click', ()=>{ endSession(); });
  dom.answerInput.addEventListener('input', onAnswerInput);
  dom.answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ forceSubmit(); } });
  document.addEventListener('keydown', e=>{ if(e.code==='Space' && state && !dom.sessionView.classList.contains('hidden')){ e.preventDefault(); dom.answerInput.focus(); } });
  dom.themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme(){ document.body.classList.toggle('light'); localStorage.setItem('dbz_theme', document.body.classList.contains('light')?'light':'dark'); }
function loadTheme(){ const t = localStorage.getItem('dbz_theme'); if(t==='light'){ document.body.classList.add('light'); } }

function init(){ loadTheme(); loadHistory(); attachEvents(); }

document.addEventListener('DOMContentLoaded', init);
