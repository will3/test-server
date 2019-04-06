const express = require('express');
const server = express();
const chalk = require('chalk');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const moment = require('moment');
const guid = require('uuid/v1');

db.defaults({ sessions: [], logs: [], events: [] }).write();

server.use(express.json());

server.post('/sessions', (req, res) => {
	const session = {
		id: guid(),
		created: moment().format('YYYY-MM-DDTHH:mm:ss')
	};

	db.get('sessions').push(session).write();

	res.send(session);
});

server.post('/logs', (req, res) => {
	const sessionId = req.params.sessionId;

	db.get('logs').push(req.body).write();

	res.status(200).send();
});

server.post('/events', (req, res) => {
	const sessionId = req.params.sessionId;
	
	db.get('events').push(req.body).write();

	res.status(200).send();
});

const port = '8083';
server.listen(port, () => {
	console.log(`listening on port ${port}`);
});