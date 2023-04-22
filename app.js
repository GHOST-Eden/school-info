const express = require("express");
const app = express();
const path = require('path')
const bodyParser = require('body-parser');
const School = require('school-kr')
const school = new School();
const fs = require('fs');

const server_port = 30001;

app.listen(server_port, () => {
    console.log(`{ Server started on port ${server_port} }`)
});

const Stid = {
	"KINDERGARTEN": School.Type.KINDERGARTEN,
	"ELEMENTARY": School.Type.ELEMENTARY,
	"MIDDLE": School.Type.MIDDLE,
	"HIGH": School.Type.HIGH
}
const Slid = {
	"SEOUL": School.Region.SEOUL,
	"INCHEON": School.Region.INCHEON,
	"BUSAN": School.Region.BUSAN,
	"GWANGJU": School.Region.GWANGJU,
	"DAEJEON": School.Region.DAEJEON,
	"DEAGU": School.Region.DEAGU,
	"SEJONG": School.Region.SEJONG,
	"ULSAN": School.Region.ULSAN,
	"GYEONGGI": School.Region.GYEONGGI,
	"KANGWON": School.Region.KANGWON,
	"CHUNGBUK": School.Region.CHUNGBUK,
	"CHUNGNAM": School.Region.CHUNGNAM,
	"GYEONGBUK": School.Region.GYEONGBUK,
	"GYEONGNAM": School.Region.GYEONGNAM,
	"JEONBUK": School.Region.JEONBUK,
	"JEONNAM": School.Region.JEONNAM,
	"JEJU": School.Region.JEJU
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const logDirectory = path.join(__dirname, 'logs');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

app.use((req, res, next) => {
	const koreanOptions = {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	};
	const koreanDate = new Date().toLocaleString('en-US', koreanOptions);
	const forwardedFor = req.headers['x-forwarded-for'];
	const ip = forwardedFor ? forwardedFor.split(',')[0] : req.socket.remoteAddress || req.socket.remoteAddress;
	const maskedIp = ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.XXX.XXX.$4');
	const log = `${new Date(koreanDate).toISOString()} ${req.method} ${req.originalUrl} ${ip}, [statusCode:${res.statusCode}]\n`;
	const maskeLog = `${new Date(koreanDate).toISOString()} ${req.method} ${req.originalUrl} ${maskedIp}, [statusCode:${res.statusCode}]\n`;

	accessLogStream.write(log, () => {
		console.log(maskeLog);
	});
	next();
});

app.use('/module', express.static(__dirname + "/module"));
app.use('/html-Search', express.static(__dirname + "/html/search.html"));
app.use('/html-Calendar', express.static(__dirname + "/html/index.html"));
app.use('/html-Error', express.static(__dirname + "'/html/error.html'"));
app.use('/dist', express.static(__dirname + "/dist"));
app.use('/node_modules', express.static(__dirname + "/node_modules"));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.redirect('/html-Search')
});

app.post('/search', async (req, res) => {
	const sN_s = await req.body.schoolName;
	const sT_s = await Stid[req.body.schoolType];
	const sL_s = await Slid[req.body.location];
    const result = await school.search(sL_s, sN_s);
    res.send(result);
});

var sN, sC, sL, sT;

app.post('/Calendar', async (req, res) => {
	
	sN = await req.body.schoolName;
	sT = await Stid[req.body.schoolType];
	sL = await Slid[req.body.location];
	
	const result = await school.search(sL, sN);
	sC = result[0].schoolCode;
	
	school.init(sT, sL, sC);
	
	const meal = await school.getMeal();
	const calendar = await school.getCalendar();

	res.sendFile(__dirname+'/dist/index.global.js');
	
	app.post('/Calendar-info', async (req, res) => {
		const year = await req.body.year_a;
		const month = await req.body.month_a;
			
		school.init(sT, sL, sC);
			
		const mealC = await school.getMeal(year, month);
		const calendarC = await school.getCalendar(year, month);
			
		res.json({"meal": mealC, "calendar": calendarC})
	});
});