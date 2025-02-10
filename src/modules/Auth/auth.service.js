import { createError, crypto } from "#packages/index.js";

import {
  decodeToken,
  generateAuthToken,
  generateVerificationToken,
  sendVerificationEmail,
} from "#utils/index.js";
import { dataAccess } from "#dataAccess/index.js";

const { save, read } = dataAccess;

const authService = {
  signUp: async ({ firstName, lastName, email, password, role }) => {
    const existingUser = await read.byEmail(email);
    if (existingUser) {
      throw createError(400, "A user with this email already exists.");
    }

    const userName =
      `${firstName}${crypto.createHash("sha256").update(email).digest("hex").substring(0, 8)}`.toLowerCase();

    const newUser = await save.user(
      firstName,
      lastName,
      userName,
      email,
      password,
      role
    );
    if (!newUser) {
      throw createError(500, "Failed to create a new user.");
    }

    const verificationToken = generateVerificationToken(newUser._id);
    if (!verificationToken) {
      throw createError(500, "An error occurred while generating the token.");
    }

    const isEmailSent = await sendVerificationEmail(email, verificationToken);
    if (!isEmailSent) {
      throw createError(500, "Failed to send the welcome email.");
    }

    return "User registered successfully";
  },

  signIn: async ({ email, password, isRemembered }) => {
    const existingUser = await read.byEmail(email);
    if (!existingUser) {
      throw createError(401, "Invalid email or password.");
    }

    const isValid = await existingUser.comparePassword(password);
    if (!isValid) {
      throw createError(401, "Invalid email or password.");
    }

    const token = generateAuthToken(
      existingUser.role,
      existingUser._id,
      isRemembered
    );
    if (!token) {
      throw createError(500, "Token generation failed");
    }

    const result = {
      id: existingUser._id,
      role: existingUser.role,
      token,
    };

    return result;
  },

  signOut: async (token) => {
    const decoded = await decodeToken(token);
    if (!decoded) {
      throw createError(401, "The provided token is invalid or expired.");
    }

    const id = decoded.id;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiration
    const blacklistedToken = await save.blacklistedToken(token, expiresAt, id);

    if (!blacklistedToken) {
      throw createError(500, "An error occurred while blacklisting the token.");
    }

    return "Sign-out successful. The token has been invalidated.";
  },

  forgotPassword: async (email, password) => {
    const existingUser = await read.byEmail(email);
    if (!existingUser) {
      throw createError(400, "A user with this email does not exist.");
    }

    const verificationToken = generateVerificationToken(existingUser._id);
    if (!verificationToken) {
      throw createError(500, "An error occurred while generating the token.");
    }

    const isEmailSent = await sendVerificationEmail(email, verificationToken);
    if (!isEmailSent) {
      throw createError(500, "Failed to send the welcome email.");
    }

    const updatedUser = await update.forgottenPassword(email, hashedPassword);
    if (!updatedUser) {
      throw createError(404, "User not found or update failed");
    }

    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      throw createError(500, "An error occurred while hashing the password.");
    }

    return "Password updated successfully";
  },
};

export default authService;
