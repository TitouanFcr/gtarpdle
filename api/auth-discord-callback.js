module.exports = async function(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://gtarpdle.fr/auth/discord/callback";
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const GUILD_ID = "1491242406874710247";

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

  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (BOT_TOKEN) {
    await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: tokenData.access_token }),
    });
  }

  // La page HTML lit le score local et l'envoie à Supabase
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><script>
    try {
      const d = JSON.parse(localStorage.getItem("gtarpdle_v1") || "{}");
      const localScore = parseInt(d.totalScore) || 0;
      d.discordId = "${discordId}";
      d.pseudo = "${pseudo}";
      d.avatar = ${avatar ? `"${avatar}"` : "null"};
      localStorage.setItem("gtarpdle_v1", JSON.stringify(d));
      // Envoie le vrai score local à Supabase
      fetch("/api/scores", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          discord_id: "${discordId}",
          pseudo: "${pseudo}",
          avatar: ${avatar ? `"${avatar}"` : "null"},
          score: localScore
        })
      }).then(function(){ window.location.href = "/"; });
    } catch(e) {
      window.location.href = "/";
    }
  <\/script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};
