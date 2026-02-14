// import { LocationSearchBar } from "@/components/LocationSearchBar";
// import { Trip, TripCard } from "@/components/TripCard";
// import { BottomSheet, Button } from "@/components/ui";
// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";
// import React, { useRef, useState } from "react";
// import {
//   Animated,
//   FlatList,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// // Mock trip data
// const MOCK_TRIPS: Trip[] = [
//   {
//     id: "1",
//     from: "San Francisco, CA",
//     to: "Los Angeles, CA",
//     startDate: "2026-02-15T09:00:00",
//     endDate: "2026-02-17T18:00:00",
//     createdAt: "2026-01-19T10:30:00",
//   },
//   {
//     id: "2",
//     from: "New York, NY",
//     to: "Boston, MA",
//     startDate: "2026-03-01T08:00:00",
//     endDate: "2026-03-03T20:00:00",
//     createdAt: "2026-01-18T14:20:00",
//   },
//   {
//     id: "3",
//     from: "Seattle, WA",
//     to: "Portland, OR",
//     startDate: "2026-02-20T10:00:00",
//     endDate: "2026-02-22T16:00:00",
//     createdAt: "2026-01-17T09:15:00",
//   },
//   {
//     id: "4",
//     from: "Chicago, IL",
//     to: "Detroit, MI",
//     startDate: "2026-03-10T07:00:00",
//     endDate: "2026-03-12T19:00:00",
//     createdAt: "2026-01-16T16:45:00",
//   },
//   {
//     id: "5",
//     from: "Miami, FL",
//     to: "Orlando, FL",
//     startDate: "2026-02-25T11:00:00",
//     endDate: "2026-02-27T17:00:00",
//     createdAt: "2026-01-15T11:00:00",
//   },
// ];

// const HEADER_HEIGHT = 180;

// export default function HomeScreen() {
//   const colorScheme = useColorScheme();
//   const colors = Colors[colorScheme ?? "light"];
  
//   const [fromLocation, setFromLocation] = useState("");
//   const [toLocation, setToLocation] = useState("");
  
//   const scrollY = useRef(new Animated.Value(0)).current;
//   const lastScrollY = useRef(0);
//   const scrollDirection = useRef<"up" | "down">("down");
//   const headerTranslateY = useRef(new Animated.Value(0)).current;

//   const handleScroll = Animated.event(
//     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//     {
//       useNativeDriver: false,
//       listener: (event: any) => {
//         const currentScrollY = event.nativeEvent.contentOffset.y;
//         const diff = currentScrollY - lastScrollY.current;

//         // Determine scroll direction
//         if (diff > 0 && scrollDirection.current !== "up") {
//           // Scrolling up - hide header
//           scrollDirection.current = "up";
//           Animated.timing(headerTranslateY, {
//             toValue: -HEADER_HEIGHT,
//             duration: 200,
//             useNativeDriver: true,
//           }).start();
//         } else if (diff < 0 && scrollDirection.current !== "down") {
//           // Scrolling down - show header
//           scrollDirection.current = "down";
//           Animated.timing(headerTranslateY, {
//             toValue: 0,
//             duration: 200,
//             useNativeDriver: true,
//           }).start();
//         }

//         lastScrollY.current = currentScrollY;
//       },
//     }
//   );

//   const renderHeader = () => (
//     <View style={styles.listHeader}>
//       <Text style={[styles.title, { color: colors.text }]}>
//         Your Trips
//       </Text>
//       <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
//         {MOCK_TRIPS.length} trips planned
//       </Text>
//     </View>
//   );

//   const renderItem = ({ item }: { item: Trip }) => (
//     <TripCard trip={item} />
//   );

//   const renderEmpty = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
//         No trips found
//       </Text>
//       <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
//         Start planning your next adventure!
//       </Text>
//     </View>
//   );

