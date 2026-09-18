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

// === Matter.js Physics Floor ===
const { Engine, World, Bodies, Body, Runner } = Matter;
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 0.55;

const worldContainer = document.getElementById('world');
let domBodies = [];
let ground, leftWall, rightWall;

function initPhysics() {
  const rect = worldContainer.getBoundingClientRect();
  const w = rect.width || 450;
  const h = rect.height || 260;

  ground = Bodies.rectangle(w / 2, h + 30, w * 2, 60, { isStatic: true });
  leftWall = Bodies.rectangle(-30, h / 2, 60, h * 2, { isStatic: true });
  rightWall = Bodies.rectangle(w + 30, h / 2, 60, h * 2, { isStatic: true });
  World.add(world, [ground, leftWall, rightWall]);

  Runner.run(Runner.create(), engine);

  Matter.Events.on(engine, 'afterUpdate', () => {
    domBodies.forEach(obj => {
      obj.elem.style.transform = `translate(${obj.body.position.x - obj.w / 2}px, ${obj.body.position.y - obj.h / 2}px) rotate(${obj.body.angle}rad)`;
    });
  });

  window.addEventListener('resize', () => {
    const r = worldContainer.getBoundingClientRect();
    Body.setPosition(ground, { x: r.width / 2, y: r.height + 30 });
    Body.setPosition(leftWall, { x: -30, y: r.height / 2 });
    Body.setPosition(rightWall, { x: r.width + 30, y: r.height / 2 });
  });
}

function spawnPhysicsObj(text, color = '#00f0ff', isEmoji = false) {
  const rect = worldContainer.getBoundingClientRect();
  const w = rect.width || 450;

  const div = document.createElement('div');
  div.className = 'phys-obj ' + (isEmoji ? 'emoji' : '');
  if (color && !isEmoji) {
    div.style.borderColor = color;
    div.style.color = color;
    div.style.boxShadow = `0 0 15px ${color}88`;
  }
  div.innerHTML = text;
  worldContainer.appendChild(div);

  div.style.transform = 'translate(-9999px, -9999px)';
  const bRect = div.getBoundingClientRect();
  const width = Math.max(bRect.width, 36);
  const height = Math.max(bRect.height, 32);

  const startX = w / 2 + (Math.random() * 120 - 60);
  const startY = 30;

  const body = Bodies.rectangle(startX, startY, width, height, {
    restitution: isEmoji ? 0.3 : 0.6,
    density: isEmoji ? 0.001 : 0.003
  });

  World.add(world, body);
  domBodies.push({ body, elem: div, w: width, h: height });

  gsap.from(div, { opacity: 0, scale: 0.4, duration: 0.35, ease: 'back.out(2)' });
  playPop();
}

