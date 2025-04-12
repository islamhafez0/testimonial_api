const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const Testimonial = require("./models/Testimonial");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 8000;
const DATABASE_URL = process.env.DATABASE_URL;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

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

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.log("Database connection established");
  })
  .catch((err) => {
    console.log(err);
  });

app.post("/api/testimonial", upload.single("image"), async (req, res) => {
  const { name, job_title, company, testimonial } = req.body;
  const image_path = req.file ? req.file.path : null;

  console.log(req.file);
  console.log(image_path);
  console.log(req.body);

  try {
    const newTestimonial = new Testimonial({
      name,
      job_title,
      company,
      testimonial,
      image: `${req.protocol}://${req.get("host")}/${image_path}`,
    });
    await newTestimonial.save();
    res.status(201).json({ message: "Thank you for your testimonial!" });
  } catch (error) {
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
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
