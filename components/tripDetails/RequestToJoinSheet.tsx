import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { IconArrowRight } from '../../icons/Icons';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { Kicker } from '../core/Kicker';
import { PrimaryButton } from '../core/form/PrimaryButton';

interface RequestToJoinSheetProps {
  visible: boolean;
  tripTitle?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (message: string) => void;
}

export const RequestToJoinSheet = React.memo(({
  visible,
  tripTitle,
  isSubmitting,
  onCancel,
  onSubmit,
}: RequestToJoinSheetProps) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) setMessage('');
  }, [visible]);

  const handleSubmit = () => {
    if (isSubmitting) return;
    onSubmit(message.trim());
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      snapPoints={['55%']}
      enablePanDownToClose={!isSubmitting}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      scrollable
    >
      <View style={styles.container}>
        <Kicker>Join request</Kicker>
        <Text style={styles.title}>
          Send a note to <Text style={styles.titleItalic}>{tripTitle ?? 'the organizer'}</Text>
        </Text>

        <Text style={styles.label}>Your message</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Why you'd like to join, gear, experience…"
          placeholderTextColor={colors.n500}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
        <Text style={styles.hint}>Optional — helps organizers approve faster.</Text>

        <View style={styles.actions}>
          <PrimaryButton
            dark={false}
            onPress={onCancel}
            style={styles.cancelBtn}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            onPress={handleSubmit}
            icon={
              isSubmitting
                ? <ActivityIndicator size="small" color={colors.white} style={{ marginLeft: 8 }} />
                : <IconArrowRight size={16} color={colors.white} />
            }
            style={styles.submitBtn}
          >
            {isSubmitting ? 'Sending…' : 'Send request'}
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.5,
    marginTop: 4,
    lineHeight: 26.4,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.n500,
  },
  input: {
    minHeight: 110,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
    padding: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.n500,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 0.4,
  },
  submitBtn: {
    flex: 1,
  },
});
