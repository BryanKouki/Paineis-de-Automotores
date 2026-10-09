// Controle de videogame e teclado: simulam o veículo andando (ignição, partida, motor, embreagem, marchas, arrasto, freios e
// combustível) e movem o painel pelos mesmos sliders. A marcha engatada fica no canto da janela, com um botão discreto que mostra
// as teclas. Nos carros, o miolo da ignição fica no canto dos controles.
//
// O controle segue o mapeamento do Gran Turismo 7: R2 acelera, L2 freia, ✕ sobe marcha, □ desce, ○ freio de mão, △ ré, L3 faróis.
// Diferenças: as setas ficam no direcional (esquerda/direita) em vez do touchpad; direcional para cima liga o farol alto;
// Options gira a ignição.
const Controle = (() => {
  const R2 = 7, L2 = 6, BOLA = 1; // índices do layout padrão da Gamepad API
  // funções de um toque: [botão do controle, tecla]. As teclas valem pela posição no teclado (e.code)
  const TOQUES = { sobe: [0, 'KeyE'], desce: [2, 'KeyQ'], re: [3, 'KeyR'], ignicao: [9, 'KeyI'], farol: [10, 'KeyL'], alto: [12, 'KeyF'], setaE: [14, 'KeyA'], setaD: [15, 'KeyD'] };
  const SEGURAR = { acel: 'KeyW', freio: 'KeyS', mao: 'Space' };
  // o que o botão do teclado mostra: função, tecla, botão do controle
  const AJUDA = [['Ignição e partida', 'I', 'Options'], ['Acelerar', 'W', 'R2'], ['Frear', 'S', 'L2'], ['Subir marcha', 'E', '✕'], ['Descer marcha', 'Q', '□'], ['Freio de mão', 'Espaço', '○'],
    ['Ré (parado)', 'R', '△'], ['Setas', 'A / D', 'Direcional ← →'], ['Farol alto', 'F', 'Direcional ↑'], ['Faróis (iluminação)', 'L', 'L3']];
  const G = 9.81, AR = 1.2, CONDUTOR = 75, RENDIMENTO = .9;
  const VISOR = `<style>#teclas{background:none;border:0;padding:4px;color:inherit;opacity:.3;line-height:0;cursor:pointer}
#teclas:hover,#teclas:focus-visible,#teclas[aria-expanded=true]{opacity:1}
#teclasLista{position:fixed;top:66px;right:10px;z-index:3;background:#15181bf5;border:1px solid #3a4350;border-radius:8px;padding:8px 12px;font:12px system-ui,sans-serif;color:#dde}
#teclasLista table{border-collapse:collapse}#teclasLista th,#teclasLista td{text-align:left;padding:2px 14px 2px 0}#teclasLista th{color:#8b949e;font-weight:400}</style>
<div style="position:fixed;top:24px;right:10px;z-index:3;display:flex;align-items:center;gap:6px;color:#e6e9ee;font:700 30px system-ui,sans-serif">
  <span id="aviso" style="font:600 12px system-ui,sans-serif;color:#ff7b6b"></span>
  <button id="teclas" aria-label="Teclas e botões para dirigir" aria-expanded="false" title="Teclas e botões para dirigir"><svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><rect x=".75" y=".75" width="20.5" height="14.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 5h2M8 5h2M12 5h2M16 5h2M4 8h2M8 8h2M12 8h2M16 8h2M6 11.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
  <span id="marcha" title="Marcha">N</span>
</div>
<div id="teclasLista" hidden><table><tr><th>Função</th><th>Teclado</th><th>Controle</th></tr>${AJUDA.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  // miolo da ignição dos carros: posições B (bloqueado), I (acessórios), II (ignição ligada) e III (partida, que volta sozinha para II).
  // Ângulos das marcas medidos na foto do miolo; a fenda fica na horizontal em B
  const FASES = [['B', -105], ['I', -18], ['II', 24], ['III', 52]];
  const MIOLO = `<style>#ctl{position:relative;padding-left:136px;padding-right:136px}
#chaveCarro{position:absolute;right:36px;bottom:6px;width:92px;height:92px;cursor:pointer;user-select:none;touch-action:none}
#chaveCarro:focus-visible{outline:2px solid #4a7fb5;outline-offset:2px;border-radius:50%}
#chaveCarro text{font:700 9.5px Arial,Helvetica,sans-serif;fill:#f4f4f2;text-anchor:middle;dominant-baseline:central;opacity:.5}
#chaveCarro .atual text{opacity:1}
#tambor{transition:transform .15s}</style>
<svg id="chaveCarro" viewBox="-50 -50 100 100" role="button" tabindex="0" aria-label="Ignição: posição B">
  <defs><linearGradient id="chaveMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9acb0"/><stop offset=".5" stop-color="#8b8e93"/><stop offset="1" stop-color="#6f7277"/></linearGradient></defs>
  <circle r="48.5" fill="#0b0b0c" stroke="#2c2d31" stroke-width="1.5"/>
  ${FASES.map(([nome, a], i) => `<g data-fase="${i}"${i ? '' : ' class="atual"'} transform="rotate(${a})"><rect x="-10" y="-49" width="20" height="19" fill="transparent"/><text y="-39.5">${nome}</text></g>`).join('')}
  <g id="tambor"><circle r="29.5" fill="url(#chaveMetal)" stroke="#050506" stroke-width="1.5"/><rect x="-18" y="-3.3" width="36" height="6.6" rx="1" fill="#26282c" stroke="#55585d" stroke-width=".6"/></g>
</svg>`;

  /**
   * v = dados do veículo: cv e rpmCv (potência máxima), kgfm e rpmKgfm (torque máximo), rpmMax, lenta,
   * marchas (relações), re (0 = não tem), final (diferencial; na moto, primária x coroa/pinhão),
   * pneu [largura mm, perfil %, aro pol], kg, cxA (Cx x área frontal, m²), inercia (do motor, kg·m²) e tanque (litros).
   * chave (só nos carros) = luzes que o miolo comanda: ateLigar (acendem em II e apagam quando o motor pega) e teste (acendem 3 s)
   */
  function ligar(v) {
    const $ = id => document.getElementById(id), luz = id => document.querySelector(`[data-luz="${id}"]`);
    const raio = (v.pneu[2] * 25.4 + 2 * v.pneu[0] * v.pneu[1] / 100) / 2000; // raio da roda, m
    const massa = v.kg + CONDUTOR, tMax = v.kgfm * G, tPot = v.cv * 735.5 / (v.rpmCv * Math.PI / 30);
    // torque a plena carga (N·m): parábola que passa pelo torque máximo e pelo torque na rotação de potência máxima
    const torque = rpm => Math.max(.4 * tMax, tMax - (tMax - tPot) * ((rpm - v.rpmKgfm) / (v.rpmCv - v.rpmKgfm)) ** 2);
    const atrito = rpm => tMax * (.1 + .04 * rpm / 1000);                     // freio-motor (atrito e bombeamento com o acelerador solto), N·m
    const rel = m => (m > 0 ? v.marchas[m - 1] : v.re) * v.final;             // relação total da marcha m (-1 = ré)
    const giro = (vel, m) => vel / raio * rel(m) * 30 / Math.PI;              // rpm que as rodas impõem ao motor engatado
    console.assert(torque(v.rpmKgfm) === tMax && Math.abs(torque(v.rpmCv) - tPot) < 1e-9 && tPot <= tMax, 'torque');

    document.body.insertAdjacentHTML('beforeend', VISOR);
    $('teclas').onclick = () => $('teclas').setAttribute('aria-expanded', !($('teclasLista').hidden = !$('teclasLista').hidden));

    // simulando = o teclado, o controle ou o miolo estão dirigindo; mexer num slider com o mouse devolve o comando aos sliders
    let simulando = false, marcha = 0, vel = 0, rpm = 0, acelT = 0, freioT = 0, antes = [], ultimo = performance.now(); // marcha: -1 ré, 0 neutro, 1…
    let maoAntes = false, chaveAntes = ''; // último estado do freio de mão e de ignição+marcha que a simulação passou para as luzes
    let cortando = false;                  // corte de giro em ação
    // combustível: a simulação gasta o que o slider mostra. Com o tanque praticamente vazio (meio por cento) o motor engasga por
    // alguns segundos e morre
    const porUnidade = v.tanque / +$('comb').max, SECO = .005 * v.tanque; // o slider da moto é em %, o dos carros em litros
    let litros = 0, secoDesde = null, morto = false;
    $('comb').addEventListener('input', e => { if (e.isTrusted) litros = +e.target.value * porUnidade; });
    // ignição dos carros: fase = posição do miolo (0 B, 1 I, 2 II, 3 III); rodando = motor funcionando
    let fase = 0, rodando = false, giraDesde = null, soltarEm = 0, pegouEm = -1e9, estadoAntes = 0, testeAte = 0;
    // dirigindo, os ponteiros respondem mais rápido (dá para ver a partida, o corte de giro e a queda do giro na troca de marcha)
    const ponteiros = () => { for (const id of ['nRpm', 'nVel']) if ($(id)) $(id).style.transitionDuration = simulando ? '80ms' : ''; };
    const ativa = () => { // assume de onde os sliders estão
      if (simulando) return;
      simulando = true; vel = (+$('vel').value || 0) / 3.6; litros = +$('comb').value * porUnidade; morto = litros <= SECO; ponteiros();
    };
    const seguras = new Set(), toques = new Set();
    for (const id of ['vel', 'rpm']) if ($(id)) $(id).addEventListener('input', e => { if (e.isTrusted) { simulando = false; ponteiros(); } });
    addEventListener('keydown', e => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.target.matches('select')) return;
      const toque = Object.keys(TOQUES).find(k => TOQUES[k][1] === e.code);
      if (toque) { if (!e.repeat) toques.add(toque); return; }
      if (!Object.values(SEGURAR).includes(e.code)) return;
      if (e.code === 'Space') { if (e.target.matches('button, input, [role=button]')) return; e.preventDefault(); } // espaço ainda aciona o botão em foco e não rola a página
      seguras.add(e.code);
    });
    addEventListener('keyup', e => seguras.delete(e.code));
    addEventListener('blur', () => seguras.clear());

    if (v.chave) { // miolo no canto dos controles: clique numa marca para girar até ela; segure a III (ou o miolo, estando em II) para dar a partida
      $('ctl').insertAdjacentHTML('beforeend', MIOLO);
      const m = $('chaveCarro');
      m.onpointerdown = e => {
        const marca = e.target.closest('[data-fase]');
        ativa(); soltarEm = 0;
        fase = marca ? +marca.dataset.fase : Math.min(3, fase + 1);
        if (fase === 3) try { m.setPointerCapture(e.pointerId); } catch (x) { } // segurando, a partida continua mesmo se o mouse sair de cima
      };
      m.onpointerup = m.onpointercancel = () => { if (fase === 3) fase = 2; }; // a partida volta sozinha para II
      m.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toques.add('ignicao'); } };
    }

    const mostra = (id, valor, passo) => { // escreve no slider e avisa o painel, só quando o número muda
      const e = $(id); if (!e) return;
      e.step = passo;
      const s = Math.min(+e.max, Math.max(0, valor)).toFixed(passo < 1 ? 1 : 0);
      if (e.value !== s) { e.value = s; e.dispatchEvent(new Event('input')); }
    };

    (function quadro(agora) {
      requestAnimationFrame(quadro);
      let pads = [];
      try { pads = [...navigator.getGamepads()].filter(Boolean); } catch (e) { } // dentro de um quadro sem permissão o navegador recusa
      const pad = pads.find(p => p.mapping === 'standard') || pads[0];
      const dt = Math.min(agora - ultimo, 100) / 1000; ultimo = agora;
      const b = pad ? pad.buttons.map(x => x.value) : [];
      for (const [nome, [i]] of Object.entries(TOQUES)) if (b[i] > .5 && !(antes[i] > .5)) toques.add(nome);
      antes = b;
      // no teclado o pedal é tudo ou nada; aqui ele desce e sobe aos poucos, como um pé
      const pedal = (atual, tecla) => atual + ((seguras.has(tecla) ? 1 : 0) - atual) * Math.min(1, dt * (seguras.has(tecla) ? 3 : 8));
      acelT = pedal(acelT, SEGURAR.acel); freioT = pedal(freioT, SEGURAR.freio);
      const acel = Math.max(b[R2] || 0, acelT), freio = Math.max(b[L2] || 0, freioT), mao = b[BOLA] > .5 || seguras.has(SEGURAR.mao);
      if (toques.size || seguras.size || mao || b[R2] > .1 || b[L2] > .1) ativa();
      if (!simulando) return;

      // marchas em sequência (ré, neutro, 1ª…). Como no jogo, não reduz se o giro passaria do limite nem engata a ré andando
      if (toques.has('sobe') && marcha < v.marchas.length) marcha++;
      if (toques.has('desce')) {
        const m = marcha - 1;
        if (m > 0 ? giro(vel, m) < v.rpmMax + 300 : m === 0 || (v.re && vel < 1)) marcha = m;
      }
      if (toques.has('re') && v.re && vel < 1) marcha = -1;

      // luzes
      if ((toques.has('setaE') || toques.has('setaD')) && luz('seta')) luz('seta').click();
      if (toques.has('alto') && luz('alto')) luz('alto').click();
      if (toques.has('farol')) $('luz').click();
      // as luzes do freio de mão, do neutro e as do miolo acompanham a simulação só no instante em que ela muda (puxou o freio,
      // trocou de marcha, girou a chave); entre uma mudança e outra os botões dessas luzes continuam funcionando normalmente
      if (mao !== maoAntes) { maoAntes = mao; if (luz('freio')) luz('freio').set(mao); }

      // ignição e partida
      let contato;
      if (v.chave) {
        // pela tecla ou pelo controle: desligado -> ignição (II) -> partida (segura a III por 0,9 s) -> com o motor funcionando, desliga
        if (toques.has('ignicao')) { if (fase < 2) fase = 2; else if (!rodando) { fase = 3; soltarEm = agora + 900; } else fase = 0; }
        if (fase === 3 && soltarEm && agora > soltarEm) { fase = 2; soltarEm = 0; }
        contato = fase >= 2;
        if (!contato || morto) rodando = false; // sem ignição ou depois da pane seca, só pega de novo dando a partida
        // o motor de partida gira o motor a uns 230 rpm; depois de 0,6 s girando, pega (se tiver combustível)
        if (fase === 3 && !rodando) { giraDesde = giraDesde ?? agora; if (agora - giraDesde > 600 && litros > SECO) { rodando = true; pegouEm = agora; } }
        else giraDesde = null;
        const estado = contato ? (rodando ? 2 : 1) : 0; // 0 desligado, 1 ignição ligada com o motor parado, 2 motor funcionando
        if (estado !== estadoAntes) {
          for (const id of v.chave.ateLigar) if (luz(id)) luz(id).set(estado === 1);
          if (!estadoAntes && estado) testeAte = agora + 3000;
          if (!estadoAntes && estado || !estado) for (const id of v.chave.teste) if (luz(id)) luz(id).set(!!estado);
          estadoAntes = estado;
        }
        if (testeAte && agora > testeAte) { testeAte = 0; for (const id of v.chave.teste) if (luz(id)) luz(id).set(false); }
        $('tambor').style.transform = `rotate(${FASES[fase][1] - FASES[0][1]}deg)`;
        $('chaveCarro').querySelectorAll('[data-fase]').forEach((g, i) => g.classList.toggle('atual', i === fase));
        $('chaveCarro').setAttribute('aria-label', `Ignição: posição ${FASES[fase][0]}${rodando ? ', motor funcionando' : ''}`);
      } else { // moto: o contato é o miolo do próprio painel, e o motor (a pedal) funciona enquanto ele estiver ligado
        if (toques.has('ignicao') && $('chaveBtn')) $('chaveBtn').click();
        contato = !$('chaveBtn') || $('chaveBtn').getAttribute('aria-pressed') === 'true';
        if (contato && !morto && !rodando) pegouEm = agora;
        rodando = contato && !morto;
      }
      toques.clear();
      const chave = contato + '|' + marcha;
      if (chave !== chaveAntes) { chaveAntes = chave; if (luz('neutro') && contato) luz('neutro').set(!marcha); }

      // combustível: quase a zero o motor engasga por uns segundos e morre; abastece-se mexendo no slider
      if (litros > SECO) { secoDesde = null; morto = false; }
      else if (!morto) { secoDesde = secoDesde ?? agora; morto = agora - secoDesde > 8000; }
      if (morto) litros = 0;
      const funciona = rodando && !morto;
      // engasgos: em fatias de 140 ms, pouco mais da metade delas sem queimar
      const engasgo = funciona && secoDesde !== null && Math.abs(Math.sin(Math.floor(agora / 140) * 12.9898) * 43758.5453) % 1 < .55;
      $('aviso').textContent = morto ? 'Sem combustível' : secoDesde !== null ? 'Combustível acabando' : !rodando ? (contato ? 'Motor parado' : 'Ignição desligada') : '';

      // motor e embreagem
      const r = marcha ? rel(marcha) : 0, acoplado = marcha ? giro(vel, marcha) : 0;
      let motor = 0; // torque que chega ao câmbio, N·m
      // logo depois de pegar, a marcha lenta sobe (de 900 para uns 1.100 rpm) e volta em poucos segundos
      const lenta = v.lenta * (1 + .25 * Math.exp(-(agora - pegouEm) / 900));
      // corte de giro: no limite a injeção corta e só volta depois que o giro cai um pouco, então o ponteiro fica batendo no limite
      if (rpm >= v.rpmMax) cortando = true; else if (rpm < v.rpmMax - (marcha ? 150 : 400)) cortando = false;
      const gas = cortando || engasgo ? 0 : acel;
      // motor parado: o giro zera (ou fica nos 230 rpm do motor de partida) e o veículo segue solto, perdendo velocidade
      if (!funciona) rpm += ((giraDesde !== null ? 230 : 0) - rpm) * Math.min(1, dt * (giraDesde !== null ? 14 : 4));
      // em neutro o motor gira livre: sobe pelo torque que sobra e cai pelo atrito; a marcha lenta segura o giro embaixo
      else if (!marcha) rpm = Math.min(v.rpmMax + 150, Math.max(Math.min(engasgo ? lenta * .5 : lenta, rpm + 6000 * dt), rpm + (gas * torque(rpm) - atrito(rpm)) / v.inercia * 30 / Math.PI * dt));
      else if (acoplado >= lenta) { // embreagem solta: o motor gira junto com as rodas
        rpm = acoplado;
        motor = gas * torque(rpm) - (1 - gas) * atrito(rpm);
      } else if (gas > .05) { rpm = lenta * (1 + 1.8 * gas); motor = gas * torque(rpm); } // saída: a embreagem patina
      else rpm += (lenta - rpm) * Math.min(1, dt * 5);                                    // devagar demais sem acelerar: embreagem aberta

      // forças no veículo
      const arrasto = .5 * AR * v.cxA * vel * vel, rolagem = vel > .05 ? .013 * massa * G : 0;
      const freios = freio * massa * 9 + (mao ? massa * 4 : 0);
      const massaEq = massa * 1.04 + v.inercia * r * r / (raio * raio); // as peças que giram também precisam ser aceleradas
      vel = Math.max(0, vel + (motor * r * RENDIMENTO / raio - arrasto - rolagem - freios) / massaEq * dt);

      // consumo: proporcional à potência que o motor entrega mais a que ele gasta para girar (rendimento de 33%, gasolina);
      // engatado e com o acelerador solto a injeção corta. O seletor "Tempo" acelera o consumo junto com o hodômetro
      if (funciona && !(gas < .02 && marcha && rpm > v.lenta * 1.6))
        litros = Math.max(0, litros - (gas * torque(rpm) + .6 * atrito(rpm)) * rpm * Math.PI / 30 / (.33 * 43e6 * .745) * dt * $('mult').value);

      mostra('comb', litros / porUnidade, .1); mostra('rpm', rpm, 10); mostra('vel', vel * 3.6, .1);
      $('marcha').textContent = marcha > 0 ? marcha : marcha ? 'R' : 'N';
    })(ultimo);
  }

  return { ligar };
})();
