import importlib.util
import sys
from pathlib import Path

if importlib.util.find_spec("flask") is None:
    sys.exit(
        "Flask is required to run this application. Install dependencies with "
        "`pip install -r requirements.txt`."
    )

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    """Render the Grover animation page."""
    return render_template("index.html")


if __name__ == "__main__":
    # Ensure the static/template folders exist when running the app locally.
    base_path = Path(__file__).resolve().parent
    (base_path / "templates").mkdir(exist_ok=True)
    (base_path / "static" / "js").mkdir(parents=True, exist_ok=True)
    (base_path / "static" / "css").mkdir(parents=True, exist_ok=True)

    app.run(host="0.0.0.0", port=5000, debug=True)
