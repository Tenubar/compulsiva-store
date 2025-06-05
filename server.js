import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import multer from "multer"
import { GridFSBucket } from "mongodb"
import { Readable } from "stream"
import https from "https"
import querystring from "querystring"

dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(cookieParser())
// Update the CORS configuration to allow image requests
app.use(
  cors({
    origin: ["http://localhost:5173", "https://compulsiva-store.onrender.com"], // Your frontend URL
    credentials: true,
    exposedHeaders: ["Content-Type", "Content-Disposition"], // Important for file downloads
  }),
)

// MongoDB Connection
const mongoURI = process.env.VITE_MONGODB_URI || "mongodb://localhost:27017/carol-store"

// GridFS setup
let gfs
let bucket

// Configure multer for memory storage instead of disk storage
const storage = multer.memoryStorage()
const upload = multer({ storage })

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB")
    const db = mongoose.connection.db
    gfs = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    })
    bucket = new GridFSBucket(db, { bucketName: "uploads" })
  })
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    id: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    text: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // For replies
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const Comment = mongoose.model("Comment", commentSchema)

// Suggestion Schema
const suggestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
)

const Suggestion = mongoose.model("Suggestion", suggestionSchema)

// Rating Schema
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
)

const Rating = mongoose.model("Rating", ratingSchema)

// Product Schema - Updated with new fields
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    hoverImage: { type: String, required: true },
    description: { type: String },
    materials: { type: String },
    sizes: {
      type: [
        {
          size: String,
          quantity: Number,
          color: { type: String, default: "Default" }, // Changed from colors array to color string
          sizePrice: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    shipping: { type: [{ name: String, price: Number }], default: [] },
    productQuantity: { type: Number, default: 1, min: 1 },
    additionalImages: { type: [String], default: [] },
    // New fields
    visits: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 }, // Sum of all ratings
    ratingCount: { type: Number, default: 0 }, // Count of ratings
  },
  { timestamps: true },
)

const Product = mongoose.model("Product", productSchema)

// Image schema for tracking GridFS files
const imageSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  contentType: String,
  size: Number,
  uploadDate: { type: Date, default: Date.now },
  fileId: mongoose.Schema.Types.ObjectId,
})

const ImageModel = mongoose.model("Image", imageSchema)

// Wishlist Schema
const wishlistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true },
)

const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema)

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true }, // Matches productSchema's type field
    price: { type: Number, required: true },
    // size: { type: String, default: "" }, // Matches productSchema's sizes array
    // color: { type: String, default: "" }, // Matches productSchema's sizes array
    materials: { type: String }, // Matches productSchema's materials field    
     sizes: {
      type: [
        {
          size: String,
          quantity: Number,
          color: { type: String, default: "Default" }, // Changed from colors array to color string
          sizePrice: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    shipping: { type: [{ name: String, price: Number }], default: [] },
    productQuantity: { type: Number, default: 1, min: 1 },
    description: { type: String }, // Matches productSchema's description field
    image: { type: String, required: true }, // Matches productSchema's image field
    hoverImage: { type: String }, // Matches productSchema's hoverImage field
    additionalImages: { type: [String], default: [] }, // Matches productSchema's additionalImages field
    paypalTransactionId: { type: String, required: true },
    paypalOrderId: { type: String },
    payerEmail: { type: String },
    payerName: { type: String },
    shippingAddress: {
      name: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    status: { type: String, default: "completed" },
    paymentDetails: { type: Object },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

// PayPal IPN Log Schema - New schema to log all IPN messages
const ipnLogSchema = new mongoose.Schema(
  {
    ipnMessage: { type: Object, required: true },
    verified: { type: Boolean, required: true },
    processed: { type: Boolean, default: false },
    error: { type: String },
    orderCreated: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
)

const IPNLog = mongoose.model("IPNLog", ipnLogSchema)

// Add this new schema after the IPNLog schema and before the route definitions

// Page Settings Schema
const pageSettingsSchema = new mongoose.Schema(
  {
    siteIcon: { type: String, default: "" },
    siteLogo: { type: String, default: "" },
    siteTypographyHeaders: { type: String, default: "Inter, sans-serif" },
    siteTypographyBody: { type: String, default: "Oxygen, sans-serif" },
    siteColors: {
      type: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: [
        { name: "primary", value: "#3b82f6" },
        { name: "secondary", value: "#10b981" },
        { name: "accent", value: "#f59e0b" },
        { name: "background", value: "#ffffff" },
        { name: "text", value: "#111827" },
      ],
    },
    siteFilters: {
      type: [String],
      default: [""],
    },
  },
  { timestamps: true },
)

const PageSettings = mongoose.model("PageSettings", pageSettingsSchema)

// Route for uploading image to GridFS
app.post("/api/upload/productImage", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded" })
  }

  try {
    const { originalname, mimetype, buffer, size } = req.file
    const filename = Date.now() + "-" + originalname.replace(/\s+/g, "-")

    // Create a readable stream from buffer
    const readableStream = new Readable()
    readableStream.push(buffer)
    readableStream.push(null)

    // Create a GridFS upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
    })

    // Get the file ID
    const fileId = uploadStream.id

    // Pipe the readable stream to the upload stream
    readableStream.pipe(uploadStream)

    // Wait for the upload to finish
    uploadStream.on("finish", async () => {
      // Create a new image document to track the file
      const newImage = new ImageModel({
        filename,
        originalname,
        contentType: mimetype,
        size,
        fileId,
      })

      const savedImage = await newImage.save()

      // Return the image URL that will be used to retrieve the image
      res.status(200).send({
        message: "File uploaded successfully",
        image: {
          _id: savedImage._id,
          filename: savedImage.filename,
          path: `${process.env.VITE_SITE_URL}/api/images/${savedImage.filename}`,
          size: savedImage.size,
          mimetype: savedImage.contentType,
        },
      })
    })

    uploadStream.on("error", (error) => {
      console.error("Error uploading to GridFS:", error)
      res.status(500).send({ error: "Failed to upload file to GridFS" })
    })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).send({ error: "Failed to save file to database", details: err })
  }
})

