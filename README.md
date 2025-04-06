# Tetris Personalizado

Un juego de Tetris con sistema de puntuaciones locales y ranking global online.

## Características

- Juego de Tetris completamente funcional
- Diseño responsivo para dispositivos móviles y de escritorio
- Controles táctiles para dispositivos móviles
- Sistema de puntuación en múltiples niveles:
  - Ranking global online (JSONBin.io)
  - Ranking oficial predefinido (JSON)
  - Ranking global local (localStorage)
  - Ranking personal (localStorage)
- Pantalla de mejores puntuaciones

## Desarrollo local

Para ejecutar el proyecto localmente:

```bash
# Instalar dependencia para el servidor local
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor se ejecutará en http://localhost:3000

## Despliegue en Netlify

Este juego está diseñado para ser desplegado fácilmente en Netlify:

1. Sube el código a GitHub
2. Conecta tu repositorio a Netlify
3. Configura el directorio de publicación como `public`
4. ¡Listo! Tu juego estará disponible en línea

## Sistema de Puntuaciones

El juego cuenta con un sistema de puntuaciones que funciona en cuatro niveles:

### Puntuaciones Online (JSONBin.io)
- Se guardan en un servicio de almacenamiento JSON en la nube
- No requiere registro ni cuenta para usarlo
- Recopilan las mejores puntuaciones de todos los jugadores del mundo
- Cada jugador solo puede tener la mejor puntuación en el ranking global
- Se limitan a las 50 mejores puntuaciones

### Puntuaciones Oficiales
- Se muestran desde un archivo JSON predefinido
- Representan los mejores puntajes "oficiales" del juego
- Para añadir nuevas puntuaciones oficiales, edita el archivo `public/data/global-scores.json`

### Puntuaciones Globales
- Se guardan en el navegador usando localStorage (`tetrisGlobalHighScores`)
- Recopilan las mejores puntuaciones de todos los jugadores en ese dispositivo
- Se limitan a las 20 mejores puntuaciones globales
- Cada jugador puede tener múltiples entradas si sus puntuaciones son significativamente diferentes

### Puntuaciones Locales
- Se guardan en el navegador del jugador usando localStorage (`tetrisHighScores`)
- Cada jugador solo puede tener una puntuación en el ranking (la más alta)
- Si un jugador obtiene una puntuación mayor a su récord previo, la antigua se elimina
- Se limitan a las 10 mejores puntuaciones

## Cómo jugar

- Usa las teclas de flecha para mover y rotar las piezas
- Presiona la barra espaciadora para soltar la pieza directamente
- Presiona P para pausar el juego
- Ingresa tu nombre y guarda tu puntuación al terminar el juego

## Actualizar puntuaciones oficiales

Para agregar o modificar las puntuaciones oficiales que aparecen en el ranking:

1. Edita el archivo `public/data/global-scores.json`
2. Sigue el formato JSON existente para cada puntuación
3. Guarda el archivo y actualiza tu repositorio 