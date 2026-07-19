import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../../../../../shared-domain/src/user/user.entity.js";

export interface IUserDocument extends Omit<IUser, "id" | "role" | "user" | "email" | "name">, Document {
  _id: mongoose.Types.ObjectId;
  user: string;
  email: string;
  name: string;
  role: string;
  disabled: boolean;
  isTesting: boolean;
}

const userSchema = new Schema<IUserDocument>({
  user: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  disabled: { type: Boolean, required: true, default: false },
  isTesting: { type: Boolean, default: false, index: true },
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(this.password as string, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

export const UserModel = (mongoose.models.User as mongoose.Model<IUserDocument>) || mongoose.model<IUserDocument>("User", userSchema);
export default UserModel;
