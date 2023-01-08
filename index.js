const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw037nl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// --------------------CRUD FUNCTION START----------------------
async function run() {
    try {
        const serviceCollection = client
            .db('doctorsPortal')
            .collection('services');
        const bookingCollection = client
            .db('doctorsPortal')
            .collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        // ------to get the booking collection data for reset the service depending on which one is booked-------
        //------disclaimer------ this is not the proper way to query
        //------disclaimer------ after learning more mongodb. use aggregate lookup, pipeline, match, group
        app.get('/available', async (req, res) => {
            const date = req.query.date || 'Jan 8, 2023';
            // step-1: get all services
            const services = await serviceCollection.find().toArray();
            // step-2: get the bookings of the day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            // step-3: for each service
            services.forEach((service) => {
                // step-4: find bookings for that service
                const serviceBookings = bookings.filter(
                    (b) => b.treatment === service.name
                );
                // step-5: select slots for the service booking
                const bookedSlots = serviceBookings.map((s) => s.slot);
                // step-6: select those slots that are not in bookedSlots
                const available = service.slots.filter(
                    (s) => !bookedSlots.includes(s)
                );
                // step-7: set available to make it easier
                service.slots = available;
            });
            res.send(services);
        });

        /**
         * API Naming Convention
         * app.get('/booking') ----get all bookings in this collection. or get more than one or by filter
         * app.get('/booking/:id') ----get a specific booking
         * app.post('/booking') ----add a new booking
         * app.patch('/booking/:id') ----update a booking
         * app.delete('/booking/:id') ----delete a booking
         */

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            // ----------check if user already booked start-----------
            const query = {
                treatment: booking.treatment,
                date: booking.date,
                patient: booking.patient,
            };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            // ----------check if user already booked end-------------
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        });
    } finally {
        //client.close();
    }
}
run().catch(console.dir);
// --------------------CRUD FUNCTION END----------------------

app.get('/', (req, res) => {
    res.send('Hello From Doctors Portal Server!');
});

app.listen(port, () => {
    console.log(`Doctors portal app listening on port ${port}`);
});
