export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://gtarpdle.fr/auth/discord/callback";
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).send("Token error");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  const discordId = user.id;
  const pseudo = user.username;
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png`
    : null;

  await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({ discord_id: discordId, pseudo, avatar, score: 0 }),
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><script>
    try {
      const d = JSON.parse(localStorage.getItem("gtarpdle_v1") || "{}");
      d.discordId = "${discordId}";
      d.pseudo = "${pseudo}";
      d.avatar = ${avatar ? `"${avatar}"` : "null"};
      localStorage.setItem("gtarpdle_v1", JSON.stringify(d));
    } catch(e) {}
    window.location.href = "/";
  </script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
