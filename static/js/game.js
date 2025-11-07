// Game constants
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const FPS = 60;

// Game states
const GooseState = {
    EGG: 'egg',
    GOSLING: 'gosling',
    ADULT: 'adult'
};

const PredatorType = {
    FOX: 'fox',
    EAGLE: 'eagle'
};

// Goose class
class Goose {
    constructor(state, weeksLeft, x, y, gender = 'female', parent = null) {
        this.state = state;
        this.weeksLeft = weeksLeft;
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.parent = parent;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.facingLeft = false;
        this.health = 100;
        this.ageWeeks = state === GooseState.ADULT ? 0 : -weeksLeft;
        this.hiding = false;
        this.hidingEndTime = 0;
    }

    move(width, height) {
        if (this.state === GooseState.EGG) return;

        // Goslings follow parent
        if (this.state === GooseState.GOSLING && this.parent) {
            const dx = this.parent.x - this.x;
            const dy = this.parent.y - this.y;
            const factor = 15;
            this.vx = dx / factor + Math.random() * 0.4 - 0.2;
            this.vy = dy / factor + Math.random() * 0.4 - 0.2;
        } else {
            // Random wandering
            if (Math.random() < 0.05) {
                this.vx += Math.random() - 0.5;
                this.vy += Math.random() - 0.5;
            }
        }

        // Limit speed
        const maxSpeed = this.state === GooseState.GOSLING ? 1.5 : 2.5;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Keep in bounds
        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));

        // Update facing
        if (this.vx < 0) this.facingLeft = true;
        else if (this.vx > 0) this.facingLeft = false;
    }

    draw(ctx) {
        if (this.hiding) {
            ctx.globalAlpha = 0.3;
        }

        if (this.state === GooseState.EGG) {
            // Draw egg
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
        } else if (this.state === GooseState.GOSLING) {
            // Draw gosling (small yellow)
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
            // Beak
            ctx.fillStyle = '#FF8C00';
            const beakX = this.facingLeft ? this.x - 15 : this.x + 15;
            ctx.beginPath();
            ctx.arc(beakX, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw adult goose
            ctx.fillStyle = 'white';
            // Body
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.arc(this.x, this.y - 20, 15, 0, Math.PI * 2);
            ctx.fill();
            // Beak
            ctx.fillStyle = '#FF8C00';
            const beakX = this.facingLeft ? this.x - 15 : this.x + 15;
            ctx.beginPath();
            ctx.arc(beakX, this.y - 20, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
    }
}

// Predator class
class Predator {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 5 - 2.5;
        this.vy = Math.random() * 5 - 2.5;
    }

    move(width, height, geese) {
        // Hunt nearest goose
        const nearestGoose = this.findNearestGoose(geese);
        if (nearestGoose) {
            const distance = this.distance(nearestGoose);
            if (distance < 150 && !nearestGoose.hiding) {
                const dx = nearestGoose.x - this.x;
                const dy = nearestGoose.y - this.y;
                this.vx += dx / 20;
                this.vy += dy / 20;
            }
        }

        // Limit speed
        const maxSpeed = 3.5;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
    }

    findNearestGoose(geese) {
        let nearest = null;
        let minDist = Infinity;
        for (const goose of geese) {
            if (goose.state !== GooseState.EGG && !goose.hiding) {
                const dist = this.distance(goose);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = goose;
                }
            }
        }
        return nearest;
    }

    distance(goose) {
        const dx = this.x - goose.x;
        const dy = this.y - goose.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    canAttack(goose) {
        return this.distance(goose) < 30 && !goose.hiding;
    }

    draw(ctx) {
        if (this.type === PredatorType.FOX) {
            // Draw fox (orange)
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x - 15, this.y - 25, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y - 25, 12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw eagle (brown with wings)
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x - 50, this.y - 10, 40, 20);
            ctx.fillRect(this.x + 10, this.y - 10, 40, 20);
        }
    }
}

// Pond class
class Pond {
    constructor(x, y, rx, ry) {
        this.x = x;
        this.y = y;
        this.rx = rx;
        this.ry = ry;
    }

