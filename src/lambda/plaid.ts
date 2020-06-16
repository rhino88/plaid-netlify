import plaid, { PlaidError } from "plaid";
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from "aws-lambda";

const plaidClient = new plaid.Client(
  process.env.PLAID_CLIENT_ID ?? "",
  process.env.PLAID_SECRET ?? "",
  process.env.PLAID_PUBLIC_KEY ?? "",
  plaid.environments[process.env.PLAID_ENVIRONMENT ?? ""] ?? ""
);

// Hack for...
// 1. PlaidClient functions using ordered arguments instead of a single object argument
// 2. Avoiding runtime introspection of PlaidClient functions
const plaidOrderedParametersByFunction = {
  createAssetReport: ["accessTokens", "daysRequested", "options"],
  createDepositSwitch: ["targetAccountId", "targetAccessToken", "options"],
  createDepositSwitchToken: ["depositSwitchId", "options"],
  createItemAddToken: ["options"],
  createPayment: ["recipient_id", "reference", "amount"],
  createPaymentRecipient: ["name", "iban", "address"],
  createPaymentToken: ["paymentId"],
  createProcessorToken: ["accessToken", "accountId", "processor"],
  createPublicToken: ["accessToken"],
  createStripeToken: ["accessToken", "accountId"],
  deleteItem: ["accessToken"],
  exchangePublicToken: ["publicToken"],
  filterAssetReport: ["assetReportToken", "accountIdsToExclude"],
  getAccounts: ["accessToken", "options"],
  getAllTransactions: ["accessToken", "startDate", "endDate", "options"],
  getAssetReport: ["assetReportToken", "includeInsights"],
  getAssetReportPdf: ["assetReportToken"],
  getAuditCopy: ["auditCopyToken"],
  getAuth: ["accessToken", "options"],
  getBalance: ["accessToken", "options"],
  getCategories: [],
  getCreditDetails: ["accessToken"],
  getDepositSwitch: ["depositSwitchId", "options"],
  getHoldings: ["accessToken"],
  getIncome: ["accessToken"],
  getInstitutionById: ["institutionId", "options"],
  getInstitutions: ["count", "offset", "options"],
  getInvestmentTransactions: ["accessToken", "startDate", "endDate", "options"],
  getItem: ["accessToken"],
  getLiabilities: ["accessToken", "options"],
  getPayment: ["paymentId"],
  getPaymentRecipient: ["recipientId"],
  getTransactions: ["accessToken", "startDate", "endDate", "options"],
  getWebhookVerificationKey: ["keyId"],
  importItem: ["products", "userAuth", "options"],
  invalidateAccessToken: ["accessToken"],
  listPaymentRecipients: [],
  refreshAssetReport: ["assetReportToken", "daysRequested", "options"],
  refreshTransactions: ["accessToken"],
  removeAssetReport: ["assetReportToken"],
  removeAuditCopy: ["auditCopyToken"],
  removeItem: ["accessToken"],
  resetLogin: ["accessToken"],
  sandboxItemFireWebhook: ["accessToken", "webhookCode"],
  sandboxItemSetVerificationStatus: [
    "accessToken",
    "accountId",
    "verificationStatus",
  ],
  sandboxPublicTokenCreate: ["institutionId", "initialProducts", "options"],
  searchInstitutionsByName: ["query", "products", "options"],
  updateItemWebhook: ["accessToken", "webhook"],
};

const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

const snakeToCamelKeys = (obj: any) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...{ [snakeToCamel(key)]: obj[key] },
    }),
    {}
  );

const CorsSuccessResponse = {};

const CorsErrorResponse = {};

const ErrorResponse = {} as APIGatewayProxyResult;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
};

const createErrorResponse = (
  error: Error | PlaidError
): APIGatewayProxyResult => ({
  statusCode: 500,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    code: (error as PlaidError).error_code ?? "",
    type: (error as PlaidError).error_type ?? "",
    message: (error as PlaidError).error_message ?? error.message,
    displayMessage:
      (error as PlaidError).display_message ??
      "Unknown error, please try again later.",
    stack: error.stack,
  }),
});

const createSuccessResponse = (body: object): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const path: string = event.path;
  const plaidFunctionName = path.substring(path.lastIndexOf("/") + 1);
  const plaidFunction = plaidClient[plaidFunctionName];
  if (typeof plaidFunction === "undefined") {
    return createErrorResponse(
      new Error(`A function named ${plaidFunctionName} is not available.`)
    );
  }

  let requestParameters: object;
  try {
    requestParameters = event.body
      ? JSON.parse(event.body)
      : event.queryStringParameters;
  } catch (error) {
    return createErrorResponse(error);
  }

  // Support both snake and camel case parameter names
  requestParameters = snakeToCamelKeys(requestParameters);

  // Order the parameters per function signature :(
  const orderedArgumentNames =
    plaidOrderedParametersByFunction[plaidFunctionName];
  const orderedArguments = orderedArgumentNames.map(
    (parameterName: string) => requestParameters[parameterName]
  );

  try {
    const response = await plaidFunction.call(plaidClient, orderedArguments);
    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
