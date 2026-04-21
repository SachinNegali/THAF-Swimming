import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { type Question, QUESTIONS } from './helpers';

const QuestionItem = memo(({ question }: { question: Question }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');
  const surfaceLight = useThemeColor({}, 'surfaceLight');

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <View style={[styles.initialsBadge, { backgroundColor: surfaceLight }]}>
          <Text style={{ color: mutedColor, fontSize: 10, fontWeight: '700' }}>{question.initials}</Text>
        </View>
        <View style={styles.questionContent}>
          <Text style={[styles.questionText, { color: textColor }]}>{question.question}</Text>
          <Text style={[styles.questionMeta, { color: mutedColor }]}>
            {question.author} • {question.time}
          </Text>
        </View>
      </View>
      <View style={[styles.answerContainer, { borderColor: surfaceLight }]}>
        <Text style={[styles.answerText, { color: textColor }]}>
          <Text style={{ fontWeight: '700' }}>{question.answer.author}:</Text> {question.answer.text}
        </Text>
      </View>
    </View>
  );
});

export const QuestionsSection = memo(() => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>QUESTIONS & DISCUSSION</Text>
      {QUESTIONS.map((q) => (
        <QuestionItem key={q.id} question={q} />
      ))}
      <TouchableOpacity style={[styles.askButton, { borderColor }]}>
        <Text style={[styles.askButtonText, { color: mutedColor }]}>Ask a Question</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  questionContainer: {
    marginBottom: SPACING.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  initialsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  questionMeta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  answerContainer: {
    marginLeft: 32,
    marginTop: SPACING.sm,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  askButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
