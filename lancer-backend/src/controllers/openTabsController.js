
// This controller needs access to the `io` instance.
// We will pass it from the main index.js file.
let io_instance;

export function setSocketIO(io) {
	io_instance = io;
}

export async function openTabs(req, res) {
	try {
		const { urls } = req.body || {};
		if (!Array.isArray(urls) || !urls.length) {
			return res.status(400).json({ success: false, error: 'Missing urls array' });
		}

		if (io_instance) {
			io_instance.emit('open-tabs', { urls });
		}

		return res.status(200).json({ success: true, forwarded: urls.length });
	} catch (err) {
		console.error('POST /api/open-tabs error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}
