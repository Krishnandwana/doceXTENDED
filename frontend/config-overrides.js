module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: false,
    fs: false,
    path: false,
  };

  // Ignore noisy third-party sourcemap warning in @mediapipe/tasks-vision.
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map/,
  ];

  // Exclude mediapipe bundle from source-map-loader processing.
  if (Array.isArray(config.module?.rules)) {
    config.module.rules.forEach((rule) => {
      if (Array.isArray(rule.oneOf)) {
        rule.oneOf.forEach((one) => {
          if (String(one.loader || "").includes("source-map-loader")) {
            one.exclude = [
              ...(Array.isArray(one.exclude) ? one.exclude : one.exclude ? [one.exclude] : []),
              /@mediapipe[\\/]tasks-vision/,
            ];
          }
        });
      }
    });
  }

  return config;
};
