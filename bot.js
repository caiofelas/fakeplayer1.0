const mineflayer = require('mineflayer');
const http = require('http');

const serverIP = '134.65.23.38'; // Seu IP do servidor
const serverPort = 25565;             // Porta do servidor (padrão: 25565)

const bot = mineflayer.createBot({
    host: serverIP,
    port: serverPort,
    username: 'FakePlayer1.0' // Nome do bot principal
});

const fakePlayers = {};
let nextFakePlayerId = 1000;
let botStatus = 'offline';

bot.on('login', () => {
    console.log('Bot logado!');
    botStatus = 'online';
});

bot.on('end', (reason) => {
    console.log(`Bot desconectado: ${reason}`);
    botStatus = 'offline';
});

bot.on('error', (err) => {
    console.error('Erro:', err);
    botStatus = 'error';
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message.startsWith('$bot criar ')) {
        const parts = message.split(' ');
        if (parts.length === 3) {
            const fakePlayerName = parts[2];
            createFakePlayer(fakePlayerName, serverIP, serverPort); // Usa as variáveis específicas
        } else {
            bot.chat('Sintaxe incorreta: $bot criar <nome>');
        }
    } else if (message === '$bot remover') {
        removeAllFakePlayers();
    }
});

async function createFakePlayer(fakePlayerName, targetIP, targetPort) {
    console.log(`Tentando criar fake player '${fakePlayerName}' no IP: ${targetIP}:${targetPort}`);
    try {
        const fakeBot = await mineflayer.createBot({
            host: targetIP,   // Usa o IP específico do servidor
            port: targetPort, // Usa a porta específica do servidor
            username: fakePlayerName,
            version: bot.version
        });

        fakeBot.once('spawn', () => {
            console.log(`Fake player '${fakePlayerName}' conectado em (${fakeBot.entity.position.x.toFixed(2)}, ${fakeBot.entity.position.y.toFixed(2)}, ${fakeBot.entity.position.z.toFixed(2)})`);
            fakePlayers[fakePlayerName] = fakeBot;
        });

        fakeBot.on('end', (reason) => {
            delete fakePlayers[fakePlayerName];
            console.log(`Fake player '${fakePlayerName}' desconectado: ${reason}`);
        });

        fakeBot.on('error', (err) => {
            console.error(`Erro ao criar fake player '${fakePlayerName}':`, err);
            delete fakePlayers[fakePlayerName];
        });

    } catch (err) {
        console.error(`Falha ao criar fake player '${fakePlayerName}':`, err);
    }
}

function removeAllFakePlayers() {
    for (const playerName in fakePlayers) {
        if (fakePlayers.hasOwnProperty(playerName)) {
            fakePlayers[playerName].end();
        }
    }
    console.log('Removendo todos os fake players.');
}

// Servidor HTTP para o Uptimerobot
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let statusText = '';
    let color = 'red';

    if (botStatus === 'online') {
        statusText = 'Online';
        color = 'green';
    } else if (botStatus === 'offline') {
        statusText = 'Offline';
        color = 'red';
    } else if (botStatus === 'error') {
        statusText = 'Erro';
        color = 'orange';
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bot Status</title>
        <style>
            body {
                font-family: sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f4f4f4;
                margin: 0;
            }
            .status-container {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .status {
                font-size: 2em;
                font-weight: bold;
                color: ${color};
            }
        </style>
    </head>
    <body>
        <div class="status-container">
            <h1>Bot Status</h1>
            <p class="status">${statusText}</p>
        </div>
    </body>
    </html>
    `;
    res.end(html);
});

const port = 3000; // Escolha uma porta diferente da 25565
server.listen(port, () => {
    console.log(`Servidor HTTP rodando na porta ${port}`);
});

bot.on('kicked', (reason, loggedIn) => {
    console.log(`Bot foi kickado: ${reason}`);
    botStatus = 'offline';
});

bot.on('error', err => {
    console.error('Erro geral do bot:', err);
    botStatus = 'error';
});

// IP do servidor para os fake players: 134.65.23.38
// Porta do servidor para os fake players: 25565
