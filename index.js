const express = require('express');
const server = express();
const chalk = require('chalk');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const moment = require('moment');
const guid = require('uuid/v1');
const multer = require('multer');
const bodyParser= require('body-parser');

// SET STORAGE
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, `./upload`);
  },
  filename(req, file, callback) {
    callback(null, `${file.originalname}`)
  },
});
 
const upload = multer({ storage });

db.defaults({ sessions: [], logs: [], events: [], networkLogs: [] }).write();

server.use(express.json());
server.use(bodyParser.urlencoded({extended: true}));

server.post('/sessions', (req, res) => {
	console.log(chalk.green("POST /sessions") + "\n" + JSON.stringify(req.body));
	const session = createSession(req.body);

	res.send(session);
});

server.put('/sessions', (req, res) => {
	console.log(chalk.green("PUT /sessions") + "\n" + JSON.stringify(req.body));
	let session = req.body;

	const existingSession = db.get('sessions').find({ id: session.id }).value();
	if (existingSession == null) {
		session = createSession(session);
	} else {
		session = db.get('sessions').find({ id: session.id }).assign(req.body).write();
	}

	res.send(session);
});

server.get('/sessions/:id', (req, res) => {
	console.log(chalk.green("GET /sessions/:id"));

	const existingSession = db.get('sessions').find({ id: req.params.id }).value();

	if (existingSession == null) {
		res.status(404).send();
	} else {
		res.send(existingSession);
	}
});

function createSession(session) {
	removeAll();

	session.id = session.id || guid();
	session.created = moment().format('YYYY-MM-DDTHH:mm:ss');

	db.get('sessions').push(session).write();

	return session;
}

function removeAll() {
	console.log(chalk.red("remove all"));
	db.get('sessions').remove(() => true).write();
	db.get('events').remove(() => true).write();
	db.get('logs').remove(() => true).write();
	db.get('networkLogs').remove(() => true).write();
};

server.post('/logs', (req, res) => {
	console.log(chalk.green("POST /logs") + "\n" + JSON.stringify(req.body));
	const sessionId = req.params.sessionId;

	const log = req.body;
	log.id = guid();
	log.created = moment().format('YYYY-MM-DDTHH:mm:ss');

	db.get('logs').push(log).write();

	res.status(200).send();
});

server.post('/events', (req, res) => {
	console.log(chalk.green("POST /events") + "\n" + JSON.stringify(req.body));
	const sessionId = req.params.sessionId;

	const event = req.body;
	event.id = guid();
	event.created = moment().format('YYYY-MM-DDTHH:mm:ss');
	
	db.get('events').push(event).write();

	res.status(200).send();
});

server.post('/network_logs', (req, res) => {
	console.log(chalk.green("POST /network_logs") + "\n" + `${req.body.response.url}`);
	const sessionId = req.params.sessionId;

	const networkLog = req.body;
	networkLog.id = guid();
	networkLog.created = moment().format('YYYY-MM-DDTHH:mm:ss');
	
	db.get('networkLogs').push(networkLog).write();

	res.status(200).send();
});

server.post('/upload', upload.single('photo'), (req, res) => {
	res.status(200).send();
});

const port = '8083';
server.listen(port, () => {
	console.log(`listening on port ${port}`);
});