ANTIBOTS RUNNER - AUDIOS PERSONALIZABLES

Coloca tus propios archivos MP3 en esta carpeta usando EXACTAMENTE estos nombres.
Si falta algún archivo, el juego continúa funcionando; simplemente ese audio no sonará.

EFECTOS
boss-entry.mp3      Entrada épica del dinosaurio.
boss-roar.mp3       Rugido de la entrada/inicio del combate.
boss-charge.mp3     Cuando el dinosaurio se prepara para disparar.
boss-shot.mp3       Cuando el dinosaurio dispara.
phase-roar.mp3      Rugido al derrotar los jefes 1 y 2.
boss-hit.mp3        Cuando un proyectil de jugador golpea al jefe.
player-hit.mp3      Cuando un jugador recibe daño.
star-collect.wav    Cuando se recoge una estrella (brillo ascendente).
heart-collect.wav   Cuando se recoge un corazón (tono cálido de recuperación).
attack-collect.mp3  Cuando se recoge un objeto de ataque.
player-shot.mp3     Cuando ese objeto sale disparado hacia el jefe.
victory.mp3         Sonido al derrotar al tercer jefe.

MÚSICA
music-runner.mp3    Música desde el inicio hasta la aparición del jefe 1.
phase-1.mp3         Empieza al minuto 1 y continúa después de derrotar al jefe 1.
phase-2.mp3         Reemplaza phase-1.mp3 al minuto 2 y continúa después del jefe 2.
phase-3.mp3         Reemplaza phase-2.mp3 al minuto 3 y continúa hasta derrotar al jefe 3.

PROGRESIÓN
- 60 segundos efectivos de carrera: jefe/fase 1 y comienza phase-1.mp3.
- 120 segundos efectivos de carrera: jefe/fase 2 y comienza phase-2.mp3.
- 180 segundos efectivos de carrera: jefe/fase 3 y comienza phase-3.mp3.
- El tiempo de combate NO adelanta el contador de carrera.
- Derrotar los jefes 1 y 2 devuelve a la carrera sin cortar el soundtrack de su fase.
- Derrotar el jefe 3 detiene phase-3.mp3, reproduce victory.mp3 y muestra resultados.

RACHA DE CARRERA
- 15 s sin recibir daño: avance 1/2.
- 30 s sin recibir daño: avance 2/2.
- La racha se pausa durante entradas y combates de jefe.
- Recibir daño reinicia la racha a 0, elimina ambos avances y devuelve al jugador a su X inicial.
- Los corazones físicos se reservan para un jugador que haya perdido vida, priorizando al de menos vidas.

Puedes reemplazar los MP3 sin modificar src/audio.js.
