import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { MedicalDocument } from '../../types';

interface DocumentListProps {
  documents: MedicalDocument[];
}

export const DocumentList = React.memo(({ documents }: DocumentListProps) => (
  <View style={styles.card}>
    {documents.map((doc, i) => {
      const isLast = i === documents.length - 1;
      return (
        <View key={doc.label} style={[styles.row, !isLast && styles.divider]}>
          <View style={styles.body}>
            <Text style={styles.label}>{doc.label}</Text>
            <Text style={styles.detail}>{doc.detail}</Text>
          </View>
          <Text style={styles.expires}>{doc.expires}</Text>
        </View>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  detail: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: colors.n500,
    marginTop: 3,
  },
  expires: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: colors.n600,
    paddingTop: 2,
  },
});
