/**
 * vite.config.ts updater for commit-and-tag-version
 * 更新 vite.config.ts 中的版本号
 */

module.exports.readVersion = function (contents) {
  const match = contents.match(/version:\s*['"]([\d.]+)['"]/);
  return match ? match[1] : '0.0.0';
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    /version:\s*['"]([\d.]+)['"]/,
    `version: '${version}'`
  );
};
