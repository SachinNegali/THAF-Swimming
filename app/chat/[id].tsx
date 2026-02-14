// import { MessageBubble } from "@/components/MessageBubble";
// import { MessageInput } from "@/components/MessageInput";
// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";
// import { Chat, Message } from "@/types/chatTypes";
// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useCallback, useState } from "react";
// import {
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// // Mock messages data
// const MOCK_MESSAGES: Message[] = [
//   {
//     id: "1",
//     type: "text",
//     content: "Hey! Are you still going to LA this weekend?",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//     senderId: "user1",
//     senderName: "John Doe",
//     isCurrentUser: false,
//   },
//   {
//     id: "2",
//     type: "text",
//     content: "Yes! Planning to leave Friday evening",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
//     senderId: "currentUser",
//     senderName: "You",
//     isCurrentUser: true,
//   },
//   {
//     id: "3",
//     type: "text",
//     content: "Perfect! I can give you a ride if you want",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
//     senderId: "user1",
//     senderName: "John Doe",
//     isCurrentUser: false,
//   },
//   {
//     id: "4",
//     type: "image",
//     content: "Check out this route!",
//     imageUrl: "https://picsum.photos/400/300",
//     timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
//     senderId: "user1",
//     senderName: "John Doe",
//     isCurrentUser: false,
//   },
//   {
//     id: "5",
//     type: "text",
//     content: "That looks great! What time should we meet?",
//     timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//     senderId: "currentUser",
//     senderName: "You",
//     isCurrentUser: true,
//   },
//   {
//     id: "6",
//     type: "link",
//     content: "https://maps.google.com/directions",
//     timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
//     senderId: "user1",
//     senderName: "John Doe",
//     isCurrentUser: false,
//     linkPreview: {
//       title: "Route to Los Angeles",
//       description: "Fastest route via I-5 S, approximately 6 hours",
//       imageUrl: "https://picsum.photos/400/200",
//     },
//   },
//   {
//     id: "7",
//     type: "text",
//     content: "Sounds good! See you Friday at 5 PM",
//     timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
//     senderId: "currentUser",
//     senderName: "You",
//     isCurrentUser: true,
//   },
// ];

// export default function ChatConversationScreen() {
//   const colorScheme = useColorScheme();
//   const colors = Colors[colorScheme ?? "light"];
//   const router = useRouter();
  
//   // Get params and parse them
//   const params = useLocalSearchParams<{
//     id: string;
//     name: string;
//     isGroup: string;
//     avatar?: string;
//     isOnline?: string;
//     participants?: string;
//   }>();

//   // Reconstruct chat object from params
//   const chat: Partial<Chat> = {
//     id: params.id,
//     name: params.name,
//     isGroup: params.isGroup === "true",
//     avatar: params.avatar,
//     isOnline: params.isOnline === "true",
//     participants: params.participants ? JSON.parse(params.participants) : undefined,
//   };
  
//   const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

//   const handleSendMessage = useCallback((content: string) => {
//     const newMessage: Message = {
//       id: Date.now().toString(),
//       type: "text",
//       content,
//       timestamp: new Date().toISOString(),
//       senderId: "currentUser",
//       senderName: "You",
//       isCurrentUser: true,
//     };
//     setMessages((prev) => [...prev, newMessage]);
//   }, []);

//   const renderMessage = useCallback(
//     ({ item }: { item: Message }) => <MessageBubble message={item} />,
//     []
//   );

//   const keyExtractor = useCallback((item: Message) => item.id, []);

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background }]}>
//       {/* Header */}
//       <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.tabIconDefault + "30" }]}>
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="chevron-back" size={28} color={colors.text} />
//         </Pressable>
//         <View style={styles.headerInfo}>
//           <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
//             {chat.name || "Chat"}
//           </Text>
//           <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
//             {chat.isGroup ? "Tap for group info" : chat.isOnline ? "Online" : "Offline"}
//           </Text>
//         </View>
//         <Pressable onPress={() => router.push("/groupInfo")} style={styles.backButton}>
//           <Ionicons name="chevron-back" size={28} color={colors.text} />
//         </Pressable>
//         <Pressable style={styles.headerAction}>
//           <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
//         </Pressable>
//       </View>

//       {/* Messages List - Inverted for chat behavior */}
//       <FlatList
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={keyExtractor}
//         inverted
//         contentContainerStyle={styles.messagesList}
//         showsVerticalScrollIndicator={false}
//         // Optimization props for SSE updates
//         removeClippedSubviews={true}
//         maxToRenderPerBatch={10}
//         updateCellsBatchingPeriod={50}
//         initialNumToRender={15}
//         windowSize={10}
//       />

