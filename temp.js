// =================================================================
// Cyber Python Demo: Loops (FOR, WHILE, BREAK) - Version 2.0
// 高校情報I「4章 プログラミング実践③ 反復処理」教員提示用デモ
// =================================================================

// === Audio System (Web Audio API) ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, dur, vol = 0.08) {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  } catch(e) {}
}

function playSuccess() {
  playTone(1200, 'square', 0.1, 0.08);
  setTimeout(() => playTone(1600, 'square', 0.2, 0.08), 90);
}
function playBeep() { playTone(750, 'sine', 0.08, 0.06); }
function playPop() { playTone(500, 'triangle', 0.12, 0.1); }
function playLoopSpin() {
  playTone(400, 'sine', 0.08, 0.06);
  setTimeout(() => playTone(600, 'sine', 0.1, 0.06), 60);
}
function playBreakAlarm() {
  let count = 0;
  const interval = setInterval(() => {
    playTone(count % 2 === 0 ? 880 : 440, 'sawtooth', 0.12, 0.15);
    count++;
    if (count > 8) clearInterval(interval);
  }, 100);
}

// (Physics Engine removed completely)

// === Factory Floor API ===
const floor = document.getElementById('factory-floor');
let activeArrayContainer = null;
let activeArrayItems = [];

function clearFactory() {
  const c = document.getElementById('factory-floor');
  if(c) c.innerHTML = '';
  activeArrayContainer = null;
  activeArrayItems = [];
}

function initArray(values, startX = 0, startY = 0) {
  const container = document.createElement('div');
  container.className = 'array-container';
  if (values.length > 7) container.classList.add('large-array');
  container.id = 'main-array';
  document.getElementById('factory-floor').appendChild(container);
  
  gsap.from(container, {y: startY - 200, opacity: 0, duration: 0.5, ease: "bounce.out"});
  activeArrayContainer = container;
  
  values.forEach((v, i) => addArrayItem(v, i, true));
  return container;
}

function addArrayItem(value, index, initial = false, animateType = 'default') {
  const item = document.createElement('div');
  item.className = 'array-item';
  item.innerHTML = `<span>${value}</span><div class="index-label">[${index}]</div>`;
  activeArrayContainer.appendChild(item);
  activeArrayItems.push(item);
  
  if(!initial) {
    playHeavyBass();
    if (animateType === 'crane') {
      // クレーン演出
      item.style.opacity = 0;
      const crane = document.createElement('div');
      crane.className = 'crane-arm';
      crane.innerHTML = '🤖';
      document.getElementById('factory-floor').appendChild(crane);
      
      const rect = item.getBoundingClientRect();
      const floorRect = document.getElementById('factory-floor').getBoundingClientRect();
      const targetX = rect.left - floorRect.left + (rect.width / 2) - 30; // 30 is half of 4rem
      const targetY = rect.top - floorRect.top;
      
      gsap.set(crane, { x: targetX, y: -100 });
      const tl = gsap.timeline();
      tl.to(crane, { y: targetY - 20, duration: 0.5, ease: "power2.inOut", onComplete: playBeep })
        .to(item, { opacity: 1, scale: 1, duration: 0.1 })
        .to(crane, { y: -100, duration: 0.5, ease: "power2.in", delay: 0.2, onComplete: () => crane.remove() });
    } else {
      gsap.from(item, {x: 100, scale: 0, rotation: 90, duration: 0.4, ease: "back.out(2)"});
    }
  } else {
    gsap.from(item, {y: -300, opacity: 0, duration: 0.4, delay: index * 0.1, ease: "bounce.out", onStart: playBeep});
  }
}

function playHeavyBass() {
  playTone(200, 'sawtooth', 0.2, 0.1);
}

// === Variables & RAM Rack ===
let memoryState = {};

function setVar(name, val, type = 'int') {
  const isUpdate = memoryState.hasOwnProperty(name);
  memoryState[name] = { val: String(val), type: type };
  renderMemoryRack(name, val, isUpdate);
}

