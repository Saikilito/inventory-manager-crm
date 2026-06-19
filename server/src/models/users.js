import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";

const userSchema = Schema({
  user: String,
  name: String,
  password: String,
  rol: String,
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
