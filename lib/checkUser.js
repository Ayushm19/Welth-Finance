import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "./mongoose";
import { User } from "@/models/allModels";

export const checkUser = async () => {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await connectToDatabase();

  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() ||
    `${clerkUser.id}@users.clerk.local`;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    "User";

  const imageUrl = clerkUser.imageUrl;

  try {
    let user = await User.findOne({ clerkUserId: clerkUser.id });
    if (user) return user;

    user = await User.findOne({ email });
    if (user) {
      const alreadyLinked = await User.findOne({ clerkUserId: clerkUser.id });
      if (alreadyLinked) return alreadyLinked;

      user.clerkUserId = clerkUser.id;
      user.name = name;
      if (imageUrl) user.imageUrl = imageUrl;

      try {
        await user.save();
      } catch (error) {
        if (error?.code === 11000) {
          return (
            (await User.findOne({ clerkUserId: clerkUser.id })) ||
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
        clerkUserId: clerkUser.id,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return (
          (await User.findOne({ clerkUserId: clerkUser.id })) ||
          (await User.findOne({ email }))
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to fetch or create user:", error.message);
    return null;
  }
};
