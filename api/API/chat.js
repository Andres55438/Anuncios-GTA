
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Falta configurar OPENAI_API_KEY en Vercel"
    });
  }

  try {
    const { message, vacancy = {}, history = [] } = req.body || {};

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: "Sos GTAP, asistente de reclutamiento de GTA en Guatemala. Ayudá a redactar anuncios laborales profesionales. Respondé en español. Si el usuario pide modificar una vacante, devolvé en tu respuesta los cambios sugeridos de forma clara. No inventés salarios ni datos de contacto.",
        input: JSON.stringify({ message, vacancy, history })
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Error al consultar la IA"
      });
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      reply: reply || "No pude generar una respuesta. Probá de nuevo.",
      vacancy: {},
      design_instruction: "",
      regenerate: false
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Error interno del servidor"
    });
  }
}
