import { configState } from "../../../managers/state/configState";

export function handleUpdateAppConfig(message: any) {
  const { features, providers } = message.data;
  configState.update({
    features: {
      version: configState.state.features.version,
      values: features,
    },
    providers: {
      version: configState.state.providers.version,
      values: providers,
    },
  });
}