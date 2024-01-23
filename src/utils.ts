import {IConfig} from "./sleek-command.js";

export function getCurrentAddons(currentConf: IConfig) {
  return Object.keys(currentConf).map(addonName => {
    return {
      name: addonName,
      value: {name: addonName, version: addonName.split('@')[1]},
    }
  });
}

export function getAddonKey(name: string,  version: string) {
  return name + '@' + version;
}

export function destructureAddonKey(key: string) {
  const [name, version] = key.split('@');
  return {name, version};
}
