
import express from "express";
import mongoose from "mongoose";
import pkg from "pg";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Joi from "joi"; // Input validation

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

//PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

//MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));

// MongoDB TTL Index (expires: 600 handles the 10-minute deletion automatically)
const otpSchema = new mongoose.Schema({
  email: String,
  phone: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const OTP = mongoose.model("OTP", otpSchema);


// VALIDATION MIDDLEWARE & SCHEMAS

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((err) => err.message);
    return res.status(400).json({ error: "Validation Failed", details: errors });
  }
  next();
};

const sendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).optional()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).optional(),
  otp: Joi.string().length(6).required() 
});

const leadSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).optional(),
  institution_name: Joi.string().min(2).required(),
  institution_type: Joi.string().valid('Bank', 'NBFC', 'MFI').required(), 
  city: Joi.string().required(),
  loan_book_size: Joi.string().required()
});


// API ENDPOINTS

// 1. Send OTP (Dev Mode / No Email)

app.post("/api/auth/send-otp", validate(sendOtpSchema), async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    // Generate the 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save it to MongoDB so Step 2 can verify it
    await OTP.deleteMany({ email });
    await OTP.create({ email, phone, otp });
    
    console.log(`Generated OTP for ${email}: ${otp}`);

    // 🔥 Send the OTP directly back to the frontend
    res.json({ 
      message: "OTP generated successfully ", 
      devModeOtp: otp 
    });
    
  } catch (err) {
    console.error("\n SERVER CRASH:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 2. Verify OTP (X-Ray Debugging Version)

app.post("/api/auth/verify-otp", validate(verifyOtpSchema), async (req, res) => {
  try {
    const email = req.body.email.trim();
    const otp = req.body.otp.trim();

    console.log("\n--- 🔍 VERIFY OTP X-RAY ---");
    console.log(`1. FRONTEND SENT -> Email: '${email}' | OTP: '${otp}'`);

    const record = await OTP.findOne({ email: email, otp: otp });
    
    if (!record) {
      console.log("2. RESULT -> MATCH FAILED \n");
      return res.status(400).json({ error: "Invalid or Expired OTP" });
    }

    await OTP.deleteOne({ _id: record._id });

    const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
    
    console.log("2. RESULT -> MATCH SUCCESS \n");
    res.json({ token, message: "Verification successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// 3. Save Lead
app.post("/api/leads", validate(leadSchema), async (req, res) => {
  try {
    const {
      email,
      phone,
      institution_name,
      institution_type,
      city,
      loan_book_size,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO leads 
      (email, phone, institution_name, institution_type, city, loan_book_size, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [email, phone, institution_name, institution_type, city, loan_book_size, "new"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: "A lead with this email already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

// 4. Get Lead
app.get("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM public.leads WHERE id=$1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve lead" });
  }
});

//Test Connections
pool.query("SELECT current_database()")
  .then(res => console.log("DB:", res.rows))
  .catch(err => console.log(err));

pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
`)
.then(res => console.log("Tables:", res.rows))
.catch(err => console.log(err));
//port
app.listen(5000, () => console.log("Server running on port 5000"));
