import os
import shutil
import sys
from typing import Any, Callable, List, Optional

try:
    from playwright.async_api import async_playwright, Playwright, Error as PlaywrightError
except ImportError:
    async_playwright = None
    Playwright = Any
    PlaywrightError = Exception

from app.logger import logger
from app.services.browser.runtime.base import BrowserRuntime


def find_system_chrome_path() -> Optional[str]:
    """
    Search for Google Chrome installed on the current host machine (Windows, macOS, Linux).
    Returns absolute path to the Chrome executable if found, otherwise None.
    """
    # 1. Environment variable override
    for env_var in ("CHROME_PATH", "GOOGLE_CHROME_BIN", "PLAYWRIGHT_CHROME_PATH", "CHROME_BIN"):
        candidate = os.environ.get(env_var)
        if candidate and os.path.isfile(candidate):
            return candidate

    system = sys.platform
    candidates: List[str] = []

    # 2. Platform-specific standard installation locations
    if system == "win32":
        # Windows standard locations
        program_files = os.environ.get("PROGRAMFILES", "C:\\Program Files")
        program_files_x86 = os.environ.get("PROGRAMFILES(X86)", "C:\\Program Files (x86)")
        local_app_data = os.environ.get("LOCALAPPDATA", "")

        candidates = [
            os.path.join(program_files, "Google", "Chrome", "Application", "chrome.exe"),
            os.path.join(program_files_x86, "Google", "Chrome", "Application", "chrome.exe"),
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
        if local_app_data:
            candidates.append(os.path.join(local_app_data, "Google", "Chrome", "Application", "chrome.exe"))
    elif system == "darwin":
        # macOS standard locations
        home = os.path.expanduser("~")
        candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            os.path.join(home, "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
            "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
    else:
        # Linux standard locations
        candidates = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/google-chrome",
            "/snap/bin/chromium",
            "/usr/local/bin/google-chrome",
        ]
        for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"):
            found = shutil.which(name)
            if found and found not in candidates:
                candidates.insert(0, found)

    for path in candidates:
        if path and os.path.isfile(path):
            return path

    return None


class PlaywrightChromiumRuntime(BrowserRuntime):
    """
    Playwright launcher utilizing Google Chrome installed on the host machine.
    Bypasses the need for Playwright Chromium downloads and leverages real user Chrome.
    """

    def __init__(
        self,
        headless: Optional[bool] = None,
        use_system_chrome: bool = True,
        chrome_channel: str = "chrome",
        chrome_executable_path: Optional[str] = None,
    ):
        self.headless = headless
        self.use_system_chrome = use_system_chrome
        self.chrome_channel = chrome_channel or "chrome"
        self.chrome_executable_path = chrome_executable_path
        self._playwright: Optional[Playwright] = None

    async def start(self) -> None:
        self._playwright = await async_playwright().start()

    async def launch_browser(self) -> Any:
        # Arguments optimized for anti-detection and stability on local machine
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
        ]

        launch_kwargs: dict[str, Any] = {
            "headless": self.headless,
            "args": launch_args,
        }

        if self.use_system_chrome:
            # 1. Custom specified path in config
            if self.chrome_executable_path and os.path.isfile(self.chrome_executable_path):
                logger.info(
                    "PlaywrightRuntime: Using configured Chrome executable: %s",
                    self.chrome_executable_path,
                )
                launch_kwargs["executable_path"] = self.chrome_executable_path
            else:
                # 2. Auto-detect installed Google Chrome on machine
                detected_path = find_system_chrome_path()
                if detected_path:
                    logger.info(
                        "PlaywrightRuntime: Found and using installed System Chrome: %s",
                        detected_path,
                    )
                    launch_kwargs["executable_path"] = detected_path
                else:
                    # 3. Use Playwright channel='chrome' which delegates to host Chrome
                    logger.info(
                        "PlaywrightRuntime: Launching via Playwright channel '%s' (System Chrome)",
                        self.chrome_channel,
                    )
                    launch_kwargs["channel"] = self.chrome_channel

        try:
            return await self._playwright.chromium.launch(**launch_kwargs)
        except Exception as launch_err:
            if self.use_system_chrome and "channel" in launch_kwargs:
                # If channel launch failed, try searching again or fallback
                detected = find_system_chrome_path()
                if detected and detected != launch_kwargs.get("executable_path"):
                    logger.warning(
                        "PlaywrightRuntime: Channel '%s' launch failed. Retrying with detected path: %s",
                        self.chrome_channel,
                        detected,
                    )
                    launch_kwargs.pop("channel", None)
                    launch_kwargs["executable_path"] = detected
                    return await self._playwright.chromium.launch(**launch_kwargs)
            logger.error(
                "PlaywrightRuntime: Failed to launch system Chrome. Ensure Google Chrome is installed on the machine: %s",
                launch_err,
                exc_info=True,
            )
            raise

    def bind_disconnect(self, browser: Any, callback: Callable[[], None]) -> None:
        browser.on("disconnected", lambda b: callback())

    def is_browser_connected(self, browser: Any) -> bool:
        return browser.is_connected()

    async def close_browser(self, browser: Any, phase: str) -> None:
        if not browser:
            return

        try:
            connected = self.is_browser_connected(browser)
        except Exception as inspection_error:
            logger.warning(
                "BrowserRuntime: Failed to inspect browser connection before close: %s",
                inspection_error,
                exc_info=True,
                extra={"phase": phase},
            )
            connected = True

        if not connected:
            logger.debug(
                "BrowserRuntime: Skipping browser close; transport already disconnected.",
                extra={"phase": phase},
            )
            return

        try:
            await browser.close()
        except PlaywrightError as close_error:
            try:
                connected_after_error = self.is_browser_connected(browser)
            except Exception as inspection_error:
                logger.warning(
                    "BrowserRuntime: Browser close failed (%s); post-close connection inspection failed: %s",
                    close_error,
                    inspection_error,
                    exc_info=(type(close_error), close_error, close_error.__traceback__),
                    extra={"phase": phase},
                )
                return

            if connected_after_error:
                logger.warning(
                    "BrowserRuntime: Error closing browser: %s",
                    close_error,
                    exc_info=True,
                    extra={"phase": phase},
                )
            else:
                logger.debug(
                    "BrowserRuntime: Browser transport disconnected during close.",
                    extra={"phase": phase},
                )
        except Exception as close_error:
            # Playwright 1.6x can surface the known driver transport-close
            # race as a plain builtin Exception (transport sets it on
            # IncompleteReadError; wrap_api_call's rewrite_error preserves
            # the generic type), so the PlaywrightError branch above cannot
            # see it. Classify it benign only with full evidence: exact
            # transport signature AND post-error disconnect.
            known_transport_close = (
                "connection closed while reading from the driver"
                in str(close_error).lower()
            )
            if not known_transport_close:
                logger.warning(
                    "BrowserRuntime: Error closing browser: %s",
                    close_error,
                    exc_info=(type(close_error), close_error, close_error.__traceback__),
                    extra={"phase": phase},
                )
                return

            try:
                connected_after_error = self.is_browser_connected(browser)
            except Exception as inspection_error:
                logger.warning(
                    "BrowserRuntime: Browser close failed (%s); post-close connection inspection failed: %s",
                    close_error,
                    inspection_error,
                    exc_info=(type(close_error), close_error, close_error.__traceback__),
                    extra={"phase": phase},
                )
                return

            if connected_after_error:
                logger.warning(
                    "BrowserRuntime: Error closing browser: %s",
                    close_error,
                    exc_info=True,
                    extra={"phase": phase},
                )
            else:
                logger.debug(
                    "BrowserRuntime: Browser transport disconnected during close.",
                    extra={"phase": phase},
                )

    async def stop(self) -> None:
        if not self._playwright:
            return
        playwright = self._playwright
        try:
            await playwright.stop()
        except Exception as e:
            logger.warning(f"BrowserRuntime: Error stopping playwright: {e}", exc_info=True)
        finally:
            self._playwright = None
