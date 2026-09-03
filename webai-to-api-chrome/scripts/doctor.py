import os
import sys
import socket
import json
import subprocess
import shutil
from pathlib import Path

# Import platform utils
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(SCRIPT_DIR.parent / "src"))

from app.utils.python_version import (
    SUPPORTED_RANGE_TEXT,
    WINDOWS_SUPPORTED_RANGE_TEXT,
    is_supported_python,
)
from app.env import load_local_env
from app.config_contract import load_effective_config
from app.utils.runtime_paths import (
    get_default_conversation_snapshot_db,
    get_runtime_dir,
    resolve_auth_state_dir,
    resolve_conversation_snapshot_db,
)

try:
    from platform_utils import get_linux_distro
except ImportError:
    def get_linux_distro():
        return None, sys.platform, False

# Colors
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(label, status, message="", color=Colors.ENDC):
    lines = message.split("\n")
    print(f"{Colors.BOLD}{label:<20}{Colors.ENDC} [{color}{status:<7}{Colors.ENDC}] {lines[0]}")
    for line in lines[1:]:
        print(f"{' ':<20}           {line}")

def check_python_version():
    current_version = sys.version_info
    version_text = f"{current_version[0]}.{current_version[1]}"
    full_version_text = (
        f"{current_version[0]}.{current_version[1]}.{current_version[2]}"
    )
    platform_name = "nt" if sys.platform == "win32" else "posix"
    if is_supported_python(current_version, platform_name=platform_name):
        print_status("Python", "PASS", f"Version {version_text} is supported ({SUPPORTED_RANGE_TEXT})")
        return True

    if platform_name == "nt":
        message = (
            f"Version {version_text} is unsupported on Windows (running {full_version_text}). "
            f"Windows Python {WINDOWS_SUPPORTED_RANGE_TEXT} is required for the secure "
            "Gemini WebAPI private cookie cache. "
        )
    else:
        message = f"Version {version_text} is unsupported. Python {SUPPORTED_RANGE_TEXT} is required. "
    print_status(
        "Python",
        "FAIL",
        message + "Run: poetry run python scripts/doctor.py",
        Colors.FAIL,
    )
    return False

def check_config():
    if os.path.isdir("config.conf"):
        print_status("Configuration", "FAIL", "config.conf exists but is a directory. Remove it.", Colors.FAIL)
        return False, None

    if not os.path.exists("config.conf"):
        print_status("Configuration", "FAIL", "config.conf is missing. Run: python scripts/bootstrap.py", Colors.FAIL)
        return False, None

    try:
        config = load_effective_config("config.conf")
        print_status("Configuration", "PASS", "config.conf found and valid")
        return True, config
    except Exception as e:
        print_status("Configuration", "FAIL", str(e), Colors.FAIL)
        return False, None

def check_env():
    if os.path.isdir(".env"):
        print_status("Environment", "FAIL", ".env exists but is a directory. Remove it.", Colors.FAIL)
        return False

    if os.path.exists(".env"):
        print_status("Environment", "PASS", ".env found")
        return True
    else:
        print_status("Environment", "WARN", ".env not found. Local runs may use defaults, but Docker Compose requires .env. Run: python scripts/bootstrap.py", Colors.WARNING)
        return True

def check_poetry():
    poetry_path = shutil.which("poetry")
    if not poetry_path:
        print_status("Poetry", "FAIL", "Poetry not found in PATH. Install Poetry: https://python-poetry.org/docs/#installation", Colors.FAIL)
        return False

    def summarize(value):
        if value is None:
            return ""
        if isinstance(value, bytes):
            value = value.decode(errors="replace")
        text = " ".join(str(value).split())
        return text if len(text) <= 200 else text[:197] + "..."

    def output_detail(stderr=None, stdout=None):
        details = []
        if summarize(stderr):
            details.append(f"stderr: {summarize(stderr)}")
        if summarize(stdout):
            details.append(f"stdout: {summarize(stdout)}")
        return "; ".join(details)

    try:
        res = subprocess.run(["poetry", "--version"], capture_output=True, text=True, timeout=5)
    except subprocess.TimeoutExpired as error:
        detail = output_detail(
            getattr(error, "stderr", None),
            getattr(error, "stdout", getattr(error, "output", None)),
        )
        message = "poetry --version timed out after 5 seconds"
        if detail:
            message += f" ({detail})"
        print_status("Poetry", "FAIL", message, Colors.FAIL)
        return False
    except Exception as error:
        message = f"poetry --version failed ({type(error).__name__}): {summarize(error)}"
        print_status("Poetry", "FAIL", message, Colors.FAIL)
        return False

    if res.returncode == 0:
        version = (res.stdout or "").strip() or "Installed"
        print_status("Poetry", "PASS", version)
        return True

    detail = output_detail(res.stderr, res.stdout)
    message = f"poetry --version failed with exit code {res.returncode}"
    if detail:
        message += f" ({detail})"
    print_status("Poetry", "FAIL", message, Colors.FAIL)
    return False

