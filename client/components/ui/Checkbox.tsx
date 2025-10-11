import * as React from 'react';
import * as ExpoCheckbox from 'expo-checkbox';

const CheckboxBase = ExpoCheckbox.default as unknown as React.FC<
  React.ComponentProps<typeof ExpoCheckbox.default>
>;

type CheckboxProps = React.ComponentProps<typeof CheckboxBase>;

export function Checkbox(props: CheckboxProps) {
  return <CheckboxBase {...props} />;
}