//   const [isOpen, setIsOpen] = useState(false);
//   return (
//     <View style={[styles.container, { backgroundColor: colors.background }]}>
//       {/* Animated Header with Search Bars */}
//       <Animated.View
//         style={[
//           styles.header,
//           {
//             backgroundColor: colors.background,
//             transform: [{ translateY: headerTranslateY }],
//           },
//         ]}
//       >
//         <View style={styles.headerContent}>
//           <Text style={[styles.headerTitle, { color: colors.text }]}>
//             Find Your Ride
//           </Text>
//           <LocationSearchBar
//             placeholder="From location"
//             value={fromLocation}
//             onChangeText={setFromLocation}
//             style={styles.searchBar}
//           />
//           <LocationSearchBar
//             placeholder="To location"
//             value={toLocation}
//             onChangeText={setToLocation}
//             style={styles.searchBar}
//           />
//         </View>
//         <Button textStyle={{color: 'red'}} title="Open Sheet" onPress={() => setIsOpen(true)} />
//       </Animated.View>
//       {/* Trip List */}
//       <FlatList
//         data={MOCK_TRIPS}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmpty}
//         contentContainerStyle={[
//           styles.listContent,
//           { paddingTop: HEADER_HEIGHT + 20 },
//         ]}
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//         showsVerticalScrollIndicator={false}
//       />
//       <View>
      
//       <BottomSheet
//         visible={isOpen}
//         onClose={() => setIsOpen(false)}
//         snapPoints={["25%", "50%", "90%"]}
//       >
//         <View style={{ padding: 20 }}>
//           <Text>Bottom Sheet Content</Text>
//           <Button title="Close" onPress={() => setIsOpen(false)} />
//         </View>
//       </BottomSheet>
//     </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     paddingTop: 60,
//     paddingBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   headerContent: {
//     paddingHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   searchBar: {
//     marginBottom: 12,
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   listHeader: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//   },
// });


//////=================================================================================

import { LocationSearchBar } from "@/components/LocationSearchBar";
import { PublicProfileScreen } from "@/components/profile/publicProfile";
import { Trip, TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui";
import { BottomSheetRef, withBottomSheet } from "@/components/ui/BottomSheet2";
import { Colors } from "@/constants/theme";
import { MOCK_USER } from "@/dummy-data/journeys";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View
} from "react-native";

// Mock trip data
const MOCK_TRIPS: Trip[] = [
  {
    id: "1",
    from: "San Francisco, CA",
    to: "Los Angeles, CA",
    startDate: "2026-02-15T09:00:00",
    endDate: "2026-02-17T18:00:00",
    createdAt: "2026-01-19T10:30:00",
  },
  {
    id: "2",
    from: "New York, NY",
    to: "Boston, MA",
    startDate: "2026-03-01T08:00:00",
    endDate: "2026-03-03T20:00:00",
    createdAt: "2026-01-18T14:20:00",
  },
  {
    id: "3",
    from: "Seattle, WA",
    to: "Portland, OR",
    startDate: "2026-02-20T10:00:00",
    endDate: "2026-02-22T16:00:00",
    createdAt: "2026-01-17T09:15:00",
  },
  {
    id: "4",
    from: "Chicago, IL",
    to: "Detroit, MI",
    startDate: "2026-03-10T07:00:00",
    endDate: "2026-03-12T19:00:00",
    createdAt: "2026-01-16T16:45:00",
  },
  {
    id: "5",
    from: "Miami, FL",
    to: "Orlando, FL",
    startDate: "2026-02-25T11:00:00",
    endDate: "2026-02-27T17:00:00",
    createdAt: "2026-01-15T11:00:00",
  },
];

