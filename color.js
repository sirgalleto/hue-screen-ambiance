const ColorThief = require('color-thief');
const screenshot = require('desktop-screenshot');
const fs = require('fs');

const colorThief = new ColorThief();

const imagePath = './.screenshot.png';

async function getAmbianceColor() {
    await takeScreenshot();
    const image = fs.readFileSync(imagePath);
    const color = colorThief.getColor(image);
    removeScreenshot();

    return color;
}

async function takeScreenshot() {
    return new Promise((resolve, reject) => {
        screenshot(imagePath, { width: 50 }, (error, complete) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function removeScreenshot() {
    fs.unlink(imagePath, () => {});
}

module.exports = getAmbianceColor;