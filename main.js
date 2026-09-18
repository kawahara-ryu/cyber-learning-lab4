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

// === Trace Table System ===
const traceTable = document.getElementById('trace-table');
const traceThead = document.getElementById('trace-thead');
const traceTbody = document.getElementById('trace-tbody');
const traceTableContainer = document.querySelector('.trace-table-container');

const stepTraceHeaders = [
  ["操作", "実行コード", "配列 foods の状態"],
  ["操作", "追加要素", "追加後の配列"],
  ["操作", "統合リスト", "統合後の配列"],
  ["対象リスト", "関数", "要素数 (len)"],
  ["回数 (i)", "添字 foods[i]", "出力 (print)"],
  ["添字 (i)", "要素 number[i]", "合計 (sum)", "平均 (average)"],
  ["入力番号 (i)", "入力値", "合計 (sum)"],
  ["外側 (i)", "比較ペア (j, j+1)", "大小判定", "交換 / 状態"]
];

function setupTraceTableHeaders(headers) {
  if (!traceThead || !traceTbody) return;
  traceThead.innerHTML = '';
  traceTbody.innerHTML = '';
  const tr = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.innerHTML = h;
    tr.appendChild(th);
  });
  traceThead.appendChild(tr);
}

function addTraceRow(cells, statusClass = '') {
  playTypewriter();
  if (!traceTbody) return;
  const tr = document.createElement('tr');
  tr.className = 'new-row ' + statusClass;
  cells.forEach(cell => {
    const td = document.createElement('td');
    td.innerHTML = cell;
    tr.appendChild(td);
  });
  traceTbody.appendChild(tr);
  
  if (traceTableContainer) {
    traceTableContainer.scrollTop = traceTableContainer.scrollHeight;
  }
}

function clearTraceTable() {
  if (traceTbody) traceTbody.innerHTML = '';
}

// 互換性のためのエイリアス
function logTrace(msg, statusClass = '') {
  addTraceRow([msg], statusClass);
}
function clearLog() {
  clearTraceTable();
}

// === Navigation & Steps ===
const stepTitles = [
  "4-1. リストの宣言と代入", "4-2. リストに要素を追加(append)", "4-3. 2つのリストを統合(extend)", 
  "4-4. リストの長さ(len)", "4-5. 反復(for)でリストの添字を操作", "4-6. 要素の平均値を求める", "4-7. 入力された値の合計",
  "4-8. バブルソート（基本交換法）"
];
let currentStep = 1;

function updateStep() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('step-' + currentStep);
  if(panel) panel.classList.add('active');
  document.getElementById('step-display').innerText = stepTitles[currentStep - 1];
  
  const badge = document.getElementById('step-badge');
  if (badge) {
    badge.innerText = `Step ${currentStep}/8`;
  }
  
  playTone(1800, 'sine', 0.1);
  clearFactory();
  cancelAuto();
  setupCodeForStep(currentStep);
  setupTraceTableHeaders(stepTraceHeaders[currentStep - 1]);
  currentLoopState = null;
}
function nextStep() { if(currentStep < 8) { currentStep++; updateStep(); } }
function prevStep() { if(currentStep > 1) { currentStep--; updateStep(); } }

