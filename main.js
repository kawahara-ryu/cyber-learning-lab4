// === Audio System ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, dur, vol=0.1) {
  if(audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function playBeep() { playTone(800, 'square', 0.1, 0.1); }
function playTypewriter() { playTone(1200, 'square', 0.05, 0.05); }
function playHeavyBass() { 
  playTone(80, 'square', 0.5, 0.3); 
  playTone(50, 'sawtooth', 0.5, 0.3); 
}
function playLaser() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
  osc.stop(audioCtx.currentTime + 0.3);
}
function playCrunch() {
  playTone(150, 'sawtooth', 0.2, 0.4);
  setTimeout(() => playTone(100, 'square', 0.3, 0.4), 100);
}

// === Trace Log System ===
const logContent = document.getElementById('log-content');
let logEntries = [];
function logTrace(msg, statusClass = '') {
  playTypewriter();
  const div = document.createElement('div');
  div.className = 'log-entry ' + statusClass;
  div.innerHTML = msg;
  logContent.appendChild(div);
  logEntries.push(div);
  if(logEntries.length > 10) {
    const oldest = logEntries.shift();
    oldest.remove();
  }
}
function clearLog() {
  logContent.innerHTML = '';
  logEntries = [];
}

// === Navigation & Steps ===
const stepTitles = [
  "4-1. リストの宣言と代入", "4-2. リストに要素を追加(append)", "4-3. 2つのリストを統合(extend)", 
  "4-4. リストの長さ(len)", "4-5. 反復(for)でリストの添字を操作", "4-6. 要素の平均値を求める", "4-7. 入力された値の合計"
];
let currentStep = 1;

function updateStep() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('step-' + currentStep);
  if(panel) panel.classList.add('active');
  document.getElementById('step-display').innerText = stepTitles[currentStep - 1];
  playTone(1800, 'sine', 0.1);
  clearFactory();
  clearLog();
  cancelAuto();
  setupCodeForStep(currentStep);
  currentLoopState = null;
}
function nextStep() { if(currentStep < 7) { currentStep++; updateStep(); } }
function prevStep() { if(currentStep > 1) { currentStep--; updateStep(); } }

// === UI Logic (Code & Memory) ===
function setCodeMonitor(codeStr) {
  const lines = codeStr.trim().split('\n');
  const html = lines.map((l, i) => `<span class="code-line" id="line-${i}">${l.replace(/ /g, '&nbsp;')}</span>`).join('\n');
  document.getElementById('code-content').innerHTML = html;
}
function highlightLine(lineNums) {
  document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
  if(lineNums === null) return;
  if(!Array.isArray(lineNums)) lineNums = [lineNums];
  lineNums.forEach(num => {
    const el = document.getElementById(`line-${num}`);
    if(el) el.classList.add('active');
  });
}
function updateMemoryHUD(text) { document.getElementById('mem-content').innerHTML = text; }

function setupCodeForStep(step) {
  highlightLine(null);
  const codes = [
    `foods = ['🍎', '🍌', '🌽']\nprint(foods)\nfoods[1] = '🍈'\nprint(foods)\nb = [1] * 4`,
    `foods = ['🍎', '🍌', '🌽']\nfoods.append('🥒')\nprint(foods)`,
    `foods = ['🍎', '🍌', '🌽']\ndrinks = ['🍵', '🥤', '🥛']\nfoods.extend(drinks)\nprint(foods)`,
    `foods = ['🍎', '🍌', '🌽']\nprint(len(foods))`,
    `foods = ['🍎', '🍌', '🌽', '🥒']\nfor i in range(4):\n  print(foods[i])`,
    `number = [5, 2, 1, 3]\nsum = 0\nfor i in range(len(number)):\n  sum += number[i]\n\naverage = sum / len(number)\nprint(average)`,
    `number = [0, 0, 0]\nsum = 0\nfor i in range(3):\n  number[i] = input()\n\nfor i in range(len(number)):\n  sum += number[i]\nprint(sum)`
  ];
  setCodeMonitor(codes[step - 1]);
  updateMemoryHUD("Wait...");
}

// === Factory Floor API ===
const floor = document.getElementById('factory-floor');
let activeArrayContainer = null;
let activeArrayItems = [];

function clearFactory() {
  floor.innerHTML = '';
  activeArrayContainer = null;
  activeArrayItems = [];
}

