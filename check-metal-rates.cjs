
const https = require('https');

https.get('https://api.exchangerate-api.com/v4/latest/USD', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('XAU (Gold):', json.rates.XAU);
            console.log('XAG (Silver):', json.rates.XAG);
            console.log('XPT (Platinum):', json.rates.XPT);
            console.log('XPD (Palladium):', json.rates.XPD);
        } catch (e) {
            console.error(e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