// === UI Logic (Code & Memory) ===
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSyntax(code) {
  const strPlaceholders = [];
  let res = escapeHtml(code).replace(/(&#39;(?:\\&#39;|[^&#39;])*&#39;|&quot;(?:\\&quot;|[^&quot;])*&quot;)/g, (m) => {
    strPlaceholders.push(m);
    return `___STR_${strPlaceholders.length - 1}___`;
  });
  
  res = res.replace(/\b(for|while|in|if|else|break)\b/g, (match) => {
    return `<span class="hl-keyword keyword-help" data-word="${match}">${match}</span>`;
  });
  res = res.replace(/\b(range|print|int|str|len|append|extend)\b/g, (match) => {
    return `<span class="hl-func keyword-help" data-word="${match}">${match}</span>`;
  });
  res = res.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
  
  res = res.replace(/___STR_(\d+)___/g, (m, idx) => {
    return `<span class="hl-string">${strPlaceholders[idx]}</span>`;
  });
  
  // Also highlight python comments
  res = res.replace(/(#.*)$/gm, '<span class="hl-comment">$1</span>');
  
  return res;
}

function setCodeMonitor(codeStr) {
  const lines = codeStr.trim().split('\n');
  const html = lines.map((l, i) => {
    let highlighted = highlightSyntax(l);
    let finalHtml = "";
    let inTag = false;
    for (let c = 0; c < highlighted.length; c++) {
      if (highlighted[c] === '<') inTag = true;
      if (highlighted[c] === '>') { inTag = false; finalHtml += '>'; continue; }
      if (!inTag && highlighted[c] === ' ') {
        finalHtml += '&nbsp;';
      } else {
        finalHtml += highlighted[c];
      }
    }
    return `<span class="code-line" id="line-${i}">${finalHtml}</span>`;
  }).join('\n');
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
    `number = [0, 0, 0]\nsum = 0\nfor i in range(3):\n  number[i] = input()\n\nfor i in range(len(number)):\n  sum += number[i]\nprint('合計は', sum)`,
    `a = [93, 15, 76, 8, 34, 17, 28, 85, 41, 2]\nfor i in range(9, 0, -1):\n  for j in range(0, i):\n    if a[j] > a[j+1]:\n      temp = a[j]\n      a[j] = a[j+1]\n      a[j+1] = temp\nfor i in range(0, 10):\n  print(i, a[i])`
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
  if (values.length > 7) {
    container.classList.add('large-array');
  }
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
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  // Create foods array
  addTraceRow(["リスト宣言", "foods = ['🍎', '🍌', '🌽']", "['🍎', '🍌', '🌽']"]);
  initArray(['🍎', '🍌', '🌽']);
  updateMemoryHUD(`foods = [...]<br>len = 3`); highlightLine(1); yield;
  
  // Overwrite foods[1]
  highlightLine(2);
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
  addTraceRow(["要素上書き", "foods[1] = '🍈'", "['🍎', '<span class=\"val-highlight\">🍈</span>', '🌽']"]);
  yield;
  
  highlightLine(3);
  addTraceRow(["出力 (print)", "print(foods)", "['🍎', '🍈', '🌽']"]); yield;
  
  // b = [1] * 4
  clearFactory();
  highlightLine(4);
  initArray([1, 1, 1, 1]);
  updateMemoryHUD(`b = [1,1,1,1]<br>len = 4`);
  addTraceRow(["一括宣言", "b = [1] * 4", "[1, 1, 1, 1]"]);
  highlightLine(null);
}

function* step2Generator() {
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']);
  addTraceRow(["初期リスト", "foods 宣言", "['🍎', '🍌', '🌽']"]);
  updateMemoryHUD(`foods = [...]<br>len = 3`); highlightLine(1); yield;
  
  addArrayItem('🥒', 3);
  addTraceRow(["要素追加 (append)", "foods.append('🥒')", "['🍎', '🍌', '🌽', '<span class=\"val-highlight\">🥒</span>']"]);
  updateMemoryHUD(`foods = [...]<br>len = 4`); highlightLine(2); yield;
  
  addTraceRow(["完了", "print(foods)", "['🍎', '🍌', '🌽', '🥒']"]);
  highlightLine(null);
}

function* step3Generator() {
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']); highlightLine(1); yield;
  
  addTraceRow(["foods 宣言", "foods = [...]", "['🍎', '🍌', '🌽']"]);
  const drinks = ['🍵', '🥤', '🥛'];
  addTraceRow(["drinks 宣言", "drinks = [...]", "['🍵', '🥤', '🥛']"]);
  updateMemoryHUD(`foods = [3]<br>drinks = [3]`); highlightLine(2); yield;
  
  drinks.forEach((d, i) => {
    setTimeout(() => { addArrayItem(d, 3 + i); }, i * 200);
  });
  addTraceRow(["リスト統合 (extend)", "foods.extend(drinks)", "['🍎', '🍌', '🌽', '<span class=\"val-highlight\">🍵', '🥤', '🥛</span>']"]);
  updateMemoryHUD(`foods = [6]<br>drinks = [3]`); highlightLine(3); yield;
  
  addTraceRow(["完了", "print(foods)", "6要素に統合完了"]);
  highlightLine(null);
}

function* step4Generator() {
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray(['🍎', '🍌', '🌽']); highlightLine(1); yield;
  addTraceRow(["対象リスト", "foods = ['🍎','🍌','🌽']", "3要素"]);
  
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
      addTraceRow(["長さ計測 (len)", "len(foods)", "<span class=\"val-highlight\" style=\"font-size:1.1rem;\">3</span>"]);
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
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  const foods = ['🍎', '🍌', '🌽', '🥒'];
  initArray(foods); 
  
  const tube = document.createElement('div');
  tube.className = 'print-tube'; tube.innerHTML = 'PRINT管';
  floor.appendChild(tube);
  gsap.set(tube, {x: window.innerWidth/2 - 100, y: 50});
  yield;
  
  for(let i=0; i<4; i++) {
    highlightLine(1); yield;
    updateMemoryHUD(`i = ${i}`); highlightLine(2);
    addTraceRow([`${i+1}回目 (i=${i})`, `foods[${i}]`, `<span class="val-highlight">${foods[i]}</span>`]);
    
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
  addTraceRow(["完了", "4要素ループ終了", "出力完了"]);
  highlightLine(null);
}

function* step6Generator() {
  clearFactory(); clearTraceTable();
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
    const clone = document.createElement('div');
    clone.className = 'flying-item'; clone.innerHTML = nums[i];
    floor.appendChild(clone);
    const rect = activeArrayItems[i].getBoundingClientRect();
    gsap.set(clone, {x: rect.left + 15, y: rect.top});
    
    sum += nums[i];
    addTraceRow([`i = ${i}`, `number[${i}] = ${nums[i]}`, `sum = ${sum}`, "-"]);
    
    gsap.to(clone, {
      x: window.innerWidth/2 - 20, y: window.innerHeight/2 + 180, 
      duration: 0.5, ease: "power1.in", 
      onComplete: () => {
        playCrunch();
        clone.remove();
        liquid.innerHTML = sum;
        liquid.style.height = `${(sum / 11) * 100}%`;
        updateMemoryHUD(`sum = ${sum}<br>i = ${i}`);
      }
    });
    yield;
  }
  
  highlightLine(5); yield;
  playLaser();
  for(let j=0; j<4; j++) {
    const slash = document.createElement('div');
    slash.className = 'flying-item'; slash.innerHTML = '🔪';
    floor.appendChild(slash);
    gsap.set(slash, {x: window.innerWidth/2 + (Math.random()*200-100), y: window.innerHeight/2 + 130});
    gsap.to(slash, {x: window.innerWidth/2, y: window.innerHeight/2 + 200, rotation: 360, duration: 0.3, onComplete: () => slash.remove()});
  }
  
  const avg = sum / nums.length;
  setTimeout(() => {
    liquid.innerHTML = avg;
    liquid.style.background = '#bd93f9';
    mixer.style.borderColor = '#bd93f9';
    mixer.style.boxShadow = '0 0 50px #bd93f9';
    updateMemoryHUD(`sum = ${sum}<br>average = ${avg}`);
    highlightLine(6);
  }, 500);
  addTraceRow(["平均値計算", "sum / len(number)", `sum = ${sum}`, `<span class="val-highlight" style="font-size:1.05rem;">${avg}</span>`]);
  yield;
  highlightLine(null);
}

function* step7Generator() {
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  initArray([0, 0, 0]); highlightLine(1); yield;
  let sum = 0; updateMemoryHUD(`sum = 0`); highlightLine([2,3]); yield;
  
  const inputs = [10, 20, 30];
  for(let i=0; i<3; i++) {
    addTraceRow([`number[${i}]`, `入力値: ${inputs[i]}`, "-"]);
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
    sum += inputs[i];
    addTraceRow([`加算 i=${i}`, `+ ${inputs[i]}`, `小計: ${sum}`]);
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
        liquid.innerHTML = sum;
        liquid.style.height = `${(sum / 60) * 100}%`;
        updateMemoryHUD(`sum = ${sum}`);
      }
    });
    yield;
  }
  
  highlightLine(7);
  updateMemoryHUD(`<b style="color:#50fa7b; font-size:1.3rem;">合計は ${sum}</b>`);
  addTraceRow(["出力 (print)", "合計は sum", `<span class="val-true" style="font-size:1.1rem; font-weight:bold;">合計は ${sum}</span>`]);
  yield;
  highlightLine(null);
}

