// ===== Configuración =====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const ANCHO = canvas.width;
const ALTO = canvas.height;

const PUNTOS_PARA_GANAR = 7;
const ALTO_PALA = 90;
const ANCHO_PALA = 12;
const RADIO_PELOTA = 9;
const VELOCIDAD_JUGADOR = 8; // con teclado
const VELOCIDAD_MAQUINA = 5; // súbelo para hacerla más difícil

// Elementos del HTML
const puntosJugadorEl = document.getElementById("puntosJugador");
const puntosMaquinaEl = document.getElementById("puntosMaquina");
const mensajeEl = document.getElementById("mensaje");
const textoMensajeEl = document.getElementById("textoMensaje");
const botonJugar = document.getElementById("botonJugar");

// ===== Objetos del juego =====
const jugador = { x: 20, y: ALTO / 2 - ALTO_PALA / 2, puntos: 0 };
const maquina = {
  x: ANCHO - 20 - ANCHO_PALA,
  y: ALTO / 2 - ALTO_PALA / 2,
  puntos: 0,
};
const pelota = { x: ANCHO / 2, y: ALTO / 2, vx: 0, vy: 0, velocidad: 6 };

let jugando = false;
let pausado = false;
const teclas = { arriba: false, abajo: false };

// ===== Funciones auxiliares =====
function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

function reiniciarPelota(haciaJugador) {
  pelota.x = ANCHO / 2;
  pelota.y = ALTO / 2;
  pelota.velocidad = 6;
  const angulo = Math.random() * 0.8 - 0.4; // entre -0.4 y 0.4 radianes
  const direccion = haciaJugador ? -1 : 1;
  pelota.vx = direccion * pelota.velocidad * Math.cos(angulo);
  pelota.vy = pelota.velocidad * Math.sin(angulo);
}

function actualizarMarcador() {
  puntosJugadorEl.textContent = jugador.puntos;
  puntosMaquinaEl.textContent = maquina.puntos;
}

function mostrarMensaje(texto, textoBoton) {
  textoMensajeEl.textContent = texto;
  botonJugar.textContent = textoBoton;
  mensajeEl.classList.remove("oculto");
}

function ocultarMensaje() {
  mensajeEl.classList.add("oculto");
}

// ===== Lógica =====
function moverJugador() {
  if (teclas.arriba) jugador.y -= VELOCIDAD_JUGADOR;
  if (teclas.abajo) jugador.y += VELOCIDAD_JUGADOR;
  jugador.y = limitar(jugador.y, 0, ALTO - ALTO_PALA);
}

function moverMaquina() {
  // La máquina sigue la pelota con una velocidad máxima (así se puede ganar)
  const centro = maquina.y + ALTO_PALA / 2;
  const diferencia = pelota.y - centro;
  if (Math.abs(diferencia) > 10) {
    maquina.y += limitar(diferencia, -VELOCIDAD_MAQUINA, VELOCIDAD_MAQUINA);
  }
  maquina.y = limitar(maquina.y, 0, ALTO - ALTO_PALA);
}

function chocaConPala(pala) {
  return (
    pelota.x - RADIO_PELOTA < pala.x + ANCHO_PALA &&
    pelota.x + RADIO_PELOTA > pala.x &&
    pelota.y + RADIO_PELOTA > pala.y &&
    pelota.y - RADIO_PELOTA < pala.y + ALTO_PALA
  );
}

function rebotarEnPala(pala, direccion) {
  // El ángulo depende de dónde golpea la pelota en la pala
  const puntoImpacto = (pelota.y - (pala.y + ALTO_PALA / 2)) / (ALTO_PALA / 2);
  const angulo = puntoImpacto * (Math.PI / 4); // máximo 45 grados
  pelota.velocidad = Math.min(pelota.velocidad + 0.5, 14);
  pelota.vx = direccion * pelota.velocidad * Math.cos(angulo);
  pelota.vy = pelota.velocidad * Math.sin(angulo);
}

