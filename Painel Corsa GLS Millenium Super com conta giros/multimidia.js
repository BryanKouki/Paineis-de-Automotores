// Multimídia das versões "Dashboard com Multimidia": mensagem, tocador de música, mapa e relógio.
// Aberto pelo executável, o tocador mostra e controla o que está tocando no Windows, em qualquer programa: o executável
// serve de ponte e passa a porta pelo endereço (?ponte=...). Aberto direto no navegador, toca os arquivos que a pessoa adicionar.
// O cartão de mensagem e o mapa são só visuais. O mesmo arquivo é usado em todos os painéis (uma cópia em cada pasta).
const Multimidia = (() => {
  const $ = id => document.getElementById(id);
  // tema escuro neutro; cada painel troca o que quiser
  const TEMA = { cartao: '#1c1e22', borda: '#34373d', botao: '#2e3137', sub: '#a9adb4', rua: '#2b2e34', mapa: '#14161a', acento: '#ff7a2e',
    capa: ['#ff9a55', '#7a3410'], hora: '500 32px Bahnschrift,"Arial Narrow",Arial,sans-serif', horaCor: null };
  const CSS = `.mm text{font-family:system-ui,"Segoe UI",sans-serif;fill:#f3f5f7}
.mm .card{fill:var(--cartao);stroke:var(--borda);stroke-width:1.5}
.mm .sub{fill:var(--sub);font-size:22px}
.mm .tit{font-size:30px;font-weight:600}
.mm .btn{fill:var(--botao)}
.mm [role=button]{cursor:pointer}
.mm .i{fill:#f3f5f7}
.mm .l{fill:none;stroke:#f3f5f7;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.mm .rua{fill:none;stroke:var(--rua);stroke-linecap:round}`;
  const PLAY = 'M746,510v52l40-26z', PAUSE = 'M744,512h12v48h-12zM764,512h12v48h-12z';

  // "Artista - Título.mp3" -> ['Artista', 'Título']; sem o traço, o nome inteiro é o título
  const partes = nome => { const s = nome.replace(/\.[^.]+$/, ''), k = s.indexOf(' - '); return k < 0 ? ['', s] : [s.slice(0, k), s.slice(k + 3)]; };
  const curto = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  const tempo = t => isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '0:00';
  console.assert(partes('Fulano - Estrada.mp3').join('|') === 'Fulano|Estrada' && partes('so titulo.wav')[1] === 'so titulo' && tempo(75.9) === '1:15' && curto('abcdef', 4) === 'abc…', 'multimidia');

  // pinta o tocador: posição e duração em segundos
  const pinta = (titulo, artista, pos, dur, tocando) => {
    // título com até 13 letras cabe no cartão; de 14 a 17 é espremido na largura; acima disso é cortado
    const e = $('mmTitulo'); e.textContent = curto(titulo, 17); titulo.length > 13 ? e.setAttribute('textLength', 214) : e.removeAttribute('textLength');
    $('mmArtista').textContent = curto(artista, 19);
    $('mmBarra').setAttribute('d', `M600,430H${(600 + 320 * (dur ? Math.min(1, pos / dur) : 0)).toFixed(1)}`);
    $('mmT0').textContent = tempo(pos); $('mmT1').textContent = tempo(dur);
    $('mmPPIcon').setAttribute('d', tocando ? PAUSE : PLAY);
  };
  const botao = (id, fn) => { $(id).onclick = fn; $(id).onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } }; };
  const fracao = e => { const r = $('mmSeek').getBoundingClientRect(); return (e.clientX - r.left) / r.width; }; // onde clicou na barra, de 0 a 1

  // ---- música do computador: a ponte (o executável) diz o que o Windows está tocando e repassa os comandos ----
  function doSistema(base) {
    const NADA = { titulo: '', artista: '', tocando: false, pos: 0, dur: 0, capa: '' };
    let agora = NADA, capa = '';
    const pede = rota => fetch(`${base}/${rota}`).catch(() => {});
    const atualiza = async () => {
      try { agora = await (await fetch(`${base}/agora`)).json(); } catch (e) { agora = NADA; } // ponte fechada
      pinta(agora.titulo || 'Nada tocando', agora.titulo ? agora.artista : 'Toque algo no PC', agora.pos, agora.dur, agora.tocando);
      if (agora.capa !== capa) { capa = agora.capa; $('mmCapaImg').style.display = capa ? '' : 'none'; if (capa) $('mmCapaImg').setAttribute('href', `${base}/capa?v=${capa}`); }
    };
    const manda = rota => () => pede(rota).then(atualiza);
    botao('mmPP', manda('tocar')); botao('mmNext', manda('proxima')); botao('mmPrev', manda('anterior'));
    $('mmSeek').onclick = e => { if (agora.dur) pede(`posicao?t=${(fracao(e) * agora.dur).toFixed(1)}`).then(atualiza); };
    for (const a of ['role', 'tabindex', 'aria-label']) $('mmAdd').removeAttribute(a); // aqui a capa não é botão
    setInterval(atualiza, 1000); atualiza();
  }

  // ---- sem o executável: toca os arquivos que a pessoa escolher ----
  function dosArquivos() {
    const audio = new Audio(), lista = [];
    let atual = 0;
    const mostra = () => {
      if (!lista.length) return pinta('Sem músicas', 'Adicione arquivos', 0, 0, false);
      const [artista, titulo] = partes(lista[atual].nome);
      pinta(titulo, artista || `Música ${atual + 1} de ${lista.length}`, audio.currentTime, audio.duration, !audio.paused);
    };
    const carregar = (k, tocar) => {
      atual = (k + lista.length) % lista.length;
      audio.src = lista[atual].src;
      if (tocar) audio.play().catch(() => {}); // o navegador pode recusar sem um clique da pessoa
      mostra();
    };
    const arquivos = Object.assign(document.createElement('input'), { type: 'file', accept: 'audio/*', multiple: true, hidden: true });
    document.body.append(arquivos);
    arquivos.onchange = () => {
      const primeira = lista.length;
      for (const f of arquivos.files) lista.push({ nome: f.name, src: URL.createObjectURL(f) });
      if (lista.length > primeira) carregar(primeira, true);
      arquivos.value = '';
    };
    const adicionar = () => arquivos.click();
    botao('mmAdd', adicionar);
    botao('mmPP', () => !lista.length ? adicionar() : audio.paused ? audio.play().catch(() => {}) : audio.pause());
    botao('mmNext', () => lista.length && carregar(atual + 1, !audio.paused));
    botao('mmPrev', () => lista.length && (audio.currentTime > 3 ? (audio.currentTime = 0) : carregar(atual - 1, !audio.paused))); // depois de 3 s, volta ao começo da mesma
    $('mmSeek').onclick = e => { if (audio.duration) audio.currentTime = fracao(e) * audio.duration; };
    audio.ontimeupdate = audio.onloadedmetadata = audio.onplay = audio.onpause = mostra;
    audio.onended = () => carregar(atual + 1, true);
    audio.onerror = () => { $('mmArtista').textContent = 'Não consegui abrir'; };
    if ($('luzes')) { const b = document.createElement('button'); b.textContent = '🎵 Adicionar músicas'; b.onclick = adicionar; $('luzes').append(b); }
    mostra();
  }

  /**
   * Desenha a multimídia dentro de `target` (um <g> de um SVG 1920x720) e liga o tocador.
   * contato: nome que aparece no cartão de mensagem; tema: cores para trocar as de TEMA
   */
  function build({ target, contato, tema = {} }) {
    const t = { ...TEMA, ...tema }, iniciais = contato.split(/\s+/).map(p => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
    document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
    target.classList.add('mm');
    for (const k of ['cartao', 'borda', 'botao', 'sub', 'rua']) target.style.setProperty('--' + k, t[k]);
    const alvo = (id, rotulo, x, y, w, h, dentro) => `<g id="${id}" role="button" tabindex="0" aria-label="${rotulo}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>${dentro}</g>`;
    target.innerHTML = `<defs><linearGradient id="mmCapa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.capa[0]}"/><stop offset="1" stop-color="${t.capa[1]}"/></linearGradient>
      <clipPath id="mmMapa"><rect x="956" y="78" width="384" height="554" rx="24"/></clipPath><clipPath id="mmCapaClip"><rect x="600" y="290" width="88" height="88" rx="16"/></clipPath></defs>
    <rect class="card" x="580" y="78" width="360" height="176" rx="24"/>
    <circle cx="634" cy="130" r="32" fill="url(#mmCapa)"/><text x="634" y="139" text-anchor="middle" style="font-size:24px;font-weight:700">${iniciais}</text>
    <text class="tit" x="684" y="126"${contato.length > 13 ? ' textLength="236" lengthAdjust="spacingAndGlyphs"' : ''}>${contato}</text><text class="sub" x="684" y="158">Nova mensagem</text>
    <rect class="btn" x="600" y="186" width="152" height="50" rx="25"/><path class="i" d="M668,199v24l20-12z"/>
    <rect class="btn" x="768" y="186" width="152" height="50" rx="25"/><path class="l" d="M836,203l-10,8 10,8M826,211h20q12,0 12,12"/>

    <rect class="card" x="580" y="270" width="360" height="362" rx="24"/>
    ${alvo('mmAdd', 'Adicionar músicas', 600, 290, 88, 88, `<rect x="600" y="290" width="88" height="88" rx="16" fill="url(#mmCapa)"/><circle cx="644" cy="334" r="26" fill="none" stroke="#f3f5f7" stroke-width="3" opacity=".6"/><path class="l" style="stroke-width:4" d="M644,334l-16,14"/>` +
      `<image id="mmCapaImg" x="600" y="290" width="88" height="88" preserveAspectRatio="xMidYMid slice" clip-path="url(#mmCapaClip)" style="display:none"/>`)}
    <text id="mmTitulo" class="tit" x="706" y="328" lengthAdjust="spacingAndGlyphs"></text><text id="mmArtista" class="sub" x="706" y="360"></text>
    <path d="M600,430H920" fill="none" stroke="${t.botao}" stroke-width="6" stroke-linecap="round"/><path id="mmBarra" d="M600,430H600" fill="none" stroke="${t.acento}" stroke-width="6" stroke-linecap="round"/>
    ${alvo('mmSeek', 'Posição da música', 600, 414, 320, 32, '')}
    <text id="mmT0" class="sub" x="600" y="466" style="font-size:18px">0:00</text><text id="mmT1" class="sub" x="920" y="466" text-anchor="end" style="font-size:18px">0:00</text>
    ${alvo('mmPrev', 'Música anterior', 620, 500, 80, 72, '<path class="i" d="M636,512v48h8v-48zM684,512v48l-36-24z"/>')}
    <g id="mmPP" role="button" tabindex="0" aria-label="Tocar ou pausar"><circle class="btn" cx="760" cy="536" r="46"/><path id="mmPPIcon" class="i"/></g>
    ${alvo('mmNext', 'Próxima música', 820, 500, 80, 72, '<path class="i" d="M884,512v48h-8v-48zM836,512v48l36-24z"/>')}

    <g clip-path="url(#mmMapa)">
      <rect x="956" y="78" width="384" height="554" fill="${t.mapa}"/>
      <path class="rua" stroke-width="22" d="M940,470L1360,380M1010,60L1060,660M1260,60L1230,660"/><path class="rua" stroke-width="12" d="M940,330L1360,300M940,560L1360,540M1090,60L940,250"/>
      <path d="M1148,650V330Q1148,262 1086,250L940,222" fill="none" stroke="${t.acento}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="1148" cy="492" r="30" fill="${t.acento}" stroke="#f3f5f7" stroke-width="4"/><path class="i" d="M1148,474l13,30-13-7-13,7z"/>
    </g>
    <rect x="956" y="78" width="384" height="554" rx="24" fill="none" stroke="${t.borda}" stroke-width="1.5"/>
    <rect x="972" y="94" width="352" height="94" rx="18" fill="#1f7a45"/>
    <path class="l" d="M1010,128l-12,10 12,10M998,138h22q10,0 10,10v16"/>
    <text class="sub" x="1052" y="130" style="fill:#d6f2e0">2 km</text><text class="tit" x="1052" y="166">Av. Beira-Mar</text>
    <rect x="1018" y="566" width="260" height="50" rx="25" fill="${t.cartao}" stroke="${t.borda}"/>
    <path class="l" style="stroke-width:3" d="M1044,583l16,16M1060,583l-16,16"/><text x="1082" y="599" style="font-size:22px;fill:#63d68f;font-weight:600">28 min</text><text class="sub" x="1166" y="599">· 19 km</text>

    <path class="i" d="M604,664h8v8h-8zM620,664h8v8h-8zM636,664h8v8h-8zM604,680h8v8h-8zM620,680h8v8h-8zM636,680h8v8h-8zM604,696h8v8h-8zM620,696h8v8h-8zM636,696h8v8h-8z"/>
    <path class="l" style="stroke-width:3.5" d="M690,694h28q-5-5-5-16a9,9 0 0 0-18,0q0,11-5,16zM700,700a4,4 0 0 0 8,0"/>
    <path class="l" style="stroke-width:3.5" d="M774,668v14a6,6 0 0 0 12,0v-14a6,6 0 0 0-12,0zM768,682a12,12 0 0 0 24,0M780,694v8"/>
    <text id="mmHora" x="1338" y="698" text-anchor="end">--:--</text>`;
    Object.assign($('mmHora').style, { font: t.hora, fill: t.horaCor || t.acento }); // pelo JS: o nome da fonte pode ter aspas

    const hora = () => $('mmHora').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    hora(); setInterval(hora, 15000);

    const porta = new URLSearchParams(location.search).get('ponte');
    porta ? doSistema(`http://localhost:${porta}`) : dosArquivos();
  }

  return { build };
})();
