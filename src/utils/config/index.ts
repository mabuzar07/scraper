import { logger } from "utils/logger";
import { ConfigInterface } from "./types";

class Config {
  private _config: ConfigInterface | undefined;

  get config() {
    if (!this._config) {
      throw new Error("Config not found");
    }
    return this._config;
  }

  set config(config: ConfigInterface) {
    if (!config) {
      throw new Error("⚙️ Config not found");
    }
    logger.info("⚙️ Config imported", config);
    this._config = config;
  }
}

export default new Config();
