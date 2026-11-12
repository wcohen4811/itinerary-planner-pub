import 'dotenv/config';
import { createServer } from './server.js';
import { ensureSampleItineraries } from './services/sampleItineraries.js';
const port = Number(process.env.PORT ?? 3001);
const app = createServer();
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
    ensureSampleItineraries()
        .then((created) => {
        if (created > 0)
            console.log(`Added ${created} sample ${created === 1 ? 'itinerary' : 'itineraries'}`);
    })
        .catch((err) => {
        console.error('Sample itineraries were not added', err);
    });
});