const HEADER_HEIGHT = 180;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Use native driver for smooth scroll performance
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Clamp the scroll value to header height range for smooth hiding
  const clampedScrollY = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  
  // Map scroll position to header translation
  // 0 offset = 0 translation (visible)
  // HEADER_HEIGHT offset = -HEADER_HEIGHT translation (hidden)
  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  // Fade out shadow/border as it hides
  const headerShadowOpacity = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0.1, 0],
    extrapolate: 'clamp',
  });

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.title, { color: colors.text }]}>
        Your Trips
      </Text>
      <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
        {MOCK_TRIPS.length} trips planned
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Trip }) => (
    <TripCard trip={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
        No trips found
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
        Start planning your next adventure!
      </Text>
    </View>
  );


  const TripFilters = ({ onApply }: { onApply: () => void }) => (
  <View style={{ padding: 20 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
      Filter Trips
    </Text>
    {/* Your filter UI */}
    <Button title="Apply Filters" onPress={onApply} />
  </View>
);

// Create the sheet component
const FilterSheet = withBottomSheet(TripFilters, {
  snapPoints: ["10%",'25%', '50%', "75%"],
  enableBackdrop: true,
  onDismiss: () => console.log('Sheet dismissed'),
});


const sheetRef = useRef<BottomSheetRef>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header with Search Bars */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: headerTranslateY }],
            borderBottomColor: colors.border || '#E5E5E5',
            shadowOpacity: headerShadowOpacity,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Find Your Ride
          </Text>
          <LocationSearchBar
            placeholder="From location"
            value={fromLocation}
            onChangeText={setFromLocation}
            style={styles.searchBar}
          />
          <LocationSearchBar
            placeholder="To location"
            value={toLocation}
            onChangeText={setToLocation}
            style={styles.searchBar}
          />
        </View>
        <Button 
          textStyle={{ color: 'red' }} 
          title="Open Sheet" 
          onPress={() => setIsOpen(true)} 
        />
      </Animated.View>

      {/* Trip List */}
      <Animated.FlatList
        data={MOCK_TRIPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          // Maintain space for the header so first item isn't covered initially
          { paddingTop: HEADER_HEIGHT + 20 },
        ]}
        // Use native driver for smooth 60fps scrolling
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      
      {/* <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={["10%", "25%", "50%", "75%", "90%"]} 
      >
        <View style={{ padding: 20 }}>
          <Text>Bottom Sheet Content</Text>
          <Button title="Close" onPress={() => setIsOpen(false)} />
        </View>
      </BottomSheet> */}
      <PublicProfileScreen isOpen={isOpen} setIsOpen={val => setIsOpen(val)} user={MOCK_USER} onNavigate={() => {}} />

      {/* <Button 
        title="Open Filters" 
        onPress={() => sheetRef.current?.present()} 
      />
      
      <FilterSheet 
        ref={sheetRef} 
        onApply={() => {
          console.log('Applying filters');
          sheetRef.current?.dismiss();
        }} 
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: HEADER_HEIGHT + 60, // Add safe area/status bar height
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // Use shadow only on iOS, elevation on Android
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 4,
    // Ensure content doesn't bleed through
    opacity: 1,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40, // Extra padding for bottom sheet
  },
  listHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8, // Add slight breathing room after header
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});


//////=================================================================================


// import { TripCard } from "@/components/explore/TripCard";
// import { JOURNEYS } from "@/dummy-data/journeys";
// import { FlashList, ListRenderItem } from "@shopify/flash-list";
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import {
//   Dimensions,
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from 'react-native';
// import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
// import Animated, {
//   Extrapolation,
//   interpolate,
//   runOnJS,
//   useAnimatedScrollHandler,
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming
// } from 'react-native-reanimated';
// // import Svg, { Path } from 'react-native-svg';

// const { width, height } = Dimensions.get('window');

// // --- Types ---
// interface Journey {
//   id: string;
//   title: string;
//   isFeatured?: boolean;
//   createdDate: string;
//   from: string;
//   to: string;
//   startDate: string;
//   endDate: string;
//   duration: string;
//   description?: string;
// }

// // --- Constants ---
// const HEADER_MAX_HEIGHT = 340;
// const HEADER_MIN_HEIGHT = 100;
// const SCROLL_THRESHOLD = 80;
// const DRAG_TRIGGER = 15;

// export default function SearchScreen() {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const scrollY = useSharedValue(0);
//   const startY = useSharedValue(0);
//   const listRef = useRef<React.ElementRef<typeof FlashList<Journey>>>(null);
//   const isExpandedShared = useSharedValue(true);

//   // Sync shared value with state
//   useEffect(() => {
//     isExpandedShared.value = isExpanded;
//   }, [isExpanded]);

//   // --- Gesture Handler ---
//   const panGesture = Gesture.Pan()
//     .onStart(() => {
//       startY.value = scrollY.value;
//     })
//     .onUpdate((event) => {
//       if (event.translationY > DRAG_TRIGGER && scrollY.value <= 10 && !isExpandedShared.value) {
//         runOnJS(setIsExpanded)(true);
//       }
//     });

//   // --- Scroll Handler ---
//   const scrollHandler = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       scrollY.value = event.contentOffset.y;
      
//       // Debounce the state update slightly to prevent rapid toggling
//       if (event.contentOffset.y > SCROLL_THRESHOLD && isExpandedShared.value) {
//         runOnJS(setIsExpanded)(false);
//       } else if (event.contentOffset.y <= 0 && !isExpandedShared.value) {
//         runOnJS(setIsExpanded)(true);
//       }
//     },
//   });

//   // --- Animated Styles ---

//   const headerHeightStyle = useAnimatedStyle(() => {
//     const targetHeight = isExpandedShared.value ? HEADER_MAX_HEIGHT : HEADER_MIN_HEIGHT;
//     return {
//       height: withSpring(targetHeight, { damping: 20, stiffness: 200 }),
//     };
//   });

//   const headerContentStyle = useAnimatedStyle(() => {
//     const opacity = interpolate(
//       scrollY.value,
//       [0, 50, 100],
//       [1, 0.5, 0],
//       Extrapolation.CLAMP
//     );
//     const translateY = interpolate(
//       scrollY.value,
//       [0, 100],
//       [0, -20],
//       Extrapolation.CLAMP
//     );
//     const scale = interpolate(
//       scrollY.value,
//       [0, 100],
//       [1, 0.95],
//       Extrapolation.CLAMP
//     );

//     return {
//       opacity: isExpandedShared.value ? opacity : 0,
//       transform: [
//         { translateY: isExpandedShared.value ? translateY : 0 },
//         { scale: isExpandedShared.value ? scale : 0.9 }
//       ],
//     };
//   });

//   const collapsedHeaderStyle = useAnimatedStyle(() => {
//     const opacity = withTiming(isExpandedShared.value ? 0 : 1, { duration: 300 });
//     const translateY = withTiming(isExpandedShared.value ? -20 : 0, { duration: 300 });
    
//     return {
//       opacity,
//       transform: [{ translateY }],
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       justifyContent: 'center',
//       alignItems: 'center',
//       pointerEvents: isExpandedShared.value ? 'none' : 'auto',
//     };
//   });

//   const dragHandleStyle = useAnimatedStyle(() => {
//     return {
//       opacity: withTiming(isExpandedShared.value ? 0 : 1, { duration: 200 }),
//       transform: [{ translateY: withTiming(isExpandedShared.value ? 10 : 0, { duration: 200 }) }],
//     };
//   });

//   // --- Render ---
//   const renderItem: ListRenderItem<Journey> = useCallback(({ item, index }) => (
//     <TripCard item={item} index={index} />
//   ), []);

//   const keyExtractor = useCallback((item: Journey) => item.id, []);

//   const toggleExpand = () => {
//     const newState = !isExpanded;
//     setIsExpanded(newState);
//     if (newState) {
//       listRef.current?.scrollToOffset({ offset: 0, animated: true });
//     }
//   };

//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" />
        
//         {/* Header */}
//         <Animated.View style={[styles.header, headerHeightStyle]}>
//           {/* Background blur effect simulation */}
//           <View style={StyleSheet.absoluteFill} />
          
