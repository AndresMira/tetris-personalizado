document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado');
    
    // Configuración del canvas principal
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    
    // Configuración del canvas para la siguiente pieza
    const nextPieceCanvas = document.getElementById('next-piece');
    const nextPieceCtx = nextPieceCanvas.getContext('2d');
    
    // Tamaño de cada bloque del tetris (valor inicial, se ajustará dinámicamente)
    let BLOCK_SIZE = 30;
    
    // Dimensiones del tablero (en bloques)
    const ROWS = 20;
    const COLS = 10;
    
    // Colores para las piezas
    const COLORS = [
        null,
        '#FF0D72', // I - Rojo
        '#0DC2FF', // J - Azul claro
        '#0DFF72', // L - Verde claro
        '#F538FF', // O - Rosa
        '#FF8E0D', // S - Naranja
        '#FFE138', // T - Amarillo
        '#3877FF'  // Z - Azul oscuro
    ];
    
    // Formas de las piezas
    const SHAPES = [
        // Cada pieza está representada por una matriz 
        // donde 0 significa espacio vacío y 1 significa bloque
        [],
        [ // I
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [ // J
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [ // L
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [ // O
            [1, 1],
            [1, 1]
        ],
        [ // S
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        [ // T
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [ // Z
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    ];
    
    // Variables del juego
    let board = [];
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameOver = false;
    let isPaused = false;
    let dropCounter = 0;
    let dropInterval = 1000; // Tiempo en ms entre caídas automáticas
    let lastTime = 0;
    let animationId = null;
    
    // Pieza actual y siguiente pieza
    let piece = null;
    let nextPiece = null;
    
    // Referencias a los elementos DOM
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const saveScoreButton = document.getElementById('save-score');
    const playerNameInput = document.getElementById('player-name');
    
    // Referencias a controles táctiles
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnDown = document.getElementById('btn-down');
    const btnDrop = document.getElementById('btn-drop');
    
    // Inicializar el canvas con un mensaje de bienvenida
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona Iniciar Juego', canvas.width / 2, canvas.height / 2);
    
    // Configuración responsive del tamaño del canvas
    adjustCanvasSize();
    
    // Eventos de botones
    startButton.addEventListener('click', function() {
        console.log('Botón de inicio clickeado');
        startGame();
    });
    pauseButton.addEventListener('click', togglePause);
    saveScoreButton.addEventListener('click', saveScore);
    
    // Eventos de controles táctiles
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (piece) movePiece(-1);
    });
    
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (piece) movePiece(1);
    });
    
    btnRotate.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (piece) rotate(piece, 1);
    });
    
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (piece) dropPiece();
    });
    
    btnDrop.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (piece) hardDrop();
    });
    
    // Evento de redimensionar ventana
    window.addEventListener('resize', () => {
        adjustCanvasSize();
        drawEverything();
    });
    
    // Función para ajustar el tamaño del canvas según el dispositivo
    function adjustCanvasSize() {
        console.log('Ajustando tamaño del canvas');
        const container = document.querySelector('.game-board');
        const containerWidth = container.clientWidth;
        
        // Determinar el ancho del canvas basado en el tamaño del contenedor
        let canvasWidth, canvasHeight;
        
        if (window.innerWidth <= 768) {
            // En dispositivos móviles, hacemos que el canvas sea responsive
            canvasWidth = Math.min(containerWidth - 10, 300);
            // Mantenemos la proporción del tablero (2:1)
            canvasHeight = canvasWidth * 2; 
            
            // Ajustamos el tamaño del bloque
            BLOCK_SIZE = canvasWidth / COLS;
        } else {
            // En desktop mantenemos el tamaño original
            canvasWidth = 300;
            canvasHeight = 600;
            BLOCK_SIZE = 30;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // También ajustamos el canvas de la siguiente pieza
        const nextPieceSize = Math.min(100, containerWidth / 3);
        nextPieceCanvas.width = nextPieceSize;
        nextPieceCanvas.height = nextPieceSize;
        
        console.log(`Canvas ajustado a ${canvasWidth}x${canvasHeight}, BLOCK_SIZE=${BLOCK_SIZE}`);
    }
    
    // Función para crear un tablero vacío
    function createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    // Función para crear una nueva pieza
    function createPiece(type) {
        console.log(`Creando pieza tipo ${type}`);
        return {
            position: { x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2), y: 0 },
            shape: SHAPES[type],
            type: type
        };
    }
    
    // Función para generar una pieza aleatoria
    function getRandomPiece() {
        // Generar un número entre 1 y 7
        return Math.floor(Math.random() * 7) + 1;
    }
    
    // Función para dibujar un bloque
    function drawBlock(x, y, color, context = ctx) {
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = '#222';
        context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Efecto de brillo
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 2);
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 4, 2, BLOCK_SIZE - 8);
    }
    
    // Función para dibujar el tablero
    function drawBoard() {
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(x, y, COLORS[value]);
                }
            });
        });
    }
    
    // Función para dibujar la pieza actual
    function drawPiece(p, context = ctx, offsetX = 0, offsetY = 0) {
        if (!p) return;
        
        p.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(
                        x + p.position.x + offsetX, 
                        y + p.position.y + offsetY, 
                        COLORS[p.type],
                        context
                    );
                }
            });
        });
    }
    
    // Función para dibujar la siguiente pieza
    function drawNextPiece() {
        if (!nextPiece) return;
        
        nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        nextPieceCtx.fillStyle = '#000';
        nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        // Calcular desplazamiento para centrar
        const blockSizeNext = nextPieceCanvas.width / 5; // Tamaño ajustado para la vista previa
        const offsetX = Math.floor((nextPieceCanvas.width / blockSizeNext - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((nextPieceCanvas.height / blockSizeNext - nextPiece.shape.length) / 2);
        
        // Dibujamos la pieza con un tamaño de bloque ajustado
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextPieceCtx.fillStyle = COLORS[nextPiece.type];
                    nextPieceCtx.fillRect(
                        (x + offsetX) * blockSizeNext, 
                        (y + offsetY) * blockSizeNext, 
                        blockSizeNext, 
                        blockSizeNext
                    );
                    nextPieceCtx.strokeStyle = '#222';
                    nextPieceCtx.strokeRect(
                        (x + offsetX) * blockSizeNext, 
                        (y + offsetY) * blockSizeNext, 
                        blockSizeNext, 
                        blockSizeNext
                    );
                }
            });
        });
    }
    
    // Función para actualizar la puntuación
    function updateScore(clearedLines) {
        // Puntuación basada en el número de líneas eliminadas
        const points = [0, 100, 300, 500, 800];
        score += points[clearedLines] * level;
        
        // Actualizar líneas y nivel
        lines += clearedLines;
        level = Math.floor(lines / 10) + 1;
        
        // Actualizar la velocidad de caída según el nivel
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        // Actualizar los elementos en el DOM
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
    
    // Función de colisión
    function collide(p, b) {
        if (!p || !b) return false;
        
        for (let y = 0; y < p.shape.length; y++) {
            for (let x = 0; x < p.shape[y].length; x++) {
                if (p.shape[y][x] !== 0) {
                    const boardX = x + p.position.x;
                    const boardY = y + p.position.y;
                    
                    // Comprobamos si está fuera de los límites o si colisiona con otra pieza
                    if (
                        boardX < 0 || 
                        boardX >= COLS || 
                        boardY >= ROWS ||
                        (boardY >= 0 && b[boardY] && b[boardY][boardX] !== 0)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // Función para rotar la pieza
    function rotate(p, direction) {
        if (!p) return;
        
        // Clonar la pieza para no modificar la original mientras comprobamos
        const newPiece = JSON.parse(JSON.stringify(p));
        const originalShape = newPiece.shape;
        
        // Crear una nueva matriz para la forma rotada
        const rotatedShape = [];
        for (let i = 0; i < originalShape[0].length; i++) {
            rotatedShape.push(Array(originalShape.length).fill(0));
        }
        
        // Rellenar la matriz rotada
        for (let y = 0; y < originalShape.length; y++) {
            for (let x = 0; x < originalShape[y].length; x++) {
                if (direction > 0) {
                    // Rotación en sentido horario
                    rotatedShape[x][originalShape.length - 1 - y] = originalShape[y][x];
                } else {
                    // Rotación en sentido antihorario
                    rotatedShape[originalShape[y].length - 1 - x][y] = originalShape[y][x];
                }
            }
        }
        
        newPiece.shape = rotatedShape;
        
        // Si la rotación no causa colisión, aplicarla
        if (!collide(newPiece, board)) {
            p.shape = rotatedShape;
            
            // "Wall kick" - Si la pieza está parcialmente fuera del tablero después de rotar
            if (p.position.x < 0) {
                p.position.x = 0;
            } else if (p.position.x + p.shape[0].length > COLS) {
                p.position.x = COLS - p.shape[0].length;
            }
        }
    }
    
    // Función para mover la pieza
    function movePiece(dir) {
        if (!piece) return;
        
        piece.position.x += dir;
        if (collide(piece, board)) {
            piece.position.x -= dir;
        }
        drawEverything();
    }
    
    // Función para bajar la pieza un paso
    function dropPiece() {
        if (!piece) return;
        
        piece.position.y++;
        if (collide(piece, board)) {
            piece.position.y--;
            solidifyPiece();
            const clearedLines = removeLines();
            updateScore(clearedLines);
            
            // Generar nueva pieza
            piece = {
                position: { x: Math.floor(COLS / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0 },
                shape: nextPiece.shape,
                type: nextPiece.type
            };
            
            nextPiece = createPiece(getRandomPiece());
            drawNextPiece();
            
            // Comprobar si el juego ha terminado
            if (collide(piece, board)) {
                gameOver = true;
            }
        }
        
        dropCounter = 0;
        drawEverything();
    }
    
    // Función para soltar la pieza hasta abajo (hard drop)
    function hardDrop() {
        if (!piece) return;
        
        while (!collide({ ...piece, position: { x: piece.position.x, y: piece.position.y + 1 } }, board)) {
            piece.position.y++;
        }
        dropPiece();
    }
    
    // Función para solidificar la pieza actual en el tablero
    function solidifyPiece() {
        if (!piece) return;
        
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardX = piece.position.x + x;
                    const boardY = piece.position.y + y;
                    
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        board[boardY][boardX] = piece.type;
                    }
                }
            });
        });
    }
    
    // Función para eliminar líneas completas
    function removeLines() {
        let linesCleared = 0;
        
        // Revisar desde abajo hacia arriba para encontrar líneas completas
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(value => value !== 0)) {
                // Eliminar la línea completa
                board.splice(y, 1);
                // Añadir una nueva línea vacía en la parte superior
                board.unshift(Array(COLS).fill(0));
                // Incrementar contador de líneas
                linesCleared++;
                // Como hemos eliminado una línea, necesitamos revisar la misma posición de nuevo
                y++;
            }
        }
        
        return linesCleared;
    }
    
    // Función para dibujar todo
    function drawEverything() {
        // Limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar fondo negro
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar tablero
        drawBoard();
        
        // Dibujar sombra de la pieza
        if (piece && !gameOver && !isPaused) {
            drawPieceShadow();
        }
        
        // Dibujar pieza actual
        if (piece && !gameOver && !isPaused) {
            drawPiece(piece);
        }
        
        // Dibujar mensajes si es necesario
        if (gameOver) {
            drawGameOver();
        } else if (isPaused) {
            drawPaused();
        }
    }
    
    // Bucle de animación principal
    function animate(time = 0) {
        // Calcular tiempo transcurrido
        const deltaTime = time - lastTime;
        lastTime = time;
        
        // Si el juego está pausado o terminado, no actualizar
        if (isPaused || gameOver) {
            drawEverything();
            return;
        }
        
        // Actualizar contador de caída
        dropCounter += deltaTime;
        
        // Si es momento de bajar la pieza
        if (dropCounter > dropInterval) {
            dropPiece();
        }
        
        // Dibujar todo
        drawEverything();
        
        // Continuar el bucle
        animationId = requestAnimationFrame(animate);
    }
    
    // Función para dibujar la sombra de la pieza
    function drawPieceShadow() {
        if (!piece) return;
        
        // Crear una copia de la pieza para simular su caída
        const shadowPiece = JSON.parse(JSON.stringify(piece));
        
        // Bajar la sombra hasta que colisione
        while (!collide({ ...shadowPiece, position: { x: shadowPiece.position.x, y: shadowPiece.position.y + 1 } }, board)) {
            shadowPiece.position.y++;
        }
        
        // Solo dibujar si la sombra no está en la misma posición que la pieza actual
        if (shadowPiece.position.y > piece.position.y) {
            shadowPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                        ctx.fillRect(
                            (x + shadowPiece.position.x) * BLOCK_SIZE, 
                            (y + shadowPiece.position.y) * BLOCK_SIZE, 
                            BLOCK_SIZE, 
                            BLOCK_SIZE
                        );
                        ctx.strokeStyle = 'rgba(150, 150, 150, 0.7)';
                        ctx.strokeRect(
                            (x + shadowPiece.position.x) * BLOCK_SIZE, 
                            (y + shadowPiece.position.y) * BLOCK_SIZE, 
                            BLOCK_SIZE, 
                            BLOCK_SIZE
                        );
                    }
                });
            });
        }
    }
    
    // Función para dibujar el mensaje de Game Over
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `${Math.floor(canvas.width / 10)}px Arial`;
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = `${Math.floor(canvas.width / 20)}px Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Puntuación: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Presiona Start', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    // Función para dibujar el mensaje de Pausa
    function drawPaused() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `${Math.floor(canvas.width / 10)}px Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
    }
    
    // Función para alternar el estado de pausa
    function togglePause() {
        if (gameOver || !piece) return;
        
        isPaused = !isPaused;
        if (!isPaused) {
            // Si reanudamos, continuamos la animación
            lastTime = performance.now();
            animationId = requestAnimationFrame(animate);
        } else {
            // Si pausamos, cancelamos la animación actual
            cancelAnimationFrame(animationId);
            drawPaused();
        }
    }
    
    // Función para iniciar el juego
    function startGame() {
        console.log('Iniciando juego...');
        
        // Reiniciar todas las variables del juego
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        isPaused = false;
        dropCounter = 0;
        dropInterval = 1000;
        
        // Actualizar UI
        scoreElement.textContent = '0';
        levelElement.textContent = '1';
        linesElement.textContent = '0';
        
        console.log('Creando piezas iniciales...');
        
        try {
            // Crear piezas iniciales
            piece = createPiece(getRandomPiece());
            nextPiece = createPiece(getRandomPiece());
            
            console.log('Pieza actual:', piece);
            console.log('Siguiente pieza:', nextPiece);
            
            // Dibujar la siguiente pieza
            drawNextPiece();
            
            // Cancelar animación anterior si existe
            if (animationId) {
                console.log('Cancelando animación anterior:', animationId);
                cancelAnimationFrame(animationId);
            }
            
            // Iniciar el bucle de animación
            console.log('Iniciando animación...');
            lastTime = performance.now();
            animationId = requestAnimationFrame(animate);
            
            // Enfocar el canvas para capturar eventos de teclado
            canvas.focus();
            console.log('Juego iniciado correctamente');
        } catch (error) {
            console.error('Error al iniciar el juego:', error);
        }
    }
    
    // Función para guardar puntuación en el servidor global
    function saveScoreToGlobal(playerData) {
        try {
            // URL del API pública de JSONBin.io (sin necesidad de crear cuenta)
            // Usamos un bin público solo para este ejemplo
            const jsonBinUrl = "https://jsonbin.org/juegos-tetris/scores";
            
            // Primero obtenemos las puntuaciones actuales
            fetch(jsonBinUrl)
                .then(response => {
                    if (response.status === 404) {
                        // Si no existe, empezamos con un array vacío
                        return [];
                    }
                    return response.json();
                })
                .catch(() => {
                    // En caso de error, iniciamos con array vacío
                    return [];
                })
                .then(scores => {
                    if (!Array.isArray(scores)) scores = [];
                    
                    // Verificar si el jugador ya tiene una puntuación
                    const existingScoreIndex = scores.findIndex(item => 
                        item.name === playerData.name);
                    
                    if (existingScoreIndex !== -1) {
                        // Si la puntuación existente es mayor, no guardar
                        if (scores[existingScoreIndex].score >= playerData.score) {
                            console.log("El jugador ya tiene una puntuación mayor");
                            return;
                        }
                        // Eliminar la puntuación antigua
                        scores.splice(existingScoreIndex, 1);
                    }
                    
                    // Añadir la nueva puntuación
                    scores.push(playerData);
                    
                    // Ordenar y limitar a 50 puntuaciones
                    scores.sort((a, b) => b.score - a.score);
                    scores = scores.slice(0, 50);
                    
                    // Guardar puntuaciones actualizadas
                    fetch(jsonBinUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(scores)
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log('Puntuación guardada en el ranking global');
                        } else {
                            console.error('Error al guardar puntuación en el ranking global');
                        }
                    })
                    .catch(error => {
                        console.error('Error al guardar puntuación:', error);
                    });
                })
                .catch(error => {
                    console.error('Error en el proceso:', error);
                });
        } catch (error) {
            console.error('Error al guardar la puntuación global:', error);
        }
    }
    
    // Función para guardar la puntuación
    function saveScore() {
        const playerName = playerNameInput.value.trim() || 'Anónimo';
        
        // Crear un objeto con los datos del jugador
        const playerData = {
            name: playerName,
            score: score,
            level: level,
            lines: lines,
            date: new Date().toISOString()
        };
        
        // Guardar localmente en localStorage
        let localHighScores = JSON.parse(localStorage.getItem('tetrisHighScores') || '[]');
        
        // Verificar si ya existe una puntuación para este jugador
        const existingScoreIndex = localHighScores.findIndex(item => item.name === playerName);
        
        if (existingScoreIndex !== -1) {
            // Si la puntuación existente es mayor, no la reemplazamos
            if (localHighScores[existingScoreIndex].score >= playerData.score) {
                alert(`No se guardó la puntuación porque ya tienes una mejor: ${localHighScores[existingScoreIndex].score} puntos`);
                return;
            } else {
                // Si la nueva puntuación es mayor, reemplazamos la anterior
                localHighScores.splice(existingScoreIndex, 1);
            }
        }
        
        // Añadir nueva puntuación, ordenar y limitar a 10
        localHighScores.push(playerData);
        localHighScores.sort((a, b) => b.score - a.score);
        localHighScores = localHighScores.slice(0, 10);
        localStorage.setItem('tetrisHighScores', JSON.stringify(localHighScores));
        
        // También guardar en el sistema global (puntuaciones combinadas de todos)
        let globalHighScores = JSON.parse(localStorage.getItem('tetrisGlobalHighScores') || '[]');
        
        // Verificar si este jugador ya tiene una puntuación en el ranking global
        const existingGlobalIndex = globalHighScores.findIndex(item => 
            item.name === playerName && Math.abs(item.score - playerData.score) < 100);
        
        // Solo agregamos si no existe una puntuación similar de este jugador
        if (existingGlobalIndex === -1) {
            globalHighScores.push(playerData);
            globalHighScores.sort((a, b) => b.score - a.score);
            globalHighScores = globalHighScores.slice(0, 20); // Limitamos a las 20 mejores
            localStorage.setItem('tetrisGlobalHighScores', JSON.stringify(globalHighScores));
        }
        
        // Guardar en el servidor global
        saveScoreToGlobal(playerData);
        
        alert(`¡Puntuación de ${playerData.score} puntos guardada para ${playerName}!`);
        
        // Actualizar la tabla de puntuaciones
        loadHighScores();
    }
    
    // Función para cargar las mejores puntuaciones
    function loadHighScores() {
        // Obtener puntuaciones de localStorage
        const localScores = JSON.parse(localStorage.getItem('tetrisHighScores') || '[]');
        
        // Obtener puntuaciones globales de localStorage
        const globalScores = JSON.parse(localStorage.getItem('tetrisGlobalHighScores') || '[]');
        
        // Mostrar en la tabla local
        displayScores(localScores, 'ranking-local');
        
        // Mostrar en la tabla global
        displayScores(globalScores, 'ranking-global');
        
        // Cargar puntuaciones en línea desde el servidor
        loadOnlineScores();
        
        // También intentar cargar puntuaciones predefinidas desde el archivo JSON
        fetch('data/global-scores.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar puntuaciones oficiales');
                }
                return response.json();
            })
            .then(officialScores => {
                // Ordenar y mostrar en la tabla oficial
                officialScores.sort((a, b) => b.score - a.score);
                displayScores(officialScores, 'ranking-official');
            })
            .catch(error => {
                console.error('Error al cargar puntuaciones oficiales:', error);
                const officialTable = document.getElementById('ranking-official');
                if (officialTable) {
                    officialTable.innerHTML = '<tr><th>Jugador</th><th>Puntuación</th><th>Nivel</th><th>Líneas</th></tr><tr><td colspan="4">No hay puntuaciones oficiales disponibles</td></tr>';
                }
            });
    }
    
    // Función para cargar puntuaciones online
    function loadOnlineScores() {
        try {
            const jsonBinUrl = "https://jsonbin.org/juegos-tetris/scores";
            
            fetch(jsonBinUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('No se pudieron cargar las puntuaciones globales');
                    }
                    return response.json();
                })
                .then(scores => {
                    if (!Array.isArray(scores)) scores = [];
                    
                    // Ordenar por puntuación (de mayor a menor)
                    scores.sort((a, b) => b.score - a.score);
                    
                    // Mostrar en la tabla online
                    displayScores(scores, 'ranking-online');
                })
                .catch(error => {
                    console.error('Error al cargar puntuaciones online:', error);
                    const onlineTable = document.getElementById('ranking-online');
                    if (onlineTable) {
                        onlineTable.innerHTML = '<tr><th>Posición</th><th>Jugador</th><th>Puntuación</th><th>Nivel</th><th>Líneas</th><th>Fecha</th></tr><tr><td colspan="6">Error al cargar puntuaciones online</td></tr>';
                    }
                });
        } catch (error) {
            console.error('Error general al cargar puntuaciones online:', error);
        }
    }
    
    // Función para mostrar puntuaciones en tablas HTML
    function displayScores(scores, tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        let html = `
            <tr>
                <th>Jugador</th>
                <th>Puntuación</th>
                <th>Nivel</th>
                <th>Líneas</th>
            </tr>
        `;
        
        if (scores.length === 0) {
            html += '<tr><td colspan="4">No hay puntuaciones registradas</td></tr>';
        } else {
            scores.forEach((score, index) => {
                html += `
                    <tr>
                        <td>${score.name}</td>
                        <td>${score.score}</td>
                        <td>${score.level}</td>
                        <td>${score.lines}</td>
                    </tr>
                `;
            });
        }
        
        table.innerHTML = html;
    }
    
    // Eventos de teclado
    document.addEventListener('keydown', handleKeyPress);
    
    function handleKeyPress(event) {
        if (gameOver) {
            if (event.key === 'Enter') {
                startGame();
            }
            return;
        }
        
        if (isPaused) {
            if (event.key === 'p' || event.key === 'P') {
                togglePause();
            }
            return;
        }
        
        if (!piece) return;
        
        switch(event.key) {
            case 'ArrowLeft':
                movePiece(-1);
                break;
            case 'ArrowRight':
                movePiece(1);
                break;
            case 'ArrowDown':
                dropPiece();
                break;
            case 'ArrowUp':
                rotate(piece, 1);
                break;
            case ' ': // Espacio
                hardDrop();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    }
    
    // No iniciamos el juego automáticamente, esperamos a que el usuario presione el botón
    console.log('Juego listo para iniciar');
}); 