function initArray(values, startX = 0, startY = 0) {
  const container = document.createElement('div');
  container.className = 'array-container';
  container.id = 'main-array';
  floor.appendChild(container);
  
  gsap.from(container, {y: startY - 200, opacity: 0, duration: 0.5, ease: "bounce.out"});
  activeArrayContainer = container;
  
  values.forEach((v, i) => addArrayItem(v, i, true));
  return container;
}

function addArrayItem(value, index, initial = false) {
  const item = document.createElement('div');
  item.className = 'array-item';
  item.innerHTML = `<span>${value}</span><div class="index-label">[${index}]</div>`;
  activeArrayContainer.appendChild(item);
  activeArrayItems.push(item);
  
  if(!initial) {
    playHeavyBass();
    gsap.from(item, {x: 100, scale: 0, rotation: 90, duration: 0.4, ease: "back.out(2)"});
  } else {
    gsap.from(item, {y: -300, opacity: 0, duration: 0.4, delay: index * 0.1, ease: "bounce.out", onStart: playBeep});
  }
}

// === State Machine Logic (Step / Auto) ===
let currentLoopState = null;
let autoInterval = null;

function cancelAuto() {
  if(autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

// Generators
function* step1Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  // Create foods array
  logTrace(`[CREATE] foods = ['🍎', '🍌', '🌽']`);
  initArray(['🍎', '🍌', '🌽']);
  updateMemoryHUD(`foods = [...]<br>len = 3`); highlightLine(1); yield;
  
  // Overwrite foods[1]
  highlightLine(2);
  logTrace(`[UPDATE] foods[1] = '🍈'`);
  const targetItem = activeArrayItems[1];
  
  // UFO abduction
  const ufo = document.createElement('div');
  ufo.className = 'ufo'; ufo.innerHTML = '🛸';
  floor.appendChild(ufo);
  
  const targetRect = targetItem.getBoundingClientRect();
  gsap.set(ufo, {x: targetRect.left + 15, y: -100});
  gsap.to(ufo, {y: targetRect.top - 60, duration: 0.5});
  playLaser();
  
  setTimeout(() => {
    const oldContent = targetItem.querySelector('span');
    gsap.to(oldContent, {y: -100, scale: 0, opacity: 0, duration: 0.3});
    setTimeout(() => {
      oldContent.innerHTML = '🍈';
      gsap.to(oldContent, {y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "bounce.out"});
      gsap.to(ufo, {y: -200, duration: 0.5, onComplete: () => ufo.remove()});
      playHeavyBass();
    }, 400);
  }, 500);
  yield;
  
  highlightLine(3);
  logTrace(`[PRINT] ['🍎', '🍈', '🌽']`, 'true'); yield;
  
  // b = [1] * 4
  clearFactory();
  highlightLine(4);
  logTrace(`[CLONE] b = [1] * 4`);
  initArray([1, 1, 1, 1]);
  updateMemoryHUD(`b = [1,1,1,1]<br>len = 4`);
  logTrace(`[END] コピー完了`, 'true');
  highlightLine(null);
}

function* step2Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']);
  updateMemoryHUD(`foods = [...]<br>len = 3`); highlightLine(1); yield;
  
  logTrace(`[APPEND] '🥒'`);
  addArrayItem('🥒', 3);
  updateMemoryHUD(`foods = [...]<br>len = 4`); highlightLine(2); yield;
  
  logTrace(`[END] ['🍎', '🍌', '🌽', '🥒']`, 'true');
  highlightLine(null);
}

function* step3Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']); highlightLine(1); yield;
  
  logTrace(`[CREATE] drinks = ['🍵', '🥤', '🥛']`);
  const drinks = ['🍵', '🥤', '🥛'];
  updateMemoryHUD(`foods = [3]<br>drinks = [3]`); highlightLine(2); yield;
  
  logTrace(`[EXTEND] foods.extend(drinks)`);
  drinks.forEach((d, i) => {
    setTimeout(() => { addArrayItem(d, 3 + i); }, i * 200);
  });
  updateMemoryHUD(`foods = [6]<br>drinks = [3]`); highlightLine(3); yield;
  
  logTrace(`[END] 統合完了!`, 'true');
  highlightLine(null);
}

