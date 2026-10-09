// Controle de videogame e teclado: simulam o veículo andando (motor, embreagem, marchas, arrasto e freios) e movem o painel
// pelos mesmos sliders de RPM e velocidade. A marcha engatada fica no canto da janela, com um botão discreto que mostra as teclas.
//
// O controle segue o mapeamento do Gran Turismo 7: R2 acelera, L2 freia, ✕ sobe marcha, □ desce, ○ freio de mão, △ ré, L3 faróis.
// Diferenças: as setas ficam no direcional (esquerda/direita) em vez do touchpad; direcional para cima liga o farol alto;
// Options gira a ignição nos painéis que têm miolo.
const Controle = (() => {
  const R2 = 7, L2 = 6, BOLA = 1; // índices do layout padrão da Gamepad API
  // funções de um toque: [botão do controle, tecla]. As teclas valem pela posição no teclado (e.code)
  const TOQUES = { sobe: [0, 'KeyE'], desce: [2, 'KeyQ'], re: [3, 'KeyR'], ignicao: [9, 'KeyI'], farol: [10, 'KeyL'], alto: [12, 'KeyF'], setaE: [14, 'KeyA'], setaD: [15, 'KeyD'] };
  const SEGURAR = { acel: 'KeyW', freio: 'KeyS', mao: 'Space' };
  // o que o botão do teclado mostra: função, tecla, botão do controle
  const AJUDA = [['Acelerar', 'W', 'R2'], ['Frear', 'S', 'L2'], ['Subir marcha', 'E', '✕'], ['Descer marcha', 'Q', '□'], ['Freio de mão', 'Espaço', '○'], ['Ré (parado)', 'R', '△'],
    ['Setas', 'A / D', 'Direcional ← →'], ['Farol alto', 'F', 'Direcional ↑'], ['Faróis (iluminação)', 'L', 'L3'], ['Ignição (moto)', 'I', 'Options']];
  const G = 9.81, AR = 1.2, CONDUTOR = 75, RENDIMENTO = .9;
  const VISOR = `<style>#teclas{background:none;border:0;padding:4px;color:inherit;opacity:.3;line-height:0;cursor:pointer}
#teclas:hover,#teclas:focus-visible,#teclas[aria-expanded=true]{opacity:1}
#teclasLista{position:fixed;top:66px;right:10px;z-index:3;background:#15181bf5;border:1px solid #3a4350;border-radius:8px;padding:8px 12px;font:12px system-ui,sans-serif;color:#dde}
#teclasLista table{border-collapse:collapse}#teclasLista th,#teclasLista td{text-align:left;padding:2px 14px 2px 0}#teclasLista th{color:#8b949e;font-weight:400}</style>
<div style="position:fixed;top:24px;right:10px;z-index:3;display:flex;align-items:center;gap:6px;color:#e6e9ee;font:700 30px system-ui,sans-serif">
  <button id="teclas" aria-label="Teclas e botões para dirigir" aria-expanded="false" title="Teclas e botões para dirigir"><svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><rect x=".75" y=".75" width="20.5" height="14.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 5h2M8 5h2M12 5h2M16 5h2M4 8h2M8 8h2M12 8h2M16 8h2M6 11.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
  <span id="marcha" title="Marcha">N</span>
</div>
<div id="teclasLista" hidden><table><tr><th>Função</th><th>Teclado</th><th>Controle</th></tr>${AJUDA.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;

  /**
   * v = dados do veículo: cv e rpmCv (potência máxima), kgfm e rpmKgfm (torque máximo), rpmMax, lenta,
   * marchas (relações), re (0 = não tem), final (diferencial; na moto, primária x coroa/pinhão),
   * pneu [largura mm, perfil %, aro pol], kg, cxA (Cx x área frontal, m²) e inercia (do motor, kg·m²)
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

    // simulando = o teclado ou o controle estão dirigindo; mexer num slider com o mouse devolve o comando aos sliders
    let simulando = false, marcha = 0, vel = 0, rpm = v.lenta, acelT = 0, freioT = 0, antes = [], ultimo = performance.now(); // marcha: -1 ré, 0 neutro, 1…
    let maoAntes = false, chaveAntes = ''; // último estado do freio de mão e de ignição+marcha que a simulação passou para as luzes
    let cortando = false;                  // corte de giro em ação
    // dirigindo, os ponteiros respondem mais rápido (dá para ver o corte de giro e a queda do giro na troca de marcha)
    const ponteiros = () => { for (const id of ['nRpm', 'nVel']) if ($(id)) $(id).style.transitionDuration = simulando ? '80ms' : ''; };
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
      if (!simulando && (toques.size || seguras.size || mao || b[R2] > .1 || b[L2] > .1)) { simulando = true; vel = (+$('vel').value || 0) / 3.6; ponteiros(); } // assume de onde o slider está
      if (!simulando) return;

      // marchas em sequência (ré, neutro, 1ª…). Como no jogo, não reduz se o giro passaria do limite nem engata a ré andando
      if (toques.has('sobe') && marcha < v.marchas.length) marcha++;
      if (toques.has('desce')) {
        const m = marcha - 1;
        if (m > 0 ? giro(vel, m) < v.rpmMax + 300 : m === 0 || (v.re && vel < 1)) marcha = m;
      }
      if (toques.has('re') && v.re && vel < 1) marcha = -1;

      // luzes e ignição
      if ((toques.has('setaE') || toques.has('setaD')) && luz('seta')) luz('seta').click();
      if (toques.has('alto') && luz('alto')) luz('alto').click();
      if (toques.has('farol')) $('luz').click();
      if (toques.has('ignicao') && $('chaveBtn')) $('chaveBtn').click();
      toques.clear();
      const ligado = !$('chaveBtn') || $('chaveBtn').getAttribute('aria-pressed') === 'true';
      // as luzes do freio de mão e do neutro acompanham a simulação só no instante em que ela muda (puxou o freio, trocou de marcha,
      // girou a chave); entre uma mudança e outra os botões dessas luzes continuam funcionando normalmente
      if (mao !== maoAntes) { maoAntes = mao; if (luz('freio')) luz('freio').set(mao); }
      const neutro = ligado && !marcha, chave = ligado + '|' + marcha;
      if (chave !== chaveAntes) { chaveAntes = chave; if (luz('neutro') && ligado) luz('neutro').set(neutro); }

      // motor e embreagem
      const r = marcha ? rel(marcha) : 0, acoplado = marcha ? giro(vel, marcha) : 0;
      let motor = 0; // torque que chega ao câmbio, N·m
      // corte de giro: no limite a injeção corta e só volta depois que o giro cai um pouco, então o ponteiro fica batendo no limite
      if (rpm >= v.rpmMax) cortando = true; else if (rpm < v.rpmMax - (marcha ? 150 : 400)) cortando = false;
      const gas = cortando ? 0 : acel;
      if (!ligado) rpm += (0 - rpm) * Math.min(1, dt * 4);
      // em neutro o motor gira livre: sobe pelo torque que sobra e cai pelo atrito; a marcha lenta segura o giro embaixo
      else if (!marcha) rpm = Math.min(v.rpmMax + 150, Math.max(v.lenta, rpm + (gas * torque(rpm) - atrito(rpm)) / v.inercia * 30 / Math.PI * dt));
      else if (acoplado >= v.lenta) { // embreagem solta: o motor gira junto com as rodas
        rpm = acoplado;
        motor = gas * torque(rpm) - (1 - gas) * atrito(rpm);
      } else if (acel > .05) { rpm = v.lenta * (1 + 1.8 * acel); motor = acel * torque(rpm); } // saída: a embreagem patina
      else rpm += (v.lenta - rpm) * Math.min(1, dt * 5);                                        // devagar demais sem acelerar: embreagem aberta

      // forças no veículo
      const arrasto = .5 * AR * v.cxA * vel * vel, rolagem = vel > .05 ? .013 * massa * G : 0;
      const freios = freio * massa * 9 + (mao ? massa * 4 : 0);
      const massaEq = massa * 1.04 + v.inercia * r * r / (raio * raio); // as peças que giram também precisam ser aceleradas
      vel = Math.max(0, vel + (motor * r * RENDIMENTO / raio - arrasto - rolagem - freios) / massaEq * dt);

      mostra('rpm', rpm, 10); mostra('vel', vel * 3.6, .1);
      $('marcha').textContent = marcha > 0 ? marcha : marcha ? 'R' : 'N';
    })(ultimo);
  }

  return { ligar };
})();
