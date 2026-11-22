// Vorführung „So funktioniert Voxmira“ (~35 s, 5 Szenen) – Skript siehe EINFUEHRUNGSVIDEO.md
(function () {
  const T = {
    de: {
      idle: 'Bereit', rec: 'Ich höre zu …', busy: 'Wird erkannt …', done: 'Eingefügt ✓',
      en: 'Englisch – ich höre zu …', free: 'Freihand – antippen zum Beenden', send: '· wird abgeschickt ↵',
      ctrl: 'Strg', hands: '🙌 Hände frei', online: 'online', incoming: 'Wo bleibst du? 🙂', ph: 'Nachricht schreiben …',
      replay: 'Nochmal ansehen ↻', play: 'Abspielen', pause: 'Pause', next: 'Weiter ›',
      s1: ['Halte die rechte Strg-Taste gedrückt …', '… und sprich ganz normal.', 'Loslassen –', '– und der Text steht da. In jedem Programm.'],
      say1: 'Hallo Mira, ich bin in zehn Minuten da.',
      s2: ['Strg halten + Shift drücken:', 'Du sprichst Deutsch …', '… und Voxmira schreibt Englisch.'],
      s3: ['Beim Sprechen Enter drücken …', '… und die Nachricht ist sofort abgeschickt.'], hint3: 'Oder am Ende „absenden“ sagen.',
      say3: 'Passt, bis gleich!',
      s4: ['Zweimal kurz tippen = Freihand.', 'Sprich, so lange du willst.', 'Einmal tippen beendet.'],
      say4: 'Die Folien sind fertig. Ich schaue sie mir heute Abend noch einmal an und schicke sie dir dann.',
      s5: ['Sag einfach, was du brauchst.', 'Vertippt? Strg + Rücktaste entfernt das letzte Diktat.', 'Alles bleibt auf deinem PC. 100 % offline.'],
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
      ctrl: 'Ctrl', hands: '🙌 Hands-free', online: 'online', incoming: 'Where are you? 🙂', ph: 'Type a message …',
      replay: 'Watch again ↻', play: 'Play', pause: 'Pause', next: 'Next ›',
      s1: ['Hold the right Ctrl key …', '… and just talk.', 'Release –', '– and your text appears. In any app.'],
      say1: 'Hi Mira, I’ll be there in ten minutes.',
      s2: ['Hold Ctrl + press Shift:', 'You speak German …', '… Voxmira writes English.'],
      s3: ['Press Enter while speaking …', '… and the message is sent right away.'], hint3: 'Or say “send” at the end.',
      say3: 'Sounds good, see you soon!',
      s4: ['Tap twice = hands-free.', 'Talk as long as you like.', 'One tap to finish.'],
      say4: 'The slides are done. I’ll look over them again tonight and send them to you afterwards.',
      s5: ['Just say what you need.', 'Mistake? Ctrl + Backspace removes the last dictation.', 'Everything stays on your PC. 100% offline.'],
      cards: ['“new line”', '“question mark”', '“delete the last sentence”'], undo: 'Ctrl + ⌫ = last dictation gone',
      sum: ['Hold the right Ctrl key, talk, release – your text appears. In any app.',
            'Hold Ctrl + press Shift: you speak German, Voxmira writes English.',
            'Press Enter while speaking – the message is sent right away.',
            'Tap twice = hands-free. One tap to finish.',
            'Everything stays on your PC. 100% offline.'],
    },
  };
  const DUR = [9000, 8000, 6000, 6000, 6000];

  const $ = id => document.getElementById(id);
  let film, bar, status, live, lvl, input, msgs, bubble, said, subEl, hintEl, keys, hands, over, segs, playBtn, endBox;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gen = 0, paused = true, started = false, scene = 0, elapsed = 0, visible = false, lvlTimer = 0, L = T.de;

  class Stop extends Error {}
  // Eine Uhr pro Szene; läuft nur, wenn nicht pausiert
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
  function sub(t, h) { subEl.textContent = t; subEl.classList.remove('pop'); void subEl.offsetWidth; subEl.classList.add('pop'); hintEl.textContent = h || ''; }
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
    while (msgs.children.length > 3) msgs.removeChild(msgs.firstChild);
    return d;
  }

  function reset() {
    allKeysUp(); hideBubble(); hands.classList.remove('show');
    over.className = 'fover'; over.innerHTML = '';
    endBox.classList.remove('show');
    msgs.innerHTML = ''; addMsg(L.incoming, false);
    setInput(''); setBar('idle', L.idle); sub('', '');
    $('fPh').textContent = L.ph;
  }

  // ---- Szenen ----
  const S = [
    async () => {
      sub(L.s1[0]);
      await at(1000); key('ctrl', true); setBar('rec', L.rec);
      await at(1500); sub(L.s1[1]); await speak(L.say1, 3600);
      await at(5500); key('ctrl', false); hideBubble(); setBar('busy', L.busy); sub(L.s1[2]);
      await at(6000); setInput(L.say1); setBar('done', L.done); sub(L.s1[3]);
      await at(7500); setBar('idle', L.idle);
    },
    async () => {
      setInput(''); sub(L.s2[0]);
      await at(1000); key('ctrl', true); key('shift', true); setBar('en', L.en);
      await at(1500); sub(L.s2[1]); await speak('Wir sehen uns morgen um drei.', 3000);
      await at(5000); allKeysUp(); hideBubble(); setBar('busy', L.busy);
      await at(5500); setInput('See you tomorrow at three.'); setBar('done', L.done); sub(L.s2[2]);
      await at(7000); setBar('idle', L.idle);
    },
    async () => {
      setInput(''); key('ctrl', true); setBar('rec', L.rec); sub(L.s3[0]);
      await at(500);
      let enter = false;
      const p = speak(L.say3, 2400, () => enter);
      await at(1600); enter = true; key('enter', true); live.textContent += ' ' + L.send;
      await p;
      await at(3500); allKeysUp(); hideBubble(); setBar('busy', L.busy);
      await at(3900); setInput(L.say3); setBar('done', L.done);
      await at(4300); input.classList.add('fly');
      await at(4700); setInput(''); input.classList.remove('fly'); addMsg(L.say3, true); sub(L.s3[1]);
      await at(5200); hintEl.textContent = L.hint3; setBar('idle', L.idle);
    },
    async () => {
      setInput(''); sub(L.s4[0]);
      for (const t of [200, 450, 700, 950]) { await at(t); key('ctrl', (t / 250) % 2 < 1); }
      await at(1000); key('ctrl', false); setBar('rec', L.free); hands.classList.add('show'); sub(L.s4[1]);
      await speak(L.say4, 2800);
      await at(4000); key('ctrl', true); await at(4150); key('ctrl', false);
      hideBubble(); hands.classList.remove('show'); setBar('busy', L.busy); sub(L.s4[2]);
      await at(4500); setInput(L.say4); setBar('done', L.done);
      await at(5500); setBar('idle', L.idle);
    },
    async () => {
      if (!input.textContent) setInput(L.say4); // damit Strg + ⌫ auch nach einem Sprung etwas löscht
      sub(L.s5[0]); over.className = 'fover cards';
      for (let i = 0; i < 3; i++) {
        await at(200 + i * 500);
        const c = document.createElement('span'); c.className = 'chip'; c.textContent = '🎙️ ' + L.cards[i]; over.appendChild(c);
      }
      await at(2500);
      const u = document.createElement('span'); u.className = 'chip key'; u.textContent = L.undo; over.appendChild(u);
      sub(L.s5[1]); key('ctrl', true); key('back', true);
      await at(3000); allKeysUp(); setInput('');
      await at(4500); over.className = 'fover logo'; over.innerHTML = '<img src="logo.svg" alt=""><b>Voxmira</b>'; sub(L.s5[2]);
      await at(6000);
    },
  ];

  // ---- Ablauf ----
  async function play(from) {
    const my = ++gen;
    paused = false; started = true; drawPlay();
    for (scene = from; scene < S.length; scene++) {
      elapsed = 0; drawProgress();
      if (scene === from || reduce) reset();
      try { await S[scene](); await at(DUR[scene]); } catch (e) { if (e instanceof Stop) return; throw e; }
      if (my !== gen) return;
      if (reduce) { sub(L.sum[scene]); paused = true; drawPlay(); elapsed = DUR[scene]; drawProgress(); showNext(scene); return; }
    }
    finish();
  }
  function finish() { paused = true; scene = S.length - 1; elapsed = DUR[scene]; drawProgress(); drawPlay(); endBox.classList.add('show'); }
  function showNext(i) {
    if (i >= S.length - 1) { endBox.classList.add('show'); return; }
    endBox.classList.add('show', 'next');
  }
  function drawProgress() {
    segs.forEach((s, i) => {
      const f = i < scene ? 1 : i > scene ? 0 : Math.min(1, elapsed / DUR[i]);
      s.firstChild.style.width = (f * 100) + '%';
      s.classList.toggle('cur', i === scene);
    });
  }
  function drawPlay() {
    playBtn.classList.toggle('paused', paused);
    playBtn.setAttribute('aria-label', paused ? L.play : L.pause);
    $('fReplay').textContent = L.replay; $('fNext').textContent = L.next;
  }
  function jump(i) { endBox.classList.remove('show', 'next'); play(i); }

  function applyLang() {
    L = T[document.documentElement.dataset.lang] || T.de;
    $('fCtrl').textContent = L.ctrl; hands.textContent = L.hands; $('fOnline').textContent = L.online;
    drawPlay();
    if (started) jump(scene); else reset();
  }

  document.addEventListener('DOMContentLoaded', () => {
    film = $('film'); bar = $('fBar'); status = $('fStatus'); live = $('fLive'); lvl = $('fLvl');
    input = $('fInput'); msgs = $('fMsgs'); bubble = $('fBubble'); said = $('fSaid'); subEl = $('fSub'); hintEl = $('fHint');
    keys = $('fKeys'); hands = $('fHands'); over = $('fOver'); playBtn = $('fPlay'); endBox = $('fEnd');
    segs = Array.from(document.querySelectorAll('#fSegs button'));
    segs.forEach((s, i) => s.addEventListener('click', () => jump(i)));
    playBtn.addEventListener('click', () => {
      if (!started || endBox.classList.contains('show')) return jump(endBox.classList.contains('next') ? scene + 1 : started ? 0 : 0);
      paused = !paused; drawPlay();
    });
    $('fReplay').addEventListener('click', () => jump(0));
    $('fNext').addEventListener('click', () => jump(scene + 1));
    applyLang();
    sub(L.s1[0]);
    new MutationObserver(applyLang).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
    // startet automatisch, sobald die Vorführung zu sehen ist; pausiert, wenn weggescrollt
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && !started && !reduce) play(0);
      else if (started && !endBox.classList.contains('show')) { paused = !visible; drawPlay(); }
    }, { threshold: 0.45 }).observe(film);
  });
})();
