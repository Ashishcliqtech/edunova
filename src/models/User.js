const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    token: {
      type: String,
      select: false,
    },
    otp: {
      type: String,
      select: false, // optional: to prevent it from being returned by default
    },
    otpExpireAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  const payload = { _id: this._id.toString(), role: this.role };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET || "your_jwt_secret", {
    expiresIn: config.JWT_ACCESS_EXPIRE,
  });
};

// Generate and store refresh token
userSchema.methods.generateRefreshToken = async function () {
  const payload = { _id: this._id.toString(), type: "refresh" };
  const refreshToken = jwt.sign(
    payload,
    config.JWT_REFRESH_SECRET || "your_refresh_secret",
    { expiresIn: config.JWT_REFRESH_EXPIRE }
  );
  this.refreshToken = refreshToken;
  await this.save();
  return refreshToken;
};

// Compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Sanitize output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

// Invalidate refresh token (e.g., logout)
userSchema.methods.invalidateRefreshToken = async function () {
  this.refreshToken = null;
  await this.save();
};

// Find user by access token
userSchema.statics.findByToken = async function (token) {
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    return await this.findById(decoded._id);
  } catch {
    throw new Error("Invalid token");
  }
};

module.exports = mongoose.model("User", userSchema);
