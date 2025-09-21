/* globals APP_CONFIG */

(function () {
	const form = document.getElementById('searchForm');
	const keywordInput = document.getElementById('keyword');
	const distanceInput = document.getElementById('distance');
	const categorySelect = document.getElementById('category');
	const locationField = document.getElementById('locationField');
	const locationInput = document.getElementById('location');
	const autoDetect = document.getElementById('autoDetect');
	const searchBtn = document.getElementById('searchBtn');
	const clearBtn = document.getElementById('clearBtn');
	const resultsSection = document.getElementById('resultsSection');
	const resultsContainer = document.getElementById('resultsContainer');
	const detailsSection = document.getElementById('detailsSection');
	const detailsContainer = document.getElementById('detailsContainer');

	const GOOGLE_API_KEY = (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY) || '';
	const IPINFO_TOKEN = (window.APP_CONFIG && window.APP_CONFIG.IPINFO_TOKEN) || '';

	function setError(el, message) {
		const err = el.parentElement.querySelector('.error');
		if (err) err.textContent = message || '';
	}

	function clearErrors() {
		setError(keywordInput, '');
		setError(locationInput, '');
		// category is optional (Default means all)
	}

	function toggleResults(show) {
		resultsSection.style.display = show ? 'block' : 'none';
	}

	function toggleDetails(show) {
		detailsSection.style.display = show ? 'block' : 'none';
	}

	function validateForm() {
		let valid = true;
		clearErrors();
		if (!keywordInput.value.trim()) {
			setError(keywordInput, 'Please enter a keyword.');
			valid = false;
		}
		// category validation removed; 'default' means all categories
		if (!autoDetect.checked) {
			if (!locationInput.value.trim()) {
				setError(locationInput, 'Please enter a location or check auto-detect.');
				valid = false;
			}
		}
		return valid;
	}

	function extractJsonFromJsonp(text) {
		const match = text.match(/\{[\s\S]*\}/);
		if (!match) return null;
		try { return JSON.parse(match[0]); } catch (e) { return null; }
	}

	async function fetchIpInfo() {
		if (!IPINFO_TOKEN) return null;
		const url = `https://ipinfo.io/?token=${encodeURIComponent(IPINFO_TOKEN)}`;
		try {
			const resp = await fetch(url, { method: 'GET' });
			const text = await resp.text();
			let data = null;
			try { data = JSON.parse(text); } catch (e) { data = extractJsonFromJsonp(text); }
			return data;
		} catch (e) { return null; }
	}

	// Client-side geocoding removed; backend will geocode the location name

	function renderTable(records) {
		const rows = (records || []).map(r => {
			// Support both simplified mapped records and raw Ticketmaster event objects
			const isMapped = typeof r.dateTime === 'string' && (r.icon !== undefined || r.venue !== undefined);
			let id = r.id || '';
			let dateStr = '';
			let image = '';
			let name = r.name || '';
			let genre = '';
			let venue = '';

			if (isMapped) {
				dateStr = r.dateTime || '';
				image = r.icon || '';
				genre = r.genre || '';
				venue = r.venue || '';
			} else {
				const date = (r.dates && r.dates.start && r.dates.start.localDate) || '';
				const time = (r.dates && r.dates.start && r.dates.start.localTime) || '';
				dateStr = date + (time ? ' ' + time : '');
				image = (Array.isArray(r.images) && r.images[0] && r.images[0].url) ? r.images[0].url : '';
				genre = (r.classifications && r.classifications[0] && r.classifications[0].segment && r.classifications[0].segment.name) || '';
				venue = (r._embedded && r._embedded.venues && r._embedded.venues[0] && r._embedded.venues[0].name) || '';
			}

			return `
				<tr>
					<td class="hidden-column">${id}</td>
					<td>${dateStr}</td>
					<td>${image ? `<img src="${image}" alt="icon" style="width:56px;height:36px;object-fit:cover;border-radius:6px;"/>` : ''}</td>
					<td><a href="#" class="event-link" data-event-id="${id}">${name}</a></td>
					<td>${genre}</td>
					<td>${venue}</td>
				</tr>
			`;
		}).join('');

		const html = `
			<div class="table-wrap">
				<table id="resultsTable">
					<thead>
						<tr>
							<th class="hidden-column">ID</th>
							<th class="sortable" data-key="date">Date <span class="indicator">↕</span></th>
							<th>Icon</th>
							<th class="sortable" data-key="event">Event <span class="indicator">↕</span></th>
							<th class="sortable" data-key="genre">Genre <span class="indicator">↕</span></th>
							<th class="sortable" data-key="venue">Venue <span class="indicator">↕</span></th>
						</tr>
					</thead>
					<tbody>
						${rows}
					</tbody>
				</table>
			</div>
		`;
		resultsContainer.innerHTML = html;
		attachRowHandlers();
		attachSortHandlers();
	}

	function attachRowHandlers() {
		resultsContainer.querySelectorAll('.event-link').forEach(a => {
			a.addEventListener('click', async (e) => {
				e.preventDefault();
				const id = a.getAttribute('data-event-id');
				if (!id) return;
				await loadEventDetails(id);
			});
		});
	}

	function getCellValue(tr, idx) {
		return tr.children[idx].textContent.trim();
	}

	function attachSortHandlers() {
		const table = document.getElementById('resultsTable');
		if (!table) return;
		const thead = table.querySelector('thead');
		const tbody = table.querySelector('tbody');
		let sortState = {};

		thead.querySelectorAll('th.sortable').forEach((th, i) => {
			th.addEventListener('click', () => {
				const idx = Array.from(th.parentNode.children).indexOf(th);
				const key = th.getAttribute('data-key');
				const dir = sortState[key] === 'asc' ? 'desc' : 'asc';
				sortState = { [key]: dir };
				const rows = Array.from(tbody.querySelectorAll('tr'));
				rows.sort((a, b) => {
					const A = getCellValue(a, idx).toLowerCase();
					const B = getCellValue(b, idx).toLowerCase();
					if (key === 'date') {
						const tA = Date.parse(A.replace(/\s+/g, 'T')) || 0;
						const tB = Date.parse(B.replace(/\s+/g, 'T')) || 0;
						return dir === 'asc' ? (tA - tB) : (tB - tA);
					}
					if (A < B) return dir === 'asc' ? -1 : 1;
					if (A > B) return dir === 'asc' ? 1 : -1;
					return 0;
				});
				rows.forEach(r => tbody.appendChild(r));
				// update indicators
				thead.querySelectorAll('.indicator').forEach(ind => ind.textContent = '↕');
				const ind = th.querySelector('.indicator');
				if (ind) ind.textContent = dir === 'asc' ? '↑' : '↓';
			});
		});
	}

	function formatTicketStatus(code) {
		if (!code) return '';
		const lc = String(code).toLowerCase();
		switch (lc) {
			case 'onsale': return '<span class="badge green">On Sale</span>';
			case 'offsale': return '<span class="badge red">Off Sale</span>';
			case 'canceled': return '<span class="badge black">Canceled</span>';
			case 'postponed': return '<span class="badge orange">Postponed</span>';
			case 'rescheduled': return '<span class="badge orange">Rescheduled</span>';
			default: return `<span class="badge">${code}</span>`;
		}
	}

	function extractGenres(classifications) {
		if (!Array.isArray(classifications)) return '';
		const set = new Set();
		for (const c of classifications) {
			const seg = c && c.segment && c.segment.name;
			const gen = c && c.genre && c.genre.name;
			const sub = c && c.subGenre && c.subGenre.name;
			const typ = c && c.type && c.type.name;
			const subtyp = c && c.subType && c.subType.name;
			[seg, gen, sub, typ, subtyp].forEach(v => {
				if (!v) return;
				const s = String(v).trim();
				if (!s || s.toLowerCase() === 'undefined') return;
				set.add(s);
			});
		}
		return Array.from(set).join(' | ');
	}

	async function loadEventDetails(id) {
		detailsContainer.innerHTML = '<div class="no-records">Loading details...</div>';
		toggleDetails(true);
		try {
			const resp = await fetch(`/api/event/${encodeURIComponent(id)}`);
			if (!resp.ok) throw new Error('Failed');
			const data = await resp.json();
			renderDetails(data);
			detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} catch (e) {
			detailsContainer.innerHTML = '<div class="no-records">Failed to load details.</div>';
		}
	}

	function renderDetails(d) {
		const title = d && d.name ? d.name : 'Event';
		const start = d && d.dates && d.dates.start || {};
		const dateStr = [start.localDate || '', start.localTime || ''].filter(Boolean).join(' ');
		let artists = [];
		if (d && d._embedded && Array.isArray(d._embedded.attractions)) {
			artists = d._embedded.attractions.map(a => {
				const name = a && a.name ? a.name : '';
				const url = a && a.url ? a.url : '';
				return url ? `<a href="${url}" target="_blank" rel="noopener">${name}</a>` : name;
			});
		}
		const venue = (d && d._embedded && d._embedded.venues && d._embedded.venues[0] && d._embedded.venues[0].name) || '';
		const genres = extractGenres(d && d.classifications);
		const ticketStatus = d && d.dates && d.dates.status && d.dates.status.code;
		const buyUrl = d && d.url ? d.url : '';
		const seatUrl = d && d.seatmap && d.seatmap.staticUrl ? d.seatmap.staticUrl : '';
		let priceText = '';
		if (Array.isArray(d && d.priceRanges) && d.priceRanges.length) {
			const pr = d.priceRanges[0];
			const min = pr.min != null ? pr.min : null;
			const max = pr.max != null ? pr.max : null;
			const cur = pr.currency || '';
			if (min != null && max != null) priceText = `${cur ? cur + ' ' : ''}${min} - ${max}`;
			else if (min != null) priceText = `${cur ? cur + ' ' : ''}${min}`;
			else if (max != null) priceText = `${cur ? cur + ' ' : ''}${max}`;
		}

		const rows = [];
		if (dateStr) rows.push(['Date', dateStr]);
		if (artists.length) rows.push(['Artist / Team', artists.join(' | ')]);
		if (venue) rows.push(['Venue', venue]);
		if (genres) rows.push(['Genres', genres]);
		if (priceText) rows.push(['Price Ranges', priceText]);
		if (ticketStatus) rows.push(['Ticket Status', formatTicketStatus(ticketStatus)]);
		if (buyUrl) rows.push(['Buy Ticket At', `<a href="${buyUrl}" target="_blank" rel="noopener">Ticketmaster</a>`]);

		const kvHtml = rows.map(([k, v]) => `<div class="key">${k}</div><div>${v}</div>`).join('');

		const left = `
			<h2 class="detail-title">${title}</h2>
			<div class="kv">${kvHtml}</div>
			<div style="margin-top:12px;">
				<button class="btn btn-clear" id="showVenueBtn">Show Venue Details</button>
			</div>
		`;

		const right = seatUrl ? `<div class="seat"><img src="${seatUrl}" alt="Seat Map"/></div>` : '';

		detailsContainer.innerHTML = `<div class="detail-card"><div>${left}</div>${right}</div><div id="venueContainer" style="margin-top:16px;"></div>`;

		const showVenueBtn = document.getElementById('showVenueBtn');
		if (showVenueBtn) {
			showVenueBtn.addEventListener('click', async () => {
				showVenueBtn.style.display = 'none';
				const venueName = venue;
				if (!venueName) return;
				await loadVenueDetails(venueName);
				document.getElementById('venueContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
	}

	async function loadVenueDetails(keyword) {
		const container = document.getElementById('venueContainer');
		container.innerHTML = '<div class="no-records">Loading venue details...</div>';
		try {
			const resp = await fetch(`/api/venue?keyword=${encodeURIComponent(keyword)}`);
			if (!resp.ok) throw new Error('Failed');
			const data = await resp.json();
			renderVenue(data);
		} catch (e) {
			container.innerHTML = '<div class="no-records">Failed to load venue details.</div>';
		}
	}

	function renderVenue(d) {
		const container = document.getElementById('venueContainer');
		const v = d && d._embedded && Array.isArray(d._embedded.venues) ? d._embedded.venues[0] : null;
		if (!v) {
			container.innerHTML = '<div class="no-records">No venue details found.</div>';
			return;
		}
		const name = v.name || 'N/A';
		const line1 = v.address && v.address.line1 ? v.address.line1 : 'N/A';
		const postal = v.postalCode || 'N/A';
		const city = v.city && v.city.name ? v.city.name : '';
		const state = v.state && v.state.stateCode ? v.state.stateCode : '';
		const cityState = [city, state].filter(Boolean).join(', ');
		const url = v.url || '';
		const queryText = [name, line1, city, state, postal].filter(Boolean).join(', ');
		const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;

		container.innerHTML = `
			<div class="table-wrap">
				<table>
					<tbody>
						<tr><th style="width:160px">Name</th><td>${name}</td></tr>
						<tr><th>Address</th><td>${line1}</td></tr>
						<tr><th>City</th><td>${cityState}</td></tr>
						<tr><th>Postal Code</th><td>${postal}</td></tr>
						<tr><th>Upcoming Events</th><td>${url ? `<a href="${url}" target="_blank" rel="noopener">More events at this venue</a>` : 'N/A'}</td></tr>
						<tr><th>Open in Maps</th><td><a href="${mapsUrl}" target="_blank" rel="noopener">View on Google Maps</a></td></tr>
					</tbody>
				</table>
			</div>
		`;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		toggleDetails(false);
		if (!validateForm()) return;

		let locationParam = '';
		if (autoDetect.checked) {
			const ipinfo = await fetchIpInfo();
			if (ipinfo) {
				const locText = [ipinfo.city || '', ipinfo.region || '', ipinfo.country || ''].filter(Boolean).join(', ');
				locationParam = locText || (ipinfo.loc || '');
			}
		} else {
			locationParam = locationInput.value.trim();
		}

		if (!locationParam) {
			setError(locationInput, 'Failed to determine location.');
			return;
		}

		const params = new URLSearchParams({
			keyword: keywordInput.value.trim(),
			radius: distanceInput.value.trim() || '10',
			segmentId: categorySelect.value || 'default',
			location: locationParam
		});

		resultsContainer.innerHTML = '<div class="no-records">Loading...</div>';
		toggleResults(true);

		try {
			const resp = await fetch(`/api/search?${params.toString()}`);
			if (!resp.ok) throw new Error('Search failed');
			const data = await resp.json();
			let events = [];
			if (data && Array.isArray(data.events)) {
				events = data.events;
			} else if (data && data._embedded && Array.isArray(data._embedded.events)) {
				events = data._embedded.events;
			}
			if (!events.length) {
				resultsContainer.innerHTML = '<div class="no-records">No records found</div>';
				return;
			}
			renderTable(events);
		} catch (e) {
			resultsContainer.innerHTML = '<div class="no-records">No records found</div>';
		}
	}

	function handleClear() {
		form.reset();
		keywordInput.value = '';
		distanceInput.value = '';
		categorySelect.value = 'default';
		locationInput.value = '';
		document.getElementById('lat').value = '';
		document.getElementById('lon').value = '';
		locationField.style.display = 'block';
		clearErrors();
		toggleResults(false);
		toggleDetails(false);
	}

	autoDetect.addEventListener('change', async () => {
		if (autoDetect.checked) {
			locationField.style.display = 'none';
			const ipinfo = await fetchIpInfo();
			if (ipinfo) {
				if (ipinfo.loc) {
					const [ilat, ilon] = ipinfo.loc.split(',');
					document.getElementById('lat').value = ilat;
					document.getElementById('lon').value = ilon;
				}
				const city = ipinfo.city || '';
				const region = ipinfo.region || '';
				const country = ipinfo.country || '';
				const locText = [city, region, country].filter(Boolean).join(', ');
				if (locText) locationInput.value = locText;
			}
		} else {
			locationField.style.display = 'block';
		}
	});

	form.addEventListener('submit', handleSubmit);
	clearBtn.addEventListener('click', handleClear);
})();


