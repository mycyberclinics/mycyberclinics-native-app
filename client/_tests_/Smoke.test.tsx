import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

it('renders text', () => {
  const { getByText } = render(<Text>Hello</Text>);
  expect(getByText('Hello')).toBeTruthy();
});