// Make sure the image route is properly configured
app.get("/api/images/:filename", async (req, res) => {
  try {
    const image = await ImageModel.findOne({ filename: req.params.filename })

    if (!image) {
      return res.status(404).json({ message: "Image not found" })
    }

    const downloadStream = bucket.openDownloadStream(image.fileId)

    // Set the content type
    res.set("Content-Type", image.contentType)

    // Set cache headers to improve performance
    res.set("Cache-Control", "public, max-age=31536000") // Cache for 1 year
    res.set("Expires", new Date(Date.now() + 31536000000).toUTCString())

    // Pipe the download stream to the response
    downloadStream.pipe(res)

    downloadStream.on("error", (error) => {
      console.error("Error streaming file from GridFS:", error)
      res.status(500).json({ message: "Error getting file", error: error.message })
    })
  } catch (error) {
    console.error("Error serving file:", error)
    res.status(500).json({ message: "Error getting file", error: error.message })
  }
})

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  jwt.verify(token, process.env.VITE_JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Admin Middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
    if (user && user.email === process.env.VITE_ADMIN_USER_EMAIL) {
      next()
    } else {
      res.status(403).json({ message: "Admin access required" })
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking admin status", error: error.message })
  }
}

// Auth Routes
app.post("/register", async (req, res) => {
  try {
    const { name, password, email, avatar } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      name,
      password: hashedPassword,
      email,
      avatar: avatar || "",
    })

    await user.save()
    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message })
  }
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id }, process.env.VITE_JWT_SECRET || "your-secret-key", { expiresIn: "24h" })

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.VITE_NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "none",
    })

    res.json({ message: "Logged in successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message })
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.VITE_NODE_ENV === "production",
    sameSite: "none",
    path: "/", // Asegúrate de que el path coincida con el usado al crear el cookie
  })

  res.json({ message: "Logged out successfully" })
})

// User Routes

// Get all users - Admin only
app.get("/api/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message })
  }
})

// Update user - Admin only
app.put("/api/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email } = req.body

    // Check if user is trying to update admin email
    const userToUpdate = await User.findById(req.params.id)
    if (userToUpdate.email === process.env.VITE_ADMIN_USER_EMAIL && email !== process.env.VITE_ADMIN_USER_EMAIL) {
      return res.status(403).json({ message: "Cannot change admin email" })
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { name, email }, { new: true }).select("-password")

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message })
  }
})

// Delete user - Admin only
app.delete("/api/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id)

    // Prevent deleting admin user
    if (userToDelete.email === process.env.VITE_ADMIN_USER_EMAIL) {
      return res.status(403).json({ message: "Cannot delete admin user" })
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id)

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message })
  }
})

app.get("/get-user-details", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details", error: error.message })
  }
})

app.get("/get-users-details", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message })
  }
})

app.post("/post-user", authenticateToken, async (req, res) => {
  try {
    const { name, password, email } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      password: hashedPassword,
      email,
    })

    await user.save()
    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message })
  }
})

// Update the update-user route to handle avatar updates
app.put("/update-user", authenticateToken, async (req, res) => {
  try {
    const { name, email, avatar, phone, id, firstName, lastName, address } = req.body
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name,
        email,
        avatar,
        phone,
        id,
        firstName,
        lastName,
        address,
      },
      { new: true },
    ).select("-password")

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message })
  }
})

// Update the delete-user route to handle avatar deletion
app.delete("/delete-user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    // Delete user's avatar if it exists
    if (user && user.avatar) {
      try {
        // Find the image in the database
        const image = await ImageModel.findOne({ filename: user.avatar })

        if (image) {
          // Delete from GridFS
          await bucket.delete(image.fileId)

          // Delete from database
          await ImageModel.findByIdAndDelete(image._id)
        }
      } catch (err) {
        console.error("Error deleting user avatar:", err)
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete user's cart items
    await CartItem.deleteMany({ userId: req.user.userId })

    // Delete user's wishlist items
    await WishlistItem.deleteMany({ userId: req.user.userId })

    // Delete user
    await User.findByIdAndDelete(req.user.userId)

    res.clearCookie("token")
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message })
  }
})

