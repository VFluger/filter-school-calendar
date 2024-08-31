const ics = require('ics');
import ical from 'ical';
import { Hono } from 'hono';

const app = new Hono();

const filterCalendar = async (query) => {
	// Fetch calendar from school website
	const resp = await fetch('https://classis.cgnr.cz/calendar/982ed8baf0bb7d245220884c43b8378c&noCache');
	console.log('STATUS:', resp.status);
	if (!resp.ok) {
		throw new Error('Error fetching calendar', resp.status);
	}
	//parse data
	const data = await resp.text();
	const importedCalendar = ical.parseICS(data);

	const currDate = new Date();
	let englishRegex;
	let germanRegex;
	//setting correct regexes
	if (query.aj) {
		if (query.aj[0] == 1) {
			englishRegex = /1.?aj1/i;
		} else if (query.aj[0] == 2) {
			englishRegex = /1.?aj2/i;
		} else if (query.aj[0] == 3) {
			englishRegex = /1.?aj3/i;
		}
	}
	if (query.nj) {
		if (query.nj[0] == 1) {
			germanRegex = /1.?nj1/i;
		} else if (query.nj[0] == 2) {
			germanRegex = /1.?nj2/i;
		} else if (query.nj[0] == 3) {
			germanRegex = /1.?nj3/i;
		}
	}
	const mainRegex = /1.?[^d]a[^j]/i;

	//output calendar array
	const validEventsArr = [];

	for (let event in importedCalendar) {
		const eventObj = importedCalendar[event];
		//Error handling
		if (eventObj.type !== 'VEVENT') {
			continue;
		}
		//check only this year events
		if (
			eventObj.start.getFullYear() === currDate.getFullYear() ||
			eventObj.start.getFullYear() === currDate.getFullYear() + 1 ||
			eventObj.start.getFullYear() === currDate.getFullYear() - 1
		) {
			const outputObj = {
				start: [eventObj.start.getFullYear(), eventObj.start.getMonth() + 1, eventObj.start.getDate()],
				end: [eventObj.end.getFullYear(), eventObj.end.getMonth() + 1, eventObj.end.getDate()],
				title: eventObj.description,
				status: eventObj.status,
				uid: eventObj.uid,
			};

			//testing all regexes
			if (mainRegex) {
				if (mainRegex.test(eventObj.description.replace(' ', ''))) {
					validEventsArr.push(outputObj);
					continue;
				}
			}
			if (germanRegex) {
				if (germanRegex.test(eventObj.description.replace(' ', ''))) {
					validEventsArr.push(outputObj);
					continue;
				}
			}
			if (englishRegex) {
				if (englishRegex.test(eventObj.description.replace(' ', ''))) {
					validEventsArr.push(outputObj);
					continue;
				}
			}
		}
	}
	console.log('number of events: ', validEventsArr.length);
	const { error, value } = ics.createEvents(validEventsArr);
	ics.calName = '2.A Testy kalendář';
	const outputCalendar = value;
	if (error) {
		console.error('ERROR: ', error);
		return;
	}
	return outputCalendar;
};