function renderMemoryRack(targetName, newVal, isUpdate) {
  const container = document.getElementById('var-boxes-grid');
  const noVarMsg = document.getElementById('no-var-msg');
  if (noVarMsg) noVarMsg.style.display = 'none';

  let cell = document.getElementById(`var-cell-${targetName}`);
  if (!cell) {
    cell = document.createElement('div');
    cell.id = `var-cell-${targetName}`;
    cell.className = 'var-cell';
    cell.innerHTML = `
      <span class="var-name">📦 ${targetName}</span>
      <span class="var-val" id="val-${targetName}">${newVal}</span>
      <span class="type-badge type-${memoryState[targetName].type}" id="type-${targetName}">${memoryState[targetName].type}</span>
    `;
    container.appendChild(cell);
    gsap.from(cell, { scale: 0.5, opacity: 0, duration: 0.35, ease: 'back.out(2)' });
    playSuccess();
  } else {
    const valElem = document.getElementById(`val-${targetName}`);
    valElem.innerText = newVal;

    gsap.fromTo(cell, 
      { scale: 1.25, borderColor: '#fff', boxShadow: '0 0 25px #fff' },
      { scale: 1, borderColor: 'var(--neon-purple)', boxShadow: '0 0 12px rgba(189,147,249,0.4)', duration: 0.4 }
    );
    playPop();
  }
}

function clearMemoryRack() {
  memoryState = {};
  const container = document.getElementById('var-boxes-grid');
  container.innerHTML = '<div class="no-var-msg" id="no-var-msg">代入された変数はまだありません</div>';
}

// === Loop Meter Visualizer ===
function showLoopProgress(title, valText, progressText, isBreak = false) {
  const stage = document.getElementById('loop-visual-stage');
  const breakClass = isBreak ? 'break-active' : '';

  stage.innerHTML = `
    <div class="loop-card ${breakClass}">
      <div class="loop-title-badge">${title}</div>
      <div class="loop-meter-val">${valText}</div>
      <div class="loop-progress-text ${isBreak ? 'break-text' : ''}">${progressText}</div>
    </div>
  `;

  if (isBreak) {
    playBreakAlarm();
    const cpuStatus = document.getElementById('cpu-status');
    cpuStatus.innerText = '🚨 BREAK ESCAPED';
    cpuStatus.className = 'status-indicator break-alert';
  } else {
    playLoopSpin();
    const cpuStatus = document.getElementById('cpu-status');
    cpuStatus.innerText = 'LOOPING 🔄';
    cpuStatus.className = 'status-indicator looping';
  }

  gsap.fromTo(stage.firstElementChild, 
    { scale: 0.7, opacity: 0, y: -15 },
    { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.8)' }
  );
}

function clearLoopStage() {
  document.getElementById('loop-visual-stage').innerHTML = '';
  const cpuStatus = document.getElementById('cpu-status');
  cpuStatus.innerText = 'READY';
  cpuStatus.className = 'status-indicator';
}

// === Colab Terminal System ===
function printTerm(text, isStr = false) {
  const list = document.getElementById('term-output-list');
  const line = document.createElement('div');
  line.className = 'term-line output ' + (isStr ? 'str-type' : '');
  line.innerText = text;
  list.appendChild(line);

  const scr = document.getElementById('terminal-screen');
  scr.scrollTop = scr.scrollHeight;
}

function clearTerminal() {
  document.getElementById('term-output-list').innerHTML = '';
}