function* step8Generator() {
  clearFactory(); clearTraceTable();
  updateMemoryHUD(`Wait...`); highlightLine(0); yield;
  
  const nums = [93, 15, 76, 8, 34, 17, 28, 85, 41, 2];
  initArray(nums); highlightLine(0); yield;
  
  for(let i=9; i>0; i--) {
    highlightLine(1); updateMemoryHUD(`i = ${i}`); yield;
    for(let j=0; j<i; j++) {
      highlightLine(2); updateMemoryHUD(`i = ${i}<br>j = ${j}`); yield;
      
      highlightLine(3);
      const item1 = activeArrayItems[j];
      const item2 = activeArrayItems[j+1];
      gsap.to(item1, {y: -15, duration: 0.2, yoyo: true, repeat: 1});
      gsap.to(item2, {y: -15, duration: 0.2, yoyo: true, repeat: 1});
      item1.style.borderColor = '#ff0'; item2.style.borderColor = '#ff0';
      yield;
      
      if(nums[j] > nums[j+1]) {
        highlightLine([4,5,6]);
        addTraceRow([`i=${i}, j=${j}`, `a[${j}] vs a[${j+1}]`, `${nums[j]} &gt; ${nums[j+1]} (真)`, `<span class="val-swap">交換 (${nums[j]} ↔ ${nums[j+1]})</span>`]);
        
        let temp = nums[j];
        nums[j] = nums[j+1];
        nums[j+1] = temp;
        
        const span1 = item1.querySelector('span');
        const span2 = item2.querySelector('span');
        const val1 = span1.innerHTML;
        const val2 = span2.innerHTML;
        
        playLaser();
        span1.innerHTML = val2;
        span2.innerHTML = val1;
        
        gsap.from(span1, {x: 50, duration: 0.3});
        gsap.from(span2, {x: -50, duration: 0.3, onComplete: () => {
           item1.style.borderColor = '#0ff';
           item2.style.borderColor = '#0ff';
        }});
        yield;
      } else {
        addTraceRow([`i=${i}, j=${j}`, `a[${j}] vs a[${j+1}]`, `${nums[j]} &le; ${nums[j+1]} (偽)`, "そのまま"]);
        item1.style.borderColor = '#0ff';
        item2.style.borderColor = '#0ff';
      }
    }
    activeArrayItems[i].style.borderColor = '#50fa7b';
    activeArrayItems[i].style.boxShadow = '0 0 15px #50fa7b';
    addTraceRow([`確定`, `位置 [${i}]`, "-", `<span class="val-true">${nums[i]}</span>`]);
  }
  activeArrayItems[0].style.borderColor = '#50fa7b';
  activeArrayItems[0].style.boxShadow = '0 0 15px #50fa7b';
  addTraceRow([`確定`, `位置 [0]`, "-", `<span class="val-true">${nums[0]}</span>`]);
  
  highlightLine(7); yield;
  for(let i=0; i<10; i++) {
    highlightLine(8); updateMemoryHUD(`i = ${i}`);
    yield;
  }
  
  addTraceRow(["ソート完了", "昇順配列完了", "-", "<span class=\"val-true\">完了</span>"]);
  highlightLine(null);
  
  // GAMIFICATION TRIGGER
  setTimeout(() => {
    if (typeof showMiniGame === 'function') {
      showMiniGame();
    }
  }, 1000);
}

