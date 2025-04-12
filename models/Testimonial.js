const mongoose = require("mongoose");

const testimnialSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    job_title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    testimonial: {
      type: String,
      required: true,
    },
    image: { type: String },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Islam Testimonials", testimnialSchema);

module.exports = Testimonial;
