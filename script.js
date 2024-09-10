const gameArea = document.getElementById('game-area');
        const player = document.getElementById('player');
        const scoreDisplay = document.getElementById('score');
        const timeDisplay = document.getElementById('time');
        const gameOverDisplay = document.getElementById('game-over');
        const finalTimeDisplay = document.getElementById('final-time');
        const introScreen = document.getElementById('intro-screen');
        const startButton = document.getElementById('start-button');
        const splashSound = document.getElementById('splash-sound');
        const playAgainButton = document.getElementById('play-again-button');
        const gameOverSound = document.getElementById('game-over-sound');

        let score = 30;
        let gameActive = false;
        let difficultyLevel = 1;
        let startTime;
        let timeInterval;
        let raindropCount = 0;

        const MAX_PIGEONS = 10; // Set the maximum number of pigeons
        const MAX_RAINDROPS = 15;
        const MAX_POOPS = 25;

        const objectPool = {
            raindrops: [],
            poops: []
        };

        function getObjectFromPool(type) {
            if (objectPool[type].length > 0) {
                return objectPool[type].pop();
            }
            const element = document.createElement('div');
            element.className = type === 'raindrops' ? 'raindrop' : 'poop';
            return element;
        }

        function returnObjectToPool(element, type) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            element.style.display = 'none';
            element.style.top = '-10px';
            element.style.left = '0';
            element.classList.remove('poisonous', 'golden-poop');
            objectPool[type].push(element);
        }

        function updatePlayerPosition(e) {
            const x = e.clientX || (e.touches && e.touches[0].clientX) || window.innerWidth / 2;
            player.style.left = `${x}px`;
            adjustPlayerPosition();
        }

        function adjustPlayerPosition() {
            const viewportHeight = window.innerHeight;
            const playerHeight = player.offsetHeight;
            const bottomOffset = 20;
            
            player.style.bottom = `${bottomOffset}px`;
            player.style.top = 'auto';
            player.style.transform = 'translateX(-50%)';
        }

        window.addEventListener('resize', adjustPlayerPosition);
        window.addEventListener('orientationchange', adjustPlayerPosition);

        function createPigeon() {
            if (!gameActive) return;

            const currentPigeons = document.querySelectorAll('.pigeon').length;
            if (currentPigeons >= MAX_PIGEONS) return;

            const pigeon = document.createElement('div');
            pigeon.className = 'pigeon';
            pigeon.style.left = '-60px';
            pigeon.style.top = `${Math.random() * (window.innerHeight - 40)}px`;
            gameArea.appendChild(pigeon);

            const speed = 2 + Math.random() * 2 + (difficultyLevel - 1) * 0.5;

            function movePigeon() {
                if (!gameActive || !pigeon.parentNode) {
                    return;
                }

                const currentLeft = parseFloat(pigeon.style.left);
                pigeon.style.left = `${currentLeft + speed}px`;

                if (currentLeft > window.innerWidth) {
                    if (pigeon.parentNode) {
                        gameArea.removeChild(pigeon);
                    }
                } else {
                    requestAnimationFrame(movePigeon);
                }

                if (Math.random() < 0.03 * difficultyLevel) createPoop(currentLeft, parseFloat(pigeon.style.top));
                
                if (Math.random() < 0.001) {
                    pigeonFall(pigeon);
                }
            }

            requestAnimationFrame(movePigeon);
        }

        function pigeonFall(pigeon) {
            pigeon.classList.add('falling');
            const fallSpeed = 5;
            
            function fall() {
                if (!pigeon.parentNode) {
                    return;
                }

                const currentTop = parseFloat(pigeon.style.top);
                pigeon.style.top = `${currentTop + fallSpeed}px`;
                
                if (currentTop < window.innerHeight) {
                    requestAnimationFrame(fall);
                } else {
                    if (pigeon.parentNode) {
                        gameArea.removeChild(pigeon);
                    }
                }
            }
            
            requestAnimationFrame(fall);
        }

        function createPoop(x, y) {
            if (document.querySelectorAll('.poop').length >= MAX_POOPS) return;

            const poop = getObjectFromPool('poops');
            poop.style.display = 'block';
            const isGolden = Math.random() < 0.002;
            if (isGolden) {
                poop.classList.add('golden-poop');
            }
            poop.style.left = `${x + 25}px`;
            poop.style.top = `${y + 35}px`;
            gameArea.appendChild(poop);

            const baseSpeed = 3;
            const speed = baseSpeed + (difficultyLevel - 1) * 0.5;

            function movePoop() {
                if (!gameActive) {
                    returnObjectToPool(poop, 'poops');
                    return;
                }

                const currentTop = parseFloat(poop.style.top);
                const newTop = currentTop + speed;
                poop.style.top = `${newTop}px`;

                if (newTop > window.innerHeight) {
                    returnObjectToPool(poop, 'poops');
                } else {
                    checkCollision(poop, false, isGolden);
                    requestAnimationFrame(movePoop);
                }
            }

            requestAnimationFrame(movePoop);
        }

        function createRaindrop() {
            if (!gameActive || document.querySelectorAll('.raindrop').length >= MAX_RAINDROPS) return;

            raindropCount++;
            const raindrop = getObjectFromPool('raindrops');
            raindrop.style.display = 'block';
            const isPoisonous = raindropCount % 25 === 0;
            if (isPoisonous) {
                raindrop.classList.add('poisonous');
            }
            raindrop.style.left = `${Math.random() * window.innerWidth}px`;
            raindrop.style.top = '-10px';
            gameArea.appendChild(raindrop);

            const speed = 2 + (difficultyLevel - 1) * 0.3;
            const duration = 5 - (difficultyLevel * 0.5);
            raindrop.style.animationDuration = `${duration}s`;

            function moveRaindrop() {
                if (!gameActive) {
                    returnObjectToPool(raindrop, 'raindrops');
                    return;
                }

                const currentTop = parseFloat(raindrop.style.top);
                raindrop.style.top = `${currentTop + speed}px`;

                if (currentTop > window.innerHeight) {
                    returnObjectToPool(raindrop, 'raindrops');
                } else {
                    checkCollision(raindrop, true, false, isPoisonous);
                    requestAnimationFrame(moveRaindrop);
                }
            }

            requestAnimationFrame(moveRaindrop);
        }

        function checkCollision(element, isRaindrop, isGolden, isPoisonous) {
            const playerRect = player.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            if (playerRect.left < elementRect.right &&
                playerRect.right > elementRect.left &&
                playerRect.top < elementRect.bottom &&
                playerRect.bottom > elementRect.top) {
                returnObjectToPool(element, isRaindrop ? 'raindrops' : 'poops');
                updateScore(isRaindrop, isGolden, isPoisonous);
                if (!isRaindrop) {
                    createSplashEffect(elementRect.left, elementRect.top);
                    playSplashSound();
                }
            }
        }

        function playSplashSound() {
            splashSound.currentTime = 0;
            splashSound.play();
        }

        function createSplashEffect(x, y) {
            const particleCount = 30;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'splash-particle';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 15;
                const distance = 50 + Math.random() * 100;
                
                const endX = x + Math.cos(angle) * distance;
                const endY = y + Math.sin(angle) * distance;
                
                gameArea.appendChild(particle);
                
                requestAnimationFrame(() => {
                    particle.style.transform = `translate(${endX - x}px, ${endY - y}px) scale(0)`;
                    particle.style.opacity = '0';
                });
                
                setTimeout(() => {
                    gameArea.removeChild(particle);
                }, 500);
            }
        }

        function updateScore(isRaindrop, isGolden, isPoisonous) {
            if (isRaindrop) {
                if (isPoisonous) {
                    score -= 5;
                } else {
                    score++;
                }
            } else if (isGolden) {
                score += 5;
            } else {
                score--;
            }
            scoreDisplay.textContent = `Score: ${score}`;
            if (score <= 0) endGame();
        }

        function endGame() {
            gameActive = false;
            const finalTime = Math.floor((Date.now() - startTime) / 1000);
            
            gameOverDisplay.style.display = 'block';
            finalTimeDisplay.textContent = `Time Survived: ${finalTime}s`;
            
            // Play the game over sound with a user interaction
            playGameOverSound();
            
            clearInterval(timeInterval);
            clearInterval(difficultyInterval);
            player.style.display = 'none';
        }

        function playGameOverSound() {
            // Create a touch event listener for iOS
            const playSound = function() {
                gameOverSound.play()
                    .then(() => {
                        // Sound played successfully
                        document.body.removeEventListener('touchstart', playSound);
                    })
                    .catch(error => {
                        console.error('Error playing game over sound:', error);
                    });
            };

            // Add the event listener
            document.body.addEventListener('touchstart', playSound);

            // Also try to play the sound immediately for non-iOS devices
            gameOverSound.play().catch(error => {
                console.log('Autoplay failed, waiting for user interaction');
            });
        }

        function updateDifficulty() {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            difficultyLevel = Math.floor(elapsedTime / 20) + 1;
            
            clearInterval(pigeonInterval);
            clearInterval(raindropInterval);
            
            pigeonInterval = setInterval(() => {
                if (document.querySelectorAll('.pigeon').length < MAX_PIGEONS) {
                    createPigeon();
                }
            }, Math.max(1000 - difficultyLevel * 50, 200));
            raindropInterval = setInterval(createRaindrop, Math.max(2000 - difficultyLevel * 100, 500));
        }

        let pigeonInterval = setInterval(() => {
            if (document.querySelectorAll('.pigeon').length < MAX_PIGEONS) {
                createPigeon();
            }
        }, 1000);
        let raindropInterval = setInterval(createRaindrop, 2000);
        let difficultyInterval = setInterval(updateDifficulty, 1000);

        for (let i = 0; i < 5; i++) {
            createPigeon();
        }
        for (let i = 0; i < 10; i++) {
            createRaindrop();
        }

        startButton.addEventListener('click', startGame);

        function startGame() {
            introScreen.style.display = 'none';
            gameOverDisplay.style.display = 'none';
            gameActive = true;
            score = 30;
            scoreDisplay.textContent = `Score: ${score}`;
            difficultyLevel = 1;
            raindropCount = 0;
            objectPool.raindrops = [];
            objectPool.poops = [];

            // Remove existing pigeons and raindrops
            document.querySelectorAll('.pigeon, .poop, .raindrop').forEach(el => el.remove());

            pigeonInterval = setInterval(() => {
                if (document.querySelectorAll('.pigeon').length < MAX_PIGEONS) {
                    createPigeon();
                }
            }, 1000);
            raindropInterval = setInterval(createRaindrop, 2000);
            difficultyInterval = setInterval(updateDifficulty, 1000);

            for (let i = 0; i < Math.min(5, MAX_PIGEONS); i++) {
                createPigeon();
            }
            for (let i = 0; i < 10; i++) {
                createRaindrop();
            }

            document.addEventListener('mousemove', updatePlayerPosition);
            document.addEventListener('touchmove', updatePlayerPosition);

            startTime = Date.now();
            timeDisplay.textContent = `Time: 0s`;
            timeInterval = setInterval(updateTime, 100);

            adjustPlayerPosition();
            requestAnimationFrame(gameLoop);
            player.style.display = 'block';
        }

        function updateTime() {
            if (gameActive) {
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                timeDisplay.textContent = `Time: ${elapsedTime}s`;
            }
        }

        function createPoopDrop() {
            const introTitle = document.getElementById('intro-title');
            const titleRect = introTitle.getBoundingClientRect();

            const drop = document.createElement('div');
            drop.className = 'poop-drop';
            drop.style.left = `${Math.random() * titleRect.width}px`;
            drop.style.top = `-15px`;
            introTitle.appendChild(drop);

            const fallSpeed = 2 + Math.random() * 2;

            function fallAnimation() {
                const currentTop = parseFloat(drop.style.top);
                drop.style.top = `${currentTop + fallSpeed}px`;

                if (currentTop < titleRect.height - 15) {
                    requestAnimationFrame(fallAnimation);
                } else {
                    createPoopSplash(parseFloat(drop.style.left), currentTop);
                    introTitle.removeChild(drop);
                }
            }

            requestAnimationFrame(fallAnimation);
        }

        function createPoopSplash(x, y) {
            const introTitle = document.getElementById('intro-title');
            const splashCount = 5;
            for (let i = 0; i < splashCount; i++) {
                const splash = document.createElement('div');
                splash.className = 'poop-splash';
                splash.style.left = `${x}px`;
                splash.style.top = `${y}px`;
                splash.style.setProperty('--tx', `${Math.random() * 30 - 15}px`);
                splash.style.setProperty('--ty', `${Math.random() * 30 - 15}px`);
                introTitle.appendChild(splash);

                splash.addEventListener('animationend', () => {
                    introTitle.removeChild(splash);
                });
            }
        }

        setInterval(createPoopDrop, 200);

        function addIntroductionPigeon() {
            const introContainer = document.getElementById('intro-container');
            const pigeon = document.createElement('div');
            pigeon.id = 'intro-pigeon';
            introContainer.appendChild(pigeon);
            console.log('Pigeon added to the intro screen');
        }

        addIntroductionPigeon();

        playAgainButton.addEventListener('click', () => {
            gameOverDisplay.style.display = 'none';
            startGame();
        });

        let lastTime = 0;
        const FPS = 60;
        const frameTime = 1000 / FPS;

        function gameLoop(currentTime) {
            if (!gameActive) return;

            requestAnimationFrame(gameLoop);

            const deltaTime = currentTime - lastTime;
            if (deltaTime < frameTime) return;

            lastTime = currentTime - (deltaTime % frameTime);

            // Move all game objects
            moveAllRaindrops();
            moveAllPoops();
            moveAllPigeons();
            adjustPlayerPosition();
        }

        function moveAllRaindrops() {
            document.querySelectorAll('.raindrop').forEach(raindrop => {
                const currentTop = parseFloat(raindrop.style.top || '0');
                raindrop.style.top = `${currentTop + 2}px`;
                if (currentTop > window.innerHeight) {
                    returnObjectToPool(raindrop, 'raindrops');
                } else {
                    checkCollision(raindrop, true, false, raindrop.classList.contains('poisonous'));
                }
            });
        }

        function moveAllPoops() {
            document.querySelectorAll('.poop').forEach(poop => {
                const currentTop = parseFloat(poop.style.top || '0');
                poop.style.top = `${currentTop + 3}px`;
                if (currentTop > window.innerHeight) {
                    returnObjectToPool(poop, 'poops');
                } else {
                    checkCollision(poop, false, poop.classList.contains('golden-poop'), false);
                }
            });
        }

        function moveAllPigeons() {
            document.querySelectorAll('.pigeon').forEach(pigeon => {
                const currentLeft = parseFloat(pigeon.style.left);
                pigeon.style.left = `${currentLeft + 2}px`;
                if (currentLeft > window.innerWidth) {
                    gameArea.removeChild(pigeon);
                } else {
                    if (Math.random() < 0.03 * difficultyLevel) createPoop(currentLeft, parseFloat(pigeon.style.top));
                    if (Math.random() < 0.001) {
                        pigeonFall(pigeon);
                    }
                }
            });
        }

        // Start the game loop
        requestAnimationFrame(gameLoop);