// === Trace Table System ===
function addTraceRow(round, lineNo, code, varVal, cond, output) {
  const tbody = document.getElementById('trace-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  
  if (Array.isArray(round)) {
    // Array Factory mode: round is an array of column values, lineNo is optional highlight class
    const highlightClass = lineNo || '';
    if (highlightClass) tr.className = 'new-row ' + highlightClass;
    else tr.className = 'new-row';
    
    round.forEach((val, idx) => {
      const td = document.createElement('td');
      if (idx === 0) {
        td.style.color = 'var(--neon-cyan)';
        td.style.fontWeight = 'bold';
      } else if (idx === round.length - 1) {
        td.style.color = 'var(--neon-green)';
      }
      td.style.fontFamily = "'Fira Code', monospace";
      td.innerHTML = (val !== undefined && val !== null) ? val : '-';
      tr.appendChild(td);
    });
  } else {
    // Legacy mode for Loops (6 columns)
    tr.className = 'new-row';
    let condBadge = cond;
    if (cond === true || cond === 'True') condBadge = '<span class="eval-badge true">True ⭕</span>';
    else if (cond === false || cond === 'False') condBadge = '<span class="eval-badge false">False ❌</span>';
    else if (cond === 'BREAK' || cond === 'break') condBadge = '<span class="eval-badge break">🚨 BREAK</span>';
    
    tr.innerHTML = `
      <td style="color:var(--neon-cyan); font-weight:bold;">${round !== undefined && round !== null ? round : '-'}</td>
      <td style="font-family:'Fira Code', monospace; color:var(--neon-purple);">${lineNo !== undefined && lineNo !== null ? lineNo : '-'}</td>
      <td style="font-family:'Fira Code', monospace; color:var(--neon-green);">${code || '-'}</td>
      <td style="font-family:'Fira Code', monospace; color:var(--neon-yellow);">${varVal || '-'}</td>
      <td>${condBadge || '-'}</td>
      <td style="font-family:'Fira Code', monospace;">${output || '-'}</td>
    `;
  }
  
  tbody.appendChild(tr);
  const container = document.querySelector('.trace-table-container');
  container.scrollTop = container.scrollHeight;
}

function clearTraceTable() {
  document.getElementById('trace-tbody').innerHTML = '';
}

function setExplanation(text) {
  document.getElementById('exp-text').innerHTML = text;
}

// =================================================================
// Step Programs Data Definitions (PDF準拠 全8ステップ)
// =================================================================

const stepsData = [
  // -------------------------------------------------------------
  // 4-1. リストの宣言と代入
  // -------------------------------------------------------------
  {
    stepNo: 1,
    title: "4-1. リストの宣言と代入",
    badge: "Step 1/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      plan.push({
        lineIdx: 0, lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']",
        action: () => {
          initArray(['🍎', '🍌', '🌽']);
          addTraceRow(["代入", "foods = ...", "['🍎', '🍌', '🌽']"], 'val-highlight');
          setExplanation("配列 <code>foods</code> が作成され、3つの要素が格納されました。");
        }
      });
      plan.push({
        lineIdx: 1, lineNo: 2, code: "print(foods)",
        action: () => {
          printTerm("['🍎', '🍌', '🌽']");
          addTraceRow(["出力", "print(foods)", "-"]);
          setExplanation("配列の中身全体がそのままターミナルに出力されました。");
        }
      });
      plan.push({
        lineIdx: 2, lineNo: 3, code: "foods[1] = '🍈'",
        action: () => {
          activeArrayItems[1].innerHTML = '<span>🍈</span><div class="index-label">[1]</div>';
          gsap.from(activeArrayItems[1], {scale: 1.5, rotate: 360, duration: 0.5, ease: "elastic.out(1, 0.3)"});
          playSuccess();
          addTraceRow(["上書き", "foods[1] = '🍈'", "['🍎', '🍈', '🌽']"], 'val-swap');
          setExplanation("インデックス <code>1</code> の要素（🍌）が <code>🍈</code> に上書き（置換）されました。");
        }
      });
      plan.push({
        lineIdx: 3, lineNo: 4, code: "print(foods)",
        action: () => {
          printTerm("['🍎', '🍈', '🌽']");
          addTraceRow(["出力", "print(foods)", "-"]);
        }
      });
      plan.push({
        lineIdx: 4, lineNo: 5, code: "b = [1] * 4",
        action: () => {
          clearFactory();
          initArray([1, 1, 1, 1]);
          addTraceRow(["代入", "b = [1] * 4", "[1, 1, 1, 1]"], 'val-highlight');
          setExplanation("<code>[1] * 4</code> により、同じ値を繰り返す配列 <code>b</code> が作成されました。");
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']", comment: "# リストの作成" },
      { lineNo: 2, code: "print(foods)", comment: "# 全体出力" },
      { lineNo: 3, code: "foods[1] = '🍈'", comment: "# 要素の置換" },
      { lineNo: 4, code: "print(foods)", comment: "" },
      { lineNo: 5, code: "b = [1] * 4", comment: "# 反復作成" }
    ]
  },

  // -------------------------------------------------------------
  // 4-2. リストに要素を追加(append)
  // -------------------------------------------------------------
  {
    stepNo: 2,
    title: "4-2. 要素を追加(append)",
    badge: "Step 2/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      plan.push({
        lineIdx: 0, lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']",
        action: () => {
          initArray(['🍎', '🍌', '🌽']);
          addTraceRow(["代入", "['🍎', '🍌', '🌽']", "['🍎', '🍌', '🌽']"]);
          setExplanation("初期配列 <code>foods</code> を準備しました。");
        }
      });
      
      const appendPlan = {
        lineIdx: 1, lineNo: 2, code: "foods.append('🥒')",
        action: () => {
          addArrayItem('🥒', 3, false, 'crane');
          addTraceRow(["末尾追加 (append)", "🥒", "['🍎', '🍌', '🌽', '🥒']"], 'val-highlight');
          setExplanation("<code>append</code> メソッドにより、配列の最後に <code>🥒</code> が追加されました。要素数は4になります！");
        }
      };
      // ★ クイズを追加！
      appendPlan.quiz = {
        question: "appendメソッドを実行すると、どこに要素が追加される？",
        choices: ["先頭に追加される", "ランダムな位置", "一番最後に追加される"],
        correct: 2,
        exp: "append（アペンド）は、配列の「末尾（一番最後）」にデータを追加するメソッドにゃ！"
      };
      plan.push(appendPlan);

      plan.push({
        lineIdx: 2, lineNo: 3, code: "print(foods)",
        action: () => {
          printTerm("['🍎', '🍌', '🌽', '🥒']");
          addTraceRow(["出力", "print(foods)", "-"]);
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']", comment: "" },
      { lineNo: 2, code: "foods.append('🥒')", comment: "# 末尾に要素を追加" },
      { lineNo: 3, code: "print(foods)", comment: "" }
    ]
  },

  // -------------------------------------------------------------
  // 4-3. 2つのリストを統合(extend)
  // -------------------------------------------------------------
  {
    stepNo: 3,
    title: "4-3. リストを統合(extend)",
    badge: "Step 3/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      plan.push({
        lineIdx: 0, lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']",
        action: () => {
          initArray(['🍎', '🍌', '🌽'], 0, -50);
          addTraceRow(["代入", "['🍎', '🍌', '🌽']", "['🍎', '🍌', '🌽']"]);
          setExplanation("ベースとなる配列 <code>foods</code> を作成。");
        }
      });
      plan.push({
        lineIdx: 1, lineNo: 2, code: "drinks = ['🍵', '🥤', '🥛']",
        action: () => {
          setExplanation("もう一つの配列 <code>drinks</code> を作成しました。（※画面上はfoodsに結合するまで待機します）");
          addTraceRow(["代入", "['🍵', '🥤', '🥛']", "準備完了"]);
        }
      });
      plan.push({
        lineIdx: 2, lineNo: 3, code: "foods.extend(drinks)",
        action: () => {
          const drinks = ['🍵', '🥤', '🥛'];
          drinks.forEach((d, i) => {
            setTimeout(() => addArrayItem(d, 3 + i, false, 'crane'), i * 1200);
          });
          addTraceRow(["統合 (extend)", "drinks", "['🍎', '🍌', '🌽', '🍵', '🥤', '🥛']"], 'val-highlight');
          setExplanation("<code>extend</code> メソッドで、<code>foods</code> の末尾に <code>drinks</code> の要素がすべて連結されました！");
        }
      });
      plan.push({
        lineIdx: 3, lineNo: 4, code: "print(foods)",
        action: () => {
          printTerm("['🍎', '🍌', '🌽', '🍵', '🥤', '🥛']");
          addTraceRow(["出力", "print(foods)", "-"]);
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']", comment: "" },
      { lineNo: 2, code: "drinks = ['🍵', '🥤', '🥛']", comment: "" },
      { lineNo: 3, code: "foods.extend(drinks)", comment: "# リストを統合" },
      { lineNo: 4, code: "print(foods)", comment: "" }
    ]
  },

  // -------------------------------------------------------------
  // 4-4. リストの長さ(len)
  // -------------------------------------------------------------
  {
    stepNo: 4,
    title: "4-4. リストの長さ(len)",
    badge: "Step 4/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      plan.push({
        lineIdx: 0, lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']",
        action: () => {
          initArray(['🍎', '🍌', '🌽']);
          addTraceRow(["foods", "-", "-"]);
          setExplanation("配列 <code>foods</code> には 3つの要素があります。");
        }
      });
      plan.push({
        lineIdx: 1, lineNo: 2, code: "print(len(foods))",
        action: () => {
          printTerm("3");
          playSuccess();
          addTraceRow(["foods", "len(foods)", "3"], 'val-highlight');
          setExplanation("<code>len(foods)</code> は配列の要素数を返します。結果は <b>3</b> と出力されました。");
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "foods = ['🍎', '🍌', '🌽']", comment: "" },
      { lineNo: 2, code: "print(len(foods))", comment: "# 要素数を取得して出力" }
    ]
  },

  // -------------------------------------------------------------
  // 4-5. 反復(for)でリストの添字を操作
  // -------------------------------------------------------------
  {
    stepNo: 5,
    title: "4-5. forでリストの添字を操作",
    badge: "Step 5/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      const f = ['🍎', '🍌', '🌽', '🥒'];
      plan.push({
        lineIdx: 0, lineNo: 1, code: "foods = ['🍎', '🍌', '🌽', '🥒']",
        action: () => {
          initArray(f);
          setExplanation("4つの要素を持つ配列 <code>foods</code> を作成しました。");
        }
      });
      for(let i = 0; i < 4; i++) {
        plan.push({
          lineIdx: 1, lineNo: 2, code: "for i in range(4):",
          action: () => {
            setVar("i", i, "int");
            addTraceRow([String(i), "-", "-"]);
            setExplanation(`【${i+1}周目】添字用変数 <code>i</code> が <b>${i}</b> になりました。`);
          }
        });
        plan.push({
          lineIdx: 2, lineNo: 3, code: "    print(foods[i])",
          action: () => {
            printTerm(f[i]);
            activeArrayItems.forEach(el => el.style.borderColor = 'var(--neon-cyan)');
            activeArrayItems[i].style.borderColor = 'var(--neon-pink)';
            gsap.from(activeArrayItems[i], {y: -20, duration: 0.3});
            playPop();
            addTraceRow([String(i), `foods[${i}] ➔ ${f[i]}`, f[i]], 'val-highlight');
            setExplanation(`<code>foods[${i}]</code> の中身（<b>${f[i]}</b>）を取り出して表示しました。`);
          }
        });
      }
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "foods = ['🍎', '🍌', '🌽', '🥒']", comment: "" },
      { lineNo: 2, code: "for i in range(4):", comment: "# 添字を 0 から 3 まで反復" },
      { lineNo: 3, code: "    print(foods[i])", comment: "# 添字を使って要素にアクセス", indent: 1 }
    ]
  },

  // -------------------------------------------------------------
  // 4-6. 要素の平均値を求める
  // -------------------------------------------------------------
  {
    stepNo: 6,
    title: "4-6. 要素の平均値",
    badge: "Step 6/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      const num = [5, 2, 1, 3];
      let sum = 0;
      plan.push({
        lineIdx: 0, lineNo: 1, code: "number = [5, 2, 1, 3]",
        action: () => {
          initArray(num);
          addTraceRow(["-", "-", "-", "-"]);
        }
      });
      plan.push({
        lineIdx: 1, lineNo: 2, code: "sum = 0",
        action: () => {
          setVar("sum", 0, "int");
          addTraceRow(["-", "-", "0", "-"]);
        }
      });
      for(let i=0; i<4; i++) {
        plan.push({
          lineIdx: 2, lineNo: 3, code: "for i in range(len(number)):",
          action: () => {
            setVar("i", i, "int");
            addTraceRow([String(i), "-", sum, "-"]);
          }
        });
        const nVal = num[i];
        sum += nVal;
        plan.push({
          lineIdx: 3, lineNo: 4, code: "    sum += number[i]",
          action: () => {
            activeArrayItems.forEach(el => el.style.borderColor = 'var(--neon-cyan)');
            activeArrayItems[i].style.borderColor = 'var(--neon-yellow)';
            setVar("sum", sum, "int");
            playPop();
            addTraceRow([String(i), `${nVal}`, `${sum}`, "-"], 'val-highlight');
            setExplanation(`要素 <b>${nVal}</b> を合計に足し込んで <b>sum = ${sum}</b> になりました。`);
          }
        });
      }
      plan.push({
        lineIdx: 4, lineNo: 6, code: "average = sum / len(number)",
        action: () => {
          const avg = sum / 4;
          setVar("average", avg, "float");
          addTraceRow(["-", "-", sum, avg], 'val-highlight');
          setExplanation(`合計 ${sum} を 要素数 4 で割って、平均値 ${avg} を求めました。`);
        }
      });
      plan.push({
        lineIdx: 5, lineNo: 7, code: "print(average)",
        action: () => {
          printTerm("2.75");
          playSuccess();
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "number = [5, 2, 1, 3]", comment: "" },
      { lineNo: 2, code: "sum = 0", comment: "" },
      { lineNo: 3, code: "for i in range(len(number)):", comment: "# 要素数(4回)反復" },
      { lineNo: 4, code: "    sum += number[i]", comment: "# 累積和を計算", indent: 1 },
      { lineNo: 5, code: "", comment: "" },
      { lineNo: 6, code: "average = sum / len(number)", comment: "# 合計を要素数で割る" },
      { lineNo: 7, code: "print(average)", comment: "" }
    ]
  },

  // -------------------------------------------------------------
  // 4-7. 入力された値の合計
  // -------------------------------------------------------------
  {
    stepNo: 7,
    title: "4-7. 入力値の合計",
    badge: "Step 7/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      const num = [0, 0, 0];
      const inputs = [100, 200, 300];
      let sum = 0;
      plan.push({
        lineIdx: 0, lineNo: 1, code: "number = [0, 0, 0]",
        action: () => {
          initArray(num);
          addTraceRow(["-", "-", "0"]);
        }
      });
      plan.push({
        lineIdx: 1, lineNo: 2, code: "sum = 0",
        action: () => { setVar("sum", 0, "int"); }
      });
      // 入力フェーズ
      for(let i=0; i<3; i++) {
        plan.push({
          lineIdx: 2, lineNo: 3, code: "for i in range(3):",
          action: () => { setVar("i", i, "int"); }
        });
        plan.push({
          lineIdx: 3, lineNo: 4, code: "    number[i] = int(input())",
          action: () => {
            num[i] = inputs[i];
            activeArrayItems[i].innerHTML = `<span>${inputs[i]}</span><div class="index-label">[${i}]</div>`;
            gsap.from(activeArrayItems[i], {scale: 1.2, duration: 0.3});
            printTerm(`> ${inputs[i]} (ユーザー入力)`, true);
            playPop();
            addTraceRow([String(i), `${inputs[i]}`, "-"], 'val-highlight');
            setExplanation(`ユーザーの入力値 ${inputs[i]} を <code>number[${i}]</code> に代入しました。`);
          }
        });
      }
      // 合計フェーズ
      for(let i=0; i<3; i++) {
        plan.push({
          lineIdx: 4, lineNo: 6, code: "for i in range(len(number)):",
          action: () => { setVar("i", i, "int"); }
        });
        sum += inputs[i];
        plan.push({
          lineIdx: 5, lineNo: 7, code: "    sum += number[i]",
          action: () => {
            setVar("sum", sum, "int");
            activeArrayItems.forEach(el => el.style.borderColor = 'var(--neon-cyan)');
            activeArrayItems[i].style.borderColor = 'var(--neon-yellow)';
            playBeep();
            addTraceRow([String(i), `${inputs[i]}`, `${sum}`], 'val-highlight');
            setExplanation(`入力された ${inputs[i]} を合計に足して ${sum} になりました。`);
          }
        });
      }
      plan.push({
        lineIdx: 6, lineNo: 8, code: "print('合計は', sum)",
        action: () => {
          printTerm(`合計は ${sum}`);
          playSuccess();
        }
      });
      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "number = [0, 0, 0]", comment: "" },
      { lineNo: 2, code: "sum = 0", comment: "" },
      { lineNo: 3, code: "for i in range(3):", comment: "# 3回入力を受け取る" },
      { lineNo: 4, code: "    number[i] = int(input())", comment: "# i番目に代入", indent: 1 },
      { lineNo: 5, code: "", comment: "" },
      { lineNo: 6, code: "for i in range(len(number)):", comment: "# 全要素を合計" },
      { lineNo: 7, code: "    sum += number[i]", comment: "", indent: 1 },
      { lineNo: 8, code: "print('合計は', sum)", comment: "" }
    ]
  },

  // -------------------------------------------------------------
  // 4-8. バブルソート（基本交換法）
  // -------------------------------------------------------------
  {
    stepNo: 8,
    title: "4-8. バブルソート（基本交換法）",
    badge: "Step 8/8",
    params: [],
    generateExecutionPlan: (params) => {
      const plan = [];
      const a = [34, 15, 76, 8, 2]; // 簡略化して5要素
      
      plan.push({
        lineIdx: 0, lineNo: 1, code: "a = [34, 15, 76, 8, 2]",
        action: () => {
          initArray([...a]);
          addTraceRow(["-", "-", "-", "初期状態"]);
        }
      });

      // バブルソートロジック
      for (let i = 4; i > 0; i--) {
        plan.push({
          lineIdx: 1, lineNo: 2, code: `for i in range(${a.length-1}, 0, -1):`,
          action: () => {
            setVar("i", i, "int");
          }
        });
        
        for (let j = 0; j < i; j++) {
          plan.push({
            lineIdx: 2, lineNo: 3, code: `  for j in range(0, i):`,
            action: () => {
              setVar("j", j, "int");
              activeArrayItems.forEach(el => el.style.borderColor = 'var(--neon-cyan)');
              activeArrayItems[j].style.borderColor = 'var(--neon-yellow)';
              activeArrayItems[j+1].style.borderColor = 'var(--neon-pink)';
            }
          });
          
          const isGreater = a[j] > a[j+1];
          const ifPlan = {
            lineIdx: 3, lineNo: 4, code: "    if a[j] > a[j+1]:",
            action: () => {
              addTraceRow([String(i), `[${j}], [${j+1}]`, `${a[j]} > ${a[j+1]}`, isGreater ? '<span class="val-true">True ⭕</span>' : '<span class="val-false">False ❌</span>']);
              setExplanation(`隣り合う <b>${a[j]}</b> と <b>${a[j+1]}</b> を比較。${isGreater ? '左の方が大きいので交換します！' : '正しい順序なのでそのまま。'}`);
            }
          };
          
          // ★ クイズを1回だけ出題（最初の比較時）
          if (i === 4 && j === 0) {
            ifPlan.quiz = {
              question: `a[0]は${a[0]}、a[1]は${a[1]}です。\n条件「a[0] > a[1]」は満たされる（Trueになる）？`,
              choices: ["True (交換する)", "False (交換しない)"],
              correct: isGreater ? 0 : 1,
              exp: `${a[0]} と ${a[1]} を比べると、${isGreater ? '左の方が大きいから True にゃ！' : '右の方が大きいから False にゃ！'}`
            };
          }
          plan.push(ifPlan);

          if (isGreater) {
            plan.push({
              lineIdx: 4, lineNo: 5, code: "      temp = a[j]",
              action: () => { setVar("temp", a[j], "int"); }
            });
            plan.push({
              lineIdx: 5, lineNo: 6, code: "      a[j] = a[j+1]",
              action: () => {
                a[j] = a[j+1];
                // Swap visual simplified
              }
            });
            plan.push({
              lineIdx: 6, lineNo: 7, code: "      a[j+1] = temp",
              action: () => {
                a[j+1] = memoryState["temp"].val;
                // Update DOM
                activeArrayItems[j].innerHTML = `<span>${a[j]}</span><div class="index-label">[${j}]</div>`;
                activeArrayItems[j+1].innerHTML = `<span>${a[j+1]}</span><div class="index-label">[${j+1}]</div>`;
                
                const box1 = activeArrayItems[j];
                const box2 = activeArrayItems[j+1];
                gsap.fromTo(box1, {y: -20}, {y: 0, duration: 0.3});
                gsap.fromTo(box2, {y: -20}, {y: 0, duration: 0.3});
                playPop();
                addTraceRow(["-", "-", "-", "🔄 交換完了"], 'val-swap');
              }
            });
          }
        }
      }
      
      plan.push({
        lineIdx: 7, lineNo: 8, code: "print(a)",
        action: () => {
          printTerm(JSON.stringify(a));
          playSuccess();
          activeArrayItems.forEach(el => el.style.borderColor = 'var(--neon-green)');
          showMiniGamePrompt();
        }
      });

      return plan;
    },
    codeLines: () => [
      { lineNo: 1, code: "a = [34, 15, 76, 8, 2]", comment: "" },
      { lineNo: 2, code: "for i in range(4, 0, -1):", comment: "# 未ソート部分を縮小" },
      { lineNo: 3, code: "  for j in range(0, i):", comment: "# 隣り合う要素を比較", indent: 1 },
      { lineNo: 4, code: "    if a[j] > a[j+1]:", comment: "# 左の方が大きければ", indent: 2 },
      { lineNo: 5, code: "      temp = a[j]", comment: "# 交換", indent: 3 },
      { lineNo: 6, code: "      a[j] = a[j+1]", comment: "", indent: 3 },
      { lineNo: 7, code: "      a[j+1] = temp", comment: "", indent: 3 },
      { lineNo: 8, code: "print(a)", comment: "" }
    ]
  }
];


// =================================================================
// Runtime Execution Controller (統一ステップ進行エンジン)
// =================================================================
// (既存のランタイム処理...)


let currentStepIdx = 0;
let currentExecIdx = -1; // 実行プラン中の現在インデックス
let executionPlan = [];
let stepParams = {};
let autoTimer = null;
let isZoomed = false;

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
  const thead = document.getElementById('trace-thead');
  if (!thead) return;
  thead.innerHTML = '';
  const tr = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.innerHTML = h;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}