//           {/* Expanded Content */}
//           <Animated.View style={[styles.headerContent, headerContentStyle]}>
//             {/* Nav Row */}
//             <View style={styles.navRow}>
//               <TouchableOpacity style={styles.iconBtn}>
//                 {/* <Icon name="arrowBack" size={24} color="#0f172a" /> */}
//               </TouchableOpacity>
//               <Text style={styles.pageTitle}>Search Journeys</Text>
//               <TouchableOpacity style={styles.iconBtn}>
//                 {/* <Icon name="tune" size={24} color="#0f172a" /> */}
//               </TouchableOpacity>
//             </View>

//             {/* Search Inputs */}
//             <View style={styles.inputsContainer}>
//               <View style={styles.inputContainer}>
//                 {/* <Icon name="navigation" size={18} color="#94a3b8" /> */}
//                 <TextInput 
//                   style={styles.input} 
//                   value="San Francisco" 
//                   placeholder="From"
//                   placeholderTextColor="#94a3b8"
//                 />
//                 <Text style={styles.inputLabel}>From</Text>
//               </View>

//               <View style={styles.swapButtonContainer}>
//                 <TouchableOpacity style={styles.swapButton}>
//                   {/* <Icon name="swapVert" size={16} color="#64748b" /> */}
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.inputContainer}>
//                 {/* <Icon name="location" size={20} color="#94a3b8" /> */}
//                 <TextInput 
//                   style={styles.input} 
//                   value="Los Angeles" 
//                   placeholder="To"
//                   placeholderTextColor="#94a3b8"
//                 />
//                 <Text style={styles.inputLabel}>To</Text>
//               </View>

