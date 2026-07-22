import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(
      `Assistant model: ${process.env.GEMINI_MODEL || "gemini-3.6-flash (default)"}` +
        `${process.env.GEMINI_API_KEY ? "" : "  [no GEMINI_API_KEY — assistant disabled]"}`
    );
  });
};

startServer();
