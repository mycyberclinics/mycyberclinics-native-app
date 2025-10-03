import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import Homepage from "../pages/Homepage";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";

export type RootStackParamList = {
  Homepage: undefined;
  Dashboard: undefined;
  NotFound: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const Navigation: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Homepage">
      <Stack.Screen name="Homepage" component={Homepage} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="NotFound" component={NotFound} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default Navigation;