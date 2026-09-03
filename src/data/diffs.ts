import { FileDiff } from '../types';

export const MODIFIED_FILES: FileDiff[] = [
  {
    filename: 'playwright_runtime.py',
    path: 'src/app/services/browser/runtime/playwright_runtime.py',
    description: 'Added host Chrome auto-detection across Windows, macOS, and Linux. Supports channel="chrome" and custom binary paths.',
    diff: `+ def find_system_chrome_path() -> Optional[str]:
+     """Search for Google Chrome installed on the current host machine."""
+     for env_var in ("CHROME_PATH", "GOOGLE_CHROME_BIN", "PLAYWRIGHT_CHROME_PATH"):
+         candidate = os.environ.get(env_var)
+         if candidate and os.path.isfile(candidate):
+             return candidate
+     # Checks Windows Program Files, macOS /Applications, Linux /usr/bin/google-chrome
+     ...
+
  class PlaywrightChromiumRuntime(BrowserRuntime):
-     def __init__(self, headless: Optional[bool] = None):
+     def __init__(self, headless=None, use_system_chrome=True, chrome_channel="chrome", chrome_executable_path=None):
+         self.use_system_chrome = use_system_chrome
+         self.chrome_channel = chrome_channel
+         self.chrome_executable_path = chrome_executable_path
...
  async def launch_browser(self) -> Any:
+     if self.use_system_chrome:
+         detected = find_system_chrome_path()
+         if detected:
+             launch_kwargs["executable_path"] = detected
+         else:
+             launch_kwargs["channel"] = self.chrome_channel
+     return await self._playwright.chromium.launch(**launch_kwargs)`
  },
  {
    filename: 'factory.py',
    path: 'src/app/services/browser/runtime/factory.py',
    description: 'Reads use_system_chrome, chrome_channel, and chrome_path from [Browser] config section and passes them to the runtime.',
    diff: `  def create_browser_runtime(*, headless=None) -> BrowserRuntime:
      runtime_name = CONFIG.get("Browser", "runtime", fallback="playwright").strip().lower()
      if runtime_name == "playwright":
+         use_system_chrome = CONFIG.getboolean("Browser", "use_system_chrome", fallback=True)
+         chrome_channel = CONFIG.get("Browser", "chrome_channel", fallback="chrome").strip()
+         chrome_path = CONFIG.get("Browser", "chrome_path", fallback="").strip() or None
+         return PlaywrightChromiumRuntime(
+             headless=headless,
+             use_system_chrome=use_system_chrome,
+             chrome_channel=chrome_channel,
+             chrome_executable_path=chrome_path,
+         )`
  },
  {
    filename: 'config_contract.py',
    path: 'src/app/config_contract.py',
    description: 'Enforces defaults for use_system_chrome (true), chrome_channel (chrome), and chrome_path in runtime configuration.',
    diff: `  def _apply_defaults(config: configparser.ConfigParser) -> None:
      if "Browser" not in config:
          config["Browser"] = {
              "name": "chrome",
              "runtime": "playwright",
+             "use_system_chrome": "true",
+             "chrome_channel": "chrome",
+             "chrome_path": "",
          }
+     if "use_system_chrome" not in config["Browser"]:
+         config["Browser"]["use_system_chrome"] = "true"
+     if "chrome_channel" not in config["Browser"]:
+         config["Browser"]["chrome_channel"] = "chrome"`
  },
  {
    filename: 'config.conf.example',
    path: 'config.conf.example',
    description: 'Documents new options and provides sample paths for Windows, macOS, and Linux.',
    diff: `  [Browser]
  name = chrome
  runtime = playwright
+ use_system_chrome = true
+ chrome_channel = chrome
+ # Optional custom path:
+ # Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
+ # macOS:   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
+ # Linux:   /usr/bin/google-chrome
+ chrome_path =`
  },
  {
    filename: 'verify_login.py & scripts',
    path: 'verify_login.py, scripts/doctor.py, scripts/bootstrap.py',
    description: 'Removed mandatory playwright chromium download steps and added system Chrome verification.',
    diff: `- poetry run playwright install chromium
+ (No download required: automatically uses host Google Chrome)
+ print_status("System Chrome", "PASS", f"Installed Google Chrome found ({chrome_path})")`
  }
];