//               <View style={styles.dateRow}>
//                 <View style={[styles.dateInput, { flex: 1 }]}>
//                   <View>
//                     <Text style={styles.dateLabel}>Departure</Text>
//                     <Text style={styles.dateValue}>Oct 20, 2024</Text>
//                   </View>
//                   {/* <Icon name="calendar" size={18} color="#cbd5e1" /> */}
//                 </View>
//                 <View style={[styles.dateInput, { flex: 1 }]}>
//                   <View>
//                     <Text style={styles.dateLabel}>Return</Text>
//                     <Text style={styles.dateValue}>Oct 25, 2024</Text>
//                   </View>
//                   {/* <Icon name="calendar" size={18} color="#cbd5e1" /> */}
//                 </View>
//               </View>

//               {/* Date Pills */}
//               <View style={styles.pillsContainer}>
//                 <TouchableOpacity style={[styles.pillButton, styles.pillActive]}>
//                   {/* <Icon name="calendar" size={14} color="#fff" /> */}
//                   <Text style={[styles.pillButtonText, { color: '#fff' }]}>Anytime</Text>
//                 </TouchableOpacity>
//                 {['Oct 20', 'Oct 21', 'Oct 22', 'Oct 23'].map((date) => (
//                   <TouchableOpacity key={date} style={styles.pillButton}>
//                     <Text style={styles.pillButtonText}>{date}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//           </Animated.View>

//           {/* Collapsed Header Content */}
//           <Animated.View style={collapsedHeaderStyle}>
//             <View style={styles.collapsedNavRow}>
//               <TouchableOpacity style={styles.iconBtn}>
//                 {/* <Icon name="arrowBack" size={24} color="#0f172a" /> */}
//               </TouchableOpacity>
              
//               <View style={{ alignItems: 'center' }}>
//                 <Text style={styles.collapsedMainTitle}>SF to LA</Text>
//                 <Text style={styles.collapsedSubTitle}>Oct 20 - Oct 25</Text>
//               </View>

//               <TouchableOpacity style={styles.iconBtn}>
//                 {/* <Icon name="tune" size={24} color="#0f172a" /> */}
//               </TouchableOpacity>
//             </View>

//             {/* Drag Handle */}
//             <GestureDetector gesture={panGesture}>
//               <Animated.View style={[styles.dragHandleContainer, dragHandleStyle]}>
//                 <TouchableOpacity 
//                   activeOpacity={0.8} 
//                   onPress={toggleExpand}
//                   style={styles.dragHandleTouchable}
//                 >
//                   <View style={styles.dragBar} />
//                   {/* <Icon name="expandMore" size={16} color="#94a3b8" /> */}
//                 </TouchableOpacity>
//               </Animated.View>
//             </GestureDetector>
//           </Animated.View>
//         </Animated.View>

