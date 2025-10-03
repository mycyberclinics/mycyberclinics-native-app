/* eslint-env jest */

import React from 'react';
import { render } from '@testing-library/react-native';
import Notifications from '../components/Notifications';

test('renders notifications badge', () => {
  const { getByText } = render(<Notifications />);
  expect(getByText('3')).toBeTruthy();
});