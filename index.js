const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const app = express();

app.use(express.json());
app.use(cors());

dotenv.config();

const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const jwks = createRemoteJWKSet(
  new URL(`${process.env.NEXT_PUBLIC_FONTENT_URL}/api/auth/jwks`),
);

// Improved Verify Middleware
const verify = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { payload } = await jwtVerify(token, jwks);
    req.user = payload; // যদি পরে ইউজার ইনফো লাগে
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db("Assaintment-09");
    const carscollection = db.collection("allcars");
    const bookingCarCollection = db.collection("Booking");

    console.log("Connected to MongoDB!");

    // ==================== Routes ====================

    // Create Booking
    app.post("/booking", verify, async (req, res) => {
      const data = req.body;
      const result = await bookingCarCollection.insertOne(data);
      res.json(result);
    });

    // Update total_booking count
    app.patch("/update/:id", verify, async (req, res) => {
      const { id } = req.params;
      const result = await carscollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { total_booking: 1 } },
      );
      res.json(result);
    });

    // Get user bookings
    app.get("/booking/:userEmail", verify, async (req, res) => {
      const { userEmail } = req.params;

      const result = await bookingCarCollection.find({ userEmail }).toArray();
      res.json(result);
    });

    // Get last added car by user
    app.get("/allcars/last", verify, async (req, res) => {
      const email = req.query.email;
      const result = await carscollection
        .find({ userEmail: email })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();
      res.send(result[0] || null);
    });

    // Get all cars by user (protected)
    app.get("/allcars/:userEmail", verify, async (req, res) => {
      const { userEmail } = req.params;
      const result = await carscollection.find({ userEmail }).toArray();
      res.json(result);
    });

    // Get all cars
    app.get("/allcars", async (req, res) => {
      const result = await carscollection.find().toArray();
      res.send(result);
    });

    // Get single car
    app.get("/allcar/:id", verify, async (req, res) => {
      const { id } = req.params;
      const result = await carscollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // Featured cars
    app.get("/feature", async (req, res) => {
      const result = await carscollection.find().limit(6).toArray();
      res.send(result);
    });

    // Add new car (protected)
    app.post("/addcar", verify, async (req, res) => {
      const data = req.body;
      const result = await carscollection.insertOne(data);
      res.json(result);
    });

    // Update car
    app.patch("/allcar/:id", verify, async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const result = await carscollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data },
      );
      res.json(result);
    });

    // Delete car
    app.delete("/allcars/:id", verify, async (req, res) => {
      const { id } = req.params;
      const result = await carscollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // Delete booking
    app.delete("/booking/:id", verify, async (req, res) => {
      const { id } = req.params;
      const result = await bookingCarCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // Root route
    app.get("/", (req, res) => {
      res.send("Server Is Running!");
    });
  } finally {
    // await client.close(); // শুধু ডেভেলপমেন্টে খুলে রাখুন
  }
}

run().catch(console.dir);

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
