import { Colors, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ChatInput = memo(() => {
  const [text, setText] = useState('');

  const bgColor = useThemeColor({}, 'background');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor, borderColor: useThemeColor({}, 'border') }]}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity>
            <Text style={{ fontSize: 24, color: iconColor }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ fontSize: 24, color: iconColor }}>📎</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={[styles.input, { color: textColor }]}
            placeholder="Type a message..."
            placeholderTextColor={useThemeColor({}, 'textDim')}
          />
          <TouchableOpacity style={[styles.inputAction, { backgroundColor: `${primaryColor}20` }]}>
            <Text style={{ color: primaryColor }}>$</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.sendButton, { backgroundColor: primaryColor }]}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>↑</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.homeIndicator} /> */}
    </View>
  );
});

export default ChatInput;

const styles = StyleSheet.create({
  wrapper: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
    // paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md, and 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  inputAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicator: {
    width: 130,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
});
