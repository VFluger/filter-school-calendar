/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
const ics = require('ics');
import ical from 'ical';

export default {
	async fetch(request, env, ctx) {
		const resp = await fetch('https://classis.cgnr.cz/calendar/982ed8baf0bb7d245220884c43b8378c&noCache/calendar.ics');
		console.log('STATUS:', resp.status);
		let numOfEvents = 0;
		const data = await resp.text();
		const importedCalendar = ical.parseICS(data);
		const validEventsArr = [];
		const currDate = new Date();
		const mainRegex = /1.? ?a[^j]/i;
		const germanRegex = /1.? ?nj/i;
		const englishRegex = /1.? ?aj/i;
		for (let event in importedCalendar) {
			const eventObj = importedCalendar[event];
			if (eventObj.type !== 'VEVENT') {
				continue;
			}
			if (eventObj.start.getFullYear() !== currDate.getFullYear()) {
				continue;
			}
			// TODO: change to 2.A
			if (mainRegex.test(eventObj.description)) {
				numOfEvents++;
				validEventsArr.push({
					start: [eventObj.start.getFullYear(), eventObj.start.getMonth() + 1, eventObj.start.getDate()],
					end: [eventObj.end.getFullYear(), eventObj.end.getMonth() + 1, eventObj.end.getDate()],
					title: eventObj.description,
					status: eventObj.status,
					uid: eventObj.uid,
				});
				continue;
			}
			if (germanRegex.test(eventObj.description)) {
				numOfEvents++;
				validEventsArr.push({
					start: [eventObj.start.getFullYear(), eventObj.start.getMonth() + 1, eventObj.start.getDate()],
					end: [eventObj.end.getFullYear(), eventObj.end.getMonth() + 1, eventObj.end.getDate()],
					title: eventObj.description,
					status: eventObj.status,
					uid: eventObj.uid,
				});
				continue;
			}
			if (englishRegex.test(eventObj.description)) {
				numOfEvents++;
				validEventsArr.push({
					start: [eventObj.start.getFullYear(), eventObj.start.getMonth() + 1, eventObj.start.getDate()],
					end: [eventObj.end.getFullYear(), eventObj.end.getMonth() + 1, eventObj.end.getDate()],
					title: eventObj.description,
					status: eventObj.status,
					uid: eventObj.uid,
				});
				continue;
			}
		}
		console.log('\n Number of Filtered Events: ', numOfEvents);
		const { error, value } = ics.createEvents(validEventsArr);
		const outputCalendar = value;
		if (error) {
			console.error('ERROR: ', error);
			return;
		}
		return new Response(outputCalendar);
	},
};
