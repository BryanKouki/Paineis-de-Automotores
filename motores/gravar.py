# Grava o som de um motor no Engine Simulator (v0.1.14a): liga, deixa em marcha lenta e faz uma subida de giro no dinamômetro
# com o acelerador no fundo (o dinamômetro do programa sobe 500 rpm por segundo até o limite). Sai um .wav com tudo.
# Uso: python gravar.py <pasta do engine-sim> <motor.mr> <saida.wav> <giro máximo do motor>
# Junto do .wav sai um .json com o instante de cada etapa, que o montar.py usa.
# Precisa de: pip install soundcard numpy. Enquanto grava, não mexa no teclado e não deixe outro som tocando no computador.
import ctypes, json, os, shutil, subprocess, sys, threading, time, wave
import numpy as np
import soundcard as sc

pasta, motor, saida = sys.argv[1:4]
giro_max = float(sys.argv[4])
user32 = ctypes.windll.user32
TAXA = 44100

def janela():
    achadas = []
    def cada(h, _):
        t = ctypes.create_unicode_buffer(200); user32.GetWindowTextW(h, t, 200)
        if 'engine sim' in t.value.lower() and user32.IsWindowVisible(h): achadas.append(h)
        return True
    user32.EnumWindows(ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)(cada), 0)
    return achadas[0] if achadas else None

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [('wVk', ctypes.c_ushort), ('wScan', ctypes.c_ushort), ('dwFlags', ctypes.c_ulong), ('time', ctypes.c_ulong), ('dwExtraInfo', ctypes.c_void_p)]
class INPUT(ctypes.Structure):
    class _U(ctypes.Union): _fields_ = [('ki', KEYBDINPUT), ('pad', ctypes.c_byte * 32)]
    _anonymous_ = ('u',); _fields_ = [('type', ctypes.c_ulong), ('u', _U)]

def tecla(letra, solta):
    # só manda a tecla se o Engine Simulator estiver na frente: nunca digita em outro programa
    if user32.GetForegroundWindow() != H: raise SystemExit('O Engine Simulator saiu da frente; gravação interrompida.')
    scan = user32.MapVirtualKeyW(ord(letra.upper()), 0)
    e = INPUT(type=1); e.ki = KEYBDINPUT(0, scan, 0x0008 | (0x0002 if solta else 0), 0, None)
    user32.SendInput(1, ctypes.byref(e), ctypes.sizeof(e))

def toque(letra, segura=.15): tecla(letra, False); time.sleep(segura); tecla(letra, True); time.sleep(.2)

# o programa abre o motor da última sessão, guardado em bin/session_info.tmp
os.makedirs(os.path.join(pasta, 'assets', 'engines', 'paineis'), exist_ok=True)
shutil.copy(motor, os.path.join(pasta, 'assets', 'engines', 'paineis', os.path.basename(motor)))
open(os.path.join(pasta, 'bin', 'session_info.tmp'), 'w').write(os.path.join('..', 'assets', 'engines', 'paineis', os.path.basename(motor)))
app = subprocess.Popen([os.path.join(pasta, 'bin', 'engine-sim-app.exe')], cwd=os.path.join(pasta, 'bin'))
H = None
for _ in range(60):
    time.sleep(.5); H = janela()
    if H: break
if not H: raise SystemExit('A janela do Engine Simulator não abriu.')
time.sleep(4)
# o Windows só deixa um programa em segundo plano trazer uma janela para a frente logo depois de uma tecla: um toque no Alt resolve
for _ in range(5):
    user32.ShowWindow(H, 9); user32.keybd_event(0x12, 0, 0, 0); user32.SetForegroundWindow(H); user32.keybd_event(0x12, 0, 2, 0); time.sleep(1)
    if user32.GetForegroundWindow() == H: break
else:
    app.terminate(); raise SystemExit('Não consegui trazer o Engine Simulator para a frente.')

blocos, gravando = [], True
def grava():
    mic = sc.get_microphone(id=str(sc.default_speaker().name), include_loopback=True)
    # buffer de 1/4 s: com o buffer padrão, o Engine Simulator ocupando o processador fazia a captura perder pedaços
    # ("data discontinuity"), e o laço montado saía com buracos
    with mic.recorder(samplerate=TAXA, channels=1, blocksize=TAXA // 4) as r:
        while gravando: blocos.append(r.record(numframes=TAXA // 4))
t = threading.Thread(target=grava); t.start()
marcas = {}
t0 = time.time()
def marca(nome): marcas[nome] = round(time.time() - t0, 2)
try:
    time.sleep(1)
    toque('a')                                   # ignição
    marca('partida'); tecla('s', False); time.sleep(2.5); tecla('s', True)  # motor de partida
    time.sleep(5); marca('lenta'); time.sleep(6)  # marcha lenta
    marca('subida'); tecla('r', False); time.sleep(.3); toque('d')         # acelerador no fundo + dinamômetro: sobe 500 rpm/s
    # o dinamômetro começa do zero e um monocilíndrico morre ali: o motor de partida segura o giro nos primeiros segundos
    if len(sys.argv) > 5: tecla('s', False); time.sleep(4); tecla('s', True)
    time.sleep(giro_max / 330 + 3)                # até o limite de giro (na prática a subida anda a uns 370 rpm/s)
    tecla('r', True); marca('solta'); time.sleep(5)                         # solta o acelerador: o giro cai
    marca('fim')
finally:
    gravando = False; t.join()
    try: tecla('r', True)
    except SystemExit: pass
    app.terminate()
som = np.concatenate(blocos)[:, 0]
pico = float(np.abs(som).max()) or 1
with wave.open(saida, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(TAXA); w.writeframes((som / pico * 32000).astype('<i2').tobytes())
json.dump(marcas, open(saida[:-4] + '.json', 'w'))
print('gravado', saida, round(len(som) / TAXA, 1), 's', 'pico', round(pico, 3), marcas)