//         {/* List */}
//         <View style={styles.listContainer}>
//           <FlashList
//             ref={listRef}
//             data={JOURNEYS}
//             keyExtractor={keyExtractor}
//             renderItem={renderItem}
//             // estimatedItemSize={180}
//             contentContainerStyle={{ 
//               paddingHorizontal: 16, 
//               paddingTop: HEADER_MAX_HEIGHT + 20, 
//               paddingBottom: 100 
//             }}
//             showsVerticalScrollIndicator={false}
//             onScroll={scrollHandler}
//             scrollEventThrottle={16}
//             // Add pull to refresh capability for drag-down
//             onScrollEndDrag={(e) => {
//               if (e.nativeEvent.contentOffset.y < -50 && !isExpanded) {
//                 setIsExpanded(true);
//               }
//             }}
//           />
//         </View>
//       </SafeAreaView>
//     </GestureHandlerRootView>
//   );
// }

// // --- Styles ---
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: '#f8f9fa',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e2e8f0',
//     overflow: 'hidden',
//   },
//   headerContent: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'ios' ? 8 : 12,
//   },
//   navRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   collapsedNavRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'ios' ? 8 : 12,
//     flex: 1,
//   },
//   iconBtn: {
//     padding: 4,
//     zIndex: 20,
//   },
//   pageTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   inputsContainer: {
//     gap: 8,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 52,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     gap: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#0f172a',
//   },
//   inputLabel: {
//     position: 'absolute',
//     right: 12,
//     top: 8,
//     fontSize: 9,
//     fontWeight: '800',
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//   },
//   swapButtonContainer: {
//     position: 'absolute',
//     right: 24,
//     top: 46,
//     zIndex: 10,
//   },
//   swapButton: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     padding: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   dateRow: {
//     flexDirection: 'row',
//     gap: 8,
//     marginTop: 4,
//   },
//   dateInput: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 52,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   dateLabel: {
//     fontSize: 9,
//     fontWeight: '800',
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//     marginBottom: 2,
//   },
//   dateValue: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   pillsContainer: {
//     flexDirection: 'row',
//     marginTop: 12,
//     gap: 8,
//   },
//   pillButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   pillActive: {
//     backgroundColor: '#000',
//     borderColor: '#000',
//   },
//   pillButtonText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#475569',
//   },
//   collapsedMainTitle: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   collapsedSubTitle: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#64748b',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     marginTop: 2,
//   },
//   dragHandleContainer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   dragHandleTouchable: {
//     alignItems: 'center',
//     paddingVertical: 6,
//     width: 100,
//   },
//   dragBar: {
//     width: 36,
//     height: 4,
//     backgroundColor: '#cbd5e1',
//     borderRadius: 2,
//     marginBottom: 2,
//   },
  
//   // List
//   listContainer: {
//     flex: 1,
//   },
// });



//================= = == == == = = == = = = = = == =

// import { TripCard } from '@/components/explore/TripCard';
// import { DATE_OPTIONS, JOURNEYS } from '@/dummy-data/journeys';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Animated,
//   Dimensions,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View
// } from 'react-native';

// const { width } = Dimensions.get('window');

// const App: React.FC = () => {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const scrollY = useRef(new Animated.Value(0)).current;
//   const expansionAnim = useRef(new Animated.Value(1)).current; // 1 = Expanded, 0 = Collapsed

//   useEffect(() => {
//     Animated.spring(expansionAnim, {
//       toValue: isExpanded ? 1 : 0,
//       useNativeDriver: false, // Height and padding don't support native driver
//       friction: 8,
//       tension: 40,
//     }).start();
//   }, [isExpanded]);

//   const handleScroll = Animated.event(
//     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//     {
//       useNativeDriver: false,
//       listener: (event: any) => {
//         const offsetY = event.nativeEvent.contentOffset.y;
//         if (offsetY > 40 && isExpanded) {
//           setIsExpanded(false);
//         } else if (offsetY < 10 && !isExpanded) {
//           setIsExpanded(true);
//         }
//       },
//     }
//   );

//   const toggleHeader = () => setIsExpanded(!isExpanded);

//   // Animated styles
//   const headerHeight = expansionAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [70, 320],
//   });

//   const contentOpacity = expansionAnim.interpolate({
//     inputRange: [0.3, 1],
//     outputRange: [0, 1],
//   });

