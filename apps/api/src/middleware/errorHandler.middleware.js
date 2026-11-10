// Global error handler middleware
export default function (err, req, res, next) {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: err.details || undefined,
    });
};

