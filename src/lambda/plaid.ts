import { Context, Callback } from "aws-lambda";

export async function handler(
  event: any,
  context: Context,
  callback: Callback
) {
  return { statusCode: "OK", body: "Hello World" };
}
