
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected Successfully!"))
  .catch((err) => console.log("MongoDB Connection Error:", err.message));

// Vehicle Schema
const Vehicle = mongoose.model("Vehicle", {
  vehicleNumber: String,
  driverName: String,
  purpose: String,
  entryTime: {
    type: Date,
    default: Date.now
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("SMART GATE Backend is Running!");
});

// Save Vehicle Entry
app.post("/vehicles", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();

    res.status(201).json({
      message: "Vehicle Entry Saved Successfully!",
      vehicle
    });
  } catch (err) {
    res.status(500).json({
      message: "Error saving vehicle",
      error: err.message
    });
  }
});

// Get All Vehicle Entries
app.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ entryTime: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});