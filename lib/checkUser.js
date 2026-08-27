import { auth } from "@/auth";
import { connectToDatabase } from "./mongoose";
import { User } from "@/models/allModels";

export const checkUser = async () => {
  const session = await auth();
  const googleId = session?.user?.googleId;
  if (!googleId) return null;

  await connectToDatabase();

  const email =
    session.user.email?.toLowerCase() || `${googleId}@users.google.local`;
  const name = session.user.name || "User";
  const imageUrl = session.user.image || undefined;
  const isStaleClerkImage = (url) =>
    typeof url === "string" &&
    (url.includes("img.clerk.com") || url.includes("images.clerk.dev"));

  try {
    let user = await User.findOne({ googleId });
    if (user) {
      let dirty = false;
      if (name && user.name !== name) {
        user.name = name;
        dirty = true;
      }
      if (
        imageUrl &&
        (user.imageUrl !== imageUrl || isStaleClerkImage(user.imageUrl))
      ) {
        user.imageUrl = imageUrl;
        dirty = true;
      }
      if (dirty) await user.save();
      return user;
    }

    user = await User.findOne({ email });
    if (user) {
      const alreadyLinked = await User.findOne({ googleId });
      if (alreadyLinked) return alreadyLinked;

      user.googleId = googleId;
      user.name = name;
      if (imageUrl) user.imageUrl = imageUrl;

      try {
        await user.save();
      } catch (error) {
        if (error?.code === 11000) {
          return (
            (await User.findOne({ googleId })) ||
            (await User.findOne({ email }))
          );
        }
        throw error;
      }

      return user;
    }

    try {
      return await User.create({
        name,
        email,
        imageUrl,
        googleId,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return (
          (await User.findOne({ googleId })) || (await User.findOne({ email }))
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to fetch or create user:", error.message);
    return null;
  }
};
