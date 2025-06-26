import { useEffect, useRef, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Text, Button, View, YStack, H5, Portal, H6 } from "tamagui";
import TransactionHeader from "components/transaction/TransactionHeader";
import TransactionItem from "components/transaction/TransactionItem";
import { useTransactionQuery } from "hooks/transaction/useTransactionQuery";
import { USER_ID } from "constants/User";
import {
  TransactionHeaderProps,
  TransactionProps,
  TransactionRenderEnum,
} from "types/transaction";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { formatDateString } from "utils";
import { Plus } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { TamaguiBottomInput } from "components/transaction/TransactionInput";

export const Home = () => {
  const insets = useSafeAreaInsets();
  const { data: transactionData } = useTransactionQuery(USER_ID);

  const firstHeader = transactionData?.find(
    (transaction) => transaction.type == TransactionRenderEnum.HEADER
  ) as TransactionHeaderProps | undefined;

  const [selectedItem, setSelectedItem] = useState<TransactionProps>();
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

  const handleSelectedItem = (item?: TransactionProps) => {
    setSelectedItem(item);
    sheetRef.current?.expand();
    // console.log(item);
  };

  const handleTransactionDetailSheet = (open: boolean) => {
    if (open) return;

    handleSelectedItem();
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
            automaticallyAdjustKeyboardInsets
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
            snapPoints={["60%"]}
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
                <H6 fontWeight={"500"}>Edit Transaction</H6>
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
                    value={selectedItem?.name}
                    paddingTop={16}
                  />
                </YStack>
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
                    value={String(selectedItem?.amount)}
                    paddingTop={16}
                  />
                </YStack>
                <YStack>
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
                  <TamaguiBottomInput
                    height={50}
                    value={selectedItem?.category_name}
                    paddingTop={16}
                  />
                </YStack>
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
                    value={selectedItem?.date}
                    paddingTop={16}
                  />
                </YStack>
                <YStack marginBottom={50}>
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
                  <TamaguiBottomInput
                    height={50}
                    value={selectedItem?.account_name}
                    paddingTop={16}
                  />
                </YStack>
                <Button>Save</Button>
              </YStack>
            </BottomSheetView>
          </BottomSheet>
        </Portal>
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