// Image Gallery Routes - Admin only
app.get("/api/images", authenticateToken, isAdmin, async (req, res) => {
  try {
    const images = await ImageModel.find()

    // If includeProducts query param is true, fetch product info for each image
    if (req.query.includeProducts === "true") {
      const imagesWithProducts = await Promise.all(
        images.map(async (image) => {
          const imagePath = `${process.env.VITE_SITE_URL}/api/images/${image.filename}`
          const productsUsingImage = await Product.find({
            $or: [{ image: imagePath }, { hoverImage: imagePath }, { additionalImages: imagePath }],
          }).select("_id title")

          return {
            ...image.toObject(),
            path: imagePath,
            products: productsUsingImage.map((p) => ({ id: p._id, title: p.title })),
          }
        }),
      )

      return res.json(imagesWithProducts)
    }

    // Transform the images to include the path
    const transformedImages = images.map((image) => ({
      ...image.toObject(),
      path: `${process.env.VITE_SITE_URL}/api/images/${image.filename}`,
    }))

    res.json(transformedImages)
  } catch (error) {
    res.status(500).json({ message: "Error fetching images", error: error.message })
  }
})

// Add a new route to get products using a specific image
app.get("/api/images/:id/products", authenticateToken, isAdmin, async (req, res) => {
  try {
    const image = await ImageModel.findById(req.params.id)

    if (!image) {
      return res.status(404).json({ message: "Image not found" })
    }

    const imagePath = `${process.env.VITE_SITE_URL}/api/images/${image.filename}`
    const productsUsingImage = await Product.find({
      $or: [{ image: imagePath }, { hoverImage: imagePath }, { additionalImages: imagePath }],
    }).select("_id title")

    res.json({
      products: productsUsingImage.map((p) => ({ id: p._id, title: p.title })),
    })
  } catch (error) {
    res.status(500).json({ message: "Error fetching product information", error: error.message })
  }
})

app.delete("/api/images/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const image = await ImageModel.findById(req.params.id)

    if (!image) {
      return res.status(404).json({ message: "Image not found" })
    }

    const imagePath = `${process.env.VITE_SITE_URL}/api/images/${image.filename}`

    // Check if image is used by any products (only if force=true is not set)
    if (req.query.force !== "true") {
      const productsUsingImage = await Product.find({
        $or: [{ image: imagePath }, { hoverImage: imagePath }, { additionalImages: imagePath }],
      })

      if (productsUsingImage.length > 0) {
        return res.status(400).json({
          message: "Cannot delete image as it is used by products",
          products: productsUsingImage.map((p) => ({ id: p._id, title: p.title })),
        })
      }
    }

    // Delete the file from GridFS
    await bucket.delete(image.fileId)

    // Delete from database
    // await ImageModel.findByIdAndDelete(req.params.id)
    await ImageModel.findByIdAndDelete(image._id)

    res.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Error deleting image:", error)
    res.status(500).json({ message: "Error deleting image", error: error.message })
  }
})

// Add a new route to replace an image
app.post("/api/images/replace", authenticateToken, isAdmin, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded" })
  }

  const oldImagePath = req.body.oldImagePath
  if (!oldImagePath) {
    return res.status(400).send({ error: "Old image path is required" })
  }

  try {
    // Extract the filename from the path
    const oldFilename = oldImagePath.split("/").pop()

    // Find the old image in the database
    const oldImage = await ImageModel.findOne({ filename: oldFilename })
    if (!oldImage) {
      return res.status(404).send({ error: "Original image not found in database" })
    }

    // Upload new image to GridFS
    const { originalname, mimetype, buffer, size } = req.file
    const filename = Date.now() + "-" + originalname.replace(/\s+/g, "-")

    // Create a readable stream from buffer
    const readableStream = new Readable()
    readableStream.push(buffer)
    readableStream.push(null)

    // Create a GridFS upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
    })

    // Get the file ID
    const fileId = uploadStream.id

    // Pipe the readable stream to the upload stream
    readableStream.pipe(uploadStream)

    // Wait for the upload to finish
    uploadStream.on("finish", async () => {
      // Create a new image document
      const newImage = new ImageModel({
        filename,
        originalname,
        contentType: mimetype,
        size,
        fileId,
      })

      const savedImage = await newImage.save()
      const newImagePath = `${process.env.VITE_SITE_URL}/api/images/${filename}`

      // Update all products that use the old image
      await Product.updateMany({ image: oldImagePath }, { $set: { image: newImagePath } })
      await Product.updateMany({ hoverImage: oldImagePath }, { $set: { hoverImage: newImagePath } })
      await Product.updateMany({ additionalImages: oldImagePath }, { $pull: { additionalImages: oldImagePath } })
      await Product.updateMany(
        { additionalImages: { $in: [oldImagePath] } },
        { $push: { additionalImages: newImagePath } },
      )

      // Delete the old image from GridFS
      await bucket.delete(oldImage.fileId)

      // Delete the old image from the database
      await ImageModel.findByIdAndDelete(oldImage._id)

      res.status(200).send({
        message: "Image replaced successfully",
        path: newImagePath,
        filename: filename,
      })
    })

    uploadStream.on("error", (error) => {
      console.error("Error uploading replacement to GridFS:", error)
      res.status(500).send({ error: "Failed to upload replacement file to GridFS" })
    })
  } catch (err) {
    console.error("Error replacing image:", err)
    res.status(500).send({ error: "Failed to replace image", details: err })
  }
})

// FIX: Changed route to avoid conflict with the :id parameter route
app.post("/api/images/delete-by-path", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { path } = req.body

    if (!path) {
      return res.status(400).json({ message: "Image path is required" })
    }

    // Extract the filename from the path
    const filename = path.split("/").pop()

    // Find the image in the database
    const image = await ImageModel.findOne({ filename })

    if (!image) {
      return res.status(404).json({ message: "Image not found" })
    }

    // Delete the file from GridFS
    await bucket.delete(image.fileId)

    // Delete from database
    await ImageModel.findByIdAndDelete(image._id)

    res.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Error deleting image:", error)
    res.status(500).json({ message: "Error deleting image", error: error.message })
  }
})

