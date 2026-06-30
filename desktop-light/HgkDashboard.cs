using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HgkDashboard
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new DashboardWindow());
        }
    }

    internal sealed class DashboardWindow : Form
    {
        private const string AppHost = "app.hgk.local";
        private readonly WebView2 browser;

        public DashboardWindow()
        {
            Text = "HGK Dashboard";
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1440, 900);
            MinimumSize = new Size(980, 640);
            BackColor = Color.FromArgb(7, 17, 28);
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

            browser = new WebView2
            {
                Dock = DockStyle.Fill,
                DefaultBackgroundColor = Color.FromArgb(7, 17, 28)
            };

            Controls.Add(browser);
            Shown += async delegate { await InitializeBrowser(); };
        }

        private async System.Threading.Tasks.Task InitializeBrowser()
        {
            try
            {
                string userData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "HGK Dashboard",
                    "WebView2"
                );
                CoreWebView2Environment environment =
                    await CoreWebView2Environment.CreateAsync(null, userData);
                await browser.EnsureCoreWebView2Async(environment);

                CoreWebView2 core = browser.CoreWebView2;
                core.Settings.AreDevToolsEnabled = false;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.AreHostObjectsAllowed = false;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.IsPasswordAutosaveEnabled = false;
                core.Settings.IsGeneralAutofillEnabled = false;

                core.PermissionRequested += delegate(object sender, CoreWebView2PermissionRequestedEventArgs args)
                {
                    args.State = CoreWebView2PermissionState.Deny;
                };
                core.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs args)
                {
                    args.Handled = true;
                    OpenExternalIfAllowed(args.Uri);
                };
                core.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args)
                {
                    Uri uri;
                    if (Uri.TryCreate(args.Uri, UriKind.Absolute, out uri) &&
                        uri.Scheme == Uri.UriSchemeHttps &&
                        string.Equals(uri.Host, AppHost, StringComparison.OrdinalIgnoreCase))
                    {
                        return;
                    }

                    args.Cancel = true;
                    OpenExternalIfAllowed(args.Uri);
                };
                core.DownloadStarting += delegate(object sender, CoreWebView2DownloadStartingEventArgs args)
                {
                    args.Cancel = true;
                };

                string appFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app");
                core.SetVirtualHostNameToFolderMapping(
                    AppHost,
                    appFolder,
                    CoreWebView2HostResourceAccessKind.DenyCors
                );
                core.Navigate("https://" + AppHost + "/dashboard.html");
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "Nao foi possivel iniciar o HGK Dashboard.\n\n" + error.Message,
                    "HGK Dashboard",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                Close();
            }
        }

        private static void OpenExternalIfAllowed(string address)
        {
            Uri uri;
            if (!Uri.TryCreate(address, UriKind.Absolute, out uri)) return;
            if (uri.Scheme != Uri.UriSchemeMailto &&
                !(uri.Scheme == Uri.UriSchemeHttps &&
                  string.Equals(uri.Host, "wa.me", StringComparison.OrdinalIgnoreCase)))
            {
                return;
            }

            try
            {
                Process.Start(new ProcessStartInfo(address) { UseShellExecute = true });
            }
            catch
            {
            }
        }
    }
}