//   const summaryOpacity = expansionAnim.interpolate({
//     inputRange: [0, 0.7],
//     outputRange: [1, 0],
//   });

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       <Animated.View style={[styles.header, { height: headerHeight }]}>
//         <View style={styles.topBar}>
//           <TouchableOpacity style={styles.roundButton}>
//             <Text style={styles.buttonText}>IC</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             onPress={toggleHeader} 
//             activeOpacity={1}
//             style={styles.headerTitleContainer}
//           >
//             <Animated.View style={[styles.titleAbsolute, { opacity: summaryOpacity }]}>
//               <Text style={styles.collapsedTitle}>SF to LA</Text>
//               <Text style={styles.collapsedSub}>Oct 20 - Oct 25</Text>
//             </Animated.View>
            
//             <Animated.View style={{ opacity: contentOpacity }}>
//               <Text style={styles.expandedTitle}>Search Journeys</Text>
//             </Animated.View>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.roundButton}>
//             <Text style={styles.buttonText}>IC</Text>
//           </TouchableOpacity>
//         </View>

//         <Animated.View style={[styles.expandedContent, { opacity: contentOpacity }]}>
//           <View style={styles.inputGroup}>
//             <View style={styles.inputWrapper}>
//               <Text style={styles.inputLabel}>FROM</Text>
//               <View style={styles.inputInner}>
//                 <Text style={styles.inputIcon}>IC</Text>
//                 <TextInput 
//                   style={styles.textInput} 
//                   placeholder="San Francisco" 
//                   placeholderTextColor="#94a3b8"
//                 />
//               </View>
//             </View>

//             <View style={styles.swapButtonWrapper}>
//               <TouchableOpacity style={styles.swapButton}>
//                 <Text style={styles.swapIcon}>IC</Text>
//               </TouchableOpacity>
//             </View>

//             <View style={styles.inputWrapper}>
//               <Text style={styles.inputLabel}>TO</Text>
//               <View style={styles.inputInner}>
//                 <Text style={styles.inputIcon}>IC</Text>
//                 <TextInput 
//                   style={styles.textInput} 
//                   placeholder="Los Angeles" 
//                   placeholderTextColor="#94a3b8"
//                 />
//               </View>
//             </View>
//           </View>

//           <View style={styles.dateRow}>
//             <TouchableOpacity style={styles.dateInput}>
//               <Text style={styles.labelMicro}>DEPARTURE</Text>
//               <View style={styles.dateValueRow}>
//                 <Text style={styles.dateValue}>Oct 20, 2024</Text>
//                 <Text style={styles.inputIconSmall}>IC</Text>
//               </View>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.dateInput}>
//               <Text style={styles.labelMicro}>RETURN</Text>
//               <View style={styles.dateValueRow}>
//                 <Text style={styles.dateValue}>Oct 25, 2024</Text>
//                 <Text style={styles.inputIconSmall}>IC</Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>

//         <View style={styles.pillsContainer}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
//             {DATE_OPTIONS.map((opt) => (
//               <TouchableOpacity 
//                 key={opt.id} 
//                 style={[styles.pill, opt.isActive && styles.pillActive]}
//               >
//                 {opt.id === '1' && <Text style={[styles.pillText, opt.isActive && styles.pillTextActive, {marginRight: 4}]}>IC</Text>}
//                 <Text style={[styles.pillText, opt.isActive && styles.pillTextActive]}>{opt.label}</Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         <TouchableOpacity onPress={toggleHeader} style={styles.handleArea}>
//           <View style={styles.handle} />
//           <Animated.Text style={[styles.chevron, { transform: [{ rotate: expansionAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg', '180deg'] }) }] }]}>IC</Animated.Text>
//         </TouchableOpacity>
//       </Animated.View>

//       <ScrollView 
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//         style={styles.scrollBody}
//         contentContainerStyle={styles.scrollContent}
//       >
//         <View style={styles.listHeader}>
//           <Text style={styles.sectionTitle}>Available Journeys</Text>
//           <View style={styles.resultsBadge}>
//             <Text style={styles.resultsText}>{JOURNEYS.length} RESULTS</Text>
//           </View>
//         </View>