// Product Routes
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message })
  }
})

app.get("/api/products", async (req, res) => {
  try {
    const searchQuery = req.query.search || ""
    const products = await Product.find({
      title: { $regex: searchQuery, $options: "i" }, // Case-insensitive search
    }).select("title price image")

    res.json({ products })
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message })
  }
})

app.post("/api/products", async (req, res) => {
  try {
    if (req.body.productQuantity) {
      req.body.productQuantity = Number(req.body.productQuantity)
    }

    const newProduct = new Product(req.body)
    const savedProduct = await newProduct.save()
    res.status(201).json({ product: savedProduct })
  } catch (error) {
    console.error("Error saving product:", error)
    res.status(500).json({ message: "Error saving product", error })
  }
})

// Update product - Added new route for API endpoint
app.put("/api/products/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    // Ensure productQuantity is a number
    if (req.body.productQuantity) {
      req.body.productQuantity = Number(req.body.productQuantity)
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Error updating product", error: error.message })
  }
})

// Add this new route to handle adding images to a product without updating other fields
app.patch("/api/products/:id/add-image", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { additionalImages } = req.body

    // Only update the additionalImages field
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { additionalImages }, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product images:", error)
    res.status(500).json({ message: "Error updating product images", error: error.message })
  }
})

// Add this new route to update a specific image field
app.patch("/api/products/:id/update-image", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { field, imagePath } = req.body

    if (!field || !imagePath) {
      return res.status(400).json({ message: "Field and image path are required" })
    }

    // Only allow updating specific image fields
    if (field !== "" && field !== "hoverImage") {
      return res.status(400).json({ message: "Invalid field. Only 'image' or 'hoverImage' are allowed" })
    }

    const updateData = { [field]: imagePath }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product image:", error)
    res.status(500).json({ message: "Error updating product image", error: error.message })
  }
})

// Increment product visits
app.post("/api/products/:id/visit", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, { $inc: { visits: 1 } }, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({ visits: updatedProduct.visits })
  } catch (error) {
    console.error("Error incrementing visits:", error)
    res.status(500).json({ message: "Error incrementing visits", error: error.message })
  }
})

// Add or update product rating
app.post("/api/products/:id/rate", authenticateToken, async (req, res) => {
  try {
    const { value } = req.body
    const productId = req.params.id
    const userId = req.user.userId

    // Validate rating value
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    // Check if user has already rated this product
    const existingRating = await Rating.findOne({ userId, productId })

    if (existingRating) {
      // Update existing rating
      const oldValue = existingRating.value
      existingRating.value = value
      await existingRating.save()

      // Update product rating totals
      await Product.findByIdAndUpdate(productId, {
        $inc: { ratingSum: value - oldValue },
      })
    } else {
      // Create new rating
      const newRating = new Rating({
        userId,
        productId,
        value,
      })
      await newRating.save()

      // Update product rating totals
      await Product.findByIdAndUpdate(productId, {
        $inc: { ratingSum: value, ratingCount: 1 },
      })
    }

    // Get updated product rating
    const product = await Product.findById(productId)
    const averageRating = product.ratingCount > 0 ? product.ratingSum / product.ratingCount : 0

    res.json({
      averageRating,
      ratingCount: product.ratingCount,
    })
  } catch (error) {
    console.error("Error rating product:", error)
    res.status(500).json({ message: "Error rating product", error: error.message })
  }
})

// Get user's rating for a product
app.get("/api/products/:id/user-rating", authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id
    const userId = req.user.userId

    const rating = await Rating.findOne({ userId, productId })

    res.json({
      rating: rating ? rating.value : 0,
    })
  } catch (error) {
    console.error("Error getting user rating:", error)
    res.status(500).json({ message: "Error getting user rating", error: error.message })
  }
})

// Add comment to product
app.post("/api/products/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { text, parentId } = req.body
    const productId = req.params.id
    const userId = req.user.userId

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" })
    }

    // Create new comment
    const newComment = new Comment({
      userId,
      productId,
      text,
      parentId: parentId || null,
    })

    await newComment.save()

    // Populate user info
    const populatedComment = await Comment.findById(newComment._id).populate("userId", "name email")

    res.status(201).json(populatedComment)
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({ message: "Error adding comment", error: error.message })
  }
})

// Get comments for a product
app.get("/api/products/:id/comments", async (req, res) => {
  try {
    const productId = req.params.id

    // Get all comments for this product
    const comments = await Comment.find({ productId }).populate("userId", "name email").sort({ createdAt: -1 })

    // Separate top-level comments and replies
    const topLevelComments = comments.filter((comment) => !comment.parentId)
    const replies = comments.filter((comment) => comment.parentId)

    // Organize replies by parent comment
    const commentTree = topLevelComments.map((comment) => {
      const commentReplies = replies.filter(
        (reply) => reply.parentId && reply.parentId.toString() === comment._id.toString(),
      )
      return {
        ...comment.toObject(),
        replies: commentReplies,
      }
    })

    res.json(commentTree)
  } catch (error) {
    console.error("Error getting comments:", error)
    res.status(500).json({ message: "Error getting comments", error: error.message })
  }
})

