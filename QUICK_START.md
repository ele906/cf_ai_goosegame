# 🚀 SUPER QUICK START

## In VSCode (Easiest Way)

1. **Open folder in VSCode**
   - File → Open Folder → Select `GooseGameWeb`

2. **Open terminal in VSCode**
   - Terminal → New Terminal (or Ctrl + `)

3. **Install Flask**
   ```bash
   pip install flask
   ```

4. **Run the game**
   ```bash
   python app.py
   ```

5. **Open your browser**
   - Go to: `http://localhost:5000`
   - Play! 🎮

## No Python? Install First!

### Windows:
1. Go to https://python.org/downloads
2. Download Python 3.12
3. **IMPORTANT**: Check "Add Python to PATH" during install
4. Restart VSCode
5. Then follow steps above

### Mac:
```bash
# In terminal:
brew install python3
```

### Linux:
```bash
# In terminal:
sudo apt install python3 python3-pip
```

## Troubleshooting

**"pip not found"?**
```bash
python -m pip install flask
```

**"Python not found"?**
- Close and reopen VSCode after installing Python
- Make sure you checked "Add to PATH" during install

**"Port 5000 already in use"?**
- Edit `app.py`, change last line to:
  ```python
  app.run(debug=True, port=5001)
  ```
- Then use `http://localhost:5001`

## Alternative: Run Without Installing Anything

Use **Python's built-in server** (no Flask needed):

1. Remove the Flask app.py
2. Just open `templates/index.html` in your browser
3. You'll need to adjust paths - or use this command:
   ```bash
   python -m http.server 8000
   ```
   Then go to `http://localhost:8000/templates/index.html`

## That's It!

Questions? The game should just work once Python + Flask are installed!
