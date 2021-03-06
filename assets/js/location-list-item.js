'use strict';

window.oasis = window.oasis || {};

(function() {

	function toggleDetailsOnPress(element, elementID) {
		// Hide the details until the link is pressed
		let link = element.querySelector('a[href="#' + elementID + '"]');
		let details = element.querySelector('#' + elementID);
		if (link && details) {
			details.classList.add('inactive');
			link.addEventListener('click', function(e) {
				details.classList.remove('inactive');
				details.classList.add('active');
				e.preventDefault();
				link.classList.add('disabled');
				details.scrollIntoView(false);
			}, false);
		}
	}

	function addDataAttribute(element, data, attribute) {
		let dt = element.querySelector('dt.' + attribute);
		let dd = element.querySelector('dd.' + attribute);
		if (data[attribute]) {
			if (attribute === 'website') {
				dd.innerHTML = '<a href="' + data[attribute] + '">' + data[attribute] + '</a>';
			} else {
				dd.innerHTML = data[attribute];
			}
		} else {
			dt.parentNode.removeChild(dt);
			dd.parentNode.removeChild(dd);
		}
	}

	function formatTime(timeString) { // Example: 1430 ==> 2:30pm; 0900 ==> 9:00am
		let hours   = Number(timeString.substring(0, timeString.length - 2));
		let minutes = timeString.substring(timeString.length - 2);
		let ampm = 'am';
		if (hours >= 12 && hours < 24) {
			ampm = 'pm';
		}
		if (hours >= 13) {
			hours = hours - 12;
		}
		return hours + ((minutes != '00') ? ":" + minutes : '') + ampm;
	}

	function createListItem(data, containerTagName, detailed) {

		let template = document.getElementById('list-item-template' + ((detailed) ? '-detailed' : ''));
		if (template) {
			let element = document.createElement(containerTagName);
			let category = data.category.toLowerCase().replace(/\s/g, '-'); // Example: farmers-market
			element.innerHTML = template.innerHTML;
			element.className = category;

			switch(category) {
				case 'supermarket':
				case 'restaurant':
				case 'pop-up-market':
				case 'farmers-market':
					element.className += ' buy';
					break;
				case 'summer-lunch':
				case 'food-pantry':
				case 'orchard':
					element.className += ' free';
					break;
				case 'community-garden':
					element.className += ' grow';
					break;
				default:
			}

			// Name
			let nameElement = element.querySelector('h2');
			nameElement.textContent = data.name;

			let params = [];
			if (PAGE_PARAMETERS.type) params.push('type=' + PAGE_PARAMETERS.type);
			if (PAGE_PARAMETERS.address) params.push('address=' + PAGE_PARAMETERS.address);
			if (PAGE_PARAMETERS.deserts) params.push('deserts=' + PAGE_PARAMETERS.deserts);
			if (PAGE_PARAMETERS.open) params.push('open=' + PAGE_PARAMETERS.open);
			if (PAGE_PARAMETERS.open_start) params.push('open_start=' + PAGE_PARAMETERS.open_start);

			let queryString = params.join('&');

			let link = element.querySelector('a');
			link.setAttribute('href', data.uri + '?' + queryString);
			link.addEventListener('click', function(e) {

				// If the user wants to open the link in a new window, let the browser handle it.
				if (e && (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) return;

				if (!detailed) {
					// Pretend that a map point was clicked
					let success = window.oasis.simulateMapPointClick(data);

					if (success) {
						// Scroll to the top of the page, since the page content has changed.
						window.scrollTo(0, 0);
						e.preventDefault();
					}
				}
			}, false);

			// Category (Type)
			let typeElement = element.querySelector('.type');
			typeElement.textContent = data.category;
			let img = element.querySelector('.location-summary img');

			// SHIM: Should we handle this in the CSS instead?
			if (category == 'food-pantry' ||
				category == 'summer-lunch' ||
				category == 'community-garden' ||
				category == 'farmers-market' ||
				category == 'supermarket' ||
				category == 'restaurant' ||
				category == 'orchard' ||
				category == 'pop-up-market') {
				img.src = "/assets/images/home/" + category + ".svg";
			} else if (category == 'cultivate-la') {
				img.src = "/assets/images/home/community-garden.svg";
			} else {
				img.src = "/assets/images/home/restaurant.svg";
			}

			// Address
			let address = data.address_1;
			if (data.address_2 && data.address_2 != '') address += '<br />' + data.address_2;
			if (detailed) address += '<br />' + data.city + ', California ' + data.zip;
			element.querySelector('.address').innerHTML = address;

			// Open Now
			let open = false;
			for (let index = 0; index < data.hours.length; index++) {
				if (window.oasis.isOpenNow(data.hours[index])) {
					open = true;
				}
			}
			if (!open) {
				let openNowElement = element.querySelector('.open');
				openNowElement.parentNode.removeChild(openNowElement);
			}

			// Distance
			if (data.travelDistance) element.querySelector('.distance span').innerHTML = window.oasis.getDistanceForPresentation(data.travelDistance);

			if (detailed) {
				addDataAttribute(element, data, 'website');
				addDataAttribute(element, data, 'phone');
				addDataAttribute(element, data, 'twitter');
				addDataAttribute(element, data, 'instagram');
				addDataAttribute(element, data, 'facebook');

				element.querySelector('.shareable-link input').value = 'https://foodoasis.la' + data.uri;

				let directionsPasteable = 
				data.name      + '\r\n' +
				data.address_1 + '\r\n';
				if (data.address_2 && data.address_2 !== '') {
					directionsPasteable += data.address_2 + '\r\n';
				}
				directionsPasteable += data.city + ', California ' + data.zip;
				element.querySelector('.directions textarea').value = directionsPasteable;

				let directionsURL = data.latitude + ',' + data.longitude + ',' + data.name + ' ' + data.address_1;
				if (data.address_2 && data.address_2 !== '') {
					directionsURL += ' ' + data.address_2;
				}
				directionsURL += ' ' + data.city + ', California ' + data.zip;
				element.querySelector('.directions a').href = 'https://maps.google.com/maps?q=' + encodeURIComponent(directionsURL);

				element.querySelector('.location-details-options .options').innerHTML = element.querySelector('.location-details-options .options').innerHTML.replace(/\{ data.name \}/g, data.name).replace(/\{ data.address_1 \}/g, data.address_1).replace(/\{ data.longitude \}/g, data.longitude).replace(/\{ data.latitude \}/g, data.latitude).replace(/\{ data.uri \}/g, data.uri).replace(/\{ data.category \}/g, data.category);

				if (data.season_open && data.season_open != '' && data.season_close && data.season_close != '') {
					element.querySelector('.dates p').innerHTML = data.season_open + ' – ' + data.season_close;
				} else {
					element.querySelector('.dates').parentNode.removeChild(element.querySelector('.dates'));
				}

				// Add a message encouraging the visitor to call ahead before visiting a location.
				if (data.phone != '') {
					element.querySelector('.note p').innerHTML = `
						Before you visit, please call this location’s phone number: ${data.phone} and ask them for their address and hours.
					`;
				} else {
					element.querySelector('.note p').innerHTML = `
						Before you visit, please contact this location and ask them for their address and hours.
					`;
				}

				let hoursHTML = '';
				let dt;
				let dd;

				for (let index = 0; index < data.hours.length; index++) {

					dt = document.createElement('dt');
					dt.innerHTML = data.hours[index].day;

					switch (data.hours[index].day.trim().toLowerCase()) {
						case 'mon':
							dt.innerHTML = 'Monday';
							break;
						case 'tue':
							dt.innerHTML = 'Tuesday';
							break;
						case 'wed':
							dt.innerHTML = 'Wednesday';
							break;
						case 'thu':
							dt.innerHTML = 'Thursday';
							break;
						case 'fri':
							dt.innerHTML = 'Friday';
							break;
						case 'sat':
							dt.innerHTML = 'Saturday';
							break;
						case 'sun':
							dt.innerHTML = 'Sunday';
							break;
					}

					element.querySelector('.hours dl').appendChild(dt);

					dd = document.createElement('dd');
					dd.innerHTML = data.hours[index].open === '' ? '<i>Closed</i>' : '<span>' + formatTime(data.hours[index].open) + ' – ' + formatTime(data.hours[index].close) + '</span>';
					element.querySelector('.hours dl').appendChild(dd);

					if (window.oasis.isOpenNow(data.hours[index])) {
						dt.className = 'open';
						dd.className = 'open';
						dd.innerHTML = dd.innerHTML + ' <i>Open Now</i>';
					}
				}

				if (!dt) {
					element.querySelector('.hours').parentNode.removeChild(element.querySelector('.hours'));
				}

				if (data.content) {
					element.querySelector('.content').innerHTML = data.content;
				}

				toggleDetailsOnPress(element, 'shareable-link');
				toggleDetailsOnPress(element, 'directions');
			}

			return element;
		}
	}

	let sortedLocations;
	function addListItems(locations) {
		sortedLocations = locations;
		let limit = window.oasis.getParameterByName('limit') || itemsPerPage;
		if (!limit) {
			limit = 10;
		}
		limit = Number(limit);
		let start = window.listOffset || 0;
		limit += start;
		if (limit >= sortedLocations.length) limit = locations.length;
		let list = document.querySelector('ul.location-list');

		let limitedList = sortedLocations.slice(start, start + limit + 1);
		limitedList.sort(function(a, b) {
			if (a.travelDistance > b.travelDistance) {
				return 1;
			}
			if (a.travelDistance < b.travelDistance) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});

		if (list) {
			list.innerHTML = '';
			for (let index = 0; index < limitedList.length; index++) {
				list.appendChild(createListItem(limitedList[index], 'li'));
			}
		}

		if (sortedLocations.length < 1) {
			let template = document.getElementById('no-results-template');
			let map = document.getElementById('map');
			if (template && map) {
				let div = document.createElement('div');
				div.innerHTML = template.innerHTML;
				map.parentNode.insertBefore(div, map);
			}
		}
	}

	window.oasis.createListItem = createListItem;
	window.oasis.addListItems = addListItems;
})();
