
import { connectToDatabase } from "./mongoose";
import { User } from "@/models/allModels";

export const checkUser = async () => {
  await connectToDatabase(); // Make sure MongoDB is connected

  const staticUserId = "demo-user-id";

  try {
    // Try to find user by either _id or clerkUserId
    let user = await User.findOne({ $or: [{ _id: staticUserId }, { clerkUserId: staticUserId }] });

    if (!user) {
      user = await User.create({
        _id: staticUserId,
        name: "Demo User",
        email: "knandan400@gmail.com",
        imageUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Demo",
        clerkUserId: staticUserId,
      });
    }

    return user;
  } catch (error) {
    console.error("Failed to fetch or create static user:", error.message);
    return null;
  }
};
