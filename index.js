const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const Testimonial = require("./models/Testimonial");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATABASE_URL = process.env.DATABASE_URL;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const db = await mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  cachedDb = db;
  console.log("Database connection established");
  return db;
}

app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

app.post("/api/testimonial", upload.single("image"), async (req, res) => {
  const { name, job_title, company, testimonial } = req.body;
  const image = req.file;
  try {
    let image_url = null;
    if (image) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(image.buffer);
      });
      image_url = result.secure_url;
    }

    const newTestimonial = new Testimonial({
      name,
      job_title,
      company,
      testimonial,
      image: image_url,
    });
    await newTestimonial.save();
    res.status(201).json({ message: "Thank you for your testimonial!" });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "There was an error saving your testimonial." });
  }
});

app.get("/api/testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Failed to fetch testimonials." });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err.message === "Only image files are allowed!") {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
