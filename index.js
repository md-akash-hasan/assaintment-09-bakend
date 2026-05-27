const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT;

const uri = process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    let db = client.db("Assaintment-09");
    let carscollection = db.collection("allcars");

    app.get("/allcars", async (req, res) => {
      let result = await carscollection.find().toArray();
      res.send(result);
    });
    app.get("/allcars/:id", async (req, res) => {
      let { id } = await req.params;
      let result = await carscollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });
    app.get("/feature", async (req, res) => {
      let result = await carscollection.find().limit(3).toArray();
      res.send(result);
    });
    app.post("/addcar", async (req, res) => {
      let data = req.body;
      let result = await carscollection.insertOne(data);
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Is Rining!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