const test = () => {
	const html = `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link
			href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
			rel="stylesheet"
			integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
			crossorigin="anonymous"
		/>
		<style>
@import url('https://fonts.googleapis.com/css2?family=SUSE:wght@100..800&display=swap');
:root {
	--bg-color: #101213;
	--smooth-out-bezier: cubic-bezier(0.2, 0.8, 0.3, 0.95);
}
body {
	background-color: var(--bg-color);
	color: white;
	font-family: 'SUSE';
}
.hint {
	color: white;
	font-size: 0.8rem;
	position: relative;
	top: -5px;
	text-decoration: none;
}
.hint-box {
	display: none;
	width: 30%;
}
#spolecne-checkbox {
	position: relative;
	top: 1px;
}
.output-link {
	text-decoration: none;
	position: relative;
	top: 3px;
	color: rgba(255, 255, 255, 0.7);
	&:hover {
		text-decoration: underline;
	}
}
.output {
	background-color: rgba(255, 255, 255, 0.1);
	border-radius: 40px;
	padding: 4px;
	padding-left: 10px;
	margin-bottom: 10px;
	min-width: 70% !important;
}
.copy-btn {
	background-color: rgba(0, 0, 0, 0.35);
	padding: 10px;
	margin-left: 10px;
	border-radius: 40px;
	&:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}
}
.copy-btn-mobile {
	display: none;
}
@media (max-width: 780px) {
	.copy-btn-mobile {
		display: inline;
		width: fit-content;
		padding: 5px 10px;
		background-color: rgba(255, 255, 255, 0.1);
		transition: all 300ms var(--smooth-out-bezier);
		&:hover {
			background-color: rgba(255, 255, 255, 0.05);
		}
	}
	.copy-btn-desktop {
		display: none;
	}
	.output-link {
		position: static;
	}
	.output {
		padding: 10px 15px;
		font-size: 0.9rem;
	}
	.desc.desc {
		width: 90%;
	}
}
.blur-circle {
	border-radius: 50%;
	width: 500px;
	height: 500px;
	background-color: rgba(238, 255, 2, 0.13);
	position: fixed;
	left: -250px;
	top: -250px;
	filter: blur(90px);
}
.copied-msg {
	background-color: rgba(255, 255, 255, 0.2);
	padding: 5px 6px;
	padding-right: 8px;
	border-radius: 40px;
	position: relative;
	top: -2px;
}
.copy-msg-container {
	transform: translateY(-50px);
	opacity: 0;
	pointer-events: none;
	transition: transform 300ms var(--smooth-out-bezier), opacity 300ms var(--smooth-out-bezier) 50ms;
}
.fa-circle-check {
	margin-right: 3px;
}
.desc {
	width: 50%;
	margin: 0 auto;
}
ol {
	width: fit-content;
	margin: 20px auto;
}
.info-text {
	color: rgba(255, 255, 255, 0.5);
	font-size: 0.9rem;
}
footer a {
	color: white;
	text-decoration: none;
}
.add-btn {
	background-color: rgba(255, 255, 255, 0.1);
	border-radius: 40px;
	transition: all 300ms var(--smooth-out-bezier);
	&:hover {
		background-color: rgba(255, 255, 255, 0.05);
		color: rgb(255, 255, 107);
	}
	&:active {
		border: 2px solid rgb(255, 255, 107) !important;
	}
}
.fa-calendar-o {
	margin-right: 5px;
}
		</style>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
		<script>
		$(document).ready(() => {
	const showUrl = (queries, showAll = false) => {
		const baseUrl = 'webcal://filter-school-calendar.vojtech-fluger.workers.dev';
		if (showAll) {
			return baseUrl + '/spolecne';
		}
		let outputQuery;
		if (queries.aj) {
			outputQuery = '?aj=' + queries.aj;
		}
		if (queries.nj) {
			outputQuery = '?nj=' + queries.nj;
		}
		if (queries.aj && queries.nj) {
			outputQuery = '?aj=' + queries.aj + '&nj=' + queries.nj;
		}
		return baseUrl + outputQuery;
	};
	let queries = {};
	const updateQueryObject = (e) => {
		queries.aj = $('#aj-select option:selected').index() + 1;
		queries.nj = $('#nj-select option:selected').index() + 1;
		const queryOutput = showUrl(queries);
		$('.output-link').text(queryOutput).prop('href', queryOutput);
		$('.add-btn').prop('href', queryOutput);
	};
	updateQueryObject();
	$('select').on('change', updateQueryObject);

	const updateCheckbox = () => {
		if ($('#spolecne-checkbox:checked')[0]) {
			$('select').prop('disabled', true);
			const queryOutput = showUrl(queries, true);
			$('.output-link').text(queryOutput).prop('href', queryOutput);
			$('.add-btn').prop('href', queryOutput);
			$('.select-label').css('color', '#69696f');
			return;
		}
		$('.select-label').css('color', 'white');
		$('select').prop('disabled', false);
		updateQueryObject(queries);
	};
	updateCheckbox();
	$('#spolecne-checkbox').on('change', updateCheckbox);
	$('.copy-btn').on('click', () => {
		navigator.clipboard.writeText($('.output-link').attr('href')).then(
			function () {
				$('.copy-msg-container').css('opacity', 1);
				$('.copy-msg-container').css('transform', 'none');
				setTimeout(() => {
					$('.copy-msg-container').css('opacity', 0);
					$('.copy-msg-container').css('transform', 'translateY(-50px)');
				}, 2000);
			},
			function () {
				$('.copied-msg').html('<i class="fa fa-circle-xmark" style="color: #b30004"></i>Nepovedlo se zkopírovat odkaz');
				$('.copy-msg-container').css('opacity', 1);
				$('.copy-msg-container').css('transform', 'none');
				setTimeout(() => {
					$('.copy-msg-container').css('opacity', 0);
					$('.copy-msg-container').css('transform', 'translateY(-50px)');
				}, 2000);
			}
		);
	});
});

		</script>
		<script src="https://kit.fontawesome.com/9dc89b769e.js" crossorigin="anonymous"></script>
		<title>2.A Školní Kalendář</title>
	</head>
	<body data-bs-theme="dark">
		<div class="container-fluid">
			<h1 class="text-center my-3">2.A Školní Kalendář</h1>
			<p class="h5 desc text-center mb-4">Kalendář s testy pro třídu 2.A, různé verze pro všechny skupiny.</p>
			<p class="desc info-text text-center">
				Filtr má vysokou účinost, ale může něco vynechat. Doporučujeme požádat učitele, aby testy do classisu zapisoval přesně tak, jak je
				napsaná skupina (2.A, 2aj2, 2nj1). Pokud zaznamenáte, že chybí nějaký test, kontaktujte nás.
			</p>
			<h2 class="text-center mt-4">Jak na to?</h2>
			<ol class="mb-5">
				<li>Vyber si, jaké máš učitele z jakých předmětů</li>
				<li>Zkopíruj nebo klikni na "přídat do aplikace"</li>
				<li>Přidej nový "odběr kalendáře" ve své aplikaci</li>
			</ol>
			<div class="settings-container d-grid gap-2 container justify-content-center">
				<div class="d-flex justify-content-center gap-3 text-center">
					<div class="d-grid justify-content-center gap-1">
						<label class="select-label" for="aj-select">AJ skupina</label>
						<select id="aj-select">
							<option>Černíková (2aj1)</option>
							<option>Lugerová (2aj2)</option>
							<option>Svítková (2aj3)</option>
						</select>
					</div>
					<div class="d-grid justify-content-center gap-1">
						<label class="select-label" for="nj-select">NJ skupina</label>
						<select id="nj-select">
							<option>Moláček (2nj1)</option>
							<option>Máliková (2nj2)</option>
							<option>Kratochvílová (2nj3)</option>
						</select>
					</div>
				</div>
				<div class="d-flex justify-content-center gap-2">
					<input type="checkbox" id="spolecne-checkbox" />
					<label for="spolecne-checkbox">Chci pouze společné testy </label>
				</div>
				<p class="output mt-3"><a class="output-link" href=""></a><button class="btn copy-btn copy-btn-desktop">Kopírovat</button></p>
				<div class="text-center">
					<button class="btn copy-btn copy-btn-mobile">Kopírovat</button>
					<p></p>
					<a class="btn add-btn"><i class="fa fa-calendar-o" aria-hidden="true"></i> Přidat kalendář do aplikace</a>
				</div>
				<p class="text-center copy-msg-container">
					<span class="copied-msg"><i id="copy-icon" class="fa fa-circle-check" style="color: #0da10a"></i> Zkopírováno do schránky</span>
				</p>
			</div>
		</div>
		<footer class="d-grid justify-content-center text-center">
			<a href="https://github.com/BestCactus/filter-school-calendar"><i class="fa fa-github fa-xl"></i> Github</a>
		</footer>
		<div class="blur-circle"></div>
	</body>
</html>

`;
	return html;
};

app.get('/', async (c) => {
	const ajGroup = c.req.query('aj');
	const njGroup = c.req.query('nj');
	if (ajGroup || njGroup) {
		return c.text(await filterCalendar(c.req.queries()));
	}
	return c.html(test());
});

app.get('/spolecne', async (c) => {
	return c.text(await filterCalendar(c.req.queries()));
});

export default app;
