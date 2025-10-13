import { GoNextService } from "../../../services";

export function handleStopStream(service: GoNextService) {
  service.stopStream();
}