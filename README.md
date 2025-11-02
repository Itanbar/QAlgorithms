# Grover's Algorithm Animation Web App

This project provides an interactive visualization of Grover's search algorithm over a configurable number of qubits (2–6). It uses a small Flask server to host the HTML, CSS, and JavaScript assets that drive the animation.

## Prerequisites
* Python 3.10+
* pip for installing Python packages

## Setup
1. Create and activate a virtual environment (optional but recommended).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the App
```bash
python main.py
```
The application will start on http://127.0.0.1:5000/.

If you see a message about Flask not being installed, make sure you have installed the dependencies first.

## Features
- Choose the number of qubits to explore different search-space sizes.
- Watch full Grover steps (oracle followed by diffusion) and see the marked state's probability after every iterate.
- Inspect amplitude and probability values for every basis state in real time.

## Project Structure
- `main.py`: Flask entry point.
- `templates/`: HTML templates.
- `static/js/`: JavaScript for the Grover animation.
- `static/css/`: Styles for the interface.

## Development Notes
Static asset directories are created automatically when the server boots, making it easier to run locally without manual setup.