// Delete comment
app.delete("/api/comments/:id", authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id
    const userId = req.user.userId

    // Find the comment
    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    // Check if user is the comment author or admin
    const user = await User.findById(userId)
    const isAdmin = user.email === process.env.VITE_ADMIN_USER_EMAIL

    if (comment.userId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this comment" })
    }

    // Delete the comment and its replies
    await Comment.deleteMany({
      $or: [{ _id: commentId }, { parentId: commentId }],
    })

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Error deleting comment", error: error.message })
  }
})

app.get("/products/:id", async (req, res) => {
  try {
    // Force a fresh fetch from MongoDB by using findById directly
    const product = await Product.findById(req.params.id).lean()

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Calculate average rating
    const averageRating = product.ratingCount > 0 ? product.ratingSum / product.ratingCount : 0

    // Add default values for fields that might be missing
    const enhancedProduct = {
      ...product,
      description: product.description || "Quality product from Carol Store.",
      materials: product.materials || "",
      // sizes: product.sizes || [{ size: "M", quantity: 1, color: "Default" }],
      sizes: product.sizes || "",
      shipping: product.shipping || "Standard shipping: 3-5 business days.",
      productQuantity: product.productQuantity != null ? Number(product.productQuantity) : 1,
      visits: product.visits || 0,
      averageRating,
      ratingCount: product.ratingCount || 0,
      reviews: [], // Empty array for reviews since we don't have them yet
      recommended: [], // Will be populated with recommended products
      images: [product.image, product.hoverImage, ...(product.additionalImages || [])].filter(Boolean),
    }

    // Get some recommended products of the same type
    const recommendedProducts = await Product.find({
      type: product.type,
      _id: { $ne: product._id },
    })
      .limit(4)
      .lean()

    const enhancedRecommended = recommendedProducts.map((recProduct) => {
      return {
        ...recProduct,
        images: [recProduct.image, recProduct.hoverImage, ...(recProduct.additionalImages || [])].filter(Boolean),
      }
    })

    enhancedProduct.recommended = enhancedRecommended

    // Set cache control headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", "0")

    res.json(enhancedProduct)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ message: "Error fetching product", error: error.message })
  }
})

// Draft Schema
const draftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productData: {
      title: { type: String, default: "" },
      type: { type: String, default: "Shirt" },
      price: { type: String, default: "" },
      image: { type: String, default: "" },
      hoverImage: { type: String, default: "" },
      description: { type: String, default: "" },
      materials: { type: String, default: "" },
      sizes: {
        type: [
          {
            size: { type: String, default: "" },
            quantity: { type: Number, default: 0 },
            color: { type: String, default: "Default" }, // Single color string to match productSchema
            sizePrice: { type: Number, default: 0 },
          },
        ],
        default: [],
      },
      shipping: { type: [{ name: String, price: Number }], default: [] },
      productQuantity: { type: Number, default: 1 },
      additionalImages: { type: [String], default: [] },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const Draft = mongoose.model("Draft", draftSchema)

// Draft Routes
app.get("/api/drafts", authenticateToken, async (req, res) => {
  try {
    const drafts = await Draft.find({ userId: req.user.userId }).sort({ updatedAt: -1 })
    res.json(drafts)
  } catch (error) {
    res.status(500).json({ message: "Error fetching drafts", error: error.message })
  }
})

app.get("/api/drafts/count", authenticateToken, async (req, res) => {
  try {
    const count = await Draft.countDocuments({ userId: req.user.userId })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: "Error fetching draft count", error: error.message })
  }
})

app.get("/api/drafts/:id", authenticateToken, async (req, res) => {
  try {
    const draft = await Draft.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!draft) {
      return res.status(404).json({ message: "Draft not found" })
    }
    res.json(draft)
  } catch (error) {
    res.status(500).json({ message: "Error fetching draft", error: error.message })
  }
})

app.post("/api/drafts", authenticateToken, async (req, res) => {
  try {
    const draft = new Draft({
      ...req.body,
      userId: req.user.userId,
      lastUpdated: new Date(),
    })

    const savedDraft = await draft.save()
    res.status(201).json(savedDraft)
  } catch (error) {
    res.status(500).json({ message: "Error creating draft", error: error.message })
  }
})

app.put("/api/drafts/:id", authenticateToken, async (req, res) => {
  try {
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, lastUpdated: new Date() },
      { new: true },
    )

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" })
    }

    res.json(draft)
  } catch (error) {
    res.status(500).json({ message: "Error updating draft", error: error.message })
  }
})

app.delete("/api/drafts/:id", authenticateToken, async (req, res) => {
  try {
    // Find the draft first to get image paths
    const draft = await Draft.findOne({ _id: req.params.id, userId: req.user.userId })

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" })
    }

    // Collect all image paths associated with this draft
    const productData = draft.productData
    const imagePaths = [productData.image, productData.hoverImage, ...(productData.additionalImages || [])].filter(
      Boolean,
    )

    // Delete all images from GridFS and database
    for (const imagePath of imagePaths) {
      try {
        // Extract the filename from the path
        const filename = imagePath.split("/").pop()

        // Find the image in the database
        const image = await ImageModel.findOne({ filename })

        if (image) {
          // Delete from GridFS
          await bucket.delete(image.fileId)

          // Delete from database
          await ImageModel.findByIdAndDelete(image._id)
        }
      } catch (err) {
        console.error(`Error deleting image ${imagePath}:`, err)
        // Continue with other deletions even if one fails
      }
    }

    // Delete the draft
    await Draft.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })

    res.json({ message: "Draft and associated images deleted successfully" })
  } catch (error) {
    console.error("Error deleting draft:", error)
    res.status(500).json({ message: "Error deleting draft", error: error.message })
  }
})