function* step4Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']); highlightLine(1); yield;
  
  logTrace(`[LEN] 長さを計測中...`);
  const scanner = document.createElement('div');
  scanner.className = 'scanner-eye'; scanner.innerHTML = '👁️👁️';
  floor.appendChild(scanner);
  
  const firstRect = activeArrayItems[0].getBoundingClientRect();
  const lastRect = activeArrayItems[activeArrayItems.length-1].getBoundingClientRect();
  
  gsap.set(scanner, {x: firstRect.left, y: firstRect.top - 60, scale: 0});
  gsap.to(scanner, {scale: 1, duration: 0.3, onComplete: () => {
    playLaser();
    gsap.to(scanner, {x: lastRect.left, duration: 1.5, ease: "linear", onComplete: () => {
      gsap.to(scanner, {scale: 0, duration: 0.3, delay: 0.2});
      updateMemoryHUD(`len(foods) = 3`);
      logTrace(`[RESULT] 長さは 3 だ！`, 'true');
      const result = document.createElement('div');
      result.innerHTML = '3'; result.className = 'flying-item';
      gsap.set(result, {x: window.innerWidth/2, y: window.innerHeight/2, scale: 0, color: '#f00'});
      floor.appendChild(result);
      gsap.to(result, {scale: 5, opacity: 0, duration: 1});
    }});
  }});
  yield;
  highlightLine(null);
}

function* step5Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽', '🥒']); 
  
  const tube = document.createElement('div');
  tube.className = 'print-tube'; tube.innerHTML = 'PRINT管';
  floor.appendChild(tube);
  gsap.set(tube, {x: window.innerWidth/2 - 100, y: 50});
  yield;
  
  for(let i=0; i<4; i++) {
    highlightLine(1); yield;
    updateMemoryHUD(`i = ${i}`); highlightLine(2);
    logTrace(`[PRINT] foods[${i}]`);
    
    const targetItem = activeArrayItems[i];
    const clone = document.createElement('div');
    clone.className = 'flying-item';
    clone.innerHTML = targetItem.querySelector('span').innerHTML;
    floor.appendChild(clone);
    
    const rect = targetItem.getBoundingClientRect();
    gsap.set(clone, {x: rect.left + 15, y: rect.top});
    gsap.to(clone, {x: window.innerWidth/2 - 20, y: 80, scale: 0.5, duration: 0.5, onComplete: () => {
      playBeep();
      clone.remove();
      tube.innerHTML = clone.innerHTML;
    }});
    yield;
  }
  logTrace(`[END] 出力完了`, 'true');
  highlightLine(null);
}

function* step6Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  const nums = [5, 2, 1, 3];
  initArray(nums); highlightLine(1); yield;
  
  let sum = 0;
  updateMemoryHUD(`sum = ${sum}`); highlightLine([2,3]); yield;
  
  // Create Mixer
  const mixer = document.createElement('div');
  mixer.className = 'mixer-cauldron';
  floor.appendChild(mixer);
  gsap.set(mixer, {x: window.innerWidth/2 - 90});
  
  const liquid = document.createElement('div');
  liquid.className = 'mixer-liquid'; liquid.innerHTML = '0';
  mixer.appendChild(liquid);
  
  const blade = document.createElement('div');
  blade.className = 'mixer-blade'; blade.innerHTML = '⚙️';
  mixer.appendChild(blade);
  gsap.to(blade, {rotation: 360, duration: 1, repeat: -1, ease: "linear"});
  
  for(let i=0; i<nums.length; i++) {
    logTrace(`[LOOP] i=${i}, number[${i}]=${nums[i]}`);
    const clone = document.createElement('div');
    clone.className = 'flying-item'; clone.innerHTML = nums[i];
    floor.appendChild(clone);
    const rect = activeArrayItems[i].getBoundingClientRect();
    gsap.set(clone, {x: rect.left + 15, y: rect.top});
    
    gsap.to(clone, {
      x: window.innerWidth/2 - 20, y: window.innerHeight/2 + 180, 
      duration: 0.5, ease: "power1.in", 
      onComplete: () => {
        playCrunch();
        clone.remove();
        sum += nums[i];
        liquid.innerHTML = sum;
        liquid.style.height = `${(sum / 11) * 100}%`;
        updateMemoryHUD(`sum = ${sum}<br>i = ${i}`);
      }
    });
    yield;
  }
  
  highlightLine(5); yield;
  
  logTrace(`[CALC] sum(${sum}) / len(4)`);
  playLaser();
  // Slash animation
  for(let j=0; j<4; j++) {
    const slash = document.createElement('div');
    slash.className = 'flying-item'; slash.innerHTML = '🔪';
    floor.appendChild(slash);
    gsap.set(slash, {x: window.innerWidth/2 + (Math.random()*200-100), y: window.innerHeight/2 + 130});
    gsap.to(slash, {x: window.innerWidth/2, y: window.innerHeight/2 + 200, rotation: 360, duration: 0.3, onComplete: () => slash.remove()});
  }
  setTimeout(() => {
    const avg = sum / nums.length;
    liquid.innerHTML = avg;
    liquid.style.background = '#bd93f9';
    mixer.style.borderColor = '#bd93f9';
    mixer.style.boxShadow = '0 0 50px #bd93f9';
    updateMemoryHUD(`sum = ${sum}<br>average = ${avg}`);
    logTrace(`[RESULT] average = ${avg}`, 'true');
    highlightLine(6);
  }, 500);
  yield;
  
  highlightLine(null);
}

