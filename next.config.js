module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {
        encoding: false, // Ignore the encoding module
        fs: false,      // Ignore filesystem module
        net: false,     // Ignore network module
        tls: false,     // Ignore TLS module
      };
      return config;
    },
  };