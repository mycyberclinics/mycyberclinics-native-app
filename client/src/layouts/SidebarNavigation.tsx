import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SidebarNavigation = () => (
  <View style={styles.sidebar}>
    <Text style={styles.item}>Workspace</Text>
    <Text style={styles.item}>Orders</Text>
    {/* Add more sidebar items */}
  </View>
);

const styles = StyleSheet.create({
  sidebar: { width: 100, backgroundColor: '#333', padding: 10 },
  item: { color: 'white', paddingVertical: 10 }
});

export default SidebarNavigation;