class ObstacleCourseBuilder {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameMode = 'menu'; // 'menu', 'build', 'play'

        // Grid system for course building
        this.gridSize = 40;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);

        // Course data
        this.course = [];
        this.selectedObstacle = 'barrier';

        // Player data for play mode
        this.player = {
            x: 60,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            groundY: this.canvas.height - 80,
            velocityX: 0,
            velocityY: 0,
            jumping: false,
            ducking: false,
            onGround: true,
            onPlatform: false,
            platformY: 0,
            acceleration: 0.8,
            maxSpeed: 6,
            friction: 0.85,
            gravity: 0.8,
            jumpPower: 15,
            health: 100,
            maxHealth: 100,
            damageFlash: 0,
            damageCooldown: 0,
            weapon: 'none', // 'none', 'sword', or 'gun'
            attackCooldown: 0,
            swinging: false,
            swingTimer: 0,
            swingDuration: 15
        };

        // Game state
        this.gameState = 'running'; // 'running', 'completed', 'failed'
        this.keys = {};
        this.cameraX = 0;

        // Animation frame counter for moving obstacles
        this.animationFrame = 0;

        // Projectiles array for gun
        this.projectiles = [];

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            if (this.gameMode === 'build') {
                this.handleCanvasClick(e);
            } else if (this.gameMode === 'play') {
                this.handlePlayerClick(e);
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key === 'Escape') {
                this.showMenu();
            }

            if (this.gameMode === 'build') {
                this.handleBuildModeKeys(e.key);
            } else if (this.gameMode === 'play') {
                this.handlePlayModeKeys(e.key);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // UI Button events
        document.getElementById('buildModeBtn').addEventListener('click', () => {
            this.startBuildMode();
        });

        document.getElementById('playModeBtn').addEventListener('click', () => {
            this.startPlayMode();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startPlayMode();
        });

        document.getElementById('saveCourseBtn').addEventListener('click', () => {
            this.saveCourse();
        });

        document.getElementById('loadCourseBtn').addEventListener('click', () => {
            this.loadCourse();
        });

        document.getElementById('clearCourseBtn').addEventListener('click', () => {
            this.clearCourse();
        });

        // Obstacle palette selection
        document.querySelectorAll('.obstacle-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectObstacle(item.dataset.type);
            });
        });

        // Section expand/collapse functionality
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                this.toggleSection(header.dataset.section);
            });
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate grid offset to align with green line
        const groundLineY = this.canvas.height - 60;
        const gridOffsetY = groundLineY % this.gridSize;

        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor((y - gridOffsetY) / this.gridSize);

        // Check if clicking on an existing sign to edit it
        const existingSign = this.course.find(obs =>
            obs.gridX === gridX && obs.gridY === gridY && obs.type === 'sign'
        );

        if (existingSign) {
            this.editSignMessage(existingSign);
        } else {
            this.toggleObstacle(gridX, gridY, gridOffsetY);
        }
    }

    handlePlayerClick(e) {
        if (this.player.weapon === 'sword' && this.player.attackCooldown <= 0 && !this.player.swinging) {
            // Swing sword
            this.player.swinging = true;
            this.player.swingTimer = this.player.swingDuration;
            this.player.attackCooldown = 30; // Half second cooldown
        } else if (this.player.weapon === 'gun' && this.player.attackCooldown <= 0) {
            // Fire gun
            this.fireGun();
            this.player.attackCooldown = 20; // Faster cooldown for gun
        }
    }

    fireGun() {
        // Create projectile
        const projectile = {
            x: this.player.x + 20, // Start from front of player
            y: this.player.y - 15, // Center height
            velocityX: 8, // Fast horizontal speed
            velocityY: 0,
            maxDistance: this.gridSize * 3, // 3 blocks range
            startX: this.player.x + 20,
            active: true
        };
        this.projectiles.push(projectile);
    }

    editSignMessage(signObstacle) {
        const newMessage = prompt('Enter sign message:', signObstacle.message);
        if (newMessage !== null) {
            // Limit message length to fit on sign
            signObstacle.message = newMessage.substring(0, 8).toUpperCase();
        }
    }

    handleBuildModeKeys(key) {
        switch(key) {
            case '1': this.selectObstacle('barrier'); break;
            case '2': this.selectObstacle('sign'); break;
            case '3': this.selectObstacle('cone'); break;
            case '4': this.selectObstacle('spikes'); break;
            case '5': this.selectObstacle('laser'); break;
            case '6': this.selectObstacle('platform'); break;
            case '7': this.selectObstacle('moving-platform'); break;
            case '8': this.selectObstacle('spring'); break;
            case '9': this.selectObstacle('teleporter'); break;
            case 'e': this.selectObstacle('enemy'); break;
            case 'i': this.selectObstacle('ice-platform'); break;
            case 'v': this.selectObstacle('conveyor'); break;
            case 'p': this.selectObstacle('disappearing-platform'); break;
            case 'f': this.selectObstacle('fire'); break;
            case 's': this.selectObstacle('saw'); break;
            case 'o': this.selectObstacle('poison-cloud'); break;
            case 'l': this.selectObstacle('electric-fence'); break;
            case 'c': this.selectObstacle('checkpoint'); break;
            case 'k': this.selectObstacle('key'); break;
            case 'd': this.selectObstacle('door'); break;
            case 'g': this.selectObstacle('gravity-flip'); break;
            case 'b': this.selectObstacle('speed-boost'); break;
            case 'x': this.clearCourse(); break;
        }
    }

    handlePlayModeKeys(key) {
        // Handle jump and duck separately (one-time actions)
        switch(key.toLowerCase()) {
            case 'w':
            case 'arrowup':
            case ' ':
                this.jump();
                break;
            case 's':
            case 'arrowdown':
                this.duck();
                break;
            case '1':
                this.player.weapon = 'none';
                break;
            case '2':
                this.player.weapon = 'sword';
                break;
            case '3':
                this.player.weapon = 'gun';
                break;
        }
    }

    selectObstacle(type) {
        this.selectedObstacle = type;
        document.querySelectorAll('.obstacle-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
    }

    toggleSection(sectionName) {
        const header = document.querySelector(`[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}Section`);
        const icon = header.querySelector('.expand-icon');

        if (content.classList.contains('expanded')) {
            // Collapse section
            content.classList.remove('expanded');
            header.classList.remove('expanded');
            icon.textContent = '▶';
        } else {
            // Expand section
            content.classList.add('expanded');
            header.classList.add('expanded');
            icon.textContent = '▼';
        }
    }

    toggleObstacle(gridX, gridY, gridOffsetY) {
        const existingIndex = this.course.findIndex(obs => obs.gridX === gridX && obs.gridY === gridY);

        if (existingIndex >= 0) {
            // Remove obstacle
            this.course.splice(existingIndex, 1);
        } else {
            // Check if trying to place below green line (ground level)
            const groundLineY = this.canvas.height - 60;
            const actualY = gridY * this.gridSize + gridOffsetY;

            if (actualY >= groundLineY) {
                // Don't allow placement below green line
                return;
            }

            // Add obstacle
            const obstacle = {
                type: this.selectedObstacle,
                gridX: gridX,
                gridY: gridY,
                x: gridX * this.gridSize,
                y: actualY
            };

            // Add special properties for specific obstacles
            if (this.selectedObstacle === 'moving-platform') {
                obstacle.direction = 1;
                obstacle.startX = obstacle.x;
                obstacle.range = this.gridSize * 3;
            } else if (this.selectedObstacle === 'laser') {
                obstacle.active = true;
                obstacle.timer = 0;
            } else if (this.selectedObstacle === 'enemy') {
                obstacle.health = 30;
                obstacle.maxHealth = 30;
                obstacle.direction = 1;
                obstacle.speed = 1;
                obstacle.startX = obstacle.x;
                obstacle.range = this.gridSize * 2;
                obstacle.attackCooldown = 0;
            } else if (this.selectedObstacle === 'sign') {
                obstacle.message = 'DUCK';
            } else if (this.selectedObstacle === 'ice-platform') {
                obstacle.slippery = true;
            } else if (this.selectedObstacle === 'conveyor') {
                obstacle.direction = 1;
                obstacle.speed = 2;
            } else if (this.selectedObstacle === 'disappearing-platform') {
                obstacle.visible = true;
                obstacle.timer = 0;
                obstacle.cycleTime = 120;
            } else if (this.selectedObstacle === 'fire') {
                obstacle.intensity = Math.random() * 0.5 + 0.5;
            } else if (this.selectedObstacle === 'saw') {
                obstacle.rotation = 0;
            } else if (this.selectedObstacle === 'poison-cloud') {
                obstacle.opacity = 0.7;
                obstacle.drift = Math.random() * 2 - 1;
            } else if (this.selectedObstacle === 'electric-fence') {
                obstacle.active = true;
                obstacle.timer = 0;
            } else if (this.selectedObstacle === 'door') {
                obstacle.locked = true;
            } else if (this.selectedObstacle === 'key') {
                obstacle.collected = false;
            }

            this.course.push(obstacle);
        }
    }

    startBuildMode() {
        this.gameMode = 'build';
        this.hideAllScreens();
        document.getElementById('obstaclePalette').classList.remove('hidden');
        document.getElementById('courseManagement').classList.remove('hidden');
        document.getElementById('buildControls').classList.remove('hidden');
        document.getElementById('playControls').classList.add('hidden');
    }

    startPlayMode() {
        if (this.course.length === 0) {
            alert('Please build a course first!');
            return;
        }

        this.gameMode = 'play';
        this.resetPlayer();
        this.hideAllScreens();
        document.getElementById('buildControls').classList.add('hidden');
        document.getElementById('playControls').classList.remove('hidden');
        document.getElementById('healthDisplay').classList.remove('hidden');
        this.gameState = 'running';
        this.updateHealthBar();
    }

    showMenu() {
        this.gameMode = 'menu';
        this.hideAllScreens();
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('playControls').classList.add('hidden');
        document.getElementById('buildControls').classList.add('hidden');
        document.getElementById('healthDisplay').classList.add('hidden');
    }

    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('obstaclePalette').classList.add('hidden');
        document.getElementById('courseManagement').classList.add('hidden');
    }

    resetPlayer() {
        this.player.x = 60;
        this.player.y = this.player.groundY;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.jumping = false;
        this.player.ducking = false;
        this.player.onGround = true;
        this.player.onPlatform = false;
        this.player.platformY = 0;
        this.player.health = this.player.maxHealth;
        this.player.damageFlash = 0;
        this.player.damageCooldown = 0;
        this.player.weapon = 'none';
        this.player.attackCooldown = 0;
        this.player.swinging = false;
        this.player.swingTimer = 0;
        this.projectiles = [];
        this.cameraX = 0;
    }

    jump() {
        if (this.player.onGround || this.player.onPlatform) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.jumping = true;
            this.player.onGround = false;
            this.player.onPlatform = false;
        }
    }

    duck() {
        if (this.player.onGround) {
            this.player.ducking = true;
            setTimeout(() => {
                this.player.ducking = false;
            }, 300);
        }
    }

    saveCourse() {
        if (this.course.length === 0) {
            alert('No course to save!');
            return;
        }

        const courseData = JSON.stringify(this.course);
        localStorage.setItem('customObstacleCourse', courseData);
        alert('Course saved successfully!');
    }

    loadCourse() {
        const savedCourse = localStorage.getItem('customObstacleCourse');
        if (savedCourse) {
            this.course = JSON.parse(savedCourse);
            alert('Course loaded successfully!');
        } else {
            alert('No saved course found!');
        }
    }

    clearCourse() {
        this.course = [];
        alert('Course cleared!');
    }

    getStickmanBounds() {
        const playerX = this.player.x;
        const playerY = this.player.y;
        const headRadius = 8;
        const bodyHeight = this.player.ducking ? 15 : 25;

        // Calculate bounds for all stickman parts
        let bounds = {
            left: playerX - 15,   // Arms/legs can extend 15 pixels left
            right: playerX + 15,  // Arms/legs can extend 15 pixels right
            top: playerY - bodyHeight - headRadius - 2, // Top of head
            bottom: playerY + (this.player.ducking ? 5 : 15) // Bottom of feet
        };

        return bounds;
    }

    takeDamage(amount) {
        if (this.player.damageCooldown <= 0) {
            this.player.health -= amount;
            this.player.damageFlash = 30; // Flash for 30 frames
            this.player.damageCooldown = 60; // 1 second cooldown at 60fps

            this.updateHealthBar();

            if (this.player.health <= 0) {
                this.player.health = 0;
                this.gameState = 'failed';
                this.showGameOver('Health Depleted!');
            }
        }
    }

    updateHealthBar() {
        const healthPercentage = (this.player.health / this.player.maxHealth) * 100;
        const healthFill = document.getElementById('healthFill');
        const healthText = document.getElementById('healthText');

        healthFill.style.width = healthPercentage + '%';
        healthText.textContent = `${Math.max(0, this.player.health)}/${this.player.maxHealth}`;

        // Change color based on health percentage
        if (healthPercentage > 60) {
            healthFill.style.background = 'linear-gradient(90deg, #00ff00, #66ff66)';
        } else if (healthPercentage > 30) {
            healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff66)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6666)';
        }
    }

    updatePlayMode() {
        if (this.gameState !== 'running') return;

        this.animationFrame++;

        // Update obstacles first
        this.updateObstacles();

        // Update projectiles
        this.updateProjectiles();

        // Handle smooth movement input
        this.handleMovementInput();

        // Update player physics
        this.updatePlayerPhysics();

        // Update damage effects
        if (this.player.damageFlash > 0) {
            this.player.damageFlash--;
        }
        if (this.player.damageCooldown > 0) {
            this.player.damageCooldown--;
        }
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown--;
        }
        if (this.player.swinging && this.player.swingTimer > 0) {
            this.player.swingTimer--;
            if (this.player.swingTimer <= 0) {
                this.player.swinging = false;
            }
        }

        // Keep player in bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width * 3) this.player.x = this.canvas.width * 3;

        // Update camera
        this.cameraX = Math.max(0, this.player.x - this.canvas.width / 3);

        // Check obstacle collisions
        this.checkCollisions();

        // Check if course is completed
        if (this.player.x > this.canvas.width * 2.5) {
            this.gameState = 'completed';
            this.showGameOver('Course Complete!');
        }
    }

    handleMovementInput() {
        // Direct movement control - stop immediately when keys released
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.velocityX = -this.player.maxSpeed;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.player.velocityX = this.player.maxSpeed;
        } else {
            // Stop immediately when no movement keys are pressed
            this.player.velocityX = 0;
        }
    }

    updatePlayerPhysics() {
        // Apply horizontal movement directly - no additional physics on horizontal movement
        this.player.x += this.player.velocityX;

        // Reset ground/platform status
        this.player.onGround = false;
        this.player.onPlatform = false;

        // Apply gravity only to vertical movement
        this.player.velocityY += this.player.gravity;

        // Apply vertical movement
        this.player.y += this.player.velocityY;

        // Check ground collision
        if (this.player.y >= this.player.groundY) {
            this.player.y = this.player.groundY;
            this.player.velocityY = 0;
            this.player.onGround = true;
            this.player.jumping = false;
        }

        // Check platform collisions for proper standing
        this.checkPlatformPhysics();
    }

    checkPlatformPhysics() {
        const stickmanBounds = this.getStickmanBounds();

        this.course.forEach(obstacle => {
            if (obstacle.type === 'platform' || obstacle.type === 'moving-platform') {
                // Platform is now rendered inside the top of the grid box
                const platformTop = obstacle.y; // Platform starts at grid box top
                const platformBottom = obstacle.y + 10; // Platform is 10 pixels thick
                const platformLeft = obstacle.x;
                const platformRight = obstacle.x + this.gridSize;

                // Check if player is above and falling onto platform
                if (stickmanBounds.right > platformLeft &&
                    stickmanBounds.left < platformRight &&
                    stickmanBounds.bottom > platformTop &&
                    stickmanBounds.bottom < platformBottom + 5 &&
                    this.player.velocityY >= 0) {

                    // Land on platform
                    this.player.y = platformTop - (this.player.ducking ? 5 : 15); // Adjust for stickman feet position
                    this.player.velocityY = 0;
                    this.player.onPlatform = true;
                    this.player.onGround = true;
                    this.player.jumping = false;

                    // Move with moving platform only if player is not actively moving
                    if (obstacle.type === 'moving-platform' && this.player.velocityX === 0) {
                        this.player.x += obstacle.direction * 2;
                    }
                }
            }
        });
    }

    updateObstacles() {
        this.course.forEach(obstacle => {
            if (obstacle.type === 'moving-platform') {
                // Move platform back and forth
                obstacle.x += obstacle.direction * 2;
                if (obstacle.x > obstacle.startX + obstacle.range || obstacle.x < obstacle.startX) {
                    obstacle.direction *= -1;
                }
            } else if (obstacle.type === 'laser') {
                // Toggle laser on/off
                obstacle.timer++;
                if (obstacle.timer >= 60) { // 1 second at 60fps
                    obstacle.active = !obstacle.active;
                    obstacle.timer = 0;
                }
            } else if (obstacle.type === 'enemy' && obstacle.health > 0) {
                // Enemy AI and movement
                const distanceToPlayer = Math.abs(this.player.x - obstacle.x);

                if (distanceToPlayer < this.gridSize * 4) {
                    // Move towards player if close enough
                    if (this.player.x > obstacle.x) {
                        obstacle.x += obstacle.speed;
                        obstacle.direction = 1;
                    } else {
                        obstacle.x -= obstacle.speed;
                        obstacle.direction = -1;
                    }
                } else {
                    // Patrol behavior when player is far
                    obstacle.x += obstacle.direction * obstacle.speed;
                    if (obstacle.x > obstacle.startX + obstacle.range || obstacle.x < obstacle.startX) {
                        obstacle.direction *= -1;
                    }
                }

                // Update attack cooldown
                if (obstacle.attackCooldown > 0) {
                    obstacle.attackCooldown--;
                }
            }
        });
    }

    updateProjectiles() {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            if (!projectile.active) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Move projectile
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;

            // Check if projectile has traveled maximum distance
            const distanceTraveled = Math.abs(projectile.x - projectile.startX);
            if (distanceTraveled >= projectile.maxDistance) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check projectile collision with enemies
            this.course.forEach(obstacle => {
                if (obstacle.type === 'enemy' && obstacle.health > 0) {
                    const obsLeft = obstacle.x;
                    const obsRight = obstacle.x + this.gridSize;
                    const obsTop = obstacle.y;
                    const obsBottom = obstacle.y + this.gridSize;

                    // Check if projectile hits enemy
                    if (projectile.x > obsLeft && projectile.x < obsRight &&
                        projectile.y > obsTop && projectile.y < obsBottom) {

                        // Damage enemy
                        obstacle.health -= 20;
                        if (obstacle.health <= 0) {
                            obstacle.health = 0;
                        }

                        // Remove projectile
                        projectile.active = false;
                    }
                }
            });

            // Remove projectiles that go off screen
            if (projectile.x > this.canvas.width * 4 || projectile.x < -100) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        const stickmanBounds = this.getStickmanBounds();

        this.course.forEach((obstacle, index) => {
            const obsLeft = obstacle.x;
            const obsRight = obstacle.x + this.gridSize;
            const obsTop = obstacle.y;
            const obsBottom = obstacle.y + this.gridSize;

            // Check if any part of stickman touches obstacle
            if (stickmanBounds.right > obsLeft &&
                stickmanBounds.left < obsRight &&
                stickmanBounds.bottom > obsTop &&
                stickmanBounds.top < obsBottom) {

                if (obstacle.type === 'spring') {
                    // Spring launches player - no damage
                    this.player.velocityY = -20;
                    this.player.onGround = false;

                } else if (obstacle.type === 'platform' || obstacle.type === 'moving-platform') {
                    // Platform physics handled separately in checkPlatformPhysics()
                    // No damage from platforms

                } else if (obstacle.type === 'teleporter') {
                    // Teleporter - no damage, just transport
                    const nextTeleporter = this.course.find((obs, i) =>
                        obs.type === 'teleporter' && i !== index && i > index
                    );
                    if (nextTeleporter) {
                        this.player.x = nextTeleporter.x + this.gridSize;
                        this.player.y = nextTeleporter.y;
                    }

                } else if (obstacle.type === 'barrier') {
                    // Barrier damage - can be avoided by jumping
                    if (!this.player.jumping) {
                        this.takeDamage(15);
                    }

                } else if (obstacle.type === 'sign') {
                    // Sign damage - can be avoided by ducking
                    if (!this.player.ducking) {
                        this.takeDamage(10);
                    }

                } else if (obstacle.type === 'cone') {
                    // Cone damage - always deals damage unless avoided
                    this.takeDamage(12);

                } else if (obstacle.type === 'spikes') {
                    // Spikes - high damage, unavoidable
                    this.takeDamage(25);

                } else if (obstacle.type === 'laser' && obstacle.active) {
                    // Active laser - medium damage
                    this.takeDamage(20);

                } else if (obstacle.type === 'enemy' && obstacle.health > 0) {
                    // Enemy collision
                    if (this.player.weapon === 'sword' && this.player.swinging) {
                        // Player has sword and is swinging - damage enemy
                        obstacle.health -= 15;
                        this.player.swinging = false; // Stop swing after hitting
                        this.player.swingTimer = 0;

                        if (obstacle.health <= 0) {
                            obstacle.health = 0;
                        }
                    } else {
                        // Player has no weapon or not swinging - take damage from enemy
                        if (obstacle.attackCooldown <= 0) {
                            this.takeDamage(15);
                            obstacle.attackCooldown = 60; // 1 second cooldown
                        }
                    }
                }
            }
        });
    }

    showGameOver(message) {
        // Simple message display
        if (message.includes('Complete')) {
            document.getElementById('gameOverTitle').textContent = 'YOU WIN!';
        } else if (message.includes('Health')) {
            document.getElementById('gameOverTitle').textContent = 'YOU LOSE!';
        } else {
            document.getElementById('gameOverTitle').textContent = message.toUpperCase();
        }

        document.getElementById('gameOverScreen').classList.remove('hidden');
        setTimeout(() => {
            this.showMenu();
        }, 2000);
    }

    update() {
        if (this.gameMode === 'play') {
            this.updatePlayMode();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameMode === 'build') {
            this.renderBuildMode();
        } else if (this.gameMode === 'play') {
            this.renderPlayMode();
        }
    }

    renderBuildMode() {
        // Calculate grid offset so bottom boxes align with green line
        const groundLineY = this.canvas.height - 60;
        const gridOffsetY = groundLineY % this.gridSize;

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines - aligned with green line
        for (let y = gridOffsetY; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw ground line
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 60);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 60);
        this.ctx.stroke();

        // Draw restricted area below green line
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);

        // Add text to show restricted area
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NO BUILDING ZONE', this.canvas.width / 2, this.canvas.height - 30);

        // Draw obstacles
        this.course.forEach(obstacle => {
            this.renderObstacle(obstacle, obstacle.x, obstacle.y);
        });

        // Draw start and finish blocks
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(20, this.canvas.height - 100, 40, 40);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.canvas.width - 60, this.canvas.height - 100, 40, 40);

        // Labels above blocks
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('START', 40, this.canvas.height - 110);
        this.ctx.fillText('FINISH', this.canvas.width - 40, this.canvas.height - 110);

        // Labels on blocks
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText('S', 40, this.canvas.height - 75);
        this.ctx.fillText('F', this.canvas.width - 40, this.canvas.height - 75);
    }

    renderPlayMode() {
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        // Draw extended ground
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(-100, this.canvas.height - 60, this.canvas.width * 4, 60);

        // Draw course boundaries
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 60);
        this.ctx.lineTo(this.canvas.width * 3, this.canvas.height - 60);
        this.ctx.stroke();

        // Draw obstacles
        this.course.forEach(obstacle => {
            this.renderObstacle(obstacle, obstacle.x, obstacle.y);
        });

        // Draw start and finish markers
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(20, this.canvas.height - 100, 40, 40);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.canvas.width * 2.5, this.canvas.height - 100, 60, 40);

        // Labels for start and finish
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('START', 40, this.canvas.height - 110);
        this.ctx.fillText('FINISH', this.canvas.width * 2.5 + 30, this.canvas.height - 110);

        // Letters on blocks
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('S', 40, this.canvas.height - 75);
        this.ctx.fillText('F', this.canvas.width * 2.5 + 30, this.canvas.height - 75);

        // Draw player (Labubu)
        this.renderPlayer();

        // Draw projectiles
        this.renderProjectiles();

        this.ctx.restore();
    }

    renderObstacle(obstacle, x, y) {
        this.ctx.save();

        switch(obstacle.type) {
            case 'barrier':
                this.ctx.fillStyle = '#ff6600';
                this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x + 5, y + 5, this.gridSize - 10, 8);
                this.ctx.fillRect(x + 5, y + 16, this.gridSize - 10, 8);
                this.ctx.fillRect(x + 5, y + 27, this.gridSize - 10, 8);
                break;

            case 'sign':
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x + this.gridSize/2 - 2, y, 4, this.gridSize);
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(x + 5, y - 15, this.gridSize - 10, 20);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '8px Arial';
                this.ctx.textAlign = 'center';

                // Display custom message or default
                const message = obstacle.message || 'DUCK';
                this.ctx.fillText(message, x + this.gridSize/2, y - 8);
                break;

            case 'cone':
                this.ctx.fillStyle = '#ff3300';
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.gridSize/2, y);
                this.ctx.lineTo(x + 5, y + this.gridSize);
                this.ctx.lineTo(x + this.gridSize - 5, y + this.gridSize);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 3; i++) {
                    const stripY = y + (i + 1) * this.gridSize/4;
                    this.ctx.fillRect(x + 8, stripY - 2, this.gridSize - 16, 4);
                }
                break;

            case 'platform':
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x, y, this.gridSize, 10);
                this.ctx.fillStyle = '#A0522D';
                this.ctx.fillRect(x, y, this.gridSize, 2);
                break;

            case 'spring':
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(x + 10, y + 20, this.gridSize - 20, this.gridSize - 20);

                // Spring coils
                this.ctx.strokeStyle = '#228B22';
                this.ctx.lineWidth = 3;
                for (let i = 0; i < 5; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.gridSize/2, y + 25 + i * 3, 8, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                break;

            case 'spikes':
                this.ctx.fillStyle = '#8B0000';
                this.ctx.fillRect(x, y + this.gridSize - 10, this.gridSize, 10);

                // Spike triangles
                this.ctx.fillStyle = '#FF0000';
                for (let i = 0; i < 4; i++) {
                    const spikeX = x + i * (this.gridSize / 4) + 5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(spikeX, y + this.gridSize - 10);
                    this.ctx.lineTo(spikeX + 5, y + this.gridSize - 20);
                    this.ctx.lineTo(spikeX + 10, y + this.gridSize - 10);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                break;

            case 'moving-platform':
                this.ctx.fillStyle = '#4B0082';
                this.ctx.fillRect(x, y, this.gridSize, 8);
                this.ctx.fillStyle = '#9370DB';
                this.ctx.fillRect(x, y, this.gridSize, 2);

                // Moving indicator
                this.ctx.fillStyle = '#FFFFFF';
                const arrowOffset = Math.sin(this.animationFrame * 0.1) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.gridSize/2 - 5 + arrowOffset, y + 15);
                this.ctx.lineTo(x + this.gridSize/2 + arrowOffset, y + 10);
                this.ctx.lineTo(x + this.gridSize/2 + 5 + arrowOffset, y + 15);
                this.ctx.stroke();
                break;

            case 'laser':
                this.ctx.fillStyle = '#FF0080';
                this.ctx.fillRect(x + 5, y, 5, this.gridSize);
                this.ctx.fillRect(x + this.gridSize - 10, y, 5, this.gridSize);

                if (obstacle.active) {
                    // Active laser beam
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.fillRect(x + 10, y, this.gridSize - 20, this.gridSize);
                    this.ctx.globalAlpha = 1;

                    // Laser particles
                    this.ctx.fillStyle = '#FFFFFF';
                    for (let i = 0; i < 3; i++) {
                        this.ctx.fillRect(
                            x + 12 + Math.random() * (this.gridSize - 24),
                            y + Math.random() * this.gridSize,
                            2, 2
                        );
                    }
                }
                break;

            case 'teleporter':
                this.ctx.fillStyle = '#00CED1';
                this.ctx.fillRect(x + 5, y + 5, this.gridSize - 10, this.gridSize - 10);

                // Teleporter animation
                this.ctx.strokeStyle = '#40E0D0';
                this.ctx.lineWidth = 3;
                const radius = 15 + Math.sin(this.animationFrame * 0.2) * 3;
                this.ctx.beginPath();
                this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, radius, 0, Math.PI * 2);
                this.ctx.stroke();

                // Inner glow
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = 0.5;
                this.ctx.beginPath();
                this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                break;

            case 'enemy':
                if (obstacle.health > 0) {
                    this.renderEnemy(obstacle, x, y);
                }
                // Dead enemies show nothing
                break;

            case 'ice-platform':
                this.ctx.fillStyle = '#B0E0E6';
                this.ctx.fillRect(x, y, this.gridSize, 10);
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.fillRect(x, y, this.gridSize, 2);
                // Ice crystals
                this.ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(x + i * 12 + 5, y + 3, 2, 2);
                }
                break;

            case 'conveyor':
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(x, y + this.gridSize - 15, this.gridSize, 15);
                // Conveyor arrows
                this.ctx.fillStyle = '#FFFF00';
                for (let i = 0; i < 3; i++) {
                    const arrowX = x + i * 12 + 8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(arrowX, y + this.gridSize - 10);
                    this.ctx.lineTo(arrowX + 5, y + this.gridSize - 7);
                    this.ctx.lineTo(arrowX, y + this.gridSize - 4);
                    this.ctx.fill();
                }
                break;

            case 'fire':
                this.ctx.fillStyle = '#FF4500';
                // Fire base
                this.ctx.fillRect(x + 10, y + this.gridSize - 20, this.gridSize - 20, 20);
                // Fire flames
                this.ctx.fillStyle = '#FF6347';
                for (let i = 0; i < 3; i++) {
                    const flameX = x + 12 + i * 6;
                    const flameHeight = 15 + Math.sin(this.animationFrame * 0.3 + i) * 5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(flameX, y + this.gridSize - 20);
                    this.ctx.lineTo(flameX + 3, y + this.gridSize - 20 - flameHeight);
                    this.ctx.lineTo(flameX + 6, y + this.gridSize - 20);
                    this.ctx.fill();
                }
                break;

            case 'saw':
                this.ctx.fillStyle = '#C0C0C0';
                const centerX = x + this.gridSize / 2;
                const centerY = y + this.gridSize / 2;

                // Saw blade
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                this.ctx.fill();

                // Saw teeth
                this.ctx.fillStyle = '#708090';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + (obstacle.rotation || 0);
                    const toothX = centerX + Math.cos(angle) * 12;
                    const toothY = centerY + Math.sin(angle) * 12;
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, centerY);
                    this.ctx.lineTo(toothX, toothY);
                    this.ctx.lineTo(toothX + Math.cos(angle + 0.3) * 5, toothY + Math.sin(angle + 0.3) * 5);
                    this.ctx.fill();
                }
                break;

            case 'key':
                if (!obstacle.collected) {
                    this.ctx.fillStyle = '#FFD700';
                    // Key head
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2 - 5, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Key shaft
                    this.ctx.fillRect(x + this.gridSize/2 - 2, y + this.gridSize/2 + 3, 4, 15);
                    // Key teeth
                    this.ctx.fillRect(x + this.gridSize/2 + 2, y + this.gridSize/2 + 10, 4, 3);
                    this.ctx.fillRect(x + this.gridSize/2 + 2, y + this.gridSize/2 + 15, 6, 3);
                }
                break;

            case 'door':
                if (obstacle.locked) {
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + 5, y, this.gridSize - 10, this.gridSize);
                    // Door handle
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.gridSize - 12, y + this.gridSize/2, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Lock symbol
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(x + this.gridSize/2 - 3, y + this.gridSize/2 - 3, 6, 6);
                }
                break;
        }

        this.ctx.restore();
    }

    renderEnemy(obstacle, x, y) {
        const enemyX = x + this.gridSize/2;
        const enemyY = y + this.gridSize - 15;
        const headRadius = 6;
        const bodyHeight = 20;

        // Health-based color
        const healthPercent = obstacle.health / obstacle.maxHealth;
        let color = '#8B0000';
        if (healthPercent < 0.5) {
            color = '#DC143C';
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        // Head
        this.ctx.beginPath();
        this.ctx.arc(enemyX, enemyY - bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Body
        this.ctx.beginPath();
        this.ctx.moveTo(enemyX, enemyY - bodyHeight - headRadius);
        this.ctx.lineTo(enemyX, enemyY - 5);
        this.ctx.stroke();

        // Arms (more aggressive pose)
        this.ctx.beginPath();
        this.ctx.moveTo(enemyX, enemyY - bodyHeight + 3);
        this.ctx.lineTo(enemyX - 8, enemyY - bodyHeight + 10);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(enemyX, enemyY - bodyHeight + 3);
        this.ctx.lineTo(enemyX + 8, enemyY - bodyHeight + 10);
        this.ctx.stroke();

        // Legs
        this.ctx.beginPath();
        this.ctx.moveTo(enemyX, enemyY - 5);
        this.ctx.lineTo(enemyX - 6, enemyY + 10);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(enemyX, enemyY - 5);
        this.ctx.lineTo(enemyX + 6, enemyY + 10);
        this.ctx.stroke();

        // Eyes (angry)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(enemyX - 2, enemyY - bodyHeight - headRadius - 1, 1, 0, Math.PI * 2);
        this.ctx.arc(enemyX + 2, enemyY - bodyHeight - headRadius - 1, 1, 0, Math.PI * 2);
        this.ctx.fill();

        // Health bar above enemy
        if (obstacle.health < obstacle.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const barX = enemyX - barWidth/2;
            const barY = enemyY - bodyHeight - headRadius - 15;

            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }

    renderPlayer() {
        const playerX = this.player.x;
        const playerY = this.player.y;
        const headRadius = 8;
        const bodyHeight = this.player.ducking ? 15 : 25;

        // Damage flash effect
        if (this.player.damageFlash > 0 && this.player.damageFlash % 6 < 3) {
            this.ctx.strokeStyle = '#ff0000';
        } else {
            this.ctx.strokeStyle = '#000000';
        }
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        // Head
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY - bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Body
        this.ctx.beginPath();
        this.ctx.moveTo(playerX, playerY - bodyHeight - headRadius);
        this.ctx.lineTo(playerX, playerY - 5);
        this.ctx.stroke();

        if (!this.player.ducking) {
            // Arms - only animate when moving
            const isMoving = this.player.velocityX !== 0;
            const armSwing = isMoving ? Math.sin(this.animationFrame * 0.3) * 10 : 0;

            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - bodyHeight + 5);
            this.ctx.lineTo(playerX - 12 + armSwing, playerY - bodyHeight + 15);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - bodyHeight + 5);
            this.ctx.lineTo(playerX + 12 - armSwing, playerY - bodyHeight + 15);
            this.ctx.stroke();

            // Legs - only animate when moving
            const legSwing = isMoving ? Math.sin(this.animationFrame * 0.4) * 8 : 0;
            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - 5);
            this.ctx.lineTo(playerX - 8 + legSwing, playerY + 15);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - 5);
            this.ctx.lineTo(playerX + 8 - legSwing, playerY + 15);
            this.ctx.stroke();
        } else {
            // Ducking arms
            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - bodyHeight + 5);
            this.ctx.lineTo(playerX - 15, playerY - 5);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - bodyHeight + 5);
            this.ctx.lineTo(playerX + 15, playerY - 5);
            this.ctx.stroke();

            // Ducking legs
            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - 5);
            this.ctx.lineTo(playerX - 10, playerY + 5);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(playerX, playerY - 5);
            this.ctx.lineTo(playerX + 10, playerY + 5);
            this.ctx.stroke();
        }

        // Simple face
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(playerX - 3, playerY - bodyHeight - headRadius - 2, 1, 0, Math.PI * 2);
        this.ctx.arc(playerX + 3, playerY - bodyHeight - headRadius - 2, 1, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw weapon if equipped
        if (this.player.weapon === 'sword') {
            this.ctx.strokeStyle = '#C0C0C0';
            this.ctx.lineWidth = 3;

            // Calculate swing animation
            let swordAngle = 0;
            if (this.player.swinging) {
                const swingProgress = (this.player.swingDuration - this.player.swingTimer) / this.player.swingDuration;
                swordAngle = Math.sin(swingProgress * Math.PI) * 45; // 45 degree swing arc
            }

            // Sword positions based on swing
            const baseX = playerX + 15;
            const baseY = playerY - bodyHeight + 10;
            const tipOffsetX = 10 + Math.cos((swordAngle - 30) * Math.PI / 180) * 15;
            const tipOffsetY = -15 + Math.sin((swordAngle - 30) * Math.PI / 180) * 15;

            // Sword blade
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.lineTo(baseX + tipOffsetX, baseY + tipOffsetY);
            this.ctx.stroke();

            // Sword hilt
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            const hiltX = baseX - 2;
            const hiltY = baseY + 2;
            this.ctx.beginPath();
            this.ctx.moveTo(hiltX, hiltY);
            this.ctx.lineTo(hiltX + 4, hiltY - 4);
            this.ctx.stroke();

            // Add swing trail effect
            if (this.player.swinging) {
                this.ctx.strokeStyle = 'rgba(192, 192, 192, 0.3)';
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.moveTo(baseX, baseY);
                this.ctx.lineTo(baseX + tipOffsetX, baseY + tipOffsetY);
                this.ctx.stroke();
            }
        } else if (this.player.weapon === 'gun') {
            this.ctx.fillStyle = '#2F2F2F';
            this.ctx.lineWidth = 2;

            // Gun barrel
            this.ctx.fillRect(playerX + 12, playerY - bodyHeight + 8, 15, 4);

            // Gun handle
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(playerX + 10, playerY - bodyHeight + 10, 6, 8);

            // Gun sight
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillRect(playerX + 25, playerY - bodyHeight + 9, 2, 2);
        }
    }

    renderProjectiles() {
        this.projectiles.forEach(projectile => {
            if (projectile.active) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.fillRect(projectile.x - 2, projectile.y - 1, 4, 2);

                // Add trail effect
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                this.ctx.fillRect(projectile.x - 6, projectile.y - 1, 4, 2);
            }
        });
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new ObstacleCourseBuilder();