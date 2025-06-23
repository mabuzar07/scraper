import { round } from "lodash";
/**
 * @param round Defaults to 2
 */
export function fractionToRoundedDecimal(fraction: string, digits: number = 2): number | undefined {
  try {
    const decimal = eval(fraction);
    if (!isNaN(decimal)) {
      return round(decimal, digits);
    }
  } catch (error) {
    return undefined;
  }
}