def check_runtime_dirs(config):
    configured_auth_state_dir = config.get(
        "Playwright", "auth_state_dir", fallback=None
    ) if config else None
    runtime_dir = get_runtime_dir()
    auth_state_dir = resolve_auth_state_dir(configured_auth_state_dir)
    cache_dir = os.path.join(runtime_dir, "cache")
    conversation_db = resolve_conversation_snapshot_db()
    dirs = [runtime_dir, auth_state_dir, cache_dir]
    if conversation_db != ":memory:":
        conversation_parent = os.path.dirname(conversation_db) or "."
        dirs.append(conversation_parent)
    missing = [path for path in dirs if not os.path.isdir(path)]
    conversation_detail = (
        "in-memory database"
        if conversation_db == ":memory:"
        else f"{conversation_db} (parent: {os.path.dirname(conversation_db) or '.'})"
    )
    details = (
        f"Runtime: {runtime_dir}\n"
        f"Auth: {auth_state_dir}\n"
        f"Cache: {cache_dir}\n"
        f"Conversation DB: {conversation_detail}"
    )
    
    if not missing:
        print_status("Directories", "PASS", details)
        return True
    else:
        print_status(
            "Directories", "FAIL", f"Missing: {', '.join(missing)}\n{details}", Colors.FAIL
        )
        return False


def check_docker_runtime_source():
    source = os.environ.get("DOCKER_RUNTIME_DIR", "runtime")
    if os.path.isdir(source):
        print_status("Docker Runtime", "PASS", f"{source} -> /app/runtime")
    else:
        print_status(
            "Docker Runtime",
            "WARN",
            f"{source} is missing or not a directory; Docker requires {source} -> /app/runtime. "
            "Run: python scripts/bootstrap.py",
            Colors.WARNING,
        )

def check_platform():
    _, pretty_name, is_arch_based = get_linux_distro()
    
    suffix = " (Arch-based)" if is_arch_based else ""
    print_status("Platform", "INFO", f"{pretty_name}{suffix}")
    return is_arch_based

