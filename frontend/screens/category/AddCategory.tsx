import { useState } from "react";
import { KeyboardAvoidingView } from "react-native";
import {
  Button,
  Input,
  Label,
  RadioGroup,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Check } from "@tamagui/lucide-icons";
import { useCreateCategoryMutation } from "hooks/category/useCreateCategoryMutation";
import { AddCategoryProps, AddCategoryStatusEnum } from "types/category";
import { TransactionTypeEum } from "types/transaction";

export default function AddCategory() {
  const [status, setStatus] = useState<AddCategoryStatusEnum>(
    AddCategoryStatusEnum.OFF
  );
  const { mutateAsync } = useCreateCategoryMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddCategoryProps>();

  const handleStatus = (state: AddCategoryStatusEnum) => {
    setStatus(state);
  };

  const SubmitButtonIcon = ({ state }: { state: AddCategoryStatusEnum }) => {
    if (state === AddCategoryStatusEnum.SUBMITTING) return <Spinner />;
    if (state === AddCategoryStatusEnum.SUBMITTED) return <Check />;
    return undefined;
  };

  const onSubmit: SubmitHandler<AddCategoryProps> = async (data) => {
    handleStatus(AddCategoryStatusEnum.SUBMITTING);

    await mutateAsync({
      name: data.name,
      entry_type: data.transactionType,
      user_id: 1,
    });

    handleStatus(AddCategoryStatusEnum.SUBMITTED);

    reset();

    setTimeout(() => {
      handleStatus(AddCategoryStatusEnum.OFF);
    }, 6000);
  };

  return (
    <KeyboardAvoidingView>
      <YStack padding={30}>
        <Label>Name</Label>
        <Controller
          control={control}
          rules={{
            required: true,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Category name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              minWidth={"100%"}
            />
          )}
          name="name"
        />
        {errors.name && <Text>This is required.</Text>}
        <Label>Type</Label>
        <Controller
          control={control}
          rules={{
            required: true,
          }}
          defaultValue={TransactionTypeEum.EXPENSES}
          render={({ field: { onChange, onBlur, ref } }) => (
            <RadioGroup
              defaultValue={TransactionTypeEum.EXPENSES}
              ref={ref}
              aria-labelledby="Select one item"
              name="type"
              onValueChange={onChange}
            >
              <XStack alignItems="center" gap={"$3"}>
                <RadioGroup.Item value={TransactionTypeEum.EXPENSES}>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>

                <Label>Expense</Label>
              </XStack>
              <XStack alignItems="center" gap={"$3"}>
                <RadioGroup.Item
                  onBlur={onBlur}
                  value={TransactionTypeEum.INCOME}
                >
                  <RadioGroup.Indicator />
                </RadioGroup.Item>

                <Label>Income</Label>
              </XStack>
            </RadioGroup>
          )}
          name="transactionType"
        />
        <Button
          marginTop={50}
          icon={<SubmitButtonIcon state={status} />}
          onPress={handleSubmit(onSubmit)}
        >
          Add
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}
