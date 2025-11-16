const Product = require('../MongoDb/models/Product');
const multer = require('multer');
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require('../utils/r2');
require("dotenv").config();

// ================= MULTER MEMORY STORAGE =================

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


// ================= R2 UPLOAD =================

async function uploadToR2(file) {
  const fileName = "product-" + Date.now() + path.extname(file.originalname);

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return fileName; // store only the filename
}


// ================= R2 DELETE =================

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


// ================= CONTROLLERS =================


// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    if (!name || !description || !price || !category)
      return res.status(400).json({ error: "Name, description, price, category required" });

    let imageFileName = null;
    if (req.file) imageFileName = await uploadToR2(req.file);

    const product = new Product({
      ...req.body,
      price: parseFloat(req.body.price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
      stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      onOffer: req.body.onOffer === "true",
      outOfStock: req.body.outOfStock === "true",
      image: imageFileName
    });

    await product.save();

    res.status(201).json({ message: "Product created", product });

  } catch (err) {
    res.status(500).json({ error: "Failed to create product", details: err.message });
  }
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    // If new image uploaded → delete old + upload new
    if (req.file) {
      if (product.image) await deleteFromR2(product.image);
      product.image = await uploadToR2(req.file);
    }

    // update text fields
    const body = req.body;
    Object.assign(product, {
      name: body.name || product.name,
      description: body.description || product.description,
      price: body.price ? parseFloat(body.price) : product.price,
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : product.originalPrice,
      category: body.category || product.category,
      size: body.size || product.size,
      stock: body.stock ? parseInt(body.stock) : product.stock,
      count: body.count || product.count,
      onOffer: body.onOffer ? body.onOffer === "true" : product.onOffer,
      outOfStock: body.outOfStock ? body.outOfStock === "true" : product.outOfStock
    });

    await product.save();

    res.status(200).json({ message: "Product updated", product });

  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
};


// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    if (product.image) await deleteFromR2(product.image);

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
};


// GET PRODUCT BY ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json({ product });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product", details: err.message });
  }
};


// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
};


// GET PRODUCTS BY CATEGORY
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });

    if (!products.length)
      return res.status(404).json({ error: "No products in this category" });

    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category products", details: err.message });
  }
};


// GET PRODUCTS ON OFFER
exports.getProductsOnOffer = async (req, res) => {
  try {
    const products = await Product.find({ onOffer: true });

    if (!products.length)
      return res.status(404).json({ error: "No products on offer" });

    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch offer products", details: err.message });
  }
};
