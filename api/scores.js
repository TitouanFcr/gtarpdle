module.exports = async function(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (req.method === "GET") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/scores?order=score.desc&limit=100`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await r.json();
    return res.json(Array.isArray(data) ? data : []);
  }

  if (req.method === "POST") {
    const { discord_id, pseudo, avatar, score } = req.body;
    if (!discord_id) return res.status(400).json({ error: "Missing discord_id" });

    const existing = await fetch(`${SUPABASE_URL}/rest/v1/scores?discord_id=eq.${discord_id}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const rows = await existing.json();
    const currentScore = rows && rows[0] ? parseInt(rows[0].score) || 0 : 0;
    const newScore = Math.max(currentScore, parseInt(score) || 0);

    const r = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({ discord_id, pseudo, avatar, score: newScore }),
    });
    const data = await r.json();
    return res.json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
};
