import { Colors } from "@/constants/theme";
import { useUpdateUser } from "@/hooks/api/useUser";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { selectUser } from "@/store/selectors";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const { mutate: updateUser, isPending } = useUpdateUser();

  const [fName, setFName] = useState(user?.fName ?? "");
  const [lName, setLName] = useState(user?.lName ?? "");
  const [userId, setUserId] = useState("");
  const [userIdError, setUserIdError] = useState("");

  const colors = Colors[colorScheme ?? "light"];

  function validateUserId(value: string) {
    if (!value.trim()) return "Username is required";
    if (!/^[a-z0-9_]{3,20}$/.test(value))
      return "3–20 characters: lowercase letters, numbers, underscores only";
    return "";
  }

  function handleUserIdChange(value: string) {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUserId(sanitized);
    if (userIdError) setUserIdError(validateUserId(sanitized));
  }

  function handleSave() {
    if (!fName.trim()) {
      Alert.alert("Required", "Please enter your first name.");
      return;
    }
    if (!lName.trim()) {
      Alert.alert("Required", "Please enter your last name.");
      return;
    }
    const error = validateUserId(userId);
    if (error) {
      setUserIdError(error);
      return;
    }

    updateUser(
      { fName: fName.trim(), lName: lName.trim(), userId: userId.trim() },
      {
        onSuccess: () => {
          router.replace("/(tabs)");
        },
        onError: (err: any) => {
          const message = err?.message ?? "Something went wrong.";
          if (message.toLowerCase().includes("already")) {
            setUserIdError("This username is already taken. Try another.");
          } else {
            Alert.alert("Error", message);
          }
        },
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.tint }]}>
            Almost there!
          </Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Set up your profile before you start exploring.
          </Text>
        </View>

        <View style={styles.form}>
          {/* First Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>
              First name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={fName}
              onChangeText={setFName}
              placeholder="First name"
              placeholderTextColor={colors.textDim}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Last Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>
              Last name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={lName}
              onChangeText={setLName}
              placeholder="Last name"
              placeholderTextColor={colors.textDim}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>
              Username
            </Text>
            <View
              style={[
                styles.usernameInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: userIdError ? colors.danger : colors.border,
                },
              ]}
            >
              <Text style={[styles.atSign, { color: colors.textMuted }]}>
                @
              </Text>
              <TextInput
                style={[styles.usernameInput, { color: colors.text }]}
                value={userId}
                onChangeText={handleUserIdChange}
                placeholder="your_username"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                maxLength={20}
              />
            </View>
            {userIdError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {userIdError}
              </Text>
            ) : (
              <Text style={[styles.hint, { color: colors.textDim }]}>
                3–20 characters · lowercase, numbers, underscores
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.tint },
            isPending && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get started</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 40,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  usernameInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  atSign: {
    fontSize: 16,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