// Add this route to update specific fields in a product
app.patch("/api/products/:id/update-image", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { field, value } = req.body

    if (!field || !["image", "hoverImage"].includes(field)) {
      return res.status(400).json({ message: "Invalid field specified" })
    }

    const updateData = { [field]: value }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product image:", error)
    res.status(500).json({ message: "Error updating product image", error: error.message })
  }
})

// Cart Schema
const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String, default: "" }, // Size field
    color: { type: String, default: "" }, // Add color field
  },
  { timestamps: true },
)

const CartItem = mongoose.model("CartItem", cartItemSchema)

// Wishlist Routes
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const items = await WishlistItem.find({ userId: req.user.userId })
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: "Error fetching wishlist items", error: error.message })
  }
})

app.post("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const { productId, title, type, price, image, description } = req.body

    // Check if item already exists in wishlist
    const existingItem = await WishlistItem.findOne({
      userId: req.user.userId,
      productId: productId,
    })

    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" })
    }

    // Create new wishlist item
    const wishlistItem = new WishlistItem({
      userId: req.user.userId,
      productId,
      title,
      type,
      price,
      image,
      description,
    })

    await wishlistItem.save()
    res.status(201).json({ message: "Item added to wishlist", item: wishlistItem })
  } catch (error) {
    res.status(500).json({ message: "Error adding to wishlist", error: error.message })
  }
})

app.delete("/api/wishlist/:id", authenticateToken, async (req, res) => {
  try {
    const result = await WishlistItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!result) {
      return res.status(404).json({ message: "Wishlist item not found" })
    }

    res.json({ message: "Item removed from wishlist" })
  } catch (error) {
    res.status(500).json({ message: "Error removing from wishlist", error: error.message })
  }
})

// Check if product is in wishlist
app.get("/api/wishlist/check/:productId", authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId
    const item = await WishlistItem.findOne({
      userId: req.user.userId,
      productId: productId,
    })

    res.json({ inWishlist: !!item, itemId: item ? item._id : null })
  } catch (error) {
    res.status(500).json({ message: "Error checking wishlist", error: error.message })
  }
})

// Cart Routes
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.userId })
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart items", error: error.message })
  }
})

app.get("/api/cart/count", authenticateToken, async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user.userId })
    const count = items.reduce((total, item) => total + item.quantity, 0)
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart count", error: error.message })
  }
})

// Update the cart POST endpoint to handle sizes
app.post("/api/cart", authenticateToken, async (req, res) => {
  try {
    const { productId, title, type, price, image, quantity, size, color } = req.body

    // Get the product to check available quantity
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Find the selected size in the product
    const selectedSize = product.sizes.find((s) => s.size === size)
    if (!selectedSize) {
      return res.status(400).json({ message: "Selected size not found" })
    }

    // Check if the selected color is available for this size
    if (color && selectedSize.color && !selectedSize.color.includes(color)) {
      return res.status(400).json({ message: "Selected color not available for this size" })
    }

    // Check if item already exists in cart with the same size and color
    const existingItem = await CartItem.findOne({
      userId: req.user.userId,
      productId: productId,
      size: size,
      color: color || "",
    })

    // Calculate total quantity after this addition
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newTotalQuantity = currentQuantity + quantity

    // Check if the new total quantity exceeds available stock for this size
    if (newTotalQuantity > selectedSize.quantity) {
      return res.status(400).json({
        message: "Maximum stock reached!",
        availableStock: selectedSize.quantity,
        currentInCart: currentQuantity,
      })
    }

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity = newTotalQuantity
      await existingItem.save()
      res.status(200).json({ message: "Cart updated", item: existingItem })
    } else {
      // Create new cart item
      const cartItem = new CartItem({
        userId: req.user.userId,
        productId,
        title,
        type,
        price,
        image,
        quantity,
        size,
        color: color || "",
      })

      await cartItem.save()
      res.status(201).json({ message: "Item added to cart", item: cartItem })
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart", error: error.message })
  }
})

app.patch("/api/cart/:id", authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body
    const cartItem = await CartItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { quantity },
      { new: true },
    )

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    res.json({ message: "Cart updated", item: cartItem })
  } catch (error) {
    res.status(500).json({ message: "Error updating cart", error: error.message })
  }
})

app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
  try {
    const result = await CartItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!result) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    res.json({ message: "Item removed from cart" })
  } catch (error) {
    res.status(500).json({ message: "Error removing from cart", error: error.message })
  }
})

// Order Routes
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json({ orders })
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message })
  }
})

app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    res.json({ order })
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message })
  }
})

