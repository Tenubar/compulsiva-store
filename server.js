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

dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(cookieParser())
// Update the CORS configuration to allow image requests
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
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
    sizes: { type: [String], default: [] },
    shipping: { type: String },
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
    const { name, password, email } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

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
  res.clearCookie("token")
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

app.put("/update-user", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body
    const updatedUser = await User.findByIdAndUpdate(req.user.userId, { name, email }, { new: true }).select(
      "-password",
    )

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message })
  }
})

app.delete("/delete-user", authenticateToken, async (req, res) => {
  try {
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
    await ImageModel.findByIdAndDelete(req.params.id)

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

app.post("/api/products", async (req, res) => {
  try {
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
    if (field !== "image" && field !== "hoverImage") {
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

// Update the product detail route to include image handling and recommended products with images
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Calculate average rating
    const averageRating = product.ratingCount > 0 ? product.ratingSum / product.ratingCount : 0

    // Add default values for fields that might be missing
    const enhancedProduct = {
      ...product.toObject(),
      description: product.description || "Quality product from Carol Store.",
      materials: product.materials || "Premium materials.",
      sizes: product.sizes || ["S", "M", "L", "XL"],
      shipping: product.shipping || "Standard shipping: 3-5 business days.",
      productQuantity: product.productQuantity || 1,
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
    }).limit(4)

    const enhancedRecommended = recommendedProducts.map((recProduct) => {
      return {
        ...recProduct.toObject(),
        images: [recProduct.image, recProduct.hoverImage, ...(recProduct.additionalImages || [])].filter(Boolean),
      }
    })

    enhancedProduct.recommended = enhancedRecommended

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
      sizes: { type: [String], default: [] },
      shipping: { type: String, default: "Standard Shipping: 3-5 Days" },
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
  },
  { timestamps: true },
)

const CartItem = mongoose.model("CartItem", cartItemSchema)

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

app.post("/api/cart", authenticateToken, async (req, res) => {
  try {
    const { productId, title, type, price, image, quantity } = req.body

    // Get the product to check available quantity
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      userId: req.user.userId,
      productId: productId,
    })

    // Calculate total quantity after this addition
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newTotalQuantity = currentQuantity + quantity

    // Check if the new total quantity exceeds available stock
    if (newTotalQuantity > product.productQuantity) {
      return res.status(400).json({
        message: "Maximum stock reached!",
        availableStock: product.productQuantity,
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

    // Also delete any ratings and comments for this product
    await Rating.deleteMany({ productId: req.params.id })
    await Comment.deleteMany({ productId: req.params.id })

    res.status(200).json({ message: "Product and all associated images deleted successfully", product: deletedProduct })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Error deleting product", error })
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

const PORT = process.env.VITE_PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
