# Transforma a gravação do gravar.py no som.js de um painel: um laço da marcha lenta e um laço a cada faixa de giro da subida.
# Os painéis tocam os dois laços vizinhos do giro atual, misturados, acertando o tom pela velocidade de reprodução.
# Uso: python montar.py <gravacao.wav> <saida som.js> <marcha lenta esperada> <giro máximo> <passo entre laços>
import base64, json, sys, wave
import numpy as np

arq, saida = sys.argv[1:3]
lenta_esp, giro_max, passo = map(float, sys.argv[3:6])
w = wave.open(arq); FS = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
marcas = json.load(open(arq[:-4] + '.json'))

def ciclo(t, jan=.5):
    """frequência (Hz) do pico de autocorrelação mais forte no trecho que começa em t, e a força dele"""
    seg = x[int(t * FS):int((t + jan) * FS)]; seg = seg - seg.mean(); n = len(seg)
    F = np.fft.rfft(seg, 2 * n); ac = np.fft.irfft(F * np.conj(F))[:n]; ac /= ac[0] + 1e-12
    a, b = int(FS * 120 / 12000), int(FS * 120 / 300); i = a + np.argmax(ac[a:b])
    return FS / i, ac[i]

# ---- giro ao longo da subida ----
# O período que mais se repete pode ser o ciclo inteiro do motor (2 voltas), uma volta ou o intervalo entre explosões, então cada
# medida vale como vários giros possíveis. A subida do dinamômetro é uma reta: fica a reta que mais medidas confirmam.
ts = np.arange(marcas['subida'] + 1.5, marcas['solta'] - .5, .2)
med = [ciclo(t) for t in ts]; freqs = np.array([m[0] for m in med]); forca = np.array([m[1] for m in med]); tc = ts + .25
cands = freqs[:, None] * 120 / np.array([1, 2, 4, 8])[None, :]
# Qual dos giros possíveis é o verdadeiro sai do fim da subida, quando o motor chega ao corte de giro (giro_max):
# - se ali o som perde a repetição (motor de vários cilindros batendo no corte), a reta tem de chegar a giro_max nesse instante;
# - se continua repetindo (monocilíndrico), o próprio patamar medido diz o giro.
jan = np.array([np.median(forca[i:i + 8]) for i in range(len(forca))])
firme = int(np.argmax(jan > .6))                                  # onde a subida começa a repetir bem
# no corte o som ou perde a repetição ou passa a repetir no ritmo fixo do próprio corte: nos dois casos a subida acabou
parada = np.array([freqs[i:i + 8].max() < 1.03 * freqs[i:i + 8].min() for i in range(len(freqs))])
fraca = ((jan < .45) | parada) & (np.arange(len(jan)) > firme + 15)
t_corte = tc[np.argmax(fraca)] if fraca.any() else None
f_fim = np.median(freqs[tc > marcas['solta'] - 3])
patamar = giro_max if t_corte else min((f_fim * 120 / m for m in (1, 2, 4, 8)), key=lambda r: abs(r - giro_max * .92))
usa = tc < t_corte if t_corte else np.ones(len(tc), bool)
melhor = (0, 0, 0)
for k in np.arange(250, 601, 5):
    for r0 in np.arange(25, 3001, 25):
        if t_corte and not .9 * giro_max < r0 + k * (t_corte - tc[0]) < 1.05 * giro_max: continue
        reta = np.minimum(r0 + k * (tc - tc[0]), patamar)
        acertos = int(((np.abs(cands - reta[:, None]) / reta[:, None]).min(axis=1) < .03)[usa].sum())
        if acertos > melhor[0]: melhor = (acertos, k, r0)
acertos, K, R0 = melhor
print('subida: %d rpm + %d rpm/s até %d rpm, confirmada por %d de %d medidas' % (R0, K, patamar, acertos, usa.sum()))
assert acertos >= .55 * usa.sum(), 'não achei a subida de giro na gravação'
quando = lambda rpm: tc[0] + (rpm - R0) / K  # instante em que a subida passa por esse giro

