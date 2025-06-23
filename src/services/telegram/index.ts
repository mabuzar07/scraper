import got from "got";
import { SendMessagePayload } from "./types";

class TelegramBot {
  private static readonly BOT_TOKEN: string = "5299626396:AAE5pkZgU9Xu56jThKKam-eXYyZkpVKZ-oc";
  private static readonly GROUP: string = "-625898857";

  public static async sendMessage(msg: string) {
    const payload: SendMessagePayload = {
      chat_id: TelegramBot.GROUP,
      text: msg,
    };

    await got.post(`https://api.telegram.org/bot${TelegramBot.BOT_TOKEN}/sendMessage`, {
      json: payload,
    });
  }
}

export default TelegramBot;