def check_playwright(is_arch_based=False):
    # Check if playwright package is installed via poetry
    try:
        res = subprocess.run(["poetry", "run", "python", "-c", "import playwright; print('ok')"], 
                             capture_output=True, text=True, timeout=10)
        if res.returncode == 0:
            print_status("Playwright Pkg", "PASS", "Playwright package is installed")
        else:
            print_status("Playwright Pkg", "FAIL", "Playwright package not found. Run: poetry install", Colors.FAIL)
            return False
    except Exception as e:
        print_status("Playwright Pkg", "FAIL", f"Could not check playwright: {e}", Colors.FAIL)
        return False

    # Check for System Google Chrome (installed on machine)
    try:
        check_script = """\
import os
import sys
import shutil

# Check if app module is available to call find_system_chrome_path
try:
    sys.path.append(os.path.join(os.getcwd(), "src"))
    from app.services.browser.runtime.playwright_runtime import find_system_chrome_path
    path = find_system_chrome_path()
    if path:
        print(f"found:{path}")
        sys.exit(0)
except Exception:
    pass

# Fallback direct check
for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"):
    found = shutil.which(name)
    if found:
        print(f"found:{found}")
        sys.exit(0)

# Check Windows Program Files
for base in (os.environ.get("PROGRAMFILES", "C:\\\\Program Files"), os.environ.get("PROGRAMFILES(X86)", "C:\\\\Program Files (x86)")):
    test_p = os.path.join(base, "Google", "Chrome", "Application", "chrome.exe")
    if os.path.isfile(test_p):
        print(f"found:{test_p}")
        sys.exit(0)

print("missing")
"""
        res = subprocess.run(
            ["poetry", "run", "python", "-"],
            input=check_script,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except Exception as error:
        print_status(
            "System Chrome",
            "WARN",
            f"Could not verify Google Chrome installation: {error}. Make sure Google Chrome is installed on the machine.",
            Colors.WARNING,
        )
        return True

    output = (res.stdout or "").strip()
    if output.startswith("found:"):
        chrome_path = output.split("found:", 1)[1].strip()
        print_status("System Chrome", "PASS", f"Installed Google Chrome found ({chrome_path})")
        return True
    elif output == "missing":
        print_status(
            "System Chrome",
            "WARN",
            "Google Chrome not found in standard paths. Ensure Chrome is installed or configure 'chrome_path' in config.conf",
            Colors.WARNING,
        )
        return True
    else:
        print_status("System Chrome", "PASS", "System Chrome runtime configured")
        return True

def check_auth_material(config):
    has_fail = False
    
    # Priority 1: [Gemini] section. PSID is required; PSIDTS is optional.
    # Both canonical and common alias names are accepted in the [Gemini] section.
    psid = (
        config.get("Gemini", "__Secure-1PSID", fallback="") or 
        config.get("Gemini", "gemini_cookie_1psid", fallback="") or 
        config.get("Gemini", "gemini_cookie_1PSID", fallback="")
    )
    psidts = (
        config.get("Gemini", "__Secure-1PSIDTS", fallback="") or 
        config.get("Gemini", "gemini_cookie_1psidts", fallback="") or 
        config.get("Gemini", "gemini_cookie_1PSIDTS", fallback="")
    )
    
    # Priority 2: Legacy [Cookies] section (compatibility)
    # The runtime supports several keys in [Cookies]
    psid_l = (
        config.get("Cookies", "gemini_cookie_1psid", fallback="") or 
        config.get("Cookies", "gemini_cookie_1PSID", fallback="") or 
        config.get("Cookies", "__Secure-1PSID", fallback="")
    )
    psidts_l = (
        config.get("Cookies", "gemini_cookie_1psidts", fallback="") or 
        config.get("Cookies", "gemini_cookie_1PSIDTS", fallback="") or 
        config.get("Cookies", "__Secure-1PSIDTS", fallback="")
    )

    configured_auth_state_dir = config.get(
        "Playwright", "auth_state_dir", fallback=None
    )
    json_path = os.path.join(resolve_auth_state_dir(configured_auth_state_dir), "gemini.json")
    json_exists = False
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "cookies" in data:
                    json_exists = True
        except Exception:
            pass

    if psid:
        print_status("Auth (Config)", "PASS", "Gemini cookies found in [Gemini] configuration")
    elif psid_l:
        print_status("Auth (Config)", "WARN", "Using legacy [Cookies] configuration (supported but deprecated)", Colors.WARNING)
    elif json_exists:
        print_status("Auth (Config)", "WARN", f"No Gemini cookies configured; {json_path} will be used", Colors.WARNING)
    else:
        print_status("Auth (Config)", "WARN", "No Gemini auth material found (cookies or JSON state)", Colors.WARNING)

    # Detailed Auth (JSON) check
    if os.path.exists(json_path):
        unreadable_json_msg = (
            f"{json_path} is unreadable/corrupt. Playwright authentication is broken; "
            "WebAPI cookie authentication may still be unaffected. "
            "Run: poetry run python verify_login.py"
        )
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "cookies" in data:
                    print_status("Auth (JSON)", "PASS", f"{json_path} exists and is valid")
                else:
                    print_status("Auth (JSON)", "FAIL", unreadable_json_msg, Colors.FAIL)
                    has_fail = True
        except Exception as e:
            print_status("Auth (JSON)", "FAIL", f"Error reading {json_path}: {e}. {unreadable_json_msg}", Colors.FAIL)
            has_fail = True
    else:
        # If no JSON and no config, this is where we'd advise verify_login
        if not psid and not psid_l:
            print_status("Auth (JSON)", "WARN", f"{json_path} missing. Run: poetry run python verify_login.py", Colors.WARNING)

    return not has_fail

def check_port():
    port = 6969
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", port))
        print_status("Port 6969", "PASS", "Port is available")
        return True
    except socket.error:
        print_status("Port 6969", "FAIL", "Port 6969 is already in use", Colors.FAIL)
        return False
    finally:
        s.close()

def check_exposure():
    # In doctor.py we don't have full access to current running process args, 
    # but we can check config if it overrides defaults, although current app uses CLI args for host.
    # We'll just check common "unsafe" binds if we could.
    # For now, let's just note that localhost is the safe default.
    print_status("Security", "INFO", "Dashboard is safe when bound to localhost (default)")
    return True

def main():
    print("=" * 60)
    print("WebAI-to-API Diagnostics (Doctor)")
    print("=" * 60)

    has_fail = False

    load_local_env()

    if not check_python_version(): has_fail = True

    config_ok, config = check_config()
    if not config_ok: has_fail = True

    if not check_env(): has_fail = True

    poetry_ok = check_poetry()
    if not poetry_ok: has_fail = True

    if config_ok and not check_runtime_dirs(config): has_fail = True
    check_docker_runtime_source()
    
    is_arch_based = check_platform()

    if poetry_ok:
        if not check_playwright(is_arch_based): has_fail = True
    if config_ok and poetry_ok:
        if not check_auth_material(config): has_fail = True

    if not check_port(): has_fail = True
    
    check_exposure()

    print("=" * 60)
    if has_fail:
        print(f"{Colors.FAIL}{Colors.BOLD}DIAGNOSTICS FAILED{Colors.ENDC}")
        print("Please address the FAIL items above.")
        sys.exit(1)
    else:
        print(f"{Colors.OKGREEN}{Colors.BOLD}DIAGNOSTICS PASSED{Colors.ENDC}")
        print("Your environment looks good!")
        sys.exit(0)

if __name__ == "__main__":
    main()
