const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ub65wqu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("cardoctorDB").collection("services");
    const orderCollection = client
      .db("cardoctorDB")
      .collection("orderCustomer");

    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 20, service_id: 1 },
      };
      const result = await servicesCollection.findOne(query);

      res.send(result);
    });
    //order services
//! sumdata
    app.get("/orders", async (req, res) => {
      console.log(req.query)
      let query={};
      if(req.query?.email){
        query={email:req.query.email}
      }
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.post("/orders", async (req, res) => {
      const orders = req.body;
      console.log(orders);
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car Doctor Server is running");
});

app.listen(port, () => {
  console.log(`Car Doctor Server is Runnin on port:",${port}`);
});
