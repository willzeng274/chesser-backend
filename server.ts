import express from "express";

const loadEngine = require("./load_engine.js");
// import stockfish from "stockfish";

const app = express();
const port = 8080;

const engine = loadEngine(require("path").join(__dirname, "node_modules/stockfish/src/stockfish-nnue-16.js"));
// console.log(engine);
const fenregex = /^([rnbqkpRNBQKP1-8]+\/){7}([rnbqkpRNBQKP1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s(0|[1-9][0-9]*)\s([1-9][0-9]*)/;

engine.send("ucinewgame", function onDone(data: any){
    console.log("UCINEWGAME DONE:", data);
},  function onStream(data: any) {
    console.log("UCINEWGAME STREAMING:", data);
});

engine.send("isready", function onDone(data: any) {
    console.log("ISREADY DONE:", data);
}, function onStream(data: any) {
    console.log("ISREADY STREAMING:", data);
})

engine.send("position fen rnb1kb1r/pppp2Pp/4p2n/6q1/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 5", function onDone(data: any) {
    console.log("POSITIONFEN DONE:", data);
},  function onStream(data: any) {
    console.log("POSITIONFEN STREAMING:", data);
});

engine.send("go depth 18", function onDone(data: any){
    console.log("GOPDEPTH DONE:", data);
    if (typeof data == "string" && data.match("bestmove")) {
        const bestmoves = data.split(" ");
        console.log(bestmoves);
    }
},  function onStream(data: any) {
    console.log("GODEPTH STREAMING:", data);
});

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.post('/', (request, response) => {
    if (!request.body.fen.match(fenregex)) {
        console.log(request.body.fen)
        response.send("Invalid fen string");
        return;
    }


});

app.listen(port, () => {
    console.log(`server is listening on ${port}`)
})