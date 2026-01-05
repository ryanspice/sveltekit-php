import { spawn } from 'child_process';

const PORT = 8099;
const HOST = `http://127.0.0.1:${PORT}`;

function log(msg) { console.log(msg); }

async function testRoute(route, expectedString) {
    log(`\nTesting ${route}...`);
    try {
        const res = await fetch(`${HOST}${route}/__data.json`);
        const text = await res.text();
        
        log(`Status: ${res.status}`);
        
        try {
            const json = JSON.parse(text);
            log('JSON Type: ' + json.type);
            log('Nodes count: ' + (json.nodes ? json.nodes.length : 'N/A'));
            
            if (json.nodes) {
                json.nodes.forEach((n, i) => {
                    log(`Node ${i}: ${n ? JSON.stringify(n).substring(0, 100) + '...' : 'null'}`);
                });
            }

            if (text.includes(expectedString)) {
                log(`✅ Found expected string: "${expectedString}"`);
            } else {
                log(`❌ Missing expected string: "${expectedString}"`);
            }
        } catch (e) {
            log('❌ Invalid JSON');
            log('Preview: ' + text.substring(0, 200));
        }
    } catch (e) {
        log(`❌ Fetch error: ${e.message}`);
    }
}

async function run() {
    log(`🐘 Starting PHP server on port ${PORT}...`);
    const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', 'build', 'router.php'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'inherit', 'inherit']
    });

    await new Promise(r => setTimeout(r, 1000));

    try {
        await testRoute('/parent-child', 'Parent Data');
        await testRoute('/parent-child/nested', 'Grandparent Data');
        await testRoute('/stream', 'Step 1'); // Stream might be tricky with simple fetch
    } catch (e) {
        console.error(e);
    } finally {
        php.kill();
    }
}

run();
