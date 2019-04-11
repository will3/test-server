const express = require('express');
const server = express();
const chalk = require('chalk');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const moment = require('moment');
const guid = require('uuid/v1');
const bodyParser= require('body-parser');

db.defaults({ sessions: [], events: [], networkLogs: [] }).write();

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

	const session = db.get('sessions').find({ id: req.params.id }).value();

	if (session == null) {
		res.status(404).send();
		return;
	} 
	
	const sessionId = session.id;
	
	getSessionDetail(session);

	res.send(session);
});

function getSessionDetail(session) {
	const sessionId = session.id;
	session.events = db.get('events').filter({ sessionId }).value();
	session.networkLogs = db.get('networkLogs').filter({ sessionId }).value();

	session.transcribe = getTranscribe(session);
};

function getTranscribe(session) {
	const lines = [];

	let changeTextEvent = null;

	for (let i = 0; i < session.events.length; i ++) {
		const event = session.events[i];

		if (event.type === 'press') {
			lines.push(`await spec.press("${event.identifier}");`);
		}

		if (event.type === 'changeText') {
			changeTextEvent = event;
		}

		if (changeTextEvent != null && event.type !== 'changeText') {
			lines.push(`await spec.fillIn("${event.identifier}", "${changeTextEvent.text}");`);
			changeTextEvent = null;
		}
	}

	return lines;
};

function createSession(session) {
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

const port = '8083';
server.listen(port, () => {
	console.log(`listening on port ${port}`);
});