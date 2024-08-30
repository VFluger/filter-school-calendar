const ics = require('ics');
import ical from 'ical';
import { Hono } from 'hono';

const app = new Hono();

const filterCalendar = async (mainRegex = /2.? ?a[^j]/i, germanRegex = /2.? ?nj/i, englishRegex = /2.? ?aj/i) => {
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

	//output calendar array
	const validEventsArr = [];

	for (let event in importedCalendar) {
		const eventObj = importedCalendar[event];
		//Error handling
		if (eventObj.type !== 'VEVENT') {
			continue;
		}
		//check only this year events
		if (eventObj.start.getFullYear() !== currDate.getFullYear()) {
			continue;
		}

		const outputObj = {
			start: [eventObj.start.getFullYear(), eventObj.start.getMonth() + 1, eventObj.start.getDate()],
			end: [eventObj.end.getFullYear(), eventObj.end.getMonth() + 1, eventObj.end.getDate()],
			title: eventObj.description,
			status: eventObj.status,
			uid: eventObj.uid,
		};

		//testing all regexes
		if (mainRegex) {
			if (mainRegex.test(eventObj.description)) {
				validEventsArr.push(outputObj);
				continue;
			}
		}
		if (germanRegex) {
			if (germanRegex.test(eventObj.description)) {
				validEventsArr.push(outputObj);
				continue;
			}
		}
		if (englishRegex) {
			if (englishRegex.test(eventObj.description)) {
				validEventsArr.push(outputObj);
				continue;
			}
		}
	}
	console.log('\n Number of Filtered Events: ', validEventsArr.length);
	const { error, value } = ics.createEvents(validEventsArr);
	const outputCalendar = value;
	if (error) {
		console.error('ERROR: ', error);
		return;
	}
	return outputCalendar;
};

app.get('/', async (c) => {
	return c.text(await filterCalendar());
});

app.get('/cela-trida', async (c) => {
	return c.text(await filterCalendar(/1.? ?a[^j]/i, false, false));
});

app.get('/skupina-1', async (c) => {
	return c.text(await filterCalendar(/1.? ?a[^j]/i, /1.? ?nj ?1/i, /1.? ?aj ?1/i));
});

app.get('/skupina-2', async (c) => {
	return c.text(await filterCalendar(/1.? ?a[^j]/i, /1.? ?nj ?2/i, /1.? ?aj ?2/i));
});

app.get('/skupina-3', async (c) => {
	return c.text(await filterCalendar(/1.? ?a[^j]/i, /1.? ?nj ?3/i, /1.? ?aj ?3/i));
});

export default app;
