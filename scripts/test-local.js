// test-local.js
// Prueba rapida desde tu computadora, sin WhatsApp ni Netlify.
//
// Uso:
//   1) Instala Node 18+ (https://nodejs.org)
//   2) En una terminal, parado en la carpeta del proyecto:
//        OPENAI_API_KEY=sk-tu-key node scripts/test-local.js "Hola, pijamada para 4 un sabado"
//      (en Windows PowerShell:  $env:OPENAI_API_KEY="sk-tu-key"; node scripts/test-local.js "tu consulta")
//
// Si no pasas OPENAI_API_KEY, solo verifica que el conocimiento carga bien.

const path = require("path");
const { SYSTEM_PROMPT, MANUAL_VERSION } = require(path.join(
  __dirname,
  "..",
  "netlify",
  "functions",
  "knowledge.js"
));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const question = process.argv.slice(2).join(" ").trim();

async function main() {
  console.log("== Armonium · prueba local ==");
  console.log("Version del manual:", MANUAL_VERSION);
  console.log("Tamano del conocimiento:", SYSTEM_PROMPT.length, "caracteres\n");

  if (!OPENAI_API_KEY) {
    console.log("No hay OPENAI_API_KEY: solo verifique que el conocimiento carga bien. OK ✅");
    console.log('Para probar con IA:  OPENAI_API_KEY=sk-... node scripts/test-local.js "tu consulta"');
    return;
  }

  const userText = question || "Hola, quiero una pijamada para 4 personas un sabado.";
  console.log("Consulta:", userText, "\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      temperature: 0.5,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    console.error("Error OpenAI:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Respuesta del bot:\n");
  console.log(data.choices[0].message.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