function clearWorld() {
  domBodies.forEach(b => {
    World.remove(world, b.body);
    b.elem.remove();
  });
  domBodies = [];
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
  const tr = document.createElement('tr');
  tr.className = 'new-row';

  let condBadge = cond;
  if (cond === true || cond === 'True') {
    condBadge = '<span class="eval-badge true">True ⭕</span>';
  } else if (cond === false || cond === 'False') {
    condBadge = '<span class="eval-badge false">False ❌</span>';
  } else if (cond === 'BREAK' || cond === 'break') {
    condBadge = '<span class="eval-badge break">🚨 BREAK</span>';
  }

  tr.innerHTML = `
    <td style="color:var(--neon-cyan); font-weight:bold;">${round !== undefined && round !== null ? round : '-'}</td>
    <td style="color:#888;">${lineNo}</td>
    <td style="font-weight:bold; color:#f8f8f2;">${code}</td>
    <td style="color:var(--neon-yellow);">${varVal !== undefined && varVal !== null ? varVal : '-'}</td>
    <td style="color:var(--neon-purple);">${condBadge !== undefined && condBadge !== null ? condBadge : '-'}</td>
    <td style="color:var(--neon-green); font-weight:bold;">${output !== undefined && output !== null ? output : '-'}</td>
  `;

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
  // 3-1. 反復(for)① range(5)
  // -------------------------------------------------------------
  {
    stepNo: 1,
    title: "3-1. 反復(for)① range(5)",
    badge: "Step 1/8",
    params: [
      { id: "count", label: "繰り返し回数", type: "number", default: 5, options: [3, 5, 8] }
    ],
    generateExecutionPlan: (params) => {
      const total = Number(params.count);
      const plan = [];
      for (let i = 0; i < total; i++) {
        const round = i + 1;
        // Header
        plan.push({
          lineIdx: 0,
          lineNo: 1,
          code: `for i in range(${total}):`,
          round: round,
          action: () => {
            setVar("i", i, "int");
            showLoopProgress("FOR ループ回転中 🔄", `i = ${i}`, `進捗: ${round} / ${total} 回目`);
            addTraceRow(round, 1, `for i in range(${total}):`, `i=${i}`, `range(${i}) 取得`, "-");
            setExplanation(`【${round}周目】<code>range(${total})</code> から <b>${i}</b> が取り出され、変数 <code>i</code> に代入されました。`);
          }
        });
        // Body
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: "    print(i)",
          round: round,
          action: () => {
            printTerm(String(i));
            spawnPhysicsObj(`i = ${i} 📦`, '#50fa7b');
            addTraceRow(round, 2, "print(i)", `i=${i}`, "-", `${i}`);
            setExplanation(`変数 <code>i</code> の値（${i}）がターミナルに出力されました。`);
          }
        });
      }
      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: `for i in range(${params.count}):`, comment: `# 0 から ${params.count - 1} まで反復` },
      { lineNo: 2, code: "    print(i)", comment: "# iの値を出力", indent: 1 }
    ]
  },

  // -------------------------------------------------------------
  // 3-2. 反復(for)② range(開始, 終了, 増分)
  // -------------------------------------------------------------
  {
    stepNo: 2,
    title: "3-2. 反復(for)② range(1, 9, 2)",
    badge: "Step 2/8",
    params: [
      { id: "start", label: "開始値", type: "number", default: 1, options: [1, 2] },
      { id: "stop", label: "終了値 (未満)", type: "number", default: 9, options: [9, 10] },
      { id: "step", label: "増分", type: "number", default: 2, options: [2, 3] }
    ],
    generateExecutionPlan: (params) => {
      const s = Number(params.start);
      const e = Number(params.stop);
      const step = Number(params.step);
      const plan = [];
      let round = 0;

      for (let i = s; i < e; i += step) {
        round++;
        const currentVal = i;
        const currentRound = round;
        plan.push({
          lineIdx: 0,
          lineNo: 1,
          code: `for i in range(${s}, ${e}, ${step}):`,
          round: currentRound,
          action: () => {
            setVar("i", currentVal, "int");
            showLoopProgress(`range(${s}, ${e}, ${step})`, `i = ${currentVal}`, `終了値 ${e} 未満を +${step} ずつ`);
            addTraceRow(currentRound, 1, `for i in range(...)`, `i=${currentVal}`, `+${step} 加算`, "-");
            setExplanation(`<code>range(${s}, ${e}, ${step})</code> により、${step} ずつ増えて <b>i = ${currentVal}</b> になりました。`);
          }
        });
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: "    print(i)",
          round: currentRound,
          action: () => {
            printTerm(String(currentVal));
            spawnPhysicsObj(`i = ${currentVal} ⚡`, '#8be9fd');
            addTraceRow(currentRound, 2, "print(i)", `i=${currentVal}`, "-", `${currentVal}`);
            setExplanation(`画面に <code>${currentVal}</code> を出力しました。※終了値 ${e} は含まれません！`);
          }
        });
      }
      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: `for i in range(${params.start}, ${params.stop}, ${params.step}):`, comment: `# ${params.start}から${params.stop}未満まで${params.step}刻み` },
      { lineNo: 2, code: "    print(i)", comment: "# 奇数を出力", indent: 1 }
    ]
  },

  // -------------------------------------------------------------
  // 3-3. 繰り返しの終了 break
  // -------------------------------------------------------------
  {
    stepNo: 3,
    title: "3-3. 繰り返しの終了 break",
    badge: "Step 3/8",
    params: [
      { id: "breakAt", label: "breakする値 (i >= ?)", type: "number", default: 5, options: [3, 5, 7] }
    ],
    generateExecutionPlan: (params) => {
      const bAt = Number(params.breakAt);
      const plan = [];

      for (let i = 0; i < 10; i++) {
        const round = i + 1;
        const currentI = i;

        // Line 1: for
        plan.push({
          lineIdx: 0,
          lineNo: 1,
          code: "for i in range(10):",
          round: round,
          action: () => {
            setVar("i", currentI, "int");
            showLoopProgress("for i in range(10)", `i = ${currentI}`, `${round} 周目`);
            addTraceRow(round, 1, "for i in range(10):", `i=${currentI}`, "i 取得", "-");
            setExplanation(`【${round}周目】<code>i = ${currentI}</code> です。`);
          }
        });

        // Line 2: print(i)
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: "    print(i)",
          round: round,
          action: () => {
            printTerm(String(currentI));
            spawnPhysicsObj(`i = ${currentI}`, '#50fa7b');
            addTraceRow(round, 2, "print(i)", `i=${currentI}`, "-", `${currentI}`);
          }
        });

        // Line 3: if i >= bAt:
        const isBreak = currentI >= bAt;
        plan.push({
          lineIdx: 2,
          lineNo: 3,
          code: `    if i >= ${bAt}:`,
          round: round,
          action: () => {
            showLoopProgress(`if i >= ${bAt}`, `${currentI} >= ${bAt}`, isBreak ? "TRUE ➔ break発動！" : "FALSE ➔ ループ継続", isBreak);
            addTraceRow(round, 3, `if i >= ${bAt}:`, `i=${currentI}`, `${currentI} >= ${bAt}`, isBreak ? "True ⭕" : "False ❌");
            setExplanation(isBreak 
              ? `<code>${currentI} >= ${bAt}</code> が <b>True</b> になりました！次の <code>break</code> でループを脱出します！`
              : `<code>${currentI} >= ${bAt}</code> は <b>False</b>。breakは実行されず、下の行へ進みます。`
            );
          }
        });

        if (isBreak) {
          // Line 4: break!
          plan.push({
            lineIdx: 3,
            lineNo: 4,
            code: "        break",
            round: round,
            action: () => {
              showLoopProgress("🚨 EMERGENCY BREAK", `脱出！ (i = ${currentI})`, "ループ強制終了", true);
              spawnPhysicsObj("🚨 BREAK!", '#ff5555');
              addTraceRow(round, 4, "break", `i=${currentI}`, "BREAK", "ループ終了");
              setExplanation(`<b>🚨 break が実行されました！</b> ループ全体を直ちに抜け出し、これ以降の周回はすべて終了します！`);
            }
          });
          break; // JS側のループも終了
        }

        // Line 5: print('・')
        plan.push({
          lineIdx: 4,
          lineNo: 5,
          code: "    print('・')",
          round: round,
          action: () => {
            printTerm("・");
            spawnPhysicsObj("・", '#bd93f9');
            addTraceRow(round, 5, "print('・')", `i=${currentI}`, "-", "・");
            setExplanation(`中黒 <code>'・'</code> を出力して、次の周回へ戻ります。`);
          }
        });
      }
      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: "for i in range(10):", comment: "# 0から9まで" },
      { lineNo: 2, code: "    print(i)", comment: "# iを出力", indent: 1 },
      { lineNo: 3, code: `    if i >= ${params.breakAt}:`, comment: `# ${params.breakAt}以上になったら`, indent: 1 },
      { lineNo: 4, code: "        break", comment: "# 繰り返しを終了して脱出", indent: 2 },
      { lineNo: 5, code: "    print('・')", comment: "# breakされなかった時の出力", indent: 1 }
    ]
  },

  // -------------------------------------------------------------
  // 3-4. 反復(while)① 条件を満たす間繰り返す
  // -------------------------------------------------------------
  {
    stepNo: 4,
    title: "3-4. 反復(while)① while i <= 5",
    badge: "Step 4/8",
    params: [
      { id: "maxI", label: "繰り返す上限 (i <= ?)", type: "number", default: 5, options: [3, 5, 7] }
    ],
    generateExecutionPlan: (params) => {
      const maxVal = Number(params.maxI);
      const plan = [];

      // Line 1: i = 1
      plan.push({
        lineIdx: 0,
        lineNo: 1,
        code: "i = 1",
        round: "-",
        action: () => {
          setVar("i", 1, "int");
          spawnPhysicsObj("i = 1", '#bd93f9');
          addTraceRow("-", 1, "i = 1", "i=1", "初期化", "-");
          setExplanation("ループカウンタ変数 <code>i</code> を <code>1</code> に初期化しました。");
        }
      });

      let currentI = 1;
      let round = 1;

      while (currentI <= maxVal) {
        const cRound = round;
        const cI = currentI;

        // Line 2: while
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: `while i <= ${maxVal}:`,
          round: cRound,
          action: () => {
            showLoopProgress(`while i <= ${maxVal}`, `i = ${cI}`, `${cI} <= ${maxVal} ➔ TRUE ⭕`);
            addTraceRow(cRound, 2, `while i <= ${maxVal}:`, `i=${cI}`, `${cI} <= ${maxVal}`, "True ⭕");
            setExplanation(`【${cRound}周目】<code>${cI} <= ${maxVal}</code> は <b>True</b>！ブロック内へ進みます。`);
          }
        });

        // Line 3: print(i)
        plan.push({
          lineIdx: 2,
          lineNo: 3,
          code: "    print(i)",
          round: cRound,
          action: () => {
            printTerm(String(cI));
            spawnPhysicsObj(`i = ${cI}`, '#50fa7b');
            addTraceRow(cRound, 3, "print(i)", `i=${cI}`, "-", `${cI}`);
          }
        });

        // Line 4: i += 1
        const nextI = cI + 1;
        plan.push({
          lineIdx: 3,
          lineNo: 4,
          code: "    i += 1",
          round: cRound,
          action: () => {
            setVar("i", nextI, "int");
            showLoopProgress("インクリメント (i += 1)", `i: ${cI} ➔ ${nextI}`, "1加算して先頭へ戻る");
            addTraceRow(cRound, 4, "i += 1", `i=${nextI}`, `i = ${cI} + 1`, "-");
            setExplanation(`<code>i += 1</code> により、<code>i</code> が <b>${nextI}</b> に更新されました。先頭行へ戻ります！`);
          }
        });

        currentI = nextI;
        round++;
      }

      // ループ終了判定の最後の1行
      plan.push({
        lineIdx: 1,
        lineNo: 2,
        code: `while i <= ${maxVal}:`,
        round: round,
        action: () => {
          showLoopProgress(`while i <= ${maxVal}`, `i = ${currentI}`, `${currentI} <= ${maxVal} ➔ FALSE ❌`);
          addTraceRow(round, 2, `while i <= ${maxVal}:`, `i=${currentI}`, `${currentI} <= ${maxVal}`, "False ❌ 終了");
          setExplanation(`<code>${currentI} <= ${maxVal}</code> が <b>False</b> になったため、whileループが終了しました！`);
        }
      });

      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: "i = 1", comment: "# カウンタ初期化" },
      { lineNo: 2, code: `while i <= ${params.maxI}:`, comment: `# ${params.maxI}以下の間繰り返す` },
      { lineNo: 3, code: "    print(i)", comment: "# iを出力", indent: 1 },
      { lineNo: 4, code: "    i += 1", comment: "# iを1増やす", indent: 1 }
    ]
  },

  // -------------------------------------------------------------
  // 3-5. while(回数不明な時: 累積和 > 100)
  // -------------------------------------------------------------
  {
    stepNo: 5,
    title: "3-5. while(回数不明な時) 累積和 > 100",
    badge: "Step 5/8",
    params: [
      { id: "target", label: "目標合計値", type: "number", default: 100, options: [50, 100, 150] }
    ],
    generateExecutionPlan: (params) => {
      const target = Number(params.target);
      const plan = [];

      // Line 1: sum = 0
      plan.push({
        lineIdx: 0,
        lineNo: 1,
        code: "sum = 0",
        round: "-",
        action: () => {
          setVar("sum", 0, "int");
          spawnPhysicsObj("sum = 0", '#bd93f9');
          addTraceRow("-", 1, "sum = 0", "sum=0", "合計初期化", "-");
        }
      });

      // Line 2: n = 1
      plan.push({
        lineIdx: 1,
        lineNo: 2,
        code: "n = 1",
        round: "-",
        action: () => {
          setVar("n", 1, "int");
          spawnPhysicsObj("n = 1", '#f1fa8c');
          addTraceRow("-", 2, "n = 1", "n=1", "自然数初期化", "-");
          setExplanation("合計 <code>sum = 0</code>、自然数 <code>n = 1</code> からスタートします。");
        }
      });

      let currentSum = 0;
      let currentN = 1;
      let round = 1;

      while (currentSum <= target) {
        const cRound = round;
        const cSum = currentSum;
        const cN = currentN;

        // Line 3: while sum <= target
        plan.push({
          lineIdx: 2,
          lineNo: 3,
          code: `while sum <= ${target}:`,
          round: cRound,
          action: () => {
            showLoopProgress(`while sum <= ${target}`, `sum = ${cSum}`, `${cSum} <= ${target} ➔ 継続中`);
            addTraceRow(cRound, 3, `while sum <= ${target}:`, `sum=${cSum}, n=${cN}`, `${cSum} <= ${target}`, "True ⭕");
            setExplanation(`【${cRound}周目】<code>sum (${cSum}) <= ${target}</code> なのでループを継続します。`);
          }
        });

        // Line 4: sum += n
        const nextSum = cSum + cN;
        plan.push({
          lineIdx: 3,
          lineNo: 4,
          code: "    sum += n",
          round: cRound,
          action: () => {
            setVar("sum", nextSum, "int");
            showLoopProgress("累積和加算 (sum += n)", `sum = ${nextSum}`, `${cSum} + ${cN} = ${nextSum}`);
            addTraceRow(cRound, 4, "sum += n", `sum=${nextSum}`, `${cSum} + ${cN}`, "-");
          }
        });

        // Line 5: n += 1
        const nextN = cN + 1;
        plan.push({
          lineIdx: 4,
          lineNo: 5,
          code: "    n += 1",
          round: cRound,
          action: () => {
            setVar("n", nextN, "int");
            addTraceRow(cRound, 5, "n += 1", `n=${nextN}`, `n = ${cN} + 1`, "-");
          }
        });

        currentSum = nextSum;
        currentN = nextN;
        round++;
      }

      // 終了判定
      plan.push({
        lineIdx: 2,
        lineNo: 3,
        code: `while sum <= ${target}:`,
        round: round,
        action: () => {
          showLoopProgress(`while sum <= ${target}`, `sum = ${currentSum}`, `${currentSum} <= ${target} ➔ FALSE ❌ 突破！`);
          addTraceRow(round, 3, `while sum <= ${target}:`, `sum=${currentSum}, n=${currentN}`, `${currentSum} <= ${target}`, "False ❌ 終了");
          setExplanation(`合計 <code>sum</code> が <b>${currentSum}</b> になり、目標値 ${target} を超えたため while が終了しました！`);
        }
      });

      // Line 6: print(...)
      const ansN = currentN - 1;
      const finalMsg = `S = 1 + 2 + 3 + … + n において、S > ${target} となる最小の自然数n は、n = ${ansN}`;
      plan.push({
        lineIdx: 5,
        lineNo: 6,
        code: "print('S = ... n は、n = ', n - 1)",
        round: "-",
        action: () => {
          printTerm(finalMsg);
          spawnPhysicsObj(`答え: n = ${ansN} 🎉`, '#50fa7b');
          addTraceRow("-", 6, "print(..., n - 1)", `n-1=${ansN}`, `合計:${currentSum}`, `n = ${ansN}`);
          setExplanation(`最後に <code>n - 1 = ${ansN}</code> を表示！1から${ansN}までの和（${currentSum}）が初めて${target}を超えました！`);
        }
      });

      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: "sum = 0", comment: "# 合計の初期化" },
      { lineNo: 2, code: "n = 1", comment: "# 自然数の初期化" },
      { lineNo: 3, code: `while sum <= ${params.target}:`, comment: `# 合計が${params.target}以下の間繰り返す` },
      { lineNo: 4, code: "    sum += n", comment: "# nを足し込む", indent: 1 },
      { lineNo: 5, code: "    n += 1", comment: "# 次の自然数へ", indent: 1 },
      { lineNo: 6, code: "print('S = 1 + 2 + 3 + … + n において、S > 100 となる最小の自然数n は、n = ', n - 1)", comment: "# 結果出力" }
    ]
  },

  // -------------------------------------------------------------
  // 3-6. for と break の組合せ (同じ問題をforで解く)
  // -------------------------------------------------------------
  {
    stepNo: 6,
    title: "3-6. for と break の組合せ",
    badge: "Step 6/8",
    params: [
      { id: "target", label: "目標合計値", type: "number", default: 100, options: [50, 100, 150] }
    ],
    generateExecutionPlan: (params) => {
      const target = Number(params.target);
      const plan = [];

      // Line 1: sum = 0
      plan.push({
        lineIdx: 0,
        lineNo: 1,
        code: "sum = 0",
        round: "-",
        action: () => {
          setVar("sum", 0, "int");
          addTraceRow("-", 1, "sum = 0", "sum=0", "初期化", "-");
        }
      });

      let currentSum = 0;
      let ansN = 0;

      for (let n = 0; n < 100; n++) {
        const round = n + 1;
        const cN = n;

        // Line 2: for
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: "for n in range(100):",
          round: round,
          action: () => {
            setVar("n", cN, "int");
            showLoopProgress("for n in range(100)", `n = ${cN}`, `sum = ${currentSum}`);
            addTraceRow(round, 2, "for n in range(100):", `n=${cN}, sum=${currentSum}`, "n 取得", "-");
          }
        });

        // Line 3: sum += n
        currentSum += cN;
        const afterSum = currentSum;
        plan.push({
          lineIdx: 2,
          lineNo: 3,
          code: "    sum += n",
          round: round,
          action: () => {
            setVar("sum", afterSum, "int");
            addTraceRow(round, 3, "sum += n", `sum=${afterSum}`, `+${cN}`, "-");
          }
        });

        // Line 4: if sum > target
        const isBreak = afterSum > target;
        plan.push({
          lineIdx: 3,
          lineNo: 4,
          code: `    if sum > ${target}:`,
          round: round,
          action: () => {
            showLoopProgress(`if sum > ${target}`, `${afterSum} > ${target}`, isBreak ? "TRUE ➔ break！" : "FALSE", isBreak);
            addTraceRow(round, 4, `if sum > ${target}:`, `sum=${afterSum}`, `${afterSum} > ${target}`, isBreak ? "True ⭕" : "False ❌");
          }
        });

        if (isBreak) {
          ansN = cN;
          plan.push({
            lineIdx: 4,
            lineNo: 5,
            code: "        break",
            round: round,
            action: () => {
              showLoopProgress("🚨 BREAK 発動", `n = ${cN} (合計 ${afterSum})`, "目標突破でループ脱出！", true);
              spawnPhysicsObj(`🚨 BREAK (n=${cN})`, '#ff5555');
              addTraceRow(round, 5, "break", `n=${cN}, sum=${afterSum}`, "BREAK", "脱出！");
              setExplanation(`合計が <b>${afterSum}</b> となり ${target} を超えたため、<code>break</code> でループを抜けました！`);
            }
          });
          break;
        }
      }

      // Line 6: print(...)
      const finalMsg = `S = 1 + 2 + 3 + … + n において、S > ${target} となる最小の自然数n は、n = ${ansN}`;
      plan.push({
        lineIdx: 5,
        lineNo: 6,
        code: "print('S = ... n は、n = ', n)",
        round: "-",
        action: () => {
          printTerm(finalMsg);
          spawnPhysicsObj(`n = ${ansN} ✨`, '#50fa7b');
          addTraceRow("-", 6, "print(..., n)", `n=${ansN}`, `合計:${currentSum}`, `n = ${ansN}`);
          setExplanation(`for文の場合は <code>n</code> をそのまま使って <code>n = ${ansN}</code> と出力できます！`);
        }
      });

      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: "sum = 0", comment: "# 合計の初期化" },
      { lineNo: 2, code: "for n in range(100):", comment: "# 0から99まで" },
      { lineNo: 3, code: "    sum += n", comment: "# 足し算", indent: 1 },
      { lineNo: 4, code: `    if sum > ${params.target}:`, comment: `# ${params.target}を超えたら`, indent: 1 },
      { lineNo: 5, code: "        break", comment: "# 脱出！", indent: 2 },
      { lineNo: 6, code: "print('S = 1 + 2 + 3 + … + n において、S > 100 となる最小の自然数n は、n = ', n)", comment: "# 結果出力" }
    ]
  },

  // -------------------------------------------------------------
  // 3-7. 偶数の和 (range(2, 101, 2))
  // -------------------------------------------------------------
  {
    stepNo: 7,
    title: "3-7. 確認問題: 偶数の和",
    badge: "Step 7/8",
    params: [
      { id: "maxEven", label: "偶数の上限 (2〜?)", type: "number", default: 10, options: [6, 10, 100] }
    ],
    generateExecutionPlan: (params) => {
      const maxE = Number(params.maxEven);
      const plan = [];

      // Line 1: sum = 0
      plan.push({
        lineIdx: 0,
        lineNo: 1,
        code: "sum = 0",
        round: "-",
        action: () => {
          setVar("sum", 0, "int");
          addTraceRow("-", 1, "sum = 0", "sum=0", "初期化", "-");
        }
      });

      let currentSum = 0;
      let round = 1;

      for (let i = 2; i <= maxE; i += 2) {
        const cRound = round;
        const cI = i;

        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: `for i in range(2, ${maxE + 1}, 2):`,
          round: cRound,
          action: () => {
            setVar("i", cI, "int");
            showLoopProgress("偶数ループ", `i = ${cI}`, `sum = ${currentSum}`);
            addTraceRow(cRound, 2, "for i in range(...):", `i=${cI}`, "偶数取得", "-");
          }
        });

        currentSum += cI;
        const afterSum = currentSum;
        plan.push({
          lineIdx: 2,
          lineNo: 3,
          code: "    sum += i",
          round: cRound,
          action: () => {
            setVar("sum", afterSum, "int");
            spawnPhysicsObj(`+${cI} (計:${afterSum})`, '#f1fa8c');
            addTraceRow(cRound, 3, "sum += i", `sum=${afterSum}`, `+${cI}`, "-");
          }
        });
        round++;
      }

      // Line 4: print(...)
      const totalMsg = `2 から${maxE} までの偶数の和は ${currentSum}`;
      plan.push({
        lineIdx: 3,
        lineNo: 4,
        code: `print('2 から${maxE} までの偶数の和は ', sum)`,
        round: "-",
        action: () => {
          printTerm(totalMsg);
          spawnPhysicsObj(`偶数の和: ${currentSum} 🎯`, '#50fa7b');
          addTraceRow("-", 4, "print(和は..., sum)", `sum=${currentSum}`, "-", `${currentSum}`);
          setExplanation(`2から${maxE}までの偶数の合計は <b>${currentSum}</b> です！（※100までの場合は2550になります）`);
        }
      });

      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: "sum = 0", comment: "# 合計の初期化" },
      { lineNo: 2, code: `for i in range(2, ${Number(params.maxEven) + 1}, 2):`, comment: `# 2から${params.maxEven}まで2刻み` },
      { lineNo: 3, code: "    sum += i", comment: "# 偶数を加算", indent: 1 },
      { lineNo: 4, code: `print('2 から${params.maxEven} までの偶数の和は ', sum)`, comment: "# 結果出力" }
    ]
  },

  // -------------------------------------------------------------
  // 3-8. 偶数に〇 (for と if/else の融合)
  // -------------------------------------------------------------
  {
    stepNo: 8,
    title: "3-8. 確認問題: 偶数に〇",
    badge: "Step 8/8",
    params: [
      { id: "maxNum", label: "整数の上限 (0〜?)", type: "number", default: 6, options: [6, 10, 20] }
    ],
    generateExecutionPlan: (params) => {
      const maxN = Number(params.maxNum);
      const plan = [];

      for (let i = 0; i <= maxN; i++) {
        const round = i + 1;
        const cI = i;
        const isEven = (cI % 2 === 0);

        // Line 1: for
        plan.push({
          lineIdx: 0,
          lineNo: 1,
          code: `for i in range(${maxN + 1}):`,
          round: round,
          action: () => {
            setVar("i", cI, "int");
            showLoopProgress("偶奇チェックループ", `i = ${cI}`, `${round} / ${maxN + 1} 回目`);
            addTraceRow(round, 1, `for i in range(${maxN + 1}):`, `i=${cI}`, "i 取得", "-");
          }
        });

        // Line 2: if i % 2 == 0:
        plan.push({
          lineIdx: 1,
          lineNo: 2,
          code: "    if i % 2 == 0:",
          round: round,
          action: () => {
            showLoopProgress(`${cI} % 2 == 0`, isEven ? "偶数 ⭕" : "奇数 ❌", isEven ? "ifブロックへ" : "elseへ");
            addTraceRow(round, 2, "if i % 2 == 0:", `i=${cI}`, `${cI} % 2 == 0`, isEven ? "True ⭕" : "False ❌");
          }
        });

        if (isEven) {
          // Line 3: print(str(i) + '〇')
          plan.push({
            lineIdx: 2,
            lineNo: 3,
            code: "        print(str(i) + '〇')",
            round: round,
            action: () => {
              const msg = `${cI}〇`;
              printTerm(msg, true);
              spawnPhysicsObj(`${cI}〇 ✌️`, '#50fa7b');
              addTraceRow(round, 3, "print(str(i) + '〇')", `i=${cI}`, "偶数処理", msg);
            }
          });
        } else {
          // Line 4: else:
          plan.push({
            lineIdx: 3,
            lineNo: 4,
            code: "    else:",
            round: round,
            action: () => {
              addTraceRow(round, 4, "else:", `i=${cI}`, "奇数処理", "-");
            }
          });
          // Line 5: print(i)
          plan.push({
            lineIdx: 4,
            lineNo: 5,
            code: "        print(i)",
            round: round,
            action: () => {
              printTerm(String(cI));
              spawnPhysicsObj(`${cI} ☝️`, '#ffb86c');
              addTraceRow(round, 5, "print(i)", `i=${cI}`, "-", `${cI}`);
            }
          });
        }
      }

      return plan;
    },
    codeLines: (params) => [
      { lineNo: 1, code: `for i in range(${Number(params.maxNum) + 1}):`, comment: `# 0から${params.maxNum}まで` },
      { lineNo: 2, code: "    if i % 2 == 0:", comment: "# 偶数判定", indent: 1 },
      { lineNo: 3, code: "        print(str(i) + '〇')", comment: "# 〇付きで出力", indent: 2 },
      { lineNo: 4, code: "    else:", comment: "# 奇数のとき", indent: 1 },
      { lineNo: 5, code: "        print(i)", comment: "# そのまま出力", indent: 2 }
    ]
  }
];

