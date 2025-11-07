"""
Goose Migration Game - Flask Web Server
"""
from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

# Game state will be managed on client side (JavaScript)
# This server just serves the game

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/api/highscore', methods=['GET'])
def get_highscore():
    """API endpoint for high scores (can expand later)"""
    return jsonify({
        'highscore': 0,
        'message': 'High score system coming soon!'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