def laco(som, n_ciclos, amostras_ciclo):
    """corta perto de um número inteiro de ciclos, no ponto em que o som volta a ficar igual ao começo, e funde a ponta no
    começo, para o laço não estalar nem pular"""
    f = int(.03 * FS); jan = int(max(2 * amostras_ciclo, .04 * FS)); n0 = int(round(n_ciclos * amostras_ciclo))
    # o giro medido tem um erro pequeno, que ao fim de dezenas de ciclos vira um pedaço de ciclo: procura a emenda certa em volta
    inicio = som[:jan] - som[:jan].mean()
    def casa(n): t = som[n:n + jan] - som[n:n + jan].mean(); return float((inicio * t).sum() / (np.sqrt((inicio ** 2).sum() * (t ** 2).sum()) + 1e-12))
    n = max(range(int(n0 - 1.5 * amostras_ciclo), int(n0 + 1.5 * amostras_ciclo)), key=casa)
    emendas.append(casa(n))                                            # 1 = o fim continua igual ao começo: emenda inaudível
    corpo = som[:n].copy(); rampa = np.linspace(0, 1, f)
    corpo[:f] = corpo[:f] * rampa + som[n:n + f] * (1 - rampa)
    return corpo

lacos, emendas = [], []
# marcha lenta: o giro já é constante; mede o ciclo e corta cerca de 1 segundo
t0 = marcas['lenta'] + 1
assert np.sqrt((x[int(t0 * FS):int((t0 + 2) * FS)] ** 2).mean()) > .02, 'o motor não ficou na marcha lenta (trecho mudo): morreu ou não pegou'
f, _ = ciclo(t0, 2)
rpm_lenta = min((f * 120 / m for m in (1, 2, 4, 8)), key=lambda r: abs(r - lenta_esp))
cic = FS * 120 / rpm_lenta
# a lenta oscila um pouco: tenta vários começos dentro dela e fica com o de melhor emenda
tentativas = []
for ini in np.arange(t0, t0 + 3.01, .25):
    som = laco(x[int(ini * FS):], round(1.0 * FS / cic), cic); tentativas.append((emendas.pop(), som))
melhor_lenta = max(tentativas, key=lambda t: t[0])
emendas.append(melhor_lenta[0]); lacos.append((rpm_lenta, melhor_lenta[1]))
# subida: em volta de cada giro alvo, o trecho é reamostrado para o giro ficar constante (desfaz a subida dentro do laço)
alvo = np.ceil(max(rpm_lenta * 1.4, R0) / passo) * passo             # abaixo de R0 a subida ainda não tinha começado
# o último laço para meio segundo antes de o motor chegar ao corte: dentro do corte o som falha e o laço sairia quebrado
teto = (R0 + K * (t_corte - tc[0]) if t_corte else patamar) - K * .5
while alvo + K * .4 <= teto:
    c = quando(alvo); cic = FS * 120 / alvo; n_c = round(.7 * FS / cic); dur = ((n_c + 4) * cic + .1 * FS) / FS
    u = np.arange(int(dur * FS)) / FS                                # tempo no laço, com o giro constante
    k = K / 60.0; r = alvo / 60.0                                    # em voltas por segundo
    tau = (-r + np.sqrt(r * r + 2 * k * r * u)) / k                  # tempo na gravação com as mesmas voltas dadas
    pos = (c + tau) * FS
    lacos.append((alvo, laco(np.interp(pos, np.arange(len(x)), x), n_c, cic)))
    alvo += passo

# 22.050 Hz, 16 bits, mesmo volume de pico para o conjunto
pico = max(np.abs(l).max() for _, l in lacos)
def codifica(l):
    l = l[:len(l) // 2 * 2].reshape(-1, 2).mean(axis=1)              # metade da taxa (média de pares corta o que dobraria)
    return base64.b64encode((l / pico * 30000).astype('<i2').tobytes()).decode()
linhas = ',\n'.join('  [%d, "%s"]' % (round(r), codifica(l)) for r, l in lacos)
open(saida, 'w', encoding='utf-8', newline='\n').write(
    '// Som do motor: laços gravados no Engine Simulator (motores/*.mr), um por faixa de giro, em 16 bits a 22.050 Hz.\n'
    '// Gerado por motores/montar.py; cada item é [giro do laço, áudio em base64]. O controle.js toca os dois vizinhos do giro atual.\n'
    'const SOM_MOTOR = { taxa: %d, lacos: [\n%s\n] };\n' % (FS // 2, linhas))
print('laços (giro:emenda):', ' '.join('%d:%.2f' % (round(r), e) for (r, _), e in zip(lacos, emendas)), '| arquivo:', saida)
