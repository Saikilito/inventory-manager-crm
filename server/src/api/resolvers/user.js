import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const createToken = (userLogin, secret, expiresIn) => {
  const { user } = userLogin;

  return jwt.sign(
    { user },
    secret || process.env.SECRET || "MISAIKILITOSECRET",
    { expiresIn },
  );
};

export default {
  Query: {
    getUser: async (parents, args, { models: { User }, token }) => {
      const actualUser = await token();

      if (!actualUser) return null;
      const UserChecked = await User.findOne({ user: actualUser.user });

      return UserChecked;
    },
  },
  Mutation: {
    setUser: async (
      parents,
      { user, name, password, rol },
      { models: { User } },
    ) => {
      try {
        const userFound = await User.findOne({ user });
        if (userFound) throw new Error("User Already Exists");

        const newUser = new User({
          user,
          name,
          password,
          rol,
        });

        await newUser.save().catch((err) => {
          throw err;
        });

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    userAuthentication: async (
      parents,
      { user, password },
      { models: { User }, token },
    ) => {
      const nameUser = await User.findOne({ user });

      if (!nameUser) throw new Error("User Not Found");

      const rigthPassword = await bcrypt.compare(password, nameUser.password);
      if (!rigthPassword) throw new Error("Incorrect Password");
      else {
        token();
        return {
          token: createToken(
            nameUser,
            process.env.SECRET || "MISAIKILITOSECRET",
            "1hr",
          ),
        };
      }
    },
  },
};
