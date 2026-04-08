const https = require("https");

function post(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async function(event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  if (!code) {
    return { statusCode: 400, body: "Missing code" };
  }

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://gtarpdle.fr/auth/discord/callback";

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT_URI,
  }).toString();

  const tokenData = await post({
    hostname: "discord.com",
    path: "/api/oauth2/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(params),
    }
  }, params);

  if (!tokenData.access_token) {
    return { statusCode: 400, body: "Token error" };
  }

  const userOptions = {
    hostname: "discord.com",
    path: "/api/users/@me",
    method: "GET",
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  };

  const userData = await new Promise((resolve, reject) => {
    https.get(userOptions, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const discordId = userData.id;
  const username = userData.username;
  const avatar = userData.avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${userData.avatar}.png`
    : null;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><title>Connexion...</title></head>
<body>
<script>
  try {
    const d = JSON.parse(localStorage.getItem("gtarpdle_v1") || "{}");
    d.discordId = "${discordId}";
    d.pseudo = "${username}";
    d.avatar = ${avatar ? `"${avatar}"` : "null"};
    localStorage.setItem("gtarpdle_v1", JSON.stringify(d));
  } catch(e) {}
  window.location.href = "/";
</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  };
};
