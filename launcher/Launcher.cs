// Launcher dos Painéis de Automotores: abre o seletor (index.html) numa janela própria e serve de ponte entre a
// multimídia dos painéis e o que está tocando no Windows (a mesma informação do controle de mídia do sistema).
// Para compilar no Windows 10/11, sem instalar nada: launcher\compilar.cmd
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Windows.Foundation;
using Windows.Media.Control;
using Windows.Storage.Streams;

static class Launcher
{
    const string Nome = "Painéis de Automotores";
    static readonly CultureInfo Ponto = CultureInfo.InvariantCulture; // números do JSON com ponto, não vírgula
    static GlobalSystemMediaTransportControlsSessionManager gerente;

    [MTAThread]
    static void Main()
    {
        string index = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html");
        if (!File.Exists(index))
        {
            MessageBox.Show("Não encontrei o index.html. O executável precisa ficar na mesma pasta dos painéis.", Nome, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        // ponte da multimídia: um servidor que só este computador enxerga; a página recebe a porta pelo endereço (?ponte=)
        HttpListener ponte = null;
        int porta = 0;
        for (int p = 47613; p < 47623 && ponte == null; p++)
        {
            var l = new HttpListener();
            l.Prefixes.Add("http://localhost:" + p + "/");
            try { l.Start(); ponte = l; porta = p; } catch (HttpListenerException) { } // porta ocupada: tenta a próxima
        }
        Abrir(new Uri(index).AbsoluteUri + (ponte == null ? "" : "?ponte=" + porta));
        if (ponte == null) return; // sem ponte os painéis abrem do mesmo jeito, só sem a música do Windows

        // atende até a página avisar que fechou (/sair) ou ficar 3 minutos sem pedir nada
        while (true)
        {
            IAsyncResult pedido = ponte.BeginGetContext(null, null);
            if (!pedido.AsyncWaitHandle.WaitOne(180000)) break;
            HttpListenerContext c = ponte.EndGetContext(pedido);
            bool sair = c.Request.Url.AbsolutePath == "/sair";
            try { if (!sair) Atender(c); } catch (Exception) { try { c.Response.StatusCode = 500; } catch (Exception) { } }
            try { c.Response.Close(); } catch (Exception) { }
            if (sair) break;
        }
        ponte.Stop();
    }

    // janela própria (sem abas nem barra de endereço) no Edge ou no Chrome; sem eles, abre no navegador padrão
    static void Abrir(string url)
    {
        var bases = new[] { Environment.GetEnvironmentVariable("ProgramFiles(x86)"), Environment.GetEnvironmentVariable("ProgramFiles"), Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) };
        foreach (string programa in new[] { @"Microsoft\Edge\Application\msedge.exe", @"Google\Chrome\Application\chrome.exe" })
            foreach (string b in bases)
            {
                if (string.IsNullOrEmpty(b)) continue;
                string exe = Path.Combine(b, programa);
                if (!File.Exists(exe)) continue;
                Process.Start(exe, "--app=\"" + url + "\" --window-size=1366,820");
                return;
            }
        Process.Start(url);
    }

    static void Atender(HttpListenerContext c)
    {
        HttpListenerResponse r = c.Response;
        r.AddHeader("Access-Control-Allow-Origin", "*"); // a página vem de file://
        r.AddHeader("Cache-Control", "no-store");
        string rota = c.Request.Url.AbsolutePath;
        r.StatusCode = 204; // comandos não devolvem conteúdo
        if (rota == "/vivo") return;

        if (gerente == null) gerente = Esperar(GlobalSystemMediaTransportControlsSessionManager.RequestAsync());
        GlobalSystemMediaTransportControlsSession s = gerente.GetCurrentSession(); // o programa que o Windows considera o tocador atual
        if (s == null)
        {
            if (rota == "/agora") Texto(r, "{\"titulo\":\"\",\"artista\":\"\",\"tocando\":false,\"pos\":0,\"dur\":0,\"capa\":\"\"}");
            return;
        }
        switch (rota)
        {
            case "/agora": Texto(r, Agora(s)); break;
            case "/capa": Capa(s, r); break;
            case "/tocar": Esperar(s.TryTogglePlayPauseAsync()); break;
            case "/proxima": Esperar(s.TrySkipNextAsync()); break;
            case "/anterior": Esperar(s.TrySkipPreviousAsync()); break;
            case "/posicao":
                double t;
                if (double.TryParse(c.Request.QueryString["t"], NumberStyles.Float, Ponto, out t)) Esperar(s.TryChangePlaybackPositionAsync(TimeSpan.FromSeconds(t).Ticks));
                break;
            default: r.StatusCode = 404; break;
        }
    }

    static string Agora(GlobalSystemMediaTransportControlsSession s)
    {
        var m = Esperar(s.TryGetMediaPropertiesAsync());
        var t = s.GetTimelineProperties();
        bool tocando = s.GetPlaybackInfo().PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
        double dur = (t.EndTime - t.StartTime).TotalSeconds, pos = (t.Position - t.StartTime).TotalSeconds;
        // a posição vale para o instante em que o programa a informou; se está tocando, soma o tempo que passou desde então
        double desde = (DateTimeOffset.Now - t.LastUpdatedTime).TotalSeconds;
        if (tocando && desde > 0 && desde < 86400) pos += desde;
        pos = dur > 0 ? Math.Max(0, Math.Min(pos, dur)) : 0; // nem todo programa informa a duração
        string capa = m.Thumbnail == null ? "" : (m.Title + "|" + m.Artist).GetHashCode().ToString("x"); // muda quando muda a música
        return "{\"titulo\":" + Json(m.Title) + ",\"artista\":" + Json(m.Artist) + ",\"tocando\":" + (tocando ? "true" : "false") +
            ",\"pos\":" + pos.ToString("0.0", Ponto) + ",\"dur\":" + dur.ToString("0.0", Ponto) + ",\"capa\":\"" + capa + "\"}";
    }

    static void Capa(GlobalSystemMediaTransportControlsSession s, HttpListenerResponse r)
    {
        IRandomAccessStreamReference miniatura = Esperar(s.TryGetMediaPropertiesAsync()).Thumbnail;
        if (miniatura == null) { r.StatusCode = 404; return; }
        using (IRandomAccessStreamWithContentType fluxo = Esperar(miniatura.OpenReadAsync()))
        using (var leitor = new DataReader(fluxo))
        {
            var bytes = new byte[fluxo.Size];
            Esperar(leitor.LoadAsync((uint)fluxo.Size));
            leitor.ReadBytes(bytes);
            r.StatusCode = 200;
            r.ContentType = fluxo.ContentType;
            r.OutputStream.Write(bytes, 0, bytes.Length);
        }
    }

    // as chamadas do Windows são assíncronas; aqui basta esperar o resultado
    static T Esperar<T>(IAsyncOperation<T> op)
    {
        while (op.Status == AsyncStatus.Started) Thread.Sleep(5);
        return op.GetResults();
    }

    static void Texto(HttpListenerResponse r, string json)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        r.StatusCode = 200;
        r.ContentType = "application/json; charset=utf-8";
        r.OutputStream.Write(bytes, 0, bytes.Length);
    }

    static string Json(string s)
    {
        var sb = new StringBuilder("\"");
        foreach (char ch in s ?? "")
        {
            if (ch == '"' || ch == '\\') sb.Append('\\').Append(ch);
            else if (ch < ' ') sb.Append("\\u").Append(((int)ch).ToString("x4"));
            else sb.Append(ch);
        }
        return sb.Append('"').ToString();
    }
}
