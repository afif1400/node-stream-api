import * as express from "express";
import * as fs from "fs";
import * as cors from "cors";
const app = express();
app.use(cors());

const efsPath = "/mnt/efs";

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.get("/stream/:fileName", (req: express.Request, res: express.Response) => {
	// console.log(req.headers);
	const fileName = req.params.fileName;
	const range = req.headers.range;
	if (!range) {
		res.status(400).send("Range not specified");
		return;
	}

	// regex for mathing the file name in lofis folder with a prefix of a number and a .mp3 suffix
	const path = `^(${fileName})-([a-z _ A-Z]+).mp3$`;
	const regex = new RegExp(path);
	const files = fs.readdirSync(__dirname + "/lofis");
	const file = files.find((f) => regex.test(f));
	if (!file) {
		res.status(404).send("File not found");
		return;
	}

	const audioPath = __dirname + "/lofis/" + file;
	const stat = fs.statSync(audioPath);
	const audioSize = stat.size;

	const CHUNK_SIZE = 1024 * 200;
	const start = parseInt(range.replace(/bytes=/, "").split("-")[0], 10);
	const end = Math.min(start + CHUNK_SIZE, audioSize - 1);
	//Send headers
	const contentLength = end - start + 1;
	const headers = {
		"Content-Type": "audio/mpeg",
		"Content-Range": `bytes ${start}-${end}/${audioSize}`,
		"Content-Length": contentLength,
		"Accept-Ranges": "bytes",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "*",
		"Access-Control-Allow-Headers": "*",
	};
	res.writeHead(206, headers);
	// Send file
	const audioStream = fs.createReadStream(audioPath, { start, end });
	// audioStream.pipe(res);
	console.log(`Sending file ${audioPath}`, start, " ", end);
	audioStream.on("data", (chunk) => {
		res.write(chunk);
	});
	audioStream.on("end", () => {
		res.end();
	});
});

app.listen("5000", () => {
	console.log("server is running on port 5000 🚀");
});
