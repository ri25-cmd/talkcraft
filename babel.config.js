// babel-preset-expo is installed as a direct devDependency so that it resolves
// from the project root. It otherwise only exists nested inside node_modules/expo,
// which a root-level Babel config cannot reach by name.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
