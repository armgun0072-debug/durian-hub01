using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

public sealed class Launcher : Form
{
    const string Web = "http://localhost:3000";
    const string Studio = "http://localhost:5555";
    const string StudioName = "durian_prisma_studio";
    readonly Color emerald = Color.FromArgb(104, 231, 177);
    readonly FlowLayoutPanel actions = new FlowLayoutPanel();
    readonly TextBox log = new TextBox(), url = new TextBox();
    readonly Label webState = new Label(), studioState = new Label(), tunnelState = new Label();
    readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
    Button copy, browse;
    Process tunnel;
    bool checking, busy, registered;

    [STAThread]
    static void Main()
    {
        bool first;
        using (var mutex = new Mutex(true, @"Local\DurianHubLauncher", out first))
        {
            if (!first) { MessageBox.Show("เปิด Durian Hub Launcher อยู่แล้ว"); return; }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Launcher());
        }
    }

    public Launcher()
    {
        Text = "Durian Hub Launcher";
        ClientSize = new Size(790, 565);
        MinimumSize = new Size(695, 565);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Tahoma", 10);
        BackColor = Color.FromArgb(20, 32, 29);
        ForeColor = Color.WhiteSmoke;
        var layout = new TableLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(18), ColumnCount = 1, RowCount = 5 };
        Controls.Add(layout);
        for (int i = 0; i < 4; i++) layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.Controls.Add(new Label { Text = "Durian Hub  /  แผงควบคุม", ForeColor = emerald, Font = new Font(Font, FontStyle.Bold), AutoSize = true });
        actions.AutoSize = true;
        actions.FlowDirection = FlowDirection.TopDown;
        actions.WrapContents = false;
        layout.Controls.Add(actions);
        var row = Row(webState);
        Add(row, "เริ่มระบบเว็บ", async delegate { await Stack(true); });
        Add(row, "หยุดระบบเว็บ", async delegate { await Stack(false); });
        Add(row, "หน้าเว็บ", delegate { Open(Web); });
        Add(row, "แอดมิน", delegate { Open(Web + "/admin"); });
        actions.Controls.Add(new Label {
            AutoSize = true, MaximumSize = new Size(570, 0), ForeColor = emerald,
            Text = "หลังสลับ Gmail / Mailpit หรือแก้ App Password ใน .env ให้กด “เริ่มระบบเว็บ” อีกครั้งเพื่อใช้ค่าใหม่"
        });
        row = Row(studioState);
        Add(row, "เริ่ม Studio", async delegate { await StudioAction(true); });
        Add(row, "หยุด Studio", async delegate { await StudioAction(false); });
        Add(row, "เปิดฐานข้อมูล", delegate { Open(Studio); });
        row = Row(tunnelState);
        Add(row, "เปิดลิงก์สาธารณะ", async delegate { await StartTunnel(); });
        Add(row, "ปิดลิงก์สาธารณะ", delegate { StopTunnel(); });
        copy = Add(row, "คัดลอกลิงก์", delegate { Clipboard.SetText(url.Text); });
        browse = Add(row, "เปิดลิงก์ออนไลน์", delegate { Open(url.Text); });
        Link("");
        url.ReadOnly = true;
        url.Dock = DockStyle.Fill;
        layout.Controls.Add(url);
        layout.Controls.Add(new Label { Text = "บันทึกการทำงาน", AutoSize = true, Margin = new Padding(3, 10, 3, 3) });
        log.Multiline = log.ReadOnly = true;
        log.ScrollBars = ScrollBars.Vertical;
        log.Dock = DockStyle.Fill;
        log.BackColor = Color.FromArgb(13, 23, 20);
        log.ForeColor = emerald;
        layout.Controls.Add(log);
        timer.Interval = 2500;
        timer.Tick += async delegate { await RefreshStatus(); };
        Shown += async delegate { timer.Start(); await RefreshStatus(); };
        FormClosing += delegate(object sender, FormClosingEventArgs e) {
            if (busy) { e.Cancel = true; Write("กรุณารอให้คำสั่งเสร็จก่อนปิดหน้าต่าง"); return; }
            try { StopTunnel(); timer.Stop(); }
            catch (Exception ex) { e.Cancel = true; Write(ex.Message); }
        };
    }

    FlowLayoutPanel Row(Label state)
    {
        state.AutoSize = true;
        state.Margin = new Padding(3, 10, 3, 0);
        state.Text = "กำลังตรวจสอบ…";
        actions.Controls.Add(state);
        var row = new FlowLayoutPanel { AutoSize = true, WrapContents = false };
        actions.Controls.Add(row);
        return row;
    }

    Button Add(FlowLayoutPanel row, string caption, EventHandler handler)
    {
        var button = new Button { Text = caption, AutoSize = true, FlatStyle = FlatStyle.Flat, Padding = new Padding(4), BackColor = Color.FromArgb(35, 65, 53) };
        button.Click += delegate(object s, EventArgs e) {
            try { handler(s, e); } catch (Exception ex) { Write(ex.Message); }
        };
        row.Controls.Add(button);
        return button;
    }

    void Write(string message)
    {
        if (log.TextLength > 60000) log.Text = log.Text.Substring(30000);
        log.AppendText(DateTime.Now.ToString("HH:mm:ss  ") + message + Environment.NewLine);
    }

    void Post(Action action)
    {
        try { if (IsHandleCreated && !IsDisposed) BeginInvoke(action); }
        catch (InvalidOperationException) { }
    }

    static void Open(string address) { Process.Start(new ProcessStartInfo(address) { UseShellExecute = true }); }

    static ProcessStartInfo Command(string file, string args)
    {
        return new ProcessStartInfo(file, args) {
            WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory, UseShellExecute = false,
            CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
        };
    }

    Task<string> Docker(string args, bool quiet = false)
    {
        return Task.Run(delegate {
            using (var process = new Process { StartInfo = Command("docker.exe", args) })
            {
                var output = new StringBuilder();
                process.OutputDataReceived += delegate(object s, DataReceivedEventArgs e) {
                    if (e.Data == null) return;
                    if (quiet) output.AppendLine(e.Data); else Post(delegate { Write(e.Data); });
                };
                process.ErrorDataReceived += delegate(object s, DataReceivedEventArgs e) {
                    if (e.Data != null) Post(delegate { Write(e.Data); });
                };
                process.Start();
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();
                process.WaitForExit();
                if (process.ExitCode != 0) throw new InvalidOperationException("คำสั่ง Docker ไม่สำเร็จ (" + process.ExitCode + ")");
                return output.ToString().Trim();
            }
        });
    }

    async Task<string> Compose()
    {
        if (!File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "docker-compose.yml")))
            throw new IOException("กรุณาวาง Launcher คู่กับ docker-compose.yml");
        string project = "";
        foreach (string service in new[] { "web", "mysql", "mailpit" })
        {
            string name = await Docker("ps -a --filter name=^/durian_hub_" + service + "$ --format \"{{.Label \\\"com.docker.compose.project\\\"}}\"", true);
            if (name == "") continue;
            if (!Regex.IsMatch(name, @"^[a-z0-9][a-z0-9_-]*$") || (project != "" && project != name))
                throw new InvalidOperationException("ชื่อโปรเจกต์ Compose ของบริการไม่ตรงกัน");
            project = name;
        }
        return "compose " + (project == "" ? "" : "-p " + project + " ");
    }

    async Task<bool> HasStudio()
    {
        string studio = await Docker("ps -a -q --no-trunc --filter name=^/" + StudioName + "$", true);
        if (studio == "") return false;
        string owned = await Docker("ps -a -q --no-trunc --filter label=durianhub.launcher=studio --filter id=" + studio, true);
        if (studio == owned) return true;
        throw new InvalidOperationException("ชื่อ " + StudioName + " ถูกใช้โดยคอนเทนเนอร์อื่น");
    }

    async Task Stack(bool start)
    {
        await Run(async delegate {
            string compose = await Compose();
            if (!start) {
                StopTunnel();
                if (await HasStudio()) await Docker("stop " + StudioName);
            }
            await Docker(compose + (start ? "up -d web" : "--profile mailpit stop web mysql mailpit"));
            if (start) {
                string services = await Docker(compose + "config --services", true);
                if (!Regex.IsMatch(services, @"(?m)^mailpit\r?$"))
                    await Docker(compose + "--profile mailpit stop mailpit");
            }
        });
    }

    async Task StudioAction(bool start)
    {
        await Run(async delegate {
            string compose = await Compose();
            bool exists = await HasStudio();
            if (!start) { if (exists) await Docker("stop " + StudioName); return; }
            await Docker(compose + "up -d mysql");
            if (exists) await Docker("start " + StudioName);
            else await Docker(compose + "run -d --rm --no-deps --label durianhub.launcher=studio --name " + StudioName +
                " -p 127.0.0.1:5555:5555 web ./node_modules/.bin/prisma studio --hostname 0.0.0.0 --port 5555 --browser none");
            for (int attempt = 0; attempt < 30; attempt++) {
                if (await Probe(Studio)) { Open(Studio); return; }
                await Task.Delay(500);
            }
            Write("Studio ยังไม่ตอบสนอง ตรวจบันทึกด้วย docker logs " + StudioName);
        });
    }

    async Task Run(Func<Task> operation)
    {
        if (busy) return;
        busy = true;
        actions.Enabled = false;
        try { Write("กำลังทำงาน…"); await operation(); Write("ดำเนินคำสั่งเสร็จแล้ว"); }
        catch (Exception ex) { Write(ex.Message); }
        finally { busy = false; actions.Enabled = true; }
    }

    static Task<bool> Probe(string address)
    {
        return Task.Run(delegate {
            var request = (HttpWebRequest)WebRequest.Create(address);
            request.Timeout = 1600;
            request.Proxy = null;
            request.AllowAutoRedirect = false;
            try { using (request.GetResponse()) return true; }
            catch (WebException ex) { if (ex.Response != null) ex.Response.Close(); return false; }
        });
    }

    async Task RefreshStatus()
    {
        if (checking) return;
        checking = true;
        try {
            var results = await Task.WhenAll(Probe(Web), Probe(Studio));
            if (IsDisposed) return;
            State(webState, "เว็บ · 3000", results[0]);
            State(studioState, "Prisma Studio · 5555", results[1]);
            TunnelState();
        } finally { checking = false; }
    }

    void State(Label label, string name, bool ready)
    {
        label.Text = "●  " + name + (ready ? "   พร้อมใช้งาน" : "   ยังไม่พร้อม");
        label.ForeColor = ready ? emerald : Color.Silver;
    }

    public static string TunnelUrl(string line)
    {
        return Regex.Match(line, @"https://[a-z0-9-]+\.trycloudflare\.com(?=\s|\||$)", RegexOptions.IgnoreCase).Value;
    }

    void Link(string value)
    {
        url.Text = value;
        copy.Enabled = browse.Enabled = value.Length > 0;
    }

    void TunnelState()
    {
        State(tunnelState, "Cloudflare Tunnel", registered && url.TextLength > 0);
        if (tunnel != null && !(registered && url.TextLength > 0)) tunnelState.Text = "●  Cloudflare Tunnel   กำลังเชื่อมต่อ";
    }

    async Task StartTunnel()
    {
        await Run(async delegate {
            if (tunnel != null) return;
            if (!await Probe(Web)) throw new InvalidOperationException("กรุณาเริ่มเว็บและรอให้พร้อมก่อนเปิดลิงก์");
            string file = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"cloudflared\cloudflared.exe");
            var process = new Process { StartInfo = Command(File.Exists(file) ? file : "cloudflared.exe", "tunnel --url " + Web), EnableRaisingEvents = true };
            DataReceivedEventHandler received = delegate(object s, DataReceivedEventArgs e) {
                if (e.Data == null) return;
                Post(delegate {
                    if (tunnel != process) return;
                    Write(e.Data);
                    string found = TunnelUrl(e.Data);
                    if (found != "") Link(found);
                    if (e.Data.Contains("Registered tunnel connection")) registered = true;
                    if (e.Data.Contains("Retrying connection")) registered = false;
                    TunnelState();
                });
            };
            process.OutputDataReceived += received;
            process.ErrorDataReceived += received;
            process.Exited += delegate { Post(delegate {
                if (tunnel != process) return;
                Write("Cloudflare Tunnel สิ้นสุดการทำงาน (" + process.ExitCode + ")");
                ClearTunnel(process);
            }); };
            try {
                process.Start();
                tunnel = process;
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();
                TunnelState();
            } catch {
                if (tunnel == process) StopTunnel(); else process.Dispose();
                throw;
            }
        });
    }

    void ClearTunnel(Process process)
    {
        tunnel = null;
        registered = false;
        Link("");
        TunnelState();
        process.Dispose();
    }

    void StopTunnel()
    {
        if (tunnel == null) return;
        try { if (!tunnel.HasExited) tunnel.Kill(); }
        catch (InvalidOperationException) { if (!tunnel.HasExited) throw; }
        ClearTunnel(tunnel);
    }
}
