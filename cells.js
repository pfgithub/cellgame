const WIDTH = 10;
const HEIGHT = 10;

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.imageRendering = "pixelated";
canvas.style.width = (WIDTH * 40)+"px";
canvas.style.height = (HEIGHT * 40)+"px";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d", {alpha: false});

const tiles = new Uint8ClampedArray(4 * WIDTH * HEIGHT);
const tiles_imagedata = new ImageData(tiles, WIDTH, HEIGHT);

// tile init
for(let y = 0; y < HEIGHT; y++) {
    for(let x = 0; x < WIDTH; x++) {
        const i = (y * WIDTH + x) * 4;
        tiles[i + 0] = 0;
        tiles[i + 1] = 0;
        tiles[i + 2] = 0;
        tiles[i + 3] = 255;
    }
}

function tick() {

}
function render() {
    ctx.putImageData(tiles_imagedata, 0, 0);
}

const btn_container = document.createElement("div");
const tick_button = document.createElement("button");
tick_button.textContent = "tick";
tick_button.onclick = () => {
    tick();
    render();
}
btn_container.appendChild(tick_button);
document.body.appendChild(btn_container);

render();