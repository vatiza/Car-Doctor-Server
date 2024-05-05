const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

const verifyJWT = (req, res, next) => {
  console.log("hitting verify jwt");
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  console.log("token inside verify", token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.send({ error: true, message: " unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("cardoctorDB").collection("services");
    const orderCollection = client
      .db("cardoctorDB")
      .collection("orderCustomer");

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      console.log(token);
      res.send({ token });
    });

    // servieces routes
    app.get("/services", async (req, res) => {
      const query = {};
      const options = {
        sort: {
          price: -1,
        },
      };
      const cursor = servicesCollection.find(query,options);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 20, service_id: 1, img: 1 },
      };
      const result = await servicesCollection.findOne(query);

      res.send(result);
    });
    // delete data
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    // uppdate
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateOrdersData = req.body;
      console.log(updateOrdersData);
      const updateDOc = {
        $set: {
          status: updateOrdersData.status,
        },
      };
      const result = await orderCollection.updateOne(filter, updateDOc);
      res.send(result);
    });
    //order services
    //! sumdata
    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await orderCollection.find(query).toArray();
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
