import { SelectProps } from "tamagui";

export interface AccountSelectionProps extends SelectProps {
  selectedAccount?: AccountProps;
  accountData?: AccountProps[];
  getSelectedAccount: (accountName: string) => void;
}

export interface AccountProps {
  id: number;
  name: string;
  initial_balance: number;
  currency: string;
  user_id: number;
  latest_balance: number;
}

export interface CreateAccountMutationProps {
  user_id: number;
  initial_balance: number;
  currency: string;
  name: string;
}

export interface AddAccountProps {
  name: string;
  initial_balance: string;
  currency: CurrencyProps;
}

export enum AddAccountStatusEnum {
  OFF = "off",
  SUBMITTING = "submitting",
  SUBMITTED = "submitted",
}

export interface AccountGlanceRespProps {
  account_name: string;
  account_id: number;
  end_of_last_month_account_balance: number;
  current_account_balance: number;
}

export interface AccountGlanceQueryProps {
  accountName: string;
  accountId: number;
  endOfLastMonthAccountBalance: number;
  currentAccountBalance: number;
}

export interface AccountDurationProps {
  value: string;
  label: string;
}

export interface CurrencySelectionProps extends SelectProps {
  selectedCurrency?: CurrencyProps;
  onCurrencyChange: (code: string) => void;
}

export interface CurrencyProps {
  symbol: string;
  name: string;
  symbol_native: string;
  code: string;
  emoji: string;
}