// Controller
function triggerStep(stepNum, isAuto) {
  if (!currentLoopState || currentLoopState.step !== stepNum) {
    cancelAuto();
    const generators = [step1Generator, step2Generator, step3Generator, step4Generator, step5Generator, step6Generator, step7Generator, step8Generator];
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

// =================================================================
// Gamification: SPEED SORT CHALLENGE
// =================================================================
let mgTimer = null;
let mgTimeLeft = 30.0;
let mgItems = [];
let mgCorrectOrder = [];
let mgCurrentSelection = null;

function showMiniGame() {
  document.getElementById('minigame-overlay').classList.add('active');
  startMiniGame();
}

function startMiniGame() {
  mgTimeLeft = 15.0; // 15秒チャレンジ
  document.getElementById('mg-result').innerText = '';
  document.getElementById('mg-btn').style.display = 'none';
  document.getElementById('mg-timer-bar').style.width = '100%';
  document.getElementById('mg-timer-bar').style.background = 'var(--neon-green)';
  
  // ランダムな数値を生成
  mgItems = [];
  while(mgItems.length < 5) {
    let r = Math.floor(Math.random() * 99) + 1;
    if(!mgItems.includes(r)) mgItems.push(r);
  }
  mgCorrectOrder = [...mgItems].sort((a,b) => a - b); // 昇順
  
  renderMgItems();
  
  if(mgTimer) clearInterval(mgTimer);
  mgTimer = setInterval(updateMgTimer, 100);
}

function renderMgItems() {
  const container = document.getElementById('mg-array-container');
  container.innerHTML = '';
  
  mgItems.forEach((val, idx) => {
    const item = document.createElement('div');
    item.className = 'minigame-item';
    item.innerText = val;
    item.onclick = () => onMgItemClick(idx);
    container.appendChild(item);
  });
}

function onMgItemClick(idx) {
  if (mgTimeLeft <= 0) return;
  
  if (mgCurrentSelection === null) {
    mgCurrentSelection = idx;
    document.querySelectorAll('.minigame-item')[idx].classList.add('selected');
    playBeep();
  } else {
    // Swap
    let temp = mgItems[mgCurrentSelection];
    mgItems[mgCurrentSelection] = mgItems[idx];
    mgItems[idx] = temp;
    mgCurrentSelection = null;
    
    playTypewriter();
    renderMgItems();
    checkMgWin();
  }
}

function checkMgWin() {
  let isWin = true;
  for(let i = 0; i < mgItems.length; i++) {
    if(mgItems[i] !== mgCorrectOrder[i]) {
      isWin = false; break;
    }
  }
  
  if (isWin) {
    clearInterval(mgTimer);
    document.getElementById('mg-result').innerText = '🎉 MISSION CLEARED! 🎉';
    document.getElementById('mg-result').style.color = 'var(--neon-green)';
    document.getElementById('mg-btn').innerText = 'RESUME';
    document.getElementById('mg-btn').style.display = 'block';
    document.getElementById('mg-btn').onclick = () => { document.getElementById('minigame-overlay').classList.remove('active'); };
    playHeavyBass();
  }
}

function updateMgTimer() {
  mgTimeLeft -= 0.1;
  let pct = (mgTimeLeft / 15.0) * 100;
  if(pct < 0) pct = 0;
  
  const bar = document.getElementById('mg-timer-bar');
  bar.style.width = pct + '%';
  
  if(pct < 30) {
    bar.style.background = 'var(--neon-pink)';
  } else if(pct < 60) {
    bar.style.background = 'var(--neon-yellow)';
  }
  
  if (mgTimeLeft <= 0) {
    clearInterval(mgTimer);
    document.getElementById('mg-result').innerText = '💥 TIME OVER 💥';
    document.getElementById('mg-result').style.color = 'var(--neon-pink)';
    document.getElementById('mg-btn').innerText = 'RETRY';
    document.getElementById('mg-btn').style.display = 'block';
    document.getElementById('mg-btn').onclick = startMiniGame;
    playLaser();
  }
}

// =================================================================
// Feature: Hacker Cat Tooltip
// =================================================================
const hackerDict = {
  'for': '「決まった回数」や「リストの中身」を1つずつ取り出して反復（ループ）する命令にゃ。',
  'in': 'for文と一緒に使って、リストなどの要素を1つずつ取り出すためのキーワードにゃ。',
  'if': 'もし～なら、という条件分岐を作る命令にゃ。',
  'range': '回数分の数列を作る関数にゃ。range(5) なら 0, 1, 2, 3, 4 だ！',
  'print': 'コンソール画面に、文字や変数の結果を出力（表示）する関数にゃ。',
  'len': 'リストの中に入っている「要素の数」を教えてくれる関数にゃ。',
  'append': 'リストの一番最後に、新しい要素を「追加」するメソッド（命令）にゃ。',
  'extend': 'リストの末尾に、別のリストの要素をすべて「追加（結合）」するメソッドにゃ。'
};

const tooltipEl = document.getElementById('hacker-tooltip');
const tooltipText = document.getElementById('hacker-speech-text');

document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('.keyword-help');
  if (target) {
    const word = target.getAttribute('data-word');
    if (hackerDict[word]) {
      tooltipText.innerText = hackerDict[word];
      const rect = target.getBoundingClientRect();
      tooltipEl.style.left = `${rect.left}px`;
      tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
      tooltipEl.classList.remove('hidden');
      tooltipEl.classList.add('visible');
    }
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.keyword-help')) {
    tooltipEl.classList.remove('visible');
    setTimeout(() => {
      if (!tooltipEl.classList.contains('visible')) {
        tooltipEl.classList.add('hidden');
      }
    }, 200);
  }
});

// =================================================================
// Button Wrappers for 3-Column UI Layout
// =================================================================
function stepForward() {
  triggerStep(currentStep, false);
}

function toggleAuto() {
  if (typeof autoInterval !== 'undefined' && autoInterval) {
    cancelAuto();
  } else {
    triggerStep(currentStep, true);
  }
}

function stepBack() {
  loadStep(currentStep);
}

function resetCurrentStep() {
  loadStep(currentStep);
}

// --- Injected Features ---
function changeSpeed(val) {
  if (typeof gsap !== 'undefined' && gsap.globalTimeline) {
    gsap.globalTimeline.timeScale(parseFloat(val));
  }
}
function fireConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#8be9fd']
    });
  }
}
