import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardHeader: React.FC = () => (
  <View style={styles.header}>
    <Text style={styles.menuItem}>CyberClinic</Text>
    {/* Add more menu items or dropdowns as needed */}
  </View>
);

const styles = StyleSheet.create({
  header: { height: 50, backgroundColor: '#4DBA87', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  menuItem: { color: 'white', fontSize: 20, marginRight: 20 }
});

export default DashboardHeader;