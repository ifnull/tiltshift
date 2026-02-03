const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Config plugin to restrict supported destinations to iPhone only
 * Disables Mac (Designed for iPhone) and Apple Vision (Designed for iPhone)
 */
const withIphoneOnly = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== 'undefined') {
        const buildSettings = configurations[key].buildSettings;
        
        // Set to iPhone only (1 = iPhone, 2 = iPad, "1,2" = both)
        buildSettings.TARGETED_DEVICE_FAMILY = '1';
        
        // Disable Mac Catalyst
        buildSettings.SUPPORTS_MACCATALYST = 'NO';
        
        // Disable "Designed for iPhone" on Mac
        buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'NO';
        
        // Disable "Designed for iPhone" on Apple Vision
        buildSettings.SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD = 'NO';
      }
    }

    return config;
  });
};

module.exports = withIphoneOnly;
