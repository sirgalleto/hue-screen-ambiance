const huejay = require('huejay');
const db = require('./db');
const _ = require('lodash');

class Hue {
    constructor() {
        this.username = db.get('username').value();
    }

    updateClient() {
        this.client = new huejay.Client({
            host: this.bridges[0].ip,
            username: this.username,
        });
    }

    setUsername(username) {
        db.set('username', username).write();
        this.username = username;
    }

    setColor(color) {
        this.light.brightness = 254;
        this.light.xy = this.rgbToXY(color[0], color[1], color[2]);
        return this.client.lights.save(this.light);
    }

    async start(lightName) {
        this.bridges = await huejay.discover();

        if (this.bridges.length > 0) {

            this.updateClient();

            const user = await this.getAuthentication();

            const lights = await this.getLights();

            this.light = _.find(lights, { name: lightName });
        } else {
            console.error('I can\'t discover your hue bridge');
        }
    }

    async getLights(time) {
        await this.client.lights.scan();
        return this.client.lights.getAll();
    }

    async getAuthentication() {
        try {
            await this.client.bridge.isAuthenticated();

            return this.client.users.getByUsername(this.username);
        } catch (e) {
            console.error(e);
            const username = await this.createAuthentication();
            this.updateClient(username);

            return username;
        }
    }

    async createAuthentication() {
        let user = new this.client.users.User;
        let counter = 0;

        const waitForLink = (resolve, reject) => {
            setTimeout(async() => {
                try {
                    const createdUser = await this.client.users.create(user);
                    const username = createdUser.username;
                    console.log(`New user created!`, createdUser.username);
                    console.log(createdUser);
                    console.log(username);

                    resolve(username);

                } catch (error) {
                    counter += 1;

                    if (error instanceof huejay.Error && error.type === 101) {
                        console.log(`...`);
                        if (counter > 30) {
                            console.error('Link button not pressed, try again');
                            reject(error);
                        }
                    }

                    if (counter < 30) {
                        waitForLink(resolve, reject);
                    }
                }
            }, 1000);
        };

        console.log('Time to press the button');

        return new Promise((resolve, reject) => {
            waitForLink(resolve, reject);
        });
    }

    rgbToXY(red, green, blue) {
        //Gamma correctie
        red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
        green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
        blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

        //Apply wide gamut conversion D65
        var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

        var fx = X / (X + Y + Z);
        var fy = Y / (X + Y + Z);
        if (isNaN(fx)) {
            fx = 0.0;
        }
        if (isNaN(fy)) {
            fy = 0.0;
        }

        return [Number(fx.toPrecision(4)), Number(fy.toPrecision(4))];
    }
}

module.exports = new Hue();