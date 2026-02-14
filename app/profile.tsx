import { ScreenHeader } from '@/components/ScreenHeader'
import { ThemedText } from '@/components/themed-text'
import { Button } from '@/components/ui'
import React from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Profile = () => {
  return (
    <SafeAreaView style={{flex: 1, alignItems: 'center',padding: 20, backgroundColor: "#fff", gap: 0}}>

        <ScreenHeader title='Profile' onBack={() => {}}/>
      <Image style={{height: 100, width: 100, borderRadius: 50, borderWidth: 4, borderColor: "#c1c1c1"}} source={{uri: "https://picsum.photos/200/300/?blur"}}/>
      <ThemedText style={{fontSize: 20, fontWeight: "bold", marginTop: 16}} darkColor="#000">Something Name</ThemedText>
      <ThemedText style={{fontSize: 14, fontWeight: "600"}} darkColor="#000">Joined On: {"Jan 2025"}</ThemedText>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, rowGap: 16, columnGap: 12, justifyContent: 'space-between'}}>
        <Pressable style={{backgroundColor: "#c1c1c1", padding: 10, borderRadius: 10, width: '48%', justifyContent: 'center', alignItems: 'center'}}>
          <ThemedText>Total Trips</ThemedText>
          <ThemedText>12</ThemedText>
        </Pressable>
        <Pressable style={{backgroundColor: "#c1c1c1", padding: 10, borderRadius: 10, width: '48%', justifyContent: 'center', alignItems: 'center'}}>
          <ThemedText>Total Trips</ThemedText>
          <ThemedText>12</ThemedText>
        </Pressable>
        <Pressable style={{backgroundColor: "#c1c1c1", padding: 10, borderRadius: 10, width: '48%', justifyContent: 'center', alignItems: 'center'}}>
          <ThemedText>Total Trips</ThemedText>
          <ThemedText>12</ThemedText>
        </Pressable>
        <Pressable style={{backgroundColor: "#c1c1c1", padding: 10, borderRadius: 10, width: '48%', justifyContent: 'center', alignItems: 'center'}}>
          <ThemedText>Total Trips</ThemedText>
          <ThemedText>12</ThemedText>
        </Pressable>
      </View>

    <View style={{marginTop: 20, flexDirection: 'row', justifyContent: 'space-between'}}>
        <ThemedText darkColor='#000'>My Trips</ThemedText>
        <ThemedText darkColor='#000'>See All</ThemedText>
    </View>
      <View style={{marginTop: 20, flexDirection: 'row', padding: 4, backgroundColor: '#c1c1c1', borderRadius: 10}}>
        <Button loading={false} onPress={() => {}} title='Upcoming' textStyle={{color: '#000'}} style={{width: '50%'}}/>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', width: '50%'}}>
            <ThemedText>Upcoming</ThemedText>
        </View>
        {/* <Button loading={false} onPress={() => {}} title='Past' style={{flex: 1}}/> */}
      </View>
    </SafeAreaView>
  )
}

export default Profile

const styles = StyleSheet.create({})