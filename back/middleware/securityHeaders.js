// En-têtes de sécurité, écrits à la main pour ne pas ajouter helmet à la stack.
// L'API ne sert que du JSON : pas de CSP de rendu, on coupe simplement tout
// ce qu'un navigateur pourrait tenter d'interpréter à partir d'une réponse.
exports.securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // Express annonce sa présence par défaut : autant ne pas offrir la version.
  res.removeHeader('X-Powered-By');
  next();
};
