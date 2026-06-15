import { Configuration, PlaidApi, PlaidEnvironments, type Products, type CountryCode } from 'plaid';

const env = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase() as keyof typeof PlaidEnvironments;
const basePath = PlaidEnvironments[env] ?? PlaidEnvironments.sandbox;

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET':    process.env.PLAID_SECRET    ?? '',
        'Plaid-Version':   '2020-09-14',
      },
    },
  }),
);

export const PLAID_PRODUCTS: Products[] = ['transactions' as Products];
export const PLAID_COUNTRY_CODES: CountryCode[] = ['GB' as CountryCode];
export const PLAID_LANGUAGE = 'en';
