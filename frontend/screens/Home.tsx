import { useEffect, useRef, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Text,
  Button,
  View,
  YStack,
  H5,
  Portal,
  H6,
  Select,
  Adapt,
  Sheet,
  ScrollView,
  XStack,
} from "tamagui";
import TransactionHeader from "components/transaction/TransactionHeader";
import TransactionItem from "components/transaction/TransactionItem";
import { useTransactionQuery } from "hooks/transaction/useTransactionQuery";
import { USER_ID } from "constants/User";
import {
  TransactionEditDraft,
  TransactionEditProps,
  TransactionHeaderProps,
  TransactionProps,
  TransactionRenderEnum,
} from "types/transaction";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { formatDateString } from "utils";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Plus,
  Trash,
} from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { TamaguiBottomInput } from "components/transaction/TransactionInput";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import DatePicker from "react-native-date-picker";
import { useCategoriesQuery } from "hooks/category/useCategoriesQuery";
import { useAccountQuery } from "hooks/account/useAccountQuery";
import { useDeleteTransactionMutation } from "hooks/transaction/useDeleteTransactionMutation";

export const Home = () => {
  const insets = useSafeAreaInsets();
  const { data: transactionData } = useTransactionQuery(USER_ID);

  const firstHeader = transactionData?.find(
    (transaction) => transaction.type == TransactionRenderEnum.HEADER
  ) as TransactionHeaderProps | undefined;

  const [activeHeader, setActiveHeader] = useState<
    TransactionHeaderProps | undefined
  >(firstHeader);

  const sheetRef = useRef<BottomSheet>(null);

  const scrollViewRef =
    useRef<FlashList<TransactionHeaderProps | TransactionProps>>(null);

  useEffect(() => {
    if (transactionData) {
      setActiveHeader(transactionData?.[0] as TransactionHeaderProps);
    }
  }, [transactionData]);

  const handleScroll = () => {
    const currentActiveHeader =
      // @ts-expect-error Whatever
      scrollViewRef?.current?.stickyContentContainerRef?.props?.rowData;
    if (activeHeader?.date !== currentActiveHeader?.date) {
      setActiveHeader(currentActiveHeader);
    }
  };

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<TransactionEditDraft>();
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const handleSelectedItem = (item: TransactionProps) => {
    console.log(item);
    reset({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      category: {
        category_id: item.category_id,
        category_name: item.category_name,
      },
      suggested_categories: item.suggested_categories,
      date: item.date,
      account: {
        account_name: item.account_name,
        account_id: item.account_id,
      },
    });
    sheetRef.current?.expand();
  };

  const { mutateAsync } = useMutation<
    TransactionProps,
    Error,
    TransactionEditProps
  >({
    mutationFn: async (data) => {
      const {
        id,
        category: { category_id },
        account: { account_id },
        date,
        ...rest
      } = data;
      const resp = await fetch(`${BaseURL}/transaction/edit/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...rest,
          category_id,
          account_id,
          date: new Date(date).toISOString(),
        }),
      });
      const val = await resp.json();
      return val;
    },
    // onSettled: () => {
    //   queryClient.invalidateQueries({
    //     queryKey: CategoryKey.all(),
    //   });
    // },
  });

  const handleEditTransaction: SubmitHandler<TransactionEditProps> = async (
    data
  ) => {
    await mutateAsync({
      ...data,
    });
  };

  const handleDeleteTransaction = async () => {
    const transactionId = getValues("id");
    if (!transactionId) return;

    try {
      await deleteTransaction({
        transaction_id: transactionId,
        user_id: USER_ID,
      });
      sheetRef.current?.close();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
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

  const transactionMonthAndYear = activeHeader?.date
    ? formatDateString(activeHeader.date, {
        month: "long",
        year: "numeric",
      })
    : "";

  const { data: categoriesData } = useCategoriesQuery();
  const { data: accountData } = useAccountQuery(USER_ID);
  const { mutateAsync: deleteTransaction } = useDeleteTransactionMutation();

  console.log(getValues("suggested_categories"));

  return (
    <>
      <SafeAreaView style={styles.homeContainer}>
        <H5 marginHorizontal={20} marginBottom={3} fontWeight={"bold"}>
          Transactions
        </H5>
        <Text marginHorizontal={20} marginBottom={10}>
          {transactionMonthAndYear}
        </Text>
        <YStack
          paddingTop={10}
          flex={1}
          backgroundColor={"black"}
          borderTopLeftRadius={40}
          borderTopRightRadius={40}
        >
          {activeHeader && (
            <TransactionHeader
              activeHeader={activeHeader}
              item={activeHeader}
              isDynamicHeader
            />
          )}
          <FlashList
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}
            data={transactionData ?? []}
            //TODO: remove this sticky header and replace for an in-row dateheader column
            scrollEventThrottle={17}
            stickyHeaderIndices={stickyHeaderIndices}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScroll}
            onScrollEndDrag={handleScroll}
            renderItem={({ item }) => {
              if (item.type === TransactionRenderEnum.ITEM) {
                return (
                  <TransactionItem
                    transaction={item}
                    handleSelectedItem={handleSelectedItem}
                  />
                );
              }

              if (activeHeader?.date === item.date) return null;
              return (
                <TransactionHeader
                  activeHeader={activeHeader as TransactionHeaderProps | null}
                  item={item as TransactionHeaderProps}
                />
              );
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
        <View
          display="flex"
          alignItems="flex-end"
          style={{
            bottom: 110,
            right: 5,
            zIndex: 5,
            width: "100%",
          }}
        >
          <Button
            onPress={() => router.push("/(tabs)/(index)/add")}
            flex={1}
            right={10}
            icon={Plus}
            width={"fit-content"}
            circular
            size={"$5"}
            backgroundColor={"$accent1"}
          />
        </View>
        <Portal>
          <BottomSheet
            animateOnMount={false}
            snapPoints={["63%"]}
            index={-1}
            enableDynamicSizing={false}
            enablePanDownToClose
            ref={sheetRef}
            keyboardBehavior="interactive"
            // keyboardBlurBehavior={"restore"}
            topInset={insets.top}
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.8}
              />
            )}
            backgroundStyle={{
              backgroundColor: "#1A1A1A",
              borderRadius: 40,
            }}
          >
            <BottomSheetView style={{ paddingHorizontal: 25, paddingTop: 5 }}>
              <YStack gap={20}>
                <XStack justifyContent="space-between" alignItems="center">
                  <H6 fontWeight={"500"}>Edit Transaction</H6>
                  <Button
                    chromeless
                    size={"$2"}
                    circular
                    onLongPress={handleDeleteTransaction}
                    icon={
                      <Trash
                        color="$red10"
                        size={18}
                        strokeWidth={2}
                        stroke={"$red10"}
                        fill={"$red10"}
                      />
                    }
                  />
                </XStack>
                <Controller
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <YStack>
                      <Text
                        position="absolute"
                        zIndex={5}
                        left={15}
                        top={8}
                        fontSize={"$1"}
                        color={"$color9"}
                      >
                        Name:
                      </Text>
                      <TamaguiBottomInput
                        height={50}
                        paddingTop={16}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        minWidth={"100%"}
                      />
                    </YStack>
                  )}
                  name="name"
                />
                <Controller
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <YStack>
                      <Text
                        position="absolute"
                        zIndex={5}
                        left={15}
                        top={8}
                        fontSize={"$1"}
                        color={"$color9"}
                      >
                        Amount:
                      </Text>
                      <TamaguiBottomInput
                        height={50}
                        paddingTop={16}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        keyboardType="numeric"
                        returnKeyType="done"
                        enablesReturnKeyAutomatically
                        value={String(value)}
                        minWidth={"100%"}
                      />
                    </YStack>
                  )}
                  name="amount"
                />
                <Controller
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field: { value } }) => (
                    <YStack gap={10}>
                      <Text
                        position="absolute"
                        zIndex={5}
                        left={15}
                        top={8}
                        fontSize={"$1"}
                        color={"$color9"}
                      >
                        Category:
                      </Text>
                      <Select
                        value={String(value?.category_id)}
                        onValueChange={(value) =>
                          setValue("category", JSON.parse(value))
                        }
                      >
                        <Select.Trigger
                          width={"100%"}
                          height={50}
                          paddingLeft={14}
                          paddingTop={20}
                          iconAfter={ChevronDown}
                        >
                          <XStack gap={3} alignItems="center">
                            {value?.category_name === "Unknown" ? (
                              <AlertCircle size={13} color={"darkkhaki"} />
                            ) : undefined}
                            <Text fontSize={"$3"} color={"$color11"}>
                              {value?.category_name}
                            </Text>
                          </XStack>
                        </Select.Trigger>

                        <Adapt when={true} platform="touch">
                          <Sheet
                            native
                            dismissOnSnapToBottom
                            snapPoints={[80]}
                            snapPointsMode="percent"
                            disableDrag
                            unmountChildrenWhenHidden
                            modal
                          >
                            <Sheet.Overlay
                              backgroundColor="$color1"
                              animation="lazy"
                              enterStyle={{ opacity: 0 }}
                              opacity={0.7}
                              exitStyle={{ opacity: 0 }}
                            />
                            <Sheet.Frame>
                              <Adapt.Contents />
                            </Sheet.Frame>
                          </Sheet>
                        </Adapt>

                        <Select.Content zIndex={200000}>
                          <Select.Viewport
                            animation="quick"
                            animateOnly={["transform", "opacity"]}
                            enterStyle={{ opacity: 0, y: -10 }}
                            exitStyle={{ opacity: 0, y: 10 }}
                            minWidth={200}
                          >
                            <Select.Group paddingBottom={30}>
                              <ScrollView>
                                <Select.Label borderRadius={13}>
                                  Expenses
                                </Select.Label>
                                {categoriesData?.debitList.map((debitData) => {
                                  const { id, name } = debitData;
                                  return (
                                    <Select.Item
                                      index={id}
                                      key={id}
                                      value={JSON.stringify({
                                        category_id: id,
                                        category_name: name,
                                      })}
                                    >
                                      <Select.ItemText size={"$5"}>
                                        <Text>{name}</Text>
                                      </Select.ItemText>
                                      {value?.category_id === id && (
                                        <Check size={16} />
                                      )}
                                    </Select.Item>
                                  );
                                })}
                                <Select.Label borderRadius={13}>
                                  Incomes
                                </Select.Label>
                                {categoriesData?.creditList.map(
                                  (creditList) => {
                                    const { id, name } = creditList;
                                    return (
                                      <Select.Item
                                        index={id}
                                        key={id}
                                        value={name}
                                      >
                                        <Select.ItemText size={"$5"}>
                                          <Text>{name}</Text>
                                        </Select.ItemText>
                                        <Select.ItemIndicator marginLeft="auto">
                                          <Check size={16} />
                                        </Select.ItemIndicator>
                                      </Select.Item>
                                    );
                                  }
                                )}
                              </ScrollView>
                            </Select.Group>
                          </Select.Viewport>
                        </Select.Content>
                      </Select>
                      {getValues("category")?.category_name === "Unknown" &&
                      (getValues("suggested_categories")?.length ?? 0) > 0 ? (
                        <YStack paddingLeft={5} gap={8}>
                          <Text color={"$color10"} fontSize={"$2"}>
                            Suggested Categories:
                          </Text>
                          <XStack gap={10}>
                            {getValues("suggested_categories")?.map(
                              (suggestedCategory) => {
                                const { category_id, category_name } =
                                  suggestedCategory;
                                return (
                                  <Button
                                    size={"$2"}
                                    key={category_id}
                                    onPress={() =>
                                      setValue("category", suggestedCategory)
                                    }
                                  >
                                    {category_name}
                                  </Button>
                                );
                              }
                            )}
                          </XStack>
                        </YStack>
                      ) : null}
                    </YStack>
                  )}
                  name="category"
                />
                <Controller
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <YStack>
                      <Text
                        position="absolute"
                        zIndex={5}
                        left={15}
                        top={8}
                        fontSize={"$1"}
                        color={"$color9"}
                      >
                        Date:
                      </Text>
                      <TamaguiBottomInput
                        height={50}
                        paddingTop={16}
                        editable={false}
                        focusable={false}
                        enablesReturnKeyAutomatically
                        onPress={() => setOpenDatePicker(true)}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={
                          value
                            ? formatDateString(value, {
                                dateStyle: "medium",
                              })
                            : ""
                        }
                        minWidth={"100%"}
                      />
                    </YStack>
                  )}
                  name="date"
                />
                <Controller
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field: { value } }) => (
                    <YStack>
                      <Text
                        position="absolute"
                        zIndex={5}
                        left={15}
                        top={8}
                        fontSize={"$1"}
                        color={"$color9"}
                      >
                        Account:
                      </Text>
                      <Select
                        value={String(value?.account_id)}
                        onValueChange={(value) =>
                          setValue("account", JSON.parse(value))
                        }
                      >
                        <Select.Trigger
                          width={"100%"}
                          height={50}
                          paddingLeft={14}
                          paddingTop={18}
                          marginBottom={80}
                          iconAfter={ChevronDown}
                        >
                          <Select.Value>{value?.account_name}</Select.Value>
                        </Select.Trigger>

                        <Adapt when={true} platform="touch">
                          <Sheet
                            native
                            dismissOnSnapToBottom
                            snapPoints={[80]}
                            snapPointsMode="percent"
                            disableDrag
                            unmountChildrenWhenHidden
                            modal
                          >
                            <Sheet.Overlay
                              backgroundColor="$color1"
                              animation="lazy"
                              enterStyle={{ opacity: 0 }}
                              opacity={0.7}
                              exitStyle={{ opacity: 0 }}
                            />
                            <Sheet.Frame>
                              <Adapt.Contents />
                            </Sheet.Frame>
                          </Sheet>
                        </Adapt>

                        <Select.Content zIndex={200000}>
                          <Select.Viewport
                            animation="quick"
                            animateOnly={["transform", "opacity"]}
                            enterStyle={{ opacity: 0, y: -10 }}
                            exitStyle={{ opacity: 0, y: 10 }}
                            minWidth={200}
                          >
                            <Select.Group paddingBottom={30}>
                              <ScrollView>
                                <Select.Label borderRadius={13}>
                                  Account
                                </Select.Label>
                                {accountData?.map((account) => {
                                  const { id, name } = account;
                                  return (
                                    <Select.Item
                                      index={id}
                                      key={id}
                                      value={JSON.stringify({
                                        account_id: id,
                                        account_name: name,
                                      })}
                                    >
                                      <Select.ItemText size={"$5"}>
                                        <Text>{name}</Text>
                                      </Select.ItemText>
                                      {value?.account_id === id && (
                                        <Check size={16} />
                                      )}
                                    </Select.Item>
                                  );
                                })}
                              </ScrollView>
                            </Select.Group>
                          </Select.Viewport>
                        </Select.Content>
                      </Select>
                    </YStack>
                  )}
                  name="account"
                />
                <Button
                  onPress={handleSubmit((data) =>
                    handleEditTransaction(data as TransactionEditProps)
                  )}
                >
                  Save
                </Button>
              </YStack>
            </BottomSheetView>
          </BottomSheet>
        </Portal>
        <DatePicker
          modal
          open={openDatePicker}
          date={getValues("date") ? new Date(getValues("date")!) : new Date()}
          mode="date"
          onConfirm={(date) => {
            setOpenDatePicker(false);
            setValue("date", date.toISOString());
          }}
          onCancel={() => {
            setOpenDatePicker(false);
          }}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});
