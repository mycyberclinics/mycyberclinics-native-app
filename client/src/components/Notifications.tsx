import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Notifications: React.FC = () => {
  const [show, setShow] = useState(false);
  const unreadCount = 3; // Replace with Redux or API

  return (
    <View style={styles.notifications}>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.iconBtn}>
        <MaterialIcons name="notifications" size={28} color="#2d8cf0" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            <Text style={styles.dropdownInfo}>No new notifications.</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShow(false)}>
              <MaterialIcons name="close" size={24} color="#2d8cf0" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  notifications: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  iconBtn: { padding: 8 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#4DBA87',
    borderRadius: 9,
    minWidth: 18,
    minHeight: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  dropdown: {
    marginTop: 70,
    marginRight: 24,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    minWidth: 200,
    elevation: 7,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownTitle: { fontWeight: '700', fontSize: 16, marginBottom: 10, color: '#2d8cf0' },
  dropdownInfo: { color: '#888', fontSize: 14, marginBottom: 12 },
  closeBtn: { position: 'absolute', top: 6, right: 6 },
});

export default Notifications;