app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const {
      productId,
      title,
      price,
      quantity,
      paypalTransactionId,
      paypalOrderId,
      payerEmail,
      payerName,
      shippingAddress,
      paymentDetails,
    } = req.body

    // Check if an order with this transaction ID already exists
    if (paypalTransactionId) {
      const existingOrder = await Order.findOne({ paypalTransactionId })
      if (existingOrder) {
        return res.status(200).json({
          message: "Order already exists",
          order: existingOrder,
          duplicate: true,
        })
      }
    }

    const order = new Order({
      userId: req.user.userId,
      productId,
      title,
      price,
      quantity,
      paypalTransactionId,
      paypalOrderId,
      payerEmail,
      payerName,
      shippingAddress,
      paymentDetails,
    })

    await order.save()
    res.status(201).json({ message: "Order created successfully", order })
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error: error.message })
  }
})

// Update the delete product route to also delete associated images
app.delete("/api/product/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    // Find the product first to get image paths
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Collect all image paths associated with this product
    const imagePaths = [product.image, product.hoverImage, ...(product.additionalImages || [])].filter(Boolean)

    // Delete all images from GridFS and database
    for (const imagePath of imagePaths) {
      try {
        // Extract the filename from the path
        const filename = imagePath.split("/").pop()

        // Find the image in the database
        const image = await ImageModel.findOne({ filename })

        if (image) {
          // Delete from GridFS
          await bucket.delete(image.fileId)

          // Delete from database
          await ImageModel.findByIdAndDelete(image._id)
        }
      } catch (err) {
        console.error(`Error deleting image ${imagePath}:`, err)
        // Continue with other deletions even if one fails
      }
    }

    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

    // Also delete any cart items with this product
    await CartItem.deleteMany({ productId: req.params.id })

    // Also delete any wishlist items with this product
    await WishlistItem.deleteMany({ productId: req.params.id })

    // Also delete any ratings and comments for this product
    await Rating.deleteMany({ productId: req.params.id })
    await Comment.deleteMany({ productId: req.params.id })

    res.status(200).json({ message: "Product and all associated images deleted successfully", product: deletedProduct })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Error deleting product", error })
  }
})

// Update the PayPal IPN Webhook
app.post("/api/paypal/ipn", express.raw({ type: "application/x-www-form-urlencoded" }), async (req, res) => {
  const body = req.body.toString("utf8");
  const verificationBody = `cmd=_notify-validate&${body}`;
  const ipnData = querystring.parse(body);

  console.log("Received IPN data:", ipnData);

  const ipnLog = new IPNLog({
    ipnMessage: ipnData,
    verified: false,
  });

  try {
    const verificationResult = await verifyIPN(verificationBody);
    ipnLog.verified = verificationResult === "VERIFIED";

    console.log("IPN verification result:", verificationResult);

    if (ipnLog.verified) {
      if (ipnData.payment_status === "Completed") {
        console.log("Payment status is completed. Creating order.");
        try {
          const order = await createOrderFromIPN(ipnData);
          if (order) {
            console.log("Order created successfully:", order);
            ipnLog.orderCreated = true;
            ipnLog.orderId = order._id;
            ipnLog.processed = true;
          }
        } catch (orderError) {
          console.error("Error creating order from IPN:", orderError);
          ipnLog.error = orderError.message;
        }
      } else {
        console.log("Payment status is not completed:", ipnData.payment_status);
        ipnLog.processed = true;
      }
    } else {
      console.error("IPN verification failed.");
      ipnLog.error = "IPN verification failed";
    }
  } catch (error) {
    console.error("Error processing PayPal IPN:", error);
    ipnLog.error = error.message;
  }

  await ipnLog.save();
  console.log("IPN Log saved:", ipnLog);
  res.status(200).send("OK");
});

