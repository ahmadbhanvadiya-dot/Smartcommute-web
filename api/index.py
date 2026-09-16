import sys
from pathlib import Path

# ------------------------------------------------------------
# Add FastAPI backend directory to Python path
# ------------------------------------------------------------

BACKEND_DIR = (
    Path(__file__).resolve().parent.parent
    / "smartcommute-api"
)

sys.path.insert(0, str(BACKEND_DIR))

# ------------------------------------------------------------
# Import existing FastAPI application
# ------------------------------------------------------------

from main import app  # noqa: E402