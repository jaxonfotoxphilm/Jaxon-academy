const Jimp = require('jimp');

async function removeWhiteBg() {
    const image = await Jimp.read('./public/grace_idle.png');
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        
        // If the pixel is very close to white
        if (red > 240 && green > 240 && blue > 240) {
            this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
        }
    });

    await image.writeAsync('./public/grace_transparent.png');
    console.log("Successfully created transparent sprite!");
}

removeWhiteBg().catch(console.error);
