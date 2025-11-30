const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withShareExtensionActivationRules = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const infoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'frontendShareExtension',
        'Info.plist'
      );

      if (fs.existsSync(infoPlistPath)) {
        let infoPlistContent = fs.readFileSync(infoPlistPath, 'utf-8');

        // Replace empty NSExtensionActivationRule dict with proper activation rules
        const emptyActivationRule = `<key>NSExtensionActivationRule</key>
\t\t\t<dict/>`;

        const properActivationRule = `<key>NSExtensionActivationRule</key>
\t\t\t<dict>
\t\t\t\t<key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
\t\t\t\t<integer>1</integer>
\t\t\t\t<key>NSExtensionActivationSupportsText</key>
\t\t\t\t<true/>
\t\t\t</dict>`;

        if (infoPlistContent.includes(emptyActivationRule)) {
          infoPlistContent = infoPlistContent.replace(
            emptyActivationRule,
            properActivationRule
          );
          fs.writeFileSync(infoPlistPath, infoPlistContent);
          console.log('✅ Fixed NSExtensionActivationRule in share extension Info.plist');
        }
      }

      return config;
    },
  ]);
};

module.exports = ({ config }) => {
  // Read the base configuration from app.json
  const appConfig = require('./app.json').expo;

  return {
    ...appConfig,
    plugins: [
      ...appConfig.plugins,
      withShareExtensionActivationRules,
    ],
  };
};
