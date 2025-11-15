// frontend/babel.config.js (or wherever it is located)
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"], // <-- ADD THIS LINE
  };
};