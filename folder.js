import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import moment from 'moment';
import * as Utils from './utils';

const Folder = props => {
  const date = moment(props.data.modifiedTime);
  return (
    <TouchableOpacity style={styles.container} onPress={() => { props.onPress(props.data.id)}} onLongPress={props.onPressMenu} delayLongPress={200}>
      <View style={styles.flexContainer}>
        <Utils.Icon mimeType={props.data.mimeType} size={24} />
        <View style={styles.flex}>
          <Text style={styles.name}>{props.data.name}</Text>
          <Text style={styles.info}>{props.data.elements.length} { props.data.elements.length == 1 ? 'element' : 'elements' }</Text>
          <Text style={styles.info}>Modified {date.format(date.year() === moment().year() ? 'MMM D' : 'MMM D, YYYY')}</Text>
        </View>
        <View style={styles.menuButton}>
          <Utils.MenuIcon size={16} onPress={props.onPressMenu}/>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 8
  },
  container: {
    width: Dimensions.get("window").width - 16,
    height: 64,
    margin: 8,
    marginBottom: 0,
  },
  info: {
    color: '#777', 
    fontSize: 12,
  },
  name: {
    fontSize: 16
  },
  icon: {
    paddingHorizontal: 8,
  },
  menuButton: {
    flex: 0,
    alignItems: "flex-end"
  }
})

export default Folder;
