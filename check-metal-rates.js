
const fetch = require('node-fetch');

async function checkRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        console.log('XAU (Gold):', data.rates.XAU);
        console.log('XAG (Silver):', data.rates.XAG);
        console.log('XPT (Platinum):', data.rates.XPT);
        console.log('XPD (Palladium):', data.rates.XPD);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkRates();
