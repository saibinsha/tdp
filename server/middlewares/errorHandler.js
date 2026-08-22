function errorHandler(err, req, res, next) {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.message && err.message.includes('buffering timed out')) ||
    (err.message && err.message.includes('topology was destroyed'))
  ) {
    console.warn('[AI Studio] Database offline — returning fallback response for', req.method, req.path);
    if (req.method === 'GET') {
      if (req.path.includes('/profile') || req.path.includes('/me')) {
        return res.json({ ok: true, user: null });
      }
      return res.json({ ok: true, data: [], items: [], blogs: [], polls: [], surveys: [], works: [], groups: [], alerts: [], news: [], reports: [] });
    }
    return res.status(503).json({ ok: false, message: 'Database is currently offline' });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    return res.status(status).json({
      ok: false,
      message,
      stack: err.stack,
    });
  }

  return res.status(status).json({
    ok: false,
    message: status >= 500 ? 'Internal Server Error' : message,
  });
}

module.exports = { errorHandler };
