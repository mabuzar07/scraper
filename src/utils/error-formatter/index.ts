import { RequestError } from "got";

/**
 * Enumerable properties show up in for...in loops
 * but the Error object properties are set not to be Enumerable.
 * While calling JSON.stringify(err), most of it's properties don't show
 * because JSON.stringify internally uses something like for...in or Object.keys(err)
 * Bellow we replace the Error with new object which all it's properties are enumerable.
 */
export function objectifyErrorObject(error: Error): any {
  const enumeratedErrorObject = {} as any;
  Object.getOwnPropertyNames(error).forEach((key: string) => {
    if (error instanceof RequestError && ["request", "response", "options"].includes(key)) {
      return;
    }
    // @ts-ignore
    enumeratedErrorObject[key] = error[key];
  });
  return enumeratedErrorObject;
}
