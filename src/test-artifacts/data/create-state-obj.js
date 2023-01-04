import clonedeep from 'lodash.clonedeep';

const sourceData = {
	_id: '639737cc5ac1df69cda79413',
	about: 'Eu deserunt proident id id eu veniam enim qui nostrud eu sit. Aliquip pariatur non cillum adipisicing nisi officia culpa commodo fugiat anim. Exercitation culpa id esse incididunt nostrud non adipisicing laboris labore ullamco. Consectetur Lorem culpa veniam cillum laboris irure aliquip qui sit dolore aute nostrud veniam.\r\n',
	address: '760 Midwood Street, Harborton, Massachusetts, 7547',
	age: 38,
	balance: '$3,311.66',
	company: 'VORTEXACO',
	email: 'ambersears@vortexaco.com',
	eyeColor: 'blue',
	favoriteFruit: 'banana',
	friends: [{
		id: 0,
		name: {
			first: 'Pollard',
			last: 'Hunter'
		}
	}, {
		id: 1,
		name: {
			first: 'Holly',
			last: 'Roberson'
		}
	}, {
		id: 2,
		name: {
			first: 'Carey',
			last: 'Osborne'
		}
	}],
	gender: 'female',
	greeting: 'Hello, Amber Sears! You have 1 unread messages.',
	guid: '628babfc-63c7-446a-8782-057d22ca286a',
	history: {
		places: [{
			city: 'Topeka',
			country: 'US',
			state: 'KS',
			year: '1997 - 2002'
		}, {
			city: 'Atlanta',
			country: 'US',
			state: 'GA',
			year: '2008'
		}, {
			city: 'Miami',
			country: 'US',
			state: 'FL',
			year: '2017'
		}]
	},
	isActive: false,
	latitude: 31.963572,
	longitude: -171.530547,
	name: {
		first: 'Amber',
		last: 'Sears'
	},
	phone: {
		area: '947',
		country: '+1',
		line: '2282',
		local: '552'
	},
	picture: 'http://placehold.it/32x32',
	registered: {
		day: 18,
		month: 2,
		time: {
			hours: 9,
			minutes: 55,
			seconds: 46
		},
		timezone: '+08:00',
		year: 2016
	},
	tags: [
		'minim',
		'nisi',
		'dolor',
		'in',
		'ullamco',
		'laborum',
		'proident'
	]
};

/** @returns {SourceData} */
const createSourceData = () => clonedeep( sourceData );

export default createSourceData;

/** @typedef {typeof sourceData} SourceData */
