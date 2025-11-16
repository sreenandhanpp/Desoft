const Offer = require('../MongoDb/models/Offer');
const multer = require('multer');
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require('../utils/r2');
require("dotenv").config();


// Multer memory storage (no local disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
};

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");


// ============= Upload helper =============
async function uploadToR2(file) {
  const fileName = "offer-" + Date.now() + path.extname(file.originalname);

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return fileName;
}

// ============= Delete helper (optional) =============
async function deleteFromR2(fileName) {
  try {
    if (!fileName) return;

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileName
      })
    );

  } catch (err) {
    console.log("R2 delete error (ignored):", err.message);
  }
}



// ============= CONTROLLERS =============


// GET all active offers
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ offers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch offers", details: err.message });
  }
};


// CREATE a new offer
exports.createOffer = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Image is required" });

    const imageUrl = await uploadToR2(req.file);

    const offer = new Offer({
      image: imageUrl,
      isActive: req.body.isActive === "true",
      createdBy: req.user?._id || null
    });

    await offer.save();

    res.status(201).json({ message: "Offer created", offer });

  } catch (err) {
    res.status(500).json({ error: "Failed to create offer", details: err.message });
  }
};


// UPDATE an offer
exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);

    if (!offer)
      return res.status(404).json({ error: "Offer not found" });

    let updatedImage = offer.image;

    // If new file uploaded → Delete old + upload new
    if (req.file) {
      if (offer.image) await deleteFromR2(offer.image);
      updatedImage = await uploadToR2(req.file);
    }

    offer.isActive = req.body.isActive === "true";
    offer.image = updatedImage;

    await offer.save();

    res.status(200).json({ message: "Offer updated", offer });

  } catch (err) {
    res.status(500).json({ error: "Failed to update offer", details: err.message });
  }
};


// DELETE an offer
exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);

    if (!offer)
      return res.status(404).json({ error: "Offer not found" });

    if (offer.image) await deleteFromR2(offer.image);

    await Offer.deleteOne({ _id: offerId });

    res.status(200).json({ message: "Offer deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete offer", details: err.message });
  }
};
