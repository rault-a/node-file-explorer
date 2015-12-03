'use strict';

var express = require('express'),
	app = express(),
	path = require('path'),
	fs = require('fs'),
	basicAuth = require('basic-auth-connect');

var publicDir = path.join(__dirname, 'public'),
	username = process.env.USERNAME,
	password = process.env.PASSWORD;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(basicAuth(username, password));
app.use(express.static(publicDir, {
	maxAge: 86400000
}));

app.locals.moment = require('moment');

function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024;
	if (bytes < thresh) {
		return bytes + ' o';
	}
	var units = si ? ['ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'] : ['kio', 'MiB', 'Gio', 'Tio', 'Pio', 'Eio', 'Zio', 'Yio'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (bytes >= thresh);
	return bytes.toFixed(1) + ' ' + units[u];
}

function list(directory, callback) {
	var filesList = {};
	fs.readdir(directory, function (err, files) {
		if (err || files === undefined) {
			callback({});
			return;
		}
		files.forEach(function (file) {
			var stats = fs.statSync(path.join(directory, file));
			filesList[file] = {
				isDir: stats.isDirectory(),
				size: humanFileSize(stats.size, true),
				creation: stats.ctime,
				modification: stats.mtime
			};
		});
		callback(filesList);
	});
}

app.get('/*', function (req, res) {
	list(path.join(publicDir, req.params[0]), function (files) {
		res.render('index', {
			title: process.env.TITLE,
			currentDir: req.params[0],
			subDir: req.params[0] !== '',
			files: files
		});
	});
});

app.listen(process.env.PORT || 8002);
