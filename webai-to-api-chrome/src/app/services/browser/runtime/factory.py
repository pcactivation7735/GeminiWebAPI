from app.config import CONFIG
from app.services.browser.runtime.base import BrowserRuntime
from app.services.browser.runtime.playwright_runtime import PlaywrightChromiumRuntime


def create_browser_runtime(*, headless=None) -> BrowserRuntime:
    runtime_name = CONFIG.get("Browser", "runtime", fallback="playwright").strip().lower()
    if runtime_name == "playwright":
        use_system_chrome = CONFIG.getboolean("Browser", "use_system_chrome", fallback=True)
        chrome_channel = CONFIG.get("Browser", "chrome_channel", fallback="chrome").strip()
        chrome_path = CONFIG.get("Browser", "chrome_path", fallback="").strip() or None
        return PlaywrightChromiumRuntime(
            headless=headless,
            use_system_chrome=use_system_chrome,
            chrome_channel=chrome_channel,
            chrome_executable_path=chrome_path,
        )
    raise ValueError(
        f"Unsupported browser runtime configured: '{runtime_name}'. Supported values: 'playwright'."
    )
