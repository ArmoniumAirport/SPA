// chat.js
// Endpoint de PRUEBA. Sirve para chatear con el "cerebro" del bot (OpenAI + manual)
// desde una pagina web, sin necesidad de WhatsApp. Ideal para testear respuestas.
//
// La pagina public/index.html le pega a esta funcion.

const { SYSTEM_PROMPT } = require("./knowledge");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Usa POST" });
  }
  if (!OPENAI_API_KEY) {
    return json(500, {
      error:
        "Falta OPENAI_API_KEY en las variables de entorno de Netlify. Cargala y volve a desplegar.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "JSON invalido" });
  }

  const userText = (payload.message || "").toString().trim();
  if (!userText) {
    return json(400, { error: "Mensaje vacio" });
  }

  // historial opcional que manda la pagina (para mantener contexto)
  const history = Array.isArray(payload.history) ? payload.history.slice(-16) : [];

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userText },
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json(502, { error: `OpenAI ${res.status}: ${errText}` });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "(sin respuesta)";
    return json(200, { reply });
  } catch (err) {
    return json(500, { error: String(err) });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(obj),
  };
}