function moverPelota() {
  pelota.x += pelota.vx;
  pelota.y += pelota.vy;

  // Rebote arriba y abajo
  if (pelota.y - RADIO_PELOTA < 0) {
    pelota.y = RADIO_PELOTA;
    pelota.vy *= -1;
  } else if (pelota.y + RADIO_PELOTA > ALTO) {
    pelota.y = ALTO - RADIO_PELOTA;
    pelota.vy *= -1;
  }

  // Rebote en las palas
  if (pelota.vx < 0 && chocaConPala(jugador)) {
    pelota.x = jugador.x + ANCHO_PALA + RADIO_PELOTA;
    rebotarEnPala(jugador, 1);
  } else if (pelota.vx > 0 && chocaConPala(maquina)) {
    pelota.x = maquina.x - RADIO_PELOTA;
    rebotarEnPala(maquina, -1);
  }

  // Punto
  if (pelota.x < 0) {
    maquina.puntos++;
    anotarPunto(false);
  } else if (pelota.x > ANCHO) {
    jugador.puntos++;
    anotarPunto(true);
  }
}

function anotarPunto(ganoJugador) {
  actualizarMarcador();

  if (jugador.puntos >= PUNTOS_PARA_GANAR) {
    terminarPartida("¡Has ganado! 🎉");
  } else if (maquina.puntos >= PUNTOS_PARA_GANAR) {
    terminarPartida("Ha ganado la máquina");
  } else {
    // Saca quien ha perdido el punto
    reiniciarPelota(!ganoJugador);
  }
}

function terminarPartida(texto) {
  jugando = false;
  mostrarMensaje(texto, "Jugar otra vez");
}

// ===== Dibujo =====
function dibujarMesa() {
  ctx.fillStyle = "#1f5fa8";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Borde blanco
  ctx.strokeStyle = "#f4f7fb";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, ANCHO - 4, ALTO - 4);

  // Línea central horizontal
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ALTO / 2);
  ctx.lineTo(ANCHO, ALTO / 2);
  ctx.stroke();

  // Red en el centro
  ctx.fillStyle = "rgba(244, 247, 251, 0.85)";
  for (let y = 0; y < ALTO; y += 20) {
    ctx.fillRect(ANCHO / 2 - 2, y, 4, 12);
  }
}

function dibujarPala(pala, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(pala.x, pala.y, ANCHO_PALA, ALTO_PALA, 6);
  ctx.fill();
}

function dibujarPelota() {
  ctx.fillStyle = "#ff8a1f";
  ctx.beginPath();
  ctx.arc(pelota.x, pelota.y, RADIO_PELOTA, 0, Math.PI * 2);
  ctx.fill();
}

function dibujar() {
  dibujarMesa();
  dibujarPala(jugador, "#ffd54a");
  dibujarPala(maquina, "#e8494f");
  dibujarPelota();

  if (pausado) {
    ctx.fillStyle = "rgba(19, 35, 63, 0.6)";
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = "#eef3fa";
    ctx.font = "40px Bungee, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Pausa", ANCHO / 2, ALTO / 2 + 14);
  }
}

// ===== Bucle principal =====
function bucle() {
  if (jugando && !pausado) {
    moverJugador();
    moverMaquina();
    moverPelota();
  }
  dibujar();
  requestAnimationFrame(bucle);
}

// ===== Controles =====
function moverConPuntero(clientY) {
  const rect = canvas.getBoundingClientRect();
  const escala = ALTO / rect.height;
  const y = (clientY - rect.top) * escala;
  jugador.y = limitar(y - ALTO_PALA / 2, 0, ALTO - ALTO_PALA);
}

canvas.addEventListener("mousemove", (e) => moverConPuntero(e.clientY));

canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    moverConPuntero(e.touches[0].clientY);
  },
  { passive: false },
);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") teclas.arriba = true;
  if (e.key === "ArrowDown" || e.key === "s") teclas.abajo = true;
  if (e.code === "Space" && jugando) {
    e.preventDefault();
    pausado = !pausado;
  }
  if (e.key.startsWith("Arrow")) e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") teclas.arriba = false;
  if (e.key === "ArrowDown" || e.key === "s") teclas.abajo = false;
});

botonJugar.addEventListener("click", () => {
  jugador.puntos = 0;
  maquina.puntos = 0;
  actualizarMarcador();
  reiniciarPelota(Math.random() < 0.5);
  pausado = false;
  jugando = true;
  ocultarMensaje();
  botonJugar.blur();
});

// Arrancar
bucle();
