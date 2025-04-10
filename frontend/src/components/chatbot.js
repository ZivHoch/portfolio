const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event) {
  try {
    const { messages } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chatHistory = messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    const result = await model.generateContent(chatHistory);
    const reply = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Error in Gemini function:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." }),
    };
  }
};
