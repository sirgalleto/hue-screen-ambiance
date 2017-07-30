const hue = require('./hue');
const ambianceColor = require('./color');

async function start() {
    await hue.start(`Sebastian's room`);
    updateColor([0, 0, 0]);
}

function updateColor(lastColor) {
    setTimeout(async() => {
        const color = await ambianceColor();

        if (color.join() !== lastColor.join()) {
            console.info(`updating to rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            await hue.setColor(color);
        }
        updateColor(color);
    }, 10);
}

start();