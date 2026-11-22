// Vorführung „So funktioniert Voxmira“ (~60 s, 5 Szenen, läuft endlos) – Skript siehe EINFUEHRUNGSVIDEO.md
// Ein zusammenhängender Chat mit Mira: Sie fragt, man antwortet per Diktat.
(function () {
  const T = {
    de: {
      idle: 'Bereit', rec: 'Ich höre zu …', busy: 'Wird erkannt …', done: 'Eingefügt ✓',
      en: 'Englisch – ich höre zu …', free: 'Freihand – antippen zum Beenden', send: '· wird abgeschickt ↵',
      ctrl: 'Strg', hands: '🙌 Hände frei', online: 'online', ph: 'Nachricht schreiben …', next: 'Weiter ›',
      m1: 'Hey! Kommst du heute Abend zum Essen? 🍝',
      say1: 'Ja, sehr gerne! Ich bin so gegen acht bei dir.',
      s1: ['Halte die rechte Strg-Taste gedrückt …', '… und sprich ganz normal.', 'Loslassen –', '– und der Text steht da. In jedem Programm.'],
      m2: 'Super! Mein Kollege Tom aus London kommt auch. Er liest mit – schreib ruhig auf Englisch 😊',
      say2: 'Schön, ich freue mich schon, Tom kennenzulernen! Ich bringe einen guten Wein mit.',
      out2: 'Great, I’m looking forward to meeting Tom! I’ll bring a good bottle of wine.',
      s2: ['Strg halten + Shift drücken:', 'Du sprichst Deutsch …', '… und Voxmira schreibt Englisch.'],
      m3: 'Perfekt! Kannst du noch einen Nachtisch mitbringen? 🍰',
      say3: 'Klar, ich mache Tiramisu. Bis heute Abend!',
      s3: ['Beim Sprechen Enter drücken …', '… und die Nachricht ist sofort abgeschickt.'], hint3: 'Oder am Ende „absenden“ sagen.',
      m4: 'Wie war eigentlich dein Tag?',
      say4: 'Ziemlich voll. Vormittags zwei Meetings, danach habe ich die Präsentation fertig gemacht. Jetzt freue ich mich richtig auf heute Abend.',
      s4: ['Zweimal kurz tippen = Freihand.', 'Sprich, so lange du willst.', 'Einmal tippen beendet.'],
      s5: ['Sag einfach, was du brauchst.', 'Vertippt? Strg + Rücktaste entfernt das letzte Diktat.', 'Alles bleibt auf deinem PC. 100 % offline.'],
      punch: 'Taste halten. <span class="grad">Sprechen.</span> Loslassen.',
      cards: ['„neue Zeile“', '„Fragezeichen“', '„lösch den letzten Satz“'], undo: 'Strg + ⌫ = letztes Diktat weg',
      sum: ['Rechte Strg-Taste halten, sprechen, loslassen – der Text steht da. In jedem Programm.',
            'Strg halten + Shift drücken: Du sprichst Deutsch, Voxmira schreibt Englisch.',
            'Beim Sprechen Enter drücken – die Nachricht ist sofort abgeschickt.',
            'Zweimal kurz tippen = Freihand. Einmal tippen beendet.',
            'Alles bleibt auf deinem PC. 100 % offline.'],
    },
    en: {
      idle: 'Ready', rec: 'Listening …', busy: 'Recognizing …', done: 'Inserted ✓',
      en: 'English – listening …', free: 'Hands-free – tap to stop', send: '· sending ↵',
      ctrl: 'Ctrl', hands: '🙌 Hands-free', online: 'online', ph: 'Type a message …', next: 'Next ›',
      m1: 'Hey! Are you coming over for dinner tonight? 🍝',
      say1: 'Yes, I’d love to! I’ll be at your place around eight.',
      s1: ['Hold the right Ctrl key …', '… and just talk.', 'Release –', '– and your text appears. In any app.'],
      m2: 'Great! My colleague Tom from London is coming too. He’s reading along 😊',
      say2: 'Schön, ich freue mich schon, Tom kennenzulernen! Ich bringe einen guten Wein mit.',
      out2: 'Great, I’m looking forward to meeting Tom! I’ll bring a good bottle of wine.',
      s2: ['Hold Ctrl + press Shift:', 'You speak German …', '… Voxmira writes English.'],
      m3: 'Perfect! Could you bring a dessert too? 🍰',
      say3: 'Sure, I’ll make tiramisu. See you tonight!',
      s3: ['Press Enter while speaking …', '… and the message is sent right away.'], hint3: 'Or say “send” at the end.',
      m4: 'How was your day, by the way?',
      say4: 'Pretty busy. Two meetings in the morning, then I finished the presentation. Now I’m really looking forward to tonight.',
      s4: ['Tap twice = hands-free.', 'Talk as long as you like.', 'One tap to finish.'],
      s5: ['Just say what you need.', 'Mistake? Ctrl + Backspace removes the last dictation.', 'Everything stays on your PC. 100% offline.'],
      punch: 'Hold. <span class="grad">Speak.</span> Release.',
      cards: ['“new line”', '“question mark”', '“delete the last sentence”'], undo: 'Ctrl + ⌫ = last dictation gone',
      sum: ['Hold the right Ctrl key, talk, release – your text appears. In any app.',
            'Hold Ctrl + press Shift: you speak German, Voxmira writes English.',
            'Press Enter while speaking – the message is sent right away.',
            'Tap twice = hands-free. One tap to finish.',
            'Everything stays on your PC. 100% offline.'],
    },
  };
  // Szenenlängen in ms – genug Zeit, damit das Ergebnis wirken kann
  const DUR = [13500, 13500, 11500, 14000, 12500];

  const $ = id => document.getElementById(id);
  let film, bar, status, live, lvl, input, msgs, bubble, said, subEl, hintEl, keys, hands, over, segs, endBox, sendBtn;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gen = 0, paused = true, started = false, scene = 0, elapsed = 0, lvlTimer = 0, L = T.de;

  class Stop extends Error {}
  // Eine Uhr pro Szene; läuft nur, wenn nicht pausiert (z. B. weggescrollt)
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    if (started && !paused && !reduce) { elapsed += now - last; drawProgress(); }
    last = now;
  }, 40);
  function wait(ms) {
    const my = gen, target = elapsed + ms;
    return new Promise((res, rej) => {
      const tick = () => {
        if (my !== gen) return rej(new Stop());
        if (reduce || elapsed >= target) return res();
        setTimeout(tick, 30);
      };
      tick();
    });
  }
  const at = async t => { if (!reduce && t > elapsed) await wait(t - elapsed); };

  // ---- Bausteine ----
  function setBar(state, label, text) {
    bar.className = 'vbar ' + state;
    status.textContent = label;
    live.textContent = text || '';
    clearInterval(lvlTimer); lvl.style.width = '0';
    if (state === 'rec' || state === 'en') lvlTimer = setInterval(() => { lvl.style.width = (30 + Math.random() * 65) + '%'; }, 140);
  }
  function key(name, on) { const k = keys.querySelector('[data-k="' + name + '"]'); if (k) k.classList.toggle('on', on); }
  function allKeysUp() { keys.querySelectorAll('.on').forEach(k => k.classList.remove('on')); }
  function sub(t, h) { subEl.textContent = t; subEl.classList.remove('pop'); void subEl.offsetWidth; if (t) subEl.classList.add('pop'); hintEl.textContent = h || ''; }
  function setInput(t) { input.textContent = t; input.classList.toggle('empty', !t); input.classList.remove('pop'); void input.offsetWidth; if (t) input.classList.add('pop'); }
  async function speak(text, ms, suffix) {
    const w = text.split(' ');
    bubble.classList.add('show');
    for (let i = 1; i <= w.length; i++) {
      const part = w.slice(0, i).join(' ');
      said.textContent = '„' + part + (i === w.length ? '“' : ' …');
      live.textContent = part + (suffix && suffix() ? ' ' + L.send : '');
      await wait(ms / w.length);
    }
  }
  function hideBubble() { bubble.classList.remove('show'); }
  function addMsg(t, mine) {
    const d = document.createElement('div');
    d.className = 'msg ' + (mine ? 'out' : 'in');
    d.textContent = t;
    msgs.appendChild(d);
    while (msgs.children.length > 6) msgs.removeChild(msgs.firstChild);
    return d;
  }
  // Mira „schreibt …“ und dann kommt ihre Frage
  async function incoming(t) {
    const d = addMsg('', false);
    d.classList.add('typing'); d.innerHTML = '<i></i><i></i><i></i>';
    await wait(1100);
    d.classList.remove('typing'); d.textContent = t;
  }
  // Eingefügten Text mit dem Senden-Knopf abschicken
  async function sendInput() {
    sendBtn.classList.add('on');
    await wait(250);
    sendBtn.classList.remove('on');
    const t = input.textContent;
    input.classList.add('fly');
    await wait(400);
    setInput(''); input.classList.remove('fly'); addMsg(t, true);
  }

  function reset() {
    allKeysUp(); hideBubble(); hands.classList.remove('show');
    over.className = 'fover'; over.innerHTML = '';
    $('fLogo').classList.remove('show');
    endBox.classList.remove('show', 'next');
    msgs.innerHTML = '';
    setInput(''); setBar('idle', L.idle); sub('', '');
    $('fPh').textContent = L.ph;
  }

  // ---- Szenen ----
  const S = [
    async () => {
      await incoming(L.m1);
      await at(1800); sub(L.s1[0]);
      await at(3000); key('ctrl', true); setBar('rec', L.rec);
      await at(3600); sub(L.s1[1]); await speak(L.say1, 4200);
      await at(8300); key('ctrl', false); hideBubble(); setBar('busy', L.busy); sub(L.s1[2]);
      await at(8900); setInput(L.say1); setBar('done', L.done); sub(L.s1[3]);
      await at(10600); setBar('idle', L.idle);
      await at(11300); await sendInput();
    },
    async () => {
      await incoming(L.m2);
      await at(1800); sub(L.s2[0]);
      await at(3000); key('ctrl', true); key('shift', true); setBar('en', L.en);
      await at(3600); sub(L.s2[1]); await speak(L.say2, 4400);
      await at(8100); allKeysUp(); hideBubble(); setBar('busy', L.busy);
      await at(8700); setInput(L.out2); setBar('done', L.done); sub(L.s2[2]);
      await at(10400); setBar('idle', L.idle);
      await at(11100); await sendInput();
    },
    async () => {
      await incoming(L.m3);
      await at(1800); key('ctrl', true); setBar('rec', L.rec); sub(L.s3[0]);
      await at(2400);
      let enter = false;
      const p = speak(L.say3, 3400, () => enter);
      await at(4000); enter = true; key('enter', true); live.textContent += ' ' + L.send;
      await p;
      await at(6200); allKeysUp(); hideBubble(); setBar('busy', L.busy);
      await at(6700); setInput(L.say3); setBar('done', L.done);
      await at(7100); input.classList.add('fly');
      await at(7500); setInput(''); input.classList.remove('fly'); addMsg(L.say3, true); sub(L.s3[1]);
      await at(8700); hintEl.textContent = L.hint3; setBar('idle', L.idle);
    },
    async () => {
      await incoming(L.m4);
      await at(1800); sub(L.s4[0]);
      for (const t of [2100, 2350, 2700, 2950]) { await at(t); key('ctrl', t === 2100 || t === 2700); }
      await at(3300); setBar('rec', L.free); hands.classList.add('show'); sub(L.s4[1]);
      await speak(L.say4, 5200);
      await at(8900); key('ctrl', true); await at(9100); key('ctrl', false);
      hideBubble(); hands.classList.remove('show'); setBar('busy', L.busy); sub(L.s4[2]);
      await at(9600); setInput(L.say4); setBar('done', L.done);
      await at(11300); setBar('idle', L.idle);
      await at(12000); await sendInput();
    },
    async () => {
      sub(L.s5[0]); over.className = 'fover cards';
      for (let i = 0; i < 3; i++) {
        await at(400 + i * 700);
        const c = document.createElement('span'); c.className = 'chip'; c.textContent = '🎙️ ' + L.cards[i]; over.appendChild(c);
      }
      await at(4200);
      const u = document.createElement('span'); u.className = 'chip key'; u.textContent = L.undo; over.appendChild(u);
      sub(L.s5[1]); key('ctrl', true); key('back', true);
      await at(5000); allKeysUp();
      await at(6600); over.classList.add('out');           // Befehls-Kärtchen ausblenden
      await at(7200); over.className = 'fover'; over.innerHTML = '';
      $('fPunch').innerHTML = L.punch; $('fLogo').classList.add('show'); sub(L.s5[2]);
    },
  ];

  // ---- Ablauf ----
  async function play(from) {
    const my = ++gen;
    paused = false; started = true;
    for (scene = from; scene < S.length; scene++) {
      elapsed = 0; drawProgress();
      if (scene === from || reduce || scene === 0) reset();
      try { await S[scene](); await at(DUR[scene]); } catch (e) { if (e instanceof Stop) return; throw e; }
      if (my !== gen) return;
      if (reduce) { sub(L.sum[scene]); paused = true; elapsed = DUR[scene]; drawProgress(); if (scene < S.length - 1) endBox.classList.add('show', 'next'); return; }
    }
    play(0); // läuft endlos weiter
  }
  function drawProgress() {
    segs.forEach((s, i) => {
      const f = i < scene ? 1 : i > scene ? 0 : Math.min(1, elapsed / DUR[i]);
      s.firstChild.style.width = (f * 100) + '%';
    });
  }
  function jump(i) { play(i); }

  function applyLang() {
    L = T[document.documentElement.dataset.lang] || T.de;
    $('fCtrl').textContent = L.ctrl; hands.textContent = L.hands; $('fOnline').textContent = L.online; $('fNext').textContent = L.next;
    if (started) jump(scene); else reset();
  }

  document.addEventListener('DOMContentLoaded', () => {
    film = $('film'); bar = $('fBar'); status = $('fStatus'); live = $('fLive'); lvl = $('fLvl');
    input = $('fInput'); msgs = $('fMsgs'); bubble = $('fBubble'); said = $('fSaid'); subEl = $('fSub'); hintEl = $('fHint');
    keys = $('fKeys'); hands = $('fHands'); over = $('fOver'); endBox = $('fEnd'); sendBtn = film.querySelector('.sendb');
    segs = Array.from(document.querySelectorAll('#fSegs button'));
    segs.forEach((s, i) => s.addEventListener('click', () => jump(i)));
    $('fNext').addEventListener('click', () => jump(scene + 1));
    applyLang();
    if (reduce) { play(0); return; }
    // startet automatisch, sobald die Vorführung zu sehen ist; pausiert, wenn weggescrollt
    new IntersectionObserver(es => {
      const visible = es[0].isIntersecting;
      if (visible && !started) play(0);
      else if (started) paused = !visible;
    }, { threshold: 0.45 }).observe(film);
    new MutationObserver(applyLang).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  });
})();
