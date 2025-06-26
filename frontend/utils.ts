import {
  TransactionByDateProps,
  TransactionList,
  TransactionProps,
  TransactionRenderEnum,
  TransactionTypeEum,
} from "types/transaction";

export const formatNumber = (
  number: number,
  locale: Intl.LocalesArgument = "en-US",
  options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
  }
) => {
  const shouldMask = false;
  const formatter = new Intl.NumberFormat(locale, options);

  if (shouldMask) {
    let maskedNumber = Math.floor(Math.random() * 100);
    return formatter.format(
      (maskedNumber *= Math.floor(Math.random()) ? 1 : -1)
    );
  }
  return formatter.format(number);
};

export const formatDateString = (
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  locale: Intl.LocalesArgument = "en-GB"
) => {
  const formatter = new Intl.DateTimeFormat(locale, options);

  const date = new Date(dateString);

  return formatter.format(date);
};

const adjustBrightness = (value: number, percent: number) =>
  Math.max(0, Math.min(255, Math.round(value * (1 + percent))));

const toRgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;

export const indexToLinearGradient = (index: number, maxIndex: number) => {
  const clampedIndex = Math.max(0, Math.min(index, maxIndex));
  const ratio = clampedIndex / maxIndex;

  let r, g;

  if (ratio <= 0.5) {
    // Red to Yellow
    const localRatio = ratio / 0.5;
    r = 255;
    g = Math.round(255 * localRatio);
  } else {
    // Yellow to Green
    const localRatio = (ratio - 0.5) / 0.5;
    r = Math.round(255 * (1 - localRatio));
    g = 255;
  }

  const b = 0;

  // Create lighter and darker versions with transparency
  const startColor = toRgba(
    adjustBrightness(r, -0.2),
    adjustBrightness(g, -0.2),
    adjustBrightness(b, -0.2),
    1
  );

  const endColor = toRgba(
    adjustBrightness(r, 0.2),
    adjustBrightness(g, 0.2),
    adjustBrightness(b, 0.2),
    0.2
  );

  return [startColor, endColor];
};

export function getMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getMonthDaysLeft(date = new Date()) {
  return getMonthEnd(date).getDate() - date.getDate() + 1;
}

const dataCloseChar: Record<string, string> = {
  "{": "}",
  "[": "]",
  '"': '"',
};

export function autoCompleteJSON(jsonString: string) {
  // https://github.com/Operator-technology/json-autocomplete/blob/main/lib/index.js
  if (!jsonString) return null;

  const string = jsonString
    .trim()
    .replace(/(\r\n|\n|\r|\s{2,})/gm, "")
    .replace(/(?<=:)([a-zA-Z]+)(?=\s*(?![,\\}])(?:[,\\}\s]|$))/g, " null");

  const missingChars: string[] = [];
  for (let i = 0; i < string.length; i++) {
    const char = string[i];
    if (char === missingChars[missingChars.length - 1]) {
      missingChars.pop();
    } else if (dataCloseChar[char]) {
      missingChars.push(dataCloseChar[char]);

      if (char === "{") {
        missingChars.push(":");
      }
    }
  }
  if (missingChars[missingChars.length - 1] === ":") {
    if (string[string.length - 1] !== "{") {
      missingChars[missingChars.length - 1] = ": null";
    } else {
      missingChars.pop();
    }
  }
  const missingCharsString = missingChars.reverse().join("");
  const completeString = string + missingCharsString;
  const cleanedString = completeString
    .replace(/"":/g, "")
    .replace(/":}|": }/g, '": null }')
    .replace(/,""}|,}|,\\"\w+\\"}/g, "}")
    .replace(/},]/g, "}]");

  return cleanedString;
}

export const formatTransactions = (data: TransactionProps[]) => {
  const transactionByDate: Record<string, TransactionByDateProps> = {};

  for (let i = 0; i < data.length; i++) {
    const transaction = data[i];
    const { amount, date, entry_type } = transaction;
    const transactionDate = new Date(date);
    const formattedDate = transactionDate.toISOString().split("T")[0];
    const transactionList = transactionByDate?.[formattedDate]?.transactionList;

    if (transactionList) {
      transactionByDate[formattedDate].totalDaySpent =
        entry_type === TransactionTypeEum.INCOME
          ? transactionByDate[formattedDate].totalDaySpent + amount
          : transactionByDate[formattedDate].totalDaySpent - amount;
      transactionByDate[formattedDate].transactionList = [
        ...transactionList,
        { ...transaction },
      ];
      continue;
    }

    transactionByDate[formattedDate] = {
      totalDaySpent:
        entry_type === TransactionTypeEum.INCOME ? amount : -amount,
      transactionList: [{ ...transaction }],
    };
  }
  const transactionList: TransactionList = [];

  Object.keys(transactionByDate).forEach((date) => {
    transactionList.push({
      type: TransactionRenderEnum.HEADER,
      totalAmountSpent: transactionByDate[date].totalDaySpent,
      date: date,
    });
    transactionList.push(
      ...transactionByDate[date].transactionList.map((transaction, index) => ({
        ...transaction,
        type: TransactionRenderEnum.ITEM,
        lastItem: index === transactionByDate[date].transactionList.length - 1,
      }))
    );
  });

  return transactionList;
};