function* step7Generator() {
  clearFactory(); clearLog();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray([0, 0, 0]); highlightLine(1); yield;
  let sum = 0; updateMemoryHUD(`sum = 0`); highlightLine([2,3]); yield;
  
  const inputs = [10, 20, 30];
  for(let i=0; i<3; i++) {
    logTrace(`[INPUT] number[${i}] = ${inputs[i]}`);
    const ufo = document.createElement('div');
    ufo.className = 'ufo'; ufo.innerHTML = '🛸';
    floor.appendChild(ufo);
    
    const targetItem = activeArrayItems[i];
    const targetRect = targetItem.getBoundingClientRect();
    gsap.set(ufo, {x: targetRect.left, y: -100});
    gsap.to(ufo, {y: targetRect.top - 80, duration: 0.4, onComplete: () => {
      playBeep();
      targetItem.querySelector('span').innerHTML = inputs[i];
      gsap.from(targetItem, {y: 20, duration: 0.3});
      gsap.to(ufo, {y: -200, duration: 0.4, delay: 0.2, onComplete: () => ufo.remove()});
    }});
    yield;
  }
  
  highlightLine([5, 6]); yield;
  
  const mixer = document.createElement('div');
  mixer.className = 'mixer-cauldron';
  floor.appendChild(mixer);
  gsap.set(mixer, {x: window.innerWidth/2 - 90});
  
  const liquid = document.createElement('div');
  liquid.className = 'mixer-liquid'; liquid.innerHTML = '0';
  mixer.appendChild(liquid);
  
  for(let i=0; i<3; i++) {
    logTrace(`[ADD] sum += number[${i}]`);
    const clone = document.createElement('div');
    clone.className = 'flying-item'; clone.innerHTML = inputs[i];
    floor.appendChild(clone);
    const rect = activeArrayItems[i].getBoundingClientRect();
    gsap.set(clone, {x: rect.left + 15, y: rect.top});
    
    gsap.to(clone, {
      x: window.innerWidth/2 - 20, y: window.innerHeight/2 + 180, 
      duration: 0.5, ease: "power1.in", 
      onComplete: () => {
        playCrunch();
        clone.remove();
        sum += inputs[i];
        liquid.innerHTML = sum;
        liquid.style.height = `${(sum / 60) * 100}%`;
        updateMemoryHUD(`sum = ${sum}`);
      }
    });
    yield;
  }
  
  highlightLine(7);
  logTrace(`[RESULT] 合計は ${sum}`, 'true');
  yield;
  
  highlightLine(null);
}

// Controller
function triggerStep(stepNum, isAuto) {
  if (!currentLoopState || currentLoopState.step !== stepNum) {
    cancelAuto();
    const generators = [step1Generator, step2Generator, step3Generator, step4Generator, step5Generator, step6Generator, step7Generator];
    currentLoopState = { step: stepNum, gen: generators[stepNum-1]() };
  }
  
  if (isAuto) {
    cancelAuto();
    autoInterval = setInterval(() => {
      const res = currentLoopState.gen.next();
      if(res.done) cancelAuto();
    }, 700);
  } else {
    cancelAuto();
    currentLoopState.gen.next();
  }
}

updateStep();
