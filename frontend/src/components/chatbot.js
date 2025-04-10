const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event) {
  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid or missing messages array." }),
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chatHistory = messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    const result = await model.generateContent(chatHistory);
    const reply = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("❌ Error in Gemini function:", err.message || err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong while generating a response.",
        detail: err.message || err.toString(),
      }),
    };
  }
};
