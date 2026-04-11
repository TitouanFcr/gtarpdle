module.exports = function(req, res) {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = "https://gtarpdle.fr/auth/discord/callback";
  const scope = "identify guilds.join";
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(302, url);
};
