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
            // ----------check if user already booked start-------------
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