// Update the createOrderFromIPN function
async function createOrderFromIPN(ipnData) {
  console.log("Creating order from IPN data:", ipnData);

  try {
    const existingOrder = await Order.findOne({ paypalTransactionId: ipnData.txn_id });
    if (existingOrder) {
      console.log("Order already exists:", existingOrder);
      return existingOrder;
    }

    const customParts = ipnData.custom.split("|");
    const userId = customParts[0];
    const selectedSize = customParts.length > 1 ? customParts[1] : "";
    const selectedColor = customParts.length > 2 ? customParts[2] : "";

    console.log("Parsed custom data:", { userId, selectedSize, selectedColor });

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const productId = ipnData.item_number;
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found with ID: ${productId}`);
    }

    const shippingMethod = product.shipping?.[0] || { name: "Standard", price: 0 };

    const sizeObj = product.sizes.find(
      (s) => s.size === selectedSize && s.color === selectedColor
    );

    const order = new Order({
      userId,
      productId,
      title: ipnData.item_name || product.title,
      type: product.type, // Matches the new Order schema
      price: sizeObj?.sizePrice || product.price,
      sizes: product.sizes, // Matches the new Order schema
      shipping: product.shipping, // Matches the new Order schema
      productQuantity: Number.parseInt(ipnData.quantity || 1), // Matches the new Order schema
      description: product.description, // Matches the new Order schema
      image: product.image, // Matches the new Order schema
      hoverImage: product.hoverImage, // Matches the new Order schema
      additionalImages: product.additionalImages, // Matches the new Order schema
      paypalTransactionId: ipnData.txn_id,
      paypalOrderId: ipnData.parent_txn_id || ipnData.txn_id,
      payerEmail: ipnData.payer_email,
      payerName: `${ipnData.first_name || ""} ${ipnData.last_name || ""}`.trim(),
      shippingAddress: {
        name: user.name,
        addressLine1: user.address.street,
        city: user.address.city,
        state: user.address.state,
        postalCode: user.address.postalCode,
        country: user.address.country,
      },
      status: "completed",
      paymentDetails: ipnData,
    });

    await order.save();
    console.log("Order saved successfully:", order);

    const purchaseQuantity = Number.parseInt(ipnData.quantity || 1);
    const sizeIndex = product.sizes.findIndex((s) => s.size === selectedSize);
    if (sizeIndex >= 0) {
      product.sizes[sizeIndex].quantity = Math.max(0, product.sizes[sizeIndex].quantity - purchaseQuantity);
      await Product.findByIdAndUpdate(productId, { sizes: product.sizes });
      console.log("Updated product stock:", product.sizes);
    }

    await CartItem.deleteMany({ userId, productId, size: selectedSize, color: selectedColor });
    console.log("Deleted cart items for user:", userId);

    return order;
  } catch (error) {
    console.error("Error creating order from IPN:", error);
    throw error;
  }
}

// Check if user has purchased a specific product
app.get("/api/user/has-purchased/:productId", authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId
    const userId = req.user.userId

    // Check if there's a completed order with this product for this user
    const order = await Order.findOne({
      userId,
      productId,
      status: "completed", // Ensure the order is completed
    })

    res.json({
      hasPurchased: !!order,
      orderId: order ? order._id : null,
    })
  } catch (error) {
    console.error("Error checking purchase history:", error)
    res.status(500).json({ message: "Error checking purchase history", error: error.message })
  }
})

// Suggestion Routes
app.post("/api/suggestions", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body
    const user = await User.findById(req.user.userId)

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" })
    }

    const suggestion = new Suggestion({
      userId: req.user.userId,
      userName: user.name,
      message: message.trim(),
    })

    await suggestion.save()
    res.status(201).json(suggestion)
  } catch (error) {
    console.error("Error creating suggestion:", error)
    res.status(500).json({ message: "Error creating suggestion", error: error.message })
  }
})

app.get("/api/suggestions", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 5
    const skip = (page - 1) * limit

    const suggestions = await Suggestion.find().sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await Suggestion.countDocuments()

    res.json({
      suggestions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + suggestions.length < total,
    })
  } catch (error) {
    console.error("Error fetching suggestions:", error)
    res.status(500).json({ message: "Error fetching suggestions", error: error.message })
  }
})

app.delete("/api/suggestions/:id", authenticateToken, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" })
    }

    // Check if the user is the owner of the suggestion
    if (suggestion.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this suggestion" })
    }

    await suggestion.deleteOne()
    res.json({ message: "Suggestion deleted successfully" })
  } catch (error) {
    console.error("Error deleting suggestion:", error)
    res.status(500).json({ message: "Error deleting suggestion", error: error.message })
  }
})

// Make sure this route is accessible without authentication for testing
app.get("/api/test-route", (req, res) => {
  res.json({ message: "API is working" })
})

// check admin status
app.get("/api/check-admin", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (user && user.email === process.env.VITE_ADMIN_USER_EMAIL) {
      res.status(200).json({ isAdmin: true })
    } else {
      res.status(403).json({ message: "Not an admin user" })
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking admin status", error: error.message })
  }
})

// Add these routes before the server.listen line

// Get page settings
app.get("/api/page-settings", async (req, res) => {
  try {
    // Find the first document or create a default one if none exists
    let settings = await PageSettings.findOne()

    if (!settings) {
      settings = new PageSettings()
      await settings.save()
    }

    res.json(settings)
  } catch (error) {
    console.error("Error fetching page settings:", error)
    res.status(500).json({ message: "Error fetching page settings", error: error.message })
  }
})

// Update page settings - Admin only
app.put("/api/page-settings", authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      siteIcon,
      siteLogo,
      siteTypographyHeaders,
      siteTypographyBody,
      siteColors,
      siteFilters,
    } = req.body;

    // Find the first document or create a default one if none exists
    let settings = await PageSettings.findOne();

    if (!settings) {
      settings = new PageSettings();
    }

    // Update fields if provided
    if (siteIcon !== undefined) settings.siteIcon = siteIcon;
    if (siteLogo !== undefined) settings.siteLogo = siteLogo;
    if (siteTypographyHeaders !== undefined) settings.siteTypographyHeaders = siteTypographyHeaders;
    if (siteTypographyBody !== undefined) settings.siteTypographyBody = siteTypographyBody;
    if (siteColors !== undefined) settings.siteColors = siteColors;
    if (siteFilters !== undefined) settings.siteFilters = siteFilters;

    await settings.save();

    res.json(settings);
  } catch (error) {
    console.error("Error updating page settings:", error);
    res.status(500).json({ message: "Error updating page settings", error: error.message });
  }
});

// Update a specific page setting field - Admin only
app.patch("/api/page-settings/:field", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { field } = req.params
    const { value } = req.body

    if (value === undefined) {
      return res.status(400).json({ message: "Value is required" })
    }

    // Find the first document or create a default one if none exists
    let settings = await PageSettings.findOne()

    if (!settings) {
      settings = new PageSettings()
    }

    // Check if the field exists in the schema
    if (!(field in settings.schema.paths)) {
      return res.status(400).json({ message: "Invalid field" })
    }

    // Update the specific field
    settings[field] = value
    await settings.save()

    res.json(settings)
  } catch (error) {
    console.error("Error updating page setting:", error)
    res.status(500).json({ message: "Error updating page setting", error: error.message })
  }
})

const PORT = process.env.VITE_PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
