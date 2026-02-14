// import { Journey } from "@/types/trips";
// import React, { memo } from "react";
// import {
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
//     ViewStyle
// } from 'react-native';
// import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

// export const TripCard = memo(({ item, index }: { item: Journey; index: number }) => {
//   const featured = index === 0;

//   // Custom entry animation using reanimated
//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       opacity: withTiming(1, { duration: 400 }),
//       transform: [{ translateY: withTiming(0, { duration: 400 }) }],
//     };
//   });

//   const initialStyle: ViewStyle = {
//     opacity: 0,
//     transform: [{ translateY: 20 }],
//   };

//   if (featured) {
//     return (
//       <Animated.View 
//         style={[styles.featuredCard, styles.shadow, initialStyle, animatedStyle]}
//       >
//         <View style={styles.featuredHeader}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.featuredTitle}>{item.title}</Text>
//             <View style={styles.badgeContainer}>
//               <Text style={styles.badgeText}>Recommended Route</Text>
//             </View>
//           </View>
//           <View style={{ alignItems: 'flex-end' }}>
//             <Text style={styles.labelText}>Created</Text>
//             <Text style={styles.valueText}>{item.createdDate}</Text>
//           </View>
//         </View>

//         <View style={styles.featuredRouteContainer}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.labelText}>Departure</Text>
//             <Text style={styles.timeText}>{item.startDate}</Text>
//             <Text style={styles.locationText}>{item.from}</Text>
//           </View>
//           <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
//             {/* <Icon name="trendingFlat" size={20} color="#cbd5e1" /> */}
//             <Text style={styles.durationText}>{item.duration}</Text>
//           </View>
//           <View style={{ flex: 1, alignItems: 'flex-end' }}>
//             <Text style={styles.labelText}>Arrival</Text>
//             <Text style={styles.timeText}>{item.endDate}</Text>
//             <Text style={styles.locationText}>{item.to}</Text>
//           </View>
//         </View>

//         <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

//         <View style={styles.featuredActions}>
//           <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
//             <Text style={styles.primaryButtonText}>View Details</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.iconButton}>
//             {/* <Icon name="bookmark" size={20} color="#64748b" /> */}
//           </TouchableOpacity>
//         </View>
//       </Animated.View>
//     );
//   }

//   return (
//     <Animated.View style={[styles.card, styles.shadow, initialStyle, animatedStyle]}>
//       <View style={styles.cardHeader}>
//         <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
//         <Text style={styles.labelText}>{item.createdDate}</Text>
//       </View>
      
//       <View style={styles.cardRoute}>
//         <View style={styles.pill}>
//           <Text style={styles.pillText}>{item.from}</Text>
//         </View>
//         {/* <Icon name="trendingFlat" size={16} color="#94a3b8" /> */}
//         <View style={styles.pill}>
//           <Text style={styles.pillText}>{item.to}</Text>
//         </View>
//       </View>

//       <View style={styles.cardFooter}>
//         <View style={{ flexDirection: 'row', gap: 20 }}>
//           <View>
//             <Text style={styles.labelText}>Starts</Text>
//             <Text style={styles.valueText}>{item.startDate}</Text>
//           </View>
//           <View>
//             <Text style={styles.labelText}>Ends</Text>
//             <Text style={styles.valueText}>{item.endDate}</Text>
//           </View>
//         </View>
//         {/* <Icon name="chevronRight" size={20} color="#cbd5e1" /> */}
//         <Text>IC</Text>
//       </View>
//     </Animated.View>
//   );
// });


// const styles = StyleSheet.create({
//   // Cards
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   featuredCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 16,
//     borderWidth: 2,
//     borderColor: '#0f172a',
//   },
//   shadow: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0f172a',
//     flex: 1,
//     marginRight: 10,
//   },
//   cardRoute: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//     gap: 8,
//   },
//   pill: {
//     backgroundColor: '#f1f5f9',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   pillText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#475569',
//   },
//   cardFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-end',
//   },
  
//   // Featured
//   featuredHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   featuredTitle: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#0f172a',
//     marginBottom: 4,
//   },
//   badgeContainer: {
//     backgroundColor: '#eff6ff',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 9,
//     fontWeight: '800',
//     color: '#2563eb',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   featuredRouteContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: '#f1f5f9',
//     marginBottom: 16,
//   },
//   labelText: {
//     fontSize: 9,
//     fontWeight: '800',
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//     marginBottom: 4,
//     letterSpacing: 0.5,
//   },
//   valueText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   timeText: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   locationText: {
//     fontSize: 12,
//     color: '#64748b',
//     marginTop: 2,
//   },
//   durationText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#94a3b8',
//     marginTop: 2,
//   },
//   description: {
//     fontSize: 13,
//     color: '#475569',
//     lineHeight: 18,
//     marginBottom: 16,
//   },
//   featuredActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   primaryButton: {
//     flex: 1,
//     backgroundColor: '#000',
//     height: 48,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   primaryButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   iconButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });







import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Journey } from '../types';

// interface TripCardProps {
//   journey: Journey;
// }

// export const TripCard: React.FC<TripCardProps> = ({ journey }) => {
    export const TripCard = ({ journey }) => {
        
  if (journey?.featured) {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.featuredTitle}>{journey?.title}</Text>
            {journey?.isRecommended && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>RECOMMENDED ROUTE</Text>
              </View>
            )}
          </View>
          <View style={styles.dateLabel}>
            <Text style={styles.labelSmall}>CREATED</Text>
            <Text style={styles.boldText}>{journey?.createdDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tripRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelSmall}>DEPARTURE</Text>
            <Text style={styles.timeText}>{journey?.departure.dateTime}</Text>
            <Text style={styles.locationText}>{journey?.departure.location}</Text>
          </View>
          <View style={styles.iconColumn}>
            <Text style={styles.iconText}>IC</Text>
            <Text style={styles.durationText}>{journey?.duration}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.labelSmall}>ARRIVAL</Text>
            <Text style={styles.timeText}>{journey?.arrival.dateTime}</Text>
            <Text style={styles.locationText}>{journey?.arrival.location}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {journey?.description && (
          <Text style={styles.description}>{journey?.description}</Text>
        )}

        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity style={styles.primaryButton} onPress={() => router.navigate('/profile')}> */}
            {/* <TouchableOpacity style={styles.primaryButton} onPress={() => router.navigate('/editProfile')}> */}
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.navigate('/settingsScreen')}>
            
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>IC</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{journey?.title}</Text>
        <Text style={styles.labelSmall}>{journey?.createdDate}</Text>
      </View>

      <View style={styles.codeRow}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{journey?.departure.code}</Text>
        </View>
        <Text style={styles.iconTextSmall}>IC</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{journey?.arrival.code}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.dateGroup}>
          <View>
            <Text style={styles.labelMicro}>STARTS</Text>
            <Text style={styles.boldTextSmall}>{journey?.departure.dateTime.split(',')[0]}</Text>
          </View>
          <View style={{ marginLeft: 24 }}>
            <Text style={styles.labelMicro}>ENDS</Text>
            <Text style={styles.boldTextSmall}>{journey?.arrival.dateTime.split(',')[0]}</Text>
          </View>
        </View>
        <Text style={styles.iconTextSmall}>IC</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featuredTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: 1,
  },
  dateLabel: {
    alignItems: 'flex-end',
  },
  labelSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  labelMicro: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  boldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  boldTextSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconColumn: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  iconTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateGroup: {
    flexDirection: 'row',
  },
});
