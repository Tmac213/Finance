
const https = require('https');

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
};

https.get('https://data-asg.goldprice.org/dbXRates/USD', options, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Items:', json.items);
            if (json.items && json.items.length > 0) {
                console.log('Gold (XAU):', json.items[0].xauPrice);
                console.log('Silver (XAG):', json.items[0].xagPrice);
            }
        } catch (e) {
            console.log(data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
