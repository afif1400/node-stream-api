"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
var express_1 = __importDefault(require("express"));
var fs = __importStar(require("fs"));
// import * as cors from "cors";
var app = (0, express_1.default)();
// app.use(cors.apply(null, [{ origin: true }]));
// const efsPath = "/mnt/efs";
app.get("/stream/:fileName", function (req, res) {
    // console.log(req.headers);
    var fileName = req.params.fileName;
    var range = req.headers.range;
    if (!range) {
        res.status(400).send("Range not specified");
        return;
    }
    // regex for mathing the file name in lofis folder with a prefix of a number and a .mp3 suffix
    var path = "^(".concat(fileName, ")-([a-z _ A-Z]+).aac$");
    var regex = new RegExp(path);
    var files = fs.readdirSync(__dirname + "/lofis");
    var file = files.find(function (f) { return regex.test(f); });
    if (!file) {
        res.status(404).send("File not found");
        return;
    }
    var audioPath = __dirname + "/lofis/" + file;
    var stat = fs.statSync(audioPath);
    var audioSize = stat.size;
    var CHUNK_SIZE = 1024 * 200;
    var start = parseInt(range.replace(/bytes=/, "").split("-")[0], 10);
    var end = Math.min(start + CHUNK_SIZE, audioSize - 1);
    //Send headers
    var contentLength = end - start + 1;
    var headers = {
        "Content-Type": "audio/mpeg",
        "Content-Range": "bytes ".concat(start, "-").concat(end, "/").concat(audioSize),
        "Content-Length": contentLength,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    };
    res.writeHead(206, headers);
    // Send file
    var audioStream = fs
        .createReadStream(audioPath, { start: start, end: end })
        .on("open", function () {
        audioStream.pipe(res);
    })
        .on("error", function (err) {
        console.log(err);
        res.end(err);
    });
});
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("server is running on port 5000 🚀");
});
