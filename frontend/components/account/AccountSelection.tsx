import { Check, Wallet2 } from "@tamagui/lucide-icons";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { Select, Adapt, Sheet, View } from "tamagui";
import { AccountSelectionProps } from "types/account";

const AccountSelectionRoot = ({ children }: { children: JSX.Element }) => (
  <View>{children}</View>
);

function AccountSelectionSheet(props: AccountSelectionProps) {
  const { selectedAccount, accountData, getSelectedAccount } = props;

  return (
    <Select
      value={selectedAccount?.name}
      onValueChange={getSelectedAccount}
      disablePreventBodyScroll
      size={"$4"}
      {...props}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Select.Trigger
          maxWidth={50}
          paddingLeft={10}
          paddingRight={10}
          chromeless
          borderRadius={40}
          backgroundColor={"$color4"}
        >
          <Select.Value>
            <Wallet2 size={"$1"} />
          </Select.Value>
        </Select.Trigger>
      </TouchableWithoutFeedback>

      <Adapt when={true} platform="touch">
        <Sheet
          native={!!props.native}
          dismissOnSnapToBottom
          snapPoints={[30]}
          snapPointsMode="percent"
          animation="fast"
          modal
          onOpenChange={() => {
            Keyboard.dismiss();
          }}
        >
          <Sheet.Overlay
            backgroundColor="$color1"
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            opacity={0.7}
            exitStyle={{ opacity: 0 }}
          />
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </Adapt>

      <Select.Content zIndex={200000}>
        <Select.Viewport
          // to do animations:
          animation="quick"
          animateOnly={["transform", "opacity"]}
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: 10 }}
          minWidth={200}
        >
          <Select.Group padding={10} paddingBottom={30}>
            <Select.Label>Default Account</Select.Label>
            {/* for longer lists memoizing these is useful */}
            {accountData?.map((item, i) => {
              return (
                <Select.Item index={i} key={item.name} value={item.name}>
                  <Select.ItemText size={"$5"}>{item.name}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              );
            })}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
}

export const AccountSelection =
  AccountSelectionRoot as typeof AccountSelectionRoot & {
    Sheet: typeof AccountSelectionSheet;
  };

AccountSelection.Sheet = AccountSelectionSheet;
