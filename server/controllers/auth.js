import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { rmSync } from "fs";

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;

    // Check for required fields manually (optional, defensive)
    if (!name || !email || !password || !avatar) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Optional: Check if username is already taken
    const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
    });
    const savedUser = await user.save();
    return res.status(201).json({ user: savedUser });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { newName, newAvatar, newPassword } = req.body;
    const id = req.user.id;
    const updatedUser = await User.findById(id);
    console.log(updatedUser);
    if (newName) {
      if (newName === updatedUser.name) {
        return res.status(400).send(`Name is unchanged.`);
      }
      const repeatedName = await User.findOne({ name: newName });
      if (repeatedName) {
        return res
          .status(400)
          .send(`Name is already taken. Choose a different name.`);
      }
      updatedUser.name = newName;
    }
    if (newPassword) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      if (hashedPassword === updatedUser.password) {
        return res.status(400).send(`Please change the password`);
      }
      updatedUser.password = hashedPassword;
    }
    if (newAvatar) {
      if (newAvatar === updatedUser.avatar) {
        res.status(400).send(`Please change the avatar.`);
      }
      updatedUser.avatar = newAvatar;
    }
    updatedUser.save();
    res.status(201).send({ message: "user updated", updatedUser });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("User not found");

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(401).json("Wrong credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
    const { password: pwd, ...userRes } = user._doc;
    return res
      .status(201)
      .cookie("token", { token }, { httpOnly: true })
      .json({ user: userRes });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    return res.status(201).json({ name: user.name, avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};
