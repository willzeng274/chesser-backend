import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const corsOptions = {
    origin: [
        'https://chesser.williamzeng.xyz',
        'https://chesser.wzeng.dev'
    ],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// copy pasted from the stockfish repo
// issue: <github_link>
const loadEngine = require("./load_engine.js");


const app = express();
const port = 8080;

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// queue[0] = white, queue[1] = black
const queue: [string[], string[]] = [[], []];
const wsMap = new Map<string, WebSocket>();
const connectionMap = new Map<string, string>();

// apparently the only way to load the engine in node right now?
const engine = loadEngine(require("path").join(__dirname, "node_modules/stockfish/src/stockfish-nnue-16.js"));

const fenregex = /^([rnbqkpRNBQKP1-8]+\/){7}([rnbqkpRNBQKP1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s(0|[1-9][0-9]*)\s([1-9][0-9]*)/;

function sendCmd(cmd: string): Promise<any> {
    return new Promise((resolve, _reject) => {
        engine.send(cmd,
            function onDone(data: any) {
                resolve(data);
            },
            function onStream(data: any) {
                // handle streaming data here
            }
        );
    });
}

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors(corsOptions));

app.get("/", (_req, res) => {
    res.send("ok");
});

app.post('/', async (req, res) => {
    if (!req.body.fen || !req.body.fen.match(fenregex)) {
        // console.log(req.body.fen)
        res.send("Invalid fen string");
        return;
    }

    await sendCmd("ucinewgame");
    const rd = await sendCmd("isready");
    if (rd === "readyok") {
        await sendCmd("position fen " + req.body.fen);
        const msg = await sendCmd("go depth 18");
        // in case the res has already been sent?
        if (res.headersSent) {
            return;
        }

        // only send res when it is a recommendation
        if (typeof (msg == "string") && msg.match("bestmove")) {
            const bestmoves = msg.split(" ");
            // console.log(bestmoves);

            const move = {
                from: bestmoves[1].slice(0, 2),
                to: bestmoves[1].slice(2, 4),
                promotion: bestmoves[1].slice(4, 5) || null
            };

            res.send(move);
        }
    } else {
        // console.log("CHESS ENGINE BROKE!");
        res.send("Engine is broken");
    }
});

wss.on('connection', function (ws) {

    const id = uuidv4();

    // console.log("new conn", id);

    let hasQueue = false;

    wsMap.set(id, ws);

    ws.on('error', console.error);

    ws.on('match', function () {
        hasQueue = false;
        ws.send(JSON.stringify({
            type: "match"
        }));
    });

    ws.on('message', function (data) {
        const ev = JSON.parse(data.toString('utf8'));

        if (ev.type === "queue") {
            const colorIndex = Number(ev.data.color);
            // console.log("queue as", colorIndex);
            // console.log("opp", Math.abs(colorIndex - 1), queue, queue[Math.abs(colorIndex - 1)]);
            if (queue[Math.abs(colorIndex - 1)].length > 0) {
                const other = queue[Math.abs(colorIndex - 1)].shift()!;

                connectionMap.set(id, other);
                connectionMap.set(other, id);
                ws.send(JSON.stringify({
                    type: "match"
                }));
                // console.log(wsMap.keys(), other);
                wsMap.get(other)!.emit("match");
                return;
            }
            queue[colorIndex as (0 | 1)].push(id);
            hasQueue = true;
        } else if (ev.type === "move") {
            const opp = connectionMap.get(id)!;
            // send the 1:1 replica of data
            wsMap.get(opp)!.send(data);
        }

        console.log('received: %s', data);
    });

    ws.on('close', function () {
        wsMap.delete(id);
        if (hasQueue) {
            const index1 = queue[0].indexOf(id);
            if (index1 > -1) {
                queue[0].splice(index1, 1);
            }

            const index2 = queue[1].indexOf(id);
            if (index2 > -1) {
                queue[1].splice(index2, 1);
            }
        }
    });

    // this gets sent initially
    // ws.send('something');
});

const normalizePath = (path: string) => path.replace(/\/+$/, '');

server.on('upgrade', (request, socket, head) => {
    const requestUrl = request.url || '/';
    const pathname = new URL(requestUrl, `http://${request.headers.host}`).pathname;

    const normalizedPath = normalizePath(pathname);

    if (normalizedPath === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
    console.log(`server is listening on ${port}`);
});