//       {/* Message Input */}
//       <MessageInput onSend={handleSendMessage} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: 60,
//     paddingBottom: 12,
//     paddingHorizontal: 8,
//     borderBottomWidth: 1,
//     gap: 8,
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerInfo: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   headerSubtitle: {
//     fontSize: 12,
//   },
//   headerAction: {
//     padding: 4,
//   },
//   messagesList: {
//     paddingVertical: 8,
//   },
// });





import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { Colors, SPACING } from '../../constants/theme'; // Adjust path to your theme file

// --- Types ---

type MessageType = 'text' | 'image' | 'expense';

interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
}

interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
  status?: 'sent' | 'read';
}

interface ImageMessage extends BaseMessage {
  type: 'image';
  imageUrl: string;
  caption?: string;
}

interface ExpenseMessage extends BaseMessage {
  type: 'expense';
  amount: number;
  category: string;
  description: string;
}

type ChatItem = TextMessage | ImageMessage | ExpenseMessage;

interface Section {
  title: string; // Date string e.g., "July 11"
  data: ChatItem[];
}

// Flattened list item type for FlashList
type ListItem = 
  | { type: 'header'; title: string; id: string }
  | (ChatItem & { type: MessageType });

// --- Mock Data ---

const MOCK_SECTIONS: Section[] = [
  {
    title: 'July 11',
    data: [
      {
        id: '1',
        type: 'text',
        timestamp: '09:30 AM',
        senderId: 'u1',
        senderName: 'Alice',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=alice',
        content: 'Just landed in Rome! The airport is chaos ✈️',
      },
      {
        id: '2',
        type: 'text',
        timestamp: '09:45 AM',
        senderId: 'u2',
        senderName: 'Bob',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=bob',
        content: 'Got the rental car. Ready to roll! 🏎️',
      },
      {
        id: '3',
        type: 'image',
        timestamp: '09:46 AM',
        senderId: 'u2',
        senderName: 'Bob',
        isMe: false,
        senderAvatar: 'https://i.pravatar.cc/150?u=bob',
        imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    title: 'July 12',
    data: [
      {
        id: '4',
        type: 'expense',
        timestamp: '10:15 AM',
        senderId: 'u3',
        senderName: 'John',
        isMe: false,
        amount: 45.00,
        category: 'Fuel',
        description: 'Gas for the rental',
      },
      {
        id: '5',
        type: 'text',
        timestamp: '10:42 AM',
        senderId: 'me',
        senderName: 'Me',
        isMe: true,
        content: "Awesome, I'll pay for the lunch today.",
        status: 'read',
      },
    ],
  },
];

// --- Helper Functions ---

// Flatten sections into a single array for FlashList
function flattenSections(sections: Section[]): ListItem[] {
  const flattened: ListItem[] = [];
  sections.forEach((section) => {
    // Add section header
    flattened.push({ type: 'header', title: section.title, id: `header-${section.title}` });
    // Add all items in this section
    flattened.push(...section.data);
  });
  return flattened;
}

// --- Helper Hook for Theme Colors ---

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

// --- Optimized Components ---

// 1. Date Header
const DateHeader = memo(({ title }: { title: string }) => {
  const bgColor = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'textDim');

  return (
    <View style={styles.dateHeaderContainer}>
      <View style={[styles.dateBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.dateText, { color: textColor }]}>
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

// 2. Chat Bubble (Left/Right)
const ChatBubble = memo(({ item }: { item: TextMessage | ImageMessage }) => {
  const backgroundColor = useThemeColor({ light: '#f1f5f9', dark: '#2d3e5a' }, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const secondaryTextColor = useThemeColor({}, 'textMuted');

  if (item.isMe) {
    return (
      <View style={styles.myMessageContainer}>
        <View style={[styles.myBubble, { backgroundColor: primaryColor }]}>
          {item.type === 'image' ? (
             <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
          ) : (
            <Text style={[styles.myBubbleText, { color: '#fff' }]}>
              {item.content}
            </Text>
          )}
        </View>
        {'status' in item && (
          <Text style={[styles.statusText, { color: secondaryTextColor }]}>
            Read {item.timestamp}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.theirMessageContainer}>
      <Image source={{ uri: item.senderAvatar }} style={styles.avatar} />
      <View style={styles.theirContent}>
        <Text style={[styles.senderName, { color: secondaryTextColor }]}>
          {item.senderName}
        </Text>
        <View style={[styles.theirBubble, { backgroundColor }]}>
           {item.type === 'image' ? (
             <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
          ) : (
            <Text style={[styles.theirBubbleText, { color: textColor }]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

// 3. Smart Expense Card
const ExpenseCard = memo(({ item }: { item: ExpenseMessage }) => {
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({ light: 'rgba(43, 108, 238, 0.05)', dark: 'rgba(43, 108, 238, 0.15)' }, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={[styles.expenseContainer, { backgroundColor: surfaceColor, borderColor: `${primaryColor}20` }]}>
      <View style={[styles.expenseIcon, { backgroundColor: primaryColor }]}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>⛽</Text>
      </View>
      <View style={styles.expenseContent}>
        <Text style={[styles.expenseTitle, { color: textColor }]}>
          {item.senderName} added <Text style={{ color: primaryColor, fontWeight: '700' }}>${item.amount.toFixed(2)}</Text> for {item.category}
        </Text>
        <Text style={[styles.expenseSub, { color: mutedColor }]}>
          Trip Expense • {item.timestamp}
        </Text>
      </View>
      <Text style={{ color: mutedColor }}>›</Text>
    </View>
  );
});

// 4. Smart Expense Popup (Floating above input)
const SmartExpensePopup = memo(({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  const bgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const surfaceLight = useThemeColor({}, 'surfaceLight');

  const categories = ['Lunch', 'Fuel', 'Hotel', 'Tickets', 'Others'];

  return (
    <View style={[styles.popupContainer, { backgroundColor: bgColor, borderColor, shadowColor: textColor }]}>
      <View style={styles.popupHeader}>
        <View style={[styles.popupIconBg, { backgroundColor: `${primaryColor}20` }]}>
          <Text style={{ color: primaryColor }}>💰</Text>
        </View>
        <Text style={[styles.popupTitle, { color: textColor }]}>Smart Expense Detected</Text>
        <TouchableOpacity style={[styles.popupButton, { backgroundColor: primaryColor }]}>
          <Text style={styles.popupButtonText}>Mark as Expense</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {categories.map((cat, idx) => (
          <TouchableOpacity 
            key={cat} 
            style={[
              styles.chip, 
              { backgroundColor: idx === 0 ? `${primaryColor}20` : surfaceLight },
              idx === 0 && { borderColor: `${primaryColor}40`, borderWidth: 1 }
            ]}
          >
            <Text style={[
              styles.chipText, 
              { color: idx === 0 ? primaryColor : textColor }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// 5. Input Area
const ChatInput = memo(() => {
  const [text, setText] = useState('Lunch was 120');
  const [showSmartPopup, setShowSmartPopup] = useState(true);

  const bgColor = useThemeColor({}, 'background');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: useThemeColor({}, 'border') }]}>
      <SmartExpensePopup visible={showSmartPopup} />
      
      <View style={styles.inputRow}>
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
      
      {/* iOS Home Indicator spacer */}
      <View style={styles.homeIndicator} />
    </View>
  );
});

// --- Main Screen ---

export default function GroupChatScreen() {
  const headerBg = useThemeColor({ light: 'rgba(255,255,255,0.8)', dark: 'rgba(16, 22, 34, 0.8)' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'textMuted');

  // Flatten sections for FlashList
  const flattenedData = flattenSections(MOCK_SECTIONS);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    // Handle section headers
    if ('title' in item && item.type === 'header') {
      return <DateHeader title={item.title} />;
    }
    
    // Handle chat items
    if (item.type === 'expense') return <ExpenseCard item={item as ExpenseMessage} />;
    return <ChatBubble item={item as TextMessage | ImageMessage} />;
  }, []);


  console.log("this...", flattenedData)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: useThemeColor({}, 'background') }}>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderColor: useThemeColor({}, 'border') }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <Text style={{ fontSize: 20, color: textColor }}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Euro Trip 2024</Text>
            <Text style={[styles.headerSubtitle, { color: mutedColor }]}>Alice, Bob, John, Sarah</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.balanceLabel, { color: mutedColor }]}>GROUP BALANCE</Text>
          <Text style={[styles.balanceAmount, { color: primaryColor }]}>$1,240.00</Text>
        </View>
      </View>

      {/* Chat List */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlashList
          data={flattenedData}
          renderItem={renderItem}
          keyExtractor={(item) => {
            if ('title' in item && item.type === 'header') {
              return item.id;
            }
            return item.id;
          }}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
        />

        {/* Input Area */}
        <ChatInput />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    // backdropFilter is web only, using opacity/bg color trick in component
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerInfo: {
    marginLeft: SPACING.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Date Header
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dateBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Messages
  theirMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  theirContent: {
    gap: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  theirBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  theirBubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  chatImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginVertical: 4,
  },
  
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  myBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  myBubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
    marginRight: 4,
  },

  // Expense
  expenseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseSub: {
    fontSize: 12,
  },

  // Input
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  inputRow: {
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
    backgroundColor: Colors.light.border, // Static gray is usually fine here
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },

  // Popup
  popupContainer: {
    position: 'absolute',
    bottom: '100%',
    left: SPACING.md,
    right: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  popupIconBg: {
    padding: 6,
    borderRadius: 8,
  },
  popupTitle: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '700',
  },
  popupButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  popupButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});