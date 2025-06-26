/* eslint-disable react/display-name */
import { useBottomSheetInternal } from "@gorhom/bottom-sheet";

import { memo, useCallback, forwardRef, useEffect, ForwardedRef } from "react";
import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import { Input as TamaguiInput, InputProps } from "tamagui";

const BottomSheetTextInputComponent = forwardRef(
  (
    { onFocus, onBlur, ...rest }: InputProps,
    ref: ForwardedRef<TamaguiInput>
  ) => {
    //#region hooks
    const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
    //#endregion

    //#region callbacks
    const handleOnFocus = useCallback(
      (args: NativeSyntheticEvent<TextInputFocusEventData>) => {
        shouldHandleKeyboardEvents.value = true;
        if (onFocus) {
          onFocus(args);
        }
      },
      [onFocus, shouldHandleKeyboardEvents]
    );
    const handleOnBlur = useCallback(
      (args: NativeSyntheticEvent<TextInputFocusEventData>) => {
        shouldHandleKeyboardEvents.value = false;
        if (onBlur) {
          onBlur(args);
        }
      },
      [onBlur, shouldHandleKeyboardEvents]
    );
    //#endregion

    //#region effects
    useEffect(() => {
      return () => {
        // Reset the flag on unmount
        shouldHandleKeyboardEvents.value = false;
      };
    }, [shouldHandleKeyboardEvents]);
    //#endregion
    return (
      <TamaguiInput
        ref={ref}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        {...rest}
      />
    );
  }
);

const BottomSheetTextInput = memo(BottomSheetTextInputComponent);
BottomSheetTextInput.displayName = "BottomSheetTextInput";

export { BottomSheetTextInput as TamaguiBottomInput };
