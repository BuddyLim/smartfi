import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { TextInput } from "react-native";
import { Button, Spinner, XStack, YStack } from "tamagui";
import TransactionHeader from "components/transaction/TransactionHeader";
import TransactionItem from "components/transaction/TransactionItem";
import {
  TransactionHeaderProps,
  TransactionProps,
  TransactionRenderEnum,
} from "types/transaction";
import { formatTransactions } from "utils";
import { USER_ID } from "constants/User";
import { useAccountQuery } from "hooks/account/useAccountQuery";
import { useCreateTransactionByTextMutation } from "hooks/transaction/useCreateTransactionByTextMutation";
import { AccountProps } from "types/account";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ChevronUp } from "@tamagui/lucide-icons";
import { AccountSelection } from "components/account/AccountSelection";
import useTransactionStreamQuery from "hooks/transaction/useTransactionStreamQuery";

export default function AddTransaction() {
  const [transactionText, setTransactionText] = useState("");
  const [jobID, setJobID] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<AccountProps>();

  const isFirstLoad = useRef(true);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 550);
  }, []);

  const toggleLoadingState = () => {
    setIsLoading((prev) => !prev);
  };

  const handleSetJobID = (jobID?: string) => {
    setJobID(jobID);
  };

  const transactions = useTransactionStreamQuery(
    toggleLoadingState,
    handleSetJobID,
    jobID
  );

  const transactionData = useMemo(
    () => formatTransactions(transactions),
    [transactions]
  );

  const firstHeader = transactions?.find(
    (transaction) => transaction.type == TransactionRenderEnum.HEADER
  ) as TransactionHeaderProps | undefined;

  const [activeHeader, setActiveHeader] = useState<
    TransactionHeaderProps | undefined
  >(firstHeader);

  const scrollViewRef =
    useRef<FlashList<TransactionHeaderProps | TransactionProps>>(null);

  useEffect(() => {
    if (transactionData) {
      setActiveHeader(transactionData?.[0] as TransactionHeaderProps);
    }
  }, [transactionData, transactions]);

  const { data: accountData, isSuccess } = useAccountQuery(USER_ID);

  const handleSelectAccount = useCallback((account?: AccountProps) => {
    setSelectedAccount(account);
  }, []);

  useEffect(() => {
    if (!isSuccess && isFirstLoad.current) return;
    isFirstLoad.current = false;
    handleSelectAccount(accountData?.[0]);
  }, [accountData, isSuccess, handleSelectAccount]);

  const getSelectedAccount = (accountName: string) => {
    const selectedAccount = accountData?.find(
      (currAccount) => currAccount.name === accountName
    );
    if (!selectedAccount) return;

    handleSelectAccount(selectedAccount);
  };

  const handleInputChange = (text: string) => {
    setTransactionText(text);
  };

  const handleTransactionText = () => {
    setTransactionText("");
  };

  const { mutateAsync: createByTextMutation } =
    useCreateTransactionByTextMutation(handleTransactionText);

  const handleCreateTransactionByText = async (text: string) => {
    if (!selectedAccount) return;

    const { job_id: jobID } = await createByTextMutation({
      text,
      account_id: selectedAccount.id,
      user_id: USER_ID,
    });
    handleSetJobID(jobID);
    toggleLoadingState();
  };

  const handleScroll = () => {
    const currentActiveHeader =
      // @ts-expect-error Whatever
      scrollViewRef?.current?.stickyContentContainerRef?.props?.rowData;
    if (activeHeader?.date !== currentActiveHeader?.date) {
      setActiveHeader(currentActiveHeader);
    }
  };

  const stickyHeaderIndices = transactionData
    ?.map((item, index) => {
      if (item.type === TransactionRenderEnum.HEADER) {
        return index;
      }

      return null;
    })
    .filter((item) => item !== null) as number[];

  return (
    <>
      <YStack flex={1}>
        {activeHeader && (
          <TransactionHeader
            activeHeader={activeHeader}
            item={activeHeader}
            isDynamicHeader
            top={0}
          />
        )}
        <FlashList
          ref={scrollViewRef}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          scrollEventThrottle={17}
          data={transactionData ?? []}
          automaticallyAdjustKeyboardInsets
          //TODO: remove this sticky header and replace for an in-row dateheader column
          stickyHeaderIndices={stickyHeaderIndices}
          renderItem={({ item }) => {
            if (item.type === TransactionRenderEnum.HEADER) {
              if (activeHeader?.date === item.date) return null;
              return (
                <TransactionHeader
                  activeHeader={activeHeader as TransactionHeaderProps | null}
                  item={item as TransactionHeaderProps}
                />
              );
            }
            return <TransactionItem transaction={item} />;
          }}
          getItemType={(item) => {
            // To achieve better performance, specify the type based on the item
            return item.type === TransactionRenderEnum.HEADER
              ? "sectionHeader"
              : "row";
          }}
          extraData={{
            ...activeHeader,
          }}
          estimatedItemSize={100}
        />
      </YStack>

      <KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={85}>
        <YStack
          paddingTop={15}
          paddingBottom={45}
          paddingHorizontal={20}
          backgroundColor={"#1A1A1A"}
          borderTopRightRadius={30}
          borderTopLeftRadius={30}
          maxHeight={350}
          gap={20}
        >
          <TextInput
            ref={inputRef}
            multiline
            autoCapitalize="words"
            numberOfLines={10}
            placeholder="Enter your transaction"
            style={{
              color: "whitesmoke",
              maxHeight: 200,
            }}
            value={transactionText}
            onChangeText={handleInputChange}
          />
          <XStack justifyContent="space-between">
            <AccountSelection>
              <AccountSelection.Sheet
                id="account-sheet"
                size={"$3"}
                native
                selectedAccount={selectedAccount}
                accountData={accountData}
                getSelectedAccount={getSelectedAccount}
              />
            </AccountSelection>
            <Button
              icon={isLoading ? Spinner : ChevronUp}
              circular
              size={"$3"}
              onPress={() => handleCreateTransactionByText(transactionText)}
            />
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </>
  );
}
