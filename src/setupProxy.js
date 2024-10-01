const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://9.42.110.15:25283',
      changeOrigin: true,
      secure: false,
    })
  );
};