    draw(ctx) {
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.rx, this.ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Bush class
class Bush {
    constructor(x, y, radius = 40) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    draw(ctx) {
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Add some texture
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 12, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game class
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
        
        canvas.width = this.width;
        canvas.height = this.height;
        
        this.geese = [];
        this.predators = [];
        this.ponds = [];
        this.bushes = [];
        
        this.score = 0;
        this.gameTime = 0;
        this.gameOver = false;
        this.paused = false;
        this.startTime = Date.now();
        
        this.init();
        
        // Mouse click handler
        canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    init() {
        // Add starting geese
        this.geese.push(new Goose(GooseState.ADULT, 0, 300, 200, 'male'));
        this.geese.push(new Goose(GooseState.ADULT, 0, 320, 200, 'female'));

        // Add ponds
        this.ponds.push(new Pond(400, 400, 120, 80));
        this.ponds.push(new Pond(800, 500, 100, 100));

        // Add bushes
        this.bushes.push(new Bush(200, 500));
        this.bushes.push(new Bush(600, 300));
        this.bushes.push(new Bush(900, 150));

        // Add predators
        this.predators.push(new Predator(PredatorType.FOX, 100, 100));
        this.predators.push(new Predator(PredatorType.EAGLE, 900, 100));
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on a goose
        for (const goose of this.geese) {
            const dx = x - goose.x;
            const dy = y - goose.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                // Find nearest bush
                let nearestBush = null;
                let minDist = Infinity;
                for (const bush of this.bushes) {
                    const dist = Math.sqrt(
                        (bush.x - goose.x) ** 2 + (bush.y - goose.y) ** 2
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestBush = bush;
                    }
                }
                
                if (nearestBush) {
                    goose.hiding = true;
                    goose.x = nearestBush.x;
                    goose.y = nearestBush.y;
                    setTimeout(() => {
                        goose.hiding = false;
                    }, 3000);
                }
                break;
            }
        }
    }

    update() {
        if (this.gameOver || this.paused) return;

        this.gameTime++;

        // Update geese
        this.geese.forEach(goose => {
            goose.move(this.width, this.height);
            if (goose.weeksLeft > 0) goose.weeksLeft--;
        });

        // Update predators
        this.predators.forEach(predator => {
            predator.move(this.width, this.height, this.geese);
        });

        // Check attacks
        for (let i = this.geese.length - 1; i >= 0; i--) {
            const goose = this.geese[i];
            for (const predator of this.predators) {
                if (predator.canAttack(goose) && goose.state !== GooseState.EGG) {
                    this.geese.splice(i, 1);
                    break;
                }
            }
        }

        // Breeding
        if (this.gameTime % 500 === 0) {
            this.breed();
        }

        // Hatching eggs
        this.geese.forEach(goose => {
            if (goose.state === GooseState.EGG && goose.weeksLeft <= 0) {
                goose.state = GooseState.GOSLING;
                goose.weeksLeft = 12;
            }
        });

        // Maturing goslings
        this.geese.forEach(goose => {
            if (goose.state === GooseState.GOSLING && goose.weeksLeft <= 0) {
                goose.state = GooseState.ADULT;
                goose.parent = null;
                this.score += 10;
            }
        });

        // Check game over
        if (this.geese.length === 0) {
            this.gameOver = true;
        }

        this.updateUI();
    }

    breed() {
        const males = this.geese.filter(g => g.state === GooseState.ADULT && g.gender === 'male');
        const females = this.geese.filter(g => g.state === GooseState.ADULT && g.gender === 'female');

        if (males.length > 0 && females.length > 0) {
            const mother = females[Math.floor(Math.random() * females.length)];
            const egg = new Goose(
                GooseState.EGG,
                4,
                mother.x + 20,
                mother.y + 20,
                Math.random() < 0.5 ? 'male' : 'female',
                mother
            );
            this.geese.push(egg);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw ponds
        this.ponds.forEach(pond => pond.draw(this.ctx));

        // Draw bushes
        this.bushes.forEach(bush => bush.draw(this.ctx));

        // Draw geese
        this.geese.forEach(goose => goose.draw(this.ctx));

        // Draw predators
        this.predators.forEach(predator => predator.draw(this.ctx));

        // Draw game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.width / 2, this.height / 2);
            this.ctx.font = 'bold 30px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 50);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('geese-count').textContent = `Geese: ${this.geese.length}`;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        document.getElementById('time').textContent = `Time: ${elapsed}s`;
    }

    reset() {
        this.geese = [];
        this.predators = [];
        this.ponds = [];
        this.bushes = [];
        this.score = 0;
        this.gameTime = 0;
        this.gameOver = false;
        this.paused = false;
        this.startTime = Date.now();
        this.init();
        this.updateUI();
    }

    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
}

// Initialize game when page loads
let game;

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);

    // Game loop
    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Button handlers
    document.getElementById('resetBtn').addEventListener('click', () => {
        game.reset();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        const paused = game.togglePause();
        document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
    });
});