//         {JOURNEYS.map((journey) => (
//           <TripCard key={journey.id} journey={journey} />
//         ))}
        
//         <View style={{ height: 100 }} />
//       </ScrollView>

//       {/* <View style={styles.navBar}>
//         <NavItem label="Explore" icon="IC" />
//         <NavItem label="Search" icon="IC" active />
//         <NavItem label="Saved" icon="IC" />
//         <NavItem label="Profile" icon="IC" />
//       </View> */}
//     </SafeAreaView>
//   );
// };

// const NavItem: React.FC<{ label: string, icon: string, active?: boolean }> = ({ label, icon, active }) => (
//   <TouchableOpacity style={styles.navItem}>
//     <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
//     <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   header: {
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e2e8f0',
//     zIndex: 100,
//     overflow: 'hidden',
//   },
//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     height: 60,
//   },
//   roundButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f1f5f9',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonText: {
//     fontWeight: '800',
//     color: '#1e293b',
//   },
//   headerTitleContainer: {
//     flex: 1,
//     alignItems: 'center',
//     height: 40,
//     justifyContent: 'center',
//   },
//   titleAbsolute: {
//     position: 'absolute',
//     alignItems: 'center',
//   },
//   collapsedTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   collapsedSub: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//   },
//   expandedTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   expandedContent: {
//     paddingHorizontal: 16,
//     marginTop: 12,
//   },
//   inputGroup: {
//     gap: 8,
//     position: 'relative',
//   },
//   inputWrapper: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     padding: 12,
//   },
//   inputLabel: {
//     fontSize: 8,
//     fontWeight: '800',
//     color: '#94a3b8',
//     marginBottom: 4,
//   },
//   inputInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   inputIcon: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#cbd5e1',
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0f172a',
//     padding: 0,
//     outlineStyle: 'none',
//   } as any,
//   swapButtonWrapper: {
//     position: 'absolute',
//     right: 20,
//     top: '50%',
//     marginTop: -20,
//     zIndex: 10,
//   },
//   swapButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   swapIcon: {
//     fontSize: 10,
//     fontWeight: 'bold',
//     color: '#64748b',
//   },
//   dateRow: {
//     flexDirection: 'row',
//     gap: 8,
//     marginTop: 12,
//   },
//   dateInput: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     padding: 12,
//   },
//   dateValueRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   dateValue: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   inputIconSmall: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: '#cbd5e1',
//   },
//   labelMicro: {
//     fontSize: 8,
//     fontWeight: '800',
//     color: '#94a3b8',
//     letterSpacing: 1,
//   },
//   pillsContainer: {
//     marginTop: 16,
//     paddingBottom: 4,
//   },
//   pillsScroll: {
//     paddingHorizontal: 16,
//     gap: 8,
//   },
//   pill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   pillActive: {
//     backgroundColor: '#000',
//     borderColor: '#000',
//   },
//   pillText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#475569',
//   },
//   pillTextActive: {
//     color: '#fff',
//   },
//   handleArea: {
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   handle: {
//     width: 40,
//     height: 4,
//     backgroundColor: '#e2e8f0',
//     borderRadius: 2,
//     marginBottom: 2,
//   },
//   chevron: {
//     fontSize: 10,
//     fontWeight: '900',
//     color: '#cbd5e1',
//   },
//   scrollBody: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 16,
//     paddingTop: 12,
//   },
//   listHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//     marginTop: 8,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   resultsBadge: {
//     backgroundColor: '#f1f5f9',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   resultsText: {
//     fontSize: 9,
//     fontWeight: '800',
//     color: '#64748b',
//   },
//   navBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 80,
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     borderTopWidth: 1,
//     borderTopColor: '#f1f5f9',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingTop: 12,
//     paddingHorizontal: 20,
//     maxWidth: 600,
//     alignSelf: 'center',
//     width: '100%',
//   },
//   navItem: {
//     alignItems: 'center',
//     gap: 4,
//   },
//   navIcon: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#cbd5e1',
//   },
//   navLabel: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#cbd5e1',
//   },
//   navActive: {
//     color: '#000',
//   },
// });

// export default App;
