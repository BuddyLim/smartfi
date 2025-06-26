import { useState } from "react";
import { FlatList, KeyboardAvoidingView } from "react-native";
import {
  Adapt,
  Button,
  Input,
  Label,
  Select,
  Sheet,
  Spinner,
  Text,
  YStack,
} from "tamagui";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Check, ChevronDown } from "@tamagui/lucide-icons";
import { useCreateAccountMutation } from "hooks/account/useCreateAccountMutation";
import { BANK_NAME_LIST } from "constants/BankPlaceHolderList";
import {
  AddAccountProps,
  AddAccountStatusEnum,
  CurrencySelectionProps,
} from "types/account";
import { CURRENCY_LIST } from "constants/CurrencyList";

export default function AddAccount() {
  const [status, setStatus] = useState<AddAccountStatusEnum>(
    AddAccountStatusEnum.OFF
  );
  const { mutateAsync } = useCreateAccountMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddAccountProps>();

  const handleStatus = (state: AddAccountStatusEnum) => {
    setStatus(state);
  };

  const onSubmit: SubmitHandler<AddAccountProps> = async (data) => {
    handleStatus(AddAccountStatusEnum.SUBMITTING);

    await mutateAsync({
      name: data.name,
      initial_balance: Number(data.initial_balance),
      currency: data.currency.code,
      user_id: 1,
    });

    handleStatus(AddAccountStatusEnum.SUBMITTED);

    reset();

    setTimeout(() => {
      handleStatus(AddAccountStatusEnum.OFF);
    }, 6000);
  };

  const bankPlaceHolder =
    BANK_NAME_LIST[Math.floor(Math.random() * BANK_NAME_LIST.length)];

  return (
    <KeyboardAvoidingView>
      <YStack padding={30} gap={30} marginBottom={10}>
        <YStack>
          <Label>Account Name</Label>
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder={bankPlaceHolder}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                minWidth={"100%"}
              />
            )}
            name="name"
          />
          {errors.name && <Text>This is required.</Text>}
        </YStack>
        <YStack>
          <Label>Initial Balance</Label>
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                minWidth={"100%"}
                keyboardType="numbers-and-punctuation"
              />
            )}
            name="initial_balance"
          />
          {errors.initial_balance && <Text>This is required.</Text>}
        </YStack>
        <YStack>
          <Label>Currency</Label>
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, value } }) => (
              <CurrencySelection
                native
                selectedCurrency={value}
                onCurrencyChange={(code) => {
                  onChange(
                    CURRENCY_LIST.find((currency) => currency.code === code)
                  );
                }}
              />
            )}
            name="currency"
          />
          {errors.currency && <Text>This is required.</Text>}
          <Button
            marginTop={50}
            icon={<SubmitButtonIcon state={status} />}
            onPress={handleSubmit(onSubmit)}
          >
            Add
          </Button>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const SubmitButtonIcon = ({ state }: { state: AddAccountStatusEnum }) => {
  if (state === AddAccountStatusEnum.SUBMITTING) return <Spinner />;
  if (state === AddAccountStatusEnum.SUBMITTED) return <Check />;
  return undefined;
};

function CurrencySelection(props: CurrencySelectionProps) {
  const { selectedCurrency, onCurrencyChange } = props;
  const [searchValue, setSearchValue] = useState<string>();
  // const [canDismiss, setCanDismiss] = useState<boolean>(true);

  const regex = new RegExp(`\\b${searchValue}`, "i");

  const filteredCurrencyList = CURRENCY_LIST.filter((currency) => {
    if (!searchValue) return true;

    if (
      regex.test(currency.name) ||
      regex.test(currency.symbol) ||
      regex.test(currency.code) ||
      regex.test(currency.symbol_native)
    ) {
      return true;
    }

    return false;
  });

  const handleSearchValue = (text: string) => {
    setSearchValue(text);
  };

  const displaySelectedCurrency = selectedCurrency
    ? `${selectedCurrency?.emoji}  ${selectedCurrency?.code} - ${selectedCurrency?.name}`
    : "";

  return (
    <Select onValueChange={onCurrencyChange} size={"$4"} {...props}>
      <Select.Trigger width={"100%"} iconAfter={ChevronDown}>
        <Select.Value>{displaySelectedCurrency}</Select.Value>
      </Select.Trigger>

      <Adapt when={true} platform="touch">
        <Sheet
          native={!!props.native}
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
          <Select.Group padding={10} paddingBottom={30}>
            <Select.Label borderRadius={13}>Currency</Select.Label>
            <Input
              onChangeText={handleSearchValue}
              placeholder="Search currency"
              marginVertical={10}
            />
            <FlatList
              data={filteredCurrencyList}
              initialNumToRender={20}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: currency, index: i }) => (
                <Select.Item
                  index={i}
                  key={currency.code}
                  value={currency.code}
                >
                  <Select.ItemText size={"$5"}>
                    <Text fontSize={"$7"}>{currency.emoji}</Text>
                    {"  "}
                    <Text fontSize={"$4"}>{currency.code}</Text>
                    <Text fontSize={"$4"} color={"$color10"}>
                      {" "}
                      - {currency.name}
                    </Text>
                  </Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              )}
            />
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
}
