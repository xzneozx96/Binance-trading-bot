const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const socketIo = require('socket.io');
const { usdtPairs } = require('./config/constant');
const { websocketStreamClient } = require('./services/kline');

const app = express();

const config = require('./config');
const fileUpload = require('./middleware/fileUpload');

const PORT = config.serverPort;

// register routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const wallerRoutes = require('./routes/wallet');

// middlewares registration

// cross origin resource sharing
const allowedDomains = [config.deployedDomain, config.frontendDomain];
const corsOptions = {
	origin: function (origin, callback) {
		// bypass the requests with no origin (like curl requests, mobile apps, etc )
		if (!origin) return callback(null, true);

		if (allowedDomains.indexOf(origin) === -1) {
			const msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
			return callback(new Error(msg), false);
		}
		return callback(null, true);
	},
	credentials: true, //access-control-allow-credentials:true
};
app.use(cors(corsOptions));

// built-in middleware to handle url-encoded data - also called form data so to say
app.use(express.urlencoded({ extended: true }));

// built-in middleware to handle json data submitted via the url
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

// Define a route for file uploads.
app.post('/api/upload', fileUpload.filesUpload.array('files'), (req, res) => {
	const uploadedFiles = req.files.map((file) => ({
		originalname: file.originalname,
		filename: file.filename,
		path: file.path,
	}));

	return res.status(201).json({
		success: true,
		data: {
			total: uploadedFiles.length,
			files: uploadedFiles,
		},
	});
});

// Serve uploaded files statically.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes registration
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wallet', wallerRoutes);

// app.use(verifyJWT);

// connecting to MongoAtlas via Mongoose
mongoose
	.connect(config.dbURI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		// set up socket server
		const myServer = http.createServer(app);

		// setup socket events for stopwatch
		const io = socketIo(myServer);

		app.set('io', io);

		io.on('connection', (socket) => {
			console.log('Client connected');

			socket.on('updateTimer', (data) => {
				taskTimerService.updateTaskTimer(data);
			});

			socket.on('disconnect', () => {
				console.log('Client disconnected');
			});
		});

		myServer.listen(PORT);

		console.log('Database has been connected ! Server listening on port 3500');
		return Promise.resolve('Database connected');
	})
	.then(() => {
		// subscribe to Binance tickers
		usdtPairs.forEach((pair, index) => {
			if (index < 3) {
				const { symbol } = pair;
				websocketStreamClient.kline(symbol, '5m');
			}
		});
	})
	.catch((err) => {
		console.log('Connecting to DB has failed', err);
		return Promise.reject('Internal Server Error');
	});
