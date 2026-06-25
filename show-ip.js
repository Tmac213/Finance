const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const ip = getLocalIp();
console.log('\n==================================================');
console.log('  ANDROID CONNECTIVITY HELPER');
console.log('==================================================\n');
console.log('You seem to be testing on a Real Device (since 10.0.2.2 failed).');
console.log('You MUST configure your app to point to your computer\'s IP address.\n');
console.log('STEP 1: Create or Edit the file ".env.local" in this folder.');
console.log('STEP 2: Add the following line to it:\n');
console.log(`VITE_ANDROID_API_URL=http://${ip}:3001`);
console.log('\nSTEP 3: Rebuild your app:');
console.log('  npm run build');
console.log('  npx cap sync android');
console.log('  (Then run app on device again)\n');
console.log('==================================================\n');