// =================================================================
// Runtime Execution Controller (統一ステップ進行エンジン)
// =================================================================

let currentStepIdx = 0;
let currentExecIdx = -1; // 実行プラン中の現在インデックス
let executionPlan = [];
let stepParams = {};
let autoTimer = null;
let isZoomed = false;

function initStep(stepIdx) {
  currentStepIdx = stepIdx;
  currentExecIdx = -1;
  stopAuto();

  const stepDef = stepsData[currentStepIdx];

  // Header更新
  document.getElementById('step-display').innerText = stepDef.title;
  document.getElementById('step-badge').innerText = stepDef.badge;

  // パラメータ初期化
  stepParams = {};
  if (stepDef.params) {
    stepDef.params.forEach(p => {
      stepParams[p.id] = p.default;
    });
  }

  renderParamBar(stepDef.params);
  renderCode();
  rebuildExecutionPlan();

  // 画面・内部状態のリセット
  clearWorld();
  clearMemoryRack();
  clearLoopStage();
  clearTerminal();
  clearTraceTable();

  setExplanation("準備完了。「⏭ STEP」または Spaceキーで1行ずつループ処理を実行してみよう！");
  playBeep();
}

function renderParamBar(paramsList) {
  const bar = document.getElementById('input-param-bar');
  const container = document.getElementById('param-controls');
  container.innerHTML = '';

  if (!paramsList || paramsList.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  paramsList.forEach(p => {
    const wrap = document.createElement('div');
    wrap.className = 'param-item';

    if (p.options && p.options.length > 0) {
      wrap.innerHTML = `
        <label>${p.label}:</label>
        <select id="param-${p.id}" class="param-select">
          ${p.options.map(opt => `<option value="${opt}" ${opt === p.default ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      `;
    } else {
      wrap.innerHTML = `
        <label>${p.label}:</label>
        <input type="${p.type}" id="param-${p.id}" class="param-input" value="${p.default}">
      `;
    }
    container.appendChild(wrap);
  });
}

function applyParamsAndRun() {
  const stepDef = stepsData[currentStepIdx];
  if (stepDef.params) {
    stepDef.params.forEach(p => {
      const el = document.getElementById(`param-${p.id}`);
      if (el) {
        stepParams[p.id] = p.type === 'number' ? Number(el.value) : el.value;
      }
    });
  }

  currentExecIdx = -1;
  stopAuto();
  renderCode();
  rebuildExecutionPlan();

  clearWorld();
  clearMemoryRack();
  clearLoopStage();
  clearTerminal();
  clearTraceTable();

  setExplanation("パラメータを変更しました。「⏭ STEP」を押して新しい反復処理を追ってみよう！");
  playSuccess();
}

function rebuildExecutionPlan() {
  const stepDef = stepsData[currentStepIdx];
  executionPlan = stepDef.generateExecutionPlan(stepParams);
}

function renderCode() {
  const stepDef = stepsData[currentStepIdx];
  const codeLines = stepDef.codeLines(stepParams);
  const codeContent = document.getElementById('code-content');
  codeContent.innerHTML = '';

  codeLines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'code-line';
    row.id = `code-line-${idx}`;

    let indentHtml = '';
    const indentCount = line.indent || 0;
    for (let i = 0; i < indentCount; i++) {
      indentHtml += '<span class="indent-tab"></span>';
    }

    const trimmedCode = line.code.trimStart();
    const highlightedCode = highlightSyntax(escapeHtml(trimmedCode));
    const commStr = line.comment ? ` <span class="hl-comment">${escapeHtml(line.comment)}</span>` : '';

    row.innerHTML = `
      <span class="line-num">${line.lineNo}</span>
      <span class="line-text">${indentHtml}${highlightedCode}${commStr}</span>
    `;
    codeContent.appendChild(row);
  });
}

function highlightSyntax(code) {
  const strPlaceholders = [];
  let res = code.replace(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*")/g, (m) => {
    strPlaceholders.push(m);
    return `___STR_${strPlaceholders.length - 1}___`;
  });

  res = res.replace(/\b(for|while|in|if|else|break)\b/g, '<span class="hl-keyword">$1</span>');
  res = res.replace(/\b(range|print|int|str|len)\b/g, '<span class="hl-func">$1</span>');
  res = res.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

  res = res.replace(/___STR_(\d+)___/g, (m, idx) => {
    return `<span class="hl-string">${strPlaceholders[idx]}</span>`;
  });

  return res;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCurrentLine(lineIdx) {
  const stepDef = stepsData[currentStepIdx];
  const codeLines = stepDef.codeLines(stepParams);

  codeLines.forEach((_, idx) => {
    const row = document.getElementById(`code-line-${idx}`);
    if (!row) return;
    row.classList.remove('active');
    if (idx === lineIdx) {
      row.classList.add('active');
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function stepForward() {
  if (currentExecIdx >= executionPlan.length - 1) {
    stopAuto();
    setExplanation("✨ この反復プログラムの実行はすべて完了しました！「🔄 RESET」または次のステップへどうぞ。");
    playSuccess();
    return;
  }

  currentExecIdx++;
  const stepItem = executionPlan[currentExecIdx];

  highlightCurrentLine(stepItem.lineIdx);
  if (stepItem.action) {
    stepItem.action();
  }
}

function stepBack() {
  if (currentExecIdx <= 0) {
    resetCurrentStep();
    return;
  }

  stopAuto();
  const targetExec = currentExecIdx - 1;

  clearWorld();
  clearMemoryRack();
  clearLoopStage();
  clearTerminal();
  clearTraceTable();

  currentExecIdx = -1;
  for (let i = 0; i <= targetExec; i++) {
    currentExecIdx = i;
    const item = executionPlan[i];
    if (item.action) {
      item.action();
    }
  }
  if (currentExecIdx >= 0) {
    highlightCurrentLine(executionPlan[currentExecIdx].lineIdx);
  }
  playBeep();
}

function toggleAuto() {
  const btn = document.getElementById('btn-auto');
  if (autoTimer) {
    stopAuto();
  } else {
    btn.classList.add('active');
    btn.innerText = '⏸ STOP';
    stepForward();
    autoTimer = setInterval(() => {
      if (currentExecIdx >= executionPlan.length - 1) {
        stopAuto();
      } else {
        stepForward();
      }
    }, 1200);
  }
}

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  const btn = document.getElementById('btn-auto');
  if (btn) {
    btn.classList.remove('active');
    btn.innerText = '▶ AUTO';
  }
}

function resetCurrentStep() {
  stopAuto();
  initStep(currentStepIdx);
}

function nextStep() {
  if (currentStepIdx < stepsData.length - 1) {
    initStep(currentStepIdx + 1);
  }
}

function prevStep() {
  if (currentStepIdx > 0) {
    initStep(currentStepIdx - 1);
  }
}

function toggleZoom() {
  isZoomed = !isZoomed;
  const btn = document.getElementById('zoom-btn');
  if (isZoomed) {
    document.body.classList.add('zoom-mode');
    btn.innerText = '🔍 RESET';
  } else {
    document.body.classList.remove('zoom-mode');
    btn.innerText = '🔍 ZOOM';
  }
}

// === Keyboard Shortcuts ===
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    stepForward();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    nextStep();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    prevStep();
  } else if (e.key === 'r' || e.key === 'R') {
    resetCurrentStep();
  }
});

// === Initial Startup ===
window.addEventListener('DOMContentLoaded', () => {
  initPhysics();
  initStep(0);
});

